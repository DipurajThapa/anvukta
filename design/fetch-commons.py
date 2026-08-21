"""
Fetch high-resolution, freely-licensed photographs from Wikimedia Commons.

Commons serves true originals (often 3000-6000px), unlike the CDN copies the
Openverse API links to. Results are filtered to public-domain / CC0 licences so
they can be used commercially without attribution obligations.

Usage:  python fetch-commons.py search           -> candidates + thumbnails
        python fetch-commons.py get <title> <name>
"""

import json
import os
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "ANVUKTA-site-design/1.0 (design research; contact via project owner)"
OUT = os.path.dirname(os.path.abspath(__file__))
THUMBS = os.path.join(OUT, "commons-thumbs")

# Licences that carry no attribution obligation.
FREE = {"cc0", "pd", "publicdomain", "cc-zero", "no restrictions"}

SUBJECTS = {
    "facade": "modern glass facade skyscraper",
    "bridge": "cable stayed bridge",
    "interchange": "motorway interchange aerial",
    "port": "container terminal gantry crane",
    "atrium": "atrium glass roof interior",
}


def get(url):
    return urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60
    ).read()


def api(**params):
    params.setdefault("format", "json")
    params.setdefault("action", "query")
    return json.loads(get(f"{API}?{urllib.parse.urlencode(params)}"))


def search():
    os.makedirs(THUMBS, exist_ok=True)
    out = {}

    for key, query in SUBJECTS.items():
        found = api(
            generator="search",
            gsrsearch=f"{query} filetype:bitmap",
            gsrnamespace=6,
            gsrlimit=20,
            prop="imageinfo",
            iiprop="url|size|extmetadata",
            iiurlwidth=320,
        )
        pages = (found.get("query") or {}).get("pages", {})
        rows = []

        for page in pages.values():
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata") or {}
            licence = (meta.get("LicenseShortName", {}).get("value") or "").lower()
            width = info.get("width") or 0

            if width < 2000:
                continue
            if not any(f in licence for f in FREE):
                continue

            rows.append(
                {
                    "title": page.get("title", ""),
                    "w": width,
                    "h": info.get("height") or 0,
                    "url": info.get("url"),
                    "thumb": info.get("thumburl"),
                    "licence": meta.get("LicenseShortName", {}).get("value", ""),
                    "credit": (meta.get("Artist", {}).get("value") or "")[:80],
                }
            )

        out[key] = rows
        print(f"{key:<12} {len(rows)} candidates")

        for index, row in enumerate(rows[:8]):
            path = os.path.join(THUMBS, f"{key}--{index}.jpg")
            if os.path.exists(path) or not row["thumb"]:
                continue
            try:
                with open(path, "wb") as fh:
                    fh.write(get(row["thumb"]))
            except Exception:  # noqa: BLE001 - a missing thumbnail just skips the candidate
                pass

    with open(os.path.join(OUT, "commons.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1)


def fetch_one(key, index, name):
    data = json.load(open(os.path.join(OUT, "commons.json"), encoding="utf-8"))
    row = data[key][int(index)]
    path = os.path.join(OUT, f"{name}.jpg")
    with open(path, "wb") as fh:
        fh.write(get(row["url"]))
    print(json.dumps({"saved": name, "w": row["w"], "h": row["h"],
                      "licence": row["licence"], "title": row["title"]}))


if __name__ == "__main__":
    if sys.argv[1] == "search":
        search()
    else:
        fetch_one(sys.argv[2], sys.argv[3], sys.argv[4])
