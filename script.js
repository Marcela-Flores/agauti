// ==========================================
// 1. CONFIGURACIÓN GLOBAL Y VARIABLES
// ==========================================
let productos = [];
let carrito = [];

// ✅ CONFIGURACIÓN DEL WHATSAPP (editá solo acá)
const WHATSAPP_NUMERO = "5492964474746"; // sin +, sin espacios, sin guiones

const contenedorProductos = document.getElementById('contenedor-productos');

// ✅ CORREGIDO: usamos id en vez de :last-child (más seguro)
const carritoEnlace = document.getElementById('carrito-btn');
const badge = document.createElement('span');

// Elementos del Modal del Carrito
const carritoModal = document.getElementById('carrito-modal');
const cerrarCarritoBtn = document.getElementById('cerrar-carrito');
const contenedorCarritoItems = document.getElementById('carrito-items');
const totalCarritoTexto = document.getElementById('carrito-total');
const btnVaciar = document.getElementById('btn-vaciar');

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
  // ✅ MEJORA: validación por si el storage está corrupto
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
function agregarAlCarrito(idProducto) {
  // ✅ ROBUSTO: comparamos como string por si algún día hay ids numéricos
  const productoSeleccionado = productos.find(
    p => String(p.id) === String(idProducto)
  );

  if (productoSeleccionado) {
    carrito.push(productoSeleccionado);
    actualizarInterfazCarrito();
    guardarCarritoEnStorage();
  } else {
    console.warn("Producto no encontrado con id:", idProducto);
  }
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

// ✅ MEJORA: helper para evitar XSS básico
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function actualizarInterfazCarrito() {
  badge.textContent = carrito.length;
  badge.style.display = carrito.length > 0 ? 'block' : 'none';
  contenedorCarritoItems.innerHTML = "";

  if (carrito.length === 0) {
    contenedorCarritoItems.innerHTML =
      "<p style='text-align:center; color: var(--text-muted); padding-top: 2rem;'>Tu carrito está vacío.</p>";
    totalCarritoTexto.textContent = "$0.00";
    return;
  }

  let totalAcumulado = 0;

  carrito.forEach((item, index) => {
    totalAcumulado += item.precio;

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('cart-item');
    // ✅ MEJORA: escapamos los textos que vienen del JSON
    itemDiv.innerHTML = `
      <img src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.titulo)}">
      <div class="cart-item-info">
        <h4>${escapeHtml(item.titulo)}</h4>
        <p class="price">$${Number(item.precio).toFixed(2)}</p>
      </div>
      <button class="btn-remove" data-index="${index}">&times;</button>
    `;
    contenedorCarritoItems.appendChild(itemDiv);
  });

  totalCarritoTexto.textContent = `$${totalAcumulado.toFixed(2)}`;
  asignarEventosEliminar();
}

function asignarEventosEliminar() {
  const botonesEliminar = document.querySelectorAll('.btn-remove');
  botonesEliminar.forEach(boton => {
    boton.addEventListener('click', () => {
      const indexParaEliminar = parseInt(boton.getAttribute('data-index'), 10);
      eliminarDelCarrito(indexParaEliminar);
    });
  });
}

// ==========================================
// 4. RENDERIZADO DEL CATÁLOGO
// ==========================================
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

    card.innerHTML = `
      <img src="${escapeHtml(producto.imagen)}" alt="${escapeHtml(producto.titulo)}">
      <h3>${escapeHtml(producto.titulo)}</h3>
      <p class="price">$${Number(producto.precio).toFixed(2)}</p>
      <button class="btn-cart" data-id="${escapeHtml(producto.id)}">Añadir al carrito</button>
    `;
    contenedorProductos.appendChild(card);
  });

  asignarEventosBotonesCatalogo();
}

function asignarEventosBotonesCatalogo() {
  const botonesCarrito = document.querySelectorAll('.btn-cart');
  botonesCarrito.forEach(boton => {
    boton.addEventListener('click', () => {
      const idProducto = boton.getAttribute('data-id');
      agregarAlCarrito(idProducto);

      const textoOriginal = boton.textContent;
      boton.textContent = "¡Añadido! ✓";
      boton.style.borderColor = "#27ae60";
      boton.style.color = "#27ae60";

      setTimeout(() => {
        boton.textContent = textoOriginal;
        boton.style.borderColor = "";
        boton.style.color = "";
      }, 1000);
    });
  });
}

// ==========================================
// 5. INICIALIZACIÓN GENERAL
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
      productos = datos;
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

  // Abrir carrito
  if (carritoEnlace) {
    carritoEnlace.addEventListener('click', (e) => {
      e.preventDefault();
      carritoModal.classList.add('open');
    });
  }

  // Cerrar carrito (botón X)
  if (cerrarCarritoBtn) {
    cerrarCarritoBtn.addEventListener('click', () => {
      carritoModal.classList.remove('open');
    });
  }

  // ✅ MEJORA: cerrar carrito al hacer clic fuera del modal
  if (carritoModal) {
    carritoModal.addEventListener('click', (e) => {
      if (e.target === carritoModal) {
        carritoModal.classList.remove('open');
      }
    });
  }

  // ✅ MEJORA: cerrar carrito con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && carritoModal.classList.contains('open')) {
      carritoModal.classList.remove('open');
    }
  });

  // Menú Hamburguesa
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('menu-active');
    });

    const enlacesMenu = navMenu.querySelectorAll('a');
    enlacesMenu.forEach(enlace => {
      enlace.addEventListener('click', () => {
        navMenu.classList.remove('menu-active');
      });
    });
  }

  // Búsqueda
  const lupaBtn = document.getElementById('lupa-btn');
  const searchContainer = document.getElementById('search-container');
  const searchInput = document.getElementById('search-input');
  const botonesCategoria = document.querySelectorAll('.category-item');
  const botonTodos = document.querySelector('[data-categoria="todos"]');

  if (lupaBtn && searchContainer && searchInput) {
    lupaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      searchContainer.classList.toggle('search-active');

      if (searchContainer.classList.contains('search-active')) {
        searchInput.focus();
      } else {
        searchInput.value = "";
        mostrarProductos(productos);
        botonesCategoria.forEach(b => b.classList.remove('active'));
        if (botonTodos) botonTodos.classList.add('active');
      }
    });

    searchInput.addEventListener('input', () => {
      const textoUsuario = searchInput.value.toLowerCase().trim();
      const productosFiltrados = productos.filter(p =>
        p.titulo.toLowerCase().includes(textoUsuario)
      );
      mostrarProductos(productosFiltrados);

      botonesCategoria.forEach(b => b.classList.remove('active'));
      if (textoUsuario === "" && botonTodos) {
        botonTodos.classList.add('active');
      }
    });
  }

  // Filtrado por Categorías
  botonesCategoria.forEach(boton => {
    boton.addEventListener('click', () => {
      if (searchContainer) searchContainer.classList.remove('search-active');
      if (searchInput) searchInput.value = "";

      botonesCategoria.forEach(b => b.classList.remove('active'));
      boton.classList.add('active');

      const categoriaSeleccionada = boton.getAttribute('data-categoria');
      if (categoriaSeleccionada === "todos") {
        mostrarProductos(productos);
      } else {
        const productosFiltrados = productos.filter(
          p => p.categoria === categoriaSeleccionada
        );
        mostrarProductos(productosFiltrados);
      }
    });
  });

  // Animación del Navbar al hacer Scroll
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

  // Vaciar carrito
  if (btnVaciar) {
    btnVaciar.addEventListener('click', () => {
      if (carrito.length > 0) {
        if (confirm("¿Estás seguro de que deseas vaciar todo tu carrito?")) {
          vaciarCarrito();
        }
      }
    });
  }

  // ✅ ENVIAR PEDIDO A WHATSAPP (CORREGIDO)
  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {

      if (carrito.length === 0) {
        alert("Tu carrito está vacío. Añade algunas joyas antes de finalizar tu compra.");
        return;
      }

      let messageHeader = "✨ *Nuevo Pedido - agauti JOYAS* ✨\n\n";
      messageHeader += "Hola, me gustaría finalizar la compra de las siguientes piezas:\n\n";

      let messageItems = "";
      let total = 0;

      carrito.forEach((item) => {
        total += item.precio;
        messageItems += `🔸 _${item.titulo}_ - *$${Number(item.precio).toFixed(2)}*\n`;
      });

      let messageFooter = `\n💰 *Total a pagar:* *$${total.toFixed(2)}*\n\n`;
      messageFooter += "Espero su confirmación para coordinar el pago y el envío. ¡Muchas gracias!";

      const fullMessage = messageHeader + messageItems + messageFooter;
      const encodedMessage = encodeURIComponent(fullMessage);

      // ✅ CORREGIDO: ahora SÍ usa el número
      const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodedMessage}`;
      window.open(urlWhatsApp, '_blank');
    });
  }

 
});