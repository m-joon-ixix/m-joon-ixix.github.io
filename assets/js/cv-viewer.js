// Renders the CV PDF inside the page with PDF.js (works on desktop and mobile,
// unlike <iframe>/<embed> PDFs, which many mobile browsers can't display).
(function () {
  const viewer = document.querySelector(".cv-viewer");
  if (!viewer) return;
  const url = viewer.dataset.pdf;
  const zoomLabel = document.querySelector(".cv-zoom");

  function fail() {
    viewer.innerHTML =
      '<p class="cv-status">Couldn’t display the CV here. <a href="' + url + '">Open the PDF directly.</a></p>';
  }

  if (!window.pdfjsLib) return fail();
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const ZOOM_STEPS = [0.6, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];
  let zoomIndex = ZOOM_STEPS.indexOf(1);
  let pdf = null;
  let renderToken = 0;

  function contentWidth() {
    const s = getComputedStyle(viewer);
    return viewer.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
  }

  async function renderAll() {
    const token = ++renderToken;
    const zoom = ZOOM_STEPS[zoomIndex];
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
    const fitWidth = contentWidth();
    // On narrow screens the CV is tiny at 100%, so people pinch-zoom; render at
    // extra resolution (capped) so the text stays sharp when zoomed in.
    const oversample = fitWidth < 600 ? 2 : 1;
    const dpr = Math.min((window.devicePixelRatio || 1) * oversample, 4);
    const frag = document.createDocumentFragment();

    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      if (token !== renderToken) return; // a newer render started (resize/zoom)
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (fitWidth / base.width) * zoom });

      const wrap = document.createElement("div");
      wrap.className = "cv-page";
      wrap.style.width = viewport.width + "px";
      wrap.style.height = viewport.height + "px";

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.setAttribute("aria-label", "CV page " + n + " of " + pdf.numPages);
      wrap.appendChild(canvas);

      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
      }).promise;

      // Keep the CV's hyperlinks clickable by overlaying <a> elements.
      const annotations = await page.getAnnotations();
      annotations.forEach(function (a) {
        if (a.subtype !== "Link" || !a.url) return;
        const r = viewport.convertToViewportRectangle(a.rect);
        const link = document.createElement("a");
        link.className = "cv-link";
        link.href = a.url;
        if (/^https?:/.test(a.url)) {
          link.target = "_blank";
          link.rel = "noopener";
        }
        link.title = a.url;
        link.style.left = Math.min(r[0], r[2]) + "px";
        link.style.top = Math.min(r[1], r[3]) + "px";
        link.style.width = Math.abs(r[2] - r[0]) + "px";
        link.style.height = Math.abs(r[3] - r[1]) + "px";
        wrap.appendChild(link);
      });

      frag.appendChild(wrap);
    }
    if (token !== renderToken) return;
    viewer.replaceChildren(frag);
  }

  document.querySelectorAll("[data-zoom]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const dir = btn.dataset.zoom === "in" ? 1 : -1;
      const next = Math.min(ZOOM_STEPS.length - 1, Math.max(0, zoomIndex + dir));
      if (next !== zoomIndex && pdf) {
        zoomIndex = next;
        renderAll();
      }
    });
  });

  let lastWidth = viewer.clientWidth;
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (pdf && viewer.clientWidth !== lastWidth) {
        lastWidth = viewer.clientWidth;
        renderAll();
      }
    }, 200);
  });

  pdfjsLib.getDocument(url).promise
    .then(function (doc) { pdf = doc; return renderAll(); })
    .catch(fail);
})();
