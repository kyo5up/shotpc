document.addEventListener('DOMContentLoaded', () => {
    let allMinis = [];
    const productList = document.getElementById('product-list');
    const brandList = document.getElementById('brand-list');
    const articleList = document.getElementById('article-list');
    const filters = document.querySelectorAll('#sidebar input');

    // データ読み込み
    async function loadData() {
        try {
            // ミニPCデータの読み込み (ルート相対パスに変更)
            const pcResponse = await fetch(\'/shotpc/data/minis.json');
            allMinis = await pcResponse.json();
            renderProducts(allMinis);

            // メーカーデータの読み込み (ルート相対パスに変更)
            const brandResponse = await fetch(\'/shotpc/data/brands.json');
            const brands = await brandResponse.json();
            renderBrands(brands);

            // 記事データの読み込み
            const articleResponse = await fetch(\'/shotpc/data/articles.json');
            const articles = await articleResponse.json();
            renderArticles(articles);
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            if (productList) productList.innerHTML = '<p class="error">データの読み込みに失敗しました。</p>';
        }
    }

    // 記事一覧の描画
    function renderArticles(articles) {
        if (!articleList) return;
        articleList.innerHTML = articles.map(article => `
            <div class="article-item">
                <a href="${article.url}">${article.title}</a>
            </div>
        `).join('');
    }

    // メーカー一覧の描画
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

    // 商品一覧の描画
    function renderProducts(minis) {
        if (minis.length === 0) {
            productList.innerHTML = '<p>条件に一致するミニPCが見つかりませんでした。</p>';
            return;
        }

        productList.innerHTML = minis.map(pc => `
            <article class="pc-card">
                <div class="brand">${pc.brand}</div>
                <h2 class="model">${pc.model}</h2>
                <div class="ai-badge">${pc.ai_features.ai_inference_suitability}</div>
                
                <div class="specs">
                    <div class="spec-item">
                        <span class="spec-label">CPU</span>
                        <span class="spec-value">${pc.cpu.name}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">RAM</span>
                        <span class="spec-value">${pc.ram.capacity_gb}GB (${pc.ram.type})</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Storage</span>
                        <span class="spec-value">${pc.storage.capacity_gb}GB NVMe</span>
                    </div>
                </div>

                <div class="stock-status ${pc.stock}">
                    ${pc.stock === 'in_stock' ? '● 在庫あり' : '× 在庫切れ'}
                </div>

                <div class="price-box">
                    ${pc.coupon_jpy > 0 ? `<div class="original-price">¥${pc.price_jpy.toLocaleString()}</div>` : ''}
                    <div class="effective-price">¥${pc.effective_price_jpy.toLocaleString()}</div>
                </div>

                <a href="${pc.amazon_url}" target="_blank" class="btn-amazon">Amazonで詳細を見る</a>
            </article>
        `).join('');
    }

    // フィルタリング処理
    function applyFilters() {
        const selectedCpus = Array.from(document.querySelectorAll('input[name="cpu"]:checked')).map(el => el.value);
        const selectedRams = Array.from(document.querySelectorAll('input[name="ram"]:checked')).map(el => el.value);
        const onlyInStock = document.querySelector('input[name="stock"]').checked;

        const filtered = allMinis.filter(pc => {
            // CPUフィルタ
            const cpuMatch = selectedCpus.length === 0 || selectedCpus.some(val => 
                pc.cpu.name.toLowerCase().includes(val.toLowerCase())
            );

            // RAMフィルタ
            const ramMatch = selectedRams.length === 0 || selectedRams.some(val => 
                pc.ram.capacity_gb >= parseInt(val)
            );

            // 在庫フィルタ
            const stockMatch = !onlyInStock || pc.stock === 'in_stock';

            return cpuMatch && ramMatch && stockMatch;
        });

        renderProducts(filtered);
    }

    // イベントリスナーの登録
    filters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    // 初期読み込み実行
    loadData();
});
