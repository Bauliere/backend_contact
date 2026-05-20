const appBasePath = window.location.pathname
    .replace(/\/index\.(html|php)$/i, '')
    .replace(/\/$/, '');
const API_BASE = `${appBasePath}/api`;

const state = {
    categories: [],
    contacts: [],
    groupedContacts: [],
    categoryFilter: 'all',
    dataContactFilter: 'all',
    dataTypeFilter: 'all',
    search: '',
    report: 'phones',
};

const defaultCategoryColors = ['#ff7ab6', '#89d3ff', '#d6f75d', '#20c787', '#ff8f4d', '#8f7aff'];
const themes = ['forest', 'neon-mint', 'neon-cyan', 'neon-violet', 'neon-pink', 'neon-lime', 'neon-amber'];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const icons = {
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>',
};

const reportPaths = {
    phones: '/contactos/telefonos-principales',
    counts: '/categorias/conteo',
    work: '/contactos/categoria/Trabajo',
    recent: '/contactos/recientes?limit=5',
};

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error || 'No se pudo completar la solicitud.');
    }

    return payload;
}

function setStatus(message, isError = false) {
    const status = $('#api-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('danger', isError);
}

function setTheme(theme) {
    const selectedTheme = themes.includes(theme) ? theme : 'forest';
    document.documentElement.dataset.theme = selectedTheme;
    localStorage.setItem('agenda-theme', selectedTheme);
    $$('[data-theme-choice]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.themeChoice === selectedTheme);
    });
    $('.theme-menu')?.classList.remove('is-open');
    $('#theme-toggle')?.setAttribute('aria-expanded', 'false');
}

function showView(view) {
    const allowedViews = ['inicio', 'contactos', 'categorias', 'nuevo-contacto', 'datos', 'reportes', 'acerca'];
    const normalized = allowedViews.includes(view) ? view : 'contactos';
    $$('.view').forEach((section) => {
        section.classList.toggle('is-active', section.dataset.view === normalized);
    });
    $$('[data-nav-link]').forEach((link) => {
        link.classList.toggle('is-active', link.dataset.navLink === normalized);
    });

    if (normalized === 'reportes') {
        loadReport(state.report).catch(handleError);
    }
}

function currentRoute() {
    return (window.location.hash || '#contactos').replace('#', '');
}

function groupContacts(rows) {
    const groups = new Map();
    rows.forEach((row) => {
        const id = Number(row.id_contacto);
        if (!groups.has(id)) {
            groups.set(id, {
                id_contacto: id,
                nombre: row.nombre,
                apellido: row.apellido,
                fecha_nacimiento: row.fecha_nacimiento,
                fecha_registro: row.fecha_registro,
                id_categoria: Number(row.id_categoria),
                nombre_categoria: row.nombre_categoria,
                color_categoria: row.color_categoria,
                datos: [],
            });
        }

        if (row.id_dato) {
            groups.get(id).datos.push({
                id_dato: Number(row.id_dato),
                id_contacto: id,
                nombre_contacto: `${row.nombre} ${row.apellido}`,
                tipo_dato: row.tipo_dato,
                valor: row.valor,
                es_principal: Boolean(Number(row.es_principal)),
            });
        }
    });

    return [...groups.values()].sort((a, b) => b.id_contacto - a.id_contacto);
}

function allContactData() {
    return state.groupedContacts.flatMap((contact) => contact.datos.map((data) => ({
        ...data,
        nombre_contacto: `${contact.nombre} ${contact.apellido}`,
    })));
}

function sortedContactData(datos) {
    const order = {
        Telefono: 1,
        Correo: 2,
        Direccion: 3,
    };

    return [...datos].sort((a, b) => {
        const orderA = order[a.tipo_dato] || 99;
        const orderB = order[b.tipo_dato] || 99;
        return orderA - orderB || a.id_dato - b.id_dato;
    });
}

function fillSelect(select, items, getValue, getLabel) {
    if (!select) return;
    select.innerHTML = items.length
        ? items.map((item) => `<option value="${escapeHtml(getValue(item))}">${escapeHtml(getLabel(item))}</option>`).join('')
        : '<option value="">Sin registros</option>';
}

function displayDataType(type) {
    return {
        Telefono: 'Teléfono',
        Direccion: 'Dirección',
    }[type] || type;
}

function categoryColor(category) {
    return category?.color_categoria || '#20c787';
}

function categoryBadge(category) {
    return `<span class="category-badge" style="--badge-color: ${escapeHtml(categoryColor(category))}">${escapeHtml(category?.nombre_categoria || 'Sin categoria')}</span>`;
}

function renderMetrics() {
    const dataCount = state.groupedContacts.reduce((total, contact) => total + contact.datos.length, 0);
    $('#metric-contacts').textContent = state.groupedContacts.length;
    $('#metric-categories').textContent = state.categories.length;
    $('#metric-data').textContent = dataCount;
}

function renderCategoryFilter() {
    const container = $('#category-filter');
    if (!container) return;

    const buttons = [
        { value: 'all', label: 'Todas' },
        ...state.categories.map((category) => ({
            value: String(category.id_categoria),
            label: category.nombre_categoria,
            color: categoryColor(category),
        })),
    ];

    container.innerHTML = buttons.map((item) => `
        <button type="button" data-filter-category="${escapeHtml(item.value)}" class="${state.categoryFilter === item.value ? 'is-active' : ''}" style="${item.color ? `--badge-color: ${escapeHtml(item.color)}` : ''}">
            ${escapeHtml(item.label)}
        </button>
    `).join('');
}

function renderCategories() {
    fillSelect($('#contact-category'), state.categories, (item) => item.id_categoria, (item) => item.nombre_categoria);

    const table = $('#categories-table');
    if (!table) return;

    table.innerHTML = state.categories.length ? state.categories.map((category) => `
        <tr>
            <td>${category.id_categoria}</td>
            <td>${categoryBadge(category)}</td>
            <td><span class="color-preview" style="--badge-color: ${escapeHtml(categoryColor(category))}">${escapeHtml(categoryColor(category))}</span></td>
            <td class="muted">${escapeHtml(category.descripcion || 'Sin descripción')}</td>
            <td>
                <div class="row-actions">
                    <button class="icon-button" type="button" title="Editar categoria" aria-label="Editar categoria" data-edit-category="${category.id_categoria}">${icons.edit}</button>
                    <button class="icon-button danger" type="button" title="Eliminar categoria" aria-label="Eliminar categoria" data-delete-category="${category.id_categoria}">${icons.trash}</button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr class="empty-row"><td colspan="5">Sin categorías registradas.</td></tr>';

    renderCategoryFilter();
}

function renderContactSelects() {
    fillSelect(
        $('#data-contact'),
        state.groupedContacts,
        (item) => item.id_contacto,
        (item) => `${item.nombre} ${item.apellido}`
    );
}

function renderDataFilters() {
    const container = $('#data-contact-filter');
    if (!container) return;

    const buttons = [
        { value: 'all', label: 'General' },
        ...state.groupedContacts.map((contact) => ({
            value: String(contact.id_contacto),
            label: `${contact.nombre} ${contact.apellido}`,
        })),
    ];

    container.innerHTML = buttons.map((item) => `
        <button type="button" data-filter-contact="${escapeHtml(item.value)}" class="${state.dataContactFilter === item.value ? 'is-active' : ''}">
            ${escapeHtml(item.label)}
        </button>
    `).join('');

    $$('#data-type-filter [data-filter-type]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.filterType === state.dataTypeFilter);
    });
}

function filteredContacts() {
    const query = state.search.trim().toLowerCase();
    return state.groupedContacts.filter((contact) => {
        const matchesCategory = state.categoryFilter === 'all' || String(contact.id_categoria) === state.categoryFilter;
        const haystack = [
            contact.nombre,
            contact.apellido,
            contact.nombre_categoria,
            contact.fecha_registro,
            ...contact.datos.flatMap((data) => [data.tipo_dato, data.valor]),
        ].join(' ').toLowerCase();

        return matchesCategory && (!query || haystack.includes(query));
    });
}

function renderContacts() {
    const table = $('#contacts-table');
    if (!table) return;

    const contacts = filteredContacts();
    table.innerHTML = contacts.length ? contacts.map((contact) => `
        <tr>
            <td>${contact.id_contacto}</td>
            <td>
                <strong>${escapeHtml(contact.nombre)} ${escapeHtml(contact.apellido)}</strong>
                <div class="muted">${escapeHtml(contact.fecha_nacimiento || 'Sin fecha de nacimiento')}</div>
            </td>
            <td>${categoryBadge(state.categories.find((category) => Number(category.id_categoria) === Number(contact.id_categoria)) || contact)}</td>
            <td>
                <div class="data-tags">
                    ${contact.datos.length ? sortedContactData(contact.datos).map((data) => `
                        <span class="tag"><strong>${escapeHtml(displayDataType(data.tipo_dato))}</strong>${escapeHtml(data.valor)}</span>
                    `).join('') : '<span class="tag">Sin datos</span>'}
                </div>
            </td>
            <td class="muted">${escapeHtml(contact.fecha_registro || '')}</td>
            <td>
                <div class="row-actions">
                    <button class="icon-button" type="button" title="Editar contacto" aria-label="Editar contacto" data-edit-contact="${contact.id_contacto}">${icons.edit}</button>
                    <button class="icon-button danger" type="button" title="Eliminar contacto" aria-label="Eliminar contacto" data-delete-contact="${contact.id_contacto}">${icons.trash}</button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr class="empty-row"><td colspan="6">Sin contactos para mostrar.</td></tr>';
}

function filteredDataRows() {
    return allContactData()
        .filter((data) => state.dataContactFilter === 'all' || String(data.id_contacto) === state.dataContactFilter)
        .filter((data) => state.dataTypeFilter === 'all' || data.tipo_dato === state.dataTypeFilter)
        .sort((a, b) => b.id_dato - a.id_dato);
}

function renderDataRows() {
    const table = $('#data-table');
    if (!table) return;

    renderDataFilters();
    const rows = filteredDataRows();
    table.innerHTML = rows.length ? rows.map((data) => `
        <tr>
            <td>${data.id_dato}</td>
            <td>${escapeHtml(data.nombre_contacto)}</td>
            <td>${escapeHtml(displayDataType(data.tipo_dato))}${data.es_principal ? ' <span class="tag principal-tag">Principal</span>' : ''}</td>
            <td>${escapeHtml(data.valor)}</td>
            <td>
                <div class="row-actions">
                    <button class="icon-button" type="button" title="Editar dato" aria-label="Editar dato" data-edit-data="${data.id_dato}" data-contact-id="${data.id_contacto}">${icons.edit}</button>
                    <button class="icon-button danger" type="button" title="Eliminar dato" aria-label="Eliminar dato" data-delete-data="${data.id_dato}">${icons.trash}</button>
                </div>
            </td>
        </tr>
    `).join('') : '<tr class="empty-row"><td colspan="5">Sin datos registrados.</td></tr>';
}

function renderReport(rows) {
    const table = $('#report-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    if (!rows.length) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr class="empty-row"><td>Sin resultados.</td></tr>';
        return;
    }

    const keys = Object.keys(rows[0]);
    thead.innerHTML = `<tr>${keys.map((key) => `<th>${escapeHtml(key.replaceAll('_', ' '))}</th>`).join('')}</tr>`;
    tbody.innerHTML = rows.map((row) => `
        <tr>${keys.map((key) => `<td>${escapeHtml(row[key])}</td>`).join('')}</tr>
    `).join('');
}

async function loadData() {
    const [categories, contacts] = await Promise.all([
        api('/categorias'),
        api('/contactos'),
    ]);

    state.categories = categories.data || [];
    state.contacts = contacts.data || [];
    state.groupedContacts = groupContacts(state.contacts);

    renderMetrics();
    renderCategories();
    renderContactSelects();
    renderContacts();
    renderDataRows();
}

async function loadReport(type) {
    state.report = type;
    $$('.report-tabs [data-report]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.report === type);
    });
    const payload = await api(reportPaths[type]);
    renderReport(payload.data || []);
}

function resetCategoryForm() {
    $('#category-id').value = '';
    $('#category-form').reset();
    $('#category-color').value = defaultCategoryColors[state.categories.length % defaultCategoryColors.length];
}

function resetContactForm() {
    $('#contact-id').value = '';
    $('#contact-form').reset();
    $('#contact-form-title').textContent = 'Registrar contacto';
}

function resetDataForm() {
    $('#data-id').value = '';
    $('#data-form').reset();
}

function editCategory(id) {
    const category = state.categories.find((item) => Number(item.id_categoria) === Number(id));
    if (!category) return;
    $('#category-id').value = category.id_categoria;
    $('#category-name').value = category.nombre_categoria;
    $('#category-description').value = category.descripcion || '';
    $('#category-color').value = categoryColor(category);
    window.location.hash = '#categorias';
}

function editContact(id) {
    const contact = state.groupedContacts.find((item) => item.id_contacto === Number(id));
    if (!contact) return;
    $('#contact-id').value = contact.id_contacto;
    $('#contact-name').value = contact.nombre;
    $('#contact-lastname').value = contact.apellido;
    $('#contact-birthdate').value = contact.fecha_nacimiento || '';
    $('#contact-category').value = contact.id_categoria;
    $('#contact-phone').value = '';
    $('#contact-email').value = '';
    $('#contact-address').value = '';
    $('#contact-form-title').textContent = 'Editar contacto';
    window.location.hash = '#nuevo-contacto';
}

function editData(id, contactId) {
    const contact = state.groupedContacts.find((item) => item.id_contacto === Number(contactId));
    const data = contact?.datos.find((item) => item.id_dato === Number(id));
    if (!data) return;
    $('#data-id').value = data.id_dato;
    $('#data-contact').value = contact.id_contacto;
    $('#data-type').value = data.tipo_dato;
    $('#data-value').value = data.valor;
    $('#data-primary').checked = data.es_principal;
    window.location.hash = '#datos';
}

async function deleteRecord(path, label) {
    if (!window.confirm(`Eliminar ${label}?`)) {
        return;
    }
    await api(path, { method: 'DELETE' });
    await loadData();
}

function bindEvents() {
    window.addEventListener('unhandledrejection', (event) => {
        event.preventDefault();
        const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        handleError(reason);
    });

    window.addEventListener('hashchange', () => showView(currentRoute()));

    document.addEventListener('pointerdown', (event) => {
        const button = event.target.closest('button, .action-link, .dashboard-card');
        if (!button) return;
        button.classList.add('is-pressing');
        window.setTimeout(() => button.classList.remove('is-pressing'), 180);
    });

    document.addEventListener('click', (event) => {
        if (!$('.theme-menu')?.contains(event.target)) {
            $('.theme-menu')?.classList.remove('is-open');
            $('#theme-toggle')?.setAttribute('aria-expanded', 'false');
        }
    });

    $('#theme-toggle').addEventListener('click', (event) => {
        event.stopPropagation();
        const menu = $('.theme-menu');
        const isOpen = !menu.classList.contains('is-open');
        menu.classList.toggle('is-open', isOpen);
        $('#theme-toggle').setAttribute('aria-expanded', String(isOpen));
    });

    $$('[data-theme-choice]').forEach((button) => {
        button.addEventListener('click', () => setTheme(button.dataset.themeChoice));
    });

    $('#contact-search').addEventListener('input', (event) => {
        state.search = event.target.value;
        renderContacts();
    });

    $('#category-filter').addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter-category]');
        if (!button) return;
        state.categoryFilter = button.dataset.filterCategory;
        renderCategoryFilter();
        renderContacts();
    });

    $('#data-contact-filter').addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter-contact]');
        if (!button) return;
        state.dataContactFilter = button.dataset.filterContact;
        renderDataRows();
    });

    $('#data-type-filter').addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter-type]');
        if (!button) return;
        state.dataTypeFilter = button.dataset.filterType;
        renderDataRows();
    });

    $('#reset-category').addEventListener('click', resetCategoryForm);
    $('#reset-contact').addEventListener('click', resetContactForm);
    $('#reset-data').addEventListener('click', resetDataForm);

    $('#category-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = $('#category-id').value;
        await api(id ? `/categorias/${id}` : '/categorias', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify({
                nombre_categoria: $('#category-name').value,
                descripcion: $('#category-description').value,
                color_categoria: $('#category-color').value,
            }),
        });
        resetCategoryForm();
        await loadData();
    });

    $('#contact-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = $('#contact-id').value;
        const phone = $('#contact-phone').value.trim();
        const email = $('#contact-email').value.trim();
        const address = $('#contact-address').value.trim();
        const contactResponse = await api(id ? `/contactos/${id}` : '/contactos', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify({
                nombre: $('#contact-name').value,
                apellido: $('#contact-lastname').value,
                fecha_nacimiento: $('#contact-birthdate').value || null,
                id_categoria: Number($('#contact-category').value),
            }),
        });

        const contactId = id || contactResponse.data?.[0]?.id_contacto;
        const extraData = [
            phone ? { id_contacto: Number(contactId), tipo_dato: 'Telefono', valor: phone, es_principal: true } : null,
            email ? { id_contacto: Number(contactId), tipo_dato: 'Correo', valor: email, es_principal: !phone } : null,
            address ? { id_contacto: Number(contactId), tipo_dato: 'Direccion', valor: address, es_principal: false } : null,
        ].filter(Boolean);

        for (const item of extraData) {
            await api('/datos-contacto', {
                method: 'POST',
                body: JSON.stringify(item),
            });
        }

        resetContactForm();
        await loadData();
        window.location.hash = '#contactos';
    });

    $('#data-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = $('#data-id').value;
        await api(id ? `/datos-contacto/${id}` : '/datos-contacto', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify({
                id_contacto: Number($('#data-contact').value),
                tipo_dato: $('#data-type').value,
                valor: $('#data-value').value,
                es_principal: $('#data-primary').checked,
            }),
        });
        resetDataForm();
        await loadData();
    });

    $('#categories-table').addEventListener('click', async (event) => {
        const edit = event.target.closest('[data-edit-category]');
        const remove = event.target.closest('[data-delete-category]');
        if (edit) editCategory(edit.dataset.editCategory);
        if (remove) await deleteRecord(`/categorias/${remove.dataset.deleteCategory}`, 'esta categoria').catch(handleError);
    });

    $('#contacts-table').addEventListener('click', async (event) => {
        const edit = event.target.closest('[data-edit-contact]');
        const remove = event.target.closest('[data-delete-contact]');
        if (edit) editContact(edit.dataset.editContact);
        if (remove) await deleteRecord(`/contactos/${remove.dataset.deleteContact}`, 'este contacto').catch(handleError);
    });

    $('#data-table').addEventListener('click', async (event) => {
        const edit = event.target.closest('[data-edit-data]');
        const remove = event.target.closest('[data-delete-data]');
        if (edit) editData(edit.dataset.editData, edit.dataset.contactId);
        if (remove) await deleteRecord(`/datos-contacto/${remove.dataset.deleteData}`, 'este dato').catch(handleError);
    });

    $$('.report-tabs [data-report]').forEach((button) => {
        button.addEventListener('click', () => loadReport(button.dataset.report).catch(handleError));
    });
}

function handleError(error) {
    console.error(error.message);
    window.alert(error.message);
}

async function start() {
    setTheme(localStorage.getItem('agenda-theme') || 'forest');
    bindEvents();
    showView(currentRoute());
    try {
        await loadData();
        await loadReport(state.report);
    } catch (error) {
        handleError(error);
    }
}

start();
