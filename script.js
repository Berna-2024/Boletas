document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let contadorProductos = 0;

    // Elementos del DOM
    const form = document.getElementById('boletaForm');
    const productosContainer = document.getElementById('productos-container');
    const btnAgregarProducto = document.getElementById('btn-agregar-producto');
    const btnGenerar = document.getElementById('btn-generar');
    const btnPDF = document.getElementById('btn-pdf');
    const boletaPreview = document.getElementById('boleta-preview');

    // Función para mostrar errores
    function mostrarError(campo, mensaje) {
        const errorExistente = campo.parentNode.querySelector('.error-mensaje');
        if (errorExistente) errorExistente.remove();

        const errorElement = document.createElement('div');
        errorElement.className = 'error-mensaje';
        errorElement.innerHTML = `
            ${mensaje}
            <button class="cerrar-error">×</button>
        `;
        campo.parentNode.appendChild(errorElement);

        // Cerrar error al hacer clic
        errorElement.querySelector('.cerrar-error').addEventListener('click', () => {
            errorElement.remove();
        });
    }

    // Inicializar fecha actual
    const fechaInput = document.getElementById('fecha');
    fechaInput.valueAsDate = new Date();
    fechaInput.max = new Date().toISOString().split('T')[0];

    // Evento para agregar productos
    btnAgregarProducto.addEventListener('click', agregarProducto);

    // Evento para generar boleta - CORREGIDO
    btnGenerar.addEventListener('click', function(e) {
        e.preventDefault();
        generarBoleta();
    });

    // Evento para descargar PDF
    btnPDF.addEventListener('click', descargarPDF);

    // Función para agregar un nuevo producto
    function agregarProducto() {
        contadorProductos++;
        const productoId = `producto-${contadorProductos}`;
        
        const productoHTML = `
            <div class="producto-item" id="${productoId}">
                <button type="button" class="btn-eliminar" data-id="${productoId}">×</button>
                <div class="input-group">
                    <label for="descripcion-${contadorProductos}">Descripción:</label>
                    <input type="text" id="descripcion-${contadorProductos}" required>
                </div>
                <div class="input-group">
                    <label for="cantidad-${contadorProductos}">Cantidad:</label>
                    <input type="number" id="cantidad-${contadorProductos}" min="1" value="1" required>
                </div>
                <div class="input-group">
                    <label for="precio-${contadorProductos}">Precio Unitario (S/):</label>
                    <input type="number" id="precio-${contadorProductos}" step="0.01" min="0.01" required>
                </div>
            </div>
        `;
        
        productosContainer.insertAdjacentHTML('beforeend', productoHTML);
        
        // Agregar evento al botón eliminar
        document.querySelector(`[data-id="${productoId}"]`).addEventListener('click', function() {
            document.getElementById(productoId).remove();
            actualizarTotales();
        });
        
        // Agregar eventos para actualizar totales
        const cantidadInput = document.getElementById(`cantidad-${contadorProductos}`);
        const precioInput = document.getElementById(`precio-${contadorProductos}`);
        
        cantidadInput.addEventListener('change', actualizarTotales);
        precioInput.addEventListener('change', actualizarTotales);
        cantidadInput.addEventListener('input', actualizarTotales);
        precioInput.addEventListener('input', actualizarTotales);
        
        // Actualizar totales al agregar nuevo producto
        actualizarTotales();
    }

    // Función para actualizar totales
    function actualizarTotales() {
        let subtotal = 0;
        const productosElements = document.querySelectorAll('.producto-item');
        
        productosElements.forEach(item => {
            const id = item.id.split('-')[1];
            const cantidad = parseFloat(document.getElementById(`cantidad-${id}`).value) || 0;
            const precio = parseFloat(document.getElementById(`precio-${id}`).value) || 0;
            subtotal += cantidad * precio;
        });
        
        const igv = subtotal * 0.18;
        const total = subtotal + igv;
        
        document.getElementById('subtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
        document.getElementById('igv').textContent = `S/ ${igv.toFixed(2)}`;
        document.getElementById('total').textContent = `S/ ${total.toFixed(2)}`;
    }

    // Función para generar la boleta - COMPATIBLE CON TU HTML
    function generarBoleta() {
        console.log("Iniciando generación de boleta...");
        
        // Limpiar errores previos y vista previa
        document.querySelectorAll('.error-mensaje').forEach(error => error.remove());
        boletaPreview.innerHTML = '';
        boletaPreview.classList.remove('hidden');
        
        let isValid = true;
        
        // Validar RUC
        const ruc = document.getElementById('ruc').value.trim();
        if (!/^\d{11}$/.test(ruc)) {
            mostrarError(document.getElementById('ruc'), 'El RUC debe tener exactamente 11 dígitos');
            isValid = false;
        }
        
        // Validar serie
        const serie = document.getElementById('serie').value.trim();
        if (!/^[BFbf][A-Za-z0-9]{3}$/.test(serie)) {
            mostrarError(document.getElementById('serie'), 'La serie debe comenzar con B o F seguido de 3 caracteres alfanuméricos');
            isValid = false;
        }
        
        // Validar correlativo
        const correlativo = document.getElementById('correlativo').value.trim();
        if (!correlativo || isNaN(correlativo) || parseInt(correlativo) <= 0) {
            mostrarError(document.getElementById('correlativo'), 'Ingrese un número de correlativo válido');
            isValid = false;
        }
        
        // Validar productos
        if (document.querySelectorAll('.producto-item').length === 0) {
            mostrarError(productosContainer, 'Debe agregar al menos un producto');
            isValid = false;
        }

        if (!isValid) {
            console.log("Validación fallida, no se genera boleta");
            return;
        }
        
        // Obtener datos del emisor
        const razonSocial = document.getElementById('razon-social').value.trim();
        const direccion = document.getElementById('direccion').value.trim();
        const tipoDocumento = document.getElementById('tipo-documento').value;
        const fecha = document.getElementById('fecha').value;
        
        // Obtener datos del cliente
        const tipoDocCliente = document.getElementById('tipo-doc').value;
        const numDocCliente = document.getElementById('num-doc').value.trim();
        const nombreCliente = document.getElementById('nombre-cliente').value.trim();
        
        // Obtener productos
        const productos = [];
        document.querySelectorAll('.producto-item').forEach(item => {
            const id = item.id.split('-')[1];
            const cantidad = parseFloat(document.getElementById(`cantidad-${id}`).value) || 0;
            const precio = parseFloat(document.getElementById(`precio-${id}`).value) || 0;
            
            if (cantidad > 0 && precio > 0) {
                productos.push({
                    descripcion: document.getElementById(`descripcion-${id}`).value.trim(),
                    cantidad: cantidad,
                    precio: precio,
                    total: cantidad * precio
                });
            }
        });
        
        // Verificar que haya productos válidos
        if (productos.length === 0) {
            mostrarError(productosContainer, 'Los productos deben tener cantidad y precio válidos');
            return;
        }
        
        // Calcular totales
        const subtotal = productos.reduce((sum, prod) => sum + prod.total, 0);
        const igv = subtotal * 0.18;
        const total = subtotal + igv;
        
        // Generar HTML de la boleta - ESTILO SUNAT
        const boletaHTML = `
            <div id="boleta-content" class="boleta-electronica">
                <div class="boleta-header">
                    <div class="emisor">
                        <h2>${razonSocial || 'EMPRESA'}</h2>
                        <p><strong>RUC:</strong> ${ruc}</p>
                        <p><strong>Dirección:</strong> ${direccion || 'No especificada'}</p>
                    </div>
                    <div class="documento-info">
                        <h3>${tipoDocumento === '03' ? 'BOLETA ELECTRÓNICA' : 'FACTURA ELECTRÓNICA'}</h3>
                        <p><strong>Serie/Número:</strong> ${serie.toUpperCase()}-${correlativo}</p>
                        <p><strong>Fecha Emisión:</strong> ${new Date(fecha).toLocaleDateString('es-PE')}</p>
                    </div>
                </div>
                
                <div class="cliente-info">
                    <h4>DATOS DEL CLIENTE</h4>
                    <p><strong>Nombre/Razón Social:</strong> ${nombreCliente || 'No especificado'}</p>
                    <p><strong>Documento:</strong> ${tipoDocCliente === '1' ? 'DNI' : tipoDocCliente === '6' ? 'RUC' : 'Sin Documento'} ${numDocCliente ? `- ${numDocCliente}` : ''}</p>
                </div>
                
                <div class="productos-list">
                    <h4>DETALLE DE PRODUCTOS/SERVICIOS</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Cantidad</th>
                                <th>Descripción</th>
                                <th>P. Unitario</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productos.map(prod => `
                                <tr>
                                    <td>${prod.cantidad}</td>
                                    <td>${prod.descripcion}</td>
                                    <td>S/ ${prod.precio.toFixed(2)}</td>
                                    <td>S/ ${prod.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="boleta-totales">
                    <div class="total-item">
                        <span>OP. GRAVADAS:</span>
                        <span>S/ ${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="total-item">
                        <span>I.G.V. (18%):</span>
                        <span>S/ ${igv.toFixed(2)}</span>
                    </div>
                    <div class="total-item total">
                        <span>IMPORTE TOTAL:</span>
                        <span>S/ ${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="boleta-footer">
                    <p class="codigo-hash">Código Hash: ${generarCodigoHash()}</p>
                    <p class="leyenda">Representación impresa de la ${tipoDocumento === '03' ? 'boleta' : 'factura'} electrónica. Consulte en ${razonSocial || 'nuestra web'}.</p>
                </div>
            </div>
        `;
        
        // Mostrar boleta en el contenedor
        boletaPreview.innerHTML = boletaHTML;
        boletaPreview.classList.remove('hidden');
        btnPDF.disabled = false;
        console.log("Boleta generada exitosamente");
    }

    // Función para generar un código hash simulado
    function generarCodigoHash() {
        const chars = '0123456789ABCDEF';
        let hash = '';
        for (let i = 0; i < 40; i++) {
            hash += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return hash;
    }

    // Función para descargar PDF
    function descargarPDF() {
        if (!document.getElementById('boleta-content')) {
            alert("Primero genere una boleta");
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const element = document.getElementById('boleta-content');
        
        // Añadir margen y fondo blanco para PDF
        element.style.padding = '20px';
        element.style.backgroundColor = 'white';
        
        html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#FFFFFF'
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`boleta-${document.getElementById('serie').value}-${document.getElementById('correlativo').value}.pdf`);
            
            // Restaurar estilos
            element.style.padding = '';
            element.style.backgroundColor = '';
        }).catch(error => {
            console.error("Error al generar PDF:", error);
            alert("Error al generar PDF. Consulte la consola para más detalles.");
        });
    }

    // Validación de RUC en tiempo real
    document.getElementById('ruc').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, ''); // Solo permite números
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
        
        const errorElement = this.parentNode.querySelector('.error-mensaje');
        if (errorElement) errorElement.remove();
    });

    // Validación de serie en tiempo real
    document.getElementById('serie').addEventListener('input', function() {
        this.value = this.value.toUpperCase(); // Convertir a mayúsculas
        if (this.value.length > 4) {
            this.value = this.value.slice(0, 4);
        }
        
        const errorElement = this.parentNode.querySelector('.error-mensaje');
        if (errorElement) errorElement.remove();
    });

    // Autoformato para correlativo
    document.getElementById('correlativo').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, ''); // Solo permite números
    });

    // Cambiar placeholder según tipo de documento del cliente
    document.getElementById('tipo-doc').addEventListener('change', function() {
        const numDocInput = document.getElementById('num-doc');
        switch(this.value) {
            case '1': // DNI
                numDocInput.placeholder = '8 dígitos';
                numDocInput.pattern = '\\d{8}';
                break;
            case '6': // RUC
                numDocInput.placeholder = '11 dígitos';
                numDocInput.pattern = '\\d{11}';
                break;
            default: // Sin documento
                numDocInput.placeholder = 'No requiere';
                numDocInput.pattern = '';
                numDocInput.value = '';
        }
    });

    // Agregar primer producto al cargar
    agregarProducto();
});