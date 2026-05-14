
/**
 * KADEX - Main Orchestrator
 * Handles search logic and coordinates between API and UI.
 */

async function entidadeBusca(parametroOpcional) {
    let termoOriginal = (typeof parametroOpcional === "string") 
        ? parametroOpcional 
        : (inputPokemon ? inputPokemon.value.trim() : "");

    if (termoOriginal === "") return;

    // Normalização: lowercase, trim, espaços por hifens
    const query = termoOriginal.toLowerCase().trim().replace(/\s+/g, '-');

    // Detect current page
    const isPokemonPage = window.location.pathname.includes('pokemon.html');
    
    // UI Feedback
    if (mensagemErro) mensagemErro.classList.add("hidden");
    if (btnBuscar) {
        btnBuscar.textContent = "Buscando...";
        btnBuscar.disabled = true;
    }

    // Se estamos na pokemon.html, mostramos o loader
    if (isPokemonPage && esqueletoResultado) {
        secaoResultado.classList.add("hidden");
        esqueletoResultado.classList.remove("hidden");
    }

    try {
        // 1. Validar se é Pokémon ou Espécie
        let respostaPokemon = await fetch(URL_API + "pokemon/" + query);
        let dados = null;
        
        if (respostaPokemon.ok) {
            dados = await respostaPokemon.json();
        } else {
            const respostaEspecie = await fetch(URL_API + "pokemon-species/" + query);
            if (respostaEspecie.ok) {
                const dadosEspecie = await respostaEspecie.json();
                const defaultVariety = dadosEspecie.varieties.find(v => v.is_default) || dadosEspecie.varieties[0];
                const respostaVariedade = await fetch(defaultVariety.pokemon.url);
                if (respostaVariedade.ok) {
                    dados = await respostaVariedade.json();
                }
            }
        }

        if (dados) {
            // Se for Pokémon e estamos na página de detalhes, e o nome é o mesmo que o da URL, apenas renderizamos.
            // Caso contrário, navegamos para garantir que o histórico do browser funcione.
            const urlParams = new URLSearchParams(window.location.search);
            const currentNameInUrl = urlParams.get('name');

            if (isPokemonPage && (currentNameInUrl === dados.name || currentNameInUrl === dados.id.toString())) {
                await renderizarPaginaPokemon(dados);
            } else {
                // Navega para a página do Pokémon
                // Se viemos da index, passamos o termo original para preservar o estado do input ao voltar
                const backTerm = !isPokemonPage ? `&q=${encodeURIComponent(termoOriginal)}` : '';
                window.location.href = `pokemon.html?name=${dados.name}${backTerm}`;
            }
            return;
        }

        // 2. Se não for Pokémon, tentar como Movimento
        const respostaMove = await fetch(URL_API + "move/" + query);
        if (respostaMove.ok) {
            const dadosMove = await respostaMove.json();
            window.location.href = `move.html?name=${dadosMove.name}`;
            return;
        }

        throw new Error("Entidade não encontrada");

    } catch (erro) {
        console.error(erro);
        if (isPokemonPage && esqueletoResultado) esqueletoResultado.classList.add("hidden");
        if (mensagemErro) {
            mensagemErro.classList.remove("hidden");
            mensagemErro.textContent = "Nenhum Pokémon ou Movimento encontrado com esse nome.";
        }
    } finally {
        if (btnBuscar) {
            btnBuscar.textContent = "Buscar";
            btnBuscar.disabled = false;
        }
    }
}

async function renderizarPaginaPokemon(dados) {
    try {
        const respostaEspecie = await fetch(dados.species.url);
        const dadosEspecie = await respostaEspecie.json();

        const respostaEvolucao = await fetch(dadosEspecie.evolution_chain.url);
        const dadosEvolucao = await respostaEvolucao.json();

        renderizarAbasFormas(dadosEspecie.varieties, dados.name);

        const gridEvolucao = document.getElementById("gridEvolucao");
        if (gridEvolucao) {
            gridEvolucao.innerHTML = "";
            await construirCadeiaEvolutiva(dadosEvolucao.chain, gridEvolucao);
        }

        exibirDadosBasicos(dados);
        exibirDetalhesExtras(dados, dadosEspecie);

        // Update Navbar with Pokemon Name
        if (typeof renderNavbar === 'function') {
            renderNavbar({
                showBackButton: true,
                searchPlaceholder: "Nova busca..."
            });
        }

        const nomesTipos = dados.types.map(item => item.type.name);
        movimentosAtuais = dados.moves;
        
        document.querySelectorAll(".aba-movimento").forEach(b => b.classList.remove("ativa"));
        if (btnMoveLevel) btnMoveLevel.classList.add("ativa");

        await Promise.all([
            buscarTipagem(nomesTipos),
            buscarHabilidades(dados.abilities),
            buscarMovimentos(movimentosAtuais, "level-up")
        ]);

        // Carregamento concluído
        if (esqueletoResultado) esqueletoResultado.classList.add("hidden");
        if (secaoResultado) secaoResultado.classList.remove("hidden");
        
        // Sincroniza o input com o nome atual
        if (inputPokemon) {
            inputPokemon.value = dados.name;
        }

    } catch (erro) {
        console.error("Erro ao renderizar Pokémon:", erro);
        throw erro;
    }
}

// Configuração dos Eventos
function attachSearchListeners() {
    if (btnBuscar) {
        // Remove existing listener if any to avoid duplicates
        btnBuscar.onclick = null; 
        btnBuscar.onclick = () => window.entidadeBusca();
    }

    if (inputPokemon) {
        inputPokemon.onkeydown = null;
        inputPokemon.onkeydown = function(evento) {
            if (evento.key === "Enter") {
                window.entidadeBusca();
            }
        };
    }
}

function attachMoveTabListeners() {
    const container = document.getElementById("abasMovimentos");
    if (!container) return;

    // Use event delegation for better performance and reliability
    container.onclick = async (e) => {
        const tab = e.target.closest(".aba-movimento");
        if (!tab || tab.classList.contains("ativa")) return;
        
        // Visual state update
        container.querySelectorAll(".aba-movimento").forEach(t => t.classList.remove("ativa"));
        tab.classList.add("ativa");
        
        // Method mapping according to PokéAPI standards
        let metodo = "level-up";
        if (tab.id === "btnMoveTM") metodo = "machine";
        if (tab.id === "btnMoveEgg") metodo = "egg";
        if (tab.id === "btnMoveTutor") metodo = "tutor";
        if (tab.id === "btnMoveEvolution") metodo = "evolution";
        
        // Execute filtering and rendering
        if (typeof buscarMovimentos === "function") {
            await buscarMovimentos(movimentosAtuais, metodo);
        }
    };
}

window.attachSearchListeners = attachSearchListeners;
window.attachMoveTabListeners = attachMoveTabListeners;
window.entidadeBusca = entidadeBusca;

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    // Standardized Navbar - Only render if header is empty (to support redesigned index.html)
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const header = document.querySelector('header');
    
    if (typeof renderNavbar === 'function' && header && header.innerHTML.trim() === "") {
        renderNavbar({
            showBackButton: !isIndexPage,
            searchPlaceholder: isIndexPage ? "Pokémon ou Movimento..." : "Nova busca..."
        });
    }

    // Sync elements and attach listeners
    if (typeof syncSearchElements === 'function') {
        syncSearchElements();
    } else {
        attachSearchListeners();
        if (typeof attachAutocompleteListeners === 'function') {
            attachAutocompleteListeners();
        }
    }
    
    attachMoveTabListeners();
    
    // Standardized Footer
    if (typeof renderFooter === 'function') {
        renderFooter();
    }

    const params = new URLSearchParams(window.location.search);
    const search = params.get('search') || params.get('q');
    if (search) {
        if (inputPokemon) inputPokemon.value = search;
        entidadeBusca(search);
    }
});
