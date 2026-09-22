// ============================================================
// 預算執行管理系統 (Budget Execution Management System)
// ============================================================

// 廠商資料庫 (比照 cost-outsourcing 建議廠商機制)
const VENDOR_DATABASE = [
    { id: "V001", name: "良聯工業股份有限公司", taxId: "12345678", category: "A01", categoryName: "設備製造類", contact: "王大明", phone: "07-1234567", email: "service@liangliang.com.tw" },
    { id: "V002", name: "德義專業塗裝廠", taxId: "33445566", category: "A02", categoryName: "表面處理類", contact: "林美華", phone: "04-23456789", email: "dy.paint@gmail.com" },
    { id: "V003", name: "中鋼結構股份有限公司", taxId: "88776655", category: "A01", categoryName: "鋼構材料類", contact: "陳工程師", phone: "07-8021111", email: "cssc@cssc.com.tw" },
    { id: "V004", name: "利通工程行", taxId: "55667788", category: "C01", categoryName: "工程施作類", contact: "李利通", phone: "0933-444-555", email: "litong@outlook.com" },
    { id: "V005", name: "成泰工業社", taxId: "66778899", category: "A01", categoryName: "金屬加工類", contact: "張成泰", phone: "03-4567890", email: "chen-tai@seed.net.tw" },
    { id: "V006", name: "台朔重工股份有限公司", taxId: "77665544", category: "A01", categoryName: "設備製造類", contact: "劉經理", phone: "0800-000-111", email: "fhi@fpg.com.tw" },
    { id: "V007", name: "大同機電股份有限公司", taxId: "12341234", category: "B01", categoryName: "機電儀表類", contact: "趙美華", phone: "02-22223333", email: "sales@tatung.com" },
    { id: "V008", name: "永安工程股份有限公司", taxId: "43214321", category: "C01", categoryName: "工程施作類", contact: "孫亦傑", phone: "0988-777-666", email: "yongan@gmail.com" }
];

// 間接費用預算比例（合約總額 × 此比例）
const INDIRECT_BUDGET_RATIO = 0.037387;

// ============================================================
// 議價明細轉入與分類推演邏輯
// ============================================================
// 【重要】NEGOTIATION_DETAIL_SOURCE 目前是本地模擬資料，結構完全比照「議價彙整」頁面
// getMergedNegotiatedEstimates() 的輸出（已依品項名稱合併成本估算／工程估算兩邊的明細），
// 並額外加上 baseCost（該品項的成本層金額，對應議價彙整 baseCost 欄位加總，不含間接費用/利潤/風險）。
// 待後端 API 就緒後，這裡應改為：
//   const sourceItems = await fetch(`/api/negotiation/${App.quoteId}/detail`).then(r => r.json());
// 取代 fetchNegotiationDetail() 目前回傳本地假資料的行為，其餘推演邏輯不需更動。
const NEGOTIATION_DETAIL_SOURCE = [
    {
        id: 'C001', itemName: '洗滌塔新建工程', equipId: 'EQ-S01', baseCost: 2700000, baselineGrandTotal: 3089988, negAmt: -134268,
        details: [
            { name: '鋼板(9t)', category: '專案材料', material: 'SS400', unit: 'KG', qty: 2500, finalUnitPrice: 515, finalTotal: 1287500, note: '主體材料' },
            { name: '法蘭 20K', category: '專案材料', material: 'SUS304', unit: 'PC', qty: 4, finalUnitPrice: 21500, finalTotal: 86000, note: '進口件' },
            { name: '冷作工', category: '專案製造', material: '-', unit: '工', qty: 40, finalUnitPrice: 8579, finalTotal: 343160, note: '' },
            { name: '25T 吊車', category: '專案製造', material: '-', unit: '車', qty: 5, finalUnitPrice: 30000, finalTotal: 150000, note: '現場吊裝' },
            { name: '吊裝工資', category: '專案製造', material: '-', unit: '工', qty: 30, finalUnitPrice: 6000, finalTotal: 180000, note: '' },
            { name: '現場安裝工資', category: '專案製造', material: '-', unit: '工', qty: 150, finalUnitPrice: 6955.52, finalTotal: 1043328, note: '' }
        ]
    },
    {
        id: 'C002', itemName: '管線與閥件配置', equipId: 'EQ-P01', baseCost: 800000, baselineGrandTotal: 915552, negAmt: -39783,
        details: [
            { name: '排氣管', category: '專案材料', material: 'PVC', unit: 'M', qty: 100, finalUnitPrice: 5000, finalTotal: 500000, note: '' },
            { name: '彎頭/閥件', category: '專案材料', material: 'PVC', unit: '式', qty: 1, finalUnitPrice: 215552, finalTotal: 215552, note: '' },
            { name: '配管工資', category: '專案製造', material: '-', unit: '工', qty: 40, finalUnitPrice: 5000, finalTotal: 200000, note: '' }
        ]
    },
    {
        id: 'C003', itemName: '控制盤與儀表採購', equipId: 'EQ-E01', baseCost: 450000, baselineGrandTotal: 514998, negAmt: -22378,
        details: [
            { name: 'PLC控制盤', category: '專案材料', material: 'SUS304', unit: '面', qty: 1, finalUnitPrice: 400000, finalTotal: 400000, note: '' },
            { name: '傳感器儀表', category: '專案材料', material: '-', unit: '組', qty: 5, finalUnitPrice: 22999.6, finalTotal: 114998, note: '' }
        ]
    },
    {
        id: 'C004', itemName: '人力間接成本', equipId: '-', baseCost: 150000, baselineGrandTotal: 159000, negAmt: -6909,
        details: [
            { name: '專案繪圖設計工程師', category: '間接人力', material: '-', unit: '月', qty: 1, finalUnitPrice: 80000, finalTotal: 80000, note: '一個月工時' },
            { name: '機電整合人員', category: '間接人力', material: '-', unit: '工', qty: 10, finalUnitPrice: 7000, finalTotal: 70000, note: '協助支援' }
        ]
    },
    {
        id: 'E002', itemName: '現場配管與佈線外包', equipId: '-', baseCost: 850000, baselineGrandTotal: 972774, negAmt: -42270,
        details: [
            { name: '配管外包工程', category: '專案外包工程', material: '-', unit: '式', qty: 1, finalUnitPrice: 600000, finalTotal: 600000, note: '' },
            { name: '電控佈線工程', category: '專案外包工程', material: '-', unit: '式', qty: 1, finalUnitPrice: 372774, finalTotal: 372774, note: '' }
        ]
    },
    {
        id: 'E003', itemName: '試車、檢驗與驗收', equipId: '-', baseCost: 300000, baselineGrandTotal: 343332, negAmt: -14919,
        details: [
            { name: '系統試車費用', category: '專案費用', material: '-', unit: '式', qty: 1, finalUnitPrice: 200000, finalTotal: 200000, note: '' },
            { name: '第三方檢驗報告', category: '專案費用', material: '-', unit: '份', qty: 1, finalUnitPrice: 143332, finalTotal: 143332, note: '含公證費' }
        ]
    },
    {
        id: 'E004', itemName: '工程間接成本', equipId: '-', baseCost: 450000, baselineGrandTotal: 486000, negAmt: -21117,
        details: [
            { name: '專案經理', category: '管理人員', material: '-', unit: '月', qty: 2, finalUnitPrice: 105000, finalTotal: 210000, note: '含食宿津貼' },
            { name: '工安 (HSE)', category: '管理人員', material: '-', unit: '月', qty: 2, finalUnitPrice: 65000, finalTotal: 130000, note: '' },
            { name: '辦公室物品', category: '臨時辦公室', material: '-', unit: '式', qty: 1, finalUnitPrice: 110000, finalTotal: 110000, note: '行政與雜支' }
        ]
    }
];

// 之後改為呼叫真正的後端 API，取得議價彙整鎖定的完整明細資料
function fetchNegotiationDetail() {
    // TODO: 串接後端 API 後改為：return fetch(`/api/negotiation/${App.quoteId}/detail`).then(r => r.json());
    return NEGOTIATION_DETAIL_SOURCE;
}

// 分類規則：議價明細 category（＋單位）→ 預算五大科目
// 此規則已與使用者確認，日後若良聯實際會計科目認定不同，僅需調整這個函式即可，不影響其餘推演邏輯。
function classifyDetailToCategory(detail) {
    switch (detail.category) {
        case '專案材料':
            return 'cat-mat';
        case '專案外包工程':
            return 'cat-eng';
        case '專案製造':
            // 論工計價（單位＝「工」）歸人工；設備租賃等非計工項目歸直接費用
            return detail.unit === '工' ? 'cat-lab' : 'cat-dir';
        case '專案費用':
        case '間接人力':
        case '管理人員':
        case '臨時辦公室':
            return 'cat-dir';
        default:
            // 未知分類先歸入直接費用，並於備註標示待人工確認，避免資料遺漏
            return 'cat-dir';
    }
}

// 根據明細資料映射在建會科代碼與彙整規格名稱
function mapDetailAccountCodeAndSpec(d, src, catId) {
    if (catId === 'cat-mat') {
        if (d.name.includes('鋼板') || d.name.includes('法蘭')) {
            return { accountCode: '1251M1', spec: '鋼板' };
        }
        if (d.name.includes('管') || d.name.includes('閥')) {
            return { accountCode: '1251M2', spec: '管線與閥件' };
        }
        if (d.name.includes('盤') || d.name.includes('儀表') || d.name.includes('傳感器')) {
            return { accountCode: '1251M3', spec: '控制盤與儀表' };
        }
        return { accountCode: '1251M1', spec: '鋼板' };
    }
    if (catId === 'cat-lab') {
        return { accountCode: '1251L1', spec: '現場製造與施工人工' };
    }
    if (catId === 'cat-dir') {
        if (d.name.includes('吊車') || d.name.includes('吊裝')) {
            return { accountCode: '1251D1', spec: '起重與吊裝作業費' };
        }
        if (d.name.includes('工程師') || d.name.includes('人員') || d.name.includes('設計')) {
            return { accountCode: '1251D2', spec: '專案技術與設計支援費' };
        }
        if (d.name.includes('試車') || d.name.includes('檢驗') || d.name.includes('報告')) {
            return { accountCode: '1251D3', spec: '試車檢驗與認證費' };
        }
        if (d.name.includes('經理') || d.name.includes('工安') || d.name.includes('辦公室')) {
            return { accountCode: '1251D4', spec: '專案管理與工地雜支' };
        }
        return { accountCode: '1251D5', spec: '未拆分直接成本' };
    }
    if (catId === 'cat-eng') {
        return { accountCode: '1251E1', spec: '現場外包工程' };
    }
    if (catId === 'cat-mfg') {
        return { accountCode: '1251F1', spec: '設備委外加工費' };
    }
    return { accountCode: '1251D5', spec: '其他直接成本' };
}

// 將議價彙整明細（sourceItems）依分類規則推演，並按在建會科代碼歸併建立樹狀清單（父項+子細項）。
function deriveBudgetItems(sourceItems) {
    const rawDetails = [];
    let childCounter = 0;

    const idPrefix = { 'cat-mat': 'M', 'cat-lab': 'L', 'cat-dir': 'D', 'cat-mfg': 'F', 'cat-eng': 'E' };
    const codePrefix = { 'cat-mat': 'MAT', 'cat-lab': 'LAB', 'cat-dir': 'DIR', 'cat-mfg': 'MFG', 'cat-eng': 'ENG' };
    const codeBase = { 'cat-mat': 100, 'cat-lab': 200, 'cat-dir': 300, 'cat-mfg': 400, 'cat-eng': 500 };

    sourceItems.forEach(src => {
        const costRatio = src.baselineGrandTotal > 0 ? (src.baseCost / src.baselineGrandTotal) : 1;
        let matSeq = 0;
        let costSum = 0;

        (src.details || []).forEach(d => {
            const catId = classifyDetailToCategory(d);
            const costUnitPrice = Math.round(d.finalUnitPrice * costRatio * 100) / 100;
            const costTotal = Math.round(d.qty * costUnitPrice);
            costSum += costTotal;

            const accInfo = mapDetailAccountCodeAndSpec(d, src, catId);

            let matNo = '-';
            if (catId === 'cat-mat' && src.equipId && src.equipId !== '-') {
                matSeq += 1;
                matNo = `${src.equipId}-${String(matSeq).padStart(2, '0')}`;
            }

            childCounter++;
            let specName = d.name;
            if (d.material && d.material !== '-') specName += ` ${d.material}`;
            specName += `（${src.itemName}）`;

            rawDetails.push({
                id: `C_${catId}_${childCounter}`,
                catId: catId,
                costCode: `${codePrefix[catId]}-${codeBase[catId] + childCounter}`,
                accountCode: accInfo.accountCode,
                specName: accInfo.spec,
                matNo: matNo,
                spec: specName,
                unit: d.unit,
                qty: d.qty,
                price: costUnitPrice,
                costTotal: costTotal,
                actualAmt: 0,
                remark: d.note || ''
            });
        });

        // 補差額列
        const gap = Math.round(src.baseCost - costSum);
        if (gap !== 0) {
            const catId = 'cat-dir';
            const accInfo = mapDetailAccountCodeAndSpec({ name: '未拆分之直接成本' }, src, catId);
            childCounter++;
            rawDetails.push({
                id: `C_${catId}_${childCounter}`,
                catId: catId,
                costCode: `${codePrefix[catId]}-${codeBase[catId] + childCounter}`,
                accountCode: accInfo.accountCode,
                specName: accInfo.spec,
                matNo: '-',
                spec: `未拆分之直接成本（${src.itemName}）`,
                unit: '式',
                qty: 1,
                price: gap,
                costTotal: gap,
                actualAmt: 0,
                remark: '原始估算成本未拆分至明細之餘額'
            });
        }
    });

    // 按 catId + accountCode 歸併建立父項 (Parent) 與其子項 (Children)
    const seq = { 'cat-mat': 0, 'cat-lab': 0, 'cat-dir': 0, 'cat-mfg': 0, 'cat-eng': 0 };
    const groupedMap = new Map();

    rawDetails.forEach(item => {
        const key = `${item.catId}__${item.accountCode}`;
        if (!groupedMap.has(key)) {
            groupedMap.set(key, {
                catId: item.catId,
                accountCode: item.accountCode,
                specName: item.specName,
                units: new Set(),
                children: []
            });
        }
        const grp = groupedMap.get(key);
        if (item.unit && item.unit !== '-') grp.units.add(item.unit);
        grp.children.push(item);
    });

    const items = [];
    groupedMap.forEach((g) => {
        seq[g.catId] += 1;
        const parentId = `P_${idPrefix[g.catId]}${String(seq[g.catId]).padStart(2, '0')}`;
        const unit = g.units.size === 1 ? Array.from(g.units)[0] : '式';

        let sumQty = 0;
        let sumCostTotal = 0;
        let sumActualAmt = 0;

        g.children.forEach(c => {
            c.parentId = parentId;
            sumQty += c.qty;
            sumCostTotal += c.costTotal;
            sumActualAmt += c.actualAmt;
        });

        items.push({
            id: parentId,
            categoryId: g.catId,
            costCode: '-', // 需求 3: 父層成本代碼保持為空
            accountCode: g.accountCode,
            matNo: '-', // 需求 3: 父層材料編號保持為空
            spec: g.specName,
            unit: unit,
            qty: g.children.length > 1 ? sumQty : (g.children[0] ? g.children[0].qty : 1),
            price: 0,
            costTotal: sumCostTotal,
            quotes: [], // 採購部比價清單（動態新增，見 openQuotesModal），選定得標後才產生 vendorName/vendorAmt/budgetAmt
            vendorName: '',
            vendorAmt: null,
            budgetAmt: null,
            actualAmt: sumActualAmt,
            remark: `共 ${g.children.length} 個細項`,
            isParent: true,
            expanded: false,
            children: g.children
        });
    });

    return items;
}

const App = {
    isLocked: false,
    activeCatId: 'cat-summary',
    // 以下預設值對齊「議價彙整」demo 資料（台積電 P3 廠廢氣處理設備新建工程），
    // 供標準未帶入 URL 參數時仍可展示完整銜接效果；實際串接後會被 applyTransferParams() 覆蓋。
    contractAmount: 6200000,   // = 原始報價總額 6,481,644 依議價彙整 demo 折讓 -281,644 後之得標金額
    baselineTotal: 6481644,    // 原始報價總額（對齊議價彙整之「原始報價總額」）
    projectId: 'PRJ-2026-0088',   // 專案編號（示範值，實際由業主 ERP 同步得標資料後產生）
    quoteId: 'EQ25090001',        // 來源報價編號（對齊報價估算表／議價彙整之報價編號）
    clientName: '台灣積體電路',
    projectName: '台積電 P3 廠廢氣處理設備新建工程',
    negotiationSource: '議價作業彙整 第 1 輪',
    
    // ★ 1. 頁籤名稱改回OO明細表
    categories: [
        { id: 'cat-mat', name: '材料明細表', icon: 'fa-cube' },
        { id: 'cat-lab', name: '人工明細表', icon: 'fa-users' },
        { id: 'cat-dir', name: '直接費用明細表', icon: 'fa-file-invoice-dollar' },
        { id: 'cat-mfg', name: '外包加工明細表', icon: 'fa-cogs' },
        { id: 'cat-eng', name: '外包工程明細表', icon: 'fa-hard-hat' }
    ],

    // 品項清單改由 deriveBudgetItems() 於 init() 時自動由議價彙整明細（成本層）推演產生，
    // 不再手動寫死；下方僅保留空陣列作為初始值，實際內容於 init() 階段填入。
    items: [],

    init() {
        this.applyTransferParams();
        // 品項清單由議價彙整明細（成本層）推演產生（目前為本地模擬資料，待後端 API 就緒後
        // fetchNegotiationDetail() 內部改為真正的 API 呼叫即可，此處呼叫方式不需更動）
        this.items = deriveBudgetItems(fetchNegotiationDetail());
        document.getElementById('dashContractAmt').textContent = this.formatCurrency(this.contractAmount);
        this.buildTabsAndTables();
        this.renderAllData();
        this.switchTab(this.activeCatId); 
    },

    // 讀取議價作業彙整轉入的契約金額／原始報價總額／專案識別碼（透過 URL 參數帶入）
    // 實際串接後端時，這裡改為依 projectId 向 API 查詢得標契約金額即可；
    // 是否已得標（ERP 是否已同步專案編號）由後端／存取控制判斷，此頁不處理。
    // 註：品項層級的建議發包比例已改由 deriveBudgetItems() 依各品項議價折讓幅度個別換算
    // （見 originalRatio），不再需要單一 discountRatio 換算出全案統一比例的舊機制。
    applyTransferParams() {
        const params = new URLSearchParams(window.location.search);
        const contractAmount = parseFloat(params.get('contractAmount'));
        const round = params.get('negotiationRound');
        const baselineTotal = parseFloat(params.get('baselineTotal'));
        const projectId = params.get('projectId');
        const quoteId = params.get('quoteId');
        const clientName = params.get('clientName');
        const projectName = params.get('projectName');

        if (projectId) this.projectId = projectId;
        if (quoteId) this.quoteId = quoteId;
        if (clientName) this.clientName = clientName;
        if (projectName) this.projectName = projectName;

        if (!isNaN(contractAmount) && contractAmount > 0) {
            this.contractAmount = contractAmount;
            this.negotiationSource = round ? `議價作業彙整 第 ${round} 輪` : '議價作業彙整';
        }

        if (!isNaN(baselineTotal) && baselineTotal > 0) {
            this.baselineTotal = baselineTotal;
        }

        this.applyHeaderFields();
    },

    // 將轉入的專案編號／報價編號／業主／工程名稱填入頁首資訊列；
    // 未提供時維持 HTML 預設值（供無參數獨立開啟時仍可正常顯示畫面）
    applyHeaderFields() {
        const projectIdEl = document.getElementById('projectIdField');
        if (projectIdEl && this.projectId) projectIdEl.value = this.projectId;

        const quoteRefEl = document.getElementById('quoteIdRef');
        if (quoteRefEl) {
            if (this.quoteId) {
                quoteRefEl.textContent = `來源報價編號：${this.quoteId}`;
                quoteRefEl.style.display = 'block';
            } else {
                quoteRefEl.style.display = 'none';
            }
        }

        const clientEl = document.getElementById('clientNameField');
        if (clientEl && this.clientName) clientEl.value = this.clientName;

        const nameEl = document.getElementById('projectNameField');
        if (nameEl && this.projectName) nameEl.value = this.projectName;
    },

    formatCurrency(num) {
        if(num === null || isNaN(num)) return '';
        return new Intl.NumberFormat('zh-TW').format(Math.round(num));
    },
    
    formatPercent(num) {
        if(isNaN(num) || !isFinite(num)) return '0.0%';
        return num.toFixed(1) + '%';
    },

    switchTab(tabId) {
        this.activeCatId = tabId;
    },

    // 1. 動態建立頁籤與表格框架
    buildTabsAndTables() {
        const tabsUl = document.getElementById('budgetTabs');
        const tabContent = document.getElementById('budgetTabContent');
        tabsUl.innerHTML = '';
        tabContent.innerHTML = '';

        // --- 建立【預算執行總表】頁籤 ---
        tabsUl.innerHTML += `
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="tab-cat-summary-btn" 
                        data-bs-toggle="tab" data-bs-target="#pane-cat-summary" type="button" role="tab"
                        onclick="App.switchTab('cat-summary')">
                    <i class="fas fa-chart-pie"></i> 預算執行總表
                </button>
            </li>
        `;
        
        tabContent.innerHTML += `
            <div class="tab-pane fade show active" id="pane-cat-summary" role="tabpanel">
                <div class="tab-toolbar">
                    <h6 class="tab-title"><i class="fas fa-chart-line me-2"></i>預算執行總表</h6>
                </div>
                <div style="overflow-x: auto; width: 100%">
                    <table class="matrix-summary-table" id="table-cat-summary">
                        <thead id="thead-cat-summary">
                            <!-- JS 動態生成水平多欄位表頭 -->
                        </thead>
                        <tbody id="tbody-cat-summary"></tbody>
                        <tfoot id="tfoot-cat-summary">
                            <!-- JS 動態生成小計、佔合約與結餘計算 -->
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        // --- 建立五大【細項明細表】頁籤 ---
        this.categories.forEach((cat) => {
            tabsUl.innerHTML += `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="tab-${cat.id}-btn" 
                            data-bs-toggle="tab" data-bs-target="#pane-${cat.id}" type="button" role="tab"
                            onclick="App.switchTab('${cat.id}')">
                        <i class="fas ${cat.icon}"></i> ${cat.name}
                    </button>
                </li>
            `;

            tabContent.innerHTML += `
                <div class="tab-pane fade" id="pane-${cat.id}" role="tabpanel">
                    <div class="tab-toolbar">
                        <h6 class="tab-title"><i class="fas ${cat.icon} me-2 text-primary"></i>${cat.name}</h6>
                    </div>
                    <div class="table-responsive-wrapper">
                        <table class="estimation-table detail-table" id="table-${cat.id}">
                            <thead>
                                <tr>
                                    <th class="sticky-col-1 text-center" style="width: 45px;"><i class="fas fa-folder-tree"></i></th>
                                    <th class="sticky-col-2">項次</th>
                                    <th class="sticky-col-3">成本代碼</th>
                                    <th class="sticky-col-4">在建會科</th>
                                    <th class="sticky-col-5">材料編號</th>
                                    <th class="sticky-col-6 text-start">規格內容</th>
                                    <th style="min-width: 70px;" class="text-center">單位</th>
                                    <th style="min-width: 90px;" class="text-end">數量</th>
                                    <th style="min-width: 110px;" class="text-end">成本單價</th>
                                    <th class="text-end text-dark" style="min-width: 140px;">成本總額</th>
                                    <th class="text-center" style="min-width: 120px;">詢價詳情</th>
                                    <th class="text-end col-vendor-area" style="min-width: 140px;">廠商報價金額</th>
                                    <th class="text-start col-vendor-area" style="min-width: 280px;">廠商名稱</th>
                                    <th class="text-end text-primary" style="min-width: 140px; font-weight:bold;">預算金額</th>
                                    <th class="text-end" style="min-width: 140px; color: #8b5cf6; font-weight:bold; background-color: #f5f3ff;">實際執行金額</th>
                                    <th style="min-width: 250px;" class="text-start">備註</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-${cat.id}"></tbody>
                            <tfoot style="position: sticky; bottom: 0; z-index: 100; box-shadow: 0 -2px 10px rgba(0,0,0,0.1);">
                                <tr class="total-row" id="tfoot-row-${cat.id}">
                                    <!-- JS 動態填寫小計 -->
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        });
    },

    toggleExpand(itemId) {
        const parent = this.items.find(i => i.id === itemId);
        if (parent) {
            parent.expanded = !parent.expanded;
            this.renderAllData();
        }
    },

    handleInputChange(id, field, value) {
        let found = false;
        for (const parent of this.items) {
            if (parent.id === id) {
                parent[field] = ['spec', 'remark'].includes(field) ? value : (value === '' ? null : parseFloat(value));
                found = true;
                break;
            }
            if (parent.children) {
                const child = parent.children.find(c => c.id === id);
                if (child) {
                    child[field] = ['spec', 'remark'].includes(field) ? value : (value === '' ? null : parseFloat(value));
                    found = true;
                    this.recalcParentSums(parent);
                    break;
                }
            }
        }
        if (found) this.renderAllData();
    },

    recalcParentSums(parent) {
        if (!parent || !parent.children) return;
        parent.costTotal = parent.children.reduce((sum, c) => sum + (c.costTotal || 0), 0);
        parent.actualAmt = parent.children.reduce((sum, c) => sum + (c.actualAmt || 0), 0);
    },

    // 2. 渲染所有資料與計算總和
    renderAllData() {
        let dashBudget = 0;
        let dashActual = 0;
        
        let catData = {}; 
        let maxRows = 0;

        this.categories.forEach(cat => {
            const tbody = document.getElementById(`tbody-${cat.id}`);
            if(!tbody) return;
            tbody.innerHTML = '';
            
            let catBase = 0;
            let catBudget = 0;
            let catActual = 0;
            let rowIndex = 1;

            const topLevelItems = this.items.filter(i => i.categoryId === cat.id);
            
            catData[cat.id] = { items: topLevelItems, subBudget: 0, subActual: 0 };
            maxRows = Math.max(maxRows, topLevelItems.length);

            topLevelItems.forEach(item => {
                this.renderRow(item, tbody, cat.id, rowIndex++);
                
                catBase += (item.costTotal || 0);
                catBudget += (item.budgetAmt || 0);
                catActual += (item.actualAmt || 0);
            });

            catData[cat.id].subBudget = catBudget;
            catData[cat.id].subActual = catActual;

            // ★ 同步色彩至明細表表尾 (成本=Secondary灰, 預算=Primary藍, 實際=Purple紫)
            document.getElementById(`tfoot-row-${cat.id}`).innerHTML = `
                <td class="sticky-col-1"></td>
                <td class="sticky-col-2"></td>
                <td class="sticky-col-3"></td>
                <td class="sticky-col-4"></td>
                <td class="sticky-col-5"></td>
                <td class="sticky-col-6 text-end text-secondary fw-bold">【${cat.name}】小計：</td>
                <td colspan="3"></td>
                <td class="text-end text-secondary fw-bold">${this.formatCurrency(catBase)}</td>
                <td colspan="3"></td>
                <td class="text-end text-primary fw-bold">${this.formatCurrency(catBudget)}</td>
                <td class="text-end fw-bold" style="color: #8b5cf6;">${this.formatCurrency(catActual)}</td>
                <td></td>
            `;

            dashBudget += catBudget;
            dashActual += catActual;
        });

        // 間接費用 (合約 * 間接費用預算比例 模擬附圖預算)
        const indirectBudget = this.contractAmount * INDIRECT_BUDGET_RATIO;
        const indirectActual = 0;

        dashBudget += indirectBudget;
        dashActual += indirectActual;

        // --- 更新 Dashboard 核心財務指標 ---
        const grossProfit = this.contractAmount - dashBudget;
        const grossMargin = (grossProfit / this.contractAmount) * 100;

        document.getElementById('dashTotalBudget').textContent = this.formatCurrency(dashBudget);
        document.getElementById('dashGrossProfit').textContent = this.formatCurrency(grossProfit);
        document.getElementById('dashGrossMargin').textContent = this.formatPercent(grossMargin);
        document.getElementById('dashActualCost').textContent = this.formatCurrency(dashActual);

        // --- 渲染【預算執行總表】 ---
        this.renderMatrixSummaryTable(catData, maxRows, indirectBudget, indirectActual, dashBudget, dashActual);
    },

    // ★ 矩陣總表
    renderMatrixSummaryTable(catData, maxRows, indirectBudget, indirectActual, totalBudget, totalActual) {
        const thead = document.getElementById('thead-cat-summary');
        const tbody = document.getElementById('tbody-cat-summary');
        const tfoot = document.getElementById('tfoot-cat-summary');
        if(!thead || !tbody || !tfoot) return;

        const catKeys = ['cat-mat', 'cat-lab', 'cat-dir', 'cat-mfg', 'cat-eng'];
        
        // 生成表頭
        thead.innerHTML = `
            <tr>
                ${this.categories.map(c => `<th colspan="3">${c.name}</th>`).join('')}
            </tr>
            <tr>
                ${catKeys.map(() => `
                    <th style="min-width: 180px;">項目</th>
                    <th style="min-width: 100px; color: var(--primary-blue, #3b82f6);">預算</th>
                    <th style="min-width: 100px; color: #8b5cf6;">實際</th>
                `).join('')}
            </tr>
        `;

        // 生成資料列
        let tbodyHtml = '';
        for (let i = 0; i < maxRows; i++) {
            tbodyHtml += `<tr>`;
            catKeys.forEach(k => {
                let item = catData[k].items[i];
                if (item) {
                    let budget = item.budgetAmt || 0;
                    let actual = item.actualAmt || null;
                    tbodyHtml += `
                        <td class="text-start"><span class="truncate-text" title="${item.spec}">${item.spec}</span></td>
                        <td class="text-end text-primary">${this.formatCurrency(budget)}</td>
                        <td class="text-end" style="color: #8b5cf6; font-weight: 500;">${actual !== null ? this.formatCurrency(actual) : '-'}</td>
                    `;
                } else {
                    tbodyHtml += `<td></td><td></td><td></td>`;
                }
            });
            tbodyHtml += `</tr>`;
        }
        tbody.innerHTML = tbodyHtml;

        // 生成底部統計列 (預算藍、實際紫、差額綠)
        tfoot.innerHTML = `
            <tr class="summary-footer-row">
                ${catKeys.map(k => `
                    <td class="text-center fw-bold">小計</td>
                    <td class="text-end fw-bold text-primary">${this.formatCurrency(catData[k].subBudget)}</td>
                    <td class="text-end fw-bold" style="color: #8b5cf6;">${catData[k].subActual ? this.formatCurrency(catData[k].subActual) : '-'}</td>
                `).join('')}
            </tr>
            <tr class="summary-footer-row">
                ${catKeys.map(k => `
                    <td class="text-center fw-bold text-muted">佔合約%</td>
                    <td class="text-end fw-bold text-muted">${this.formatPercent((catData[k].subBudget / this.contractAmount) * 100)}</td>
                    <td class="text-end fw-bold text-muted">${this.formatPercent((catData[k].subActual / this.contractAmount) * 100)}</td>
                `).join('')}
            </tr>
            <tr class="summary-footer-row">
                ${catKeys.map(k => `
                    <td class="text-center fw-bold text-dark">預算-實際</td>
                    <td colspan="2" class="text-center fw-bold text-success">${this.formatCurrency(catData[k].subBudget - catData[k].subActual)}</td>
                `).join('')}
            </tr>
            <tr class="summary-footer-row">
                <td colspan="2" class="text-start fw-bold text-secondary">(f) 間接費用(分攤金額)</td>
                <td class="text-center fw-bold text-secondary">預算：</td>
                <td colspan="2" class="text-end fw-bold text-primary">${this.formatCurrency(indirectBudget)}</td>
                <td class="text-center fw-bold text-secondary">實際：</td>
                <td colspan="2" class="text-end fw-bold" style="color: #8b5cf6;">${indirectActual ? this.formatCurrency(indirectActual) : '-'}</td>
                <td class="text-center fw-bold text-secondary">預算-實際：</td>
                <td colspan="2" class="text-center fw-bold text-success">${this.formatCurrency(indirectBudget - indirectActual)}</td>
                <td colspan="2" class="text-center fw-bold text-secondary">預算佔合約(%)：</td>
                <td class="text-end fw-bold text-muted">預算 ${this.formatPercent((indirectBudget/this.contractAmount)*100)}</td>
                <td class="text-end fw-bold text-muted">實際 ${this.formatPercent((indirectActual/this.contractAmount)*100)}</td>
            </tr>
            <tr class="summary-footer-row">
                <td colspan="2" class="text-start fw-bold text-dark" style="font-size: 1.05rem;">總計：</td>
                <td class="text-center fw-bold text-dark" style="font-size: 1.05rem;">預算：</td>
                <td colspan="2" class="text-end fw-bold text-primary" style="font-size: 1.1rem;">${this.formatCurrency(totalBudget)}</td>
                <td class="text-center fw-bold text-dark" style="font-size: 1.05rem;">實際：</td>
                <td colspan="2" class="text-end fw-bold" style="color: #8b5cf6; font-size: 1.1rem;">${totalActual ? this.formatCurrency(totalActual) : '-'}</td>
                <td class="text-center fw-bold text-dark" style="font-size: 1.05rem;">預算-實際：</td>
                <td colspan="2" class="text-center fw-bold text-success" style="font-size: 1.1rem;">${this.formatCurrency(totalBudget - totalActual)}</td>
                <td class="text-center fw-bold text-dark">實際/預算：</td>
                <td class="text-end fw-bold text-danger">${this.formatPercent((totalActual/totalBudget)*100)}</td>
                <td class="text-center fw-bold text-dark">實際/合約：</td>
                <td class="text-end fw-bold text-danger">${this.formatPercent((totalActual/this.contractAmount)*100)}</td>
            </tr>
        `;
    },

    renderRow(item, tbody, catId, displayIndex) {
        const disabledState = this.isLocked ? "disabled readonly" : "";
        const icon = item.expanded ? 'fa-minus' : 'fa-plus';
        
        const hasSelectedQuote = item.quotes && item.quotes.some(q => q.selected);
        const parentBtnClass = hasSelectedQuote ? 'btn-success text-white' : 'btn-outline-primary';
        const parentBtnIcon = hasSelectedQuote ? 'fa-check-circle' : 'fa-list-check';

        // 父層列 (在建會科彙整層)
        const trParent = document.createElement('tr');
        trParent.className = 'is-group-parent';
        trParent.innerHTML = `
            <td class="sticky-col-1 text-center">
                <button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="App.toggleExpand('${item.id}')" title="${item.expanded ? '折疊細項' : '展開檢視細項'}">
                    <i class="fas ${icon}"></i>
                </button>
            </td>
            <td class="sticky-col-2 text-muted fw-bold">${displayIndex}</td>
            <td class="sticky-col-3 text-muted">-</td>
            <td class="sticky-col-4 fw-bold text-primary">${item.accountCode}</td>
            <td class="sticky-col-5 text-muted">-</td>
            <td class="sticky-col-6 text-start">
                <span class="fw-bold text-dark">${item.spec}</span>
                <span class="badge bg-light text-secondary border ms-1" style="font-size: 0.75rem;">${item.children.length}</span>
            </td>
            <td class="text-center">${item.unit}</td>
            <td class="text-end">${item.qty}</td>
            <td class="text-end text-muted">-</td>
            <td class="text-end fw-bold text-dark">${this.formatCurrency(item.costTotal)}</td>
            
            <td class="text-center">
                <button class="btn btn-sm ${parentBtnClass} py-1 px-2" type="button" onclick="App.openQuotesModal('${item.id}')" title="編輯多家廠商詢價報價詳情">
                    <i class="fas ${parentBtnIcon} me-1"></i>報價詳情
                </button>
            </td>
            
            <td class="col-vendor-area text-end">
                ${item.vendorAmt !== null
                    ? `<span class="fw-bold text-dark">${this.formatCurrency(item.vendorAmt)}</span>`
                    : `<span class="text-muted small">尚未選定</span>`}
            </td>
            <td class="col-vendor-area">
                ${item.vendorName
                    ? `<span class="fw-bold text-success"><i class="fas fa-check-circle me-1"></i>${item.vendorName}</span>`
                    : `<span class="text-muted small">請按左側「報價詳情」比價並選定得標廠商</span>`}
            </td>
            
            <td class="text-end fw-bold text-primary">${item.budgetAmt !== null ? this.formatCurrency(item.budgetAmt) : '<span class="text-muted small fw-normal">未定案</span>'}</td>
            
            <td style="background-color: #f5f3ff;">
                <input type="number" class="table-input text-end fw-bold" style="color: #8b5cf6;" value="${item.actualAmt || 0}" 
                        onchange="App.handleInputChange('${item.id}', 'actualAmt', this.value)" ${disabledState}>
            </td>
            
            <td class="text-start"><input type="text" class="table-input text-start" value="${item.remark}" onchange="App.handleInputChange('${item.id}', 'remark', this.value)" ${disabledState}></td>
        `;
        tbody.appendChild(trParent);

        // 若父層開啟展開，渲染子細項列 (Child Rows)
        if (item.expanded && item.children) {
            item.children.forEach(c => {
                const trChild = document.createElement('tr');
                trChild.className = 'is-group-child';
                trChild.innerHTML = `
                    <td class="sticky-col-1 text-center text-muted"><span style="font-size:0.8rem;">└</span></td>
                    <td class="sticky-col-2 text-muted">-</td>
                    <td class="sticky-col-3 text-secondary small">${c.costCode}</td>
                    <td class="sticky-col-4 text-secondary small">${c.accountCode}</td>
                    <td class="sticky-col-5 text-secondary small">${c.matNo}</td>
                    <td class="sticky-col-6 text-start ps-3">
                        <span class="text-dark small">${c.spec}</span>
                    </td>
                    <td class="text-center small">${c.unit}</td>
                    <td class="text-end small">${c.qty}</td>
                    <td class="text-end small">${this.formatCurrency(c.price)}</td>
                    <td class="text-end fw-bold text-dark small">${this.formatCurrency(c.costTotal)}</td>
                    
                    <td class="text-center text-muted small">-</td>
                    
                    <td class="col-vendor-area text-center text-muted small">-</td>
                    <td class="col-vendor-area text-center text-muted small">-</td>
                    
                    <td class="text-end text-muted small">-</td>
                    
                    <td style="background-color: #f5f3ff;">
                        <input type="number" class="table-input text-end fw-bold" style="color: #8b5cf6;" value="${c.actualAmt || 0}" 
                                onchange="App.handleInputChange('${c.id}', 'actualAmt', this.value)" ${disabledState}>
                    </td>
                    
                    <td class="text-start"><input type="text" class="table-input text-start" value="${c.remark}" onchange="App.handleInputChange('${c.id}', 'remark', this.value)" ${disabledState}></td>
                `;
                tbody.appendChild(trChild);
            });
        }
    },

    // 建議廠商 Modal 方法 (完全比照 cost-outsourcing 建議廠商機制)
    openVendorModal(itemId) {
        if (this.isLocked) return;
        this.selectedTargetItemId = itemId;
        this.selectedVendorIdInModal = null;
        
        document.getElementById('vendorSearchInput').value = '';
        document.getElementById('vendorCategorySelect').value = '';
        
        this.renderVendorList(VENDOR_DATABASE);
        
        if (!this.vendorModal) {
            const modalEl = document.getElementById('vendorModal');
            if (modalEl && window.bootstrap) {
                this.vendorModal = new bootstrap.Modal(modalEl);
            }
        }
        if (this.vendorModal) this.vendorModal.show();
    },

    renderVendorList(vendors) {
        const tbody = document.getElementById('vendorListBody');
        const countSpan = document.getElementById('vendorCount');
        if (!tbody || !countSpan) return;
        
        countSpan.textContent = vendors.length;
        tbody.innerHTML = '';

        if (vendors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">沒有符合條件的廠商</td></tr>`;
            return;
        }

        vendors.forEach(v => {
            const tr = document.createElement('tr');
            tr.className = 'vendor-row';
            tr.style.cursor = 'pointer';
            tr.onclick = () => this.selectVendorInModal(tr, v.id);
            tr.innerHTML = `
                <td class="text-center">
                    <input type="radio" name="vendorRadio" value="${v.id}" class="form-check-input pointer-events-none">
                </td>
                <td><span class="badge bg-light text-dark border">${v.id}</span></td>
                <td class="fw-bold text-primary">${v.name}</td>
                <td>${v.taxId}</td>
                <td>${v.category} ${v.categoryName}</td>
                <td>${v.contact}</td>
                <td>${v.phone}</td>
                <td class="small text-muted">${v.email}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    selectVendorInModal(tr, vendorId) {
        document.querySelectorAll('.vendor-row').forEach(row => row.classList.remove('table-active'));
        tr.classList.add('table-active');
        const radio = tr.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.selectedVendorIdInModal = vendorId;
    },

    filterVendors() {
        const keyword = document.getElementById('vendorSearchInput').value.toLowerCase().trim();
        const category = document.getElementById('vendorCategorySelect').value;

        const filtered = VENDOR_DATABASE.filter(v => {
            const matchKeyword = !keyword || 
                                 v.id.toLowerCase().includes(keyword) || 
                                 v.name.toLowerCase().includes(keyword) || 
                                 v.taxId.includes(keyword);
            const matchCategory = !category || v.category === category;
            return matchKeyword && matchCategory;
        });

        this.renderVendorList(filtered);
    },

    confirmVendorSelection() {
        if (!this.selectedVendorIdInModal) {
            alert("請先選擇一家廠商");
            return;
        }

        const vendor = VENDOR_DATABASE.find(v => v.id === this.selectedVendorIdInModal);
        
        // 此 Modal 現在僅供比價彈窗內的「選擇廠商」按鈕使用
        if (this.currentQuoteRowIndex !== null && this.currentQuoteRowIndex !== undefined) {
            const row = document.getElementById(`quote-row-${this.currentQuoteRowIndex}`);
            if (row && vendor) {
                const nameInput = row.querySelector('.q-vendor-name');
                if (nameInput) nameInput.value = vendor.name;
            }
            this.currentQuoteRowIndex = null;
        }

        if (this.vendorModal) this.vendorModal.hide();
    },

    // ============================================================
    // 多家廠商詢價詳情 Modal 功能 (需求新增)
    // ============================================================
    openQuotesModal(itemId) {
        if (this.isLocked) return;
        this.selectedTargetItemId = itemId;
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        // 初始化預設測試資料 (若尚未建立過詢價紀錄)
        if (!item.quotes || item.quotes.length === 0) {
            item.quotes = [
                { vendorName: item.vendorName || '德義專業塗裝廠', amount: item.vendorAmt || item.costTotal, selected: true, note: '首選低價廠商' },
                { vendorName: '成泰工業社', amount: Math.round((item.costTotal || 100000) * 1.05), selected: false, note: '報價略高但交期快' },
                { vendorName: '大同機電股份有限公司', amount: Math.round((item.costTotal || 100000) * 1.1), selected: false, note: '原廠報價' }
            ];
        }

        document.getElementById('quotesModalItemTitle').textContent = `${item.accountCode ? item.accountCode + ' - ' : ''}${item.spec}`;
        const costTotalEl = document.getElementById('quotesModalItemCostTotal');
        if (costTotalEl) costTotalEl.textContent = this.formatCurrency(item.costTotal);
        this.renderQuotesTable(item.quotes);

        if (!this.quotesModal) {
            const modalEl = document.getElementById('quotesModal');
            if (modalEl && window.bootstrap) {
                this.quotesModal = new bootstrap.Modal(modalEl);
            }
        }
        if (this.quotesModal) this.quotesModal.show();
    },

    renderQuotesTable(quotes) {
        const tbody = document.getElementById('quotesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        quotes.forEach((q, idx) => {
            const tr = document.createElement('tr');
            tr.id = `quote-row-${idx}`;
            tr.innerHTML = `
                <td class="text-center align-middle">
                    <input type="radio" name="selectedQuoteRadio" value="${idx}" class="form-check-input" ${q.selected ? 'checked' : ''} onchange="App.selectQuoteRow(${idx})">
                </td>
                <td class="text-center align-middle fw-bold text-muted">${idx + 1}</td>
                <td>
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control form-input-compact vendor-name-display q-vendor-name" value="${q.vendorName || ''}" 
                               placeholder="請選擇廠商..." readonly onclick="App.openVendorModalForQuoteRow(${idx})" style="cursor: pointer; background-color: #fff;">
                        <button class="btn btn-outline-secondary" type="button" onclick="App.openVendorModalForQuoteRow(${idx})" title="選擇建議廠商">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <input type="number" class="form-control form-input-compact text-end fw-bold q-amount" value="${q.amount !== null && q.amount !== undefined ? q.amount : ''}" placeholder="0">
                </td>
                <td>
                    <input type="text" class="form-control form-input-compact q-note" value="${q.note || ''}" placeholder="備註或遴選理由...">
                </td>
                <td class="text-center align-middle">
                    <button class="btn btn-sm btn-outline-danger border-0" type="button" onclick="App.removeQuoteRow(${idx})" title="刪除此筆">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    openVendorModalForQuoteRow(rowIndex) {
        this.currentQuoteRowIndex = rowIndex;
        this.openVendorModal(this.selectedTargetItemId);
    },

    addQuoteRow() {
        const tbody = document.getElementById('quotesTableBody');
        if (!tbody) return;
        const idx = tbody.children.length;
        const tr = document.createElement('tr');
        tr.id = `quote-row-${idx}`;
        tr.innerHTML = `
            <td class="text-center align-middle">
                <input type="radio" name="selectedQuoteRadio" value="${idx}" class="form-check-input" ${idx === 0 ? 'checked' : ''}>
            </td>
            <td class="text-center align-middle fw-bold text-muted">${idx + 1}</td>
            <td>
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-input-compact vendor-name-display q-vendor-name" value="" 
                           placeholder="請選擇廠商..." readonly onclick="App.openVendorModalForQuoteRow(${idx})" style="cursor: pointer; background-color: #fff;">
                    <button class="btn btn-outline-secondary" type="button" onclick="App.openVendorModalForQuoteRow(${idx})" title="選擇建議廠商">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-input-compact text-end fw-bold q-amount" value="" placeholder="0">
            </td>
            <td>
                <input type="text" class="form-control form-input-compact q-note" value="" placeholder="備註...">
            </td>
            <td class="text-center align-middle">
                <button class="btn btn-sm btn-outline-danger border-0" type="button" onclick="App.removeQuoteRow(${idx})" title="刪除">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    },

    removeQuoteRow(idx) {
        const row = document.getElementById(`quote-row-${idx}`);
        if (row) row.remove();
        // 重編項次號碼
        const rows = document.querySelectorAll('#quotesTableBody tr');
        rows.forEach((r, i) => {
            r.id = `quote-row-${i}`;
            const idxCell = r.children[1];
            if (idxCell) idxCell.textContent = i + 1;
            const radio = r.querySelector('input[type="radio"]');
            if (radio) { radio.value = i; radio.setAttribute('onchange', `App.selectQuoteRow(${i})`); }
            const btn = r.querySelector('.btn-outline-secondary');
            if (btn) btn.setAttribute('onclick', `App.openVendorModalForQuoteRow(${i})`);
            const delBtn = r.querySelector('.btn-outline-danger');
            if (delBtn) delBtn.setAttribute('onclick', `App.removeQuoteRow(${i})`);
        });
    },

    selectQuoteRow(idx) {
        // 選取 Radio 時之反應，確定時會讀取選中的這列
    },

    confirmQuotesSelection() {
        const rows = document.querySelectorAll('#quotesTableBody tr');
        const quotes = [];
        let selectedQuote = null;

        rows.forEach((r, i) => {
            const radio = r.querySelector('input[type="radio"]');
            const nameInput = r.querySelector('.q-vendor-name');
            const amtInput = r.querySelector('.q-amount');
            const noteInput = r.querySelector('.q-note');

            const isSelected = radio ? radio.checked : false;
            const vendorName = nameInput ? nameInput.value.trim() : '';
            const amount = amtInput && amtInput.value !== '' ? parseFloat(amtInput.value) : null;
            const note = noteInput ? noteInput.value.trim() : '';

            const qObj = { vendorName, amount, selected: isSelected, note };
            quotes.push(qObj);

            if (isSelected) {
                selectedQuote = qObj;
            }
        });

        // 找到目標品項儲存 quotes 並把遴選出來的廠商與金額帶回主表格
        if (this.selectedTargetItemId) {
            const item = this.items.find(i => i.id === this.selectedTargetItemId);
            if (item) {
                item.quotes = quotes;
                if (selectedQuote && selectedQuote.vendorName && selectedQuote.amount !== null && !isNaN(selectedQuote.amount)) {
                    item.vendorName = selectedQuote.vendorName;
                    item.vendorAmt = selectedQuote.amount;
                    item.budgetAmt = selectedQuote.amount;
                } else {
                    item.vendorName = '';
                    item.vendorAmt = null;
                    item.budgetAmt = null;
                }
            }
            this.renderAllData();
        }

        if (this.quotesModal) this.quotesModal.hide();
    },

    // 匯出預算執行表 (Excel 試算表，完全依照 R14 啟用範本格式)
    exportBudgetTable() {
        if (typeof XLSX === 'undefined') {
            alert('系統正在載入 Excel 匯出模組，請稍後再試！');
            return;
        }

        const wb = XLSX.utils.book_new();

        // 1. 計算總表各數據
        let catData = {};
        let maxRows = 0;
        let totalCostAll = 0;
        let totalBudget = 0;
        let totalActual = 0;

        const catKeys = ['cat-mat', 'cat-lab', 'cat-dir', 'cat-mfg', 'cat-eng'];

        this.categories.forEach(cat => {
            const topLevelItems = this.items.filter(i => i.categoryId === cat.id);
            let catBase = 0;
            let catBudget = 0;
            let catActual = 0;

            topLevelItems.forEach(item => {
                this.recalcParentSums(item);
                catBase += (item.costTotal || 0);
                catBudget += (item.budgetAmt || 0);
                catActual += (item.actualAmt || 0);
            });

            catData[cat.id] = { items: topLevelItems, subCost: catBase, subBudget: catBudget, subActual: catActual };
            maxRows = Math.max(maxRows, topLevelItems.length);

            totalCostAll += catBase;
            totalBudget += catBudget;
            totalActual += catActual;
        });

        const indirectBudget = this.contractAmount * INDIRECT_BUDGET_RATIO;
        const indirectActual = 0;
        totalBudget += indirectBudget;
        totalActual += indirectActual;

        const contractAmt = this.contractAmount || 0;
        const grossProfit = contractAmt - totalBudget;
        const grossMargin = contractAmt > 0 ? (grossProfit / contractAmt) * 100 : 0;

        // ============================================================
        // Sheet 1: 總表
        // ============================================================
        const summaryRows = [
            ["良聯工業股份有限公司\n預算執行表"],
            ["工程案號：", this.projectId || '', "", "業　主：", this.clientName || '', "", "", "工程名稱：", this.projectName || '', "", "", "", "", "", "", "訂製數量：", "1 套"],
            ["合約金額(A)：", contractAmt, "", "預算總額(B)：", totalBudget, "", "預算毛利(C=A-B)：", grossProfit, "", "預算毛利率(D=C/A)：", this.formatPercent(grossMargin), "", "預算編製日：", new Date().toISOString().slice(0, 10), "", "來源：", this.negotiationSource || '議價作業彙整'],
            [],
            ["(a)材料預算", "", "", "(b)人工預算", "", "", "(c)直接費用", "", "", "(d)外包加工", "", "", "(e)外包工程", "", "", "總計", ""],
            ["項目", "預算", "實際", "項目", "預算", "實際", "項目", "預算", "實際", "項目", "預算", "實際", "項目", "預算", "實際", "預算", "實際"]
        ];

        for (let i = 0; i < maxRows; i++) {
            let r = [];
            let rowBudgetSum = 0;
            let rowActualSum = 0;

            catKeys.forEach(k => {
                let item = catData[k].items[i];
                if (item) {
                    let b = item.budgetAmt || 0;
                    let a = item.actualAmt || 0;
                    rowBudgetSum += b;
                    rowActualSum += a;
                    r.push(item.spec || '', b, a);
                } else {
                    r.push('', '', '');
                }
            });
            r.push(rowBudgetSum, rowActualSum);
            summaryRows.push(r);
        }

        // 小計列
        summaryRows.push([
            "小計", catData['cat-mat'].subBudget, catData['cat-mat'].subActual,
            "", catData['cat-lab'].subBudget, catData['cat-lab'].subActual,
            "", catData['cat-dir'].subBudget, catData['cat-dir'].subActual,
            "", catData['cat-mfg'].subBudget, catData['cat-mfg'].subActual,
            "", catData['cat-eng'].subBudget, catData['cat-eng'].subActual,
            "", totalBudget, totalActual
        ]);

        // 佔合約%
        summaryRows.push([
            "佔合約%",
            contractAmt > 0 ? catData['cat-mat'].subBudget / contractAmt : 0,
            contractAmt > 0 ? catData['cat-mat'].subActual / contractAmt : 0,
            "",
            contractAmt > 0 ? catData['cat-lab'].subBudget / contractAmt : 0,
            contractAmt > 0 ? catData['cat-lab'].subActual / contractAmt : 0,
            "",
            contractAmt > 0 ? catData['cat-dir'].subBudget / contractAmt : 0,
            contractAmt > 0 ? catData['cat-dir'].subActual / contractAmt : 0,
            "",
            contractAmt > 0 ? catData['cat-mfg'].subBudget / contractAmt : 0,
            contractAmt > 0 ? catData['cat-mfg'].subActual / contractAmt : 0,
            "",
            contractAmt > 0 ? catData['cat-eng'].subBudget / contractAmt : 0,
            contractAmt > 0 ? catData['cat-eng'].subActual / contractAmt : 0,
            "",
            contractAmt > 0 ? totalBudget / contractAmt : 0,
            contractAmt > 0 ? totalActual / contractAmt : 0
        ]);

        // 預算-實際
        summaryRows.push([
            "預算-實際", catData['cat-mat'].subBudget - catData['cat-mat'].subActual, "",
            "預算-實際", catData['cat-lab'].subBudget - catData['cat-lab'].subActual, "",
            "預算-實際", catData['cat-dir'].subBudget - catData['cat-dir'].subActual, "",
            "預算-實際", catData['cat-mfg'].subBudget - catData['cat-mfg'].subActual, "",
            "預算-實際", catData['cat-eng'].subBudget - catData['cat-eng'].subActual, "",
            "預算-實際", totalBudget - totalActual, ""
        ]);

        // 間接費用
        summaryRows.push([
            "(f) 間接費用(分攤金額)", "", "預算：", indirectBudget, "實際：", indirectActual,
            "預算-實際：", indirectBudget - indirectActual, "預算佔合約(%)：",
            contractAmt > 0 ? indirectBudget / contractAmt : 0
        ]);

        // 總計列
        summaryRows.push([
            "總計：", "", "預算：", totalBudget, "實際：", totalActual,
            "預算-實際：", totalBudget - totalActual,
            "實際/預算：", totalBudget > 0 ? totalActual / totalBudget : 0,
            "實際/合約：", contractAmt > 0 ? totalActual / contractAmt : 0
        ]);

        summaryRows.push([]);
        summaryRows.push(["總經理：", "", "", "副總經理：", "", "", "事業處主管：", "", "", "專案經理：", "", "", "承辦：", "", ""]);
        summaryRows.push(["※作業流程：承辦人 → 主管 → 成本管理部主管 → 專案經理 → 事業處主管 → 副總經理 → 總經理 → 成本管理部(存)\n  分發：成本管理部、專案經理、財務部"]);

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
        wsSummary['!gridlines'] = true;
        wsSummary['!views'] = [{ showGridLines: true }];
        for (let cellKey in wsSummary) {
            if (cellKey[0] !== '!') {
                if (!wsSummary[cellKey].s) wsSummary[cellKey].s = {};
                wsSummary[cellKey].s.border = {
                    top: { style: 'thin', color: { auto: 1 } },
                    bottom: { style: 'thin', color: { auto: 1 } },
                    left: { style: 'thin', color: { auto: 1 } },
                    right: { style: 'thin', color: { auto: 1 } }
                };
            }
        }
        XLSX.utils.book_append_sheet(wb, wsSummary, '總表');

        // ============================================================
        // Sheet 2~6: 各科目細項明細表
        // ============================================================
        const catTitles = {
            'cat-mat': { sheetName: '材料明細表', title: '材料預算執行表' },
            'cat-lab': { sheetName: '人工明細表', title: '人工預算執行表' },
            'cat-dir': { sheetName: '直接費用明細表', title: '直接費用預算執行表' },
            'cat-mfg': { sheetName: '外包加工明細表', title: '外包加工預算執行表' },
            'cat-eng': { sheetName: '外包工程明細表', title: '外包工程預算執行表' }
        };

        this.categories.forEach(cat => {
            const info = catTitles[cat.id] || { sheetName: cat.name, title: `${cat.name}執行表` };
            const topLevelItems = catData[cat.id].items;

            const detailRows = [
                [`良聯工業股份有限公司\n${info.title}`],
                ["案號：", this.projectId || '', "", "業主：", this.clientName || '', "", "工程名稱：", this.projectName || ''],
                ["項次", "", "成本代碼", "在建會科", "材料編號", "規格及內容", "單位", "數量", "原始估算", "", "廠商報價", "", "預算金額", "實際執行金額", "備註"],
                ["", "", "", "", "", "", "", "", "(成本)單價", "(成本)總價", "金額", "廠商名稱", "", "", ""]
            ];

            let pSeq = 0;
            topLevelItems.forEach(item => {
                pSeq++;
                // 父項列 (會科彙整層)
                detailRows.push([
                    pSeq,
                    "",
                    "-",
                    item.accountCode || '',
                    "-",
                    item.spec || '',
                    item.unit || '式',
                    item.qty || 1,
                    "-",
                    item.costTotal || 0,
                    item.vendorAmt || 0,
                    item.vendorName || '',
                    item.budgetAmt || 0,
                    item.actualAmt || 0,
                    item.remark || ''
                ]);

                // 子細項列 (若有子項)
                if (item.children && item.children.length > 0) {
                    item.children.forEach((c, cIdx) => {
                        detailRows.push([
                            "",
                            `${pSeq}.${cIdx + 1}`,
                            c.costCode || '',
                            c.accountCode || '',
                            c.matNo || '',
                            c.spec || '',
                            c.unit || '',
                            c.qty || 0,
                            c.price || 0,
                            c.costTotal || 0,
                            "",
                            "",
                            "",
                            c.actualAmt || 0,
                            c.remark || ''
                        ]);
                    });
                }
            });

            // 科目小計
            detailRows.push([
                "", "", "", "", "", "", "", "", "小計",
                catData[cat.id].subCost,
                "", "",
                catData[cat.id].subBudget,
                catData[cat.id].subActual,
                ""
            ]);

            detailRows.push([]);
            detailRows.push(["總經理：                 副總經理：                 事業處主管：                 專案經理：                 承辦人(編製)："]);
            detailRows.push(["執行單位：□成本管理部一份　　□專案經理一份　　□財務部一份"]);
            detailRows.push(["備註：『實際執行金額』欄由專案工程師填寫，餘由業務承辦人填寫。\n\n※作業流程：承辦人 → 主管 → 成本管理部主管 → 專案經理 → 事業處主管 → 副總經理 → 總經理 → 成本管理部(存)"]);

            const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
            wsDetail['!gridlines'] = true;
            wsDetail['!views'] = [{ showGridLines: true }];
            for (let cellKey in wsDetail) {
                if (cellKey[0] !== '!') {
                    if (!wsDetail[cellKey].s) wsDetail[cellKey].s = {};
                    wsDetail[cellKey].s.border = {
                        top: { style: 'thin', color: { auto: 1 } },
                        bottom: { style: 'thin', color: { auto: 1 } },
                        left: { style: 'thin', color: { auto: 1 } },
                        right: { style: 'thin', color: { auto: 1 } }
                    };
                }
            }
            XLSX.utils.book_append_sheet(wb, wsDetail, info.sheetName);
        });

        const fileName = `${this.projectId || 'PRJ'}_預算執行表_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }
};

App.lockBaseline = function() {
    if(confirm("確定要送簽並發布預算執行表嗎？\n鎖定後將無法再修改預算資料！")) {
        this.isLocked = true;
        this.renderAllData();
        document.getElementById('btnLock').disabled = true;
        
        const statusBadge = document.getElementById('projectStatus');
        statusBadge.className = 'badge bg-white text-success border border-success';
        statusBadge.innerHTML = '<i class="fas fa-lock me-1"></i>預算已送簽定案';
        
        alert("✅ 發包預算已正式鎖定並拋轉至採購與成本控制系統！");
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());