"""Build the static site into build/ for GitHub Pages."""

from pathlib import Path

from flask_frozen import Freezer

from app import app

app.config.update(
    FREEZER_DESTINATION="build",
    FREEZER_RELATIVE_URLS=False,  # site is served from the domain root
    FREEZER_REMOVE_EXTRA_FILES=True,
)
freezer = Freezer(app)


@freezer.register_generator
def static_files():
    # Freeze every file under assets/, including PDFs that are only linked
    # from the Markdown/YAML content (url_for never sees those).
    static_dir = Path(app.static_folder)
    for path in sorted(static_dir.rglob("*")):
        if path.is_file() and path.name != ".DS_Store":
            yield "static", {"filename": path.relative_to(static_dir).as_posix()}


if __name__ == "__main__":
    freezer.freeze()
    # Tell GitHub Pages not to run Jekyll on the output.
    (Path(app.root_path) / "build" / ".nojekyll").touch()
    print("Built site into build/")
