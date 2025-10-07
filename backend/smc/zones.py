def last_opposing_candle_before_impulse(c, i_impulse, direction):
    rng=[i for i in range(max(1,i_impulse-5), i_impulse)]
    if direction=='up':
        picks=[i for i in rng if c[i]['c']<c[i]['o']]
        if not picks: return None
        i=max(picks); return {'type':'demand','low':c[i]['l'],'high':c[i]['h'],'i':i}
    else:
        picks=[i for i in rng if c[i]['c']>c[i]['o']]
        if not picks: return None
        i=max(picks); return {'type':'supply','low':c[i]['l'],'high':c[i]['h'],'i':i}

def is_mitigated(zone, c):
    lo,hi=zone['low'],zone['high']
    for x in c[zone['i']+1:]:
        if x['l']<=hi and x['h']>=lo: return True
    return False

def zone_quality(bos_strength, fvg_size_atr, momentum_bars, mitigated=False):
    z=0.4*min(1,bos_strength)+0.3*min(1,fvg_size_atr)+0.3*min(1,momentum_bars/4)
    return z*(0.6 if mitigated else 1.0)