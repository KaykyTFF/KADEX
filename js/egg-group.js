/**
 * KADEX - Egg Group System
 * 
 * ATENÇÃO: Este projeto deve ser aberto através de um servidor local (ex: Live Server do VS Code)
 * e não diretamente pelo arquivo file:///index.html, para que as funcionalidades de navegação
 * e histórico do navegador funcionem corretamente devido às políticas de segurança do browser.
 */

// Configurações e Estado Global
const URL_PARAM = new URLSearchParams(window.location.search);
const EGG_GROUP_NAME = URL_PARAM.get('name');

const DESCRICOES_GRUPOS = {
    'monster': 'Pokémon com aparência forte, reptiliana ou monstruosa.',
    'dragon': 'Pokémon relacionados a dragões, répteis ou criaturas místicas.',
    'water1': 'Pokémon anfíbios ou que vivem tanto em terra quanto na água.',
    'water2': 'Pokémon predominantemente aquáticos, com aparência de peixe.',
    'water3': 'Pokémon aquáticos com aparência de invertebrados, como crustáceos.',
    'field': 'O maior grupo, composto por Pokémon terrestres, mamíferos e bípedes.',
    'fairy': 'Pokémon pequenos, fofos e muitas vezes associados a contos de fadas.',
    'flying': 'Pokémon que possuem asas e a capacidade de voar.',
    'bug': 'Pokémon com aparência de insetos ou artrópodes.',
    'grass': 'Pokémon com características de plantas ou flores.',
    'human-like': 'Pokémon com formato corporal bípede e humanoide.',
    'mineral': 'Pokémon compostos por rochas, cristais ou materiais inorgânicos.',
    'amorphous': 'Pokémon sem uma forma física definida ou com aparência gasosa.',
    'ditto': 'Um grupo exclusivo para Ditto, capaz de se reproduzir com quase qualquer outro grupo.',
    'undiscovered': 'Pokémon que não podem se reproduzir, geralmente bebês ou lendários.'
};

// Elementos do DOM
const esqueletoEggGroup = document.getElementById('esqueletoEggGroup');
const conteudoEggGroup = document.getElementById('conteudoEggGroup');
const listaPokemonTable = document.getElementById('listaPokemonTable');
const listaPokemonMobile = document.getElementById('listaPokemonMobile');

// Inicialização
if (!EGG_GROUP_NAME) {
    window.location.href = 'index.html';
} else {
    if (typeof renderNavbar === 'function') {
        renderNavbar({
            showBackButton: true
        });
    }
    carregarDetalhesGrupo();
}

async function carregarDetalhesGrupo() {
    try {
        const response = await fetch(`${URL_API}egg-group/${EGG_GROUP_NAME}`);
        if (!response.ok) throw new Error('Grupo de ovos não encontrado');
        const data = await response.json();

        // Update Navbar
        if (typeof renderNavbar === 'function') {
            renderNavbar({
                showBackButton: true
            });
        }

        // Preencher dados básicos do grupo
        document.getElementById('eggGroupName').textContent = data.name.replace(/-/g, ' ');
        document.getElementById('eggGroupCount').textContent = `${data.pokemon_species.length} Pokémon`;
        document.getElementById('eggGroupDesc').textContent = DESCRICOES_GRUPOS[data.name] || 'Grupo de ovos usado para definir compatibilidade de reprodução entre Pokémon.';

        // Buscar detalhes de cada Pokémon de forma robusta
        await carregarPokemonDoGrupo(data.pokemon_species);

        // Mostrar conteúdo
        esqueletoEggGroup.classList.add('hidden');
        conteudoEggGroup.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar detalhes do grupo de ovos.');
        window.location.href = 'index.html';
    }
}

/**
 * Busca detalhes de cada Pokémon seguindo o fluxo: Espécie -> Variedade Padrão -> Pokémon
 */
async function carregarPokemonDoGrupo(especies) {
    try {
        // 1. Buscar dados de todas as espécies do grupo
        const speciesPromises = especies.map(esp => 
            fetch(esp.url)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
        );
        const speciesDetails = await Promise.all(speciesPromises);

        // 2. Filtrar espécies válidas e buscar os dados do Pokémon correspondente (variedade padrão)
        const pokemonPromises = speciesDetails.map(spec => {
            if (!spec || !spec.varieties) return null;
            
            // Encontrar a variedade padrão ou usar a primeira disponível
            const defaultVariety = spec.varieties.find(v => v.is_default) || spec.varieties[0];
            if (!defaultVariety) return null;

            return fetch(defaultVariety.pokemon.url)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null);
        });

        const pokemons = await Promise.all(pokemonPromises);

        // 3. Combinar e filtrar dados válidos
        const listaCompleta = [];
        pokemons.forEach((pkmn, index) => {
            const spec = speciesDetails[index];
            if (pkmn && spec) {
                listaCompleta.push({
                    id: pkmn.id,
                    name: pkmn.name,
                    displayName: spec.name,
                    sprite: pkmn.sprites.other['official-artwork'].front_default || pkmn.sprites.front_default,
                    types: pkmn.types.map(t => t.type.name),
                    eggGroups: spec.egg_groups.map(g => g.name)
                });
            }
        });

        // 4. Ordenar por ID Nacional crescente
        listaCompleta.sort((a, b) => a.id - b.id);

        if (listaCompleta.length === 0) {
            exibirEstadoVazio();
        } else {
            renderizarLista(listaCompleta);
        }

    } catch (error) {
        console.error('Erro ao processar lista de Pokémon:', error);
        exibirEstadoVazio();
    }
}

function exibirEstadoVazio() {
    const msg = '<div class="col-span-full py-12 text-center text-gray-400 font-medium italic">Nenhum Pokémon pôde ser carregado para este grupo no momento.</div>';
    listaPokemonTable.innerHTML = `<tr><td colspan="5">${msg}</td></tr>`;
    listaPokemonMobile.innerHTML = msg;
}

function renderizarLista(pokemons) {
    listaPokemonTable.innerHTML = '';
    listaPokemonMobile.innerHTML = '';

    pokemons.forEach(pkmn => {
        const idFormatado = `#${String(pkmn.id).padStart(3, '0')}`;
        
        // Renderizar Linha da Tabela (Desktop)
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50/50 transition-colors group cursor-pointer';
        tr.onclick = (e) => {
            // Se o clique foi em um badge de grupo, não navega para o Pokémon
            if (e.target.closest('.egg-group-badge-small')) return;
            if (typeof abrirPokemon === 'function') {
                abrirPokemon(pkmn.id);
            } else {
                window.location.href = `index.html?search=${pkmn.id}`;
            }
        };

        const tiposHtml = pkmn.types.map(t => renderTypeBadge(t)).join(' ');
        
        const outrosGruposBadges = pkmn.eggGroups
            .filter(g => g !== EGG_GROUP_NAME)
            .map(g => `
                <a href="egg-group.html?name=${g}" class="egg-group-badge-small inline-block bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-bold capitalize transition-all duration-200">
                    ${g.replace(/-/g, ' ')}
                </a>
            `).join(' ');

        tr.innerHTML = `
            <td class="py-4 px-8 text-sm font-bold text-gray-300 group-hover:text-pokedex-red transition-colors">${idFormatado}</td>
            <td class="py-2 px-4">
                <img src="${pkmn.sprite}" alt="${pkmn.displayName}" class="w-12 h-12 object-contain transform group-hover:scale-110 transition-transform">
            </td>
            <td class="py-4 px-4 text-sm font-extrabold capitalize text-gray-700 group-hover:text-pokedex-red transition-colors">${pkmn.displayName.replace(/-/g, ' ')}</td>
            <td class="py-4 px-4 text-center">
                <div class="flex gap-1 justify-center">${tiposHtml}</div>
            </td>
            <td class="py-4 px-8 text-right flex flex-wrap gap-1 justify-end">
                ${outrosGruposBadges || '<span class="text-gray-200">—</span>'}
            </td>
        `;
        listaPokemonTable.appendChild(tr);

        // Renderizar Card (Mobile)
        const card = document.createElement('div');
        card.className = 'py-4 flex items-center gap-4 group cursor-pointer active:bg-gray-50 transition-colors';
        card.onclick = (e) => {
            if (e.target.closest('.egg-group-badge-small')) return;
            if (typeof abrirPokemon === 'function') {
                abrirPokemon(pkmn.id);
            } else {
                window.location.href = `index.html?search=${pkmn.id}`;
            }
        };

        card.innerHTML = `
            <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-2 group-hover:bg-pokedex-red/5 transition-colors">
                <img src="${pkmn.sprite}" alt="${pkmn.displayName}" class="w-full h-full object-contain">
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-bold text-gray-300">${idFormatado}</span>
                    <div class="flex gap-1">${tiposHtml}</div>
                </div>
                <h3 class="text-base font-black capitalize text-gray-700 group-hover:text-pokedex-red transition-colors">${pkmn.displayName.replace(/-/g, ' ')}</h3>
                <div class="flex flex-wrap gap-1 mt-1">
                    ${pkmn.eggGroups.map(g => {
                        const isCurrent = g === EGG_GROUP_NAME;
                        return `
                            <a href="egg-group.html?name=${g}" class="egg-group-badge-small px-1.5 py-0.5 rounded-md text-[9px] font-bold capitalize transition-all ${isCurrent ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'}">
                                ${g.replace(/-/g, ' ')}
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        listaPokemonMobile.appendChild(card);
    });
}