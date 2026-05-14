function exibirDetalhesExtras(dados, especie) {
    const trainingContainer = document.getElementById("infoTraining");
    const breedingContainer = document.getElementById("infoBreeding");
    const extraContainer = document.getElementById("infoExtras");

    // --- Training ---
    const evYield = dados.stats
        .filter(s => s.effort > 0)
        .map(s => `${s.effort} ${s.stat.name.replace(/-/g, ' ')}`)
        .join(', ') || 'Nenhum';

    const catchRate = especie.capture_rate;
    const captureDifficulty = catchRate > 200 ? 'Fácil' : catchRate > 100 ? 'Média' : catchRate > 50 ? 'Difícil' : 'Muito Difícil';
    const catchPercentage = ((catchRate / 255) * 100).toFixed(1);

    trainingContainer.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">EV Yield</span>
                <span class="font-extrabold text-gray-700 capitalize text-right ml-4">${evYield}</span>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Taxa de Captura</span>
                <div class="text-right">
                    <span class="font-extrabold text-gray-700 block">${catchRate} (${catchPercentage}%)</span>
                    <span class="text-[10px] font-bold text-pokedex-red uppercase">${captureDifficulty}</span>
                </div>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Amizade Base</span>
                <span class="font-extrabold text-gray-700">${especie.base_happiness}</span>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Exp. Base</span>
                <span class="font-extrabold text-gray-700">${dados.base_experience || '—'}</span>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Crescimento</span>
                <span class="font-extrabold text-gray-700 capitalize">${especie.growth_rate.name.replace(/-/g, ' ')}</span>
            </div>
        </div>
    `;

    // --- Breeding ---
    const eggGroups = especie.egg_groups.map(g => `<a href="egg-group.html?name=${g.name}" class="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold capitalize hover:bg-indigo-100 transition-colors cursor-pointer">${g.name.replace(/-/g, ' ')}</a>`).join(' ') || 'Nenhum';
    
    // Gender Ratio
    let genderHtml = '';
    if (especie.gender_rate === -1) {
        genderHtml = '<span class="font-extrabold text-gray-500 italic">Sem Gênero</span>';
    } else {
        const femalePercent = (especie.gender_rate / 8) * 100;
        const malePercent = 100 - femalePercent;
        genderHtml = `
            <div class="w-full space-y-1">
                <div class="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span class="text-blue-500">${malePercent}% ♂</span>
                    <span class="text-pink-500">${femalePercent}% ♀</span>
                </div>
                <div class="h-1.5 w-full bg-pink-200 rounded-full overflow-hidden flex">
                    <div class="h-full bg-blue-400" style="width: ${malePercent}%"></div>
                </div>
            </div>
        `;
    }

    const eggCycles = especie.hatch_counter;
    const hatchSteps = (eggCycles * 255).toLocaleString('pt-BR');
    const hatchDifficulty = eggCycles > 35 ? 'Lento' : eggCycles > 20 ? 'Normal' : 'Rápido';

    breedingContainer.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Grupos de Ovos</span>
                <div class="flex flex-wrap gap-1 justify-end">${eggGroups}</div>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Gênero</span>
                <div class="w-32 text-right">${genderHtml}</div>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Ciclos de Ovo</span>
                <div class="text-right">
                    <span class="font-extrabold text-gray-700 block">${eggCycles} ciclos</span>
                    <span class="text-[10px] font-bold text-gray-400 uppercase">${hatchSteps} passos (${hatchDifficulty})</span>
                </div>
            </div>
        </div>
    `;

    // --- Extra Info ---
    const isLegendary = especie.is_legendary ? '<span class="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Lendário</span>' : '';
    const isMythical = especie.is_mythical ? '<span class="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Mítico</span>' : '';
    const isBaby = especie.is_baby ? '<span class="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Bebê</span>' : '';

    extraContainer.innerHTML = `
        <div class="space-y-3">
            <div class="flex flex-wrap gap-2 mb-2">${isLegendary}${isMythical}${isBaby}</div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Geração</span>
                <span class="font-extrabold text-gray-700 uppercase">${especie.generation.name.replace('generation-', 'Gen ')}</span>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Habitat</span>
                <span class="font-extrabold text-gray-700 capitalize">${especie.habitat ? especie.habitat.name : 'Desconhecido'}</span>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Formato</span>
                <span class="font-extrabold text-gray-700 capitalize">${especie.shape ? especie.shape.name.replace(/-/g, ' ') : 'Desconhecido'}</span>
            </div>
            <div class="flex justify-between items-center text-sm p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span class="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Cor</span>
                <span class="font-extrabold text-gray-700 capitalize">${especie.color ? especie.color.name : 'Desconhecida'}</span>
            </div>
        </div>
    `;
}

function exibirDadosBasicos(dados) {
    imgPokemon.src = dados.sprites.other["official-artwork"].front_default;
    imgPokemon.alt = "Imagem de " + dados.name;

    nomePokemon.textContent = dados.name;
    numeroPokemon.textContent = "#" + String(dados.id).padStart(3, "0");

    // Atualiza o nome no topo se existir (usado na pokemon.html)
    const topoNome = document.getElementById("topoNomePokemon");
    if (topoNome) {
        topoNome.textContent = dados.name;
    }

    tiposPokemon.innerHTML = "";
    dados.types.forEach(function(item) {
        tiposPokemon.innerHTML += renderTypeBadge(item.type.name);
    });

    document.getElementById("alturaPokemon").textContent = (dados.height / 10) + " m";
    document.getElementById("pesoPokemon").textContent = (dados.weight / 10) + " kg";

    const statsContainer = document.getElementById("baseStatsContainer");
    statsContainer.innerHTML = ""; 

    const nomesStatsMap = {
        "hp": "HP", "attack": "Ataque", "defense": "Defesa",
        "special-attack": "Sp. Atk", "special-defense": "Sp. Def", "speed": "Velocidade"
    };

    dados.stats.forEach(function(item) {
        const statNameDisplay = nomesStatsMap[item.stat.name] || item.stat.name;
        const statValue = item.base_stat;
        const porcentagem = Math.min((statValue / 255) * 100, 100);

        let corBarra = "bg-yellow-400"; 
        if (statValue < 50) corBarra = "bg-red-400"; 
        if (statValue >= 90) corBarra = "bg-lime-400"; 
        if (statValue >= 120) corBarra = "bg-green-500"; 

        const divRow = document.createElement("div");
        divRow.className = "space-y-1.5";
        divRow.innerHTML = `
            <div class="flex justify-between items-end">
                <span class="text-[10px] uppercase font-bold text-gray-400 tracking-widest">${statNameDisplay}</span>
                <span class="text-xs font-bold text-gray-700">${statValue}</span>
            </div>
            <div class="stat-bar-bg">
                <div class="stat-bar-fill ${corBarra}" style="width: ${porcentagem}%;"></div>
            </div>
        `;
        statsContainer.appendChild(divRow);
    });
}

async function buscarTipagem(nomesTipos) {
    const multiplicadores = {};
    TODOS_OS_TIPOS.forEach(tipo => multiplicadores[tipo] = 1);

    for (const nomeTipo of nomesTipos) {
        const resposta = await fetch(URL_API + "type/" + nomeTipo);
        const dados    = await resposta.json();
        const relacoes = dados.damage_relations;

        relacoes.double_damage_from.forEach(t => multiplicadores[t.name] *= 2);
        relacoes.half_damage_from.forEach(t => multiplicadores[t.name] *= 0.5);
        relacoes.no_damage_from.forEach(t => multiplicadores[t.name] *= 0);
    }

    const containerDefesas = document.getElementById("containerDefesas");
    const resumoEfetividade = document.getElementById("resumoEfetividade");
    
    if (!containerDefesas) return;

    containerDefesas.innerHTML = "";
    if (resumoEfetividade) resumoEfetividade.innerHTML = "";

    TODOS_OS_TIPOS.forEach(tipo => {
        const valor = multiplicadores[tipo];
        let textoMult = valor + "x";
        if (valor === 0.5) textoMult = "½";
        if (valor === 0.25) textoMult = "¼";
        if (valor === 1) textoMult = "1";
        if (valor === 0) textoMult = "0";

        let multClass = "text-gray-400 font-medium";
        let cellBg = "bg-white";
        let borderClass = "border-gray-100";

        if (valor > 1) {
            multClass = "text-red-600 font-black";
            cellBg = "bg-red-50/30";
            borderClass = "border-red-100";
        } else if (valor > 0 && valor < 1) {
            multClass = "text-emerald-600 font-bold";
            cellBg = "bg-emerald-50/20";
            borderClass = "border-emerald-50";
        } else if (valor === 0) {
            multClass = "text-white font-black";
            cellBg = "bg-gray-900";
            borderClass = "border-gray-800";
        }

        const cell = document.createElement("a");
        cell.href = `type.html?name=${tipo}`;
        cell.className = `flex flex-col border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-105 ${cellBg} ${borderClass}`;
        
        // Pega as 3 primeiras letras do tipo
        const siglaTipo = tipo.substring(0, 3).toUpperCase();

        cell.innerHTML = `
            <div class="tipo-${tipo} text-white text-[9px] font-black text-center py-1 uppercase tracking-tighter">
                ${siglaTipo}
            </div>
            <div class="flex-grow flex items-center justify-center py-2">
                <span class="text-xs ${multClass}">${textoMult}</span>
            </div>
        `;
        containerDefesas.appendChild(cell);
    });
}

async function buscarHabilidades(habilidades) {
    listaHabilidades.innerHTML = "";

    for (const item of habilidades) {
        const resposta = await fetch(item.ability.url);
        const dados    = await resposta.json();

        // Usa o helper global para obter o texto no melhor idioma disponível
        const descricaoFinal = obterTextoPorIdioma(dados.flavor_text_entries, "flavor_text");

        const aHabilidade = document.createElement("a");
        aHabilidade.href = `ability.html?name=${dados.name}`;
        aHabilidade.className = "block p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group";

        const oculta = item.is_hidden ? '<span class="text-[10px] font-bold text-pokedex-red/60 ml-2 uppercase tracking-tighter">(Oculta)</span>' : "";
        const nomeFormatado = item.ability.name.replace(/-/g, ' ');

        aHabilidade.innerHTML = `
            <div class="text-sm font-extrabold capitalize text-gray-800 mb-1 flex items-center group-hover:text-pokedex-red transition-colors">
                ${nomeFormatado} ${oculta}
                <svg class="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </div>
            <div class="text-xs text-gray-500 leading-relaxed line-clamp-2">${descricaoFinal}</div>
        `;
        listaHabilidades.appendChild(aHabilidade);
    }
}

function renderizarAbasFormas(variedades, nomeFormaAtual) {
    const abasFormas = document.getElementById("abasFormas");
    abasFormas.innerHTML = ""; 

    if (variedades.length <= 1) return;

    variedades.forEach(function(item) {
        const nomeFormaAPI = item.pokemon.name;
        const btnAba = document.createElement("button");
        btnAba.className = "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 transform hover:scale-105";
        
        if (nomeFormaAPI === nomeFormaAtual) {
            btnAba.classList.add("bg-pokedex-red", "text-white", "shadow-lg", "shadow-pokedex-red/20");
        } else {
            btnAba.classList.add("bg-white", "text-gray-400", "hover:text-gray-600", "border", "border-gray-100");
        }

        const nomeFormatado = nomeFormaAPI.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        btnAba.textContent = nomeFormatado;

        btnAba.addEventListener("click", () => {
            if (typeof entidadeBusca === "function") {
                entidadeBusca(nomeFormaAPI);
            }
        });
        abasFormas.appendChild(btnAba);
    });
}

function obterDetalhesEvolucao(detalhes) {
    if (!detalhes || detalhes.length === 0) return "";
    const regra = detalhes[0];

    if (regra.trigger.name === "level-up") {
        if (regra.min_level) return `Lv. ${regra.min_level}`;
        if (regra.min_happiness) return `Amizade`;
        return `Nível`;
    }
    if (regra.trigger.name === "use-item") return regra.item.name.replace(/-/g, ' ');
    if (regra.trigger.name === "trade") return `Troca`;
    
    return regra.trigger.name.replace(/-/g, ' ');
}

async function construirCadeiaEvolutiva(noAtual, containerDOM) {
    try {
        // 1. Buscar dados da espécie primeiro
        const respostaEspecie = await fetch(URL_API + "pokemon-species/" + noAtual.species.name);
        if (!respostaEspecie.ok) throw new Error('Espécie não encontrada');
        const dadosEspecie = await respostaEspecie.json();

        // 2. Encontrar a variedade padrão
        const defaultVariety = dadosEspecie.varieties.find(v => v.is_default) || dadosEspecie.varieties[0];
        const respostaPokemon = await fetch(defaultVariety.pokemon.url);
        if (!respostaPokemon.ok) throw new Error('Pokémon não encontrado');
        const dadosPokemon = await respostaPokemon.json();

        const idFormatado = "#" + String(dadosPokemon.id).padStart(4, "0");
        const imagemUrl = dadosPokemon.sprites.other["official-artwork"].front_default || dadosPokemon.sprites.front_default;

        // Container para este Pokémon e suas evoluções
        const wrapperNode = document.createElement("div");
        wrapperNode.className = "flex items-center gap-4 md:gap-8";

        const divPokemon = document.createElement("div");
        divPokemon.className = "flex flex-col items-center group cursor-pointer p-3 rounded-2xl transition-all duration-500 hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100 w-24 md:w-28 flex-shrink-0";
        
        divPokemon.addEventListener("click", () => {
            if (typeof abrirPokemon === 'function') {
                abrirPokemon(noAtual.species.name);
            } else {
                document.getElementById("inputPokemon").value = noAtual.species.name;
                if (typeof entidadeBusca === "function") {
                    entidadeBusca(noAtual.species.name);
                }
            }
        });

        divPokemon.innerHTML = `
            <div class="relative w-16 h-16 md:w-20 md:h-20 mb-2">
                <div class="absolute inset-0 bg-gray-50 rounded-2xl group-hover:bg-pokedex-red/5 transition-colors duration-500"></div>
                <img src="${imagemUrl}" alt="${dadosPokemon.name}" class="relative z-10 w-full h-full object-contain transform transition-transform duration-500 group-hover:scale-110" loading="lazy">
            </div>
            <span class="text-[9px] font-bold text-gray-300 uppercase tracking-widest">${idFormatado}</span>
            <span class="text-xs font-black capitalize text-gray-700 mt-0.5 text-center truncate w-full">${dadosPokemon.name}</span>
            <div class="flex gap-1 mt-1.5">
                ${dadosPokemon.types.map(t => `<div class="w-1.5 h-1.5 rounded-full tipo-${t.type.name} shadow-sm"></div>`).join('')}
            </div>
        `;
        wrapperNode.appendChild(divPokemon);

        if (noAtual.evolves_to.length > 0) {
            // Container para as ramificações (pode ter mais de uma evolução a partir deste nó)
            const branchesContainer = document.createElement("div");
            branchesContainer.className = "flex flex-col gap-4";

            for (const proximaEvolucao of noAtual.evolves_to) {
                const branch = document.createElement("div");
                branch.className = "flex items-center gap-4 md:gap-8";

                const textoCondicao = obterDetalhesEvolucao(proximaEvolucao.evolution_details);
                const seta = document.createElement("div");
                seta.className = "flex flex-col items-center text-gray-200 min-w-[40px]";
                seta.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    <span class="text-[8px] font-bold uppercase tracking-tighter mt-1 text-gray-400 text-center">${textoCondicao}</span>
                `;

                branch.appendChild(seta);
                await construirCadeiaEvolutiva(proximaEvolucao, branch);
                branchesContainer.appendChild(branch);
            }
            wrapperNode.appendChild(branchesContainer);
        }

        containerDOM.appendChild(wrapperNode);
    } catch (erro) {
        console.error("Erro ao construir nó evolutivo:", erro);
    }
}

async function buscarMovimentos(movesDaAPI, metodo = "level-up") {
    listaMovimentos.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-gray-400 font-medium italic">Carregando movimentos...</td></tr>`;

    let movimentosFiltrados = [];

    movesDaAPI.forEach(function(itemMovimento) {
        const detalhes = itemMovimento.version_group_details.filter(v => v.move_learn_method.name === metodo);

        if (detalhes.length > 0) {
            const ultimoDetalhe = detalhes[detalhes.length - 1];
            movimentosFiltrados.push({
                nomeUrl: itemMovimento.move.url,
                nomeExibicao: itemMovimento.move.name.replace(/-/g, ' '),
                nivel: metodo === 'level-up' ? ultimoDetalhe.level_learned_at : '—'
            });
        }
    });

    if (movimentosFiltrados.length === 0) {
        listaMovimentos.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-gray-400 font-medium italic">Nenhum movimento encontrado para este filtro.</td></tr>`;
        return;
    }

    if (metodo === "level-up") {
        movimentosFiltrados.sort((a, b) => a.nivel - b.nivel);
    } else {
        movimentosFiltrados.sort((a, b) => a.nomeExibicao.localeCompare(b.nomeExibicao));
    }

    try {
        const promessasAtaques = movimentosFiltrados.map(mov => fetch(mov.nomeUrl).then(res => res.json()));
        const dadosAtaques = await Promise.all(promessasAtaques);

        listaMovimentos.innerHTML = "";

        dadosAtaques.forEach(function(dadosAtaque, index) {
            const nivel = movimentosFiltrados[index].nivel;
            const nome = movimentosFiltrados[index].nomeExibicao;
            const tipo = dadosAtaque.type.name;
            const categoria = dadosAtaque.damage_class.name; 
            const poder = dadosAtaque.power ? dadosAtaque.power : "—";
            const precisao = dadosAtaque.accuracy ? dadosAtaque.accuracy : "—";

            const tr = document.createElement("tr");
            tr.className = "hover:bg-gray-50/50 transition-colors group";

            const badgeTipo = renderTypeBadge(tipo);
            const badgeCategoria = renderCategoryBadge(categoria);

            tr.innerHTML = `
                <td class="py-4 px-4 text-xs font-bold text-gray-300 group-hover:text-pokedex-red transition-colors">${nivel === 0 ? 'Evo' : nivel}</td>
                <td class="py-4 px-4 text-sm font-extrabold capitalize text-gray-700">
                    <a href="move.html?name=${dadosAtaque.name}" class="hover:text-pokedex-red transition-colors cursor-pointer flex items-center gap-2">
                        ${nome}
                        <svg class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                </td>
                <td class="py-4 px-4 text-center">${badgeTipo}</td>
                <td class="py-4 px-4 text-center">${badgeCategoria}</td>
                <td class="py-4 px-4 text-center text-xs font-bold text-gray-500">${poder}</td>
                <td class="py-4 px-4 text-center text-xs font-bold text-gray-500">${precisao}%</td>
            `;

            listaMovimentos.appendChild(tr);
        });

    } catch (erro) {
        console.error("Erro ao carregar detalhes dos movimentos:", erro);
        listaMovimentos.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-red-400 font-bold italic">Falha ao carregar ataques.</td></tr>`;
    }
}