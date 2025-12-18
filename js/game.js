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
    if (shots.length && shots[0].image) return shots[0].image;
    return game.thumbnail || "";
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

            <h3 class="details-subtitle">Screenshots</h3>
            ${screenshots.length ? `
                <div class="shots-grid">
                    ${screenshots.map((s, i) => `
                        <button class="shot" type="button" data-idx="${i}">
                            <img src="${s.image}" alt="Screenshot ${i + 1}">
                        </button>
                    `).join("")}
                </div>
            ` : `<p class="details-muted">No screenshots available.</p>`}

        </div>

        <div id="lightbox" class="lightbox">
            <div class="lightbox-controls">
                <button class="lightbox-btn" type="button" id="prevShot">Prev</button>
                <button class="lightbox-btn" type="button" id="closeShot">Close</button>
                <button class="lightbox-btn" type="button" id="nextShot">Next</button>
            </div>
            <img id="lightboxImg" class="lightbox-img" alt="Screenshot">
        </div>
    `;

    setupLightbox(screenshots);
}

function renderError(message) {
    const root = document.getElementById("detailsRoot");
    if (!root) return;
    root.className = "details-loading";
    root.innerHTML = `${message}`;
}

function setupLightbox(screenshots) {
    if (!screenshots.length) return;

    const lightbox = document.getElementById("lightbox");
    const img = document.getElementById("lightboxImg");
    const prev = document.getElementById("prevShot");
    const next = document.getElementById("nextShot");
    const close = document.getElementById("closeShot");

    let idx = 0;

    function openAt(i) {
        idx = i;
        img.src = screenshots[idx].image;
        lightbox.classList.add("open");
    }

    function closeBox() {
        lightbox.classList.remove("open");
    }

    function prevShot() {
        idx = (idx - 1 + screenshots.length) % screenshots.length;
        img.src = screenshots[idx].image;
    }

    function nextShot() {
        idx = (idx + 1) % screenshots.length;
        img.src = screenshots[idx].image;
    }

    document.addEventListener("click", (e) => {
        const shotBtn = e.target.closest(".shot");
        if (!shotBtn) return;
        const i = Number(shotBtn.dataset.idx);
        openAt(Number.isFinite(i) ? i : 0);
    });

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
}

async function loadGameDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        renderError("Missing game id in URL. Open this page via View Details from Home.");
        return;
    }

    try {
        const response = await fetch(`${GAME_URL}?id=${encodeURIComponent(id)}`, GAME_OPTIONS);
        if (!response.ok) {
            renderError(`Failed to load game details. HTTP ${response.status}`);
            return;
        }

        const game = await response.json();
        renderDetails(game);
    } catch (err) {
        console.error(err);
        renderError("Error loading game details. Check console for details.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadGameDetails();
});
