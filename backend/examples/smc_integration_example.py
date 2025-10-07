"""
Complete SMC Integration Example
Shows how all components work together in the trading pipeline
"""

from typing import List, Dict
from backend.pipeline.smc_features import compute_smc_features
from backend.core.config import get_config, TradingConfig
from backend.core.scoring import compute_entry_score, compute_confluence_score
from backend.core.gating import final_gate
from backend.core.risk import (
    RiskPolicy, 
    position_size_with_policy, 
    is_countertrend,
    calculate_stop_loss,
    calculate_take_profit,
    calculate_risk_metrics
)


def generate_sample_candles(count: int = 100, start_price: float = 100.0) -> List[Dict]:
    """Generate sample OHLC candles for testing"""
    import random
    candles = []
    price = start_price
    
    for i in range(count):
        o = price
        volatility = random.uniform(0.5, 2.0)
        h = o + volatility
        l = o - volatility
        c = random.uniform(l, h)
        
        candles.append({
            'o': o,
            'h': h,
            'l': l,
            'c': c,
            'v': random.uniform(1000, 10000)
        })
        
        # Next candle starts near this close
        price = c * random.uniform(0.98, 1.02)
    
    return candles


def calculate_atr(candles: List[Dict], period: int = 14) -> float:
    """Simple ATR calculation"""
    if len(candles) < period:
        return 0.0
    
    trs = []
    for i in range(1, len(candles)):
        h = candles[i]['h']
        l = candles[i]['l']
        c_prev = candles[i-1]['c']
        
        tr = max(h - l, abs(h - c_prev), abs(l - c_prev))
        trs.append(tr)
    
    # Simple moving average of TR
    atr = sum(trs[-period:]) / period
    return atr


def trading_pipeline_example():
    """
    Complete trading pipeline with SMC integration
    
    Steps:
    1. Generate candle data (HTF and LTF)
    2. Compute SMC features
    3. Calculate traditional indicators (RSI, MACD, Sentiment)
    4. Compute entry and confluence scores
    5. Apply multi-layer gates
    6. Calculate position size with risk management
    7. Generate final trade signal with SL/TP
    """
    
    print("=" * 80)
    print("SMC-INTEGRATED TRADING PIPELINE EXAMPLE")
    print("=" * 80)
    
    # 1. Generate sample data
    print("\n[1] Generating sample candle data...")
    htf_candles = generate_sample_candles(count=100, start_price=50000.0)  # 15m
    ltf_candles = generate_sample_candles(count=200, start_price=50000.0)  # 1m
    
    # Calculate ATR for both timeframes
    atr_htf = calculate_atr(htf_candles)
    atr_ltf = calculate_atr(ltf_candles)
    
    print(f"   HTF candles: {len(htf_candles)}, ATR: {atr_htf:.2f}")
    print(f"   LTF candles: {len(ltf_candles)}, ATR: {atr_ltf:.2f}")
    
    # 2. Compute SMC features
    print("\n[2] Computing SMC features...")
    smc_features = compute_smc_features(htf_candles, ltf_candles, atr_htf, atr_ltf)
    
    print(f"   HTF_TREND: {smc_features['HTF_TREND']}")
    print(f"   FVG_ATR: {smc_features['FVG_ATR']}")
    print(f"   SMC_ZQS: {smc_features['SMC_ZQS']}")
    print(f"   LIQ_NEAR: {smc_features['LIQ_NEAR']}")
    
    # 3. Calculate traditional indicators (mocked for example)
    print("\n[3] Computing traditional indicators...")
    current_price = ltf_candles[-1]['c']
    
    signals = {
        "RSI": 0.55,        # Normalized 0..1 (RSI 55/100)
        "MACD": 0.6,        # Positive histogram
        "Sentiment": 0.3,   # Mildly positive (-1..1 scale, normalized)
        "SAR": 0.7,         # Bullish SAR
    }
    
    print(f"   RSI: {signals['RSI']}")
    print(f"   MACD: {signals['MACD']}")
    print(f"   Sentiment: {signals['Sentiment']}")
    print(f"   SAR: {signals['SAR']}")
    
    # 4. Load configuration
    print("\n[4] Loading configuration...")
    config = get_config()
    weights_dict = config.weights.model_dump()
    thresholds_dict = config.thresholds.model_dump()
    
    print(f"   Entry threshold: {thresholds_dict['EntryScore']}")
    print(f"   SMC ZQS weight: {weights_dict['SMC_ZQS']}")
    
    # 5. Compute scores
    print("\n[5] Computing entry and confluence scores...")
    entry_score = compute_entry_score(signals, weights_dict, smc_features)
    
    conf_score = compute_confluence_score(
        rsi=signals["RSI"] * 100,  # Convert back to 0..100
        macd_hist=signals["MACD"] - 0.5,  # Convert to signed value
        smc_zqs=smc_features["SMC_ZQS"],
        liq_near=smc_features["LIQ_NEAR"]
    )
    
    print(f"   Entry Score: {entry_score:.3f}")
    print(f"   Confluence Score: {conf_score:.3f}")
    
    # 6. Apply gates
    print("\n[6] Applying multi-layer gates...")
    direction = "LONG"  # Example trade direction
    
    gate_results = final_gate(
        rsi=signals["RSI"] * 100,
        macd_hist=signals["MACD"] - 0.5,
        sentiment=(signals["Sentiment"] - 0.5) * 2,  # Convert to -1..1
        smc=smc_features,
        direction=direction,
        entry_score=entry_score,
        conf_score=conf_score,
        thresholds=thresholds_dict
    )
    
    for gate_name, passed in gate_results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"   {gate_name:15s}: {status}")
    
    # 7. Risk management
    if gate_results["final"]:
        print("\n[7] Computing position size and risk parameters...")
        
        # Check if countertrend
        countertrend = is_countertrend(direction, smc_features["HTF_TREND"])
        
        # Create risk policy
        risk_policy = RiskPolicy(
            max_risk_per_trade=config.risk.max_risk_per_trade,
            max_position=config.risk.max_position,
            stop_loss_atr_multiple=config.risk.stop_loss_atr_multiple,
            take_profit_rr=config.risk.take_profit_rr,
            countertrend_reduction=config.risk.countertrend_reduction
        )
        
        # Calculate position size
        equity = 10000.0  # Example account equity
        atr_pct = atr_ltf / current_price
        
        position_size = position_size_with_policy(
            equity=equity,
            atr_pct=atr_pct,
            risk_policy=risk_policy,
            countertrend=countertrend,
            news_high_impact=False
        )
        
        # Calculate SL/TP
        stop_loss = calculate_stop_loss(
            current_price,
            atr_ltf,
            direction,
            risk_policy.stop_loss_atr_multiple
        )
        
        take_profit = calculate_take_profit(
            current_price,
            stop_loss,
            direction,
            risk_policy.take_profit_rr
        )
        
        # Calculate risk metrics
        risk_metrics = calculate_risk_metrics(
            equity,
            current_price,
            position_size,
            stop_loss,
            take_profit,
            direction
        )
        
        print(f"   Countertrend: {countertrend}")
        print(f"   Position Size: {position_size:.4f} ({position_size*100:.2f}% of equity)")
        print(f"   Entry Price: ${current_price:.2f}")
        print(f"   Stop Loss: ${stop_loss:.2f}")
        print(f"   Take Profit: ${take_profit:.2f}")
        print(f"   Risk Amount: ${risk_metrics['risk_amount']:.2f} ({risk_metrics['risk_pct']:.2f}%)")
        print(f"   Reward Amount: ${risk_metrics['reward_amount']:.2f}")
        print(f"   R:R Ratio: {risk_metrics['rr_ratio']:.2f}")
        
        # 8. Final decision
        print("\n[8] FINAL TRADE SIGNAL")
        print("=" * 80)
        print(f"   ACTION: {'🟢 ENTER TRADE' if gate_results['final'] else '🔴 NO TRADE'}")
        print(f"   Direction: {direction}")
        print(f"   Entry: ${current_price:.2f}")
        print(f"   Size: {position_size*100:.2f}% of equity")
        print(f"   Stop Loss: ${stop_loss:.2f} ({abs(current_price-stop_loss)/current_price*100:.2f}%)")
        print(f"   Take Profit: ${take_profit:.2f} ({abs(take_profit-current_price)/current_price*100:.2f}%)")
        print("=" * 80)
        
        # Log for monitoring
        trade_log = {
            "sym": "BTCUSDT",
            "tf": "M1",
            "scores": {
                "entry": round(entry_score, 3),
                "conf": round(conf_score, 3),
                "SMC_ZQS": smc_features["SMC_ZQS"],
                "FVG_ATR": smc_features["FVG_ATR"],
                "LIQ": smc_features["LIQ_NEAR"]
            },
            "gates": gate_results,
            "risk": {
                "atr_pct": round(atr_pct, 4),
                "size": round(position_size, 4),
                "countertrend": countertrend
            }
        }
        
        print("\n[9] Trade Log (for monitoring):")
        import json
        print(json.dumps(trade_log, indent=2))
    else:
        print("\n[7] ❌ TRADE REJECTED - Gates not passed")
        failed_gates = [k for k, v in gate_results.items() if not v and k != "final"]
        print(f"   Failed gates: {', '.join(failed_gates)}")
    
    print("\n" + "=" * 80)
    print("PIPELINE COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    trading_pipeline_example()