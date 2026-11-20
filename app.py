"""Personal website of Minjoon Choi.

Content lives in `content/` (YAML + Markdown), the page layouts in `templates/`,
and static files (images, PDFs, CSS, JS) in `assets/`.

    python app.py      # live preview at http://127.0.0.1:8000 (reloads on edits)
    python freeze.py   # build the static site into build/
"""

import re
from pathlib import Path

import markdown as md
import yaml
from flask import Flask, render_template
from markupsafe import Markup

ROOT = Path(__file__).parent
CONTENT = ROOT / "content"

app = Flask(__name__, static_folder="assets", static_url_path="/assets")


def load_yaml(name):
    with open(CONTENT / name, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def asset(path):
    """Turn a content path ("./assets/x", "assets/x") into a site-root URL ("/assets/x").

    Root-absolute URLs work from every page, including /publications/.
    External URLs, anchors and mailto: links are returned unchanged.
    """
    if not path or re.match(r"^([a-z]+:|#|/)", path):
        return path
    return "/" + path.removeprefix("./")


_EXTERNAL_LINK = re.compile(r'<a href="(https?://[^"]+)"')
_LOCAL_LINK = re.compile(r'(href|src)="(\./)?(assets/[^"]+)"')


def render_markdown(text, inline=False):
    """Render Markdown to HTML; external links open in a new tab."""
    html = md.markdown(text or "", extensions=["smarty"])
    html = _EXTERNAL_LINK.sub(r'<a href="\1" target="_blank" rel="noopener"', html)
    html = _LOCAL_LINK.sub(r'\1="/\3"', html)
    if inline and html.startswith("<p>") and html.endswith("</p>"):
        html = html[3:-4]
    return Markup(html)


def render_markdown_file(name):
    return render_markdown((CONTENT / name).read_text(encoding="utf-8"))


def load_publications(highlight):
    publications = load_yaml("publications.yml").get("main", [])
    for pub in publications:
        authors = []
        for raw in (pub.get("authors") or "").split(","):
            raw = raw.strip()
            if not raw:
                continue
            name = raw.rstrip("*†").strip()
            authors.append({"name": name, "mark": raw[len(name):].strip(), "me": name == highlight})
        pub["author_list"] = authors
        pub["equal_contribution"] = any("*" in a["mark"] for a in authors)
    return publications


app.jinja_env.filters["markdown"] = render_markdown
app.jinja_env.filters["asset"] = asset


@app.context_processor
def inject_site():
    """Make `site` and the menu bar items available to every template."""
    site = load_yaml("site.yml")
    return {"site": site, "nav": site.get("nav", [])}


@app.route("/")
def index():
    site = load_yaml("site.yml")
    publications = load_publications(site.get("highlight_author"))
    return render_template(
        "index.html",
        about=render_markdown_file("about.md"),
        news=load_yaml("news.yml"),
        publications=[p for p in publications if p.get("selected")],
        total_publications=len(publications),
        facts=render_markdown_file("facts.md"),
    )


@app.route("/publications/")
def publications():
    site = load_yaml("site.yml")
    return render_template(
        "publications.html",
        publications=load_publications(site.get("highlight_author")),
    )


@app.route("/cv/")
def cv():
    return render_template("cv.html")


if __name__ == "__main__":
    # Port 8000, not Flask's default 5000: macOS's AirPlay Receiver occupies 5000.
    app.run(debug=True, port=8000)
