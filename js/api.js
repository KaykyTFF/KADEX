const traducoesFixas = {
    "physical": "Físico",
    "special": "Especial",
    "status": "Status",
    "level-up": "Nível",
    "machine": "TM/HM",
    "egg": "Ovo",
    "tutor": "Tutor",
    "evolution": "Evolução"
};

/**
 * Limpa textos vindos da PokéAPI, removendo quebras de linha estranhas
 * e bloqueando avisos do MyMemory Translate.
 */
function limparTextoPokemon(texto) {
    if (!texto) return "Descrição não disponível no momento.";

    // Bloqueia avisos do MyMemory
    const avisos = [
        "MYMEMORY WARNING",
        "USED ALL AVAILABLE FREE TRANSLATIONS",
        "USAGELIMITS",
        "TRANSLATE MORE"
    ];
    
    const temAviso = avisos.some(aviso => texto.toUpperCase().includes(aviso));
    if (temAviso) {
        return "Descrição não disponível no momento.";
    }

    return texto
        .replace(/\f/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Escolhe o melhor texto baseado no idioma (PT > EN > Fallback)
 */
function obterTextoPorIdioma(entries, campo = "flavor_text") {
    if (!entries || !Array.isArray(entries)) return "Descrição não disponível no momento.";

    const portugues = entries.find(e => 
        e.language?.name === "pt-BR" || e.language?.name === "pt"
    );

    const ingles = entries.find(e => e.language?.name === "en");

    const escolhido = portugues || ingles;

    if (!escolhido || !escolhido[campo]) {
        return "Descrição não disponível no momento.";
    }

    return limparTextoPokemon(escolhido[campo]);
}

/**
 * Limpa o localStorage de traduções poluídas por avisos do MyMemory
 */
function limparCachePoluida() {
    const avisos = ["MYMEMORY WARNING", "USED ALL AVAILABLE FREE TRANSLATIONS", "USAGELIMITS", "TRANSLATE MORE"];
    
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        const valor = localStorage.getItem(chave);
        
        if (valor) {
            const temAviso = avisos.some(aviso => valor.toUpperCase().includes(aviso));
            if (temAviso) {
                localStorage.removeItem(chave);
                i--; // Ajusta o índice após remoção
            }
        }
    }
}

// Executa limpeza de cache ao carregar
limparCachePoluida();
