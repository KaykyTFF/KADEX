
async function buscarPokemon(parametroOpcional) {
    const nomeBuscado = (typeof parametroOpcional === "string") 
        ? parametroOpcional 
        : inputPokemon.value.trim().toLowerCase();

    if (nomeBuscado === "") return;

    // Esconde os resultados anteriores e a mensagem de erro
    secaoResultado.classList.add("escondido");
    mensagemErro.classList.add("escondido");
    
    // Mostra o esqueleto de carregamento
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

        // ==========================================
        // ADIÇÕES AQUI: Configurando os botões de filtro
        // ==========================================
        // Armazena os movimentos globalmente
        movimentosAtuais = dados.moves;
        
        // Reseta o visual dos botões, ativando "Nível" por padrão
        document.querySelectorAll(".aba-movimento").forEach(b => b.classList.remove("ativa"));
        if (btnMoveLevel) btnMoveLevel.classList.add("ativa");

        // O bloco Promise.all processa as 3 funções ao mesmo tempo
        // Modificamos buscarMovimentos para passar a variável e o método padrão
        await Promise.all([
            buscarTipagem(nomesTipos),
            buscarHabilidades(dados.abilities),
            buscarMovimentos(movimentosAtuais, "level-up")
        ]);

        // Carregamento concluído: Esconde o esqueleto e mostra a interface pronta
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

// ==============================
// Eventos dos Filtros de Movimentos
// ==============================
async function alterarAbaMovimento(metodo, botaoClicado) {
    // Evita refazer a busca se clicar no botão que já está ativo
    if (botaoClicado.classList.contains("ativa")) return;

    // Muda a cor do botão ativo
    document.querySelectorAll(".aba-movimento").forEach(b => b.classList.remove("ativa"));
    botaoClicado.classList.add("ativa");

    // Chama a função da UI com o método correspondente
    await buscarMovimentos(movimentosAtuais, metodo);
}

btnMoveLevel.addEventListener("click", () => alterarAbaMovimento("level-up", btnMoveLevel));
btnMoveTM.addEventListener("click", () => alterarAbaMovimento("machine", btnMoveTM));
btnMoveEgg.addEventListener("click", () => alterarAbaMovimento("egg", btnMoveEgg));