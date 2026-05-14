/**
 * KADEX - Team Analyzer Controller
 */

// Estado Global do Time (Array fixo de 6 posições)
let pokemonTeam = [null, null, null, null, null, null];
let selectedSlotIndex = null;
const MAX_TEAM_SIZE = 6;
const LOCAL_STORAGE_KEY = 'kadex_team';

// Cache de tipos para evitar requisições repetidas
const typeCache = {};

// Mapeamento de tipos para análise ofensiva
const OFFENSIVE_COVERAGE = {
    normal: [],
    fire: ['grass', 'ice', 'bug', 'steel'],
    water: ['fire', 'ground', 'rock'],
    grass: ['water', 'ground', 'rock'],
    electric: ['water', 'flying'],
    ice: ['grass', 'ground', 'flying', 'dragon'],
    fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
    poison: ['grass', 'fairy'],
    ground: ['fire', 'electric', 'poison', 'rock', 'steel'],
    flying: ['grass', 'fighting', 'bug'],
    psychic: ['fighting', 'poison'],
    bug: ['grass', 'psychic', 'dark'],
    rock: ['fire', 'ice', 'flying', 'bug'],
    ghost: ['psychic', 'ghost'],
    dragon: ['dragon'],
    dark: ['psychic', 'ghost'],
    steel: ['ice', 'rock', 'fairy'],
    fairy: ['fighting', 'dragon', 'dark']
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar Navbar
    if (typeof renderNavbar === 'function') {
        renderNavbar({
            showBackButton: true,
            pageTitle: 'Team Analyzer',
            showTitle: true,
            searchPlaceholder: 'Adicionar Pokémon ao time...'
        });
    }

    // 2. Sincronizar elementos e carregar time salvo
    syncSearchElements();
    
    // Configurar o input da Navbar para abrir o modal se necessário, 
    // ou deixá-lo funcionar como atalho para o primeiro slot vazio.
    overrideSearchForTeam();

    await loadSavedTeam();
    
    // 3. Renderizar o estado inicial
    renderTeamGrid();

    // 4. Configurar Listeners do Modal
    setupModalListeners();

    // 5. Footer padrão
    if (typeof renderFooter === 'function') {
        renderFooter();
    }
});

/**
 * Sobrescreve a função entidadeBusca global para abrir o modal ou adicionar ao primeiro slot vazio
 */
function overrideSearchForTeam() {
    window.entidadeBusca = async (parametroOpcional) => {
        const input = document.getElementById('inputPokemon');
        const termo = (typeof parametroOpcional === "string") ? parametroOpcional : input.value.trim();
        
        if (!termo) {
            openSearchModal();
            return;
        }

        // Se houver um termo, tenta adicionar ao primeiro slot vazio
        const emptyIndex = pokemonTeam.findIndex(p => p === null);
        if (emptyIndex === -1) {
            alert("O time já possui 6 Pokémon.");
            return;
        }

        const query = termo.toLowerCase().trim().replace(/\s+/g, '-');
        try {
            const res = await fetch(`${URL_API}pokemon/${query}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            await addPokemonToSlot(data, emptyIndex);
            if (input) input.value = "";
        } catch (e) {
            // Se falhar a busca direta, abre o modal com o termo
            openSearchModal(termo);
        }
    };
}

/**
 * Gerenciamento do Modal
 */
function openSearchModal(initialQuery = '', slotIndex = null) {
    selectedSlotIndex = slotIndex;
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('modalSearchInput');
    const results = document.getElementById('modalResults');
    const status = document.getElementById('modalStatus');
    const statusText = document.getElementById('modalStatusText');
    const statusIcon = document.getElementById('modalStatusIcon');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    input.value = initialQuery;
    input.focus();
    
    results.innerHTML = '';
    status.classList.remove('hidden');
    statusIcon.innerHTML = '<svg class="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>';
    statusText.textContent = 'Digite pelo menos 2 caracteres para buscar.';

    if (initialQuery && initialQuery.length >= 2) {
        handleModalSearch(initialQuery);
    }
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    selectedSlotIndex = null;
}

function setupModalListeners() {
    const input = document.getElementById('modalSearchInput');
    let debounceTimer;

    input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        const resultsContainer = document.getElementById('modalResults');
        const status = document.getElementById('modalStatus');
        const statusText = document.getElementById('modalStatusText');

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            status.classList.remove('hidden');
            statusText.textContent = 'Digite pelo menos 2 caracteres para buscar.';
            return;
        }

        debounceTimer = setTimeout(() => handleModalSearch(query), 300);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = input.value.trim();
            if (query.length >= 2) handleModalSearch(query, true);
        }
    });
}

async function handleModalSearch(query, isEnterPressed = false) {
    const resultsContainer = document.getElementById('modalResults');
    const status = document.getElementById('modalStatus');
    const statusText = document.getElementById('modalStatusText');
    const statusIcon = document.getElementById('modalStatusIcon');
    
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, '-');

    // 1. Filtragem Local (Rápida)
    const matches = (window.cachePokemons || []).filter(p => 
        p.name.includes(normalizedQuery) || 
        p.url.split('/').filter(Boolean).pop() === normalizedQuery
    ).slice(0, 8);

    if (matches.length === 0) {
        resultsContainer.innerHTML = '';
        status.classList.remove('hidden');
        statusText.textContent = 'Pokémon não encontrado.';
        statusIcon.innerHTML = '<svg class="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>';
        return;
    }

    // Se pressionou Enter e tem um match exato, ou apenas 1 match, adiciona direto
    if (isEnterPressed) {
        const exactMatch = matches.find(m => m.name === normalizedQuery || m.url.split('/').filter(Boolean).pop() === normalizedQuery) || matches[0];
        if (exactMatch) {
            selectPokemonFromModal(exactMatch.name);
            return;
        }
    }

    // 2. Busca Detalhes (Async)
    status.classList.remove('hidden');
    statusText.textContent = 'Buscando detalhes...';
    statusIcon.innerHTML = '<div class="w-8 h-8 border-4 border-pokedex-red/20 border-t-pokedex-red rounded-full animate-spin"></div>';

    try {
        const details = await Promise.all(matches.map(async (m) => {
            const res = await fetch(m.url);
            return res.ok ? await res.json() : null;
        }));

        const validDetails = details.filter(d => d !== null);
        
        if (validDetails.length > 0) {
            status.classList.add('hidden');
            renderModalResults(validDetails);
        } else {
            throw new Error();
        }
    } catch (e) {
        resultsContainer.innerHTML = '';
        status.classList.remove('hidden');
        statusText.textContent = 'Erro ao carregar resultados.';
    }
}

/**
 * Normaliza os tipos de um Pokémon para um array de strings
 */
function normalizePokemonTypes(pkmn) {
    if (!pkmn || !pkmn.types) return [];
    return pkmn.types.map(t => {
        if (typeof t === 'string') return t;
        if (t.type && t.type.name) return t.type.name;
        if (t.name) return t.name;
        return null;
    }).filter(Boolean);
}

function renderModalResults(pokemons) {
    const resultsContainer = document.getElementById('modalResults');
    resultsContainer.innerHTML = pokemons.map(pkmn => {
        const types = normalizePokemonTypes(pkmn);
        const typeBadges = types.map(typeName => 
            `<span class="tipo-badge tipo-${typeName}">${typeName}</span>`
        ).join('');

        return `
        <div onclick="selectPokemonFromModal('${pkmn.name}')" class="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-2xl cursor-pointer transition-all border border-gray-100 hover:border-pokedex-red/30 group shadow-sm hover:shadow-md mb-2">
            <div class="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center p-2 group-hover:bg-white transition-colors border border-gray-100">
                <img src="${pkmn.sprites.front_default || pkmn.sprites.other['official-artwork'].front_default}" alt="${pkmn.name}" class="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300">
            </div>
            <div class="flex-grow overflow-hidden">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] font-black text-gray-400 group-hover:text-pokedex-red/50 transition-colors">#${String(pkmn.id).padStart(3, '0')}</span>
                    <h4 class="text-lg font-black capitalize text-gray-700 group-hover:text-gray-900 transition-colors truncate">${pkmn.name.replace(/-/g, ' ')}</h4>
                </div>
                <div class="flex flex-wrap gap-1.5 mt-1">
                    ${typeBadges}
                </div>
            </div>
            <button class="w-10 h-10 shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-pokedex-red group-hover:text-white transition-all duration-300 border border-gray-100 group-hover:border-pokedex-red shadow-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
            </button>
        </div>
    `}).join('');
}

async function selectPokemonFromModal(name) {
    try {
        const res = await fetch(`${URL_API}pokemon/${name}`);
        const data = await res.json();
        const index = selectedSlotIndex !== null ? selectedSlotIndex : pokemonTeam.findIndex(p => p === null);
        
        if (index !== -1) {
            await addPokemonToSlot(data, index);
            closeSearchModal();
        } else {
            alert("O time já possui 6 Pokémon.");
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * Adiciona um Pokémon a um slot específico
 */
async function addPokemonToSlot(data, index) {
    // Verificar se já existe no time em outro slot
    const isDuplicate = pokemonTeam.some((p, i) => p && p.id === data.id && i !== index);
    if (isDuplicate) {
        alert("Este Pokémon já está no time.");
        return;
    }

    const pokemonMember = {
        id: data.id,
        name: data.name,
        sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        types: data.types.map(t => t.type.name),
        stats: data.stats.map(s => ({
            name: s.stat.name,
            value: s.base_stat
        }))
    };

    pokemonTeam[index] = pokemonMember;
    saveTeam();
    renderTeamGrid();
    await performAnalysis();
}

/**
 * Persistência
 */
function saveTeam() {
    const data = pokemonTeam.map(p => p ? p.name : null);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

async function loadSavedTeam() {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return;

    try {
        const names = JSON.parse(saved);
        const promises = names.map(name => name ? fetch(`${URL_API}pokemon/${name}`).then(res => res.json()) : Promise.resolve(null));
        const results = await Promise.all(promises);
        
        pokemonTeam = results.map(data => data ? {
            id: data.id,
            name: data.name,
            sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
            types: data.types.map(t => t.type.name),
            stats: data.stats.map(s => ({
                name: s.stat.name,
                value: s.base_stat
            }))
        } : null);

        if (pokemonTeam.some(p => p !== null)) {
            await performAnalysis();
        }
    } catch (error) {
        console.error("Erro ao carregar time:", error);
    }
}

/**
 * UI Rendering
 */
function renderTeamGrid() {
    const teamGrid = document.getElementById('teamGrid');
    const btnClearTeam = document.getElementById('btnClearTeam');
    if (!teamGrid) return;
    
    teamGrid.innerHTML = '';

    const hasPokemon = pokemonTeam.some(p => p !== null);
    const firstEmptyIndex = pokemonTeam.findIndex(p => p === null);

    // Garantir que pokemonTeam tenha sempre 6 posições
    const displayTeam = Array.isArray(pokemonTeam) ? pokemonTeam.slice(0, 6) : [null, null, null, null, null, null];
    while (displayTeam.length < 6) displayTeam.push(null);

    displayTeam.forEach((pkmn, i) => {
        const slot = document.createElement('div');
        
        if (pkmn) {
            slot.className = 'team-slot-filled cursor-default';
            const types = normalizePokemonTypes(pkmn);
            const typeBadges = types.map(t => `<span class="tipo-badge tipo-${t}">${t}</span>`).join('');
            
            slot.innerHTML = `
                <button class="remove-btn" onclick="removePokemonFromSlot(${i}, event)" title="Remover">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div class="relative w-24 h-24 mb-3 cursor-pointer group-hover:scale-105 transition-transform" onclick="abrirPokemon('${pkmn.name}')">
                    <img src="${pkmn.sprite}" alt="${pkmn.name}" class="w-full h-full object-contain">
                </div>
                <div class="text-center w-full flex-grow flex flex-col justify-end">
                    <span class="text-[9px] font-bold text-gray-300 uppercase tracking-widest">#${String(pkmn.id || 0).padStart(3, '0')}</span>
                    <h3 class="text-sm font-black capitalize text-gray-700 truncate mb-2">${pkmn.name.replace(/-/g, ' ')}</h3>
                    <div class="flex flex-wrap gap-1.5 justify-center mb-auto">
                        ${typeBadges}
                    </div>
                    <button onclick="openSearchModal('', ${i})" class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-pokedex-red transition-colors mt-3">Trocar</button>
                </div>
            `;
        } else {
            const isFirstEmpty = i === firstEmptyIndex;
            const highlightClasses = isFirstEmpty 
                ? 'border-pokedex-red/50 text-pokedex-red/80 bg-pokedex-red/5' 
                : 'border-gray-200 text-gray-300 bg-white/30';
                
            slot.className = `team-slot-empty group ${highlightClasses}`;
            slot.onclick = () => openSearchModal('', i);
            
            const iconBg = isFirstEmpty ? 'bg-pokedex-red/10' : 'bg-gray-50';
            const iconColor = isFirstEmpty ? 'text-pokedex-red' : 'text-gray-200';
            
            slot.innerHTML = `
                <div class="w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-3 group-hover:bg-pokedex-red/10 transition-colors">
                    <svg class="w-6 h-6 ${iconColor} group-hover:text-pokedex-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <span class="text-xs font-bold uppercase tracking-widest group-hover:text-pokedex-red transition-colors">Adicionar</span>
            `;
        }
        teamGrid.appendChild(slot);
    });

    // Controle de visibilidade das seções
    const analysisSection = document.getElementById('analysisSection');
    const emptyState = document.getElementById('emptyTeamMessage');
    
    if (hasPokemon) {
        analysisSection.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (btnClearTeam) btnClearTeam.disabled = false;
    } else {
        analysisSection.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        if (btnClearTeam) btnClearTeam.disabled = true;
    }
}

function removePokemonFromSlot(index, event) {
    if (event) event.stopPropagation();
    pokemonTeam[index] = null;
    saveTeam();
    renderTeamGrid();
    if (pokemonTeam.some(p => p !== null)) {
        performAnalysis();
    } else {
        document.getElementById('analysisSection').classList.add('hidden');
    }
}

function clearTeam() {
    if (pokemonTeam.every(p => p === null)) return;
    if (confirm("Deseja limpar todo o time?")) {
        pokemonTeam = [null, null, null, null, null, null];
        saveTeam();
        renderTeamGrid();
    }
}

/**
 * Análise do Time (Mantida do anterior, ajustada para lidar com slots vazios)
 */
async function performAnalysis() {
    const activePokemon = pokemonTeam.filter(p => p !== null);
    if (activePokemon.length === 0) return;

    const defensiveData = await calculateDefensiveAnalysis(activePokemon);
    renderDefensiveAnalysis(defensiveData);
    
    renderOffensiveAnalysis(activePokemon);
    renderStatsAnalysis(activePokemon);
    renderStrategicSuggestions(defensiveData, activePokemon);

    // Novas Análises Avançadas
    renderPokemonRoles(activePokemon);
    renderTeamScore(defensiveData, activePokemon);
    renderUsageSituations(activePokemon);
    renderTeamSynergy(defensiveData, activePokemon);
    renderMatchupHelper(defensiveData, activePokemon);
}

/**
 * Identifica o papel tático de cada Pokémon baseado em stats e tipos
 */
function determinePokemonRole(pkmn) {
    const stats = {};
    pkmn.stats.forEach(s => stats[s.name] = s.value);
    
    const hp = stats.hp;
    const atk = stats.attack;
    const def = stats.defense;
    const spa = stats['special-attack'];
    const spd = stats['special-defense'];
    const spe = stats.speed;

    const isVeryFast = spe >= 115;
    const isFast = spe >= 95;
    const isPhysicallyStrong = atk >= 110;
    const isSpeciallyStrong = spa >= 110;
    const isPhysicallyDefensive = def >= 110;
    const isSpeciallyDefensive = spd >= 110;
    const isBulky = hp >= 100;
    const isFragile = hp <= 70 && def <= 70 && spd <= 70;

    // Sweeper: Rápido e forte
    if (isFast && (atk >= 100 || spa >= 100)) {
        if (isVeryFast && isFragile) return {
            name: "Revenge Killer / Glass Cannon",
            explanation: "Extremamente rápido e ofensivo, mas não aguenta muitos golpes.",
            strengths: "Velocidade superior, alto dano imediato.",
            weaknesses: "Defesas muito baixas, vulnerável a golpes de prioridade.",
            situation: "Use para entrar após um aliado ser nocauteado e finalizar o oponente."
        };
        return {
            name: "Sweeper",
            explanation: "Focado em derrotar vários Pokémon do oponente em sequência.",
            strengths: "Bom equilíbrio de velocidade e poder ofensivo.",
            weaknesses: "Pode ser parado por Walls especializadas.",
            situation: "Use no final do jogo (late-game) para limpar o time adversário enfraquecido."
        };
    }

    // Walls e Tanks
    if (isPhysicallyDefensive && isSpeciallyDefensive) return {
        name: "Mixed Wall / Tank",
        explanation: "Um pilar defensivo que aguenta golpes de qualquer natureza.",
        strengths: "Extrema durabilidade, difícil de derrubar sem ataques super efetivos.",
        weaknesses: "Geralmente causa pouco dano e é lento.",
        situation: "Use para absorver ataques quando precisar trocar ou curar outros membros."
    };

    if (isPhysicallyDefensive || (isBulky && def >= 90)) {
        if (atk >= 90) return {
            name: "Tank Físico",
            explanation: "Aguenta bem golpes físicos e consegue revidar com força.",
            strengths: "Boa sobrevivência contra lutadores e atacantes de contato.",
            weaknesses: "Vulnerável a ataques especiais e ataques super efetivos.",
            situation: "Use contra atacantes físicos para puni-los enquanto sobrevive."
        };
        return {
            name: "Defensive Wall",
            explanation: "Especialista puro em defesa física.",
            strengths: "Excelente para parar atacantes físicos perigosos.",
            weaknesses: "Muito vulnerável no lado especial.",
            situation: "Troque para este Pokémon quando prever um forte ataque físico."
        };
    }

    if (isSpeciallyDefensive || (isBulky && spd >= 90)) {
        if (spa >= 90) return {
            name: "Tank Especial",
            explanation: "Resiste a ataques especiais e responde com dano considerável.",
            strengths: "Ótimo contra magos e atacantes elementais.",
            weaknesses: "Fraco contra ataques físicos diretos.",
            situation: "Use para confrontar atacantes especiais que seu time não consegue tocar."
        };
        return {
            name: "Special Wall",
            explanation: "O escudo definitivo contra ataques especiais.",
            strengths: "Consegue anular quase qualquer atacante especial.",
            weaknesses: "Cai facilmente para qualquer golpe físico decente.",
            situation: "Use para 'murar' atacantes especiais e forçar o oponente a trocar."
        };
    }

    // Attackers puros
    if (atk >= 110 && spa >= 110) return {
        name: "Mixed Attacker",
        explanation: "Ameaça ofensiva dupla, ataca por ambos os lados.",
        strengths: "Imprevisível, difícil de escolher uma Wall para pará-lo.",
        weaknesses: "Pode ser menos eficiente que atacantes focados.",
        situation: "Use para quebrar times que dependem muito de uma única defesa (Física ou Especial)."
    };

    if (isPhysicallyStrong) return {
        name: "Physical Attacker",
        explanation: "Focado em causar o máximo de dano físico possível.",
        strengths: "Alto poder bruto, aproveita fraquezas físicas comuns.",
        weaknesses: "Vulnerável a Intimidate, Burn e Physical Walls.",
        situation: "Use para pressionar Pokémon com baixa Defesa física."
    };

    if (isSpeciallyStrong) return {
        name: "Special Attacker",
        explanation: "Especialista em dano especial massivo.",
        strengths: "Ignora efeitos de contato e Intimidate.",
        weaknesses: "Parado por Special Walls pesadas.",
        situation: "Use para causar dano em alvos com baixa Defesa Especial."
    };

    // Suporte e utilitários
    if (spe >= 100 || (hp >= 90 && (def >= 80 || spd >= 80))) return {
        name: "Support / Pivot",
        explanation: "Focado em utilidade, controle de campo e trocas seguras.",
        strengths: "Versatilidade, ajuda a manter o ritmo do jogo (momentum).",
        weaknesses: "Baixa presença ofensiva direta.",
        situation: "Use para entrar, aplicar efeitos (como status ou hazards) e sair com segurança."
    };

    return {
        name: "Bulky Attacker",
        explanation: "Possui boa durabilidade e dano razoável, sem ser excelente em nenhum.",
        strengths: "Consistência, difícil de ser nocauteado com um golpe só.",
        weaknesses: "Pode ser ultrapassado por ameaças mais rápidas ou fortes.",
        situation: "Use em situações neutras para manter pressão constante no oponente."
    };
}

function renderPokemonRoles(activeTeam) {
    const container = document.getElementById('pokemonRoles');
    container.innerHTML = activeTeam.map(pkmn => {
        const role = determinePokemonRole(pkmn);
        return `
            <div class="p-4 bg-white/50 rounded-2xl border border-white/50 space-y-3">
                <div class="flex items-center gap-3">
                    <img src="${pkmn.sprite}" class="w-10 h-10 object-contain" alt="">
                    <div>
                        <h5 class="text-sm font-black capitalize text-gray-800">${pkmn.name.replace(/-/g, ' ')}</h5>
                        <span class="text-[10px] font-bold text-orange-500 uppercase tracking-wider">${role.name}</span>
                    </div>
                </div>
                <p class="text-[10px] text-gray-500 leading-relaxed font-medium">${role.explanation}</p>
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100/50">
                    <div>
                        <span class="text-[8px] font-black uppercase text-gray-400 block mb-1">Forças</span>
                        <span class="text-[9px] font-bold text-emerald-600 block leading-tight">${role.strengths}</span>
                    </div>
                    <div>
                        <span class="text-[8px] font-black uppercase text-gray-400 block mb-1">Fraquezas</span>
                        <span class="text-[9px] font-bold text-red-500 block leading-tight">${role.weaknesses}</span>
                    </div>
                </div>
                <div class="bg-orange-50/50 p-2 rounded-xl">
                    <span class="text-[8px] font-black uppercase text-orange-400 block mb-1">Quando usar</span>
                    <span class="text-[9px] font-bold text-gray-600 leading-tight block">${role.situation}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderTeamScore(defensiveData, activeTeam) {
    const container = document.getElementById('teamScoreContainer');
    
    // Cálculo de Pontuação (0-100)
    let defScore = 0;
    let offScore = 0;
    let speedScore = 0;
    let balanceScore = 0;

    // Defesa: Penaliza fraquezas triplas e premia imunidades
    const critWeak = TODOS_OS_TIPOS.filter(t => defensiveData[t].weak >= 3).length;
    const commonWeak = TODOS_OS_TIPOS.filter(t => defensiveData[t].weak === 2).length;
    const immunities = TODOS_OS_TIPOS.reduce((acc, t) => acc + (defensiveData[t].immune > 0 ? 1 : 0), 0);
    const resistances = TODOS_OS_TIPOS.reduce((acc, t) => acc + (defensiveData[t].resist > 0 ? 1 : 0), 0);
    
    defScore = 70 - (critWeak * 15) - (commonWeak * 5) + (immunities * 8) + (resistances * 2);
    defScore = Math.max(0, Math.min(100, defScore));

    // Ofensiva: Baseada na cobertura de tipos
    const coveredTypes = new Set();
    activeTeam.forEach(pkmn => pkmn.types.forEach(type => (OFFENSIVE_COVERAGE[type] || []).forEach(t => coveredTypes.add(t))));
    offScore = Math.round((coveredTypes.size / 18) * 100);

    // Velocidade
    const speeds = activeTeam.map(p => p.stats.find(s => s.name === 'speed').value);
    const avgSpeed = speeds.reduce((acc, s) => acc + s, 0) / activeTeam.length;
    const fastPokemonCount = speeds.filter(s => s >= 100).length;
    speedScore = Math.round((avgSpeed / 110) * 80) + (fastPokemonCount * 5);
    speedScore = Math.max(0, Math.min(100, speedScore));

    // Equilíbrio (Stats e Tipos)
    const typeDiversity = new Set(activeTeam.flatMap(p => p.types)).size;
    const phyVsSpeAtk = Math.abs(
        activeTeam.reduce((acc, p) => acc + p.stats.find(s => s.name === 'attack').value, 0) -
        activeTeam.reduce((acc, p) => acc + p.stats.find(s => s.name === 'special-attack').value, 0)
    );
    balanceScore = (typeDiversity * 5) + (100 - Math.min(100, phyVsSpeAtk / 5));
    balanceScore = Math.max(0, Math.min(100, balanceScore));

    const totalScore = Math.round((defScore + offScore + speedScore + balanceScore) / 4);

    // Detecção de Arquétipo
    let archetype = "Balanced";
    let archDesc = "O time possui um bom equilíbrio entre ataque e defesa, sendo versátil contra a maioria das ameaças.";
    
    if (speedScore > 75 && offScore > 70 && defScore < 50) {
        archetype = "Hyper Offense";
        archDesc = "Foco total em velocidade e poder de nocaute imediato, sacrificando durabilidade.";
    } else if (defScore > 75 && speedScore < 50) {
        archetype = "Stall / Defensive";
        archDesc = "Foco em resistência extrema, imunidades e desgaste lento do oponente.";
    } else if (offScore > 65 && defScore > 65) {
        archetype = "Bulky Offense";
        archDesc = "Pokémon resistentes que conseguem aguentar golpes e revidar com força massiva.";
    } else if (speedScore > 80 && balanceScore < 60) {
        archetype = "Speed-focused";
        archDesc = "O time depende muito de ultrapassar o oponente, mas pode sofrer contra defesas pesadas.";
    } else if (typeDiversity < 5) {
        archetype = "Type-stacked";
        archDesc = "O time possui muitos tipos repetidos, o que cria vulnerabilidades comuns perigosas.";
    }

    container.innerHTML = `
        <div class="relative w-32 h-32 flex items-center justify-center mb-6">
            <svg class="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" class="text-gray-100" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" class="${totalScore > 70 ? 'text-emerald-500' : totalScore > 40 ? 'text-amber-500' : 'text-red-500'}" stroke-dasharray="${2 * Math.PI * 58}" stroke-dashoffset="${(1 - totalScore / 100) * 2 * Math.PI * 58}" stroke-linecap="round" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-black text-gray-800">${totalScore}</span>
                <span class="text-[8px] font-black uppercase text-gray-400">Tactical Score</span>
            </div>
        </div>
        
        <div class="w-full space-y-3 px-4">
            <div class="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                <span class="text-xs font-black text-gray-800 uppercase tracking-widest">${archetype}</span>
                <p class="text-[9px] font-bold text-gray-400 leading-tight mt-1">${archDesc}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 pt-2">
                <div class="space-y-1">
                    <div class="flex justify-between"><span class="text-[8px] font-black text-gray-400 uppercase">Defesa</span><span class="text-[8px] font-black text-gray-600">${defScore}%</span></div>
                    <div class="h-1 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-blue-500" style="width: ${defScore}%"></div></div>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between"><span class="text-[8px] font-black text-gray-400 uppercase">Ataque</span><span class="text-[8px] font-black text-gray-600">${offScore}%</span></div>
                    <div class="h-1 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-red-500" style="width: ${offScore}%"></div></div>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between"><span class="text-[8px] font-black text-gray-400 uppercase">Veloc.</span><span class="text-[8px] font-black text-gray-600">${speedScore}%</span></div>
                    <div class="h-1 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-cyan-500" style="width: ${speedScore}%"></div></div>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between"><span class="text-[8px] font-black text-gray-400 uppercase">Balanço</span><span class="text-[8px] font-black text-gray-600">${balanceScore}%</span></div>
                    <div class="h-1 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-emerald-500" style="width: ${balanceScore}%"></div></div>
                </div>
            </div>
            <p class="text-[7px] text-gray-300 font-bold uppercase text-center pt-2">Pontuação baseada em tipos, atributos e cobertura geral.</p>
        </div>
    `;
}

function renderUsageSituations(activeTeam) {
    const container = document.getElementById('usageSituations');
    
    const getTop = (statName) => [...activeTeam].sort((a, b) => b.stats.find(s => s.name === statName).value - a.stats.find(s => s.name === statName).value)[0];
    
    const situations = [
        {
            title: "Melhor Lead",
            pkmn: activeTeam.find(p => {
                const role = determinePokemonRole(p).name;
                return role.includes("Support") || role.includes("Pivot");
            }) || activeTeam[0],
            reason: "Ideal para começar a partida, aplicar efeitos ou pivotar."
        },
        {
            title: "Defensive Switch-in",
            pkmn: [...activeTeam].sort((a, b) => {
                const defSum = (p) => p.stats.find(s => s.name === 'defense').value + p.stats.find(s => s.name === 'special-defense').value + p.stats.find(s => s.name === 'hp').value;
                return defSum(b) - defSum(a);
            })[0],
            reason: "Possui os melhores atributos defensivos para absorver golpes."
        },
        {
            title: "Melhor Atacante Especial",
            pkmn: getTop('special-attack'),
            reason: "Maior poder ofensivo especial para quebrar barreiras físicas."
        },
        {
            title: "Melhor Atacante Físico",
            pkmn: getTop('attack'),
            reason: "Maior poder ofensivo físico para punir defesas especiais baixas."
        },
        {
            title: "Late-game Cleaner",
            pkmn: getTop('speed'),
            reason: "Alta velocidade ideal para finalizar oponentes enfraquecidos no final."
        },
        {
            title: "Anti-Fast Threats",
            pkmn: activeTeam.find(p => determinePokemonRole(p).name.includes("Revenge Killer")) || getTop('speed'),
            reason: "Sua velocidade permite lidar com ameaças rápidas do oponente."
        },
        {
            title: "Anti-Bulky Teams",
            pkmn: activeTeam.find(p => determinePokemonRole(p).name.includes("Mixed")) || (activeTeam.find(p => p.stats.find(s => s.name === 'attack').value > 120) || activeTeam[0]),
            reason: "Poder bruto ou versatilidade para quebrar defesas pesadas."
        },
        {
            title: "Opção de Emergência",
            pkmn: [...activeTeam].sort((a, b) => b.stats.find(s => s.name === 'hp').value - a.stats.find(s => s.name === 'hp').value)[0],
            reason: "Maior HP para sobreviver a um golpe crítico em situação de risco."
        }
    ];

    container.innerHTML = situations.map(sit => `
        <div class="flex items-center gap-3 p-3 bg-white/40 rounded-2xl border border-white/50 group hover:bg-white/60 transition-all">
            <img src="${sit.pkmn.sprite}" class="w-8 h-8 object-contain" alt="">
            <div class="overflow-hidden">
                <h6 class="text-[10px] font-black text-cyan-600 uppercase tracking-widest truncate">${sit.title}</h6>
                <p class="text-[10px] font-bold text-gray-700 capitalize truncate">${sit.pkmn.name.replace(/-/g, ' ')}</p>
                <p class="text-[8px] text-gray-400 font-medium leading-tight line-clamp-2">${sit.reason}</p>
            </div>
        </div>
    `).join('');
}

async function renderTeamSynergy(defensiveData, activeTeam) {
    const container = document.getElementById('teamSynergy');
    const synergies = [];

    // Busca pares que cobrem fraquezas um do outro
    for (let i = 0; i < activeTeam.length; i++) {
        for (let j = i + 1; j < activeTeam.length; j++) {
            const p1 = activeTeam[i];
            const p2 = activeTeam[j];
            
            // Verifica se um resiste às fraquezas do outro
            const p1Weaknesses = await getWeaknesses(p1);
            const p2Resists = await getResistances(p2);
            
            const p2Weaknesses = await getWeaknesses(p2);
            const p1Resists = await getResistances(p1);

            const p1CoveredByP2 = p1Weaknesses.some(w => p2Resists.includes(w));
            const p2CoveredByP1 = p2Weaknesses.some(w => p1Resists.includes(w));

            if (p1CoveredByP2 && p2CoveredByP1) {
                synergies.push({
                    p1, p2,
                    title: "Núcleo Defensivo Perfeito",
                    reason: `Ambos cobrem as fraquezas um do outro perfeitamente.`
                });
            } else if (p1CoveredByP2 || p2CoveredByP1) {
                synergies.push({
                    p1, p2,
                    title: "Parceria Defensiva",
                    reason: `${p1CoveredByP2 ? p2.name : p1.name} ajuda a proteger seu parceiro.`
                });
            } else {
                synergies.push({
                    p1, p2,
                    title: "Pressão Combinada",
                    reason: "Pares ofensivos que mantêm o ritmo da partida elevado."
                });
            }
            if (synergies.length >= 4) break;
        }
        if (synergies.length >= 4) break;
    }

    container.innerHTML = synergies.map(syn => `
        <div class="p-3 bg-pink-50/30 rounded-2xl border border-pink-100 flex items-center justify-between group hover:bg-pink-50/50 transition-colors">
            <div class="flex items-center gap-2">
                <img src="${syn.p1.sprite}" class="w-8 h-8 object-contain group-hover:scale-110 transition-transform" alt="">
                <span class="text-pink-200 font-black">×</span>
                <img src="${syn.p2.sprite}" class="w-8 h-8 object-contain group-hover:scale-110 transition-transform" alt="">
            </div>
            <div class="text-right flex-grow px-4 overflow-hidden">
                <span class="text-[9px] font-black text-pink-500 uppercase tracking-widest">${syn.title}</span>
                <p class="text-[8px] font-bold text-gray-500 leading-tight truncate capitalize">${syn.reason}</p>
            </div>
        </div>
    `).join('');
}

// Helpers para Sinergia (Agora Assíncronos para usar dados reais)
async function getWeaknesses(pkmn) {
    const weaknesses = [];
    for (const typeName of pkmn.types) {
        const data = await getCachedTypeData(typeName);
        if (data) {
            data.damage_relations.double_damage_from.forEach(t => {
                if (!weaknesses.includes(t.name)) weaknesses.push(t.name);
            });
        }
    }
    return weaknesses;
}

async function getResistances(pkmn) {
    const resistances = [];
    for (const typeName of pkmn.types) {
        const data = await getCachedTypeData(typeName);
        if (data) {
            data.damage_relations.half_damage_from.forEach(t => {
                if (!resistances.includes(t.name)) resistances.push(t.name);
            });
            data.damage_relations.no_damage_from.forEach(t => {
                if (!resistances.includes(t.name)) resistances.push(t.name);
            });
        }
    }
    return resistances;
}

async function renderMatchupHelper(defensiveData, activeTeam) {
    const container = document.getElementById('matchupHelper');
    
    // Identifica tipos que são ameaças (3+ fraquezas no time)
    const threats = TODOS_OS_TIPOS.filter(t => defensiveData[t].weak >= 2);
    const others = TODOS_OS_TIPOS.filter(t => defensiveData[t].weak < 2);
    
    // Ordena: primeiro as ameaças críticas, depois o resto
    const sortedTypes = [...threats.sort((a, b) => defensiveData[b].weak - defensiveData[a].weak), ...others];

    const recommendations = await Promise.all(sortedTypes.map(async (enemyType) => {
        let bestPkmn = null;
        let bestMult = 4;

        for (const pkmn of activeTeam) {
            let mult = 1;
            for (const tName of pkmn.types) {
                const data = await getCachedTypeData(tName);
                if (!data) continue;
                const rel = data.damage_relations;
                if (rel.double_damage_from.some(t => t.name === enemyType)) mult *= 2;
                if (rel.half_damage_from.some(t => t.name === enemyType)) mult *= 0.5;
                if (rel.no_damage_from.some(t => t.name === enemyType)) mult *= 0;
            }
            
            if (mult < bestMult) {
                bestMult = mult;
                bestPkmn = pkmn;
            }
        }

        return { enemyType, bestPkmn, bestMult, isThreat: defensiveData[enemyType].weak >= 2 };
    }));

    container.innerHTML = recommendations.map(rec => {
        let statusText = 'Neutro';
        let statusColor = 'text-gray-400';
        let borderColor = 'border-gray-100';
        let bgColor = 'bg-gray-50/50';

        if (rec.bestMult === 0) {
            statusText = 'Imune';
            statusColor = 'text-blue-600';
            bgColor = 'bg-blue-50/50';
            borderColor = 'border-blue-100';
        } else if (rec.bestMult < 1) {
            statusText = 'Resiste';
            statusColor = 'text-emerald-600';
            bgColor = 'bg-emerald-50/50';
            borderColor = 'border-emerald-100';
        } else if (rec.bestMult > 1) {
            statusText = 'Cuidado';
            statusColor = 'text-red-500';
            bgColor = 'bg-red-50/50';
            borderColor = 'border-red-100';
        }

        return `
            <div class="p-3 rounded-2xl border ${borderColor} ${bgColor} flex flex-col items-center gap-2 transition-all hover:scale-105 relative group">
                ${rec.isThreat ? `
                    <div class="absolute -top-2 -right-1">
                        <span class="flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                ` : ''}
                <div class="w-full h-5 rounded-lg tipo-${rec.enemyType} text-[8px] text-white font-black flex items-center justify-center uppercase shadow-sm">${rec.enemyType}</div>
                <div class="w-10 h-10 flex items-center justify-center">
                    <img src="${rec.bestPkmn.sprite}" class="w-full h-full object-contain filter group-hover:drop-shadow-md transition-all" alt="${rec.bestPkmn.name}">
                </div>
                <div class="text-center">
                    <span class="text-[7px] font-black uppercase ${statusColor} block leading-none">${statusText}</span>
                    <span class="text-[6px] font-bold text-gray-400 block mt-0.5 truncate w-16 capitalize">${rec.bestPkmn.name.replace(/-/g, ' ')}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function getCachedTypeData(typeName) {
    if (typeCache[typeName]) return typeCache[typeName];
    try {
        const res = await fetch(`${URL_API}type/${typeName}`);
        const data = await res.json();
        typeCache[typeName] = data;
        return data;
    } catch (e) { return null; }
}

async function calculateDefensiveAnalysis(activeTeam) {
    const analysis = {};
    TODOS_OS_TIPOS.forEach(type => {
        analysis[type] = { weak: 0, resist: 0, immune: 0 };
    });

    for (const pkmn of activeTeam) {
        const pkmnMultipliers = {};
        TODOS_OS_TIPOS.forEach(t => pkmnMultipliers[t] = 1);

        for (const typeName of pkmn.types) {
            const data = await getCachedTypeData(typeName);
            if (!data) continue;
            data.damage_relations.double_damage_from.forEach(t => pkmnMultipliers[t.name] *= 2);
            data.damage_relations.half_damage_from.forEach(t => pkmnMultipliers[t.name] *= 0.5);
            data.damage_relations.no_damage_from.forEach(t => pkmnMultipliers[t.name] *= 0);
        }

        TODOS_OS_TIPOS.forEach(type => {
            const mult = pkmnMultipliers[type];
            if (mult > 1) analysis[type].weak++;
            else if (mult === 0) analysis[type].immune++;
            else if (mult < 1) analysis[type].resist++;
        });
    }
    return analysis;
}

function renderDefensiveAnalysis(data) {
    const table = document.getElementById('defensiveTable');
    const warnings = document.getElementById('defensiveWarnings');
    
    // Calcular destaques defensivos
    const dangerousTypes = TODOS_OS_TIPOS.filter(t => data[t].weak >= 3);
    const safeTypes = TODOS_OS_TIPOS.filter(t => data[t].resist >= 3 || data[t].immune >= 1);
    const totalImmunities = TODOS_OS_TIPOS.reduce((acc, t) => acc + data[t].immune, 0);
    
    // Mais perigoso (maior número de fraquezas)
    const mostDangerous = [...TODOS_OS_TIPOS].sort((a, b) => data[b].weak - data[a].weak)[0];
    // Melhor coberto (maior número de resistências)
    const bestCovered = [...TODOS_OS_TIPOS].sort((a, b) => (data[b].resist + data[b].immune) - (data[a].resist + data[a].immune))[0];

    table.innerHTML = `
        <div class="space-y-4">
            <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-center border-separate border-spacing-1 min-w-[600px]">
                    <thead>
                        <tr>
                            <th class="p-2"></th>
                            ${TODOS_OS_TIPOS.map(t => `<th class="p-1"><div class="w-8 h-8 rounded-lg tipo-${t} flex items-center justify-center text-[8px] text-white font-black uppercase shadow-sm" title="${t}">${t.substring(0, 3)}</div></th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="bg-red-50/30">
                            <td class="text-[10px] font-black text-red-500 uppercase pr-2 text-right whitespace-nowrap">Fraquezas</td>
                            ${TODOS_OS_TIPOS.map(t => {
                                const count = data[t].weak;
                                const bgColor = count >= 3 ? 'bg-red-500 text-white' : count > 0 ? 'bg-red-100 text-red-600' : 'text-gray-100';
                                return `<td class="p-1"><div class="w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center text-xs font-black transition-colors">${count || '-'}</div></td>`;
                            }).join('')}
                        </tr>
                        <tr class="bg-emerald-50/30">
                            <td class="text-[10px] font-black text-emerald-500 uppercase pr-2 text-right whitespace-nowrap">Resistências</td>
                            ${TODOS_OS_TIPOS.map(t => {
                                const count = data[t].resist;
                                const bgColor = count >= 3 ? 'bg-emerald-500 text-white' : count > 0 ? 'bg-emerald-100 text-emerald-600' : 'text-gray-100';
                                return `<td class="p-1"><div class="w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center text-xs font-black transition-colors">${count || '-'}</div></td>`;
                            }).join('')}
                        </tr>
                        <tr class="bg-blue-50/30">
                            <td class="text-[10px] font-black text-blue-500 uppercase pr-2 text-right whitespace-nowrap">Imunidades</td>
                            ${TODOS_OS_TIPOS.map(t => {
                                const count = data[t].immune;
                                const bgColor = count > 0 ? 'bg-blue-500 text-white' : 'text-gray-100';
                                return `<td class="p-1"><div class="w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center text-xs font-black transition-colors">${count || '-'}</div></td>`;
                            }).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span class="stat-label block mb-1">Maior Ameaça</span>
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-md tipo-${mostDangerous} flex items-center justify-center text-[7px] text-white font-black uppercase">${mostDangerous.substring(0, 3)}</div>
                        <span class="text-xs font-black text-gray-700 uppercase">${mostDangerous}</span>
                    </div>
                </div>
                <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span class="stat-label block mb-1">Melhor Defendido</span>
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-md tipo-${bestCovered} flex items-center justify-center text-[7px] text-white font-black uppercase">${bestCovered.substring(0, 3)}</div>
                        <span class="text-xs font-black text-gray-700 uppercase">${bestCovered}</span>
                    </div>
                </div>
                <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span class="stat-label block mb-1">Total Imunidades</span>
                    <span class="text-xs font-black text-gray-700">${totalImmunities} membros</span>
                </div>
            </div>
        </div>
    `;

    warnings.innerHTML = dangerousTypes.map(t => `
        <div class="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-fade-in">
            <div class="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <p class="text-xs font-bold leading-tight">Cuidado! Seu time é extremamente vulnerável ao tipo <span class="uppercase underline decoration-2 underline-offset-2">${t}</span>.</p>
        </div>
    `).join('');
}

function renderOffensiveAnalysis(activeTeam) {
    const offensiveGrid = document.getElementById('offensiveGrid');
    const warnings = document.getElementById('offensiveWarnings');
    
    // Calcular cobertura ofensiva
    const coveredTypes = new Set();
    activeTeam.forEach(pkmn => {
        pkmn.types.forEach(type => {
            const hits = OFFENSIVE_COVERAGE[type] || [];
            hits.forEach(t => coveredTypes.add(t));
        });
    });

    const goodCoverage = TODOS_OS_TIPOS.filter(t => coveredTypes.has(t));
    const badCoverage = TODOS_OS_TIPOS.filter(t => !coveredTypes.has(t));

    // Resumo e Explicação
    const summaryText = `Seu time cobre <span class="font-black text-gray-800">${goodCoverage.length} de 18</span> tipos.`;
    let coverageQuality = "Boa variedade ofensiva.";
    let qualityColor = "text-emerald-500";
    
    if (goodCoverage.length > 12) {
        coverageQuality = "Excelente variedade ofensiva.";
        qualityColor = "text-emerald-600";
    } else if (goodCoverage.length < 8) {
        coverageQuality = "Baixa variedade ofensiva.";
        qualityColor = "text-red-500";
    }

    offensiveGrid.innerHTML = `
        <div class="space-y-6 w-full">
            <!-- Cabeçalho e Resumo Principal (Layout em 2 colunas no desktop) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                    <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Tipos Cobertos</span>
                    <span class="text-3xl font-black text-gray-800 leading-none">${goodCoverage.length} <span class="text-lg text-gray-400 font-medium">de 18</span></span>
                </div>
                <div class="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center ${goodCoverage.length >= 10 ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div>
                        <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Avaliação Geral</span>
                        <span class="text-sm font-bold ${qualityColor} leading-tight block">${coverageQuality}</span>
                    </div>
                </div>
            </div>

            <!-- Tipos bem cobertos -->
            <div class="space-y-3">
                <span class="text-xs font-black uppercase tracking-widest text-emerald-600 block">Tipos bem cobertos</span>
                <p class="text-xs font-medium text-gray-500">Seu time possui vantagem ofensiva contra estes tipos:</p>
                <div class="flex flex-wrap gap-2.5 mt-2">
                    ${goodCoverage.length > 0 
                        ? goodCoverage.map(t => `<span class="tipo-badge tipo-${t}">${t}</span>`).join('') 
                        : '<span class="text-sm text-gray-400 italic bg-gray-50 px-4 py-2 rounded-xl">Adicione Pokémon para ver a cobertura.</span>'
                    }
                </div>
            </div>
            
            <!-- Tipos sem cobertura -->
            <div class="space-y-3 pt-6 border-t border-gray-100">
                <span class="text-xs font-black uppercase tracking-widest text-red-500 block">Tipos sem cobertura ofensiva</span>
                ${badCoverage.length > 0 
                    ? `<p class="text-xs font-medium text-gray-500">Atualmente, seu time não tem boa pressão ofensiva contra estes tipos:</p>
                       <div class="flex flex-wrap gap-2.5 mt-2">
                           ${badCoverage.map(t => `<span class="tipo-badge tipo-${t} opacity-80">${t}</span>`).join('')}
                       </div>`
                    : `<div class="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                           <span class="text-sm font-bold">Excelente! Seu time tem cobertura ofensiva contra todos os tipos.</span>
                       </div>`
                }
            </div>
        </div>
    `;

    // Insight Final
    const summaryList = [];
    if (goodCoverage.length > 12) {
        summaryList.push(`Seu time tem uma presença ofensiva fantástica, conseguindo acertar com vantagem a grande maioria das ameaças.`);
    } else if (goodCoverage.length < 8) {
        summaryList.push(`Seu time tem dificuldade em causar dano super efetivo. Considere diversificar os tipos dos seus Pokémon.`);
    } else {
         summaryList.push(`Seu time tem boa variedade ofensiva geral.`);
    }

    if (badCoverage.length > 0) {
        const keyMissing = badCoverage.slice(0, 3).map(t => `<span class="capitalize font-bold">${t}</span>`).join(', ');
        const andMore = badCoverage.length > 3 ? ' entre outros' : '';
        summaryList.push(`Ainda falta pressão contra ${keyMissing}${andMore}. Tente cobrir essas lacunas com novos golpes ou membros.`);
    }

    warnings.innerHTML = summaryList.map(item => `
        <div class="flex items-start gap-3 p-4 bg-blue-50/50 text-blue-800 rounded-2xl border border-blue-100">
            <div class="mt-0.5">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-xs font-medium leading-relaxed">${item}</p>
        </div>
    `).join('');
}

function renderStatsAnalysis(activeTeam) {
    const statsAnalysis = document.getElementById('statsAnalysis');
    const highlights = document.getElementById('statsHighlights');
    const totals = { hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 };
    
    activeTeam.forEach(pkmn => {
        pkmn.stats.forEach(s => totals[s.name] += s.value);
    });

    const count = activeTeam.length;
    const averages = {};
    Object.keys(totals).forEach(k => averages[k] = Math.round(totals[k] / count));

    const statLabels = { 
        hp: 'HP', 
        attack: 'Ataque', 
        defense: 'Defesa', 
        'special-attack': 'Sp. Atk', 
        'special-defense': 'Sp. Def', 
        speed: 'Velocidade' 
    };

    const sortedAverages = Object.entries(averages).sort((a, b) => b[1] - a[1]);
    const highestStat = sortedAverages[0][0];
    const lowestStat = sortedAverages[5][0];

    statsAnalysis.innerHTML = Object.keys(averages).map(k => {
        const val = averages[k];
        const pct = Math.min((val / 150) * 100, 100);
        const isHighest = k === highestStat;
        const isLowest = k === lowestStat;
        
        let barColor = 'bg-gray-200';
        if (isHighest) barColor = 'bg-pokedex-red';
        else if (isLowest) barColor = 'bg-amber-400';
        else if (val >= 100) barColor = 'bg-emerald-400';

        return `
            <div class="space-y-1.5">
                <div class="flex justify-between items-end">
                    <span class="stat-label ${isHighest ? 'text-pokedex-red font-black' : ''}">${statLabels[k]}</span>
                    <span class="text-xs font-black text-gray-700">${val}</span>
                </div>
                <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div class="h-full ${barColor} transition-all duration-1000 ease-out" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');

    // Destaques individuais
    const getTop = (statName) => [...activeTeam].sort((a, b) => b.stats.find(s => s.name === statName).value - a.stats.find(s => s.name === statName).value)[0];
    
    const fastest = getTop('speed');
    const phyAtk = getTop('attack');
    const speAtk = getTop('special-attack');
    const bulky = [...activeTeam].sort((a, b) => {
        const sum = (p) => p.stats.find(s => s.name === 'hp').value + p.stats.find(s => s.name === 'defense').value + p.stats.find(s => s.name === 'special-defense').value;
        return sum(b) - sum(a);
    })[0];

    highlights.innerHTML = `
        <div class="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-center group hover:bg-blue-50 transition-colors">
            <span class="stat-label block mb-1 text-blue-500">Fastest</span>
            <span class="text-[10px] font-black text-blue-700 capitalize truncate block">${fastest.name.replace(/-/g, ' ')}</span>
        </div>
        <div class="p-3 bg-red-50/50 rounded-2xl border border-red-100 text-center group hover:bg-red-50 transition-colors">
            <span class="stat-label block mb-1 text-red-500">Phy. Atk</span>
            <span class="text-[10px] font-black text-red-700 capitalize truncate block">${phyAtk.name.replace(/-/g, ' ')}</span>
        </div>
        <div class="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center group hover:bg-indigo-50 transition-colors">
            <span class="stat-label block mb-1 text-indigo-500">Spe. Atk</span>
            <span class="text-[10px] font-black text-indigo-700 capitalize truncate block">${speAtk.name.replace(/-/g, ' ')}</span>
        </div>
        <div class="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center group hover:bg-emerald-50 transition-colors">
            <span class="stat-label block mb-1 text-emerald-500">Bulkiest</span>
            <span class="text-[10px] font-black text-emerald-700 capitalize truncate block">${bulky.name.replace(/-/g, ' ')}</span>
        </div>
    `;
}

function renderStrategicSuggestions(defensiveData, activeTeam) {
    const suggestions = document.getElementById('strategicSuggestions');
    const list = [];
    
    // 1. Tipos Repetidos
    const typeCounts = {};
    activeTeam.forEach(p => p.types.forEach(t => typeCounts[t] = (typeCounts[t] || 0) + 1));
    const repeatedTypes = Object.keys(typeCounts).filter(t => typeCounts[t] >= 2);
    if (repeatedTypes.length > 0) {
        list.push({
            type: 'warning',
            text: `Há repetição de tipos <span class="uppercase font-bold">${repeatedTypes.join(', ')}</span>. Tente diversificar para evitar que um único golpe derrote vários membros.`
        });
    }

    // 2. Fraquezas Críticas (3 ou mais)
    const critWeak = TODOS_OS_TIPOS.filter(t => defensiveData[t].weak >= 3);
    critWeak.forEach(t => {
        list.push({
            type: 'danger',
            text: `Cuidado com golpes do tipo <span class="uppercase font-bold text-red-500">${t}</span>: ${defensiveData[t].weak} Pokémon recebem dano super efetivo. Adicionar um Pokémon resistente (${(RESISTENCIAS_POR_TIPO[t] || []).join('/')}) ajudaria muito.`
        });
    });

    // 3. Velocidade Média
    const avgSpeed = activeTeam.reduce((acc, p) => acc + p.stats.find(s => s.name === 'speed').value, 0) / activeTeam.length;
    if (avgSpeed < 80) {
        list.push({
            type: 'info',
            text: `A velocidade média do time (${Math.round(avgSpeed)}) é baixa. Você pode ter dificuldades contra times rápidos. Considere um "Speed Controler" ou "Revenge Killer".`
        });
    }

    // 4. Equilíbrio Ofensivo
    const totalPhy = activeTeam.reduce((acc, p) => acc + p.stats.find(s => s.name === 'attack').value, 0);
    const totalSpe = activeTeam.reduce((acc, p) => acc + p.stats.find(s => s.name === 'special-attack').value, 0);
    if (Math.abs(totalPhy - totalSpe) > 200) {
        list.push({
            type: 'info',
            text: `O time tem muita pressão <span class="font-bold">${totalPhy > totalSpe ? 'Física' : 'Especial'}</span>. Um oponente com defesa alta nesse lado pode travar seu time todo.`
        });
    }

    // 5. Coberturas Defensivas Essenciais
    const essentialTypes = ['steel', 'fairy', 'water', 'ground'];
    essentialTypes.forEach(t => {
        const hasImmune = defensiveData[t].immune > 0;
        const hasResist = defensiveData[t].resist >= 2;
        if (!hasImmune && !hasResist) {
            list.push({
                type: 'warning',
                text: `Seu time tem poucas respostas para o tipo <span class="uppercase font-bold">${t}</span>. Um Pokémon do tipo <span class="font-bold">${t === 'ground' ? 'Flying' : t === 'steel' ? 'Fire/Ground' : 'Steel'}</span> seria uma ótima adição.`
            });
        }
    });

    // 6. Sugestão de Melhoria Geral
    if (activeTeam.length < 6) {
        list.push({
            type: 'info',
            text: `Complete seu time com mais ${6 - activeTeam.length} Pokémon para uma análise de equilíbrio total.`
        });
    }

    if (list.length === 0) {
        suggestions.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                    <h5 class="font-black text-emerald-600 uppercase text-xs tracking-widest">Equilíbrio Perfeito</h5>
                    <p class="text-gray-400 text-xs font-medium">Seu time não possui fraquezas críticas óbvias. Excelente trabalho!</p>
                </div>
            </div>
        `;
    } else {
        suggestions.innerHTML = `
            <div class="space-y-3">
                ${list.map(item => {
                    let iconColor = 'text-blue-500';
                    let bgColor = 'bg-blue-50/30';
                    let borderColor = 'border-blue-100/50';
                    if (item.type === 'danger') { iconColor = 'text-red-500'; bgColor = 'bg-red-50/30'; borderColor = 'border-red-100/50'; }
                    if (item.type === 'warning') { iconColor = 'text-amber-500'; bgColor = 'bg-amber-50/30'; borderColor = 'border-amber-100/50'; }

                    return `
                        <div class="flex items-start gap-3 p-4 ${bgColor} rounded-2xl border ${borderColor} transition-all hover:bg-opacity-50 group">
                            <span class="${iconColor} mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">•</span>
                            <p class="text-xs font-bold text-gray-600 leading-relaxed">${item.text}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

// Mapa auxiliar de resistências para sugestões
const RESISTENCIAS_POR_TIPO = {
    fire: ['Water', 'Fire', 'Dragon', 'Rock'],
    water: ['Water', 'Grass', 'Dragon'],
    grass: ['Grass', 'Fire', 'Dragon', 'Steel', 'Bug', 'Poison', 'Flying'],
    electric: ['Electric', 'Grass', 'Dragon'],
    ice: ['Fire', 'Water', 'Ice', 'Steel'],
    fighting: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'],
    poison: ['Poison', 'Ground', 'Rock', 'Ghost'],
    ground: ['Grass', 'Bug'],
    flying: ['Electric', 'Rock', 'Steel'],
    psychic: ['Psychic', 'Steel'],
    bug: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel', 'Fairy'],
    rock: ['Fighting', 'Ground', 'Steel'],
    ghost: ['Dark'],
    dragon: ['Steel'],
    dark: ['Fighting', 'Dark', 'Fairy'],
    steel: ['Fire', 'Water', 'Electric', 'Steel'],
    fairy: ['Fire', 'Poison', 'Steel'],
    normal: ['Rock', 'Steel']
};

// Global Exports
window.removePokemonFromSlot = removePokemonFromSlot;
window.clearTeam = clearTeam;
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.selectPokemonFromModal = selectPokemonFromModal;
