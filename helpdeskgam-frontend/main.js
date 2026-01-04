document.addEventListener('DOMContentLoaded', () => { 
    // Si no estamos activamente en el admin, mostramos el cliente
    if (!document.getElementById('seccionAdmin') || document.getElementById('seccionAdmin').style.display !== 'block') {
        mostrarSeccion('seccionCliente');
    }
    aplicarTemaGuardado();
});

// --- LÓGICA DE TEMAS ---
function toggleTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('themeBtn');
    const actual = html.getAttribute('data-theme');
    const nuevo = actual === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', nuevo);
    if(btn) btn.innerText = nuevo === 'light' ? '🌙' : '☀️';
    localStorage.setItem('theme', nuevo);
    
    if (typeof miGrafica !== 'undefined' && miGrafica !== null) {
        if (typeof actualizarDashboard === 'function') actualizarDashboard(); 
    }
}

function aplicarTemaGuardado() {
    const guardado = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', guardado);
    const btn = document.getElementById('themeBtn');
    if(btn) btn.innerText = guardado === 'light' ? '🌙' : '☀️';
}

// --- NAVEGACIÓN GLOBAL ---
function mostrarSeccion(seccion) {
    const secciones = ['seccionCliente', 'seccionLogin', 'seccionAdmin'];
    
    let idActiva = seccion;
    if (seccion === 'cliente') idActiva = 'seccionCliente';
    if (seccion === 'admin') idActiva = 'seccionLogin';
    if (seccion === 'dashboard') idActiva = 'seccionAdmin';

    secciones.forEach(s => {
        const el = document.getElementById(s);
        if(el) {
            el.style.display = 'none';
            el.classList.remove('fade-in');
        }
    });

    const elActiva = document.getElementById(idActiva);
    
    if(elActiva) {
        if (idActiva === 'seccionAdmin') {
            elActiva.style.display = 'block'; 
        } else {
            elActiva.style.display = 'flex'; 
            elActiva.style.flexDirection = 'column';
            elActiva.style.alignItems = 'center';
            elActiva.style.justifyContent = 'center';
            elActiva.style.width = '100%';
        }
        
        setTimeout(() => elActiva.classList.add('fade-in'), 10);
        window.scrollTo(0, 0);
    } else {
        console.error(`Error: La sección "${idActiva}" no existe.`);
    }
}

// --- GESTIÓN DE EVIDENCIA FOTOGRÁFICA ---

/**
 * Muestra una miniatura de la imagen seleccionada en el formulario
 */
function previewImage(input) {
    const container = document.getElementById('previewContainer');
    const preview = document.getElementById('imagePreview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            container.style.display = 'block';
            container.classList.add('fade-in');
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Limpia el archivo seleccionado y oculta la miniatura
 */
function quitarFoto() {
    const input = document.getElementById('evidencia');
    const container = document.getElementById('previewContainer');
    const preview = document.getElementById('imagePreview');
    
    input.value = ""; // Resetea el input file
    preview.src = "#";
    container.style.display = 'none';
}

// --- UTILIDADES GLOBALES ---

function toggleLoader(show) {
    const loader = document.getElementById('loaderSistema');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function mostrarNotificacion(m) {
    const toastsAnteriores = document.querySelectorAll('.toast-notificacion');
    toastsAnteriores.forEach(t => t.remove());

    const t = document.createElement('div');
    t.className = 'toast-notificacion glass visible';
    t.innerText = m;
    
    Object.assign(t.style, {
        position: 'fixed', 
        bottom: '30px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        padding: '15px 30px', 
        borderRadius: '15px', 
        zIndex: '10000', 
        fontWeight: 'bold',
        color: 'var(--text-main)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
        transition: 'all 0.4s ease'
    });
    
    document.body.appendChild(t);
    
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.bottom = '10px';
        setTimeout(() => t.remove(), 500);
    }, 3000);
}

function convertirImagenABase64(f) {
    return new Promise((resolve, reject) => {
        if (!f) return resolve("");
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = (e) => reject(e);
        r.readAsDataURL(f);
    });
}