// --- FUNCIONALIDAD EXCLUSIVA DE TICKETS (CLIENTE) ---
const API_TICKETS_URL = 'http://127.0.0.1:3000/api/tickets';
const formularioTicket = document.getElementById('ticketForm');

if (formularioTicket) {
    formularioTicket.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        // 1. Iniciar estado de carga
        if (typeof toggleLoader === 'function') toggleLoader(true);

        const btnEnvio = e.target.querySelector('.btn-submit');
        const textoOriginal = btnEnvio.innerText;
        btnEnvio.disabled = true;
        btnEnvio.innerText = "ENVIANDO REPORTE...";

        try {
            const archivoInput = document.getElementById('evidencia');
            let fotoBase64 = "";
            
            // 2. Procesar imagen si existe
            if (archivoInput && archivoInput.files.length > 0) {
                fotoBase64 = await convertirImagenABase64(archivoInput.files[0]);
            }

            // 3. Generar Folio Único
            const ahora = new Date();
            const anio = ahora.getFullYear();
            const random = Math.floor(1000 + Math.random() * 9000);
            const folioGenerado = `TI-${anio}-${random}`;

            const ticket = {
                folio: folioGenerado,
                fecha: ahora.toLocaleString(),
                usuario: document.getElementById('usuario').value.trim(),
                departamento: document.getElementById('departamento').value,
                prioridad: document.getElementById('prioridad').value,
                descripcion: document.getElementById('descripcion').value.trim(),
                evidencia: fotoBase64,
                estado: "Pendiente"
            };

            // 4. ENVÍO AL SERVIDOR
            const respuesta = await fetch(API_TICKETS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticket)
            });

            if (!respuesta.ok) throw new Error("Error en el servidor");

            // 5. Feedback visual y actualización de Folio
            const folioDisplay = document.getElementById('numeroFolio');
            if (folioDisplay) folioDisplay.innerText = folioGenerado;

            // 6. Cambio de Vista (Ocultar Formulario / Mostrar Éxito)
            const ticketContenedor = document.getElementById('ticketContenedor');
            const cardConfirm = document.getElementById('ticketConfirmacion');

            if (ticketContenedor) ticketContenedor.style.display = 'none';
            if (cardConfirm) {
                cardConfirm.style.display = 'block';
                cardConfirm.classList.add('fade-in');
            }
            
            // RESET TOTAL DEL FORMULARIO Y VISTA PREVIA
            formularioTicket.reset();
            if (typeof quitarFoto === 'function') quitarFoto();

            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion("🎫 Ticket #" + folioGenerado + " registrado con éxito");
            }

        } catch (error) {
            console.error("Error al enviar ticket:", error);
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion("❌ Error: No se pudo conectar con el servidor");
            } else {
                alert("🔌 Error de conexión con el servidor.");
            }
        } finally {
            if (typeof toggleLoader === 'function') toggleLoader(false);
            btnEnvio.innerText = textoOriginal;
            btnEnvio.disabled = false;
        }
    });
}

/**
 * Función mejorada para permitir un nuevo reporte sin recargar la página
 */
function nuevaSolicitud() {
    const confirmacion = document.getElementById('ticketConfirmacion');
    const ticketContenedor = document.getElementById('ticketContenedor');
    
    if (confirmacion) confirmacion.style.display = 'none';
    if (ticketContenedor) {
        ticketContenedor.style.display = 'block';
        ticketContenedor.classList.add('fade-in');
        
        // Foco automático al primer campo para mejorar UX
        const firstInput = document.getElementById('usuario');
        if (firstInput) firstInput.focus();
    }
}

// Nota: Las funciones previewImage y convertirImagenABase64 
// ya están en main.js para ser globales, puedes borrarlas de aquí 
// para mantener tu código limpio y evitar duplicados.