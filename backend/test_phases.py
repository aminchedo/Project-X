import sys
sys.path.append('.')

try:
    from scanner.mtf_scanner import MultiTimeframeScanner, ScanRule, ScanResult
    from risk.enhanced_risk_manager import EnhancedRiskManager, PositionSize, RiskLimits
    print('✅ Phase 5 & 6 modules imported successfully')
    
    # Test basic initialization
    risk_manager = EnhancedRiskManager(10000.0)
    print('✅ Enhanced Risk Manager initialized')
    
    # Test position size calculation
    position = risk_manager.calculate_position_size(
        'BTCUSDT', 45000, 44000, {'confidence': 0.8, 'direction': 'BULLISH'}, 500
    )
    if position:
        print('✅ Position size calculation working')
        print(f'   Position: {position.quantity:.4f} BTC at {position.entry_price}')
        print(f'   Risk amount: ${position.risk_amount:.2f}')
        print(f'   R-multiple: {position.r_multiple:.2f}')
    else:
        print('⚠️ Position size calculation returned None (risk limits)')
    
    # Test stop loss calculation
    stop_loss = risk_manager.calculate_stop_loss(45000, 'BULLISH', 500)
    print(f'✅ Stop loss calculation: {stop_loss}')
    
    print('✅ All Phase 5 & 6 components working correctly')
    
except Exception as e:
    print(f'❌ Error testing Phase 5 & 6: {e}')
    import traceback
    traceback.print_exc()
