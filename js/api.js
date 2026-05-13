// Traduz textos do inglês para o português usando a MyMemory API
async function traduzirTexto(textoIngles) {
    try {
        const textoCodificado = encodeURIComponent(textoIngles);
        const urlTraducao = `https://api.mymemory.translated.net/get?q=${textoCodificado}&langpair=en|pt-br`;
        
        const resposta = await fetch(urlTraducao);
        const dados = await resposta.json();
        
        if (dados.responseData && dados.responseData.translatedText) {
            return dados.responseData.translatedText;
        }
        
        return textoIngles; 
    } catch (erro) {
        console.error("Falha ao traduzir o texto:", erro);
        return textoIngles;
    }
}