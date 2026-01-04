// --- CONFIGURACIÓN DE API ---
const API_BASE_URL = 'http://127.0.0.1:3000/api';
let usuarioActual = "";
let miGrafica = null;
let ticketsCargados = [];

// --- 1. GESTIÓN DE EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('formRegistroTI');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            await registrarTecnico();
        });
    }
});

// --- ACCESO Y SEGURIDAD ---
async function verificarAcceso() {
    const userField = document.getElementById('adminUser');
    const passField = document.getElementById('adminPass');
    if (!userField || !passField) return;

    const datosLogin = {
        user: userField.value.trim(),
        pass: passField.value.trim()
    };

    try {
        if (typeof toggleLoader === 'function') toggleLoader(true);
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosLogin)
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            usuarioActual = resultado.usuario;
            if(document.getElementById('nombreAdmin')) document.getElementById('nombreAdmin').innerText = usuarioActual;

            mostrarSeccion('seccionAdmin'); 
            
            const esMaster = (resultado.rol === 'admin'); 
            const divGestion = document.getElementById('gestionUsuarios');
            if(divGestion) divGestion.style.display = esMaster ? 'block' : 'none';
            
            actualizarDashboard();
            if(esMaster) listarUsuariosTI();
            
            mostrarNotificacion(`🌊 ¡Bienvenido, ${usuarioActual}!`);
            userField.value = ""; passField.value = "";
        } else {
            alert("⚠️ " + (resultado.message || "Credenciales incorrectas"));
        }
    } catch (error) {
        alert("🔌 Error de conexión con el servidor.");
    } finally {
        if (typeof toggleLoader === 'function') toggleLoader(false);
    }
}

// --- REGISTRAR TÉCNICO ---
async function registrarTecnico() {
    // Puedes cambiar el "Nombre Real" por "Nombre Completo" en el HTML
    // Mientras el ID siga siendo 'regNombre', esta función no fallará.
    const nuevoTec = {
        nombre: document.getElementById('regNombre').value,
        user: document.getElementById('regUser').value,
        pass: document.getElementById('regPass').value,
        depto: document.getElementById('regDepto').value,
        foto: "https://via.placeholder.com/50" 
    };

    const fotoInput = document.getElementById('regFoto');
    if (fotoInput && fotoInput.files.length > 0) {
        if (typeof convertirImagenABase64 === 'function') {
            nuevoTec.foto = await convertirImagenABase64(fotoInput.files[0]);
        }
    }

    try {
        if (typeof toggleLoader === 'function') toggleLoader(true);
        const respuesta = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoTec)
        });

        if (respuesta.ok) {
            mostrarNotificacion("✅ Técnico registrado con éxito.");
            document.getElementById('formRegistroTI').reset();
            listarUsuariosTI(); 
        } else {
            alert("Error al registrar: El usuario podría ya existir.");
        }
    } catch (error) {
        alert("Error de conexión al registrar técnico.");
    } finally {
        if (typeof toggleLoader === 'function') toggleLoader(false);
    }
}

// --- RESOLVER TICKET ---
async function resolverTicket(id) {
    if(!confirm("¿Deseas marcar este reporte como resuelto?")) return;
    
    try {
        if (typeof toggleLoader === 'function') toggleLoader(true);
        const respuesta = await fetch(`${API_BASE_URL}/tickets/${id}/resolver`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ atendidoPor: usuarioActual })
        });

        if (respuesta.ok) {
            mostrarNotificacion("✅ Ticket resuelto.");
            await actualizarDashboard(); 
        }
    } catch (error) {
        alert("🔌 Error al procesar la solicitud.");
    } finally {
        if (typeof toggleLoader === 'function') toggleLoader(false);
    }
}

// --- DASHBOARD: CARGA Y FILTRADO ---
async function actualizarDashboard() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/tickets`);
        ticketsCargados = await respuesta.json();
        
        const pendientes = ticketsCargados.filter(t => t.estado === "Pendiente");
        const resueltos = ticketsCargados.filter(t => t.estado === "Resuelto");
        
        if(document.getElementById('countPendientes')) document.getElementById('countPendientes').innerText = pendientes.length;
        if(document.getElementById('countResueltos')) document.getElementById('countResueltos').innerText = resueltos.length;
        
        const titulo = document.getElementById('tituloTabla')?.innerText;
        if (titulo && titulo.includes("Resueltos")) {
            filtrarPorEstado('Resuelto');
        } else {
            filtrarPorEstado('Pendiente');
        }
        
        actualizarGrafica(pendientes.length, resueltos.length);
    } catch (error) {
        console.error("Error al cargar dashboard:", error);
    }
}

function filtrarPorEstado(estado) {
    const filtrados = ticketsCargados.filter(t => t.estado === estado);
    const titulo = document.getElementById('tituloTabla');
    if(titulo) {
        titulo.innerText = estado === 'Pendiente' ? "📨 Tickets en Bandeja" : "✅ Historial de Resueltos";
    }
    dibujarTabla(filtrados);
}

// --- EXPORTAR A EXCEL ---
function exportarExcel() {
    if (ticketsCargados.length === 0) return alert("No hay datos para exportar");
    const datosExcel = ticketsCargados.map(t => ({
        Folio: t.folio,
        Fecha: t.fecha,
        Solicitante: t.usuario,
        Departamento: t.departamento,
        Prioridad: t.prioridad,
        Descripción: t.descripcion,
        Estado: t.estado,
        AtendidoPor: t.atendidoPor || 'N/A'
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_TI");
    XLSX.writeFile(wb, `Reporte_Soporte_TI.xlsx`);
}

// --- VISUALIZACIÓN ---
function dibujarTabla(datos) {
    const cuerpo = document.getElementById('cuerpoTabla');
    if(!cuerpo) return;
    if (datos.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; opacity:0.6;">🌊 No hay tickets en esta categoría.</td></tr>`;
        return;
    }
    cuerpo.innerHTML = datos.map(t => {
        const claseFila = t.prioridad === 'Alta' ? "fila-alta" : (t.prioridad === 'Media' ? "fila-media" : "fila-baja");
        const claseBadge = t.prioridad === 'Alta' ? "status-red" : (t.prioridad === 'Media' ? "status-yellow" : "status-green");
        const botonAccion = t.estado === 'Pendiente' 
            ? `<button onclick="resolverTicket(${t.id})" class="btn-save" style="padding: 8px 12px; background:#2ecc71;">✔</button>`
            : `<span style="color:#2ecc71; font-size:0.8rem;">Resuelto por ${t.atendidoPor || 'TI'}</span>`;
        return `
            <tr class="${claseFila}">
                <td><b>${t.folio || 'S/F'}</b><br><small>${t.fecha || ''}</small></td>
                <td><b>${t.usuario}</b></td>
                <td>${t.departamento}</td>
                <td><span class="badge ${claseBadge}">${t.prioridad}</span></td>
                <td>${botonAccion}</td>
            </tr>`;
    }).join('');
}

function actualizarGrafica(pendientes, resueltos) {
    const ctx = document.getElementById('graficaTickets');
    if (!ctx) return;
    if (miGrafica) { miGrafica.destroy(); }
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    miGrafica = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Resueltos'],
            datasets: [{
                data: [pendientes, resueltos],
                backgroundColor: ['#ff4b2b', '#2ecc71'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: isDark ? '#e0f2fe' : '#023e8a'} }
            }
        }
    });
}

function cerrarSesion() {
    usuarioActual = "";
    mostrarSeccion('seccionLogin'); 
}

function buscarTicketRealTime() {
    const term = document.getElementById('buscador').value.toLowerCase();
    const filas = document.querySelectorAll('#cuerpoTabla tr');
    filas.forEach(fila => {
        const texto = fila.innerText.toLowerCase();
        fila.style.display = texto.includes(term) ? '' : 'none';
    });
}

async function listarUsuariosTI() {
    const lista = document.getElementById('listaTecnicosCompleta');
    if(!lista) return;
    try {
        const respuesta = await fetch(`${API_BASE_URL}/usuarios`);
        const tecnicos = await respuesta.json();
        lista.innerHTML = tecnicos.map(t => `
            <tr>
                <td><img src="${t.foto}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;"></td>
                <td><b>${t.user}</b></td>
                <td>${t.nombre}</td>
                <td><span style="color:#2ecc71">● Activo</span></td>
            </tr>`).join('');
    } catch (e) { console.log("Error lista usuarios"); }
}