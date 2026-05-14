/**
 * KADEX - Pokémon Details Page Controller
 */

window.addEventListener('DOMContentLoaded', async () => {
    // Initial Navbar with generic title
    if (typeof renderNavbar === 'function') {
        renderNavbar({
            showBackButton: true
        });
    }

    const params = new URLSearchParams(window.location.search);
    const search = params.get('name') || params.get('id');
    
    if (search) {
        // We use the search logic from main.js to fetch and render
        if (typeof window.entidadeBusca === 'function') {
            await window.entidadeBusca(search);
        }
    } else {
        // If no search param, redirect back to index
        window.location.href = 'index.html';
    }
});
