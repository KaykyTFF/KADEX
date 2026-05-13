// URL base da PokéAPI
const URL_API = "https://pokeapi.co/api/v2/";

// Selecionando os elementos da página
const inputPokemon      = document.getElementById("inputPokemon");
const btnBuscar         = document.getElementById("btnBuscar");
const mensagemErro      = document.getElementById("mensagemErro");
const secaoResultado    = document.getElementById("secaoResultado");

const imgPokemon        = document.getElementById("imgPokemon");
const nomePokemon       = document.getElementById("nomePokemon");
const numeroPokemon     = document.getElementById("numeroPokemon");
const tiposPokemon      = document.getElementById("tiposPokemon");
const alturaPokemon     = document.getElementById("alturaPokemon");
const pesoPokemon       = document.getElementById("pesoPokemon");
const hpPokemon         = document.getElementById("hpPokemon");
const ataquePokemon     = document.getElementById("ataquePokemon");
const defesaPokemon     = document.getElementById("defesaPokemon");

const fraquezasPokemon  = document.getElementById("fraquezasPokemon");
const vantagensPokemon  = document.getElementById("vantagensPokemon");
const listaHabilidades  = document.getElementById("listaHabilidades");

const listaSugestoes    = document.getElementById("listaSugestoes");
let cachePokemons       = []; // Armazenará a lista global

const TODOS_OS_TIPOS = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
];



// ==============================
// Função auxiliar: Traduz textos do inglês para o português usando a MyMemory API
// ==============================
async function traduzirTexto(textoIngles) {
    try {
        // Codifica o texto para formato de URL (substitui espaços por %20, etc)
        const textoCodificado = encodeURIComponent(textoIngles);
        const urlTraducao = `https://api.mymemory.translated.net/get?q=${textoCodificado}&langpair=en|pt-br`;
        
        const resposta = await fetch(urlTraducao);
        const dados = await resposta.json();
        
        // Retorna o texto traduzido se a requisição for bem sucedida
        if (dados.responseData && dados.responseData.translatedText) {
            return dados.responseData.translatedText;
        }
        
        // Retorna o original como fallback em caso de falha da API externa
        return textoIngles; 
    } catch (erro) {
        console.error("Falha ao traduzir o texto:", erro);
        return textoIngles;
    }
}

// ==============================
// Função principal: busca o Pokémon na API
// ==============================
async function buscarPokemon(parametroOpcional) {

    // Define o nome a ser buscado: ou o texto do input ou o parâmetro vindo das abas/evolução
    const nomeBuscado = (typeof parametroOpcional === "string") 
        ? parametroOpcional 
        : inputPokemon.value.trim().toLowerCase();

    if (nomeBuscado === "") return;

    // Reinicia o estado da tela
    secaoResultado.classList.add("escondido");
    mensagemErro.classList.add("escondido");

    btnBuscar.textContent = "Buscando...";
    btnBuscar.disabled = true;

    try {
        // 1. Busca os dados básicos do Pokémon atual
        const respostaPokemon = await fetch(URL_API + "pokemon/" + nomeBuscado);
        if (!respostaPokemon.ok) throw new Error("Pokémon não encontrado");
        const dados = await respostaPokemon.json();

        // 2. Busca os dados da Espécie (essencial para formas e evolução)
        const respostaEspecie = await fetch(dados.species.url);
        const dadosEspecie = await respostaEspecie.json();

        // 3. Busca a Cadeia Evolutiva usando a URL encontrada na espécie
        const respostaEvolucao = await fetch(dadosEspecie.evolution_chain.url);
        const dadosEvolucao = await respostaEvolucao.json();

        // --- ATUALIZAÇÃO DA INTERFACE ---

        // Renderiza as abas de variações (Mega, Gmax, etc)
        renderizarAbasFormas(dadosEspecie.varieties, dados.name);

        // Limpa e constrói a árvore de evolução
        const gridEvolucao = document.getElementById("gridEvolucao");
        gridEvolucao.innerHTML = "";
        await construirCadeiaEvolutiva(dadosEvolucao.chain, gridEvolucao);

        // Preenche os dados básicos (Imagem, Stats, Altura, Peso)
        exibirDadosBasicos(dados);

        // Prepara os tipos para buscar fraquezas/vantagens
        const nomesTipos = dados.types.map(item => item.type.name);

        // Executa em paralelo a busca de tipagem e habilidades para ganhar tempo
        await Promise.all([
            buscarTipagem(nomesTipos),
            buscarHabilidades(dados.abilities)
        ]);

        // Mostra o resultado final
        secaoResultado.classList.remove("escondido");

    } catch (erro) {
        console.error(erro);
        mensagemErro.classList.remove("escondido");
    } finally {
        // Restaura o botão de busca
        btnBuscar.textContent = "Buscar";
        btnBuscar.disabled = false;
    }
}

// ==============================
// Função: Cache global para o Autocomplete
// ==============================
async function carregarListaGlobal() {
    try {
        // Busca um limite alto para obter os nomes e URLs base de todos os Pokémon
        const resposta = await fetch(URL_API + "pokemon?limit=10000");
        const dados = await resposta.json();
        cachePokemons = dados.results;
    } catch (erro) {
        console.error("Falha ao carregar lista para autocomplete.", erro);
    }
}

// Inicia o carregamento em background assim que o script é lido
carregarListaGlobal();

// ==============================
// Evento: Filtragem e exibição do Autocomplete
// ==============================
inputPokemon.addEventListener("input", function() {
    const termo = this.value.trim().toLowerCase();
    listaSugestoes.innerHTML = "";

    if (termo.length === 0) {
        listaSugestoes.classList.add("escondido");
        return;
    }

    // Filtra Pokémon cujo nome inicie com o termo digitado, limitando a 8 resultados
    const resultados = cachePokemons.filter(function(pokemon) {
        return pokemon.name.startsWith(termo);
    }).slice(0, 8);

    if (resultados.length === 0) {
        listaSugestoes.classList.add("escondido");
        return;
    }

    // Monta a interface da lista suspensa
    resultados.forEach(function(pokemon) {
        // Extrai o ID numérico do final da URL retornada pela API
        // Exemplo: "https://pokeapi.co/api/v2/pokemon/25/" -> "25"
        const segmentosUrl = pokemon.url.split("/");
        const idPokemon = segmentosUrl[segmentosUrl.length - 2];
        
        // Constrói a URL do sprite miniatura usando o repositório raw oficial
        const urlSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idPokemon}.png`;

        const itemLista = document.createElement("li");
        itemLista.classList.add("sugestao-item");
        
        itemLista.innerHTML = `
            <img src="${urlSprite}" alt="${pokemon.name}" class="sugestao-img" loading="lazy">
            <span class="sugestao-nome">${pokemon.name}</span>
        `;

        // Preenche o input e executa a busca ao clicar
        itemLista.addEventListener("click", function() {
            inputPokemon.value = pokemon.name;
            listaSugestoes.classList.add("escondido");
            buscarPokemon(); 
        });

        listaSugestoes.appendChild(itemLista);
    });

    listaSugestoes.classList.remove("escondido");
});

// Evento de usabilidade: Oculta a lista ao clicar fora do componente de busca
document.addEventListener("click", function(evento) {
    if (!document.getElementById("campoBusca").contains(evento.target)) {
        listaSugestoes.classList.add("escondido");
    }
});


// ==============================
// Função: preenche os dados básicos do card
// ==============================
function exibirDadosBasicos(dados) {

    imgPokemon.src = dados.sprites.other["official-artwork"].front_default;
    imgPokemon.alt = "Imagem de " + dados.name;

    nomePokemon.textContent = dados.name.charAt(0).toUpperCase() + dados.name.slice(1);
    numeroPokemon.textContent = "#" + String(dados.id).padStart(3, "0");

    // Tipos
    tiposPokemon.innerHTML = "";
    dados.types.forEach(function(item) {
        const badge = document.createElement("span");
        badge.classList.add("tipo", "tipo-" + item.type.name);
        badge.textContent = item.type.name;
        tiposPokemon.appendChild(badge);
    });

    // Dados Físicos
    document.getElementById("alturaPokemon").textContent = (dados.height / 10) + " m";
    document.getElementById("pesoPokemon").textContent = (dados.weight / 10) + " kg";

    // ==========================================
    // Nova Lógica de Geração de Barras de Stats
    // ==========================================
    const statsContainer = document.getElementById("baseStatsContainer");
    statsContainer.innerHTML = ""; // Limpa os stats da busca anterior

    // Objeto para formatar os nomes da API para exibição na tela
    const nomesStatsMap = {
        "hp": "HP",
        "attack": "Attack",
        "defense": "Defense",
        "special-attack": "Sp. Atk",
        "special-defense": "Sp. Def",
        "speed": "Speed"
    };

    dados.stats.forEach(function(item) {
        const statNameAPI = item.stat.name;
        const statValue = item.base_stat;
        const statNameDisplay = nomesStatsMap[statNameAPI] || statNameAPI;

        // O limite base de um stat na franquia geralmente é 255. Calculamos a % para a barra.
        const porcentagem = Math.min((statValue / 255) * 100, 100);

        // Lógica de cores baseada no valor do stat
        let corBarra = "#ffdd57"; // Amarelo (Padrão/Médio)
        if (statValue < 50) corBarra = "#ff5959"; // Vermelho (Baixo)
        if (statValue >= 90) corBarra = "#a0e515"; // Verde claro (Bom)
        if (statValue >= 120) corBarra = "#23cd5e"; // Verde escuro (Excelente)

        // Criação da estrutura HTML de cada linha
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

// ==============================
// Função: Calcula as defesas de tipo considerando combinações
// ==============================
async function buscarTipagem(nomesTipos) {

    // Inicializa todos os multiplicadores de dano como 1 (dano neutro)
    const multiplicadores = {};
    TODOS_OS_TIPOS.forEach(function(tipo) {
        multiplicadores[tipo] = 1;
    });

    // Calcula os multiplicadores acumulando as requisições da API
    for (const nomeTipo of nomesTipos) {
        const resposta = await fetch(URL_API + "type/" + nomeTipo);
        const dados    = await resposta.json();
        const relacoes = dados.damage_relations;

        // Multiplica por 2 os tipos dos quais recebe o dobro de dano
        relacoes.double_damage_from.forEach(function(t) {
            multiplicadores[t.name] *= 2;
        });

        // Multiplica por 0.5 os tipos dos quais recebe metade do dano
        relacoes.half_damage_from.forEach(function(t) {
            multiplicadores[t.name] *= 0.5;
        });

        // Multiplica por 0 os tipos dos quais é imune
        relacoes.no_damage_from.forEach(function(t) {
            multiplicadores[t.name] *= 0;
        });
    }

    // Renderiza a grade de defesas na tela
    const gridDefesas = document.getElementById("gridDefesas");
    gridDefesas.innerHTML = "";

    TODOS_OS_TIPOS.forEach(function(tipo) {
        
        const valor = multiplicadores[tipo];
        let textoMultiplicador = "";
        let classeCor = "";

        // Formatação visual do multiplicador (frações e cores do painel)
        if (valor === 0) {
            textoMultiplicador = "0";
            classeCor = "mult-imune";
        } else if (valor === 0.25) {
            textoMultiplicador = "¼";
            classeCor = "mult-resist";
        } else if (valor === 0.5) {
            textoMultiplicador = "½";
            classeCor = "mult-resist";
        } else if (valor === 2) {
            textoMultiplicador = "2";
            classeCor = "mult-fraco";
        } else if (valor === 4) {
            textoMultiplicador = "4";
            classeCor = "mult-fraco";
        }

        const coluna = document.createElement("div");
        coluna.classList.add("defesa-coluna");

        // Pega as 3 primeiras letras do tipo para exibir (Ex: "normal" -> "NOR")
        const siglaTipo = tipo.substring(0, 3).toUpperCase();

        coluna.innerHTML = `
            <div class="defesa-tipo tipo-${tipo}">${siglaTipo}</div>
            <div class="defesa-multiplicador ${classeCor}">${textoMultiplicador}</div>
        `;

        gridDefesas.appendChild(coluna);

    });

}


// ==============================
// Função: busca e exibe as habilidades do Pokémon com tradução dos efeitos detalhados
// ==============================
async function buscarHabilidades(habilidades) {

    listaHabilidades.innerHTML = "";

    for (const item of habilidades) {

        // Busca os detalhes da habilidade na PokéAPI
        const resposta = await fetch(item.ability.url);
        const dados    = await resposta.json();

        // Busca nos "effect_entries" para obter a descrição completa
        const entradaEfeito = dados.effect_entries.find(function(entrada) {
            return entrada.language.name === "en";
        });

        let descricaoFinal = "Sem descrição detalhada disponível.";

        if (entradaEfeito) {
            // Pega o efeito completo e remove quebras de linha
            const descricaoLimpa = entradaEfeito.effect.replace(/\n/g, ' ').trim();
            
            // Consome a API de tradução e aguarda o resultado
            descricaoFinal = await traduzirTexto(descricaoLimpa);
        }

        // Cria o card da habilidade
        const divHabilidade = document.createElement("div");
        divHabilidade.classList.add("habilidade");

        // Marca se for habilidade oculta e formata o nome
        const oculta = item.is_hidden ? '<span class="oculta">(Habilidade Oculta)</span>' : "";
        const nomeFormatado = item.ability.name.replace(/-/g, ' ');

        divHabilidade.innerHTML = `
            <div class="nomeHabilidade">${nomeFormatado} ${oculta}</div>
            <div class="descHabilidade">${descricaoFinal}</div>
        `;

        listaHabilidades.appendChild(divHabilidade);

    }

}

// ==============================
// Função auxiliar: cria um badge de tipo
// ==============================
function criarBadgeTipo(nomeTipo) {

    const badge = document.createElement("span");
    badge.classList.add("tipo", "tipo-" + nomeTipo);
    badge.textContent = nomeTipo;
    return badge;

}


// ==============================
// Função auxiliar: busca o valor de uma stat pelo nome
// ==============================
function pegarStat(stats, nomeStat) {

    const encontrado = stats.find(function(s) {
        return s.stat.name === nomeStat;
    });

    return encontrado ? encontrado.base_stat : "—";

}

// ==============================
// Função: Renderiza as abas de formas/variedades
// ==============================
function renderizarAbasFormas(variedades, nomeFormaAtual) {
    
    const abasFormas = document.getElementById("abasFormas");
    abasFormas.innerHTML = ""; // Limpa abas de buscas anteriores

    // Se houver apenas 1 variedade (a original), não precisamos de abas
    if (variedades.length <= 1) return;

    variedades.forEach(function(item) {
        
        const nomeFormaAPI = item.pokemon.name;
        
        const btnAba = document.createElement("button");
        btnAba.classList.add("aba-forma");
        
        // Destaca a aba se for exatamente a forma que está sendo exibida agora
        if (nomeFormaAPI === nomeFormaAtual) {
            btnAba.classList.add("ativa");
        }

        // Formata o nome da API ("venusaur-mega") para visualização ("Venusaur Mega")
        const nomeFormatado = nomeFormaAPI
            .split('-')
            .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
            .join(' ');

        btnAba.textContent = nomeFormatado;

        // Adiciona evento de recarregamento
        btnAba.addEventListener("click", function() {
            // Chamamos a função principal forçando o nome da variação específica
            buscarPokemon(nomeFormaAPI);
        });

        abasFormas.appendChild(btnAba);
        
    });

}

// ==============================
// Função Auxiliar: Extrai a regra de evolução (Nível, Pedra, Troca)
// ==============================
function obterDetalhesEvolucao(detalhes) {
    if (!detalhes || detalhes.length === 0) return "";
    
    const regra = detalhes[0];

    if (regra.trigger.name === "level-up") {
        if (regra.min_level) return `(Level ${regra.min_level})`;
        if (regra.min_happiness) return `(High Friendship)`;
        return `(Level Up)`;
    }
    if (regra.trigger.name === "use-item") {
        const nomeItem = regra.item.name.replace(/-/g, ' ');
        return `(Use ${nomeItem})`;
    }
    if (regra.trigger.name === "trade") {
        return `(Trade)`;
    }
    
    // Fallback genérico formata o gatilho ("shed-into" -> "Shed Into")
    return `(${regra.trigger.name.replace(/-/g, ' ')})`;
}

// ==============================
// Função Recursiva: Constrói a árvore do DOM iterando sobre os nós da API
// ==============================
async function construirCadeiaEvolutiva(noAtual, containerDOM) {
    
    // 1. Cria o wrapper flex principal
    const wrapper = document.createElement("div");
    wrapper.classList.add("evo-wrapper");

    try {
        // 2. Busca dados do Pokémon do nó atual para pegar Imagem, ID e Tipos
        const respostaPokemon = await fetch(URL_API + "pokemon/" + noAtual.species.name);
        const dadosPokemon = await respostaPokemon.json();

        const tiposStr = dadosPokemon.types.map(item => item.type.name).join(' · ');
        const idFormatado = "#" + String(dadosPokemon.id).padStart(4, "0");
        const imagemUrl = dadosPokemon.sprites.other["official-artwork"].front_default || dadosPokemon.sprites.front_default;

        // 3. Monta o card visual do Pokémon
        const divPokemon = document.createElement("div");
        divPokemon.classList.add("evo-pokemon");
        
        // UX: Clicar em um estágio da evolução carrega o Pokémon na tela principal
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

        // 4. Lógica de Ramificação: Se existirem próximos estágios no array 'evolves_to'
        if (noAtual.evolves_to.length > 0) {
            
            // Container vertical em caso de bifurcações múltiplas (ex: Eevee)
            const branchesContainer = document.createElement("div");
            branchesContainer.classList.add("evo-branches");

            for (const proximaEvolucao of noAtual.evolves_to) {
                const branch = document.createElement("div");
                branch.classList.add("evo-branch");

                // Renderiza a seta apontando para a frente e os detalhes textuais
                const textoCondicao = obterDetalhesEvolucao(proximaEvolucao.evolution_details);
                const seta = document.createElement("div");
                seta.classList.add("evo-arrow");
                seta.innerHTML = `<i>→</i><span>${textoCondicao}</span>`;

                branch.appendChild(seta);

                // Chamada Recursiva: Constrói o próximo estágio passando o contêiner branch
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
// Eventos
// ==============================

btnBuscar.addEventListener("click", buscarPokemon);

inputPokemon.addEventListener("keydown", function(evento) {
    if (evento.key === "Enter") {
        buscarPokemon();
    }
});