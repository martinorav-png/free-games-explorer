function formatDate(dateString) {
    const parts = dateString.split("-");
    return `${parts[2]}.${parts[1]}${parts[0]}`;
}


const url = 'https://free-to-play-games-database.p.rapidapi.com/api/games';
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': '58cb87a8ddmsh9a33cd4b5462cfcp16e071jsn0cb1f288b88d',
        'X-RapidAPI-Host': 'free-to-play-games-database.p.rapidapi.com'
    }
};

function renderGames(games) {
    const gameContainer = document.querySelector('.games-scroll');
    let html = '';

    games.forEach(game => {
        html += `
            <div class="game-card">
                <div class="thumbnail">
                    <img src="${game.thumbnail}" alt="${game.title}">
                </div>
                <h3>${game.title}</h3>
                <p>${game.publisher}</p>
                <p>${formatDate(game.release_date)}</p>
                <p>${game.platform}</p>
                <div class="game-actions">
                    <button onclick="window.location.href='game.html'">View Details</button>
                    <button>Add to Favorites</button>
                </div>
            </div>
        `;
    });

    gameContainer.innerHTML = html;
}

async function getGames() {
    try {
        const response = await fetch(url, options);
        const games = await response.json();
        renderGames(games);
    } catch (error) {
        console.error("Error fetching games:", error);
    }
}

document.addEventListener("DOMContentLoaded", getGames);
