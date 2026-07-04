import pdfplumber, subprocess, os, re, json, sys
from PIL import Image, ImageOps

SCALE = 300/72.0
TESSDATA = "/home/claude/tessdata"
PDF = "/mnt/user-data/uploads/v7zxcmpyrtzsy8xs.pdf"

COLS = {
    'name': (69, 203),
    'mobile': (199, 297),
    'district': (293, 390),
    'party': (475, 625),
    'email': (621, 808),
}
DEVANAGARI_RE = re.compile(r'[\u0900-\u097F]')
DEV_DIGIT = "०१२३४५६७८९"
def to_arabic(s):
    return ''.join(str(DEV_DIGIT.index(c)) if c in DEV_DIGIT else c for c in s)

def clean_line(text, is_name=False):
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    candidates = [l for l in lines if DEVANAGARI_RE.search(l)]
    if not candidates:
        return ""
    best = max(candidates, key=len)
    if is_name:
        idx = best.find('मा')
        if idx >= 0:
            best = best[idx:]
    best = re.sub(r'^[^\u0900-\u097F]+', '', best)
    best = re.sub(r'[^\u0900-\u097F\.\-\(\)0-9०-९\s]+$', '', best)
    best = best.strip()
    toks = best.split(' ')
    if len(toks) > 1 and len(toks[0]) <= 2 and not toks[0].startswith('मा'):
        best = ' '.join(toks[1:])
    toks = best.split(' ')
    if len(toks) > 1 and len(toks[-1]) <= 1:
        best = ' '.join(toks[:-1])
    return best.strip()

def ocr_crop(img, box, psm="6"):
    crop = img.crop(box)
    if crop.width < 5 or crop.height < 5:
        return ""
    crop = crop.resize((crop.width*2, crop.height*2), Image.LANCZOS)
    crop = ImageOps.grayscale(crop); crop = ImageOps.autocontrast(crop)
    tmp = f"/tmp/_c_{os.getpid()}_{box[1]:.0f}.png"
    crop.save(tmp)
    env = dict(os.environ); env['TESSDATA_PREFIX']=TESSDATA
    out = subprocess.run(["tesseract", tmp, "stdout", "-l", "nep", "--psm", psm], capture_output=True, text=True, env=env)
    os.remove(tmp)
    return out.stdout

def process_hor_page(page_index, img_path):
    with pdfplumber.open(PDF) as pdf:
        page = pdf.pages[page_index]
        words = page.extract_words()
    sn_words = [w for w in words if 35 <= w['x0'] <= 72 and w['text'].rstrip('.').isdigit()]
    sn_words.sort(key=lambda w: w['top'])
    tops = [w['top'] for w in sn_words]
    img = Image.open(img_path)

    # nearest-label assignment for phone & email words
    phone_words = [w for w in words if COLS['mobile'][0]-10 <= w['x0'] < COLS['mobile'][1]+10 and re.match(r'^[\d०-९]{9,10}$', w['text'])]
    email_words = [w for w in words if COLS['email'][0]-10 <= w['x0'] < COLS['email'][1]+10 and '@' in w['text']]
    dist_num_words = [w for w in words if COLS['district'][0]-10 <= w['x0'] < COLS['district'][1]+10 and re.search(r'[-–][०-९0-9]+\s*$', w['text'])]

    def nearest_idx(wtop):
        return min(range(len(tops)), key=lambda i: abs(tops[i]-wtop))

    phones_by_row = {i: [] for i in range(len(sn_words))}
    for w in phone_words:
        phones_by_row[nearest_idx(w['top'])].append(to_arabic(w['text']))
    emails_by_row = {i: [] for i in range(len(sn_words))}
    for w in email_words:
        emails_by_row[nearest_idx(w['top'])].append(w['text'])
    distnum_by_row = {i: None for i in range(len(sn_words))}
    for w in dist_num_words:
        m = re.search(r'[-–]([०-९0-9]+)\s*$', w['text'])
        distnum_by_row[nearest_idx(w['top'])] = to_arabic(m.group(1))

    rows = []
    for i, sw in enumerate(sn_words):
        top = sw['top'] - 2
        bottom = (tops[i+1] if i+1 < len(tops) else top+32) - 2
        row = {'sn': sw['text'].rstrip('.'),
               'mobile': phones_by_row[i],
               'email': emails_by_row[i]}
        for col in ['name','district','party']:
            x0,x1 = COLS[col]
            box = ((x0-6)*SCALE, top*SCALE, (x1+6)*SCALE, bottom*SCALE)
            raw = ocr_crop(img, box)
            cl = clean_line(raw, is_name=(col=='name'))
            if col == 'district' and distnum_by_row[i]:
                cl = re.sub(r'[-–]\s*[०-९0-9]+\s*$', '', cl).strip()
                cl = f"{cl}-{distnum_by_row[i]}"
            row[col] = cl
        rows.append(row)
    return rows

if __name__ == "__main__":
    pg = int(sys.argv[1])
    rows = process_hor_page(pg-1, f"hipages/pg-{pg:03d}.png")
    print(json.dumps(rows, ensure_ascii=False, indent=1))
