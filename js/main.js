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
let currentSearch = "";

// Arrow key navigation state
let focusedCardIndex = -1;
let gameCards = [];

/* =========================
   FETCH
========================= */
async function getGames() {
    setUIState("loading", "Loading games...");

    try {
        const res = await fetch(API_URL, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allGames = await res.json();

        populateGenres(allGames);
        applyFilters();
        
        announceToScreenReader(`${allGames.length} games loaded`);
    } catch (err) {
        console.error("Failed to fetch games", err);
        const container = document.querySelector(".games-scroll");
        if (container) container.innerHTML = `<p>Failed to load games. Check console.</p>`;
        setUIState("error", "Failed to load games. Please try again later.");
    }
}

/* =========================
   HELPERS
========================= */
function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

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

function renderLauncherBadge(launcher) {
    if (launcher === "steam") return `<span class="badge badge-steam" aria-label="Available on Steam">Steam</span>`;
    if (launcher === "epic") return `<span class="badge badge-epic" aria-label="Available on Epic Games">Epic</span>`;
    if (launcher === "blizzard") return `<span class="badge badge-blizzard" aria-label="Available on Blizzard">Blizzard</span>`;
    return "";
}

function sortGames(games, sortValue) {
    const sorted = [...games];

    if (sortValue === "az") {
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    if (sortValue === "za") {
        sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }

    if (sortValue === "newest") {
        sorted.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    }

    if (sortValue === "oldest") {
        sorted.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    }

    return sorted;
}

function normalizeGenre(genre) {
    if (!genre) return "";
    return genre.split(",")[0].trim().toLowerCase();
}

function setUIState(type, message) {
    const el = document.getElementById("uiState");
    if (!el) return;

    if (!type) {
        el.hidden = true;
        el.className = "ui-state";
        el.innerHTML = "";
        return;
    }

    el.hidden = false;
    el.className = `ui-state ui-${type}`;

    if (type === "loading") {
        el.innerHTML = `
            <div class="spinner" role="status" aria-label="Loading"></div>
            <div class="ui-text">${message || "Loading..."}</div>
        `;
        return;
    }

    el.innerHTML = `<div class="ui-text">${message || ""}</div>`;
}

function announceToScreenReader(message) {
    const announcer = document.getElementById("uiState");
    if (announcer) {
        setUIState("info", message);
        setTimeout(() => setUIState(null), 3000);
    }
}

/* =========================
   GENRES
========================= */
function populateGenres(games) {
    const genreSelect = document.getElementById("genreFilter");
    if (!genreSelect) return;

    const genres = [...new Set(
        games.map(g => normalizeGenre(g.genre)).filter(Boolean)
    )].sort();

    genreSelect.innerHTML = `<option value="all">All genres</option>`;

    genres.forEach(genre => {
        const opt = document.createElement("option");
        opt.value = genre;
        opt.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
        genreSelect.appendChild(opt);
    });
}

/* =========================
   FILTERS + SEARCH + SORT
========================= */
function applyFilters() {
    const platformValue = document.getElementById("platformFilter")?.value || "all";
    const launcherValue = document.getElementById("launcherFilter")?.value || "all";
    const genreValue = document.getElementById("genreFilter")?.value || "all";
    const sortValue = document.getElementById("sortFilter")?.value || "default";

    const search = (currentSearch || "").toLowerCase().trim();

    let filtered = allGames.filter(game => {
        const platform = getPlatform(game);
        const launcher = getLauncher(game);
        const genre = normalizeGenre(game.genre);

        const platformMatch = platformValue === "all" || platform === platformValue;
        const launcherMatch = launcherValue === "all" || launcher === launcherValue;
        const genreMatch = genreValue === "all" || genre === genreValue;

        let searchMatch = true;
        if (search) {
            const title = (game.title || "").toLowerCase();
            searchMatch = title.includes(search);
        }

        return platformMatch && launcherMatch && genreMatch && searchMatch;
    });

    filtered = sortGames(filtered, sortValue);
    renderGames(filtered);
    
    announceToScreenReader(`${filtered.length} games found`);
    
    // Update arrow key navigation
    setTimeout(updateGameCardsList, 100);
}

/* =========================
   RENDER
========================= */
function renderGames(games) {
    const container = document.querySelector(".games-scroll");
    if (!container) return;

    const existingH2 = container.querySelector('h2.visually-hidden');

    if (games.length === 0) {
        setUIState("empty", "No games match your filters or search.");
        container.querySelectorAll(".game-card").forEach(n => n.remove());
        if (existingH2) container.appendChild(existingH2);
        return;
    }
    
    setUIState(null);

    let html = existingH2 ? existingH2.outerHTML : '<h2 class="visually-hidden">Available Games</h2>';

    games.forEach((game, index) => {
        const launcher = getLauncher(game);
        const favorite = typeof isFavorite === "function" ? isFavorite(game.id) : false;
        const favText = favorite ? "Remove from Favorites" : "Add to Favorites";
        const favIcon = favorite ? "★" : "☆";

        html += `
            <article class="game-card" 
                     style="background-image:url('${game.thumbnail}')"
                     data-game-id="${game.id}"
                     data-card-index="${index}"
                     tabindex="${index === 0 ? '0' : '-1'}"
                     role="button"
                     aria-label="${game.title}. Use arrow keys to navigate, Enter to view details">
                <div class="game-content">
                    <div class="game-thumb">
                        <img src="${game.thumbnail}" 
                             alt="${game.title} game thumbnail" 
                             loading="lazy">
                        <div class="badges" aria-label="Game badges">
                            ${renderLauncherBadge(launcher)}
                            ${favorite ? '<span class="badge badge-favorite" aria-label="Favorited">★</span>' : ''}
                        </div>
                    </div>

                    <h3>${game.title}</h3>
                    
                    <dl class="game-meta">
                        <div class="meta-item">
                            <dt class="visually-hidden">Genre:</dt>
                            <dd>${game.genre}</dd>
                        </div>
                        <div class="meta-item">
                            <dt class="visually-hidden">Publisher:</dt>
                            <dd>${game.publisher}</dd>
                        </div>
                        <div class="meta-item">
                            <dt class="visually-hidden">Release date:</dt>
                            <dd>${formatDate(game.release_date)}</dd>
                        </div>
                        <div class="meta-item">
                            <dt class="visually-hidden">Platform:</dt>
                            <dd>${game.platform}</dd>
                        </div>
                    </dl>

                    <div class="game-actions">
                        <button type="button" 
                                class="btn-details"
                                data-game-id="${game.id}"
                                aria-label="View details for ${game.title}">
                            View Details
                        </button>

                        <button type="button"
                                class="btn-favorite ${favorite ? 'btn-favorite-active' : ''}"
                                data-game-id="${game.id}"
                                aria-label="${favText} ${game.title}"
                                aria-pressed="${favorite}">
                            <span aria-hidden="true">${favIcon}</span> ${favText}
                        </button>
                    </div>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
    
    attachGameCardListeners();
    updateGameCardsList();
}

/* =========================
   EVENT LISTENERS
========================= */
function attachGameCardListeners() {
    // View Details buttons
    document.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameId = e.currentTarget.dataset.gameId;
            window.location.href = `game.html?id=${gameId}`;
        });
    });

    // Favorite buttons
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleFavoriteClick(e);
        });
    });
    
    // Card click (for arrow key selection)
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Only if not clicking a button
            if (!e.target.closest('button')) {
                const index = parseInt(card.dataset.cardIndex);
                focusCard(index);
            }
        });
    });
}

function handleFavoriteClick(e) {
    const btn = e.currentTarget;
    const gameId = btn.dataset.gameId;
    
    if (typeof getCurrentUser !== "function" || typeof toggleFavorite !== "function") {
        return;
    }

    const user = getCurrentUser();
    if (!user) {
        window.location.href = `login.html?redirect=${encodeURIComponent("index.html")}`;
        return;
    }

    const game = allGames.find(g => String(g.id) === String(gameId));
    if (!game) return;

    const added = toggleFavorite(game);
    
    const newText = added ? "Remove from Favorites" : "Add to Favorites";
    const newIcon = added ? "★" : "☆";
    btn.innerHTML = `<span aria-hidden="true">${newIcon}</span> ${newText}`;
    btn.setAttribute('aria-label', `${newText} ${game.title}`);
    btn.setAttribute('aria-pressed', added);
    btn.classList.toggle('btn-favorite-active', added);
    
    announceToScreenReader(added ? `${game.title} added to favorites` : `${game.title} removed from favorites`);
}

/* =========================
   ARROW KEY NAVIGATION
========================= */
function updateGameCardsList() {
    gameCards = Array.from(document.querySelectorAll('.game-card'));
    
    if (focusedCardIndex >= gameCards.length) {
        focusedCardIndex = gameCards.length - 1;
    }
}

function getGridDimensions() {
    if (gameCards.length === 0) return { columns: 0, rows: 0 };
    
    const container = document.querySelector('.games-scroll');
    const firstCard = gameCards[0];
    if (!container || !firstCard) return { columns: 0, rows: 0 };
    
    const containerWidth = container.clientWidth;
    const cardWidth = firstCard.offsetWidth;
    const gap = 32;
    
    const columns = Math.floor((containerWidth + gap) / (cardWidth + gap));
    const rows = Math.ceil(gameCards.length / columns);
    
    return { columns, rows };
}

function handleArrowKeyNavigation(e) {
    const activeElement = document.activeElement;
    const isInGamesArea = activeElement.closest('.games-scroll') || 
                         activeElement.classList.contains('game-card');
    
    // Only handle if in games area or has focused card
    if (!isInGamesArea && focusedCardIndex === -1) return;
    
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) {
        return;
    }
    
    // Prevent scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    const { columns } = getGridDimensions();
    
    // Initialize focus if needed
    if (focusedCardIndex === -1 && gameCards.length > 0) {
        focusedCardIndex = 0;
        focusCard(0);
        return;
    }
    
    let newIndex = focusedCardIndex;
    
    switch(e.key) {
        case 'ArrowRight':
            newIndex = Math.min(focusedCardIndex + 1, gameCards.length - 1);
            break;
        case 'ArrowLeft':
            newIndex = Math.max(focusedCardIndex - 1, 0);
            break;
        case 'ArrowDown':
            newIndex = Math.min(focusedCardIndex + columns, gameCards.length - 1);
            break;
        case 'ArrowUp':
            newIndex = Math.max(focusedCardIndex - columns, 0);
            break;
        case 'Enter':
        case ' ':
            const card = gameCards[focusedCardIndex];
            if (card) {
                const detailsBtn = card.querySelector('.btn-details');
                if (detailsBtn) detailsBtn.click();
            }
            return;
    }
    
    if (newIndex !== focusedCardIndex) {
        focusCard(newIndex);
    }
}

function focusCard(index) {
    if (index < 0 || index >= gameCards.length) return;
    
    // Remove focus from all
    gameCards.forEach(card => {
        card.setAttribute('tabindex', '-1');
        card.classList.remove('card-focused');
    });
    
    // Focus new card
    const card = gameCards[index];
    card.setAttribute('tabindex', '0');
    card.classList.add('card-focused');
    card.focus();
    
    card.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest'
    });
    
    focusedCardIndex = index;
    
    const title = card.querySelector('h3')?.textContent || 'Game';
    const position = `${index + 1} of ${gameCards.length}`;
    announceToScreenReader(`${title}, ${position}`);
}

function addKeyboardInstructions() {
    const container = document.querySelector('.games-scroll');
    if (!container || document.querySelector('.keyboard-instructions')) return;
    
    const instructions = document.createElement('div');
    instructions.className = 'keyboard-instructions';
    instructions.setAttribute('role', 'region');
    instructions.setAttribute('aria-label', 'Keyboard navigation instructions');
    instructions.innerHTML = `
        <p><strong>Keyboard:</strong> Tab = buttons, Arrow keys = navigate games, Enter = view details</p>
    `;
    
    container.parentElement.insertBefore(instructions, container);
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    getGames();

    // Filters
    document.getElementById("platformFilter")?.addEventListener("change", applyFilters);
    document.getElementById("launcherFilter")?.addEventListener("change", applyFilters);
    document.getElementById("genreFilter")?.addEventListener("change", applyFilters);
    document.getElementById("sortFilter")?.addEventListener("change", applyFilters);

    // Search
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");

    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            currentSearch = searchInput.value || "";
            applyFilters();
        });

        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = searchInput.value || "";
                applyFilters();
            }, 300);
        });
    }
    
    // Arrow key navigation
    document.addEventListener('keydown', handleArrowKeyNavigation);
    
    // Add instructions
    setTimeout(addKeyboardInstructions, 1000);
});