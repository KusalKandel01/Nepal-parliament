import csv, json, difflib, re
import numpy as np
from scipy.optimize import linear_sum_assignment
from normalize import normalize_party, normalize_province

def load_csv(path):
    with open(path, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))

def norm_key(s):
    return re.sub(r'[\.\s\u200d\u200c]+', '', s or '').strip()

def load_extracted(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def optimal_match(csv_rows, ext_rows, name_field='name'):
    n, m = len(csv_rows), len(ext_rows)
    size = max(n, m)
    cost = np.ones((size, size))  # cost = 1 - similarity; unmatched slots cost 1
    for i, cr in enumerate(csv_rows):
        key = norm_key(cr['NepaliName'])
        for j, er in enumerate(ext_rows):
            sim = difflib.SequenceMatcher(None, key, norm_key(er.get(name_field,''))).ratio()
            cost[i, j] = 1 - sim
    row_ind, col_ind = linear_sum_assignment(cost)
    result = {}
    for i, j in zip(row_ind, col_ind):
        if i < n:
            score = 1 - cost[i, j]
            result[i] = (ext_rows[j] if j < m and score > 0.35 else None, score if j < m else 0)
    return result

hr_csv = load_csv('/mnt/user-data/uploads/hr-member.csv')
na_csv = load_csv('/mnt/user-data/uploads/na-member.csv')
hor_ext = load_extracted('hor_raw.json')
na_ext = load_extracted('na_raw.json')

hor_match = optimal_match(hr_csv, hor_ext)
na_match = optimal_match(na_csv, na_ext)

DEV_DIGIT = "०१२३४५६७८९"
def to_arabic(s):
    return ''.join(str(DEV_DIGIT.index(c)) if c in DEV_DIGIT else c for c in s)

def clean_phones(phones):
    out = []
    for p in phones or []:
        p = re.sub(r'\D','', to_arabic(p))
        if len(p) == 10:
            out.append(p)
    seen=set(); res=[]
    for p in out:
        if p not in seen:
            seen.add(p); res.append(p)
    return res

SPECIAL_ROLES_EN = {
    "Dol Prasad Aryal": "Speaker",
    "Rubi Kumari": "Deputy Speaker",
    "Narayan Prasad Dahal": "Chairperson",
    "Lila Kumari Bhandari": "Vice Chairperson",
}

members = []
idx = 1
low_conf = []
for i, r in enumerate(hr_csv):
    ext, score = hor_match.get(i, (None, 0))
    phones = clean_phones(ext.get('mobile') if ext else [])
    emails = ext.get('email') if ext else []
    party_code, party_ne = normalize_party(ext.get('party','')) if ext else ("OTH","")
    role = SPECIAL_ROLES_EN.get(r['EnglishName'])
    if 'Pushpa Kamal Dahal' in r['EnglishName'] or 'Prachanda' in r['EnglishName']:
        role = 'Prime Minister'
    rec = {
        "id": f"MP{idx:04d}", "name_ne": r['NepaliName'].strip(), "name_en": r['EnglishName'].strip(),
        "house": "HoR", "district": r['District'].strip(), "party_ne": party_ne, "party_code": party_code,
        "phones": phones, "emails": emails, "role": role, "_match_score": round(score,2),
    }
    members.append(rec)
    if score < 0.7: low_conf.append(rec)
    idx += 1

for i, r in enumerate(na_csv):
    ext, score = na_match.get(i, (None, 0))
    phones = clean_phones(ext.get('mobile') if ext else [])
    emails = ext.get('email') if ext else []
    party_code, party_ne = normalize_party(ext.get('party','')) if ext else ("OTH","")
    province = normalize_province(ext.get('province','')) if ext else None
    role = SPECIAL_ROLES_EN.get(r['EnglishName'])
    rec = {
        "id": f"MP{idx:04d}", "name_ne": r['NepaliName'].strip(), "name_en": r['EnglishName'].strip(),
        "house": "NA", "district": province or r['District'].strip(), "party_ne": party_ne, "party_code": party_code,
        "phones": phones, "emails": emails, "role": role, "_match_score": round(score,2),
    }
    members.append(rec)
    if score < 0.7: low_conf.append(rec)
    idx += 1

print(f"Total: {len(members)}  Low-confidence (<0.7): {len(low_conf)}")
for m in low_conf:
    print(' ', m['id'], m['name_ne'], '|', m['name_en'], m['_match_score'], 'phones:', m['phones'])

with open('members_merged.json','w',encoding='utf-8') as f:
    json.dump(members, f, ensure_ascii=False, indent=1)
