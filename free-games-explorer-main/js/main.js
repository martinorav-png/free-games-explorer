const url = 'https://free-to-play-games-database.p.rapidapi.com/api/games';

const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': '58cb87a8ddmsh9a33cd4b5462cfcp16e071jsn0cb1f288b88d',
        'X-RapidAPI-Host': 'free-to-play-games-database.p.rapidapi.com'
    }
};

async function getGames() {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data); // siin saad hiljem ka HTML-i kuvada
    } catch (err) {
        console.error(err);
    }
}

getGames();
