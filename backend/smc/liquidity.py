def equal_levels(c, kind='high', tol_frac=0.05):
    pts=[]; ref=None
    for i,x in enumerate(c):
        v=x['h'] if kind=='high' else x['l']
        if ref is None: ref=v; pts=[(i,v)]; continue
        if abs(v-ref)/max(1e-9,ref)<=tol_frac: pts.append((i,v))
        else:
            if len(pts)>=2: yield {'kind':kind,'points':pts,'level':sum(v for _,v in pts)/len(pts)}
            ref=v; pts=[(i,v)]
    if len(pts)>=2: yield {'kind':kind,'points':pts,'level':sum(v for _,v in pts)/len(pts)}