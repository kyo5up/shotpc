document.addEventListener('DOMContentLoaded', () => {
    let allMinis = [];
    let selectedIds = new Set();
    const productList = document.getElementById('product-list');
    const brandList = document.getElementById('brand-list');
    const articleList = document.getElementById('article-list');
    const filters = document.querySelectorAll('#sidebar input');
    
    // 比較用DOM
    const compareBar = document.getElementById('compare-bar');
    const compareCount = document.getElementById('compare-count');
    const btnCompareOpen = document.getElementById('btn-compare-open');
    const btnCompareClose = document.getElementById('btn-compare-close');
    const compareModal = document.getElementById('compare-modal');
    const compareTableBody = document.getElementById('compare-table-body');
    const siteTitleLink = document.querySelector('header h1 a');

    // Admin状態の管理 (localStorageに保存)
    let isAdmin = localStorage.getItem('shotpc_admin') === 'true';

    // Admin中は対象ページのタイトルを明示表示
    function updateAdminTitle() {
        if (!siteTitleLink) return;
        const path = window.location.pathname || '/';
        const isTopPage = path === '/' || path.endsWith('/index.html') || path.endsWith('/shotpc/');
        const isComparePage = path.includes('/ja/compare/');
        if (isAdmin && (isTopPage || isComparePage)) {
            siteTitleLink.textContent = 'ShotPC(admin mode)';
        } else {
            siteTitleLink.textContent = 'ShotPC';
        }
    }
    updateAdminTitle();
    
    // 隠しコマンド (フッターのコピーライト5連打でAdmin切替)
    const footerCopy = document.querySelector('footer p');
    if (footerCopy) {
        let adminClickCount = 0;
        let adminClickTimer = null;
        footerCopy.addEventListener('click', () => {
            adminClickCount++;
            clearTimeout(adminClickTimer);
            adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 2000);

            if (adminClickCount >= 5) {
                const pass = prompt('管理者パスワードを入力してください:');
                if (pass === 'admin') {
                    isAdmin = !isAdmin;
                    localStorage.setItem('shotpc_admin', isAdmin);
                    alert(`Admin Mode: ${isAdmin ? 'ON (Full Data)' : 'OFF (Standard)'}`);
                    location.reload();
                } else if (pass !== null) {
                    alert('パスワードが違います。');
                }
                adminClickCount = 0;
            }
        });
    }

    // データ読み込み
    async function loadData() {
        try {
            const pcResponse = await fetch('/shotpc/data/minis.json');
            allMinis = await pcResponse.json();
            if (productList) renderProducts(allMinis);

            const brandResponse = await fetch('/shotpc/data/brands.json');
            const brands = await brandResponse.json();
            if (brandList) renderBrands(brands);

            const articleResponse = await fetch('/shotpc/data/articles.json');
            const articles = await articleResponse.json();
            if (articleList) renderArticles(articles);
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            if (productList) productList.innerHTML = '<p class="error">データの読み込みに失敗しました。</p>';
        }
    }

    // 記事一覧
    function renderArticles(articles) {
        if (!articleList) return;
        articleList.innerHTML = articles.map(article => `
            <div class="article-item">
                <a href="${article.url}">${article.title}</a>
            </div>
        `).join('');
    }

    // メーカー一覧
    function renderBrands(brands) {
        if (!brandList) return;
        brandList.innerHTML = brands.map(brand => {
            let statusClass = 'status-unknown';
            if (brand.mini_pc_status.includes('製造中')) statusClass = 'status-active';
            if (brand.mini_pc_status.includes('なし')) statusClass = 'status-none';

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
                        代表モデル: ${brand.typical_models.map(m => `<span>${m}</span>`).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 商品一覧
    function renderProducts(minis) {
        if (minis.length === 0) {
            productList.innerHTML = '<p>条件に一致するミニPCが見つかりませんでした。</p>';
            return;
        }

        productList.innerHTML = minis.map(pc => {
            let suitabilityClass = 'badge-standard';
            const suitability = pc.ai_features.ai_inference_suitability || '不明';
            if (suitability.includes('Sクラス') || suitability.includes('非常に高い')) suitabilityClass = 'badge-s';
            else if (suitability.includes('Aクラス') || suitability.includes('高い')) suitabilityClass = 'badge-a';
            else if (suitability.includes('エントリー') || suitability.includes('入門')) suitabilityClass = 'badge-entry';

            const isChecked = selectedIds.has(pc.id);

            return `
            <article class="pc-card" data-id="${pc.id}">
                <label class="compare-checkbox-label">
                    <input type="checkbox" class="compare-check" data-id="${pc.id}" ${isChecked ? 'checked' : ''}> 比較
                </label>
                <div class="brand-line">
                    <span class="brand">${pc.brand}</span>
                    <span class="stock-badge ${pc.stock}">${pc.stock === 'in_stock' ? '● 在庫あり' : '× 在庫切れ'}</span>
                </div>
                <h2 class="model">${pc.model}</h2>
                <div class="ai-badge ${suitabilityClass}">${suitability}</div>
                
                <div class="specs-grid">
                    <div class="spec-node full-width">
                        <span class="label">CPU / GPU</span>
                        <span class="value">${pc.cpu.name} (${pc.cpu.cores || '-'}C/${pc.cpu.threads || '-'}T) / ${pc.gpu || '-'}</span>
                    </div>

                    ${isAdmin ? `
                    <div class="spec-node">
                        <span class="label">CPU Benchmark</span>
                        <span class="value">${pc.cpu.benchmark_score || '未計測'}</span>
                    </div>
                    <div class="spec-node">
                        <span class="label">NPU (AI Engine)</span>
                        <span class="value">${pc.ai_features.npu_tops ? pc.ai_features.npu_tops + ' TOPS' : '非搭載 / 不明'}</span>
                    </div>
                    ` : ''}

                    <div class="spec-node">
                        <span class="label">RAM</span>
                        <span class="value">${pc.ram.capacity_gb}GB (${pc.ram.type || '-'})</span>
                    </div>
                    <div class="spec-node">
                        <span class="label">VRAM設定</span>
                        <span class="value">${pc.ai_features.vram_allocation || '不明'}</span>
                    </div>

                    ${isAdmin ? `
                    <div class="spec-node">
                        <span class="label">RAM 拡張性</span>
                        <span class="value">${pc.ram.slots || '-'} Slot / Max ${pc.ram.max_capacity_gb || '-'}GB</span>
                    </div>
                    ` : ''}

                    <div class="spec-node">
                        <span class="label">Oculink</span>
                        <span class="value">${pc.ai_features.oculink_support ? '✅ 対応' : 'ー'}</span>
                    </div>
                    <div class="spec-node">
                        <span class="label">Storage</span>
                        <span class="value">${pc.storage.capacity_gb}GB (${pc.storage.slots || '-'} Slot)</span>
                    </div>

                    ${isAdmin ? `
                    <div class="spec-node">
                        <span class="label">USB4 / Thunderbolt</span>
                        <span class="value">${pc.io_ports?.usb4_count || '未調査'} Port</span>
                    </div>
                    <div class="spec-node">
                        <span class="label">LAN / Network</span>
                        <span class="value">${pc.io_ports?.lan_speed || '未調査'}</span>
                    </div>
                    <div class="spec-node">
                        <span class="label">冷却 / 構造</span>
                        <span class="value">${pc.ai_features.thermal_design || '-'}</span>
                    </div>
                    <div class="spec-node">
                        <span class="label">サイズ / 重量</span>
                        <span class="value">${pc.physical?.dimensions || '-'} / ${pc.physical?.weight || '-'}</span>
                    </div>
                    ` : ''}
                </div>

                ${(isAdmin && pc.notes) ? `
                <div class="pc-notes">
                    <span class="label">備考:</span> ${pc.notes}
                </div>
                ` : ''}

                <div class="price-box">
                    ${pc.coupon_jpy > 0 ? `<div class="original-price">¥${pc.price_jpy.toLocaleString()}</div>` : ''}
                    <div class="effective-price">
                        <span class="currency">¥</span>${pc.effective_price_jpy.toLocaleString()}
                        ${pc.coupon_jpy > 0 ? '<span class="price-note">（クーポン適用後）</span>' : ''}
                    </div>
                </div>

                <a href="${pc.amazon_url}" target="_blank" class="btn-amazon">Amazonで詳細を見る</a>
            </article>
            `;
        }).join('');

        // チェックボックスのイベント
        document.querySelectorAll('.compare-check').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                if (e.target.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateCompareBar();
            });
        });
    }

    // 比較バーの更新
    function updateCompareBar() {
        if (!compareBar) return;
        const count = selectedIds.size;
        compareCount.textContent = count;
        if (count > 0) {
            compareBar.classList.add('active');
        } else {
            compareBar.classList.remove('active');
        }
    }

    // 比較モーダルを開く
    if (btnCompareOpen) {
        btnCompareOpen.addEventListener('click', () => {
            const selectedMinis = allMinis.filter(pc => selectedIds.has(pc.id));
            renderCompareTable(selectedMinis);
            compareModal.classList.add('active');
        });
    }

    // 比較モーダルを閉じる
    if (btnCompareClose) {
        btnCompareClose.addEventListener('click', () => {
            compareModal.classList.remove('active');
        });
    }

    // 比較テーブルの描画
    function renderCompareTable(minis) {
        if (!compareTableBody) return;
        
        const rows = [
            { label: 'モデル', field: (pc) => `<div class="pc-name">${pc.brand}<br>${pc.model}</div>` },
            { label: '価格', field: (pc) => `<div class="pc-price">¥${pc.effective_price_jpy.toLocaleString()}</div>` },
            { label: 'AI適合度', field: (pc) => pc.ai_features.ai_inference_suitability },
            { label: 'CPU', field: (pc) => pc.cpu.name },
            { label: 'RAM', field: (pc) => `${pc.ram.capacity_gb}GB (${pc.ram.type || '-'})` },
            { label: 'VRAM割り当て', field: (pc) => pc.ai_features.vram_allocation || '不明' },
            { label: 'Oculink', field: (pc) => pc.ai_features.oculink_support ? '✅ 対応' : 'ー' },
            { label: 'Storage', field: (pc) => `${pc.storage.capacity_gb}GB` },
            { label: '冷却構造', field: (pc) => pc.ai_features.thermal_design || '-' },
            { label: 'Amazon', field: (pc) => `<a href="${pc.amazon_url}" target="_blank" class="btn-amazon" style="margin-top:0; padding:0.5rem;">Amazon</a>` }
        ];

        compareTableBody.innerHTML = rows.map(row => `
            <tr>
                <th>${row.label}</th>
                ${minis.map(pc => `<td>${row.field(pc)}</td>`).join('')}
            </tr>
        `).join('');
    }

    // フィルタリング処理
    function applyFilters() {
        const selectedCpus = Array.from(document.querySelectorAll('input[name="cpu"]:checked')).map(el => el.value);
        const selectedRams = Array.from(document.querySelectorAll('input[name="ram"]:checked')).map(el => el.value);
        const selectedAiFeatures = Array.from(document.querySelectorAll('input[name="ai"]:checked')).map(el => el.value);
        const onlyInStock = document.querySelector('input[name="stock"]').checked;

        const filtered = allMinis.filter(pc => {
            const cpuMatch = selectedCpus.length === 0 || selectedCpus.some(val => 
                pc.cpu.name.toLowerCase().includes(val.toLowerCase())
            );
            const ramMatch = selectedRams.length === 0 || selectedRams.some(val => 
                pc.ram.capacity_gb >= parseInt(val)
            );
            const stockMatch = !onlyInStock || pc.stock === 'in_stock';
            const aiMatch = selectedAiFeatures.length === 0 || selectedAiFeatures.every(val => {
                if (val === 'vram16') return pc.ai_features.vram_allocation && pc.ai_features.vram_allocation.includes('16GB');
                if (val === 'oculink') return pc.ai_features.oculink_support === true;
                if (val === 'ram64') {
                    const currentRam = pc.ram.capacity_gb || 0;
                    const maxRam = pc.ram.max_capacity_gb || 0;
                    return currentRam >= 64 || maxRam >= 64 || (typeof maxRam === 'string' && parseInt(maxRam) >= 64);
                }
                return true;
            });
            return cpuMatch && ramMatch && stockMatch && aiMatch;
        });

        renderProducts(filtered);
    }

    // イベントリスナー
    filters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    loadData();
});
