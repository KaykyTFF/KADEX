document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const abilityName = params.get('name');

    if (!abilityName) {
        window.location.href = 'index.html';
        return;
    }

    if (typeof renderNavbar === 'function') {
        renderNavbar({
            showBackButton: true
        });
    }

    await carregarDetalhesHabilidade(abilityName);
});

async function carregarDetalhesHabilidade(nome) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const contentState = document.getElementById('contentState');
    const nomeHabilidade = document.getElementById('nomeHabilidade');
    const badgeGeracao = document.getElementById('badgeGeracao');
    const efeitoCurto = document.getElementById('efeitoCurto');
    const efeitoLongo = document.getElementById('efeitoLongo');
    const listaPokemons = document.getElementById('listaPokemonsHabilidade');

    try {
        const resposta = await fetch(`${URL_API}ability/${nome}`);
        if (!resposta.ok) throw new Error('Habilidade não encontrada');
        const dados = await resposta.json();

        // Update Navbar
        if (typeof renderNavbar === 'function') {
            renderNavbar({
                showBackButton: true
            });
        }

        // Nome e Geração
        if (nomeHabilidade) nomeHabilidade.textContent = dados.name.replace(/-/g, ' ');
        if (badgeGeracao) {
            badgeGeracao.textContent = dados.generation.name.replace('generation-', 'Gen ');
            badgeGeracao.classList.remove('hidden');
        }

        // Efeitos usando os novos helpers globais
        efeitoCurto.textContent = obterTextoPorIdioma(dados.effect_entries, "short_effect");
        efeitoLongo.textContent = obterTextoPorIdioma(dados.effect_entries, "effect");

        // Lista de Pokémon
        listaPokemons.innerHTML = "";
        
        // Vamos buscar os dados básicos dos Pokémon em paralelo para performance
        const promessasPokemon = dados.pokemon.map(p => fetch(p.pokemon.url).then(res => res.json()));
        const pokemonsDados = await Promise.all(promessasPokemon);

        pokemonsDados.forEach((pk, index) => {
            const infoHabilidade = dados.pokemon[index];
            const tr = document.createElement("tr");
            tr.className = "hover:bg-gray-50/50 transition-colors group cursor-pointer";
            tr.onclick = () => {
                if (typeof abrirPokemon === 'function') {
                    abrirPokemon(pk.name);
                } else {
                    window.location.href = `index.html?search=${pk.name}`;
                }
            };

            const idFormatado = "#" + String(pk.id).padStart(4, "0");
            const sprite = pk.sprites.front_default || pk.sprites.other['official-artwork'].front_default;
            const tipos = pk.types.map(t => renderTypeBadge(t.type.name, false)).join(' ');
            
            const slotTag = infoHabilidade.is_hidden 
                ? '<span class="px-2 py-0.5 bg-pokedex-red/10 text-pokedex-red text-[9px] font-black uppercase rounded">Hidden</span>'
                : `<span class="px-2 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-black uppercase rounded">Slot ${infoHabilidade.slot}</span>`;

            tr.innerHTML = `
                <td class="py-4 px-4 text-center text-xs font-bold text-gray-300 group-hover:text-pokedex-red transition-colors">${idFormatado}</td>
                <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                        <img src="${sprite}" alt="${pk.name}" class="w-10 h-10 object-contain transform group-hover:scale-110 transition-transform">
                        <span class="text-sm font-extrabold capitalize text-gray-700">${pk.name.replace(/-/g, ' ')}</span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <div class="flex gap-1">${tipos}</div>
                </td>
                <td class="py-4 px-4 text-center">
                    ${slotTag}
                </td>
            `;
            listaPokemons.appendChild(tr);
        });

        // Toggle visibility
        loadingState.classList.add('hidden');
        contentState.classList.remove('hidden');

    } catch (erro) {
        console.error(erro);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}
