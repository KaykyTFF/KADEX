

async function buscarPokemon(parametroOpcional) {
    const nomeBuscado = (typeof parametroOpcional === "string") 
        ? parametroOpcional 
        : inputPokemon.value.trim().toLowerCase();

    if (nomeBuscado === "") return;

    secaoResultado.classList.add("escondido");
    mensagemErro.classList.add("escondido");
    
    if (esqueletoResultado) esqueletoResultado.classList.remove("escondido");

    btnBuscar.textContent = "Buscando...";
    btnBuscar.disabled = true;

    try {
        const respostaPokemon = await fetch(URL_API + "pokemon/" + nomeBuscado);
        if (!respostaPokemon.ok) throw new Error("Pokémon não encontrado");
        const dados = await respostaPokemon.json();

        const respostaEspecie = await fetch(dados.species.url);
        const dadosEspecie = await respostaEspecie.json();

        const respostaEvolucao = await fetch(dadosEspecie.evolution_chain.url);
        const dadosEvolucao = await respostaEvolucao.json();

        renderizarAbasFormas(dadosEspecie.varieties, dados.name);

        const gridEvolucao = document.getElementById("gridEvolucao");
        gridEvolucao.innerHTML = "";
        await construirCadeiaEvolutiva(dadosEvolucao.chain, gridEvolucao);

        exibirDadosBasicos(dados);

        const nomesTipos = dados.types.map(item => item.type.name);

        await Promise.all([
            buscarTipagem(nomesTipos),
            buscarHabilidades(dados.abilities)
        ]);

        if (esqueletoResultado) esqueletoResultado.classList.add("escondido");
        secaoResultado.classList.remove("escondido");

    } catch (erro) {
        console.error(erro);
        if (esqueletoResultado) esqueletoResultado.classList.add("escondido");
        mensagemErro.classList.remove("escondido");
    } finally {
        btnBuscar.textContent = "Buscar";
        btnBuscar.disabled = false;
    }
}

// Configuração dos Eventos Iniciais
btnBuscar.addEventListener("click", buscarPokemon);

inputPokemon.addEventListener("keydown", function(evento) {
    if (evento.key === "Enter") {
        buscarPokemon();
    }
});