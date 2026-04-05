document.addEventListener('DOMContentLoaded', () => {
    let allMinis = [];
    let selectedIds = new Set();

    const productList = document.getElementById('product-list');
    const brandList = document.getElementById('brand-list');
    const articleList = document.getElementById('article-list');
    const sidebar = document.getElementById('sidebar');
    const brandFilterList = document.getElementById('brand-filter-list');
    const cpuFilterList = document.getElementById('cpu-filter-list');
    const ramFilterList = document.getElementById('ram-filter-list');

    const compareBar = document.getElementById('compare-bar');
    const compareCount = document.getElementById('compare-count');
    const btnCompareOpen = document.getElementById('btn-compare-open');
    const btnCompareClose = document.getElementById('btn-compare-close');
    const compareModal = document.getElementById('compare-modal');
    const compareTableBody = document.getElementById('compare-table-body');

    const siteTitleLink = document.querySelector('header h1 a');
    const headerContainer = document.querySelector('header .container');
    const footerCopy = document.querySelector('footer p');

    let isAdminAuthenticated = localStorage.getItem('shotpc_admin') === 'true';
    let adminViewMode = localStorage.getItem('shotpc_admin_view') || 'admin';

    const UI_TEXT = {
        currentView: '\u73fe\u5728\u306e\u8868\u793a\u306f',
        adminView: '\u30a2\u30c9\u30df\u30f3\u30e2\u30fc\u30c9\u3067\u5168\u8868\u793a',
        userView: '\u30e6\u30fc\u30b6\u30fc\u76ee\u7dda',
        switchUser: '\u30e6\u30fc\u30b6\u30fc\u76ee\u7dda\u306b\u5207\u66ff',
        switchAdmin: '\u30a2\u30c9\u30df\u30f3\u30e2\u30fc\u30c9\u3067\u5168\u8868\u793a',
        adminSessionOn: 'Admin Mode: ON',
        adminSessionOff: 'Admin Mode: OFF',
        enterPassword: '\u7ba1\u7406\u8005\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044:',
        wrongPassword: '\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u9055\u3044\u307e\u3059\u3002',
        loadError: '\u30c7\u30fc\u30bf\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002',
        noResults: '\u6761\u4ef6\u306b\u5408\u3046\u30df\u30cbPC\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002',
        compare: '\u6bd4\u8f03',
        inStock: '\u5728\u5eab\u3042\u308a',
        outOfStock: '\u5728\u5eab\u5207\u308c',
        unknown: '\u672a\u8a18\u8f09',
        none: '\u306a\u3057',
        couponApplied: '\u30af\u30fc\u30dd\u30f3\u9069\u7528\u6e08\u307f',
        viewOnAmazon: 'Amazon\u3067\u8a73\u7d30\u3092\u898b\u308b',
        yes: '\u5bfe\u5fdc',
        no: '-',
        notes: '\u5099\u8003',
        models: '\u4ee3\u8868\u30e2\u30c7\u30eb',
        rows: {
            model: '\u30e2\u30c7\u30eb',
            price: '\u4fa1\u683c',
            aiSuitability: 'AI\u9069\u6027',
            cpu: 'CPU',
            ram: 'RAM',
            vram: 'VRAM\u5272\u5f53',
            oculink: 'Oculink',
            storage: 'Storage',
            thermal: '\u51b7\u5374 / \u71b1\u8a2d\u8a08',
            amazon: 'Amazon'
        }
    };

    function isAdminVisiblePage() {
        const path = window.location.pathname || '/shotpc/';
        return path === '/shotpc/'
            || path.endsWith('/index.html')
            || path.includes('/shotpc/ja/compare/')
            || path.includes('/shotpc/ja/catalog/')
            || path.includes('/shotpc/ja/catalog2/')
            || path.includes('/shotpc/ja/catalog3/')
            || path.includes('/shotpc/ja/catalog4/')
            || path.includes('/shotpc/ja/catalog5/');
    }

    function isAdminViewEnabled() {
        return isAdminAuthenticated && adminViewMode === 'admin';
    }

    function persistAdminSession(nextIsAdminAuthenticated) {
        isAdminAuthenticated = nextIsAdminAuthenticated;
        localStorage.setItem('shotpc_admin', String(isAdminAuthenticated));
        if (!isAdminAuthenticated) {
            adminViewMode = 'user';
            localStorage.setItem('shotpc_admin_view', adminViewMode);
        }
    }

    function persistAdminView(nextViewMode) {
        adminViewMode = nextViewMode;
        localStorage.setItem('shotpc_admin_view', adminViewMode);
    }

    function updateAdminTitle() {
        if (!siteTitleLink) return;
        siteTitleLink.textContent = isAdminAuthenticated && isAdminVisiblePage() ? 'ShotPC(admin mode)' : 'ShotPC';
    }

    function getDisplayBrandName(brand) {
        return brand === 'Unknown' ? 'その他' : brand;
    }

    function renderFilterOptions() {
        renderBrandFilters();
        renderCpuFilters();
        renderRamFilters();
    }

    function renderBrandFilters() {
        if (!brandFilterList) return;

        const counts = new Map();
        allMinis.forEach(pc => {
            const brand = pc.brand || 'Unknown';
            counts.set(brand, (counts.get(brand) || 0) + 1);
        });

        const brands = Array.from(counts.entries()).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return getDisplayBrandName(a[0]).localeCompare(getDisplayBrandName(b[0]), 'ja');
        });

        brandFilterList.innerHTML = brands.map(([brand, count]) => `
            <label>
                <input type="checkbox" name="brand" value="${brand}">
                ${getDisplayBrandName(brand)}
                <span class="filter-option-meta">(${count})</span>
            </label>
        `).join('');
    }

    function renderCpuFilters() {
        if (!cpuFilterList) return;

        const cpuOptions = [
            { value: 'ryzen_ai', label: 'Ryzen AI', match: cpuName => cpuName.includes('ryzen ai') },
            { value: 'ryzen9', label: 'Ryzen 9', match: cpuName => cpuName.includes('ryzen 9') },
            { value: 'ryzen7', label: 'Ryzen 7', match: cpuName => cpuName.includes('ryzen 7') },
            { value: 'ryzen5', label: 'Ryzen 5', match: cpuName => cpuName.includes('ryzen 5') },
            { value: 'core_ultra', label: 'Core Ultra', match: cpuName => cpuName.includes('core ultra') },
            { value: 'core_i9', label: 'Core i9', match: cpuName => cpuName.includes('core i9') },
            { value: 'core_i7', label: 'Core i7', match: cpuName => cpuName.includes('core i7') },
            { value: 'core_i5', label: 'Core i5', match: cpuName => cpuName.includes('core i5') },
            { value: 'intel_n', label: 'Intel N', match: cpuName => /\bn\d{3}\b/.test(cpuName) },
        ];

        const activeOptions = cpuOptions
            .map(option => ({
                ...option,
                count: allMinis.filter(pc => option.match((pc.cpu?.name || '').toLowerCase())).length,
            }))
            .filter(option => option.count > 0);

        cpuFilterList.innerHTML = activeOptions.map(option => `
            <label>
                <input type="checkbox" name="cpu" value="${option.value}">
                ${option.label}
                <span class="filter-option-meta">(${option.count})</span>
            </label>
        `).join('');
    }

    function renderRamFilters() {
        if (!ramFilterList) return;

        const ramOptions = [
            { value: '8', label: '8GB以上', min: 8 },
            { value: '16', label: '16GB以上', min: 16 },
            { value: '24', label: '24GB以上', min: 24 },
            { value: '32', label: '32GB以上', min: 32 },
            { value: '64', label: '64GB以上', min: 64 },
            { value: '128', label: '128GB以上', min: 128 },
        ];

        const activeOptions = ramOptions
            .map(option => ({
                ...option,
                count: allMinis.filter(pc => Number(pc.ram?.capacity_gb || 0) >= option.min).length,
            }))
            .filter(option => option.count > 0);

        ramFilterList.innerHTML = activeOptions.map(option => `
            <label>
                <input type="checkbox" name="ram" value="${option.value}">
                ${option.label}
                <span class="filter-option-meta">(${option.count})</span>
            </label>
        `).join('');
    }

    function updateAdminUi() {
        updateAdminTitle();

        const controls = document.getElementById('admin-view-toggle');
        const status = document.getElementById('admin-view-status');
        const btnUser = document.getElementById('admin-view-user');
        const btnAdmin = document.getElementById('admin-view-admin');
        const navLink = document.getElementById('admin-page-switch-link');

        if (controls) {
            controls.hidden = !isAdminAuthenticated;
        }
        if (navLink) {
            navLink.hidden = !isAdminAuthenticated;
        }
        if (status) {
            status.textContent = `${UI_TEXT.currentView}${isAdminViewEnabled() ? UI_TEXT.adminView : UI_TEXT.userView}\u3067\u3059`;
        }
        if (btnUser) btnUser.disabled = !isAdminAuthenticated || adminViewMode === 'user';
        if (btnAdmin) btnAdmin.disabled = !isAdminAuthenticated || adminViewMode === 'admin';
    }

    function enableAdminSession(options = {}) {
        const { requirePassword = false } = options;

        if (isAdminAuthenticated) {
            persistAdminView('admin');
            updateAdminUi();
            location.reload();
            return;
        }

        if (requirePassword) {
            const pass = prompt(UI_TEXT.enterPassword);
            if (pass === null) return;
            if (pass !== 'admin') {
                alert(UI_TEXT.wrongPassword);
                return;
            }
        }

        persistAdminSession(true);
        persistAdminView('admin');
        alert(UI_TEXT.adminSessionOn);
        updateAdminUi();
        location.reload();
    }

    function disableAdminSession() {
        if (!isAdminAuthenticated) {
            updateAdminUi();
            return;
        }
        persistAdminSession(false);
        alert(UI_TEXT.adminSessionOff);
        updateAdminUi();
        location.reload();
    }

    function setAdminViewMode(nextViewMode) {
        if (!isAdminAuthenticated || adminViewMode === nextViewMode) {
            updateAdminUi();
            return;
        }
        persistAdminView(nextViewMode);
        updateAdminUi();
        location.reload();
    }

    function initAdminControls() {
        if (!headerContainer || !isAdminVisiblePage() || document.getElementById('admin-view-toggle')) return;
        if (!isAdminAuthenticated) return;
        const adminPageLinks = [
            { href: '/shotpc/ja/compare/', label: 'old' },
            { href: '/shotpc/ja/catalog/', label: '1へ' },
            { href: '/shotpc/ja/catalog2/', label: '2へ' },
            { href: '/shotpc/ja/catalog3/', label: '3へ' },
            { href: '/shotpc/ja/catalog4/', label: '4へ' },
            { href: '/shotpc/ja/catalog5/', label: '5へ' },
        ];
        const currentPath = window.location.pathname || '/shotpc/';
        const navLinksHtml = adminPageLinks.map(link => {
            const isCurrentPage = currentPath === link.href || currentPath === `${link.href}index.html`;
            const className = isCurrentPage ? 'admin-view-button is-current' : 'admin-view-button';
            const ariaCurrent = isCurrentPage ? ' aria-current="page"' : '';
            return `<a href="${link.href}" class="${className}"${ariaCurrent}>${link.label}</a>`;
        }).join('');

        const controls = document.createElement('div');
        controls.id = 'admin-view-toggle';
        controls.className = 'admin-view-toggle';
        controls.hidden = false;
        controls.innerHTML = `
            <span class="admin-view-status" id="admin-view-status"></span>
            <button type="button" class="admin-view-button" id="admin-view-user">${UI_TEXT.switchUser}</button>
            <button type="button" class="admin-view-button" id="admin-view-admin">${UI_TEXT.switchAdmin}</button>
            ${navLinksHtml}
        `;
        headerContainer.appendChild(controls);

        document.getElementById('admin-view-user')?.addEventListener('click', () => {
            setAdminViewMode('user');
        });
        document.getElementById('admin-view-admin')?.addEventListener('click', () => {
            if (!isAdminAuthenticated) {
                enableAdminSession({ requirePassword: true });
                return;
            }
            setAdminViewMode('admin');
        });

        updateAdminUi();
    }

    initAdminControls();

    if (footerCopy) {
        let adminClickCount = 0;
        let adminClickTimer = null;

        footerCopy.addEventListener('click', () => {
            adminClickCount += 1;
            clearTimeout(adminClickTimer);
            adminClickTimer = setTimeout(() => {
                adminClickCount = 0;
            }, 2000);

            if (adminClickCount >= 5) {
                if (isAdminAuthenticated) {
                    disableAdminSession();
                } else {
                    enableAdminSession({ requirePassword: true });
                }
                adminClickCount = 0;
            }
        });
    }

    async function loadData() {
        try {
            const pcResponse = await fetch('/shotpc/data/minis.json');
            allMinis = await pcResponse.json();
            renderFilterOptions();
            if (productList) renderProducts(allMinis);

            if (brandList) {
                const brandResponse = await fetch('/shotpc/data/brands.json');
                const brands = await brandResponse.json();
                renderBrands(brands);
            }

            if (articleList) {
                const articleResponse = await fetch('/shotpc/data/articles.json');
                const articles = await articleResponse.json();
                renderArticles(articles);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            if (productList) productList.innerHTML = `<p class="error">${UI_TEXT.loadError}</p>`;
        }
    }

    function renderArticles(articles) {
        if (!articleList) return;
        articleList.innerHTML = articles.map(article => `
            <div class="article-item">
                <a href="${article.url}">${article.title}</a>
            </div>
        `).join('');
    }

    function renderBrands(brands) {
        if (!brandList) return;

        brandList.innerHTML = brands.map(brand => {
            let statusClass = 'status-unknown';
            if ((brand.mini_pc_status || '').includes('\u53d6\u6271\u4e2d')) statusClass = 'status-active';
            if ((brand.mini_pc_status || '').includes('\u306a\u3057')) statusClass = 'status-none';

            return `
                <div class="brand-card">
                    <div class="brand-name">
                        ${brand.name}
                        <span class="brand-country">${brand.country}</span>
                    </div>
                    <div class="brand-status ${statusClass}">${brand.mini_pc_status}</div>
                    <div class="brand-ai-strength">${brand.ai_strength}</div>
                    <p class="brand-desc">${brand.description}</p>
                    <div class="brand-models">
                        ${UI_TEXT.models}: ${brand.typical_models.map(model => `<span>${model}</span>`).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    function getSuitabilityClass(suitability) {
        const value = suitability || UI_TEXT.none;
        if (value.includes('S')) return 'badge-s';
        if (value.includes('A')) return 'badge-a';
        if (value.toLowerCase().includes('entry') || value.includes('\u5165\u9580')) return 'badge-entry';
        return 'badge-standard';
    }

    function renderProducts(minis) {
        if (!productList) return;

        if (minis.length === 0) {
            productList.innerHTML = `<p>${UI_TEXT.noResults}</p>`;
            return;
        }

        productList.innerHTML = minis.map(pc => {
            const suitability = pc.ai_features?.ai_inference_suitability || UI_TEXT.none;
            const suitabilityClass = getSuitabilityClass(suitability);
            const isChecked = selectedIds.has(pc.id);

            return `
                <article class="pc-card" data-id="${pc.id}">
                    <label class="compare-checkbox-label">
                        <input type="checkbox" class="compare-check" data-id="${pc.id}" ${isChecked ? 'checked' : ''}> ${UI_TEXT.compare}
                    </label>
                    <div class="brand-line">
                        <span class="brand">${pc.brand}</span>
                        <span class="stock-badge ${pc.stock}">${pc.stock === 'in_stock' ? UI_TEXT.inStock : UI_TEXT.outOfStock}</span>
                    </div>
                    <h2 class="model">${pc.model}</h2>
                    <div class="ai-badge ${suitabilityClass}">${suitability}</div>

                    <div class="specs-grid">
                        <div class="spec-node full-width">
                            <span class="label">CPU / GPU</span>
                            <span class="value">${pc.cpu.name} (${pc.cpu.cores || '-'}C/${pc.cpu.threads || '-'}T) / ${pc.gpu || '-'}</span>
                        </div>

                        ${isAdminViewEnabled() ? `
                            <div class="spec-node">
                                <span class="label">CPU Benchmark</span>
                                <span class="value">${pc.cpu.benchmark_score || UI_TEXT.unknown}</span>
                            </div>
                            <div class="spec-node">
                                <span class="label">NPU (AI Engine)</span>
                                <span class="value">${pc.ai_features?.npu_tops ? `${pc.ai_features.npu_tops} TOPS` : UI_TEXT.none}</span>
                            </div>
                        ` : ''}

                        <div class="spec-node">
                            <span class="label">RAM</span>
                            <span class="value">${pc.ram.capacity_gb}GB (${pc.ram.type || '-'})</span>
                        </div>
                        <div class="spec-node">
                            <span class="label">VRAM</span>
                            <span class="value">${pc.ai_features?.vram_allocation || UI_TEXT.none}</span>
                        </div>

                        ${isAdminViewEnabled() ? `
                            <div class="spec-node">
                                <span class="label">RAM Expandability</span>
                                <span class="value">${pc.ram.slots || '-'} Slot / Max ${pc.ram.max_capacity_gb || '-'}GB</span>
                            </div>
                        ` : ''}

                        <div class="spec-node">
                            <span class="label">Oculink</span>
                            <span class="value">${pc.ai_features?.oculink_support ? UI_TEXT.yes : UI_TEXT.no}</span>
                        </div>
                        <div class="spec-node">
                            <span class="label">Storage</span>
                            <span class="value">${pc.storage.capacity_gb}GB (${pc.storage.slots || '-'} Slot)</span>
                        </div>

                        ${isAdminViewEnabled() ? `
                            <div class="spec-node">
                                <span class="label">USB4 / Thunderbolt</span>
                                <span class="value">${pc.io_ports?.usb4_count ?? UI_TEXT.unknown} Port</span>
                            </div>
                            <div class="spec-node">
                                <span class="label">LAN / Network</span>
                                <span class="value">${pc.io_ports?.lan_speed || UI_TEXT.unknown}</span>
                            </div>
                            <div class="spec-node">
                                <span class="label">Thermal Design</span>
                                <span class="value">${pc.ai_features?.thermal_design || '-'}</span>
                            </div>
                            <div class="spec-node">
                                <span class="label">Size / Weight</span>
                                <span class="value">${pc.physical?.dimensions || '-'} / ${pc.physical?.weight || '-'}</span>
                            </div>
                        ` : ''}
                    </div>

                    ${(isAdminViewEnabled() && pc.notes) ? `
                        <div class="pc-notes">
                            <span class="label">${UI_TEXT.notes}</span> ${pc.notes}
                        </div>
                    ` : ''}

                    <div class="price-box">
                        ${pc.coupon_jpy > 0 ? `<div class="original-price">\u00a5${pc.price_jpy.toLocaleString()}</div>` : ''}
                        <div class="effective-price">
                            <span class="currency">\u00a5</span>${pc.effective_price_jpy.toLocaleString()}
                            ${pc.coupon_jpy > 0 ? `<span class="price-note">${UI_TEXT.couponApplied}</span>` : ''}
                        </div>
                    </div>

                    <a href="${pc.amazon_url}" target="_blank" class="btn-amazon">${UI_TEXT.viewOnAmazon}</a>
                </article>
            `;
        }).join('');

        document.querySelectorAll('.compare-check').forEach(checkbox => {
            checkbox.addEventListener('change', event => {
                const { id } = event.target.dataset;
                if (event.target.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateCompareBar();
            });
        });
    }

    function updateCompareBar() {
        if (!compareBar || !compareCount) return;

        compareCount.textContent = String(selectedIds.size);
        compareBar.classList.toggle('active', selectedIds.size > 0);
    }

    if (btnCompareOpen) {
        btnCompareOpen.addEventListener('click', () => {
            const selectedMinis = allMinis.filter(pc => selectedIds.has(pc.id));
            renderCompareTable(selectedMinis);
            compareModal?.classList.add('active');
        });
    }

    if (btnCompareClose) {
        btnCompareClose.addEventListener('click', () => {
            compareModal?.classList.remove('active');
        });
    }

    function renderCompareTable(minis) {
        if (!compareTableBody) return;

        const rows = [
            { label: UI_TEXT.rows.model, field: pc => `<div class="pc-name">${pc.brand}<br>${pc.model}</div>` },
            { label: UI_TEXT.rows.price, field: pc => `<div class="pc-price">\u00a5${pc.effective_price_jpy.toLocaleString()}</div>` },
            { label: UI_TEXT.rows.aiSuitability, field: pc => pc.ai_features?.ai_inference_suitability || UI_TEXT.none },
            { label: UI_TEXT.rows.cpu, field: pc => pc.cpu.name },
            { label: UI_TEXT.rows.ram, field: pc => `${pc.ram.capacity_gb}GB (${pc.ram.type || '-'})` },
            { label: UI_TEXT.rows.vram, field: pc => pc.ai_features?.vram_allocation || UI_TEXT.none },
            { label: UI_TEXT.rows.oculink, field: pc => pc.ai_features?.oculink_support ? UI_TEXT.yes : UI_TEXT.no },
            { label: UI_TEXT.rows.storage, field: pc => `${pc.storage.capacity_gb}GB` },
            { label: UI_TEXT.rows.thermal, field: pc => pc.ai_features?.thermal_design || '-' },
            { label: UI_TEXT.rows.amazon, field: pc => `<a href="${pc.amazon_url}" target="_blank" class="btn-amazon" style="margin-top:0; padding:0.5rem;">Amazon</a>` }
        ];

        compareTableBody.innerHTML = rows.map(row => `
            <tr>
                <th>${row.label}</th>
                ${minis.map(pc => `<td>${row.field(pc)}</td>`).join('')}
            </tr>
        `).join('');
    }

    function applyFilters() {
        const selectedCpus = Array.from(document.querySelectorAll('input[name="cpu"]:checked')).map(el => el.value);
        const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(el => el.value);
        const selectedRams = Array.from(document.querySelectorAll('input[name="ram"]:checked')).map(el => el.value);
        const selectedAiFeatures = Array.from(document.querySelectorAll('input[name="ai"]:checked')).map(el => el.value);
        const stockCheckbox = document.querySelector('input[name="stock"]');
        const onlyInStock = stockCheckbox ? stockCheckbox.checked : false;

        const filtered = allMinis.filter(pc => {
            const cpuName = pc.cpu?.name?.toLowerCase() || '';
            const cpuMatchers = {
                ryzen_ai: name => name.includes('ryzen ai'),
                ryzen9: name => name.includes('ryzen 9'),
                ryzen7: name => name.includes('ryzen 7'),
                ryzen5: name => name.includes('ryzen 5'),
                core_ultra: name => name.includes('core ultra'),
                core_i9: name => name.includes('core i9'),
                core_i7: name => name.includes('core i7'),
                core_i5: name => name.includes('core i5'),
                intel_n: name => /\bn\d{3}\b/.test(name),
            };
            const cpuMatch = selectedCpus.length === 0 || selectedCpus.some(value => cpuMatchers[value]?.(cpuName));
            const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(pc.brand || 'Unknown');

            const ramCapacity = Number(pc.ram?.capacity_gb || 0);
            const maxRam = Number(pc.ram?.max_capacity_gb || 0);
            const ramMatch = selectedRams.length === 0 || selectedRams.some(value => ramCapacity >= Number(value));

            const stockMatch = !onlyInStock || pc.stock === 'in_stock';

            const aiMatch = selectedAiFeatures.length === 0 || selectedAiFeatures.every(value => {
                if (value === 'vram16') {
                    return (pc.ai_features?.vram_allocation || '').includes('16GB');
                }
                if (value === 'oculink') {
                    return pc.ai_features?.oculink_support === true;
                }
                if (value === 'ram64') {
                    return ramCapacity >= 64 || maxRam >= 64;
                }
                return true;
            });

            return brandMatch && cpuMatch && ramMatch && stockMatch && aiMatch;
        });

        renderProducts(filtered);
    }

    sidebar?.addEventListener('change', event => {
        if (event.target instanceof HTMLInputElement) {
            applyFilters();
        }
    });

    loadData();
});
