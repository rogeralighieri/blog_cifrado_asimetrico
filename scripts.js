/* ---------- Helpers ---------- */
function safeQuery(selector) {
    return document.querySelector(selector);
}
function safeQueryAll(selector) {
    return Array.from(document.querySelectorAll(selector));
}

/* ---------- MODO OSCURO  ---------- */
const darkToggle = safeQuery('#darkToggle');

function applyTheme(mode) {
    document.body.classList.toggle('dark', mode === 'dark');
    // Actualiza icono si existe
    if (darkToggle) darkToggle.textContent = mode === 'dark' ? '☀️' : '🌙';

    // Notifica a Utterances iframe (si está presente) para que cambie tema
    const utterancesFrame = document.querySelector('iframe.utterances-frame');
    if (utterancesFrame && utterancesFrame.contentWindow) {
        utterancesFrame.contentWindow.postMessage({
            type: 'set-theme',
            theme: mode === 'dark' ? 'github-dark' : 'github-light'
        }, 'https://utteranc.es');
    }
}

if (darkToggle) {
    darkToggle.addEventListener('click', () => {
        const newMode = document.body.classList.contains('dark') ? 'light' : 'dark';
        // Animación suave
        document.body.classList.add('theme-transition');
        setTimeout(() => document.body.classList.remove('theme-transition'), 400);

        applyTheme(newMode);
        localStorage.setItem('theme', newMode);
    });
}

// Persistencia al cargar (una sola vez)
window.addEventListener('load', () => {
    const stored = localStorage.getItem('theme') || 'light';
    applyTheme(stored);
});

/* ---------- MENÚ RESPONSIVE (hamburguesa -> sideMenu) ---------- */
const menuBtn = safeQuery('#menuBtn'); // tu HTML usa id="menuBtn"
const sideMenu = safeQuery('#sideMenu');
const menuOverlay = safeQuery('#menuOverlay');

if (menuBtn && sideMenu && menuOverlay) {
    menuBtn.addEventListener('click', () => {
        sideMenu.classList.toggle('show');
        menuOverlay.classList.toggle('show');
    });

    // Cerrar menú al click en overlay
    menuOverlay.addEventListener('click', () => {
        sideMenu.classList.remove('show');
        menuOverlay.classList.remove('show');
    });

    // Cerrar menú al elegir enlace
    safeQueryAll('#sideMenu a').forEach(a => {
        a.addEventListener('click', () => {
            sideMenu.classList.remove('show');
            menuOverlay.classList.remove('show');
        });
    });
}

/* ---------- NAV LINKS (scroll suave y cierre menú mobile) ---------- */
safeQueryAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = safeQuery(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
        // Si el sideMenu está abierto en mobile, ciérralo
        if (sideMenu && sideMenu.classList.contains('show')) {
            sideMenu.classList.remove('show');
            if (menuOverlay) menuOverlay.classList.remove('show');
        }
    });
});

/* ---------- SECCIÓN ACTIVA (highlight nav) ---------- */
const sections = safeQueryAll('article');
const navLinks = safeQueryAll('nav a');

function onScrollActive() {
    let current = '';
    sections.forEach(section => {
        const top = section.offsetTop;
        if (window.scrollY >= top - 160) current = section.id;
    });

    navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
}
window.addEventListener('scroll', onScrollActive);
onScrollActive(); // ejecutar al inicio

/* ---------- BOTÓN VOLVER ARRIBA ---------- */
const topBtn = safeQuery('#topBtn');
if (topBtn) {
    window.addEventListener('scroll', () => {
        topBtn.style.display = (window.scrollY > 600) ? 'block' : 'none';
    });

    topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ---------- BUSCADOR DE CONTENIDO ---------- */
const searchInput = safeQuery('#searchInput');
const resultsCount = safeQuery('#resultsCount');
const allArticles = safeQueryAll('article');

function clearHighlights(el) {
    // elimina marcas <mark> añadidas antes
    el.innerHTML = el.innerHTML.replace(/<mark>(.*?)<\/mark>/gi, '$1');
}
function highlight(el, term) {
    if (!term) return;
    const regex = new RegExp(term, 'gi');
    el.innerHTML = el.innerHTML.replace(regex, match => `<mark>${match}</mark>`);
}

if (searchInput) {
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        let visible = 0;

        allArticles.forEach(article => {
            clearHighlights(article);
            if (!term) {
                article.style.display = 'block';
                return;
            }
            const text = article.textContent.toLowerCase();
            if (text.includes(term)) {
                article.style.display = 'block';
                highlight(article, term);
                visible++;
            } else {
                article.style.display = 'none';
            }
        });

        if (resultsCount) {
            resultsCount.textContent = term === '' ? '' : (visible === 0 ? 'No se encontraron resultados ❌' : `${visible} resultados encontrados`);
        }
    });
}

/* ---------- pequeña seguridad para que errores no rompan todo ---------- */
window.addEventListener('error', (e) => {
    // evita que un único error bloquee listeners posteriores
    console.warn('Script capturado error:', e.message);
});

function updateViews(entryId) {
    const viewKey = `views-${entryId}`;

    // Contar solo una vista por sesión
    if (!sessionStorage.getItem(viewKey)) {
        let views = parseInt(localStorage.getItem(viewKey) || 0, 10);
        views++;
        localStorage.setItem(viewKey, views);
        sessionStorage.setItem(viewKey, "true");
    }

    const totalViews = parseInt(localStorage.getItem(viewKey) || 0, 10);
    document.getElementById(`views-${entryId}`).textContent = `👁 Lecturas: ${totalViews}`;
}

function updateReactions(entryId) {
    const types = ["like", "love", "secure"];

    types.forEach(type => {
        const key = `${entryId}-${type}`;
        const count = parseInt(localStorage.getItem(key) || 0, 10);
        document.getElementById(`count-${type}-${entryId}`).textContent = count;

        const btn = document.querySelector(`.reactions[data-entry="${entryId}"] .react[data-type="${type}"]`);

        // Marcar botón como "ya clickeado" si se hizo en esta sesión
        const sessionKey = `${entryId}-${type}-clicked`;
        if (sessionStorage.getItem(sessionKey)) {
            btn.disabled = true; // desactiva el botón
            btn.style.opacity = "0.6"; // indicador visual
        } else {
            btn.addEventListener("click", () => {
                let newCount = parseInt(localStorage.getItem(key) || 0, 10) + 1;
                localStorage.setItem(key, newCount);
                document.getElementById(`count-${type}-${entryId}`).textContent = newCount;

                sessionStorage.setItem(sessionKey, "true"); // marca como clickeado
                btn.disabled = true;
                btn.style.opacity = "0.6";
            });
        }
    });
}

function entryInit(entryId) {
    updateViews(entryId);
    updateReactions(entryId);
}

// Inicializar todas las entradas
document.querySelectorAll("article[id]").forEach(article => {
    const entryId = article.getAttribute("id");
    entryInit(entryId);
});