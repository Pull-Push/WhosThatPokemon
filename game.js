const state = {
    answer: null,
    maxGuesses: 8,
    guessesLeft: 8,
    gameOver: false,
    won: false,
    allPokemon: [],
};

const pokemonImg     = document.getElementById('pokemon-img');
const feedbackEl     = document.getElementById('feedback');
const badgeContainer = document.getElementById('badge-container');
const guessInput     = document.getElementById('guess-input');
const guessBtn       = document.getElementById('guess-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const autocompleteList = document.getElementById('autocomplete-list')


async function fetchAllPokemonNames(){
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1250')
    if (!response.ok){
        throw new Error(`Failed to load Pokemon list: ${response.status}`)
    }
    const data = await response.json()
    state.allPokemon = data.results.map(pokemon => pokemon.name)
}

function showSuggestions(query){
    autocompleteList.innerHTML = '';

    if (!query || query.length < 2){
        autocompleteList.style.display = 'none';
        return;
    }

    const matches = state.allPokemon
        .filter(name =>name.startsWith(query.toLowerCase()))
        .slice(0,6)

    if (matches.length === 0){
        autocompleteList.style.display === 'none'
        return;
    }

    matches.forEach(name =>{
        const li = document.createElement('li');
            li.textContent = name;

            li.addEventListener('click', () =>{
                guessInput.value = name;
                autocompleteList.style.display = 'none'
                guessInput.focus();
            });
            autocompleteList.appendChild(li)
    })
    autocompleteList.style.display = 'block'
}





const BADGE_NAMES = ['Boulder','Cascade','Thunder','Rainbow','Soul','Marsh','Volcano','Earth'];
const BADGES = Array.from({ length: 8 }, (_, i) => ({
    name: BADGE_NAMES[i],
    img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${i + 1}.png`
}));

function render() {

    badgeContainer.innerHTML = '';
    BADGES.forEach((badge, index) => {
        const img = document.createElement('img');
        img.src = badge.img;
        img.alt = badge.name;
        img.classList.add('badge');
        if (index >= state.guessesLeft) {
            img.classList.add('badge--lost');
        }
        badgeContainer.appendChild(img);
    });

    pokemonImg.style.filter = state.gameOver ? 'none' : 'brightness(0)';

    if (state.gameOver && state.won) {
        feedbackEl.textContent = `✅ Yes! It's ${state.answer.name.toUpperCase()}!`;
    } else if (state.gameOver && !state.won) {
        feedbackEl.textContent = `❌ It was ${state.answer.name.toUpperCase()}!`;
    } else {
        feedbackEl.textContent = state.guessesLeft === state.maxGuesses ? "Who's that Pokémon?" : `❌ Nope! ${state.guessesLeft} badge${state.guessesLeft !== 1 ? 's' : ''} left.`;
    }

    playAgainBtn.style.display = state.gameOver ? 'block' : 'none';
    guessInput.disabled = state.gameOver;
    guessBtn.disabled = state.gameOver;
}

async function fetchRandomPokemon() {
  const randomId = Math.floor(Math.random() * 151) + 1;
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
    }
    const data = await response.json();

    if(!data.name || !data.sprites?.front_default){
        throw new Error('Incomplete Pokemon data received')
    }

    return {
        name: data.name,
        sprite: data.sprites.front_default,
        id: data.id,
    };
}

async function startGame() {
    feedbackEl.textContent = 'Loading...';
    guessInput.disabled = true;
    guessBtn.disabled = true;

    try {
        if(state.allPokemon.length === 0){
            await fetchAllPokemonNames()
        }
        state.answer      = await fetchRandomPokemon();
        state.guessesLeft = state.maxGuesses;
        state.gameOver    = false;
        state.won         = false;

        pokemonImg.src = state.answer.sprite;
        render();

        guessInput.value = '';
        guessInput.focus();
    } catch (error) {
        feedbackEl.textContent = "Could not load Pokemon. Try Again!"
        console.error('Failed to fetch Pokemon:', error)

        playAgainBtn.style.display = 'block'
    }

}

function handleGuess() {
    if (state.gameOver) return;

    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;

    if (guess === state.answer.name) {
        state.won = true;
        state.gameOver = true;
    } else {
        state.guessesLeft--;
        if (state.guessesLeft === 0) {
        state.gameOver = true;
        state.won = false;
    }
}

    render();
    guessInput.value = '';
}

guessBtn.addEventListener('click', handleGuess);
guessInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGuess();
});

guessInput.addEventListener('input', (e) =>{
    showSuggestions(e.target.value)
});

guessInput.addEventListener('blur', () =>{
    setTimeout(() =>{
        autocompleteList.style.display = 'none'
    }, 150)
})

playAgainBtn.addEventListener('click', startGame);

startGame();