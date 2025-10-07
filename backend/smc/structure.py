from typing import List, Dict, Tuple

def pivots(c: List[Dict], left=2, right=2) -> List[Tuple[int,str]]:
    out=[]
    for i in range(left, len(c)-right):
        if all(c[i]['h']>c[j]['h'] for j in range(i-left,i)) and all(c[i]['h']>c[j]['h'] for j in range(i+1,i+1+right)):
            out.append((i,'H'))
        if all(c[i]['l']<c[j]['l'] for j in range(i-left,i)) and all(c[i]['l']<c[j]['l'] for j in range(i+1,i+1+right)):
            out.append((i,'L'))
    return out

def hh_hl_lh_ll(pivz, c):
    tags=[]; lastH=None; lastL=None
    for i,t in pivz:
        if t=='H':
            tag='HH' if (lastH is not None and c[i]['h']>c[lastH]['h']) else 'LH'
            lastH=i; tags.append((i,'H',tag))
        else:
            tag='HL' if (lastL is not None and c[i]['l']>c[lastL]['l']) else 'LL'
            lastL=i; tags.append((i,'L',tag))
    return tags

def detect_bos_choc(tags):
    events=[]
    for k in range(1,len(tags)):
        i,t,_=tags[k]; p_i,p_t,_=tags[k-1]
        if t=='H' and any(t0=='H' for _,t0,_ in tags[:k]): events.append((i,'BOS_UP'))
        elif t=='H': events.append((i,'CHOCH_UP'))
        if t=='L' and any(t0=='L' for _,t0,_ in tags[:k]): events.append((i,'BOS_DOWN'))
        elif t=='L': events.append((i,'CHOCH_DOWN'))
    return events