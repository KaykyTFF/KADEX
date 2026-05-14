// Configurações e Estado Global
const URL_PARAM = new URLSearchParams(window.location.search);
const MOVE_NAME = URL_PARAM.get('name');

let currentMoveData = null;
let allPokemonPossible = []; // Lista bruta da API: learned_by_pokemon
const BATCH_SIZE = 25; // Tamanho ideal para carregar rápido sem travar

// Estado do carregador progressivo
let currentLoadingVersion = 0; // Token para evitar condições de corrida ao trocar abas
const analyzedCache = {
    'level-up': [],
    'machine': [],
    'egg': [],
    'tutor': [],
    'evolution': []
};
let analyzedCount = 0; // Quantos pokémon já foram analisados no lote atual
let totalToAnalyze = 0; // Total de pokémon que podem aprender o golpe

// Elementos do DOM
const esqueletoMove = document.getElementById('esqueletoMove');
const conteudoMove = document.getElementById('conteudoMove');
const learnedByGrid = document.getElementById('learnedByGrid');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreStatus = document.getElementById('loadMoreStatus');
const moveIconContainer = document.getElementById('moveIconContainer');
const moveIconImg = document.getElementById('moveIconImg');
const btnLoadMore = document.getElementById('btnLoadMore');

// Inicialização
if (!MOVE_NAME) {
    window.location.href = 'index.html';
} else {
    if (typeof renderNavbar === 'function') {
        renderNavbar({
            showBackButton: true
        });
    }
    configurarTratamentoErroImagem();
    carregarDetalhesMovimento();
}

function configurarTratamentoErroImagem() {
    moveIconImg.onerror = () => {
        moveIconContainer.classList.add('hidden');
    };
}

async function carregarDetalhesMovimento() {
    try {
        const response = await fetch(`${URL_API}move/${MOVE_NAME}`);
        if (!response.ok) throw new Error('Movimento não encontrado');
        currentMoveData = await response.json();

        // Update Navbar
        if (typeof renderNavbar === 'function') {
            renderNavbar({
                showBackButton: true
            });
        }

        // Preencher dados básicos
        preencherDadosHero(currentMoveData);
        preencherStats(currentMoveData);
        preencherDescricoes(currentMoveData);
        preencherMeta(currentMoveData);

        // Configurar lista de Pokémon que podem aprender
        allPokemonPossible = currentMoveData.learned_by_pokemon;
        totalToAnalyze = allPokemonPossible.length;
        
        // Mostrar conteúdo inicial
        esqueletoMove.classList.add('hidden');
        conteudoMove.classList.remove('hidden');

        if (totalToAnalyze > 0) {
            iniciarCarregamentoProgressivo('level-up');
        } else {
            exibirEstadoVazio();
        }

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar detalhes do movimento.');
        window.location.href = 'index.html';
    }
}

function preencherDadosHero(data) {
    document.getElementById('moveNome').textContent = data.name.replace(/-/g, ' ');
    document.getElementById('moveID').textContent = `#${String(data.id).padStart(3, '0')}`;
    
    const tipo = data.type.name;
    const containerTipo = document.getElementById('moveTipo');
    containerTipo.outerHTML = renderTypeBadge(tipo);

    // Accent background
    const bgAccent = document.getElementById('moveBgAccent');
    bgAccent.className = `absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none transition-all duration-1000 tipo-${tipo}`;

    const cat = data.damage_class.name;
    const containerCat = document.getElementById('moveCategoria');
    containerCat.outerHTML = renderCategoryBadge(cat);

    const genBadge = document.getElementById('moveGeracaoBadge');
    genBadge.textContent = data.generation.name.replace('generation-', 'Gen ');

    moveIconImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${data.type.id}.png`;
    moveIconImg.alt = `Icone do tipo ${tipo}`;
    document.getElementById('moveIconBg').className = `absolute inset-0 opacity-10 tipo-${tipo}`;
}

function preencherStats(data) {
    document.getElementById('movePoder').textContent = data.power || '—';
    document.getElementById('movePrecisao').textContent = data.accuracy ? `${data.accuracy}%` : '—';
    document.getElementById('movePP').textContent = data.pp || '—';
    document.getElementById('movePrioridade').textContent = data.priority || '0';
}

async function preencherDescricoes(data) {
    const descElement = document.getElementById('moveDescricao');
    const descCurta = document.getElementById('moveDescricaoCurta');
    
    // Usa o helper global para obter o texto no melhor idioma disponível
    const descricaoFinal = obterTextoPorIdioma(data.flavor_text_entries, "flavor_text");
    
    descElement.textContent = descricaoFinal;
    descCurta.textContent = descricaoFinal;

    const effectElement = document.getElementById('moveEfeitoDetalhado');
    const efeitoFinal = obterTextoPorIdioma(data.effect_entries, "effect");
    
    // Substitui a variável de chance de efeito se existir
    effectElement.textContent = efeitoFinal.replace('$effect_chance', data.effect_chance || '100');

    if (data.meta && data.meta.ailment) {
        const ailmentRaw = data.meta.ailment.name;
        // Tenta tradução fixa, se não houver usa o nome formatado
        const ailmentNome = traducoesFixas[ailmentRaw] || ailmentRaw.replace(/-/g, ' ');
        
        if (ailmentRaw !== 'none') {
            document.getElementById('moveAilmentNome').textContent = ailmentNome;
            document.getElementById('moveAilmentChance').textContent = `${data.meta.ailment_chance}% de chance`;
        }
    }

    document.getElementById('moveGeracao').textContent = data.generation.name.replace('generation-', 'Gen ');

    if (data.machines && data.machines.length > 0) {
        try {
            const machineUrl = data.machines[data.machines.length - 1].machine.url;
            const resMachine = await fetch(machineUrl);
            const dataMachine = await resMachine.json();
            
            const tmContainer = document.getElementById('moveTMContainer');
            const tmLabel = document.getElementById('moveTM');
            
            tmContainer.classList.remove('hidden');
            tmLabel.textContent = dataMachine.item.name.toUpperCase();
        } catch (e) {
            console.error("Erro ao buscar TM:", e);
        }
    }
}

function preencherMeta(data) {
    const container = document.getElementById('moveMetaContainer');
    container.innerHTML = '';

    const metaItems = [
        { label: 'Alvo', value: data.target.name.replace(/-/g, ' ') },
        { label: 'Drain', value: data.meta?.drain ? `${data.meta.drain}%` : '0%' },
        { label: 'Healing', value: data.meta?.healing ? `${data.meta.healing}%` : '0%' },
        { label: 'Crit Rate', value: data.meta?.crit_rate ? `+${data.meta.crit_rate}` : '0' },
        { label: 'Flinch Chance', value: data.meta?.flinch_chance ? `${data.meta.flinch_chance}%` : '0%' },
        { label: 'Stat Chance', value: data.meta?.stat_chance ? `${data.meta.stat_chance}%` : '0%' }
    ];

    metaItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 rounded-2xl bg-white border border-gray-50 shadow-sm';
        div.innerHTML = `
            <span class="text-[10px] uppercase font-bold text-gray-400 tracking-widest">${item.label}</span>
            <span class="text-xs font-extrabold text-gray-700 capitalize">${item.value}</span>
        `;
        container.appendChild(div);
    });
}

// ==============================
// SISTEMA DE CARREGAMENTO PROGRESSIVO
// ==============================

function iniciarCarregamentoProgressivo(metodo) {
    currentLoadingVersion++;
    const loadingVersionAtStart = currentLoadingVersion;
    
    // Resetar UI do Grid
    learnedByGrid.innerHTML = '';
    
    // Se já estiver no cache, renderiza direto e encerra
    if (analyzedCache[metodo].length > 0 && analyzedCount >= totalToAnalyze) {
        renderizarListaCompleta(analyzedCache[metodo]);
        atualizarFeedbackStatus(true);
        return;
    }

    // Se tiver algo no cache mas não acabou, renderiza o que tem e continua
    if (analyzedCache[metodo].length > 0) {
        renderizarListaCompleta(analyzedCache[metodo]);
    }

    // Iniciar loop de análise em segundo plano
    processarLotes(metodo, loadingVersionAtStart);
}

async function processarLotes(metodo, version) {
    loadMoreContainer.classList.remove('hidden');
    
    while (analyzedCount < totalToAnalyze && version === currentLoadingVersion) {
        const batch = allPokemonPossible.slice(analyzedCount, analyzedCount + BATCH_SIZE);
        
        // Mostrar esqueletos temporários para feedback visual
        const skeletons = mostrarSkeletonsNoGrid(batch.length);

        try {
            const results = await Promise.all(batch.map(p => fetch(`${URL_API}pokemon/${p.name}`).then(res => res.json())));
            
            // Se o usuário trocou de aba durante o fetch, ignora os resultados
            if (version !== currentLoadingVersion) return;

            // Remover esqueletos
            skeletons.forEach(s => s.remove());

            results.forEach(pkmn => {
                const moveEntry = pkmn.moves.find(m => m.move.name === currentMoveData.name);
                if (moveEntry) {
                    // Armazenar no cache para todos os métodos que este Pokémon usa
                    moveEntry.version_group_details.forEach(detail => {
                        const m = detail.move_learn_method.name;
                        const info = {
                            id: pkmn.id,
                            name: pkmn.name,
                            sprite: pkmn.sprites.other['official-artwork'].front_default || pkmn.sprites.front_default,
                            types: pkmn.types.map(t => t.type.name),
                            method: m,
                            level: detail.level_learned_at
                        };

                        // Evitar duplicatas no cache do método
                        if (!analyzedCache[m].some(item => item.id === info.id)) {
                            analyzedCache[m].push(info);
                            
                            // Se for o método atual, renderiza o card imediatamente
                            if (m === metodo) {
                                renderizarCardPokemon(info);
                            }
                        }
                    });
                }
            });

            analyzedCount += batch.length;
            atualizarFeedbackStatus(false);

        } catch (error) {
            console.error('Erro ao processar lote:', error);
            skeletons.forEach(s => s.remove());
            analyzedCount += batch.length; // Pular para não travar
        }

        // Pequena pausa para manter a UI fluida
        await new Promise(r => setTimeout(r, 100));
    }

    if (version === currentLoadingVersion) {
        atualizarFeedbackStatus(true);
        verificarEstadoVazio(metodo);
    }
}

function mostrarSkeletonsNoGrid(quantidade) {
    const skeletons = [];
    for (let i = 0; i < quantidade; i++) {
        const skel = document.createElement('div');
        skel.className = 'animate-pulse flex flex-col items-center p-4 rounded-3xl bg-gray-100/50 h-48';
        skel.innerHTML = `
            <div class="w-20 h-20 bg-gray-200 rounded-2xl mb-4"></div>
            <div class="h-3 bg-gray-200 rounded w-12 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-20"></div>
        `;
        learnedByGrid.appendChild(skel);
        skeletons.push(skel);
    }
    return skeletons;
}

function renderizarCardPokemon(pkmn) {
    // Evitar renderizar duplicado no grid se o Pokémon tem múltiplas entradas de level-up por exemplo
    if (document.getElementById(`pkmn-card-${pkmn.id}`)) return;

    const card = document.createElement('div');
    card.id = `pkmn-card-${pkmn.id}`;
    card.className = 'flex flex-col items-center group cursor-pointer p-4 rounded-3xl transition-all duration-500 hover:bg-white hover:shadow-xl border border-transparent hover:border-white/50 animate-fade-in';
    
    card.addEventListener('click', () => {
        if (typeof abrirPokemon === 'function') {
            abrirPokemon(pkmn.name);
        } else {
            window.location.href = `index.html?search=${pkmn.name}`;
        }
    });

    const levelInfo = pkmn.method === 'level-up' ? `<span class="text-[9px] font-black text-pokedex-red mt-1">Lv. ${pkmn.level}</span>` : '';

    card.innerHTML = `
        <div class="relative w-20 h-20 mb-4">
            <div class="absolute inset-0 bg-gray-100 rounded-2xl group-hover:bg-pokedex-red/5 transition-colors duration-500"></div>
            <img src="${pkmn.sprite}" alt="${pkmn.name}" class="relative z-10 w-full h-full object-contain transform transition-transform duration-500 group-hover:scale-110" loading="lazy">
        </div>
        <span class="text-[9px] font-bold text-gray-300 uppercase tracking-widest">#${String(pkmn.id).padStart(3, '0')}</span>
        <span class="text-xs font-extrabold capitalize text-gray-700 mt-1">${pkmn.name.replace(/-/g, ' ')}</span>
        ${levelInfo}
        <div class="flex gap-1 mt-2">
            ${pkmn.types.map(t => `<div class="w-1.5 h-1.5 rounded-full tipo-${t}"></div>`).join('')}
        </div>
    `;
    learnedByGrid.appendChild(card);
}

function renderizarListaCompleta(lista) {
    learnedByGrid.innerHTML = '';
    // Ordenar por ID para consistência
    const ordenada = [...lista].sort((a, b) => a.id - b.id);
    ordenada.forEach(renderizarCardPokemon);
}

function atualizarFeedbackStatus(finalizado) {
    const activeMethod = document.querySelector('.tab-btn.ativa').dataset.method;
    const encontrados = analyzedCache[activeMethod].length;

    if (finalizado) {
        if (encontrados > 0) {
            loadMoreStatus.textContent = `${encontrados} Pokémon encontrados`;
        } else {
            loadMoreStatus.textContent = '';
        }
        loadMoreContainer.classList.add('hidden');
    } else {
        loadMoreStatus.textContent = `Analisando: ${analyzedCount} de ${totalToAnalyze} (${encontrados} encontrados)`;
        btnLoadMore.textContent = 'Analisando Pokémon...';
        btnLoadMore.disabled = true;
    }
}

function verificarEstadoVazio(metodo) {
    if (analyzedCache[metodo].length === 0 && analyzedCount >= totalToAnalyze) {
        exibirEstadoVazio();
    }
}

function exibirEstadoVazio() {
    learnedByGrid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 font-medium italic">Nenhum Pokémon aprende este golpe por este método.</div>`;
    loadMoreContainer.classList.add('hidden');
}

// ==============================
// EVENTOS E NAVEGAÇÃO
// ==============================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('ativa')) return;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('ativa'));
        btn.classList.add('ativa');

        const metodo = btn.dataset.method;
        iniciarCarregamentoProgressivo(metodo);
    });
});

// Animação de fade-in personalizada via CSS injetado
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fadeIn 0.4s ease-out forwards;
    }
`;
document.head.appendChild(style);
