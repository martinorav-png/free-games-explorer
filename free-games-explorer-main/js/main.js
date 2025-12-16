const API_HOST = "free-to-play-games-database.p.rapidapi.com";
const API_KEY = "58cb87a8ddmsh9a33cd4b5462cfcp16e071jsn0cb1f288b88d";
const API_URL = `https://${API_HOST}/api/games`;

const options = {
    method: "GET",
    headers: {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": API_HOST
    }
};

let allGames = [];

/* =========================
   FETCH
========================= */
async function getGames() {
    try {
        const res = await fetch(API_URL, options);
        allGames = await res.json();
        populateGenres(allGames);
        applyFilters();
    } catch (err) {
        console.error("Failed to fetch games", err);
    }
}

/* =========================
   INFERENCE HELPERS
========================= */
function getPlatform(game) {
    const p = (game.platform || "").toLowerCase();
    if (p.includes("browser")) return "browser";
    if (p.includes("windows")) return "windows";
    return "other";
}

function getLauncher(game) {
    const publisher = (game.publisher || "").toLowerCase();
    const developer = (game.developer || "").toLowerCase();
    const platform = (game.platform || "").toLowerCase();

    if (publisher.includes("blizzard") || developer.includes("blizzard") || publisher.includes("activision")) {
        return "blizzard";
    }

    if (publisher.includes("epic")) {
        return "epic";
    }

    if (platform.includes("windows")) {
        return "steam";
    }

    return "other";
}

function sortGames(games, sortValue) {
    const sorted = [...games];

    if (sortValue === "az") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortValue === "za") {
        sorted.sort((a, b) => b.title.localeCompare(a.title));
    }

    if (sortValue === "newest") {
        sorted.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    }

    if (sortValue === "oldest") {
        sorted.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    }

    return sorted;
}

/* =========================
   GENRES
========================= */
function populateGenres(games) {
    const genreSelect = document.getElementById("genreFilter");
    if (!genreSelect) return;

    const genres = [...new Set(
        games
            .map(g => g.genre)
            .filter(Boolean)
    )].sort();

    genreSelect.innerHTML = `<option value="all">All</option>`;

    genres.forEach(genre => {
        const opt = document.createElement("option");
        opt.value = genre.toLowerCase();
        opt.textContent = genre;
        genreSelect.appendChild(opt);
    });
}

/* =========================
   FILTER LOGIC
========================= */
function applyFilters() {
    const platformValue = document.getElementById("platformFilter")?.value || "all";
    const launcherValue = document.getElementById("launcherFilter")?.value || "all";
    const genreValue = document.getElementById("genreFilter")?.value || "all";
    const sortValue = document.getElementById("sortFilter")?.value || "default";

    let filtered = allGames.filter(game => {
        const platform = getPlatform(game);
        const launcher = getLauncher(game);
        const genre = (game.genre || "").toLowerCase();

        const platformMatch = platformValue === "all" || platform === platformValue;
        const launcherMatch = launcherValue === "all" || launcher === launcherValue;
        const genreMatch = genreValue === "all" || genre === genreValue;

        return platformMatch && launcherMatch && genreMatch;
    });

    filtered = sortGames(filtered, sortValue);

    renderGames(filtered);
}


/* =========================
   BADGES
========================= */
function renderLauncherBadge(launcher) {
    if (launcher === "steam") return `<span class="badge badge-steam">Steam</span>`;
    if (launcher === "epic") return `<span class="badge badge-epic">Epic</span>`;
    if (launcher === "blizzard") return `<span class="badge badge-blizzard">Blizzard</span>`;
    return "";
}

/* =========================
   RENDER
========================= */
function renderGames(games) {
    const container = document.querySelector(".games-scroll");
    if (!container) return;

    if (games.length === 0) {
        container.innerHTML = `<p>No games match the selected filters.</p>`;
        return;
    }

    let html = "";

    games.forEach(game => {
        const launcher = getLauncher(game);

        html += `
            <div class="game-card" style="background-image:url('${game.thumbnail}')">
                <div class="game-content">
                    <div class="game-thumb">
                        <img src="${game.thumbnail}" alt="${game.title}">
                        <div class="badges">
                            ${renderLauncherBadge(launcher)}
                        </div>
                    </div>

                    <h3>${game.title}</h3>
                    <p>${game.genre}</p>
                    <p>${game.publisher}</p>
                    <p>${formatDate(game.release_date)}</p>
                    <p>${game.platform}</p>

                    <div class="game-actions">
                        <button type="button"
                            onclick="window.location.href='game.html?id=${game.id}'">
                            View Details
                        </button>
                        <button type="button">
                            Add to Favorites
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* =========================
   EVENTS
========================= */
document.addEventListener("DOMContentLoaded", () => {
    getGames();

    document.getElementById("platformFilter")?.addEventListener("change", applyFilters);
    document.getElementById("launcherFilter")?.addEventListener("change", applyFilters);
    document.getElementById("genreFilter")?.addEventListener("change", applyFilters);
    document.getElementById("sortFilter")
    ?.addEventListener("change", applyFilters);

});

function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

