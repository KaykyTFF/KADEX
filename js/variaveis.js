const URL_API = "https://pokeapi.co/api/v2/";

// Search and UI Elements (assigned as let to allow re-sync after navbar render)
let inputPokemon       = document.getElementById("inputPokemon");
let btnBuscar          = document.getElementById("btnBuscar");
let listaSugestoes     = document.getElementById("listaSugestoes");

let mensagemErro       = document.getElementById("mensagemErro");
let secaoResultado     = document.getElementById("secaoResultado");
let esqueletoResultado = document.getElementById("esqueletoResultado");

const imgPokemon         = document.getElementById("imgPokemon");
const nomePokemon        = document.getElementById("nomePokemon");
const numeroPokemon      = document.getElementById("numeroPokemon");
const tiposPokemon       = document.getElementById("tiposPokemon");
const alturaPokemon      = document.getElementById("alturaPokemon");
const pesoPokemon        = document.getElementById("pesoPokemon");
const listaMovimentos = document.getElementById("listaMovimentos");
const listaHabilidades   = document.getElementById("listaHabilidades");

let btnMoveLevel = document.getElementById("btnMoveLevel");
let btnMoveTM    = document.getElementById("btnMoveTM");
let btnMoveEgg   = document.getElementById("btnMoveEgg");
let movimentosAtuais = [];


const TODOS_OS_TIPOS = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

/**
 * Synchronizes search-related variables with the current DOM state.
 * Required because renderNavbar injects these elements dynamically.
 */
function syncSearchElements() {
    inputPokemon = document.getElementById("inputPokemon");
    btnBuscar = document.getElementById("btnBuscar");
    listaSugestoes = document.getElementById("listaSugestoes");
    
    // Sync move tabs
    btnMoveLevel = document.getElementById("btnMoveLevel");
    btnMoveTM = document.getElementById("btnMoveTM");
    btnMoveEgg = document.getElementById("btnMoveEgg");

    // Sync result containers
    mensagemErro = document.getElementById("mensagemErro");
    secaoResultado = document.getElementById("secaoResultado");
    esqueletoResultado = document.getElementById("esqueletoResultado");

    // Re-attach event listeners
    if (typeof window.attachSearchListeners === 'function') {
        window.attachSearchListeners();
    }
    if (typeof window.attachAutocompleteListeners === 'function') {
        window.attachAutocompleteListeners();
    }
}

// Export sync function to window
window.syncSearchElements = syncSearchElements;

/**
 * Renderiza um badge de tipo Pokémon consistente
 */
function renderTypeBadge(type, isClickable = true) {
    const tagName = isClickable ? 'a' : 'span';
    const hrefAttr = isClickable ? `href="type.html?name=${type}"` : '';
    return `<${tagName} ${hrefAttr} class="tipo-badge tipo-${type}">${type}</${tagName}>`;
}

/**
 * Renderiza um badge de categoria de movimento consistente
 */
function renderCategoryBadge(category) {
    let icon = '';
    if (category === 'physical') icon = '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>';
    else if (category === 'special') icon = '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>';
    else if (category === 'status') icon = '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-15h2l-3 3 3 3h-2l-3-3 3-3z"/></svg>';
    
    return `<span class="cat-badge cat-${category}">${icon} ${category}</span>`;
}