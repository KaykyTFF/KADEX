const URL_API = "https://pokeapi.co/api/v2/";

const inputPokemon       = document.getElementById("inputPokemon");
const btnBuscar          = document.getElementById("btnBuscar");
const mensagemErro       = document.getElementById("mensagemErro");
const secaoResultado     = document.getElementById("secaoResultado");
const esqueletoResultado = document.getElementById("esqueletoResultado");

const imgPokemon         = document.getElementById("imgPokemon");
const nomePokemon        = document.getElementById("nomePokemon");
const numeroPokemon      = document.getElementById("numeroPokemon");
const tiposPokemon       = document.getElementById("tiposPokemon");
const alturaPokemon      = document.getElementById("alturaPokemon");
const pesoPokemon        = document.getElementById("pesoPokemon");
const listaMovimentos = document.getElementById("listaMovimentos");
const listaHabilidades   = document.getElementById("listaHabilidades");
const listaSugestoes     = document.getElementById("listaSugestoes");

const btnMoveLevel = document.getElementById("btnMoveLevel");
const btnMoveTM    = document.getElementById("btnMoveTM");
const btnMoveEgg   = document.getElementById("btnMoveEgg");
let movimentosAtuais = [];


const TODOS_OS_TIPOS = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
];