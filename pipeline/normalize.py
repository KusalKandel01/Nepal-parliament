import difflib, re

PARTY_MAP = {
    "राष्ट्रिय स्वतन्त्र पार्टी": "RSP",
    "नेपाली कांग्रेस": "NC",
    "नेपाल कम्युनिष्ट पार्टी (एमाले)": "UML",
    "नेपाली कम्युनिष्ट पार्टी": "MLM",
    "राष्ट्रिय प्रजातन्त्र पार्टी": "RPP",
    "श्रम संस्कृति पार्टी": "SP",
    "जनता समाजवादी पार्टी": "JSP",
    "लोकतान्त्रिक समाजवादी पार्टी": "LSP",
    "स्वतन्त्र": "IND",
    "मनोनीत": "NOM",
}
PARTY_LABELS_NE = {
    "RSP": "राष्ट्रिय स्वतन्त्र पार्टी", "NC": "नेपाली कांग्रेस",
    "UML": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "MLM": "नेपाली कम्युनिष्ट पार्टी",
    "RPP": "राष्ट्रिय प्रजातन्त्र पार्टी", "SP": "श्रम संस्कृति पार्टी",
    "JSP": "जनता समाजवादी पार्टी", "LSP": "लोकतान्त्रिक समाजवादी पार्टी",
    "IND": "स्वतन्त्र", "NOM": "मनोनीत",
}
PROVINCES = ["कोशी", "मधेश", "बागमती", "गण्डकी", "लुम्बिनी", "कर्णाली", "सुदूरपश्चिम"]

def best_match(text, choices, cutoff=0.45):
    if not text:
        return None
    m = difflib.get_close_matches(text, choices, n=1, cutoff=cutoff)
    return m[0] if m else None

def normalize_party(raw):
    if not raw:
        return "OTH", raw
    # special-case UML (contains एमाले)
    if "एमाले" in raw:
        return "UML", PARTY_LABELS_NE["UML"]
    if "मनोनीत" in raw or "मनानीत" in raw:
        return "NOM", PARTY_LABELS_NE["NOM"]
    m = best_match(raw, list(PARTY_MAP.keys()), cutoff=0.4)
    if m:
        return PARTY_MAP[m], m
    return "OTH", raw

def normalize_province(raw):
    if not raw or raw.strip() in ("-----","----","---"):
        return None
    m = best_match(raw, PROVINCES, cutoff=0.4)
    return m if m else raw
