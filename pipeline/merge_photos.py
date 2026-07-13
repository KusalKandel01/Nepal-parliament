import json, re, difflib
import numpy as np
from scipy.optimize import linear_sum_assignment
from normalize import normalize_party

def norm_name(s):
    s = re.sub(r'^(Rt\.|Dr\.|Prof\.|Er\.)\s*', '', s, flags=re.I)
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'[^a-zA-Z]', '', s).lower()
    return s

with open('members_merged.json', encoding='utf-8') as f:
    members = json.load(f)
with open('refdata/hr_official.json', encoding='utf-8') as f:
    hr_off = json.load(f)
with open('refdata/na_official.json', encoding='utf-8') as f:
    na_off = json.load(f)

ENGLISH_PARTY_MAP = {
    "rastriyaswatantraparty": "RSP",
    "nepalicongress": "NC",
    "nepalcommunistpartyuml": "UML",
    "nepalicommunistparty": "MLM",
    "nepalcommunistparty": "MLM",
    "rastriyaprajantantraparty": "RPP",
    "shramsanskritiparty": "SP",
    "janatasamajbadipartynepal": "JSP",
    "loktantriksamajbadiparty": "LSP",
    "independent": "IND",
    "nominated": "NOM",
    "thenationalfront": "OTH",
}
def party_en_to_code(p):
    key = re.sub(r'[^a-zA-Z]','',p).lower()
    return ENGLISH_PARTY_MAP.get(key)

def merge_house(members_sub, official):
    names_m = [norm_name(m['name_en']) for m in members_sub]
    names_o = [norm_name(o['name_en']) for o in official]
    n, m = len(members_sub), len(official)
    size = max(n, m)
    cost = np.ones((size, size))
    for i, nm in enumerate(names_m):
        for j, no in enumerate(names_o):
            sim = difflib.SequenceMatcher(None, nm, no).ratio()
            cost[i, j] = 1 - sim
    row_ind, col_ind = linear_sum_assignment(cost)
    matched = 0
    for i, j in zip(row_ind, col_ind):
        if i < n and j < m:
            score = 1 - cost[i, j]
            if score > 0.6:
                members_sub[i]['photo'] = official[j]['photo']
                pc = party_en_to_code(official[j]['party_en'])
                if pc and pc not in ('OTH',) and members_sub[i]['party_code'] == 'OTH':
                    members_sub[i]['party_code'] = pc
                matched += 1
    return matched

hor_members = [m for m in members if m['house']=='HoR']
na_members = [m for m in members if m['house']=='NA']
c1 = merge_house(hor_members, hr_off)
c2 = merge_house(na_members, na_off)
print("HoR photo matches:", c1, "/", len(hor_members))
print("NA photo matches:", c2, "/", len(na_members))

all_members = hor_members + na_members
for i, m in enumerate(all_members, start=1):
    m['id'] = f"MP{i:04d}"

no_photo = [m['name_en'] for m in all_members if 'photo' not in m]
print("No photo matched:", len(no_photo))
print(no_photo[:15])

with open('members_with_photos.json','w',encoding='utf-8') as f:
    json.dump(all_members, f, ensure_ascii=False, indent=1)
