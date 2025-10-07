def sd_flip_valid(zone, close_price, liquidity_grab: bool):
    if zone['type']=='demand':  # to supply
        return liquidity_grab and (close_price < zone['low'])
    return liquidity_grab and (close_price > zone['high'])

def equilibrium_entry(zone, spread=0.0):
    mid=(zone['low']+zone['high'])/2
    return {'side':'sell','price':mid-spread} if zone['type']=='supply' else {'side':'buy','price':mid+spread}