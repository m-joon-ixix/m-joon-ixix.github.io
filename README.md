# m-joon-ixix.github.io

Personal website of Minjoon Choi, built with [Flask](https://flask.palletsprojects.com) and
frozen to static HTML with [Frozen-Flask](https://frozen-flask.readthedocs.io).

## Editing content

| What | File |
| --- | --- |
| Name, position, email, avatar, social links, SEO, top menu bar | `content/site.yml` |
| About Me | `content/about.md` |
| News | `content/news.yml` (newest first) |
| Publications (`selected: true` → shown on the home page) | `content/publications.yml` |
| CV (shown on the CV page and downloadable) | replace `assets/files/minjoon-cv.pdf` (path set by `cv_pdf` in `content/site.yml`) |
| Other Facts | `content/facts.md` |
| Images / PDFs (CV, papers) | `assets/img/`, `assets/files/` |
| Layout & style | `templates/` (`base.html` = menu bar + footer shared by all pages), `assets/css/style.css` |

### Adding a new page

1. Add a route in `app.py`, e.g. `@app.route("/teaching/")` with a function `teaching()`.
2. Create `templates/teaching.html` that starts with `{% extends "base.html" %}` and fills `{% block body %}`.
3. Add `- label: Teaching` / `endpoint: teaching` under `nav:` in `content/site.yml`.

## Local development

```bash
conda env create -f environment.yml   # first time only
conda activate personal-website
python app.py      # live preview at http://127.0.0.1:8000
python freeze.py   # build static site into build/
```

After changing `requirements.txt`, update the env with
`conda env update -f environment.yml --prune`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and deploys it
to GitHub Pages. In the repository settings, set **Pages → Build and deployment → Source** to
**GitHub Actions**.
