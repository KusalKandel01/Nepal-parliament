import pdfplumber, subprocess, os, re, json, sys
from PIL import Image, ImageOps
from extract_v3 import clean_line, ocr_crop, to_arabic, SCALE, PDF

COLS = {
    'name': (72, 207),
    'mobile': (207, 301.6),
    'province': (301.6, 396),
    'party': (490.6, 639),
    'email': (639, 806),
}

def process_na_page(page_index, img_path):
    with pdfplumber.open(PDF) as pdf:
        page = pdf.pages[page_index]
        words = page.extract_words()
    sn_words = [w for w in words if 30 <= w['x0'] <= 60 and re.match(r'^\d+\.', w['text'])]
    sn_words.sort(key=lambda w: w['top'])
    tops = [w['top'] for w in sn_words]
    img = Image.open(img_path)

    phone_words = [w for w in words if COLS['mobile'][0]-10 <= w['x0'] < COLS['mobile'][1]+10 and re.match(r'^[\d०-९]{9,10}$', to_arabic(w['text']))]
    email_words = [w for w in words if COLS['email'][0]-10 <= w['x0'] < COLS['email'][1]+10 and '@' in w['text']]

    def nearest_idx(wtop):
        return min(range(len(tops)), key=lambda i: abs(tops[i]-wtop))

    phones_by_row = {i: [] for i in range(len(sn_words))}
    for w in phone_words:
        phones_by_row[nearest_idx(w['top'])].append(to_arabic(w['text']))
    emails_by_row = {i: [] for i in range(len(sn_words))}
    for w in email_words:
        emails_by_row[nearest_idx(w['top'])].append(w['text'])

    rows = []
    for i, sw in enumerate(sn_words):
        top = sw['top'] - 2
        bottom = (tops[i+1] if i+1 < len(tops) else top+32) - 2
        row = {'sn': sw['text'].rstrip('.'), 'mobile': phones_by_row[i], 'email': emails_by_row[i]}
        for col in ['name','province','party']:
            x0,x1 = COLS[col]
            box = ((x0-6)*SCALE, top*SCALE, (x1+6)*SCALE, bottom*SCALE)
            raw = ocr_crop(img, box)
            row[col] = clean_line(raw, is_name=(col=='name'))
        rows.append(row)
    return rows

if __name__ == "__main__":
    pg = int(sys.argv[1])
    rows = process_na_page(pg-1, f"hipages/pg-{pg:03d}.png")
    print(json.dumps(rows, ensure_ascii=False, indent=1))
