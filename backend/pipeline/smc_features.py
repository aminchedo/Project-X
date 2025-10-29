from typing import Dict, List
from backend.smc.structure import pivots, hh_hl_lh_ll, detect_bos_choc
from backend.smc.fvg import detect_fvg
from backend.smc.zones import last_opposing_candle_before_impulse, is_mitigated, zone_quality
from backend.smc.liquidity import equal_levels

def compute_smc_features(htf: List[Dict], ltf: List[Dict], atr_htf: float, atr_ltf: float) -> Dict[str,float|int]:
    """
    Compute SMC features from HTF and LTF candle data.
    
    Args:
        htf: Higher timeframe candles [{'o','h','l','c'}, ...]
        ltf: Lower timeframe candles [{'o','h','l','c'}, ...]
        atr_htf: ATR value for HTF
        atr_ltf: ATR value for LTF
    
    Returns:
        Dictionary with SMC features: HTF_TREND, FVG_ATR, SMC_ZQS, LIQ_NEAR
    """
    # ساختار HTF برای بایاس
    piv = pivots(htf,2,2); tags=hh_hl_lh_ll(piv,htf); events=detect_bos_choc(tags)
    htf_trend = 1 if any(e[1]=='BOS_UP' for e in events[-5:]) else -1 if any(e[1]=='BOS_DOWN' for e in events[-5:]) else 0

    # FVG LTF
    fvgs = detect_fvg(ltf, min_atr_frac=0.1, atr=atr_ltf)
    fvg_size_atr = (max((f['size'] for f in fvgs), default=0.0) / max(1e-9, atr_ltf))

    # Zone + quality (نمونه ساده: آخرین ایمپالس LTF صعودی/نزولی)
    # اینجا می‌توانی از منطق خودت برای تشخیص ایمپالس استفاده کنی؛ فعلاً heuristic:
    direction = 'up' if ltf[-1]['c']>ltf[-1]['o'] else 'down'
    ob = last_opposing_candle_before_impulse(ltf, len(ltf)-1, direction)
    mitig = is_mitigated(ob, ltf) if ob else False
    bos_strength = 1.0 if any('BOS' in e[1] for e in events[-8:]) else 0.5
    zqs = zone_quality(bos_strength, fvg_size_atr, momentum_bars=3, mitigated=mitig) if ob else 0.0

    # Liquidity clusters (بالا/پایین‌های برابر LTF نزدیک قیمت)
    eql_hi = list(equal_levels(ltf, 'high', tol_frac=0.02))
    eql_lo = list(equal_levels(ltf, 'low',  tol_frac=0.02))
    liq_near = 1 if (len(eql_hi)>=1 or len(eql_lo)>=1) else 0

    return {
        "HTF_TREND": htf_trend,            # {-1,0,1}
        "FVG_ATR": round(fvg_size_atr,3),  # 0..+
        "SMC_ZQS": round(zqs,3),           # 0..1
        "LIQ_NEAR": liq_near               # {0,1}
    }