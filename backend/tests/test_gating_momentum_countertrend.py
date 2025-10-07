"""
Tests for gating with momentum and counter-trend logic
"""

import pytest
from backend.core.gating import final_gate, momentum_gate, smc_gate


def test_momentum_gate_blocks_misaligned():
    """Test that momentum gate blocks trades with misaligned MACD slope"""
    # SHORT but slope >= 0 -> should block
    assert not momentum_gate(macd_hist_slope=+0.01, direction="SHORT")
    
    # LONG but slope <= 0 -> should block
    assert not momentum_gate(macd_hist_slope=-0.01, direction="LONG")


def test_momentum_gate_passes_aligned():
    """Test that momentum gate passes trades with aligned MACD slope"""
    # SHORT with negative slope -> should pass
    assert momentum_gate(macd_hist_slope=-0.01, direction="SHORT")
    
    # LONG with positive slope -> should pass
    assert momentum_gate(macd_hist_slope=+0.01, direction="LONG")


def test_smc_gate_requires_liquidity():
    """Test that SMC gate requires liquidity nearby"""
    smc_no_liq = {"SMC_ZQS": 0.7, "FVG_ATR": 0.2, "LIQ_NEAR": 0}
    th = {"ZQS_min": 0.60, "FVG_min_atr": 0.18}
    
    # Should fail due to no liquidity
    assert not smc_gate(smc_no_liq, th)
    
    # Should pass with liquidity
    smc_with_liq = {"SMC_ZQS": 0.7, "FVG_ATR": 0.2, "LIQ_NEAR": 1}
    assert smc_gate(smc_with_liq, th)


def test_smc_gate_enforces_thresholds():
    """Test that SMC gate enforces ZQS and FVG thresholds"""
    th = {"ZQS_min": 0.60, "FVG_min_atr": 0.18}
    
    # Low ZQS -> should fail
    smc_low_zqs = {"SMC_ZQS": 0.5, "FVG_ATR": 0.2, "LIQ_NEAR": 1}
    assert not smc_gate(smc_low_zqs, th)
    
    # Low FVG -> should fail
    smc_low_fvg = {"SMC_ZQS": 0.7, "FVG_ATR": 0.1, "LIQ_NEAR": 1}
    assert not smc_gate(smc_low_fvg, th)


def test_countertrend_requires_bos2():
    """Test that counter-trend trades require second BOS"""
    smc = {"SMC_ZQS": 0.7, "FVG_ATR": 0.2, "LIQ_NEAR": 1}
    th = {
        "EntryScore": 0.67,
        "ConfluenceScore": 0.57,
        "ZQS_min": 0.60,
        "FVG_min_atr": 0.18,
        "require_bos2_on_countertrend": True
    }
    
    # Counter-trend without BOS2 -> should block
    result = final_gate(
        direction="LONG",
        rsi_val=50,
        macd_hist_val=0.1,
        macd_hist_slope=+0.01,
        sentiment=0.6,
        entry_score=0.8,
        conf_score=0.7,
        smc=smc,
        thrs=th,
        countertrend=True,
        has_second_BOS=False
    )
    assert not result


def test_countertrend_passes_with_bos2():
    """Test that counter-trend trades pass with second BOS"""
    smc = {"SMC_ZQS": 0.7, "FVG_ATR": 0.2, "LIQ_NEAR": 1}
    th = {
        "EntryScore": 0.67,
        "ConfluenceScore": 0.57,
        "ZQS_min": 0.60,
        "FVG_min_atr": 0.18,
        "require_bos2_on_countertrend": True
    }
    
    # Counter-trend with BOS2 -> should pass (if other gates pass)
    result = final_gate(
        direction="LONG",
        rsi_val=50,
        macd_hist_val=0.1,
        macd_hist_slope=+0.01,
        sentiment=0.6,
        entry_score=0.8,
        conf_score=0.7,
        smc=smc,
        thrs=th,
        countertrend=True,
        has_second_BOS=True
    )
    assert result


def test_final_gate_all_checks():
    """Test that final_gate enforces all checks"""
    smc = {"SMC_ZQS": 0.7, "FVG_ATR": 0.2, "LIQ_NEAR": 1}
    th = {
        "EntryScore": 0.67,
        "ConfluenceScore": 0.57,
        "ZQS_min": 0.60,
        "FVG_min_atr": 0.18,
        "require_bos2_on_countertrend": True
    }
    
    # All gates pass
    result = final_gate(
        direction="LONG",
        rsi_val=50,
        macd_hist_val=0.1,
        macd_hist_slope=+0.01,
        sentiment=0.6,
        entry_score=0.8,
        conf_score=0.7,
        smc=smc,
        thrs=th,
        countertrend=False,
        has_second_BOS=True
    )
    assert result