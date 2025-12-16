const API_HOST = "free-to-play-games-database.p.rapidapi.com";
const API_KEY = "58cb87a8ddmsh9a33cd4b5462cfcp16e071jsn0cb1f288b88d";

const options = {
    method: "GET",
    headers: {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": API_HOST
    }
};

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function pickHeroImage(game) {
    if (Array.isArray(game.screenshots) && game.screenshots.length > 0) {
        const first = game.screenshots[0];
        if (first && first.image) return first.image;
    }
    return game.thumbnail || "";
}

function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderScreenshots(game) {
    if (!Array.isArray(game.screenshots) || game.screenshots.length === 0) {
        return `<p class="details-muted">No screenshots available.</p>`;
    }

    let html = `<div class="shots-grid">`;

    game.screenshots.forEach((shot, index) => {
        const img = shot && shot.image ? shot.image : "";
        if (!img) return;

        html += `
            <button type="button" class="shot" data-shot-index="${index}" aria-label="Open screenshot ${index + 1}">
                <img src="${escapeHtml(img)}" alt="Screenshot ${index + 1}">
            </button>
        `;
    });

    html += `</div>`;
    return html;
}

function openLightbox(images, startIndex) {
    const overlay = document.getElementById("lightbox");
    const imgEl = document.getElementById("lightboxImg");

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    let currentIndex = startIndex;

    function show(index) {
        currentIndex = index;
        imgEl.src = images[currentIndex];
    }

    function close() {
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        imgEl.src = "";
        document.removeEventListener("keydown", onKeyDown);
    }

    function prev() {
        const nextIndex = (currentIndex - 1 + images.length) % images.length;
        show(nextIndex);
    }

    function next() {
        const nextIndex = (currentIndex + 1) % images.length;
        show(nextIndex);
    }

    function onKeyDown(e) {
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
    }

    overlay.querySelector('[data-action="close"]').onclick = close;
    overlay.querySelector('[data-action="prev"]').onclick = prev;
    overlay.querySelector('[data-action="next"]').onclick = next;

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    }, { once: true });

    document.addEventListener("keydown", onKeyDown);

    show(startIndex);
}

function wireScreenshotClicks(game) {
    if (!Array.isArray(game.screenshots) || game.screenshots.length === 0) return;

    const images = game.screenshots
        .map(s => (s && s.image ? s.image : ""))
        .filter(Boolean);

    const buttons = document.querySelectorAll(".shot");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = Number(btn.dataset.shotIndex || 0);
            openLightbox(images, idx);
        });
    });
}

function renderGameDetails(game) {
    const el = document.getElementById("gameDetails");
    const heroImage = pickHeroImage(game);

    el.innerHTML = `
        <div class="details-card">
            <div class="details-hero">
                <img class="details-hero-img" src="${escapeHtml(heroImage)}" alt="${escapeHtml(game.title)}">
                <div class="details-hero-fade"></div>
            </div>

            <div class="details-body">
                <h2>${escapeHtml(game.title)}</h2>

                <div class="details-meta">
                    <p><strong>Genre:</strong> ${escapeHtml(game.genre)}</p>
                    <p><strong>Platform:</strong> ${escapeHtml(game.platform)}</p>
                    <p><strong>Publisher:</strong> ${escapeHtml(game.publisher)}</p>
                    <p><strong>Developer:</strong> ${escapeHtml(game.developer)}</p>
                    <p><strong>Release date:</strong> ${escapeHtml(game.release_date)}</p>
                    <p><strong>Status:</strong> ${escapeHtml(game.status)}</p>
                </div>

                <p class="details-desc">${escapeHtml(game.description || "")}</p>

                <h3 class="details-subtitle">Screenshots</h3>
                ${renderScreenshots(game)}

                <div class="details-actions">
                    <a class="details-link" href="${escapeHtml(game.game_url)}" target="_blank" rel="noreferrer">Open official page</a>
                    <a class="details-link" href="index.html">Back to Home</a>
                </div>
            </div>
        </div>
    `;

    wireScreenshotClicks(game);
}

async function loadGameDetails() {
    const id = getQueryParam("id");
    const el = document.getElementById("gameDetails");

    if (!id) {
        el.innerHTML = `<p>Missing game id in URL. Go back to <a href="index.html">Home</a>.</p>`;
        return;
    }

    const url = `https://${API_HOST}/api/game?id=${encodeURIComponent(id)}`;

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            el.innerHTML = `<p>Failed to load game details. HTTP ${response.status}</p>`;
            return;
        }

        const game = await response.json();
        renderGameDetails(game);
    } catch (err) {
        console.error(err);
        el.innerHTML = `<p>Error loading details. Check console.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadGameDetails);
