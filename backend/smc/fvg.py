from typing import List, Dict

def detect_fvg(c, min_atr_frac=0.1, atr: float | None=None):
    fvgs=[]
    for i in range(1,len(c)-1):
        a,b,d=c[i-1],c[i],c[i+1]
        # Bullish: low(d) > high(a)
        if d['l']>a['h']:
            size=d['l']-a['h']
            if (atr is None) or (size>=min_atr_frac*atr):
                fvgs.append({'i':i,'type':'bull','gap':(a['h'],d['l']),'size':size})
        # Bearish: high(d) < low(a)
        if d['h']<a['l']:
            size=a['l']-d['h']
            if (atr is None) or (size>=min_atr_frac*atr):
                fvgs.append({'i':i,'type':'bear','gap':(d['h'],a['l']),'size':size})
    return fvgs