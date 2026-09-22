// negotiation.js - 議價彙整頁面
// 結構直接比照投標資料彙整（integration.js），移除原本的折讓層機制（整案讓利、逐項議價金額、
// 低於成本防呆），改為「退回估算基礎修訂明細」的版本模型：
//   品項估算版本 A1/A2/A3…（單一品項，cost-detail／eng-detail 工作台每次修訂 +1）
//   投標版次 B2（整案快照，記錄每個品項當下的 A 版本，完成彙總時產生，不可變）
//   議價版次 D1/D2…（整案快照，記錄每個品項當下的 A 版本＋基礎投標版次，鎖定本輪時產生，不可變）

document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 0. 模擬「投標版次 B2」鎖定當下的資料
    //    （對應投標資料彙整頁面「完成彙總」鎖定的快照；C003 示範「投標前已修過一次」= A2）
    // ==========================================
    const mockProjectData = {
        name: "台積電 P3 廠廢氣處理設備新建工程",
        quoteId: "EQ25090001",
        bidVersion: "B1",
        costEstimates: [
            {
                id: "C001", itemName: "洗滌塔新建工程", equipId: "EQ-S01", equipName: "洗滌塔", execUnit: "成本部", estimator: "林建國", status: "locked", version: "A1",
                baseCost: 1500000, indAmt: 30000, profAmt: 153000, riskAmt: 33660, negAmt: 0, grandTotal: 1716660,
                details: [
                    { name: "鋼板(9t)", category: "專案材料", material: "SS400", unit: "kg", qty: 2500, finalUnitPrice: 515, finalTotal: 1287500, note: "主體材料" },
                    { name: "法蘭 20K", category: "專案材料", material: "SUS304", unit: "pcs", qty: 4, finalUnitPrice: 21500, finalTotal: 86000, note: "進口件" },
                    { name: "冷作工", category: "專案製造", material: "-", unit: "工", qty: 40, finalUnitPrice: 8579, finalTotal: 343160, note: "含所有間接利潤" }
                ]
            },
            {
                id: "C002", itemName: "管線與閥件配置", equipId: "EQ-P01", equipName: "排氣管線", execUnit: "成本部", estimator: "王大明", status: "locked", version: "A1",
                baseCost: 800000, indAmt: 16000, profAmt: 81600, riskAmt: 17952, negAmt: 0, grandTotal: 915552,
                details: [
                    { name: "排氣管", category: "專案材料", material: "PVC", unit: "m", qty: 100, finalUnitPrice: 5000, finalTotal: 500000, note: "" },
                    { name: "彎頭/閥件", category: "專案材料", material: "PVC", unit: "式", qty: 1, finalUnitPrice: 215552, finalTotal: 215552, note: "" },
                    { name: "配管工資", category: "專案製造", material: "-", unit: "工", qty: 40, finalUnitPrice: 5000, finalTotal: 200000, note: "" }
                ]
            },
            {
                id: "C003", itemName: "控制盤與儀表採購", equipId: "EQ-E01", equipName: "電控系統", execUnit: "成本部", estimator: "張曉華", status: "locked", version: "A2",
                baseCost: 450000, indAmt: 9000, profAmt: 45900, riskAmt: 10098, negAmt: 0, grandTotal: 514998,
                details: [
                    { name: "PLC控制盤", category: "專案材料", material: "SUS304", unit: "面", qty: 1, finalUnitPrice: 400000, finalTotal: 400000, note: "" },
                    { name: "傳感器儀表", category: "專案材料", material: "-", unit: "組", qty: 5, finalUnitPrice: 22999.6, finalTotal: 114998, note: "" }
                ]
            },
            {
                id: "C004", itemName: "人力間接成本", equipId: "-", equipName: "間接費用", execUnit: "成本部", estimator: "林建國", status: "locked", version: "A1",
                baseCost: 150000, indAmt: 3000, profAmt: 3000, riskAmt: 3000, negAmt: 0, grandTotal: 159000,
                details: [
                    { name: "專案繪圖設計工程師", category: "間接人力", material: "-", unit: "月", qty: 1, finalUnitPrice: 80000, finalTotal: 80000, note: "一個月工時" },
                    { name: "機電整合人員", category: "間接人力", material: "-", unit: "工", qty: 10, finalUnitPrice: 7000, finalTotal: 70000, note: "協助支援" }
                ]
            }
        ],
        engEstimates: [
            {
                id: "E001", itemName: "洗滌塔新建工程", location: "台積電 P3 廠 1F 無塵室", execUnit: "建造部", estimator: "陳志強", status: "locked", version: "A1",
                baseCost: 1200000, indAmt: 24000, profAmt: 122400, riskAmt: 26928, negAmt: 0, grandTotal: 1373328,
                details: [
                    { name: "25T 吊車", category: "專案製造", material: "-", unit: "車", qty: 5, finalUnitPrice: 30000, finalTotal: 150000, note: "現場吊裝" },
                    { name: "吊裝工資", category: "專案製造", material: "-", unit: "工", qty: 30, finalUnitPrice: 6000, finalTotal: 180000, note: "" },
                    { name: "現場安裝工資", category: "專案製造", material: "-", unit: "工", qty: 150, finalUnitPrice: 6955.52, finalTotal: 1043328, note: "" }
                ]
            },
            {
                id: "E002", itemName: "現場配管與佈線外包", location: "台積電 P3 廠 1F 無塵室", execUnit: "建造部", estimator: "李小華", status: "locked", version: "A1",
                baseCost: 850000, indAmt: 17000, profAmt: 86700, riskAmt: 19074, negAmt: 0, grandTotal: 972774,
                details: [
                    { name: "配管外包工程", category: "專案外包工程", material: "-", unit: "式", qty: 1, finalUnitPrice: 600000, finalTotal: 600000, note: "" },
                    { name: "電控佈線工程", category: "專案外包工程", material: "-", unit: "式", qty: 1, finalUnitPrice: 372774, finalTotal: 372774, note: "" }
                ]
            },
            {
                id: "E003", itemName: "試車、檢驗與驗收", location: "台積電 P3 廠 1F 無塵室", execUnit: "建造部", estimator: "黃雅婷", status: "locked", version: "A1",
                baseCost: 300000, indAmt: 6000, profAmt: 30600, riskAmt: 6732, negAmt: 0, grandTotal: 343332,
                details: [
                    { name: "系統試車費用", category: "專案費用", material: "-", unit: "式", qty: 1, finalUnitPrice: 200000, finalTotal: 200000, note: "" },
                    { name: "第三方檢驗報告", category: "專案費用", material: "-", unit: "份", qty: 1, finalUnitPrice: 143332, finalTotal: 143332, note: "含公證費" }
                ]
            },
            {
                id: "E004", itemName: "工程間接成本", location: "全廠區", execUnit: "建造部", estimator: "洪鋒文", status: "locked", version: "A1",
                baseCost: 450000, indAmt: 9000, profAmt: 9000, riskAmt: 9000, negAmt: 0, grandTotal: 486000,
                details: [
                    { name: "專案經理", category: "管理人員", material: "-", unit: "月", qty: 2, finalUnitPrice: 105000, finalTotal: 210000, note: "含食宿津貼" },
                    { name: "工安 (HSE)", category: "管理人員", material: "-", unit: "月", qty: 2, finalUnitPrice: 65000, finalTotal: 130000, note: "" },
                    { name: "辦公室物品", category: "臨時辦公室", material: "-", unit: "式", qty: 1, finalUnitPrice: 110000, finalTotal: 110000, note: "行政與雜支" }
                ]
            }
        ]
    };

    // ==========================================
    // 1. 全域狀態
    // ==========================================
    window.bidData = JSON.parse(JSON.stringify(mockProjectData)); // 投標版次快照，全程不可變
    window.bidItemVersions = {}; // { itemId: 'A1' } 投標版次鎖定當下，每個品項的 A 版本
    [...window.bidData.costEstimates, ...window.bidData.engEstimates].forEach(item => {
        window.bidItemVersions[item.id] = item.version;
    });

    window.workingData = JSON.parse(JSON.stringify(mockProjectData)); // 議價工作副本，可編輯
    // 保留每個品項的加成費率（indAmt/profAmt/riskAmt 佔 baseCost 的比例），修訂 baseCost 時依同比例重算
    [...window.workingData.costEstimates, ...window.workingData.engEstimates].forEach(item => {
        item.indRate = item.baseCost > 0 ? item.indAmt / item.baseCost : 0;
        item.profRate = item.baseCost > 0 ? item.profAmt / item.baseCost : 0;
        item.riskRate = item.baseCost > 0 ? item.riskAmt / item.baseCost : 0;
        item.totalHours = calculateTotalHours(item.details);
    });

    window.negotiationVersions = []; // 已鎖定的議價版次快照陣列
    window.currentVersionNo = 1;      // 目前議價版次號碼（D1、D2…）
    window.isLocked = false;          // 目前議價版次是否已鎖定

    initNegotiationPage();
});

// ==========================================
// 2. 初始化
// ==========================================
function initNegotiationPage() {
    // 投標版次以 URL 參數為主（由投標資料彙整「完成彙總」時傳入），
    // 沒有參數時（例如獨立測試開啟）才使用本頁預設的模擬資料版次，
    // 避免兩頁各自寫死版次字串、日後其中一邊改了版次規則卻忘記同步更新另一邊。
    const urlParams = new URLSearchParams(window.location.search);
    const bidVersionParam = urlParams.get('bidVersion');
    if (bidVersionParam) window.bidData.bidVersion = bidVersionParam;

    document.getElementById('quoteId').value = window.bidData.quoteId;
    document.getElementById('projectName').value = window.bidData.name;
    const headerBidVersionEl = document.getElementById('headerBidVersion');
    if (headerBidVersionEl) headerBidVersionEl.textContent = '投標版次：' + window.bidData.bidVersion;
    document.getElementById('baseVersionText').textContent = window.bidData.bidVersion;

    setupBackButton();
    renderCostTable();
    renderEngTable();
    calculateTotals();
    updateVersionUI();
}

function setupBackButton() {
    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get('quoteId') || urlParams.get('id');
    if (quoteId) document.getElementById('quoteId').value = quoteId;

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.href = quoteId
            ? `../bid-integration/index.html?quoteId=${quoteId}`
            : "javascript:history.back()";
    }
}

// ==========================================
// 3. 輔助函數（沿用投標彙整既有邏輯）
// ==========================================
function calculateTotalHours(details) {
    let hours = 0;
    if (!details) return 0;
    details.forEach(d => {
        if (d.unit === '工') hours += d.qty * 8;
        else if (d.unit === '月' && (d.category.includes('人員') || d.category.includes('人力'))) hours += d.qty * 160;
        else if (d.unit === 'hr' || d.unit === '小時') hours += d.qty;
    });
    return hours;
}

function calcPct(amount, base) {
    if (!base || base === 0) return '0.0%';
    return ((amount / base) * 100).toFixed(1) + '%';
}

function formatCurrency(number) {
    if (isNaN(number)) return "0";
    return new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0 }).format(Math.round(number));
}

function formatNumber(number) {
    if (isNaN(number)) return "0";
    return new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(number);
}

// ==========================================
// 4. 表格渲染（欄位結構比照投標資料彙整，項次後新增「版次」欄）
// ==========================================
function renderCostTable() { renderTable('cost'); }
function renderEngTable() { renderTable('eng'); }

function renderTable(type) {
    const list = type === 'cost' ? window.workingData.costEstimates : window.workingData.engEstimates;
    const tbody = document.getElementById(type === 'cost' ? 'costTableBody' : 'engTableBody');
    let html = '';

    list.forEach((item, i) => {
        const bidVersion = window.bidItemVersions[item.id];
        const isRevised = item.version !== bidVersion;
        const versionChipClass = isRevised ? 'version-chip revised' : 'version-chip';
        const revisedDot = isRevised
            ? `<span class="revised-dot" title="議價階段已修訂（投標當時為 ${bidVersion}）"></span>`
            : '';

        const isItemLocked = item.status === 'locked';
        const statusBadge = isItemLocked
            ? '<span class="badge bg-success bg-opacity-10 text-success border border-success">已鎖定</span>'
            : '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning">編修中</span>';

        const identityCols = type === 'cost'
            ? `<td>${item.equipId || '-'}</td><td>${item.equipName || '-'}</td>`
            : `<td>${item.location || '-'}</td>`;

        html += `
            <tr>
                <td class="text-center sticky-col">
                    <div class="d-flex justify-content-center gap-1">
                        <button class="btn-sort text-primary" style="border-color: #bfdbfe; background: #eff6ff;" onclick="openEstimationDetail('${type}','${item.id}')" title="檢視工作台 (唯讀)">
                            <i class="fas fa-search"></i>
                        </button>
                        ${isItemLocked && !window.isLocked ? `
                        <button class="btn-sort text-danger" style="border-color: #fecaca; background: #fef2f2;" onclick="returnForRevision('${type}', ${i})" title="退回重編解鎖">
                            <i class="fas fa-unlock-alt"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
                <td class="text-center sticky-col fw-bold">${i + 1}</td>
                <td class="fw-bold">${item.itemName}</td>
                ${identityCols}
                <td>${item.execUnit}</td>
                <td>${item.estimator}</td>
                <td class="text-center">
                    <div class="version-cell">
                        <span class="${versionChipClass}">${item.version}</span>
                        ${revisedDot}
                    </div>
                </td>
                <td class="text-center align-middle">${statusBadge}</td>
                <td class="text-end text-secondary fw-semibold align-middle">${formatNumber(item.totalHours)}</td>
                <td class="text-end fw-semibold border-cost align-middle">${formatCurrency(item.baseCost)}</td>
                <td class="text-end col-indirect border-indirect">
                    <div>${formatCurrency(item.indAmt)}</div>
                    <div class="small opacity-75">${calcPct(item.indAmt, item.baseCost)}</div>
                </td>
                <td class="text-end col-profit border-profit">
                    <div>${formatCurrency(item.profAmt)}</div>
                    <div class="small opacity-75">${calcPct(item.profAmt, item.baseCost)}</div>
                </td>
                <td class="text-end col-risk border-risk">
                    <div>${formatCurrency(item.riskAmt)}</div>
                    <div class="small opacity-75">${calcPct(item.riskAmt, item.baseCost)}</div>
                </td>
                <td class="text-end col-neg border-neg">
                    <div>${formatCurrency(item.negAmt)}</div>
                    <div class="small opacity-75">${calcPct(item.negAmt, item.baseCost)}</div>
                </td>
                <td class="text-end col-total border-total fw-bold text-primary align-middle">${formatCurrency(item.grandTotal)}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 檢視工作台（唯讀）：與投標資料彙整完全相同的函式，直接開新分頁導向 cost-detail／eng-detail 工作台。
function openEstimationDetail(type, id) {
    const quoteId = document.getElementById('quoteId').value || 'EQ25090001';
    const list = type === 'cost' ? window.workingData.costEstimates : window.workingData.engEstimates;
    const item = list.find(i => i.id === id);
    const itemName = item ? item.itemName : '';

    let modulePath = '';
    if (type === 'cost') {
        modulePath = '../cost-detail/index.html';
    } else {
        modulePath = (id === 'E004') ? '../indirect-cost/index.html' : '../eng-detail/index.html';
    }

    const url = `${modulePath}?quoteId=${quoteId}&id=${id}&name=${encodeURIComponent(itemName)}&mode=readonly`;

    if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
        window.LiangLianSystem.showToast('正在開啟唯讀工作台...', 'info');
    }
    window.open(url, '_blank');
}

// 退回重編解鎖：與投標資料彙整完全相同的邏輯，只負責把該品項狀態解鎖為「編修中」，
// 實際修訂（含版次 +1）由 cost-detail／eng-detail 工作台完成後另外回寫，此頁不模擬編輯。
// 議價版次已鎖定時不可退回重編（需比照投標彙整「完成彙總」前才能退回的邏輯）。
function returnForRevision(type, index) {
    if (window.isLocked) {
        alert('本輪議價版次已鎖定，無法退回重編；如需繼續調整，請先確認議價版次狀態。');
        return;
    }
    const list = type === 'cost' ? window.workingData.costEstimates : window.workingData.engEstimates;
    const item = list[index];

    if (confirm(`確定要將「${item.itemName}」退回給 [${item.execUnit}] 重新編修嗎？\n\n注意：退回後，該單據將解除鎖定。在本單據重新完成前，您將無法鎖定本輪議價版次。`)) {
        item.status = 'revising';
        renderTable(type);

        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast(`已解鎖並退回 ${item.itemName} 給 ${item.execUnit}`, 'warning');
        }
    }
}

// ==========================================
// 5. 總計運算（沿用投標彙整既有邏輯，含議價%層）
// ==========================================
function calculateTotals() {
    let totals = {
        cost: { base: 0, ind: 0, prof: 0, risk: 0, neg: 0, grand: 0, hours: 0 },
        eng: { base: 0, ind: 0, prof: 0, risk: 0, neg: 0, grand: 0, hours: 0 },
        project: { base: 0, ind: 0, prof: 0, risk: 0, neg: 0, grand: 0, hours: 0 }
    };

    window.workingData.costEstimates.forEach(item => {
        totals.cost.base += item.baseCost || 0;
        totals.cost.ind += item.indAmt || 0;
        totals.cost.prof += item.profAmt || 0;
        totals.cost.risk += item.riskAmt || 0;
        totals.cost.neg += item.negAmt || 0;
        totals.cost.grand += item.grandTotal || 0;
        totals.cost.hours += item.totalHours || 0;
    });

    window.workingData.engEstimates.forEach(item => {
        totals.eng.base += item.baseCost || 0;
        totals.eng.ind += item.indAmt || 0;
        totals.eng.prof += item.profAmt || 0;
        totals.eng.risk += item.riskAmt || 0;
        totals.eng.neg += item.negAmt || 0;
        totals.eng.grand += item.grandTotal || 0;
        totals.eng.hours += item.totalHours || 0;
    });

    ['base', 'ind', 'prof', 'risk', 'neg', 'grand', 'hours'].forEach(k => {
        totals.project[k] = totals.cost[k] + totals.eng[k];
    });

    const updateDOM = (prefix, data) => {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set(`${prefix}BaseSubtotal`, formatCurrency(data.base));
        set(`${prefix}IndSubtotal`, formatCurrency(data.ind));
        set(`${prefix}IndPct`, calcPct(data.ind, data.base));
        set(`${prefix}ProfSubtotal`, formatCurrency(data.prof));
        set(`${prefix}ProfPct`, calcPct(data.prof, data.base));
        set(`${prefix}RiskSubtotal`, formatCurrency(data.risk));
        set(`${prefix}RiskPct`, calcPct(data.risk, data.base));
        set(`${prefix}NegSubtotal`, formatCurrency(data.neg));
        set(`${prefix}NegPct`, calcPct(data.neg, data.base));
        set(`${prefix}GrandSubtotal`, formatCurrency(data.grand));
        set(`${prefix}HoursSubtotal`, formatNumber(data.hours));
    };

    updateDOM('cost', totals.cost);
    updateDOM('eng', totals.eng);
    updateDOM('project', totals.project);

    // 頂部專案資訊卡片的彙總數字（比照估算價格檢討頁面的三個 amount-box）
    const setTop = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTop('projectTotalHoursDisplay', formatNumber(totals.project.hours));
    setTop('projectTotalCostDisplay', formatCurrency(totals.project.base));
    setTop('projectGrandTotal', formatCurrency(totals.project.grand));
}

// ==========================================
// 7. 議價版次管理（鎖定保護 + 狀態標示）
// ==========================================
function updateVersionUI() {
    const versionLabel = 'D' + window.currentVersionNo;

    // 頁首「議價版次」徽章目前已從頁面移除，這裡用 if-guard 保護，
    // 若日後版面重新加回對應元素，會自動恢復更新，不會因為找不到元素而整支函式中斷。
    const headerNegVersionEl = document.getElementById('headerNegVersion');
    if (headerNegVersionEl) {
        headerNegVersionEl.textContent = versionLabel;
        headerNegVersionEl.className = 'vvalue ' + (window.isLocked ? 'status-locked' : 'status-draft');
    }

    document.getElementById('currentVersionLabel').textContent = versionLabel;

    document.getElementById('lockedBanner').style.display = window.isLocked ? 'flex' : 'none';
    document.getElementById('lockedVersionText').textContent = versionLabel;
    document.getElementById('btnLockVersion').disabled = window.isLocked;
    document.getElementById('roundRemark').disabled = window.isLocked;

    renderVersionSelect();
}

// 議價版次下拉選單：比照估算價格檢討頁面的「版次」下拉選單樣式，放在專案資訊卡片內。
// 已鎖定的歷史版次以純數值顯示（比照估算頁 B1/B2 的呈現方式），目前進行中的版次額外標註「（進行中）」。
function renderVersionSelect() {
    const select = document.getElementById('versionSelect');
    if (!select) return;

    const lockedVersions = [...window.negotiationVersions].reverse();
    let html = '';
    lockedVersions.forEach(v => {
        html += `<option value="${v.versionNo}">D${v.versionNo}</option>`;
    });

    // 若目前版次已鎖定，且鎖定紀錄裡已經有同一個版號，就不再額外顯示「進行中」選項，
    // 避免下拉選單出現同一版次重複兩次（例如鎖定 D1 後，選單同時有「D1」與「D1（進行中）」）。
    const alreadyListedAsLocked = window.isLocked && lockedVersions.some(v => v.versionNo === window.currentVersionNo);
    if (alreadyListedAsLocked) {
        select.innerHTML = html;
        select.value = String(window.currentVersionNo);
    } else {
        const currentLabel = window.isLocked ? `D${window.currentVersionNo}` : `D${window.currentVersionNo}（進行中）`;
        html += `<option value="current" selected>${currentLabel}</option>`;
        select.innerHTML = html;
        select.value = 'current';
    }
}

function onNegVersionSelectChange(value) {
    if (value === 'current') return;
    viewVersionDetail(parseInt(value, 10));
    const select = document.getElementById('versionSelect');
    if (select) select.value = 'current';
}

function buildVersionSnapshotItems() {
    const items = [];
    ['cost', 'eng'].forEach(type => {
        const list = type === 'cost' ? window.workingData.costEstimates : window.workingData.engEstimates;
        list.forEach(item => {
            items.push({
                type, itemName: item.itemName, version: item.version,
                bidVersion: window.bidItemVersions[item.id],
                grandTotal: item.grandTotal
            });
        });
    });
    return items;
}

function viewVersionDetail(versionNo) {
    const v = window.negotiationVersions.find(x => x.versionNo === versionNo);
    if (!v) return;

    document.getElementById('versionViewTitle').textContent = `D${versionNo}`;

    const rows = v.items.map(it => `
        <tr>
            <td>${it.itemName}</td>
            <td class="text-center">${it.type === 'cost' ? '成本估算' : '工程估算'}</td>
            <td class="text-center">${it.version}${it.version !== it.bidVersion ? ' <span class="version-chip revised">已修訂</span>' : ''}</td>
            <td class="text-end">${formatCurrency(it.grandTotal)}</td>
        </tr>
    `).join('');

    document.getElementById('versionViewBody').innerHTML = `
        <div class="mb-3 p-3 bg-light rounded border">
            <div class="row g-2">
                <div class="col-md-4"><span class="text-muted small">鎖定日期：</span><span class="fw-bold">${v.date}</span></div>
                <div class="col-md-4"><span class="text-muted small">基礎投標版次：</span><span class="fw-bold">${window.bidData.bidVersion}</span></div>
                <div class="col-md-4"><span class="text-muted small">彙總金額：</span><span class="fw-bold text-primary">${formatCurrency(v.grandTotal)}</span></div>
            </div>
            <div class="mt-2"><span class="text-muted small">整體備註：</span>${v.remark || '（未填寫）'}</div>
        </div>
        <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle">
                <thead class="table-light">
                    <tr><th>項目名稱</th><th class="text-center">類別</th><th class="text-center">版次</th><th class="text-end">彙整金額</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('versionViewModal'));
    modal.show();
}

function lockNegotiationVersion() {
    if (window.isLocked) return;

    const hasRevisingCost = window.workingData.costEstimates.some(i => i.status === 'revising');
    const hasRevisingEng = window.workingData.engEstimates.some(i => i.status === 'revising');
    if (hasRevisingCost || hasRevisingEng) {
        alert('無法鎖定本輪議價版次！\n\n清單中尚有處於「編修中」的估算項目，請等候相關單位完成修訂並重新鎖定後，再執行此動作。');
        return;
    }

    const grandTotalText = document.getElementById('projectGrandTotal').textContent;
    if (!confirm(`確定要鎖定議價版次 D${window.currentVersionNo} 嗎？\n\n彙總金額：${grandTotalText}\n\n鎖定後本版次資料（含個別品項的退回重編）將全部唯讀，無法再調整。`)) {
        return;
    }

    const remark = document.getElementById('roundRemark').value.trim();
    const items = buildVersionSnapshotItems();
    const grandTotal = items.reduce((s, i) => s + i.grandTotal, 0);

    window.negotiationVersions.push({
        versionNo: window.currentVersionNo,
        date: formatDateTime(new Date()),
        remark: remark,
        items: items,
        grandTotal: grandTotal
    });

    window.isLocked = true;
    renderCostTable();
    renderEngTable();
    updateVersionUI();

    if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
        window.LiangLianSystem.showToast(`已鎖定議價版次 D${window.currentVersionNo}`, 'success');
    }
}

function formatDateTime(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ==========================================
// 8. 匯出報價單（沿用投標彙整既有匯出架構，版次改標示議價版次）
// ==========================================
function getMergedEstimates() {
    const mergedMap = new Map();
    const all = [...window.workingData.costEstimates, ...window.workingData.engEstimates];

    all.forEach(item => {
        const key = item.itemName;
        if (!mergedMap.has(key)) {
            mergedMap.set(key, { id: item.id, itemName: item.itemName, details: [], grandTotal: 0 });
        }
        const merged = mergedMap.get(key);
        merged.grandTotal += (item.grandTotal || 0);
        if (item.details && item.details.length > 0) merged.details.push(...item.details);
    });

    return Array.from(mergedMap.values());
}

function borderAll() {
    return {
        top: { style: 'thin', color: { rgb: "000000" } }, bottom: { style: 'thin', color: { rgb: "000000" } },
        left: { style: 'thin', color: { rgb: "000000" } }, right: { style: 'thin', color: { rgb: "000000" } }
    };
}

function exportQuotation() {
    if (!window.XLSX_STYLE_LOADED) {
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('首次匯出需載入報價單排版引擎，請稍候...', 'info');
        }
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
        script.onload = () => { window.XLSX_STYLE_LOADED = true; _executeExport(); };
        script.onerror = () => alert('載入樣式引擎失敗，請檢查網路連線。');
        document.head.appendChild(script);
    } else {
        _executeExport();
    }
}

function _executeExport() {
    try {
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('報價單準備匯出中...', 'info');
        }

        const quoteId = document.getElementById('quoteId').value || 'EQ25090001';
        const projName = document.getElementById('projectName').value || '報價單';
        const versionLabel = window.isLocked ? `D${window.currentVersionNo}` : `D${window.currentVersionNo}（進行中）`;
        const merged = getMergedEstimates();

        const wb = XLSX.utils.book_new();
        const sanitizeSheetName = (name) => name.replace(/[:\\/?*\[\]]/g, '_').substring(0, 31);

        const thStyle = { font: { sz: 11, bold: true, name: '標楷體' }, border: borderAll(), alignment: { horizontal: 'center', vertical: 'center' }, fill: { fgColor: { rgb: "F1F5F9" } } };
        const tdStyle = { font: { sz: 11, name: '標楷體' }, border: borderAll(), alignment: { vertical: 'center' } };
        const numStyle = { ...tdStyle, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '#,##0' };
        const qtyStyle = { ...tdStyle, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '#,##0.##' };
        const centerStyle = { ...tdStyle, alignment: { horizontal: 'center', vertical: 'center' } };
        const headerStyle = { font: { sz: 11, bold: true, name: '標楷體' }, alignment: { vertical: 'center' } };
        const titleStyle = { font: { sz: 16, bold: true, name: '標楷體' }, alignment: { horizontal: 'center', vertical: 'center' } };

        // ===== 彙總表 =====
        const summaryData = [];
        summaryData.push([{ v: '良聯工業股份有限公司 - 議價後報價彙總表', s: titleStyle }, {}, {}]);
        summaryData.push([{}, {}, {}]);
        summaryData.push([{ v: '項目名稱', s: thStyle }, { v: '議價後金額', s: thStyle }, { v: '備註', s: thStyle }]);
        let sumTotal = 0;
        merged.forEach(m => {
            summaryData.push([{ v: m.itemName, s: tdStyle }, { v: m.grandTotal, s: numStyle, t: 'n', z: '#,##0' }, { v: '', s: tdStyle }]);
            sumTotal += m.grandTotal;
        });
        summaryData.push([
            { v: '合計', s: { ...thStyle, alignment: { horizontal: 'right' } } },
            { v: sumTotal, s: { ...numStyle, font: { bold: true, name: '標楷體' } }, t: 'n', z: '#,##0' },
            { v: '', s: thStyle }
        ]);
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
        summaryWs['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, summaryWs, "報價彙總表");

        // ===== 各項目明細 =====
        merged.forEach((item, index) => {
            const wsData = [];
            const today = new Date();
            const dateStr = today.getFullYear() + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + String(today.getDate()).padStart(2, '0');

            wsData.push([{ v: '良聯工業股份有限公司 - 議價後報價單', s: titleStyle }, {}, {}, {}, {}, {}, {}]);
            wsData.push([{}, {}, {}, {}, {}, {}, {}]);
            wsData.push([
                { v: '專案名稱：', s: headerStyle }, { v: projName, s: { font: { name: '標楷體', sz: 11 } } }, {}, {},
                { v: '報價日期：', s: headerStyle }, { v: dateStr, s: { font: { name: '標楷體', sz: 11 } } }, {}
            ]);
            wsData.push([
                { v: '項目名稱：', s: headerStyle }, { v: item.itemName, s: { font: { name: '標楷體', sz: 11 } } }, {}, {},
                { v: '議價版次：', s: headerStyle }, { v: versionLabel, s: { font: { name: '標楷體', sz: 11 } } }, {}
            ]);
            wsData.push([{}, {}, {}, {}, {}, {}, {}]);
            wsData.push([
                { v: '項次', s: thStyle }, { v: '項目說明 (品名規格)', s: thStyle }, { v: '單位', s: thStyle },
                { v: '數量', s: thStyle }, { v: '單價 (NT$)', s: thStyle }, { v: '小計 (NT$)', s: thStyle }, { v: '備註', s: thStyle }
            ]);

            let rowCount = 0;
            if (item.details && item.details.length > 0) {
                item.details.forEach((d, idx) => {
                    let desc = d.name;
                    if (d.material && d.material !== '-') desc += ` (${d.material})`;
                    wsData.push([
                        { v: idx + 1, s: centerStyle, t: 'n' }, { v: desc, s: tdStyle }, { v: d.unit, s: centerStyle },
                        { v: d.qty, s: qtyStyle, t: 'n', z: '#,##0.##' },
                        { v: d.finalUnitPrice, s: numStyle, t: 'n', z: '#,##0' },
                        { v: d.finalTotal, s: numStyle, t: 'n', z: '#,##0' },
                        { v: d.note || '', s: tdStyle }
                    ]);
                    rowCount++;
                });
            }

            wsData.push([
                { v: '總計 (未稅)：', s: { ...thStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
                { v: '', s: thStyle }, { v: '', s: thStyle }, { v: '', s: thStyle }, { v: '', s: thStyle },
                { v: item.grandTotal, s: { ...thStyle, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '#,##0' }, t: 'n', z: '#,##0' },
                { v: '', s: thStyle }
            ]);

            wsData.push([{}, {}, {}, {}, {}, {}, {}]);
            wsData.push([{ v: '【備註事項】', s: headerStyle }, {}, {}, {}, {}, {}, {}]);
            wsData.push([{ v: '1. 本報價單由系統自動生成。', s: { font: { name: '標楷體', sz: 11 } } }, {}, {}, {}, {}, {}, {}]);
            wsData.push([{ v: '2. 以上報價未含 5% 加值營業稅。', s: { font: { name: '標楷體', sz: 11 } } }, {}, {}, {}, {}, {}, {}]);

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
                { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } },
                { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
                { s: { r: 6 + rowCount, c: 0 }, e: { r: 6 + rowCount, c: 4 } }
            ];
            ws['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 25 }];

            const sheetName = sanitizeSheetName(`${index + 1}_${item.itemName}`);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const today = new Date();
        const dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
        const fileName = `議價後報價單_${quoteId}_${dateStr}.xlsx`;
        XLSX.writeFile(wb, fileName);

        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('報價單匯出成功！', 'success');
        } else {
            alert('報價單匯出成功！');
        }
    } catch (error) {
        console.error('匯出報價單發生錯誤:', error);
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('匯出失敗，請查看主控台錯誤訊息。', 'error');
        } else {
            alert('匯出失敗，請聯絡系統管理員。');
        }
    }
}