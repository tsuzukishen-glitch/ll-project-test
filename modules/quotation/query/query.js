// 查詢中心 - 歷史價格查詢模組
// 對應側邊欄「查詢與管理 > 查詢中心」
//
// ★★★ 架構調整說明 ★★★
// 業主確認實際歷史報價資料量體「比 20 萬筆更多」，比照成本代碼設定/材料編號設定
// 的做法：前端不整批載入、不整批過濾，查詢/排序/換頁都設計成「重新查詢一次」，
// 模擬串接後端 API 的行為。原本的版本是把全部（mock）資料塞進陣列前端自己處理，
// 已經不適用，這裡整個重寫。
//
// ★ TODO(後端整合)：fetchPriceHistory() 用約 20 筆 mock 資料模擬「伺服器查詢」，
//   內部實作換成真正 API 呼叫即可，呼叫端參數格式已經照真正 API 會需要的樣子設計。
//   建議與 detail.js 的 showHistory()、template-editor.js 的歷史單價查詢共用同一支
//   後端「歷史單價查詢」API，不要三個地方各自模擬（目前三邊各自維護一份 mock，
//   已經出現類別標籤「共通材料」vs「共通耗材」對不起來的落差，就是分散維護的代價）。
// ★ 業主/客戶/廠商/類別的篩選選項清單，假設後端會提供對應的「distinct 值」查詢
//   （這類清單本身筆數不大，不是那張巨量歷史紀錄表本身），所以這裡維持前端小範圍
//   處理，跟成本代碼設定裡「產品代碼/成本歸屬代碼」選項的處理方式一致。
const PriceHistoryQuery = (function() {
    'use strict';

    // ============================================================
    // 1. 模擬資料 (Mock Data) —— 僅為展示用，代表後端巨量資料的一小部分樣本
    // ★ 資料結構設計原則：
    //   - 與 detail.js / budget.js 共用同一組 matNo 命名
    //   - costPrice（成本單價）與 quotePrice（報價單價）分開兩欄，避免混淆估算成本層與議價後報價層
    //   - 類別標籤統一為「共通耗材」（先前誤用「共通材料」，跟估算工作台/範本編輯器的
    //     標準類別清單對不起來，這次已修正）
    // ============================================================
    const mockPriceHistory = [
        // --- 鋼板(9t) SS400 ---
        { id: 'H001', matNo: 'M101-STOQ', name: '鋼板(9t)', spec: 'SS400', category: '專案材料', unit: 'kg', owner: '台灣積體電路', customer: '互助營造', vendorName: '春源鋼鐵', costPrice: 35, quotePrice: 42, projectNo: '', quotationId: 'LME-11210-PE060', projectName: '台積電12廠潔淨室建置工程', date: '2025-09-05' },
        { id: 'H002', matNo: 'M101-STOQ', name: '鋼板(9t)', spec: 'SS400', category: '專案材料', unit: 'kg', owner: '聯華電子', customer: '聯電竹科廠', vendorName: '春源鋼鐵', costPrice: 33, quotePrice: 39, projectNo: '', quotationId: 'LME-11210-PD201', projectName: '聯電8廠產線自動化升級工程', date: '2025-07-18' },
        { id: 'H003', matNo: 'M101-STOQ', name: '鋼板(9t)', spec: 'SS400', category: '專案材料', unit: 'kg', owner: '日月光投控', customer: '日月光高雄廠', vendorName: '大成鋼', costPrice: 36, quotePrice: 43, projectNo: '', quotationId: 'LME-11211-AA001', projectName: '日月光K7廠廢水處理擴建工程', date: '2025-10-22' },

        // --- 法蘭 20K SUS304 ---
        { id: 'H004', matNo: 'M101-FLG', name: '法蘭 20K', spec: 'SUS304', category: '專案材料', unit: 'pcs', owner: '台灣積體電路', customer: '互助營造', vendorName: '捷流', costPrice: 1200, quotePrice: 1450, projectNo: '', quotationId: 'LME-11210-PE060', projectName: '台積電12廠潔淨室建置工程', date: '2025-09-05' },
        { id: 'H005', matNo: 'M101-FLG', name: '法蘭 20K', spec: 'SUS304', category: '專案材料', unit: 'pcs', owner: '華邦電子', customer: '華邦電高雄廠', vendorName: '捷流', costPrice: 1260, quotePrice: 1510, projectNo: 'P2510001', quotationId: 'LME-11211-DD004', projectName: '華邦電高雄廠特氣供應系統', date: '2025-10-15' },

        // --- H型鋼 ---
        { id: 'H006', matNo: 'S-100', name: 'H型鋼', spec: '型鋼製品', category: '專案材料', unit: 'TON', owner: '鴻海精密', customer: '鴻海土城廠', vendorName: '中鋼構', costPrice: 45000, quotePrice: 52000, projectNo: 'P2509001', quotationId: 'LME-11210-PC020', projectName: '鴻海土城廠智慧工廠MES系統', date: '2025-09-10' },
        { id: 'H007', matNo: 'S-100', name: 'H型鋼', spec: '型鋼製品', category: '專案材料', unit: 'TON', owner: '中國鋼鐵', customer: '中鋼高雄廠', vendorName: '中鋼構', costPrice: 43500, quotePrice: 50000, projectNo: 'P2509002', quotationId: 'LME-11210-ZZ099', projectName: '中鋼高雄廠煉鋼爐設備維護保養', date: '2025-08-05' },
        { id: 'H008', matNo: 'S-100', name: 'H型鋼', spec: '型鋼製品', category: '專案材料', unit: 'TON', owner: '力積電', customer: '力積電竹科廠', vendorName: '中鋼構', costPrice: 46200, quotePrice: 53500, projectNo: 'P2510002', quotationId: 'LME-11211-EE005', projectName: '力積電P1/P2廠電力系統改善', date: '2025-10-20' },

        // --- 碳鋼鋼板 ASTM A36 ---
        { id: 'H009', matNo: 'S-200', name: '碳鋼鋼板', spec: 'ASTM A36', category: '專案材料', unit: 'TON', owner: '聯華電子', customer: '聯電竹科廠', vendorName: '大成鋼', costPrice: 32000, quotePrice: 37500, projectNo: '', quotationId: 'LME-11210-PD201', projectName: '聯電8廠產線自動化升級工程', date: '2025-07-18' },
        { id: 'H010', matNo: 'S-200', name: '碳鋼鋼板', spec: 'ASTM A36', category: '專案材料', unit: 'TON', owner: '廣達電腦', customer: '廣達龜山廠', vendorName: '大成鋼', costPrice: 33200, quotePrice: 38800, projectNo: '', quotationId: 'LME-11210-EI060', projectName: '廣達龜山廠伺服器機房冷卻系統', date: '2025-11-01' },

        // --- PIPE 無縫鋼管 ---
        { id: 'H011', matNo: 'P-150', name: 'PIPE 無縫鋼管', spec: '-', category: '共通耗材', unit: 'M', owner: '台灣積體電路', customer: '互助營造', vendorName: '大成鋼', costPrice: 1200, quotePrice: 1380, projectNo: '', quotationId: 'LME-11210-PE060', projectName: '台積電12廠潔淨室建置工程', date: '2025-09-05' },
        { id: 'H012', matNo: 'P-150', name: 'PIPE 無縫鋼管', spec: '-', category: '共通耗材', unit: 'M', owner: '日月光投控', customer: '日月光高雄廠', vendorName: '捷流', costPrice: 1250, quotePrice: 1430, projectNo: '', quotationId: 'LME-11211-AA001', projectName: '日月光K7廠廢水處理擴建工程', date: '2025-10-22' },

        // --- 銲條 (E7016) ---
        { id: 'H013', matNo: 'C-WELD-01', name: '銲條', spec: 'E7016', category: '共通耗材', unit: 'KG', owner: '鴻海精密', customer: '鴻海土城廠', vendorName: '信宏', costPrice: 85, quotePrice: 98, projectNo: 'P2509001', quotationId: 'LME-11210-PC020', projectName: '鴻海土城廠智慧工廠MES系統', date: '2025-09-10' },
        { id: 'H014', matNo: 'C-WELD-01', name: '銲條', spec: 'E7016', category: '共通耗材', unit: 'KG', owner: '力積電', customer: '力積電竹科廠', vendorName: '信宏', costPrice: 88, quotePrice: 101, projectNo: 'P2510002', quotationId: 'LME-11211-EE005', projectName: '力積電P1/P2廠電力系統改善', date: '2025-10-20' },

        // --- 冷作工 ---
        { id: 'H015', matNo: 'LAB-201', name: '冷作工', spec: '-', category: '專案製造', unit: '工', owner: '台灣積體電路', customer: '互助營造', vendorName: '-', costPrice: 3800, quotePrice: 4300, projectNo: '', quotationId: 'LME-11210-PE060', projectName: '台積電12廠潔淨室建置工程', date: '2025-09-05' },
        { id: 'H016', matNo: 'LAB-201', name: '冷作工', spec: '-', category: '專案製造', unit: '工', owner: '中國鋼鐵', customer: '中鋼高雄廠', vendorName: '-', costPrice: 3650, quotePrice: 4150, projectNo: 'P2509002', quotationId: 'LME-11210-ZZ099', projectName: '中鋼高雄廠煉鋼爐設備維護保養', date: '2025-08-05' },

        // --- 現場電銲工 ---
        { id: 'H017', matNo: 'LAB-202b', name: '現場電銲工', spec: '-', category: '專案製造', unit: '工', owner: '聯華電子', customer: '聯電竹科廠', vendorName: '-', costPrice: 3200, quotePrice: 3650, projectNo: '', quotationId: 'LME-11210-PD201', projectName: '聯電8廠產線自動化升級工程', date: '2025-07-18' },
        { id: 'H018', matNo: 'LAB-202b', name: '現場電銲工', spec: '-', category: '專案製造', unit: '工', owner: '華邦電子', customer: '華邦電高雄廠', vendorName: '-', costPrice: 3300, quotePrice: 3750, projectNo: 'P2510001', quotationId: 'LME-11211-DD004', projectName: '華邦電高雄廠特氣供應系統', date: '2025-10-15' },

        // --- 捲圓加工 ---
        { id: 'H019', matNo: 'MFG-P01', name: '捲圓加工', spec: '-', category: '專案外包加工', unit: 'M2', owner: '廣達電腦', customer: '廣達龜山廠', vendorName: '宏達', costPrice: 850, quotePrice: 980, projectNo: '', quotationId: 'LME-11210-EI060', projectName: '廣達龜山廠伺服器機房冷卻系統', date: '2025-11-01' },
        { id: 'H020', matNo: 'MFG-P01', name: '捲圓加工', spec: '-', category: '專案外包加工', unit: 'M2', owner: '日月光投控', customer: '日月光高雄廠', vendorName: '盛發', costPrice: 820, quotePrice: 940, projectNo: '', quotationId: 'LME-11211-AA001', projectName: '日月光K7廠廢水處理擴建工程', date: '2025-10-22' },

        // --- 監工費 ---
        { id: 'H021', matNo: 'DIR-301', name: '監工費', spec: '-', category: '專案費用', unit: '月', owner: '鴻海精密', customer: '鴻海土城廠', vendorName: '-', costPrice: 55000, quotePrice: 62000, projectNo: 'P2509001', quotationId: 'LME-11210-PC020', projectName: '鴻海土城廠智慧工廠MES系統', date: '2025-09-10' },
        { id: 'H022', matNo: 'DIR-301', name: '監工費', spec: '-', category: '專案費用', unit: '月', owner: '力積電', customer: '力積電竹科廠', vendorName: '-', costPrice: 58000, quotePrice: 65500, projectNo: 'P2510002', quotationId: 'LME-11211-EE005', projectName: '力積電P1/P2廠電力系統改善', date: '2025-10-20' }
    ];

    // ============================================================
    // 2. 模擬「後端查詢 API」
    // ============================================================
    function matchesKeyword(record, keyword) {
        const tokens = (keyword || '').trim().split(/\s+/).filter(Boolean).map(t => t.toLowerCase());
        if (tokens.length === 0) return true;

        const haystack = [
            record.matNo, record.name, record.spec, record.category,
            record.owner, record.customer, record.vendorName,
            record.projectName, record.quotationId, record.projectNo, record.date
        ].filter(Boolean).join(' ').toLowerCase();

        return tokens.every(token => haystack.includes(token));
    }

    function fetchPriceHistory({ keyword, owner, customer, vendor, category, startDate, endDate, page, pageSize, sortColumn, sortDirection }) {
        return new Promise(resolve => {
            setTimeout(() => {
                let result = mockPriceHistory.filter(function(r) {
                    const matchKeyword = matchesKeyword(r, keyword);
                    const matchOwner = !owner || r.owner === owner;
                    const matchCustomer = !customer || r.customer === customer;
                    const matchVendor = !vendor || r.vendorName === vendor;
                    const matchCategory = !category || r.category === category;

                    let matchDate = true;
                    if (startDate && r.date < startDate) matchDate = false;
                    if (endDate && r.date > endDate) matchDate = false;

                    return matchKeyword && matchOwner && matchCustomer && matchVendor && matchCategory && matchDate;
                });

                result.sort((a, b) => {
                    let valA = a[sortColumn];
                    let valB = b[sortColumn];
                    if (typeof valA === 'number' && typeof valB === 'number') {
                        return sortDirection === 'asc' ? valA - valB : valB - valA;
                    }
                    valA = (valA || '').toString().toLowerCase();
                    valB = (valB || '').toString().toLowerCase();
                    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });

                const total = result.length;
                const start = (page - 1) * pageSize;
                resolve({ records: result.slice(start, start + pageSize), total });
            }, 350); // 模擬網路往返時間（資料量大，故意比其他查詢頁稍長一點）
        });
    }

    // ============================================================
    // 3. 狀態管理
    // ============================================================
    let state = {
        records: [],       // 目前這一頁的資料（不是全部）
        total: 0,          // 後端回報的符合條件總筆數
        currentPage: 1,
        pageSize: 10,
        hasSearched: false,
        isLoading: false,
        filters: {
            keyword: '',
            owner: '',
            customer: '',
            vendor: '',
            category: '',
            startDate: '',
            endDate: ''
        },
        sort: {
            column: 'date',
            direction: 'desc'
        }
    };

    let advancedOpen = true; // 預設展開，與畫面參考一致

    // ============================================================
    // 4. 初始化
    // ★ 進站時只準備篩選選單與搜尋卡片，不執行查詢、結果卡片完全不顯示
    // ============================================================
    function init() {
        populateFilterOptions();
        initFlatpickr();
        bindEvents();
        console.log('查詢中心初始化完成（等待使用者查詢）');
    }

    // 業主/客戶/廠商/類別選項清單，假設是後端另外提供的小型 distinct 值查詢，
    // 不是從巨量歷史紀錄表本身現撈（跟成本代碼設定的產品代碼/成本歸屬代碼處理方式一致）
    function populateFilterOptions() {
        const ownerSet = [...new Set(mockPriceHistory.map(r => r.owner))].sort();
        const customerSet = [...new Set(mockPriceHistory.map(r => r.customer))].sort();
        const vendorSet = [...new Set(mockPriceHistory.map(r => r.vendorName).filter(v => v && v !== '-'))].sort();
        const categorySet = [...new Set(mockPriceHistory.map(r => r.category))];

        fillSelect('filterOwner', ownerSet, '全部業主');
        fillSelect('filterCustomer', customerSet, '全部客戶');
        fillSelect('filterVendor', vendorSet, '全部廠商');
        fillSelect('filterCategory', categorySet, '全部類別');
    }

    function fillSelect(id, values, allLabel) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `<option value="">${allLabel}</option>` +
            values.map(v => `<option value="${v}">${v}</option>`).join('');
    }

    function initFlatpickr() {
        if (typeof flatpickr !== 'undefined') {
            flatpickr('.flatpickr-date', {
                locale: 'zh_tw',
                dateFormat: 'Y-m-d',
                allowInput: true
            });
        }
    }

    function bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) searchBtn.addEventListener('click', runSearch);

        const searchInput = document.getElementById('searchKeyword');
        if (searchInput) {
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') runSearch();
            });
        }

        const advancedToggle = document.getElementById('advancedToggle');
        if (advancedToggle) advancedToggle.addEventListener('click', toggleAdvanced);

        const clearBtn = document.getElementById('clearFilterBtn');
        if (clearBtn) clearBtn.addEventListener('click', clearFilters);

        const newSearchBtn = document.getElementById('newSearchBtn');
        if (newSearchBtn) newSearchBtn.addEventListener('click', hideResults);
    }

    // ============================================================
    // 5. 搜尋流程
    // ============================================================
    function toggleAdvanced() {
        advancedOpen = !advancedOpen;
        const grid = document.getElementById('advancedGrid');
        const chevron = document.getElementById('advancedChevron');
        if (grid) grid.classList.toggle('open', advancedOpen);
        if (chevron) chevron.classList.toggle('fa-chevron-up', advancedOpen);
        if (chevron) chevron.classList.toggle('fa-chevron-down', !advancedOpen);
    }

    function readFiltersFromDom() {
        state.filters.keyword = (document.getElementById('searchKeyword') || {}).value || '';
        state.filters.owner = (document.getElementById('filterOwner') || {}).value || '';
        state.filters.customer = (document.getElementById('filterCustomer') || {}).value || '';
        state.filters.vendor = (document.getElementById('filterVendor') || {}).value || '';
        state.filters.category = (document.getElementById('filterCategory') || {}).value || '';
        state.filters.startDate = (document.getElementById('startDate') || {}).value || '';
        state.filters.endDate = (document.getElementById('endDate') || {}).value || '';
    }

    async function runSearch() {
        readFiltersFromDom();
        state.hasSearched = true;
        showResults();
        await loadPage(1);
    }

    function showResults() {
        const results = document.getElementById('qcResults');
        if (results) results.classList.add('visible');
    }

    function hideResults() {
        state.hasSearched = false;
        const results = document.getElementById('qcResults');
        if (results) results.classList.remove('visible');
    }

    async function clearFilters() {
        const searchInput = document.getElementById('searchKeyword');
        if (searchInput) searchInput.value = '';
        ['filterOwner', 'filterCustomer', 'filterVendor', 'filterCategory'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        ['startDate', 'endDate'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el._flatpickr) el._flatpickr.clear();
            else if (el) el.value = '';
        });

        // 若已經查詢過，清空條件後直接以「全部」重新查詢；尚未查詢過則僅清空欄位
        if (state.hasSearched) {
            await runSearch();
        }
    }

    // ============================================================
    // 6. 查詢流程：所有互動最後都收斂到 loadPage()，統一「重新查詢」
    // ============================================================
    async function loadPage(page) {
        state.currentPage = page;
        setLoading(true);

        const { records, total } = await fetchPriceHistory({
            keyword: state.filters.keyword,
            owner: state.filters.owner,
            customer: state.filters.customer,
            vendor: state.filters.vendor,
            category: state.filters.category,
            startDate: state.filters.startDate,
            endDate: state.filters.endDate,
            page: state.currentPage,
            pageSize: state.pageSize,
            sortColumn: state.sort.column,
            sortDirection: state.sort.direction
        });

        state.records = records;
        state.total = total;
        setLoading(false);
        renderTable();
        renderPagination();
    }

    function setLoading(isLoading) {
        state.isLoading = isLoading;
        const loadingMsg = document.getElementById('loadingMessage');
        const tableWrap = document.querySelector('#qcResults .table-responsive');
        if (loadingMsg) loadingMsg.style.display = isLoading ? 'block' : 'none';
        if (tableWrap) tableWrap.style.display = isLoading ? 'none' : '';
    }

    function sortData(column) {
        if (!state.hasSearched || state.isLoading) return;
        if (state.sort.column === column) {
            state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.sort.column = column;
            state.sort.direction = 'asc';
        }
        updateSortIcons();
        loadPage(1);
    }

    function updateSortIcons() {
        document.querySelectorAll('.query-table th i.fas').forEach(icon => {
            if (icon.id && icon.id.startsWith('icon-')) icon.className = 'fas fa-sort';
        });
        document.querySelectorAll('.query-table th').forEach(th => th.classList.remove('active-sort'));

        if (state.sort.column) {
            const activeIcon = document.getElementById(`icon-${state.sort.column}`);
            if (activeIcon) {
                activeIcon.className = state.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
                if (activeIcon.parentElement) activeIcon.parentElement.classList.add('active-sort');
            }
        }
    }

    // ============================================================
    // 7. 渲染（只渲染「這一頁」，不做任何篩選/排序運算）
    // ============================================================
    function renderTable() {
        const tbody = document.getElementById('queryResultBody');
        const noDataMsg = document.getElementById('noDataMessage');
        const totalRecordsEl = document.getElementById('totalRecords');
        const totalRecordsFooterEl = document.getElementById('totalRecordsFooter');
        const paginationSection = document.getElementById('paginationSection');
        if (!tbody) return;

        if (totalRecordsEl) totalRecordsEl.textContent = state.total;
        if (totalRecordsFooterEl) totalRecordsFooterEl.textContent = state.total;

        if (state.records.length === 0) {
            tbody.innerHTML = '';
            if (noDataMsg) noDataMsg.style.display = 'block';
            if (paginationSection) paginationSection.style.display = 'none';
            return;
        }
        if (noDataMsg) noDataMsg.style.display = 'none';
        if (paginationSection) paginationSection.style.display = 'block';

        tbody.innerHTML = state.records.map(r => {
            const projectLabel = r.projectNo
                ? `<span class="project-id-badge">${r.projectNo}</span>`
                : `<span class="quotation-id-badge">${r.quotationId}</span>`;

            return `
                <tr>
                    <td><span class="matno-badge">${r.matNo}</span></td>
                    <td>
                        <div class="fw-bold">${r.name}</div>
                        <div class="text-muted small">${r.spec || '-'}</div>
                    </td>
                    <td><span class="category-tag">${r.category}</span></td>
                    <td>${r.owner}</td>
                    <td>${r.customer}</td>
                    <td>${r.vendorName === '-' ? '<span class="text-muted">-</span>' : r.vendorName}</td>
                    <td>
                        ${projectLabel}
                        <div class="text-muted small mt-1">${r.projectName}</div>
                    </td>
                    <td class="text-end col-cost">${formatCurrency(r.costPrice)}</td>
                    <td class="text-end col-quote">${formatCurrency(r.quotePrice)}</td>
                    <td class="text-center">${r.date}</td>
                </tr>
            `;
        }).join('');
    }

    function renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        if (state.total === 0) {
            paginationEl.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(state.total / state.pageSize);
        let html = `
            <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); PriceHistoryQuery.goToPage(${state.currentPage - 1})">上一頁</a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                html += `
                    <li class="page-item ${i === state.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); PriceHistoryQuery.goToPage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        html += `
            <li class="page-item ${state.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); PriceHistoryQuery.goToPage(${state.currentPage + 1})">下一頁</a>
            </li>
        `;

        paginationEl.innerHTML = html;
    }

    function formatCurrency(num) {
        if (num === null || num === undefined || isNaN(num)) return '-';
        return new Intl.NumberFormat('zh-TW').format(Math.round(num));
    }

    // ============================================================
    // 8. 公開方法
    // ============================================================
    return {
        init: init,
        sortData: sortData,
        clearFilters: clearFilters,
        goToPage: function(page) {
            if (state.isLoading) return;
            const totalPages = Math.ceil(state.total / state.pageSize);
            if (page < 1 || page > totalPages) return;
            loadPage(page);
        },
        changePageSize: function(size) {
            state.pageSize = parseInt(size);
            loadPage(1);
        },
        exportResults: function() {
            LiangLianSystem.showToast('正在產生 Excel 報表...', 'info');
            setTimeout(() => {
                LiangLianSystem.showToast(`下載開始：PriceHistory_${state.total}筆.xlsx`, 'success');
            }, 1200);
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    PriceHistoryQuery.init();
});