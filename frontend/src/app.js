/* ============================================================
   app.js — Dashboard Inmobiliario PropManager
   Arquitectura modular → cada sección es un "módulo" reutilizable.
   En React: cada módulo se convertiría en un componente o custom hook.
============================================================ */

'use strict';

/* ────────────────────────────────────────────────
   1. DATOS SIMULADOS (Data Layer)
   En React: estarían en un estado global (Context / Zustand / Redux)
   o vendrían de una API con fetch().
   La clave es que el resto del código NO asume de dónde vienen los datos.
──────────────────────────────────────────────── */

/**
 * @typedef {Object} Propiedad
 * @property {number} id
 * @property {string} nombre
 * @property {string} zona
 * @property {string} tipo
 * @property {string} inquilino
 * @property {number} alquiler
 * @property {string} vencimiento  — formato YYYY-MM-DD
 * @property {'activo'|'disponible'|'por_vencer'} estado
 */

/** @type {Propiedad[]} — Array principal de propiedades (fuente de verdad) */
let propiedades = [
  { id: 1,  nombre: 'Av. Santa Fe 2340',      zona: 'Palermo, CABA',       tipo: 'Departamento',    inquilino: 'Lucía Fernández',  alquiler: 920000,  vencimiento: '2026-08-15', estado: 'activo'     },
  { id: 2,  nombre: 'Córdoba 1890, PB',        zona: 'Almagro, CABA',       tipo: 'PH',              inquilino: 'Martín Rodríguez', alquiler: 750000,  vencimiento: '2026-05-10', estado: 'por_vencer' },
  { id: 3,  nombre: 'Belgrano 560 4°C',        zona: 'Belgrano, CABA',      tipo: 'Departamento',    inquilino: '—',               alquiler: 1100000, vencimiento: '—',          estado: 'disponible' },
  { id: 4,  nombre: 'San Martín 77 Loc. 3',    zona: 'Centro, Córdoba',     tipo: 'Local comercial', inquilino: 'Grupo TechBA',    alquiler: 1850000, vencimiento: '2027-01-31', estado: 'activo'     },
  { id: 5,  nombre: 'Rivadavia 3400 Dpto 6',   zona: 'Caballito, CABA',     tipo: 'Departamento',    inquilino: 'Sofía Herrera',   alquiler: 680000,  vencimiento: '2026-06-01', estado: 'por_vencer' },
  { id: 6,  nombre: 'Mitre 1200 Of. 201',      zona: 'Microcentro, CABA',   tipo: 'Oficina',         inquilino: 'Agencia Norte',   alquiler: 2200000, vencimiento: '2027-03-31', estado: 'activo'     },
  { id: 7,  nombre: 'Las Heras 890, 3°B',      zona: 'Recoleta, CABA',      tipo: 'Departamento',    inquilino: '—',               alquiler: 980000,  vencimiento: '—',          estado: 'disponible' },
  { id: 8,  nombre: 'Francia 234 Casa',        zona: 'Rosario, Santa Fe',   tipo: 'Casa',            inquilino: 'Jorge Pérez',     alquiler: 580000,  vencimiento: '2026-09-30', estado: 'activo'     },
];

/* ────────────────────────────────────────────────
   2. CONFIGURACIÓN DE MÉTRICAS (Config Layer)
   En React: este array podría venir de props o de un hook useDashboardMetrics()
   Separar la config de los datos permite agregar/quitar KPIs sin tocar la lógica.
──────────────────────────────────────────────── */

/**
 * Genera la configuración de las 4 tarjetas de métricas
 * a partir del array de propiedades.
 * @param {Propiedad[]} data
 * @returns {Array}
 */
function calcularMetricas(data) {
  const totalIngresos = data
    .filter(p => p.estado === 'activo')
    .reduce((sum, p) => sum + p.alquiler, 0);

  return [
    {
      label:   'Propiedades',
      value:   data.length,
      icon:    '<path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z" fill="currentColor"/>',
      delta:   '+2 este mes',
      deltaUp: true,
      accent:  '#e8c547',
      accentDim: '#e8c54722',
    },
    {
      label:   'Ingresos mensuales',
      value:   '$ ' + (totalIngresos / 1000000).toFixed(2) + 'M',
      icon:    '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      delta:   '+12% vs mes anterior',
      deltaUp: true,
      accent:  '#4ade80',
      accentDim: '#4ade8022',
    },
    {
      label:   'Inquilinos activos',
      value:   data.filter(p => p.estado === 'activo').length,
      icon:    '<circle cx="9" cy="7" r="4" fill="currentColor"/><path d="M3 20C3 17 5.7 15 9 15s6 2 6 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      delta:   'Todos al día',
      deltaUp: true,
      accent:  '#60a5fa',
      accentDim: '#60a5fa22',
    },
    {
      label:   'Por vencer (90 días)',
      value:   data.filter(p => p.estado === 'por_vencer').length,
      icon:    '<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      delta:   'Requieren atención',
      deltaUp: false,
      accent:  '#f87171',
      accentDim: '#f8717122',
    },
  ];
}

/* ────────────────────────────────────────────────
   3. MÓDULO DE MÉTRICAS — renderMetrics()
   En React: sería el componente <MetricsGrid />
   Patrón clave: función pura que recibe datos y escribe en el DOM.
──────────────────────────────────────────────── */

const metricsGrid = document.getElementById('metricsGrid');

/**
 * Renderiza las tarjetas KPI en el grid.
 * Limpia el contenedor antes de renderizar (mismo comportamiento que React re-render).
 * @param {Propiedad[]} data
 */
function renderMetrics(data) {
  const metricas = calcularMetricas(data);
  metricsGrid.innerHTML = ''; // Limpia → equivalente a que React re-renderice

  metricas.forEach(m => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    // CSS custom properties inline → permiten tematizar cada card
    card.style.setProperty('--card-accent', m.accent);
    card.style.setProperty('--card-accent-dim', m.accentDim);

    card.innerHTML = `
      <div class="metric-card__top">
        <span class="metric-card__label">${m.label}</span>
        <div class="metric-card__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">${m.icon}</svg>
        </div>
      </div>
      <div class="metric-card__value">${m.value}</div>
      <div class="metric-card__footer">
        <span class="metric-card__delta metric-card__delta--${m.deltaUp ? 'up' : 'down'}">
          ${m.deltaUp ? '↑' : '↓'} ${m.delta}
        </span>
      </div>
    `;

    metricsGrid.appendChild(card);
  });
}

/* ────────────────────────────────────────────────
   4. MÓDULO DE TABLA — renderTable()
   En React: sería <PropiedadesTable data={} /> con map() en JSX.
   Aquí usamos la misma lógica pero con template strings y DOM API.
──────────────────────────────────────────────── */

const propTableBody = document.getElementById('propTableBody');
const tableEmpty    = document.getElementById('tableEmpty');

/** Mapa de etiquetas legibles para cada estado */
const estadoLabels = {
  activo:     'Activo',
  disponible: 'Disponible',
  por_vencer: 'Por vencer',
};

/**
 * Formatea un número como moneda argentina
 * @param {number} n
 * @returns {string}
 */
function formatMoneda(n) {
  if (!n || n === 0) return '—';
  return '$ ' + n.toLocaleString('es-AR');
}

/**
 * Formatea una fecha ISO a formato legible
 * @param {string} fechaISO
 * @returns {string}
 */
function formatFecha(fechaISO) {
  if (!fechaISO || fechaISO === '—') return '—';
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Renderiza filas de la tabla con los datos filtrados.
 * @param {Propiedad[]} data — puede ser el array completo o filtrado
 */
function renderTable(data) {
  propTableBody.innerHTML = '';

  // Si no hay datos: mostrar empty state
  if (data.length === 0) {
    tableEmpty.style.display = 'flex';
    return;
  }
  tableEmpty.style.display = 'none';

  // Iterar datos → crear fila por fila (como un .map() en React JSX)
  data.forEach((prop, index) => {
    const tr = document.createElement('tr');
    // Stagger animation: cada fila aparece con un pequeño delay
    tr.style.animationDelay = `${index * 0.04}s`;

    tr.innerHTML = `
      <td>
        <div class="prop-name">
          <span class="prop-name__main">${prop.nombre}</span>
          <span class="prop-name__sub">${prop.zona}</span>
        </div>
      </td>
      <td><span class="type-badge">${prop.tipo}</span></td>
      <td>${prop.inquilino}</td>
      <td>${formatMoneda(prop.alquiler)}</td>
      <td>${formatFecha(prop.vencimiento)}</td>
      <td>
        <span class="status-badge status-badge--${prop.estado}">
          ${estadoLabels[prop.estado]}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button class="row-btn" title="Ver detalles" data-action="ver" data-id="${prop.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="row-btn row-btn--danger" title="Eliminar" data-action="eliminar" data-id="${prop.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </td>
    `;

    propTableBody.appendChild(tr);
  });

  // Delegar eventos de las acciones de fila (event delegation)
  // En React esto sería onClick en el JSX de cada botón.
  propTableBody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', handleRowAction);
  });
}

/**
 * Maneja las acciones de fila (ver / eliminar)
 * @param {MouseEvent} e
 */
function handleRowAction(e) {
  const btn    = e.currentTarget;
  const action = btn.dataset.action;
  const id     = parseInt(btn.dataset.id, 10);
  const prop   = propiedades.find(p => p.id === id);

  if (!prop) return;

  if (action === 'eliminar') {
    // Eliminar del array → re-renderizar (mismo patrón que setState en React)
    propiedades = propiedades.filter(p => p.id !== id);
    renderAll(); // Actualiza métricas + tabla
    mostrarToast(`🗑️ "${prop.nombre}" eliminada`);
  }

  if (action === 'ver') {
    mostrarToast(`👁️ Viendo: ${prop.nombre}`);
  }
}

/* ────────────────────────────────────────────────
   5. MÓDULO DE FILTROS
   En React: sería un estado activeFilter con useState
   y los datos filtrados con useMemo o directamente en el render.
──────────────────────────────────────────────── */

let filtroActivo = 'todos'; // Estado del filtro activo

const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Actualizar estado del filtro
    filtroActivo = btn.dataset.filter;

    // Actualizar clases de los botones (en React: className condicional)
    filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');

    // Re-renderizar tabla con el nuevo filtro
    const filtrados = filtrarPropiedades(filtroActivo);
    renderTable(filtrados);
  });
});

/**
 * Filtra el array de propiedades según el estado activo
 * @param {string} filtro
 * @returns {Propiedad[]}
 */
function filtrarPropiedades(filtro) {
  if (filtro === 'todos') return propiedades;
  return propiedades.filter(p => p.estado === filtro);
}

/* ────────────────────────────────────────────────
   6. MÓDULO DE MODAL — Agregar propiedad
   En React: sería un componente <Modal /> controlado con useState(open)
   y un formulario con controlled inputs (useState por campo).
──────────────────────────────────────────────── */

const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const modalCancel  = document.getElementById('modalCancel');
const modalSave    = document.getElementById('modalSave');
const btnAgregar   = document.getElementById('btnAgregarPropiedad');

// Inputs del formulario
const inputNombre      = document.getElementById('inputNombre');
const inputTipo        = document.getElementById('inputTipo');
const inputAlquiler    = document.getElementById('inputAlquiler');
const inputInquilino   = document.getElementById('inputInquilino');
const inputVencimiento = document.getElementById('inputVencimiento');
const inputEstado      = document.getElementById('inputEstado');

/** Abre el modal */
function abrirModal() {
  modalOverlay.classList.add('is-open');
  inputNombre.focus();
}

/** Cierra y limpia el modal */
function cerrarModal() {
  modalOverlay.classList.remove('is-open');
  limpiarForm();
}

/** Resetea todos los inputs del formulario */
function limpiarForm() {
  [inputNombre, inputAlquiler, inputInquilino, inputVencimiento].forEach(el => el.value = '');
  inputTipo.value   = 'Departamento';
  inputEstado.value = 'disponible';
}

// Eventos del modal
btnAgregar.addEventListener('click', abrirModal);
modalClose.addEventListener('click', cerrarModal);
modalCancel.addEventListener('click', cerrarModal);

// Cerrar al hacer click en el overlay (fuera del modal)
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) cerrarModal();
});

// Cerrar con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarModal();
});

/**
 * Valida y guarda una nueva propiedad.
 * En React: esto sería el onSubmit del formulario.
 */
modalSave.addEventListener('click', () => {
  // Validación básica (en React se usaría react-hook-form o validación manual)
  if (!inputNombre.value.trim()) {
    inputNombre.focus();
    inputNombre.style.borderColor = 'var(--color-danger)';
    setTimeout(() => inputNombre.style.borderColor = '', 1500);
    return;
  }

  // Crear nuevo objeto propiedad
  const nuevaPropiedad = {
    id:          generarId(),
    nombre:      inputNombre.value.trim(),
    zona:        'Buenos Aires',             // Simplificado
    tipo:        inputTipo.value,
    inquilino:   inputInquilino.value.trim() || '—',
    alquiler:    parseInt(inputAlquiler.value) || 0,
    vencimiento: inputVencimiento.value || '—',
    estado:      inputEstado.value,
  };

  // Agregar al array (en React: setData(prev => [...prev, nuevaPropiedad]))
  propiedades.push(nuevaPropiedad);

  cerrarModal();
  renderAll();
  mostrarToast(`✅ "${nuevaPropiedad.nombre}" agregada exitosamente`);
});

/**
 * Genera un ID único simple (en producción usaríamos uuid)
 * @returns {number}
 */
function generarId() {
  return Math.max(...propiedades.map(p => p.id), 0) + 1;
}

/* ────────────────────────────────────────────────
   7. TOAST — Notificaciones temporales
   En React: sería un sistema de toast con Context + portal,
   o una lib como react-hot-toast.
──────────────────────────────────────────────── */

const toastEl = document.getElementById('toast');
let toastTimer = null;

/**
 * Muestra un mensaje toast temporal
 * @param {string} mensaje
 * @param {number} duracion — ms
 */
function mostrarToast(mensaje, duracion = 3000) {
  toastEl.textContent = mensaje;
  toastEl.classList.add('is-visible');

  // Cancelar timer anterior si había uno activo
  if (toastTimer) clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
  }, duracion);
}

/* ────────────────────────────────────────────────
   8. SIDEBAR TOGGLE (para mobile)
   En React: sería un useState(sidebarOpen) en el layout root.
──────────────────────────────────────────────── */

const sidebar        = document.getElementById('sidebar');
const sidebarToggle  = document.getElementById('sidebarToggle');
const topbarTitle    = document.getElementById('topbarTitle');

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('is-open');
});

// Navegación del sidebar → actualiza el título del breadcrumb
const sidebarItems = document.querySelectorAll('.sidebar__item');

sidebarItems.forEach(item => {
  item.addEventListener('click', () => {
    // Actualizar ítem activo
    sidebarItems.forEach(i => i.classList.remove('sidebar__item--active'));
    item.classList.add('sidebar__item--active');

    // Actualizar breadcrumb
    const label = item.querySelector('span').textContent;
    topbarTitle.textContent = label;

    // En mobile: cerrar sidebar al navegar
    sidebar.classList.remove('is-open');
  });
});

/* ────────────────────────────────────────────────
   9. FUNCIÓN CENTRAL renderAll()
   En React: sería el equivalente a que el estado raíz cambie
   y React re-renderice todos los componentes afectados.
   Aquí lo hacemos manualmente pero con la misma filosofía.
──────────────────────────────────────────────── */

/**
 * Re-renderiza TODOS los componentes visuales que dependen de `propiedades`.
 * Siempre aplica el filtro activo a la tabla.
 */
function renderAll() {
  renderMetrics(propiedades);                          // Métricas usan el total
  renderTable(filtrarPropiedades(filtroActivo));        // Tabla usa filtro activo
}

/* ────────────────────────────────────────────────
   10. INICIALIZACIÓN
   En React: este bloque sería el useEffect(() => { fetchData() }, [])
   del componente raíz, o simplemente el estado inicial del Context.
──────────────────────────────────────────────── */

/** Renderizado inicial al cargar la página */
function init() {
  renderAll();

  // Simular notificación de bienvenida con leve delay
  setTimeout(() => {
    mostrarToast('👋 Bienvenido a PropManager', 2500);
  }, 500);
}

// Punto de entrada del sistema
init();
