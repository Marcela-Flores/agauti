// ==========================================
// 1. CONFIGURACIÓN GLOBAL Y VARIABLES
// ==========================================
let productos = [];
let carrito = [];
let categorias = [];

// ✅ Configuración de WhatsApp (editá solo acá)
const WHATSAPP_NUMERO = "5492964474746";

const contenedorProductos = document.getElementById('contenedor-productos');
const contenedorCategorias = document.querySelector('.categories-grid');

const carritoEnlace = document.getElementById('carrito-btn');
const badge = document.createElement('span');

// Elementos del Modal del Carrito
const carritoModal = document.getElementById('carrito-modal');
const cerrarCarritoBtn = document.getElementById('cerrar-carrito');
const contenedorCarritoItems = document.getElementById('carrito-items');
const totalCarritoTexto = document.getElementById('carrito-total');
const btnVaciar = document.getElementById('btn-vaciar');

// Elementos del Modal de Producto
const productoModal = document.getElementById('producto-modal');
const cerrarProductoBtn = document.getElementById('cerrar-producto');
const productoImagen = document.getElementById('producto-imagen');
const productoTitulo = document.getElementById('producto-titulo');
const productoDescripcion = document.getElementById('producto-descripcion');
const productoPrecio = document.getElementById('producto-precio');
const productoPrecioAnterior = document.getElementById('producto-precio-anterior');
const productoBtnCarrito = document.getElementById('producto-btn-carrito');

// Elementos del Modal de Confirmación
const confirmModal = document.getElementById('confirm-modal');
const confirmTitulo = document.getElementById('confirm-titulo');
const confirmMensaje = document.getElementById('confirm-mensaje');
const confirmAceptar = document.getElementById('confirm-aceptar');
const confirmCancelar = document.getElementById('confirm-cancelar');

// ✅ Variable global que guarda el callback pendiente (SOLUCIÓN AL BUG)
let accionPendiente = null;

// Configuración visual del Badge
badge.style.cssText = `
  background-color: var(--accent-pink);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 50%;
  position: absolute;
  top: 10px;
  right: -5px;
  font-weight: bold;
  display: none;
`;

if (carritoEnlace) {
  carritoEnlace.style.position = 'relative';
  carritoEnlace.appendChild(badge);
}

// ==========================================
// 2. MÓDULO DE LOCALSTORAGE (PERSISTENCIA)
// ==========================================
function guardarCarritoEnStorage() {
  localStorage.setItem('carrito_agauti', JSON.stringify(carrito));
}

function cargarCarritoDesdeStorage() {
  try {
    const datosGuardados = localStorage.getItem('carrito_agauti');
    if (!datosGuardados) return;

    const parsed = JSON.parse(datosGuardados);
    carrito = Array.isArray(parsed) ? parsed : [];
    actualizarInterfazCarrito();
  } catch (err) {
    console.warn("Carrito corrupto en localStorage, se reinicia.", err);
    carrito = [];
    localStorage.removeItem('carrito_agauti');
  }
}


// ==========================================
// 3. LÓGICA INTERNA DEL CARRITO
// ==========================================

/**
 * Agrega un producto al carrito.
 * Si ya existe, incrementa su cantidad en lugar de duplicarlo.
 */
function agregarAlCarrito(idProducto) {
  const productoSeleccionado = productos.find(
    p => String(p.id) === String(idProducto)
  );

  if (!productoSeleccionado) {
    console.warn("Producto no encontrado con id:", idProducto);
    return;
  }

  const itemExistente = carrito.find(
    item => String(item.id) === String(idProducto)
  );

  if (itemExistente) {
    itemExistente.cantidad = (itemExistente.cantidad || 1) + 1;
  } else {
    carrito.push({ ...productoSeleccionado, cantidad: 1 });
  }

  actualizarInterfazCarrito();
  guardarCarritoEnStorage();
}

/**
 * Suma o resta cantidad a un ítem del carrito.
 * Si la cantidad llega a 0, elimina el ítem.
 */
function cambiarCantidad(index, delta) {
  const item = carrito[index];
  if (!item) return;

  const nuevaCantidad = (item.cantidad || 1) + delta;

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(index);
    return;
  }

  item.cantidad = nuevaCantidad;
  actualizarInterfazCarrito();
  guardarCarritoEnStorage();
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarInterfazCarrito();
  guardarCarritoEnStorage();
}

function vaciarCarrito() {
  carrito = [];
  actualizarInterfazCarrito();
  guardarCarritoEnStorage();
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function actualizarInterfazCarrito() {
  // El badge muestra la cantidad TOTAL de piezas (sumando cantidades)
  const totalPiezas = carrito.reduce(
    (acc, item) => acc + (item.cantidad || 1),
    0
  );

  badge.textContent = totalPiezas;
  badge.style.display = totalPiezas > 0 ? 'block' : 'none';

  contenedorCarritoItems.innerHTML = "";

  if (carrito.length === 0) {
    contenedorCarritoItems.innerHTML =
      "<p style='text-align:center; color: var(--text-muted); padding-top: 2rem;'>Tu carrito está vacío.</p>";
    totalCarritoTexto.textContent = "$0.00";
    return;
  }

  let totalAcumulado = 0;

  carrito.forEach((item, index) => {
    const cantidad = item.cantidad || 1;
    const subtotal = Number(item.precio) * cantidad;
    totalAcumulado += subtotal;

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('cart-item');
    itemDiv.innerHTML = `
      <img src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.titulo || 'Producto')}">
      <div class="cart-item-info">
        <h4>${escapeHtml(item.titulo)}</h4>
        <p class="price">$${Number(item.precio).toFixed(2)}</p>

        <div class="cart-item-qty">
          <button class="qty-btn" data-action="restar" data-index="${index}" aria-label="Restar una unidad">−</button>
          <span class="qty-value">${cantidad}</span>
          <button class="qty-btn" data-action="sumar" data-index="${index}" aria-label="Sumar una unidad">+</button>
        </div>
      </div>

      <div class="cart-item-right">
        <button class="btn-remove" data-index="${index}" aria-label="Eliminar producto">&times;</button>
        <p class="cart-item-subtotal">$${subtotal.toFixed(2)}</p>
      </div>
    `;
    contenedorCarritoItems.appendChild(itemDiv);
  });

  totalCarritoTexto.textContent = `$${totalAcumulado.toFixed(2)}`;
  asignarEventosCarrito();
}

/**
 * Asigna los listeners dentro del carrito:
 * - botones + / − para cambiar cantidad
 * - botón × para eliminar
 */
function asignarEventosCarrito() {
  // Botones de cantidad (+ / −)
  contenedorCarritoItems
    .querySelectorAll('.qty-btn')
    .forEach(boton => {
      boton.addEventListener('click', () => {
        const index = parseInt(boton.getAttribute('data-index'), 10);
        const accion = boton.getAttribute('data-action');
        const delta = accion === 'sumar' ? 1 : -1;
        cambiarCantidad(index, delta);
      });
    });

  // Botones de eliminar (×)
  contenedorCarritoItems
    .querySelectorAll('.btn-remove')
    .forEach(boton => {
      boton.addEventListener('click', () => {
        const index = parseInt(boton.getAttribute('data-index'), 10);
        eliminarDelCarrito(index);
      });
    });
}


// ==========================================
// 4. MODAL DE CONFIRMACIÓN PERSONALIZADO
// ==========================================
// ✅ SOLUCIÓN: guardamos el callback en una variable global
// y usamos un único listener en el botón "Aceptar".
// No hay cloning, no hay acumulación de listeners, funciona siempre.

function mostrarConfirmacion({ titulo, mensaje, textoAceptar, onAceptar }) {
  if (!confirmModal) return;

  confirmTitulo.textContent = titulo;
  confirmMensaje.textContent = mensaje;
  confirmAceptar.textContent = textoAceptar || "Aceptar";

  // Guardamos el callback
  accionPendiente = onAceptar;

  confirmModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarConfirmacion() {
  if (!confirmModal) return;
  confirmModal.classList.remove('open');
  document.body.style.overflow = '';
  accionPendiente = null;
}

// ==========================================
// 5. RENDERIZADO DEL CATÁLOGO
// ==========================================
function renderizarCategorias(listaCategorias) {
  if (!contenedorCategorias) return;
  contenedorCategorias.innerHTML = '';

  listaCategorias.forEach((cat, index) => {
    const div = document.createElement('div');
    div.classList.add('category-item');
    if (index === 0) div.classList.add('active');
    div.dataset.categoria = cat.id;
    div.textContent = cat.nombre;
    contenedorCategorias.appendChild(div);
  });
}

function mostrarProductos(listaDeProductos) {
  if (!contenedorProductos) return;
  contenedorProductos.innerHTML = "";

  if (listaDeProductos.length === 0) {
    contenedorProductos.innerHTML =
      "<p style='grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 2rem 0;'>No se encontraron joyas que coincidan con tu búsqueda.</p>";
    return;
  }

  listaDeProductos.forEach(producto => {
    const card = document.createElement('div');
    card.classList.add('product-card', 'fade-in-card');
    card.dataset.id = producto.id;
    card.style.cursor = 'pointer';

    const precioHTML = producto.precioAnterior && producto.precioAnterior > producto.precio
      ? `<p class="price">
            <span class="price-old">$${Number(producto.precioAnterior).toFixed(2)}</span>
            $${Number(producto.precio).toFixed(2)}
          </p>`
      : `<p class="price">$${Number(producto.precio).toFixed(2)}</p>`;

    card.innerHTML = `
      <img src="${escapeHtml(producto.imagen)}" alt="${escapeHtml(producto.titulo)}" loading="lazy" decoding="async">
      <h3>${escapeHtml(producto.titulo)}</h3>
      ${precioHTML}
      <button class="btn-cart" data-id="${escapeHtml(producto.id)}">Añadir al carrito</button>
    `;
    contenedorProductos.appendChild(card);
  });


}



function filtrarPorCategoria(idCategoria) {
  if (idCategoria === "todos") {
    mostrarProductos(productos);
  } else {
    const productosFiltrados = productos.filter(
      p => p.categoria === idCategoria
    );
    mostrarProductos(productosFiltrados);
  }
}

// ==========================================
// 6. MODAL DE DETALLE DE PRODUCTO
// ==========================================
function abrirDetalleProducto(idProducto) {
  const producto = productos.find(p => String(p.id) === String(idProducto));
  if (!producto) return;

  if (carritoModal && carritoModal.classList.contains('open')) {
    carritoModal.classList.remove('open');
  }

  productoImagen.src = producto.imagen;
  productoImagen.alt = producto.titulo;
  productoTitulo.textContent = producto.titulo;
  productoDescripcion.textContent = producto.descripcion || "Sin descripción disponible.";
  productoPrecio.textContent = `$${Number(producto.precio).toFixed(2)}`;

  if (producto.precioAnterior && producto.precioAnterior > producto.precio) {
    productoPrecioAnterior.textContent = `$${Number(producto.precioAnterior).toFixed(2)}`;
    productoPrecioAnterior.style.display = 'inline';
  } else {
    productoPrecioAnterior.style.display = 'none';
  }

  productoBtnCarrito.dataset.id = producto.id;
  productoImagen.classList.remove('zoomed');

  productoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarDetalleProducto() {
  productoModal.classList.remove('open');
  document.body.style.overflow = '';
}

// ==========================================
// 7. INICIALIZACIÓN GENERAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  const loader = document.getElementById('loader');

  // Descargar catálogo JSON
  fetch('productos.json')
    .then(res => {
      if (!res.ok) throw new Error("Error al obtener el archivo JSON");
      return res.json();
    })
    .then(datos => {
      productos = datos.productos || [];
      categorias = datos.categorias || [];

      renderizarCategorias(categorias);
      mostrarProductos(productos);
      cargarCarritoDesdeStorage();

      setTimeout(() => {
        if (loader) loader.classList.add('loader-hidden');
      }, 400);
    })
    .catch(err => {
      console.error("Error cargando el catálogo:", err);
      if (loader) loader.classList.add('loader-hidden');

      if (contenedorProductos) {
        contenedorProductos.innerHTML =
          "<p style='grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 2rem 0;'>No se pudo cargar el catálogo. Recargá la página o intentá más tarde.</p>";
      }
    });

  // ========================================
  // ABRIR Y CERRAR CARRITO
  // ========================================
  if (carritoEnlace) {
    carritoEnlace.addEventListener('click', (e) => {
      e.preventDefault();
      carritoModal.classList.add('open');
    });
  }

  if (cerrarCarritoBtn) {
    cerrarCarritoBtn.addEventListener('click', () => {
      carritoModal.classList.remove('open');
    });
  }

  if (carritoModal) {
    carritoModal.addEventListener('click', (e) => {
      if (e.target === carritoModal) {
        carritoModal.classList.remove('open');
      }
    });
  }

  // ========================================
  // ABRIR Y CERRAR MODAL DE PRODUCTO
  // ========================================
  if (cerrarProductoBtn) {
    cerrarProductoBtn.addEventListener('click', cerrarDetalleProducto);
  }

  if (productoModal) {
    productoModal.addEventListener('click', (e) => {
      if (e.target === productoModal) {
        cerrarDetalleProducto();
      }
    });
  }

  // Botón "Añadir al carrito" dentro del modal de producto
  if (productoBtnCarrito) {
    productoBtnCarrito.addEventListener('click', () => {
      const idProducto = productoBtnCarrito.dataset.id;
      if (idProducto) {
        agregarAlCarrito(idProducto);

        const textoOriginal = productoBtnCarrito.textContent;
        productoBtnCarrito.textContent = "¡Añadido! ✓";
        productoBtnCarrito.style.backgroundColor = "#27ae60";

        setTimeout(() => {
          productoBtnCarrito.textContent = textoOriginal;
          productoBtnCarrito.style.backgroundColor = "";
        }, 1200);
      }
    });
  }

  // Zoom de imagen dentro del modal
  if (productoImagen) {
    productoImagen.addEventListener('click', () => {
      productoImagen.classList.toggle('zoomed');
    });
  }

  // ========================================
  // MODAL DE CONFIRMACIÓN — LISTENERS
  // ========================================
  // ✅ Un solo listener que consulta la variable global
  if (confirmAceptar) {
    confirmAceptar.addEventListener('click', () => {
      const accion = accionPendiente;
      cerrarConfirmacion();
      if (typeof accion === 'function') accion();
    });
  }

  if (confirmCancelar) {
    confirmCancelar.addEventListener('click', cerrarConfirmacion);
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        cerrarConfirmacion();
      }
    });
  }

  // ========================================
  // TECLA ESCAPE — cierra el modal abierto (en orden de prioridad)
  // ========================================
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    if (confirmModal && confirmModal.classList.contains('open')) {
      cerrarConfirmacion();
    } else if (productoModal && productoModal.classList.contains('open')) {
      cerrarDetalleProducto();
    } else if (carritoModal && carritoModal.classList.contains('open')) {
      carritoModal.classList.remove('open');
    }
  });

  // ========================================
  // MENÚ HAMBURGUESA
  // ========================================
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');

  if (mobileMenuBtn && navMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    const abierto = navMenu.classList.toggle('menu-active');
    mobileMenuBtn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });

  const enlacesMenu = navMenu.querySelectorAll('a');
  enlacesMenu.forEach(enlace => {
    enlace.addEventListener('click', () => {
      navMenu.classList.remove('menu-active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

  // ========================================
  // BÚSQUEDA
  // ========================================
  const lupaBtn = document.getElementById('lupa-btn');
  const searchContainer = document.getElementById('search-container');
  const searchInput = document.getElementById('search-input');

  if (lupaBtn && searchContainer && searchInput) {
    lupaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      searchContainer.classList.toggle('search-active');

      if (searchContainer.classList.contains('search-active')) {
        searchInput.focus();
      } else {
        searchInput.value = "";
        mostrarProductos(productos);

        const botones = document.querySelectorAll('.category-item');
        botones.forEach(b => b.classList.remove('active'));
        const botonTodos = document.querySelector('[data-categoria="todos"]');
        if (botonTodos) botonTodos.classList.add('active');
      }
    });

    searchInput.addEventListener('input', () => {
      const textoUsuario = searchInput.value.toLowerCase().trim();
      const productosFiltrados = productos.filter(p =>
        String(p.titulo).toLowerCase().includes(textoUsuario)
      );
      mostrarProductos(productosFiltrados);

      const botones = document.querySelectorAll('.category-item');
      botones.forEach(b => b.classList.remove('active'));

      if (textoUsuario === "") {
        const botonTodos = document.querySelector('[data-categoria="todos"]');
        if (botonTodos) botonTodos.classList.add('active');
      }
    });
  }

  // ========================================
  // FILTRADO POR CATEGORÍAS (delegación de eventos)
  // ========================================
  if (contenedorCategorias) {
    contenedorCategorias.addEventListener('click', (e) => {
      const boton = e.target.closest('.category-item');
      if (!boton) return;

      if (searchContainer) searchContainer.classList.remove('search-active');
      if (searchInput) searchInput.value = "";

      const botones = contenedorCategorias.querySelectorAll('.category-item');
      botones.forEach(b => b.classList.remove('active'));
      boton.classList.add('active');

      const categoriaSeleccionada = boton.getAttribute('data-categoria');
      filtrarPorCategoria(categoriaSeleccionada);
    });
  }

  // ========================================
  // ANIMACIÓN DEL NAVBAR AL HACER SCROLL
  // ========================================
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.style.padding = '0.8rem 5%';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
      } else {
        navbar.style.padding = '1.2rem 5%';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
      }
    });
  }

  // ========================================
  // VACIAR CARRITO (ahora usa el modal personalizado)
  // ========================================
  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      if (carrito.length === 0) return;

      mostrarConfirmacion({
        titulo: "¿Vaciar tu carrito?",
        mensaje: "Se eliminarán todas las piezas que agregaste. Esta acción no se puede deshacer.",
        textoAceptar: "Sí, vaciar",
        onAceptar: () => {
          vaciarCarrito();
        }
      });
    });
  }

  // ========================================
  // ENVIAR PEDIDO A WHATSAPP
  // ========================================
  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {

      if (carrito.length === 0) {
        alert("Tu carrito está vacío. Añade algunas joyas antes de finalizar tu compra.");
        return;
      }

      let messageHeader = "✨ *Nuevo Pedido - agauti* ✨\n\n";
      messageHeader += "Hola, me gustaría finalizar la compra de las siguientes piezas:\n\n";

      let messageItems = "";
      let total = 0;

      carrito.forEach((item) => {
        total += Number(item.precio);
        messageItems += `🔸 _${item.titulo}_ - *$${Number(item.precio).toFixed(2)}*\n`;
      });

      let messageFooter = `\n💰 *Total a pagar:* *$${total.toFixed(2)}*\n\n`;
      messageFooter += "Espero su confirmación para coordinar el pago y el envío. ¡Muchas gracias!";

      const fullMessage = messageHeader + messageItems + messageFooter;
      const encodedMessage = encodeURIComponent(fullMessage);

      const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodedMessage}`;
      window.open(urlWhatsApp, '_blank');
    });
  }
    // ========================================
  // DELEGACIÓN DE EVENTOS — CATÁLOGO
  // ========================================
 
  if (contenedorProductos) {
    contenedorProductos.addEventListener('click', (e) => {
      const botonCarrito = e.target.closest('.btn-cart');

      // Caso 1: click en "Añadir al carrito"
      if (botonCarrito) {
        e.stopPropagation();
        const idProducto = botonCarrito.getAttribute('data-id');
        agregarAlCarrito(idProducto);

        const textoOriginal = botonCarrito.textContent;
        botonCarrito.textContent = "¡Añadido! ✓";
        botonCarrito.style.borderColor = "#27ae60";
        botonCarrito.style.color = "#27ae60";

        setTimeout(() => {
          botonCarrito.textContent = textoOriginal;
          botonCarrito.style.borderColor = "";
          botonCarrito.style.color = "";
        }, 1000);
        return;
      }

      // Caso 2: click en cualquier otra parte de la card → abrir detalle
      const card = e.target.closest('.product-card');
      if (card) {
        abrirDetalleProducto(card.dataset.id);
      }
    });
  }

});