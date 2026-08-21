"""
Fetch candidate photographs from Openverse, restricted to CC0 / public-domain
marked works so they can be used commercially without attribution obligations.

Usage:  python fetch-images.py search        -> writes candidates.json + thumbs
        python fetch-images.py get <id> <name> -> downloads one full-size image
"""

import json
import os
import sys
import urllib.parse
import urllib.request

API = "https://api.openverse.org/v1/images/"
UA = "ANVUKTA-site-design/1.0 (design research; contact via project owner)"
OUT = os.path.dirname(os.path.abspath(__file__))
THUMBS = os.path.join(OUT, "candidates")

SUBJECTS = {
    "architecture": "building facade architecture",
    "structure": "concrete structure geometry",
    "infrastructure": "bridge infrastructure",
    "interchange": "highway road aerial",
    "operations": "port container terminal",
    "industry": "warehouse logistics industrial",
    "city": "city skyline",
    "tower": "skyscraper tower glass",
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()


def search():
    os.makedirs(THUMBS, exist_ok=True)
    out = {}

    for key, query in SUBJECTS.items():
        params = urllib.parse.urlencode(
            {
                "q": query,
                "license": "cc0,pdm",
                "extension": "jpg",
                "page_size": 12,
                "mature": "false",
            }
        )
        data = json.loads(get(f"{API}?{params}"))
        results = []

        for item in data.get("results", []):
            entry = {
                "id": item["id"],
                "title": (item.get("title") or "")[:80],
                "creator": (item.get("creator") or "")[:60],
                "license": f"{item.get('license')} {item.get('license_version') or ''}".strip(),
                "source": item.get("source"),
                "foreign": item.get("foreign_landing_url"),
                "url": item.get("url"),
                "thumb": item.get("thumbnail"),
                "w": item.get("width"),
                "h": item.get("height"),
            }
            results.append(entry)

            if entry["thumb"]:
                path = os.path.join(THUMBS, f"{key}--{entry['id'][:8]}.jpg")
                if not os.path.exists(path):
                    try:
                        with open(path, "wb") as fh:
                            fh.write(get(entry["thumb"]))
                    except Exception as exc:  # noqa: BLE001 - candidate is skipped
                        entry["thumb_error"] = str(exc)

        out[key] = results
        print(f"{key}: {len(results)} candidates")

    with open(os.path.join(OUT, "candidates.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1)


def fetch_one(image_id, name):
    with open(os.path.join(OUT, "candidates.json"), encoding="utf-8") as fh:
        data = json.load(fh)

    for entries in data.values():
        for entry in entries:
            if entry["id"].startswith(image_id):
                path = os.path.join(OUT, f"{name}.jpg")
                with open(path, "wb") as out_fh:
                    out_fh.write(get(entry["url"]))
                print(json.dumps({"saved": path, **entry}, indent=1))
                return
    print("not found:", image_id)


if __name__ == "__main__":
    if sys.argv[1] == "search":
        search()
    else:
        fetch_one(sys.argv[2], sys.argv[3])
