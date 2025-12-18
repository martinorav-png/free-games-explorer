const GAME_URL = "https://free-to-play-games-database.p.rapidapi.com/api/game";

const GAME_OPTIONS = {
    method: "GET",
    headers: {
        "X-RapidAPI-Key": "58cb87a8ddmsh9a33cd4b5462cfcp16e071jsn0cb1f288b88d",
        "X-RapidAPI-Host": "free-to-play-games-database.p.rapidapi.com"
    }
};

function formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return "";
    const parts = String(dateStr).split("-");
    if (parts.length !== 3) return dateStr;
    const [yyyy, mm, dd] = parts;
    return `${dd}.${mm}.${yyyy}`;
}

function pickHeroImage(game) {
    const shots = Array.isArray(game.screenshots) ? game.screenshots : [];
    if (shots.length && shots[0] && shots[0].image) return shots[0].image;
    return game.thumbnail || "";
}

function setUIState(type, message) {
    const root = document.getElementById("detailsRoot");
    if (!root) return;

    if (!type) {
        root.className = "";
        return;
    }

    root.className = `ui-state ui-${type}`;

    if (type === "loading") {
        root.innerHTML = `
            <div class="spinner" role="status" aria-label="Loading"></div>
            <div class="ui-text">${message || "Loading..."}</div>
        `;
        return;
    }

    root.innerHTML = `<div class="ui-text">${message || ""}</div>`;
}

function renderDetails(game) {
    const root = document.getElementById("detailsRoot");
    if (!root) return;

    const title = game.title || "Untitled";
    const desc = game.description || "No description available.";
    const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
    const heroImg = pickHeroImage(game);

    root.className = "details-card";
    root.innerHTML = `
        <div class="details-hero">
            <img class="details-hero-img" src="${heroImg}" alt="${title}">
            <div class="details-hero-fade"></div>
        </div>

        <div class="details-body">
            <h2>${title}</h2>

            <div class="details-meta">
                <p><strong>Genre:</strong> ${game.genre || ""}</p>
                <p><strong>Publisher:</strong> ${game.publisher || ""}</p>
                <p><strong>Release:</strong> ${formatDateDDMMYYYY(game.release_date)}</p>
                <p><strong>Platform:</strong> ${game.platform || ""}</p>
                <p><strong>Developer:</strong> ${game.developer || ""}</p>
                <p><strong>Status:</strong> ${game.status || ""}</p>
            </div>

            <p class="details-desc">${desc}</p>

            <div class="details-actions">
                ${game.game_url ? `<a class="details-link" href="${game.game_url}" target="_blank" rel="noopener noreferrer">Open official page</a>` : ""}
                <a class="details-link" href="index.html">Back to Home</a>
            </div>

            <section class="shots-section" aria-labelledby="shots-title">
                <h3 id="shots-title" class="details-subtitle">Screenshots</h3>

                ${
                    screenshots.length
                        ? `
                    <div class="shots-carousel" role="region" aria-label="Screenshot carousel">
                        <button class="carousel-btn prev" type="button" aria-label="Previous screenshot">Prev</button>

                        <div class="shots-viewport">
                            <div class="shots-track" tabindex="0" aria-label="Screenshots"></div>
                        </div>

                        <button class="carousel-btn next" type="button" aria-label="Next screenshot">Next</button>
                    </div>

                    <div class="carousel-dots" aria-label="Carousel position"></div>
                    `
                        : `<p class="favorites-empty">No screenshots available.</p>`
                }
            </section>
        </div>

        <div id="lightbox" class="lightbox" aria-hidden="true">
            <div class="lightbox-controls">
                <button class="lightbox-btn" type="button" id="prevShot">Prev</button>
                <button class="lightbox-btn" type="button" id="closeShot">Close</button>
                <button class="lightbox-btn" type="button" id="nextShot">Next</button>
            </div>
            <img id="lightboxImg" class="lightbox-img" alt="Screenshot">
        </div>
    `;

    const lightboxApi = setupLightbox(screenshots);
    setupScreenshotsCarouselSwipe(screenshots, lightboxApi);
}

function enableCarouselKeyboardControls({ track, prevBtn, nextBtn, dots, getIndex, setIndex, getCount }) {
  if (!track) return;

  function focusActiveSlide() {
    const slides = Array.from(track.querySelectorAll(".shot-slide"));
    const idx = getIndex();

    slides.forEach((s, i) => {
      s.tabIndex = i === idx ? 0 : -1;
      s.setAttribute("aria-current", i === idx ? "true" : "false");
    });

    const active = slides[idx];
    if (active) active.focus();
  }

  function goPrev() {
    setIndex(Math.max(0, getIndex() - 1));
    focusActiveSlide();
  }

  function goNext() {
    setIndex(Math.min(getCount() - 1, getIndex() + 1));
    focusActiveSlide();
  }

  function onKeyDown(e) {
    const key = e.key;

    if (key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }

    if (key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }

    if (key === "Home") {
      e.preventDefault();
      setIndex(0);
      focusActiveSlide();
    }

    if (key === "End") {
      e.preventDefault();
      setIndex(getCount() - 1);
      focusActiveSlide();
    }
  }

  track.addEventListener("keydown", onKeyDown);

  if (prevBtn) prevBtn.addEventListener("click", () => { goPrev(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { goNext(); });

  if (dots) {
    Array.from(dots.querySelectorAll(".carousel-dot")).forEach((dot, i) => {
      dot.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setIndex(Math.max(0, i - 1));
          focusActiveSlide();
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setIndex(Math.min(getCount() - 1, i + 1));
          focusActiveSlide();
        }
      });
    });
  }

  focusActiveSlide();

    // Algseis
  updateDots();
  applyTransform();

  // Keyboard-only nav carouselis
  enableCarouselKeyboardControls({
    track,
    prevBtn,
    nextBtn,
    dots,
    getIndex: () => index,
    setIndex: (i) => {
      index = i;
      applyTransform();
    },
    getCount: () => screenshots.length
  });

  slide.setAttribute("aria-roledescription", "slide");


}


function setupLightbox(screenshots) {
    const lightbox = document.getElementById("lightbox");
    const img = document.getElementById("lightboxImg");
    const prev = document.getElementById("prevShot");
    const next = document.getElementById("nextShot");
    const close = document.getElementById("closeShot");

    if (!lightbox || !img || !prev || !next || !close) {
        return { openAt: () => {} };
    }

    let idx = 0;

    function openAt(i) {
        if (!Array.isArray(screenshots) || screenshots.length === 0) return;
        idx = Math.max(0, Math.min(i, screenshots.length - 1));
        img.src = screenshots[idx].image;
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
    }

    function closeBox() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
    }

    function prevShot() {
        if (!screenshots.length) return;
        idx = (idx - 1 + screenshots.length) % screenshots.length;
        img.src = screenshots[idx].image;
    }

    function nextShot() {
        if (!screenshots.length) return;
        idx = (idx + 1) % screenshots.length;
        img.src = screenshots[idx].image;
    }

    close.addEventListener("click", closeBox);
    prev.addEventListener("click", prevShot);
    next.addEventListener("click", nextShot);

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeBox();
    });

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeBox();
        if (e.key === "ArrowLeft") prevShot();
        if (e.key === "ArrowRight") nextShot();
    });

    return { openAt };
}

function setupScreenshotsCarouselSwipe(screenshots, lightboxApi) {
    const track = document.querySelector(".shots-track");
    const dots = document.querySelector(".carousel-dots");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");

    if (!track || !dots || !prevBtn || !nextBtn) return;
    if (!Array.isArray(screenshots) || screenshots.length === 0) return;

    track.innerHTML = "";
    dots.innerHTML = "";

    let index = 0;

    screenshots.forEach((s, i) => {
        const slide = document.createElement("button");
        slide.type = "button";
        slide.className = "shot-slide";
        slide.setAttribute("aria-label", `Open screenshot ${i + 1}`);
        slide.innerHTML = `<img src="${s.image}" alt="Screenshot ${i + 1}" loading="lazy">`;

        slide.addEventListener("click", () => {
            if (lightboxApi && typeof lightboxApi.openAt === "function") {
                lightboxApi.openAt(i);
            }
        });

        track.appendChild(slide);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", `Go to screenshot ${i + 1}`);
        dot.addEventListener("click", () => goTo(i));
        dots.appendChild(dot);
    });

    function updateDots() {
        Array.from(dots.children).forEach((d, i) => {
            d.setAttribute("aria-current", i === index ? "true" : "false");
        });
    }

    function applyTransform() {
        track.style.transform = `translateX(${-index * 100}%)`;
        updateDots();
    }

    function goTo(i) {
        index = Math.max(0, Math.min(i, screenshots.length - 1));
        applyTransform();
    }

    function next() {
        goTo(index + 1);
    }

    function prev() {
        goTo(index - 1);
    }

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            prev();
        }
        if (e.key === "ArrowRight") {
            e.preventDefault();
            next();
        }
    });

    updateDots();
    applyTransform();
}

async function loadGameDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        setUIState("error", "Missing game id in URL.");
        return;
    }

    setUIState("loading", "Loading game details...");

    try {
        const res = await fetch(`${GAME_URL}?id=${encodeURIComponent(id)}`, GAME_OPTIONS);
        if (!res.ok) {
            setUIState("error", `Failed to load game details. HTTP ${res.status}`);
            return;
        }

        const game = await res.json();
        renderDetails(game);
    } catch (err) {
        console.error(err);
        setUIState("error", "Error loading game details. Check console.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadGameDetails();
});
