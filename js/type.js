/**
 * KADEX - Type Details System
 */

// Configurações e Estado Global
const URL_PARAM = new URLSearchParams(window.location.search);
const TYPE_NAME = URL_PARAM.get('name');

const DESCRICOES_TIPOS = {
    'fire': 'Tipo ofensivo conhecido por golpes fortes e pressão contra Planta, Gelo, Inseto e Aço.',
    'water': 'Tipo versátil com boa presença defensiva e ofensiva.',
    'grass': 'Especialista em status e recuperação, forte contra Água, Terra e Rocha.',
    'electric': 'Alta velocidade e poucos pontos fracos, excelente contra Voadores e Água.',
    'ice': 'Tipo ofensivo poderoso contra Dragões, mas com muitas fraquezas defensivas.',
    'fighting': 'Focado em ataque físico, quebra defesas de Normal, Gelo, Rocha, Aço e Sombrio.',
    'poison': 'Mestre em desgaste, agora essencial para enfrentar o tipo Fada.',
    'ground': 'Imune a eletricidade e devastador contra fogo, rocha e aço.',
    'flying': 'Grande mobilidade e imunidade a terra, essencial para controle de campo.',
    'psychic': 'Focado em ataque especial e efeitos mentais, forte contra Lutador e Venenoso.',
    'bug': 'Evolução rápida e táticas de interrupção, eficaz contra Psíquico e Sombrio.',
    'rock': 'Alta defesa física e resistência a fogo e voadores.',
    'ghost': 'Estratégico e difícil de atingir, imune a Normal e Lutador.',
    'dragon': 'Resistente aos tipos elementais básicos e com os ataques mais devastadores.',
    'dark': 'Imune a Psíquico e mestre em truques, forte contra Fantasmas.',
    'steel': 'O melhor tipo defensivo, resistente a quase tudo.',
    'fairy': 'Imune a Dragões e essencial para o equilíbrio moderno das batalhas.',
    'normal': 'Versátil e equilibrado, com acesso a uma enorme variedade de movimentos.',
};

const GRADIENTES_TIPOS = {
    'normal': 'from-gray-200 to-gray-400',
    'fire': 'from-orange-400 to-red-500',
    'water': 'from-blue-400 to-blue-600',
    'grass': 'from-green-400 to-emerald-600',
    'electric': 'from-yellow-300 to-yellow-500',
    'ice': 'from-cyan-300 to-blue-400',
    'fighting': 'from-red-600 to-orange-800',
    'poison': 'from-purple-400 to-indigo-600',
    'ground': 'from-yellow-600 to-yellow-800',
    'flying': 'from-indigo-300 to-sky-400',
    'psychic': 'from-pink-400 to-rose-600',
    'bug': 'from-lime-500 to-green-700',
    'rock': 'from-gray-400 to-gray-600',
    'ghost': 'from-purple-700 to-indigo-900',
    'dragon': 'from-indigo-500 to-purple-700',
    'dark': 'from-gray-700 to-black',
    'steel': 'from-gray-400 to-slate-500',
    'fairy': 'from-pink-200 to-rose-400',
};

// Elementos do DOM
const esqueletoTipo = document.getElementById('esqueletoTipo');
const conteudoTipo = document.getElementById('conteudoTipo');
const listaPokemonTable = document.getElementById('listaPokemonTable');
const listaPokemonMobile = document.getElementById('listaPokemonMobile');

// Inicialização
if (!TYPE_NAME) {
    window.location.href = 'index.html';
} else {
    if (typeof renderNavbar === 'function') {
        renderNavbar({
            showBackButton: true
        });
    }
    carregarDetalhesTipo();
}

async function carregarDetalhesTipo() {
    try {
        const response = await fetch(`${URL_API}type/${TYPE_NAME}`);
        if (!response.ok) throw new Error('Tipo não encontrado');
        const data = await response.json();

        // Update Navbar
        if (typeof renderNavbar === 'function') {
            renderNavbar({
                showBackButton: true
            });
        }

        // Atualizar UI básica
        document.getElementById('typeName').textContent = data.name.replace(/-/g, ' ');
        document.getElementById('typeCount').textContent = `${data.pokemon.length} Pokémon`;
        document.getElementById('typeDesc').textContent = DESCRICOES_TIPOS[data.name] || 'Tipo Pokémon usado para definir vantagens, resistências e fraquezas em batalha.';
        
        // Estilização dinâmica baseada no tipo
        const typeIconLarge = document.getElementById('typeIconLarge');
        typeIconLarge.className = `inline-flex items-center justify-center w-24 h-24 rounded-full text-white shadow-xl mb-2 relative z-10 tipo-${data.name}`;
        typeIconLarge.innerHTML = `<span class="text-xl font-black uppercase tracking-tighter">${data.name.substring(0, 3)}</span>`;
        
        // Aplicar brilho de sotaque localizado ao Hero Card com fluxo VERTICAL
        const typeHeroAccent = document.getElementById('typeHeroAccent');
        if (typeHeroAccent) {
            const gradienteClasses = GRADIENTES_TIPOS[data.name] || 'from-gray-200 to-gray-400';
            // Usa bg-gradient-to-b para fluxo vertical (top to bottom)
            typeHeroAccent.className = `absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none transition-all duration-1000 bg-gradient-to-b ${gradienteClasses}`;
        }

        // Renderizar relações de dano
        renderizarRelacoesDano(data.damage_relations);

        // Carregar Pokémon do tipo
        await carregarPokemonDoTipo(data.pokemon);

        // Mostrar conteúdo
        esqueletoTipo.classList.add('hidden');
        conteudoTipo.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar detalhes do tipo.');
        window.location.href = 'index.html';
    }
}

function renderizarRelacoesDano(relations) {
    const offensiveContainer = document.getElementById('offensiveRelations');
    const defensiveContainer = document.getElementById('defensiveRelations');

    // Offensive (Ataque)
    const offensiveData = [
        { label: 'Super efetivo contra:', types: relations.double_damage_to, color: 'text-green-500' },
        { label: 'Pouco efetivo contra:', types: relations.half_damage_to, color: 'text-orange-500' },
        { label: 'Sem efeito contra:', types: relations.no_damage_to, color: 'text-gray-400' }
    ];

    offensiveContainer.innerHTML = offensiveData.map(group => `
        <div class="space-y-3">
            <h5 class="text-xs font-bold uppercase tracking-widest ${group.color}">${group.label}</h5>
            <div class="flex flex-wrap gap-2">
                ${group.types.length > 0 ? group.types.map(t => renderTypeBadge(t.name)).join('') : '<span class="text-xs italic text-gray-300">Nenhum</span>'}
            </div>
        </div>
    `).join('');

    // Defensive (Defesa)
    const defensiveData = [
        { label: 'Recebe dano reduzido de:', types: relations.half_damage_from, color: 'text-green-500' },
        { label: 'Recebe dano dobrado de:', types: relations.double_damage_from, color: 'text-red-500' },
        { label: 'É imune a:', types: relations.no_damage_from, color: 'text-blue-500' }
    ];

    defensiveContainer.innerHTML = defensiveData.map(group => `
        <div class="space-y-3">
            <h5 class="text-xs font-bold uppercase tracking-widest ${group.color}">${group.label}</h5>
            <div class="flex flex-wrap gap-2">
                ${group.types.length > 0 ? group.types.map(t => renderTypeBadge(t.name)).join('') : '<span class="text-xs italic text-gray-300">Nenhum</span>'}
            </div>
        </div>
    `).join('');
}

async function carregarPokemonDoTipo(pokemonList) {
    try {
        // Limitar para evitar overload se necessário, mas Type endpoint traz Pokémons direto
        // Precisamos dos detalhes (id, sprite, tipos)
        
        const BATCH_SIZE = 40; // Carregar em lotes para performance
        const allPokemonDetailed = [];
        
        // Vamos carregar os primeiros 100 para ser rápido, ou todos em lotes
        const listToFetch = pokemonList; 

        const fetchDetailed = async (pkmn) => {
            try {
                const res = await fetch(pkmn.pokemon.url);
                if (!res.ok) return null;
                return await res.json();
            } catch {
                return null;
            }
        };

        // Carregamento paralelo controlado
        for (let i = 0; i < listToFetch.length; i += BATCH_SIZE) {
            const batch = listToFetch.slice(i, i + BATCH_SIZE);
            const detailedBatch = await Promise.all(batch.map(fetchDetailed));
            allPokemonDetailed.push(...detailedBatch.filter(p => p !== null));
        }

        // Ordenar por ID Nacional
        allPokemonDetailed.sort((a, b) => a.id - b.id);

        renderizarListaPokemon(allPokemonDetailed);

    } catch (error) {
        console.error('Erro ao carregar Pokémon:', error);
        const msg = '<div class="col-span-full py-12 text-center text-gray-400 font-medium italic">Erro ao carregar lista de Pokémon.</div>';
        listaPokemonTable.innerHTML = `<tr><td colspan="4">${msg}</td></tr>`;
        listaPokemonMobile.innerHTML = msg;
    }
}

function renderizarListaPokemon(pokemons) {
    listaPokemonTable.innerHTML = '';
    listaPokemonMobile.innerHTML = '';

    pokemons.forEach(pkmn => {
        const idFormatado = `#${String(pkmn.id).padStart(3, '0')}`;
        const sprite = pkmn.sprites.other['official-artwork'].front_default || pkmn.sprites.front_default;
        const tiposHtml = pkmn.types.map(t => renderTypeBadge(t.type.name)).join(' ');

        // Desktop Row
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors group cursor-pointer';
        tr.onclick = (e) => {
            if (e.target.closest('.tipo-badge')) return;
            if (typeof abrirPokemon === 'function') {
                abrirPokemon(pkmn.id);
            } else {
                window.location.href = `index.html?search=${pkmn.id}`;
            }
        };

        tr.innerHTML = `
            <td class="py-4 px-8 text-sm font-bold text-gray-300 group-hover:text-pokedex-red transition-colors">${idFormatado}</td>
            <td class="py-2 px-4">
                <img src="${sprite}" alt="${pkmn.name}" class="w-12 h-12 object-contain transform group-hover:scale-110 transition-transform">
            </td>
            <td class="py-4 px-4 text-sm font-extrabold capitalize text-gray-700 group-hover:text-pokedex-red transition-colors">${pkmn.name.replace(/-/g, ' ')}</td>
            <td class="py-4 px-8 text-right flex gap-1 justify-end">${tiposHtml}</td>
        `;
        listaPokemonTable.appendChild(tr);

        // Mobile Card
        const card = document.createElement('div');
        card.className = 'py-4 flex items-center gap-4 group cursor-pointer active:bg-gray-50 transition-colors';
        card.onclick = (e) => {
            if (e.target.closest('.tipo-badge')) return;
            if (typeof abrirPokemon === 'function') {
                abrirPokemon(pkmn.id);
            } else {
                window.location.href = `index.html?search=${pkmn.id}`;
            }
        };

        card.innerHTML = `
            <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-2 group-hover:bg-pokedex-red/5 transition-colors">
                <img src="${sprite}" alt="${pkmn.name}" class="w-full h-full object-contain">
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-bold text-gray-300">${idFormatado}</span>
                    <div class="flex gap-1">${tiposHtml}</div>
                </div>
                <h3 class="text-base font-black capitalize text-gray-700 group-hover:text-pokedex-red transition-colors">${pkmn.name.replace(/-/g, ' ')}</h3>
            </div>
        `;
        listaPokemonMobile.appendChild(card);
    });
}