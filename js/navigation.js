/**
 * KADEX - Navigation System
 * Centralizes all navigation logic to ensure consistency across the app.
 */

const Navigation = {
    /**
     * Navigates to a Pokémon detail page.
     * @param {string|number} nameOrId - The Pokémon name or ID.
     */
    abrirPokemon(nameOrId) {
        if (!nameOrId) return;
        const query = nameOrId.toString().toLowerCase().trim().replace(/\s+/g, '-');
        window.location.href = `pokemon.html?name=${encodeURIComponent(query)}`;
    },

    /**
     * Navigates to a Move detail page.
     * @param {string} name - The move name.
     */
    abrirMovimento(name) {
        if (!name) return;
        const query = name.toString().toLowerCase().trim().replace(/\s+/g, '-');
        window.location.href = `move.html?name=${encodeURIComponent(query)}`;
    },

    /**
     * Navigates to a Type detail page.
     * @param {string} name - The type name.
     */
    abrirTipo(name) {
        if (!name) return;
        window.location.href = `type.html?name=${encodeURIComponent(name)}`;
    },

    /**
     * Navigates to an Ability detail page.
     * @param {string} name - The ability name.
     */
    abrirHabilidade(name) {
        if (!name) return;
        window.location.href = `ability.html?name=${encodeURIComponent(name)}`;
    },

    /**
     * Navigates to an Egg Group detail page.
     * @param {string} name - The egg group name.
     */
    abrirGrupoOvo(name) {
        if (!name) return;
        window.location.href = `egg-group.html?name=${encodeURIComponent(name)}`;
    },

    /**
     * Returns to the previous page in history, or to index.html as a fallback.
     */
    voltar() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    },

    /**
     * Standardizes the top navbar across all pages.
     * @param {Object} options - Configuration for the navbar.
     */
    renderNavbar(options = {}) {
        const {
            showBackButton = true,
            pageTitle = '',
            showSearch = true,
            logoLink = 'index.html',
            searchPlaceholder = 'Buscar Pokémon ou Movimento...',
            showTitle = false
        } = options;

        const header = document.querySelector('header');
        if (!header) return;

        // Apply standard header container styles
        header.className = "max-w-6xl mx-auto px-4 pt-8 md:pt-12 mb-8 md:mb-12";

        const backButtonHtml = showBackButton ? `
            <button id="nav-back-button" onclick="voltarPagina()" class="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-gray-600 hover:text-pokedex-red font-bold rounded-xl transition-all duration-300 border border-gray-100 shadow-sm group whitespace-nowrap active:scale-95">
                <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
                Voltar
            </button>
        ` : '';

        const titleHtml = (showTitle && pageTitle) ? `
            <h2 id="page-title" class="text-2xl md:text-3xl font-black capitalize text-gray-800 truncate tracking-tight">${pageTitle}</h2>
        ` : '';

        const searchHtml = showSearch ? `
            <div id="campoBusca" class="relative w-full md:w-96">
                <div class="flex gap-2">
                    <div class="relative flex-grow">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 peer-focus-within:text-pokedex-red transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input
                            type="text"
                            id="inputPokemon"
                            placeholder="${searchPlaceholder}"
                            autocomplete="off"
                            class="input-pokedex text-sm pl-11 !py-3.5 peer"
                        >
                        <ul id="listaSugestoes" class="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-y-auto max-h-[400px] overscroll-contain hidden ring-1 ring-black/5 custom-scrollbar"></ul>
                    </div>
                    <button id="btnBuscar" class="bg-pokedex-red text-white px-5 rounded-2xl hover:bg-pokedex-red-dark transition-all duration-300 shadow-lg shadow-pokedex-red/20 flex-shrink-0 active:scale-95 flex items-center justify-center">
                        <span class="text-xs font-bold uppercase tracking-widest hidden sm:inline">Buscar</span>
                        <svg class="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </button>
                </div>
            </div>
        ` : '';

        header.innerHTML = `
            <div class="flex flex-col gap-6 md:gap-8">
                <!-- Top Row: Logo, Team Link and Search -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-center justify-between md:justify-start gap-8">
                        <a href="${logoLink}" class="inline-block flex-shrink-0 transform hover:scale-105 transition-transform active:scale-95">
                            <h1 class="text-4xl md:text-5xl font-black tracking-tighter text-pokedex-red">
                                KADEX<span class="text-gray-300 font-light">.</span>
                            </h1>
                        </a>
                        <a href="team.html" class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl transition-all duration-300 shadow-sm text-sm group active:scale-95">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                            <span class="hidden sm:inline">Analisar Time</span>
                            <span class="sm:hidden">Time</span>
                        </a>
                    </div>
                    ${searchHtml}
                </div>
                
                <!-- Bottom Row: Navigation Context -->
                ${(showBackButton || (showTitle && pageTitle)) ? `
                <div class="flex items-center gap-4 overflow-hidden animate-fade-in-down">
                    ${backButtonHtml}
                    ${titleHtml}
                </div>
                ` : ''}
            </div>
        `;

        // Sync global variables if they exist
        if (typeof window.syncSearchElements === 'function') {
            window.syncSearchElements();
        }
    }
};

// Export to global scope
window.abrirPokemon = Navigation.abrirPokemon;
window.abrirMovimento = Navigation.abrirMovimento;
window.abrirTipo = Navigation.abrirTipo;
window.abrirHabilidade = Navigation.abrirHabilidade;
window.abrirGrupoOvo = Navigation.abrirGrupoOvo;
window.voltarPagina = Navigation.voltar;
window.renderNavbar = Navigation.renderNavbar;

/**
 * Standardizes the footer across all pages.
 */
function renderFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    footer.className = "mt-20 text-center space-y-3 pb-12 animate-fade-in";
    footer.innerHTML = `
        <div class="flex flex-col items-center gap-2">
            <p class="text-gray-400 text-sm font-medium flex items-center gap-2">
                <span class="font-black tracking-tighter text-gray-500">KADEX</span>
                <span class="text-gray-200">—</span>
                Criado por 
                <a href="https://github.com/KaykyTFF" target="_blank" class="text-pokedex-red font-bold hover:underline decoration-2 underline-offset-4 transition-all">
                    KaykyTFF
                </a>
            </p>
            <p class="text-gray-300 text-[10px] font-bold uppercase tracking-[0.2em]">
                Dados fornecidos pela 
                <a href="https://pokeapi.co/" target="_blank" class="hover:text-pokedex-red transition-colors">PokéAPI</a>
            </p>
        </div>
    `;
}

window.renderFooter = renderFooter;
