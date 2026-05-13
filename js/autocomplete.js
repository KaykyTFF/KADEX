
let cachePokemons = []; 

async function carregarListaGlobal() {
    try {
        const resposta = await fetch(URL_API + "pokemon?limit=10000");
        const dados = await resposta.json();
        cachePokemons = dados.results;
    } catch (erro) {
        console.error("Falha ao carregar lista para autocomplete.", erro);
    }
}

carregarListaGlobal();

inputPokemon.addEventListener("input", function() {
    const termo = this.value.trim().toLowerCase();
    listaSugestoes.innerHTML = "";

    if (termo.length === 0) {
        listaSugestoes.classList.add("escondido");
        return;
    }

    const resultados = cachePokemons.filter(pokemon => pokemon.name.startsWith(termo)).slice(0, 8);

    if (resultados.length === 0) {
        listaSugestoes.classList.add("escondido");
        return;
    }

    resultados.forEach(function(pokemon) {
        const segmentosUrl = pokemon.url.split("/");
        const idPokemon = segmentosUrl[segmentosUrl.length - 2];
        const urlSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idPokemon}.png`;

        const itemLista = document.createElement("li");
        itemLista.classList.add("sugestao-item");
        
        itemLista.innerHTML = `
            <img src="${urlSprite}" alt="${pokemon.name}" class="sugestao-img" loading="lazy">
            <span class="sugestao-nome">${pokemon.name}</span>
        `;

        itemLista.addEventListener("click", function() {
            inputPokemon.value = pokemon.name;
            listaSugestoes.classList.add("escondido");
            buscarPokemon(); 
        });

        listaSugestoes.appendChild(itemLista);
    });

    listaSugestoes.classList.remove("escondido");
});

document.addEventListener("click", function(evento) {
    if (!document.getElementById("campoBusca").contains(evento.target)) {
        listaSugestoes.classList.add("escondido");
    }
});