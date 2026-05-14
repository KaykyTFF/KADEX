
/**
 * KADEX - Autocomplete System
 */

let cachePokemons = [];
let cacheMoves = [];

async function carregarListaGlobal() {
    try {
        const [resPkmn, resMove] = await Promise.all([
            fetch(URL_API + "pokemon?limit=10000"),
            fetch(URL_API + "move?limit=2000")
        ]);

        const dadosPkmn = await resPkmn.json();
        const dadosMove = await resMove.json();

        cachePokemons = dadosPkmn.results;
        cacheMoves = dadosMove.results;
    } catch (erro) {
        console.error("Falha ao carregar lista para autocomplete.", erro);
    }
}

carregarListaGlobal();

/**
 * Busca detalhes de um movimento para exibir no autocomplete
 */
async function buscarDadosResumidosMove(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        
        let machineLabel = "MOVE";
        if (data.machines && data.machines.length > 0) {
            const machineInfo = data.machines[data.machines.length - 1];
            if (machineInfo.machine.url.includes('/tm/')) machineLabel = "TM";
            else if (machineInfo.machine.url.includes('/hm/')) machineLabel = "HM";
            else if (machineInfo.machine.url.includes('/tr/')) machineLabel = "TR";
        }

        return {
            name: data.name,
            type: data.type.name,
            category: data.damage_class.name,
            machineLabel: machineLabel
        };
    } catch {
        return null;
    }
}

function attachAutocompleteListeners() {
    if (!inputPokemon) return;

    inputPokemon.oninput = async function() {
        const termoOriginal = this.value.trim().toLowerCase();
        
        // Normalização para busca: substitui espaços por hifens
        const termoBusca = termoOriginal.replace(/\s+/g, '-');
        
        if (!listaSugestoes) return;
        listaSugestoes.innerHTML = "";

        if (termoOriginal.length < 2) {
            listaSugestoes.classList.add("hidden");
            return;
        }

        // Filtrar Pokémon e Movimentos usando o termo normalizado
        const resultadosPkmn = cachePokemons.filter(p => p.name.includes(termoBusca)).slice(0, 5);
        const resultadosMove = cacheMoves.filter(m => m.name.includes(termoBusca)).slice(0, 5);

        if (resultadosPkmn.length === 0 && resultadosMove.length === 0) {
            listaSugestoes.classList.add("hidden");
            return;
        }

        // Renderizar Pokémon
        if (resultadosPkmn.length > 0) {
            const header = document.createElement("li");
            header.className = "px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-gray-50/30 border-b border-gray-50";
            header.textContent = "Pokémon";
            listaSugestoes.appendChild(header);

            resultadosPkmn.forEach(pokemon => {
                const segmentosUrl = pokemon.url.split("/");
                const idPokemon = segmentosUrl[segmentosUrl.length - 2];
                const urlSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idPokemon}.png`;

                const item = document.createElement("li");
                item.className = "flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors group border-b last:border-0 border-gray-50";
                item.innerHTML = `
                    <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-pokedex-red/5 transition-colors">
                        <img src="${urlSprite}" alt="${pokemon.name}" class="w-8 h-8 object-contain transform group-hover:scale-110 transition-transform" loading="lazy">
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-600 group-hover:text-pokedex-red transition-colors capitalize">${pokemon.name.replace(/-/g, ' ')}</span>
                        <span class="text-[10px] font-bold text-gray-300">#${String(idPokemon).padStart(3, '0')}</span>
                    </div>
                    <svg class="ml-auto w-4 h-4 text-gray-200 group-hover:text-pokedex-red transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                `;

                item.addEventListener("click", () => {
                    inputPokemon.value = pokemon.name;
                    listaSugestoes.classList.add("hidden");
                    if (typeof abrirPokemon === 'function') {
                        abrirPokemon(pokemon.name);
                    } else {
                        entidadeBusca(pokemon.name);
                    }
                });
                listaSugestoes.appendChild(item);
            });
        }

        // Renderizar Movimentos
        if (resultadosMove.length > 0) {
            const header = document.createElement("li");
            header.className = "px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 bg-gray-50/30 border-b border-gray-50 mt-1";
            header.textContent = "Movimentos";
            listaSugestoes.appendChild(header);

            const detalhesMoves = await Promise.all(resultadosMove.map(m => buscarDadosResumidosMove(m.url)));

            detalhesMoves.forEach((move) => {
                if (!move) return;

                const item = document.createElement("li");
                item.className = "flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors group border-b last:border-0 border-gray-50";
                
                const catColor = move.category === 'physical' ? 'text-orange-500' : move.category === 'special' ? 'text-blue-500' : 'text-gray-400';

                item.innerHTML = `
                    <div class="w-10 h-10 bg-pokedex-red/5 rounded-xl flex items-center justify-center group-hover:bg-pokedex-red transition-colors overflow-hidden">
                        <span class="text-[9px] font-black text-pokedex-red group-hover:text-white transition-colors">${move.machineLabel}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-600 group-hover:text-pokedex-red transition-colors capitalize">${move.name.replace(/-/g, ' ')}</span>
                        <div class="flex items-center gap-1.5 mt-2">
                            ${renderTypeBadge(move.type, false)}
                            <span class="text-gray-200">•</span>
                            <span class="text-[9px] font-bold capitalize ${catColor}">${move.category}</span>
                        </div>
                    </div>
                    <svg class="ml-auto w-4 h-4 text-gray-200 group-hover:text-pokedex-red transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                `;

                item.addEventListener("click", () => {
                    inputPokemon.value = move.name;
                    listaSugestoes.classList.add("hidden");
                    if (typeof abrirMovimento === 'function') {
                        abrirMovimento(move.name);
                    } else {
                        entidadeBusca(move.name);
                    }
                });
                listaSugestoes.appendChild(item);
            });
        }

        listaSugestoes.classList.remove("hidden");
    };
}

window.attachAutocompleteListeners = attachAutocompleteListeners;

document.addEventListener("click", function(evento) {
    const campoBusca = document.getElementById("campoBusca");
    if (campoBusca && !campoBusca.contains(evento.target) && listaSugestoes) {
        listaSugestoes.classList.add("hidden");
    }
});