function getFavoritesStorageKey() {
    const user = getCurrentUser();
    const username = user?.username ? user.username.toLowerCase() : "guest";
    return `fge_favorites_${username}`;
}

function loadFavorites() {
    const raw = localStorage.getItem(getFavoritesStorageKey());
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function saveFavorites(favs) {
    localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(favs));
}

function isFavorite(gameId) {
    const favs = loadFavorites();
    return favs.some(g => String(g.id) === String(gameId));
}

function addToFavorites(game) {
    const favs = loadFavorites();
    const exists = favs.some(g => String(g.id) === String(game.id));
    if (exists) return;

    const minimal = {
        id: game.id,
        title: game.title,
        thumbnail: game.thumbnail,
        genre: game.genre,
        publisher: game.publisher,
        release_date: game.release_date,
        platform: game.platform
    };

    favs.unshift(minimal);
    saveFavorites(favs);
}

function removeFromFavorites(gameId) {
    const favs = loadFavorites();
    const next = favs.filter(g => String(g.id) !== String(gameId));
    saveFavorites(next);
}

function toggleFavorite(game) {
    if (isFavorite(game.id)) {
        removeFromFavorites(game.id);
        return false;
    }
    addToFavorites(game);
    return true;
}
