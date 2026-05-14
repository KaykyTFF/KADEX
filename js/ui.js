function exibirDadosBasicos(dados) {
    imgPokemon.src = dados.sprites.other["official-artwork"].front_default;
    imgPokemon.alt = "Imagem de " + dados.name;

    nomePokemon.textContent = dados.name.charAt(0).toUpperCase() + dados.name.slice(1);
    numeroPokemon.textContent = "#" + String(dados.id).padStart(3, "0");

    tiposPokemon.innerHTML = "";
    dados.types.forEach(function(item) {
        const badge = document.createElement("span");
        badge.classList.add("tipo", "tipo-" + item.type.name);
        badge.textContent = item.type.name;
        tiposPokemon.appendChild(badge);
    });

    document.getElementById("alturaPokemon").textContent = (dados.height / 10) + " m";
    document.getElementById("pesoPokemon").textContent = (dados.weight / 10) + " kg";

    const statsContainer = document.getElementById("baseStatsContainer");
    statsContainer.innerHTML = ""; 

    const nomesStatsMap = {
        "hp": "HP", "attack": "Attack", "defense": "Defense",
        "special-attack": "Sp. Atk", "special-defense": "Sp. Def", "speed": "Speed"
    };

    dados.stats.forEach(function(item) {
        const statNameDisplay = nomesStatsMap[item.stat.name] || item.stat.name;
        const statValue = item.base_stat;
        const porcentagem = Math.min((statValue / 255) * 100, 100);

        let corBarra = "#ffdd57"; 
        if (statValue < 50) corBarra = "#ff5959"; 
        if (statValue >= 90) corBarra = "#a0e515"; 
        if (statValue >= 120) corBarra = "#23cd5e"; 

        const divRow = document.createElement("div");
        divRow.classList.add("stat-row");
        divRow.innerHTML = `
            <div class="stat-name">${statNameDisplay}</div>
            <div class="stat-value">${statValue}</div>
            <div class="stat-bar-wrap">
                <div class="stat-bar-fill" style="width: ${porcentagem}%; background-color: ${corBarra};"></div>
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

    const gridDefesas = document.getElementById("gridDefesas");
    gridDefesas.innerHTML = "";

    TODOS_OS_TIPOS.forEach(function(tipo) {
        const valor = multiplicadores[tipo];
        let textoMultiplicador = "";
        let classeCor = "";

        if (valor === 0) { textoMultiplicador = "0"; classeCor = "mult-imune"; } 
        else if (valor === 0.25) { textoMultiplicador = "¼"; classeCor = "mult-resist"; } 
        else if (valor === 0.5) { textoMultiplicador = "½"; classeCor = "mult-resist"; } 
        else if (valor === 2) { textoMultiplicador = "2"; classeCor = "mult-fraco"; } 
        else if (valor === 4) { textoMultiplicador = "4"; classeCor = "mult-fraco"; }

        const coluna = document.createElement("div");
        coluna.classList.add("defesa-coluna");
        const siglaTipo = tipo.substring(0, 3).toUpperCase();

        coluna.innerHTML = `
            <div class="defesa-tipo tipo-${tipo}">${siglaTipo}</div>
            <div class="defesa-multiplicador ${classeCor}">${textoMultiplicador}</div>
        `;
        gridDefesas.appendChild(coluna);
    });
}

async function buscarHabilidades(habilidades) {
    listaHabilidades.innerHTML = "";

    for (const item of habilidades) {
        const resposta = await fetch(item.ability.url);
        const dados    = await resposta.json();

        const entradaEfeito = dados.effect_entries.find(entrada => entrada.language.name === "en");
        let descricaoFinal = "Sem descrição detalhada disponível.";

        if (entradaEfeito) {
            const descricaoLimpa = entradaEfeito.effect.replace(/\n/g, ' ').trim();
            descricaoFinal = await traduzirTexto(descricaoLimpa);
        }

        const divHabilidade = document.createElement("div");
        divHabilidade.classList.add("habilidade");

        const oculta = item.is_hidden ? '<span class="oculta">(Habilidade Oculta)</span>' : "";
        const nomeFormatado = item.ability.name.replace(/-/g, ' ');

        divHabilidade.innerHTML = `
            <div class="nomeHabilidade">${nomeFormatado} ${oculta}</div>
            <div class="descHabilidade">${descricaoFinal}</div>
        `;
        listaHabilidades.appendChild(divHabilidade);
    }
}

function renderizarAbasFormas(variedades, nomeFormaAtual) {
    const abasFormas = document.getElementById("abasFormas");
    abasFormas.innerHTML = ""; 

    if (variedades.length <= 1) return;

    variedades.forEach(function(item) {
        const nomeFormaAPI = item.pokemon.name;
        const btnAba = document.createElement("button");
        btnAba.classList.add("aba-forma");
        
        if (nomeFormaAPI === nomeFormaAtual) btnAba.classList.add("ativa");

        const nomeFormatado = nomeFormaAPI.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        btnAba.textContent = nomeFormatado;

        btnAba.addEventListener("click", () => buscarPokemon(nomeFormaAPI));
        abasFormas.appendChild(btnAba);
    });
}

function obterDetalhesEvolucao(detalhes) {
    if (!detalhes || detalhes.length === 0) return "";
    const regra = detalhes[0];

    if (regra.trigger.name === "level-up") {
        if (regra.min_level) return `(Level ${regra.min_level})`;
        if (regra.min_happiness) return `(High Friendship)`;
        return `(Level Up)`;
    }
    if (regra.trigger.name === "use-item") return `(Use ${regra.item.name.replace(/-/g, ' ')})`;
    if (regra.trigger.name === "trade") return `(Trade)`;
    
    return `(${regra.trigger.name.replace(/-/g, ' ')})`;
}

async function construirCadeiaEvolutiva(noAtual, containerDOM) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("evo-wrapper");

    try {
        const respostaPokemon = await fetch(URL_API + "pokemon/" + noAtual.species.name);
        const dadosPokemon = await respostaPokemon.json();

        const tiposStr = dadosPokemon.types.map(item => item.type.name).join(' · ');
        const idFormatado = "#" + String(dadosPokemon.id).padStart(4, "0");
        const imagemUrl = dadosPokemon.sprites.other["official-artwork"].front_default || dadosPokemon.sprites.front_default;

        const divPokemon = document.createElement("div");
        divPokemon.classList.add("evo-pokemon");
        
        divPokemon.addEventListener("click", () => {
            document.getElementById("inputPokemon").value = noAtual.species.name;
            buscarPokemon(noAtual.species.name);
        });

        divPokemon.innerHTML = `
            <img src="${imagemUrl}" alt="${dadosPokemon.name}" loading="lazy">
            <span class="evo-id">${idFormatado}</span>
            <span class="evo-name">${dadosPokemon.name}</span>
            <span class="evo-types">${tiposStr}</span>
        `;
        wrapper.appendChild(divPokemon);

        if (noAtual.evolves_to.length > 0) {
            const branchesContainer = document.createElement("div");
            branchesContainer.classList.add("evo-branches");

            for (const proximaEvolucao of noAtual.evolves_to) {
                const branch = document.createElement("div");
                branch.classList.add("evo-branch");

                const textoCondicao = obterDetalhesEvolucao(proximaEvolucao.evolution_details);
                const seta = document.createElement("div");
                seta.classList.add("evo-arrow");
                seta.innerHTML = `<i>→</i><span>${textoCondicao}</span>`;

                branch.appendChild(seta);
                await construirCadeiaEvolutiva(proximaEvolucao, branch);
                branchesContainer.appendChild(branch);
            }
            wrapper.appendChild(branchesContainer);
        }
        containerDOM.appendChild(wrapper);
    } catch (erro) {
        console.error("Erro ao construir nó evolutivo:", erro);
    }
}

// ==============================
// Função: Filtra e exibe os movimentos aprendidos por Nível
// ==============================
async function buscarMovimentos(movesDaAPI) {
    
    listaMovimentos.innerHTML = "";

    // 1. Filtrar apenas os movimentos aprendidos por "level-up"
    let movimentosLevelUp = [];

    movesDaAPI.forEach(function(itemMovimento) {
        // Encontra todas as vezes que o movimento é aprendido por aumento de nível nas versões do jogo
        const detalhesLevelUp = itemMovimento.version_group_details.filter(v => v.move_learn_method.name === "level-up");

        if (detalhesLevelUp.length > 0) {
            // Pega a versão mais recente em que ele aprende o golpe (o último item do array)
            const ultimoDetalhe = detalhesLevelUp[detalhesLevelUp.length - 1];
            
            movimentosLevelUp.push({
                nomeUrl: itemMovimento.move.url,
                nomeExibicao: itemMovimento.move.name.replace(/-/g, ' '),
                nivel: ultimoDetalhe.level_learned_at
            });
        }
    });

    // 2. Ordenar a lista pelo nível de aprendizado (do menor para o maior)
    movimentosLevelUp.sort((a, b) => a.nivel - b.nivel);

    // 3. Buscar os detalhes técnicos de cada movimento em paralelo (Power, Accuracy, Class)
    const promessasAtaques = movimentosLevelUp.map(mov => fetch(mov.nomeUrl).then(res => res.json()));
    
    try {
        const dadosAtaques = await Promise.all(promessasAtaques);

        // 4. Montar o HTML da tabela
        dadosAtaques.forEach(function(dadosAtaque, index) {
            const nivel = movimentosLevelUp[index].nivel;
            const nome = movimentosLevelUp[index].nomeExibicao;
            const tipo = dadosAtaque.type.name;
            const categoria = dadosAtaque.damage_class.name; 
            const poder = dadosAtaque.power ? dadosAtaque.power : "—";
            const precisao = dadosAtaque.accuracy ? dadosAtaque.accuracy : "—";

            const tr = document.createElement("tr");

            // Badge de Tipo reaproveitando as suas classes CSS originais
            const badgeTipo = `<span class="tipo tipo-${tipo}" style="padding: 4px 8px; font-size: 0.65rem;">${tipo.toUpperCase()}</span>`;

            // Configuração visual do ícone de Categoria
            let badgeCategoria = "—";
            if (categoria === "physical") badgeCategoria = `<span class="mov-cat cat-physical" title="Physical">P</span>`;
            else if (categoria === "special") badgeCategoria = `<span class="mov-cat cat-special" title="Special">S</span>`;
            else if (categoria === "status") badgeCategoria = `<span class="mov-cat cat-status" title="Status">St</span>`;

            tr.innerHTML = `
                <td>${nivel === 0 ? 'Evo' : nivel}</td>
                <td>${nome}</td>
                <td style="text-align: center;">${badgeTipo}</td>
                <td style="text-align: center;">${badgeCategoria}</td>
                <td>${poder}</td>
                <td>${precisao}</td>
            `;

            listaMovimentos.appendChild(tr);
        });

    } catch (erro) {
        console.error("Erro ao carregar detalhes dos movimentos:", erro);
        listaMovimentos.innerHTML = `<tr><td colspan="6" style="text-align:center;">Falha ao carregar ataques.</td></tr>`;
    }
}


// ==============================
// Função: Filtra e exibe os movimentos baseado no método de aprendizado
// ==============================
async function buscarMovimentos(movesDaAPI, metodo = "level-up") {
    
    // Mostra estado de carregamento dentro da tabela
    listaMovimentos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Carregando movimentos...</td></tr>`;

    let movimentosFiltrados = [];

    // 1. Filtrar os movimentos pelo método escolhido (level-up, machine, egg)
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

    // Se o Pokémon não aprender nada por esse método, avisa e encerra
    if (movimentosFiltrados.length === 0) {
        listaMovimentos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Nenhum movimento encontrado para este filtro.</td></tr>`;
        return;
    }

    // 2. Ordenação: por nível numérico se for Level-up, ou ordem alfabética se for TM/Egg
    if (metodo === "level-up") {
        movimentosFiltrados.sort((a, b) => a.nivel - b.nivel);
    } else {
        movimentosFiltrados.sort((a, b) => a.nomeExibicao.localeCompare(b.nomeExibicao));
    }

    // 3. Buscar detalhes na API
    try {
        const promessasAtaques = movimentosFiltrados.map(mov => fetch(mov.nomeUrl).then(res => res.json()));
        const dadosAtaques = await Promise.all(promessasAtaques);

        listaMovimentos.innerHTML = ""; // Limpa o "Carregando..."

        // 4. Montar a tabela
        dadosAtaques.forEach(function(dadosAtaque, index) {
            const nivel = movimentosFiltrados[index].nivel;
            const nome = movimentosFiltrados[index].nomeExibicao;
            const tipo = dadosAtaque.type.name;
            const categoria = dadosAtaque.damage_class.name; 
            const poder = dadosAtaque.power ? dadosAtaque.power : "—";
            const precisao = dadosAtaque.accuracy ? dadosAtaque.accuracy : "—";

            const tr = document.createElement("tr");

            const badgeTipo = `<span class="tipo tipo-${tipo}" style="padding: 4px 8px; font-size: 0.65rem;">${tipo.toUpperCase()}</span>`;

            let badgeCategoria = "—";
            if (categoria === "physical") badgeCategoria = `<span class="mov-cat cat-physical" title="Physical">P</span>`;
            else if (categoria === "special") badgeCategoria = `<span class="mov-cat cat-special" title="Special">S</span>`;
            else if (categoria === "status") badgeCategoria = `<span class="mov-cat cat-status" title="Status">St</span>`;

            tr.innerHTML = `
                <td>${nivel === 0 ? 'Evo' : nivel}</td>
                <td>${nome}</td>
                <td style="text-align: center;">${badgeTipo}</td>
                <td style="text-align: center;">${badgeCategoria}</td>
                <td>${poder}</td>
                <td>${precisao}</td>
            `;

            listaMovimentos.appendChild(tr);
        });

    } catch (erro) {
        console.error("Erro ao carregar detalhes dos movimentos:", erro);
        listaMovimentos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #e3000f;">Falha ao carregar ataques.</td></tr>`;
    }
}