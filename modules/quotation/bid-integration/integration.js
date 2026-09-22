// 當網頁載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    
    // 模擬包含「成本估算」與「工程估算」詳細列表的數據 
    const mockProjectData = {
        name: "台積電 P3 廠廢氣處理設備新建工程",
        version: "B1",
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
            // ★ 新增：人力間接成本
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

    initBidPage(mockProjectData);

    document.getElementById('versionSelect').addEventListener('change', function() {
        const badge = document.getElementById('headerVersionBadge');
        if (badge) badge.textContent = this.value;
    });
});

// ★ 新增功能：根據明細項自動換算為總工時 (以小時為單位)
function calculateTotalHours(details) {
    let hours = 0;
    if (!details) return 0;
    
    details.forEach(d => {
        if (d.unit === '工') {
            hours += d.qty * 8; // 假設 1 工 = 8 小時
        } else if (d.unit === '月' && (d.category.includes('人員') || d.category.includes('人力'))) {
            hours += d.qty * 160; // 假設 1 個月人力 = 160 小時
        } else if (d.unit === 'hr' || d.unit === '小時') {
            hours += d.qty;
        }
    });
    return hours;
}

// 負責把資料填入畫面的主函數
function initBidPage(data) {
    document.getElementById('projectName').value = data.name;
    // 頁首版次徽章（headerVersionBadge）目前已從頁面移除（版次改僅由下方 versionSelect 下拉選單呈現），
    // 這裡用 if-guard 保護，避免找不到元素時拋出錯誤、連帶讓後面的表格渲染跟總計都執行不到。
    const headerVersionBadgeEl = document.getElementById('headerVersionBadge');
    if (headerVersionBadgeEl) headerVersionBadgeEl.textContent = data.version;
    document.getElementById('versionSelect').value = data.version;

    // 將工時直接計算並綁定到項目中
    data.costEstimates.forEach(item => { item.totalHours = calculateTotalHours(item.details); });
    data.engEstimates.forEach(item => { item.totalHours = calculateTotalHours(item.details); });

    window.projectData = data;
    setupBackButton();
    renderCostTable();
    renderEngTable();
    calculateTotals();
}

function setupBackButton() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId') || urlParams.get('id');
    
    if (projectId) {
        document.getElementById('projectId').value = projectId;
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.href = `../project-dashboard/index.html?projectId=${projectId}`;
    } else {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.href = "javascript:history.back()";
    }
}

function calcPct(amount, base) {
    if (!base || base === 0) return '0.0%';
    return ((amount / base) * 100).toFixed(1) + '%';
}

function renderCostTable() {
    const tbody = document.getElementById('costTableBody');
    let html = '';
    
    window.projectData.costEstimates.forEach((item, i) => {
        const isLocked = item.status === 'locked';
        const statusBadge = isLocked 
            ? '<span class="badge bg-success bg-opacity-10 text-success border border-success">已鎖定</span>'
            : '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning">編修中</span>';

        html += `
            <tr>
                <td class="text-center sticky-col">
                    <div class="d-flex justify-content-center gap-1">
                        <button class="btn-sort text-primary" style="border-color: #bfdbfe; background: #eff6ff;" onclick="openEstimationDetail('cost', '${item.id}')" title="檢視工作台 (唯讀)">
                            <i class="fas fa-search"></i>
                        </button>
                        ${isLocked ? `
                        <button class="btn-sort text-danger" style="border-color: #fecaca; background: #fef2f2;" onclick="returnForRevision('cost', ${i})" title="退回重編解鎖">
                            <i class="fas fa-unlock-alt"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
                <td class="text-center sticky-col fw-bold">${i + 1}</td>
                <td class="fw-bold">${item.itemName}</td>
                <td>${item.equipId || '-'}</td>
                <td>${item.equipName || '-'}</td>
                <td>${item.execUnit}</td>
                <td>${item.estimator}</td>
                <td class="text-center">
                    <div class="version-cell">
                        <span class="version-chip">${item.version || '-'}</span>
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

function renderEngTable() {
    const tbody = document.getElementById('engTableBody');
    let html = '';
    
    window.projectData.engEstimates.forEach((item, i) => {
        const isLocked = item.status === 'locked';
        const statusBadge = isLocked 
            ? '<span class="badge bg-success bg-opacity-10 text-success border border-success">已鎖定</span>'
            : '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning">編修中</span>';

        html += `
            <tr>
                <td class="text-center sticky-col">
                    <div class="d-flex justify-content-center gap-1">
                        <button class="btn-sort text-primary" style="border-color: #bfdbfe; background: #eff6ff;" onclick="openEstimationDetail('eng', '${item.id}')" title="檢視工作台 (唯讀)">
                            <i class="fas fa-search"></i>
                        </button>
                        ${isLocked ? `
                        <button class="btn-sort text-danger" style="border-color: #fecaca; background: #fef2f2;" onclick="returnForRevision('eng', ${i})" title="退回重編解鎖">
                            <i class="fas fa-unlock-alt"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
                <td class="text-center sticky-col fw-bold">${i + 1}</td>
                <td class="fw-bold">${item.itemName}</td>
                <td>${item.location || '-'}</td>
                <td>${item.execUnit}</td>
                <td>${item.estimator}</td>
                <td class="text-center">
                    <div class="version-cell">
                        <span class="version-chip">${item.version || '-'}</span>
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

function openEstimationDetail(type, id) {
    const projectId = document.getElementById('projectId').value || 'EQ25090001';
    let modulePath = '';
    let itemName = '';

    if (type === 'cost') {
        modulePath = '../cost-detail/index.html';
        const item = window.projectData.costEstimates.find(i => i.id === id);
        if (item) itemName = item.itemName;
    } else {
        if (id === 'E004') {
            modulePath = '../indirect-cost/index.html';
        } else {
            modulePath = '../eng-detail/index.html';
        }
        const item = window.projectData.engEstimates.find(i => i.id === id);
        if (item) itemName = item.itemName;
    }
    
    const url = `${modulePath}?projectId=${projectId}&id=${id}&name=${encodeURIComponent(itemName)}&mode=readonly`;
    
    if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
        window.LiangLianSystem.showToast('正在開啟唯讀工作台...', 'info');
    }
    window.open(url, '_blank');
}

function returnForRevision(type, index) {
    const list = type === 'cost' ? window.projectData.costEstimates : window.projectData.engEstimates;
    const item = list[index];
    
    if(confirm(`確定要將「${item.itemName}」退回給 [${item.execUnit}] 重新編修嗎？\n\n注意：退回後，該單據將解除鎖定。在本單據重新完成前，您將無法執行「完成彙總」。`)) {
        item.status = 'revising';
        if (type === 'cost') renderCostTable();
        else renderEngTable();
        
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast(`已解鎖並退回 ${item.itemName} 給 ${item.execUnit}`, 'warning');
        }
    }
}

function calculateTotals() {
    let totals = {
        cost: { base: 0, ind: 0, prof: 0, risk: 0, neg: 0, grand: 0, hours: 0 },
        eng: { base: 0, ind: 0, prof: 0, risk: 0, neg: 0, grand: 0, hours: 0 },
        project: { base: 0, ind: 0, prof: 0, risk: 0, neg: 0, grand: 0, hours: 0 } 
    };

    window.projectData.costEstimates.forEach(item => {
        totals.cost.base += item.baseCost || 0;
        totals.cost.ind += item.indAmt || 0;
        totals.cost.prof += item.profAmt || 0;
        totals.cost.risk += item.riskAmt || 0;
        totals.cost.neg += item.negAmt || 0;
        totals.cost.grand += item.grandTotal || 0;
        totals.cost.hours += item.totalHours || 0;
    });

    window.projectData.engEstimates.forEach(item => {
        totals.eng.base += item.baseCost || 0;
        totals.eng.ind += item.indAmt || 0;
        totals.eng.prof += item.profAmt || 0;
        totals.eng.risk += item.riskAmt || 0;
        totals.eng.neg += item.negAmt || 0;
        totals.eng.grand += item.grandTotal || 0;
        totals.eng.hours += item.totalHours || 0;
    });

    totals.project.base = totals.cost.base + totals.eng.base;
    totals.project.ind = totals.cost.ind + totals.eng.ind;
    totals.project.prof = totals.cost.prof + totals.eng.prof;
    totals.project.risk = totals.cost.risk + totals.eng.risk;
    totals.project.neg = totals.cost.neg + totals.eng.neg;
    totals.project.grand = totals.cost.grand + totals.eng.grand;
    totals.project.hours = totals.cost.hours + totals.eng.hours;

    const updateDOM = (prefix, data) => {
        if(document.getElementById(`${prefix}BaseSubtotal`)) document.getElementById(`${prefix}BaseSubtotal`).textContent = formatCurrency(data.base);
        if(document.getElementById(`${prefix}IndSubtotal`)) document.getElementById(`${prefix}IndSubtotal`).textContent = formatCurrency(data.ind);
        if(document.getElementById(`${prefix}IndPct`)) document.getElementById(`${prefix}IndPct`).textContent = calcPct(data.ind, data.base);
        if(document.getElementById(`${prefix}ProfSubtotal`)) document.getElementById(`${prefix}ProfSubtotal`).textContent = formatCurrency(data.prof);
        if(document.getElementById(`${prefix}ProfPct`)) document.getElementById(`${prefix}ProfPct`).textContent = calcPct(data.prof, data.base);
        if(document.getElementById(`${prefix}RiskSubtotal`)) document.getElementById(`${prefix}RiskSubtotal`).textContent = formatCurrency(data.risk);
        if(document.getElementById(`${prefix}RiskPct`)) document.getElementById(`${prefix}RiskPct`).textContent = calcPct(data.risk, data.base);
        if(document.getElementById(`${prefix}NegSubtotal`)) document.getElementById(`${prefix}NegSubtotal`).textContent = formatCurrency(data.neg);
        if(document.getElementById(`${prefix}NegPct`)) document.getElementById(`${prefix}NegPct`).textContent = calcPct(data.neg, data.base);
        if(document.getElementById(`${prefix}GrandSubtotal`)) document.getElementById(`${prefix}GrandSubtotal`).textContent = formatCurrency(data.grand);
        if(document.getElementById(`${prefix}HoursSubtotal`)) document.getElementById(`${prefix}HoursSubtotal`).textContent = formatNumber(data.hours);
    };

    updateDOM('cost', totals.cost);
    updateDOM('eng', totals.eng);
    updateDOM('project', totals.project); 

    const projectTotalCostDisplay = document.getElementById('projectTotalCostDisplay');
    if (projectTotalCostDisplay) projectTotalCostDisplay.textContent = formatCurrency(totals.project.base);

    const projectTotalHoursDisplay = document.getElementById('projectTotalHoursDisplay');
    if (projectTotalHoursDisplay) projectTotalHoursDisplay.textContent = formatNumber(totals.project.hours);

    const grandTotalEl = document.getElementById('projectGrandTotal');
    if (grandTotalEl) grandTotalEl.textContent = formatCurrency(totals.project.grand);
}

function getMergedEstimates(projectData) {
    const mergedMap = new Map();
    const allEstimates = [...(projectData.costEstimates || []), ...(projectData.engEstimates || [])];

    allEstimates.forEach(item => {
        const key = item.itemName; 
        
        if (!mergedMap.has(key)) {
            mergedMap.set(key, {
                id: item.id, 
                itemName: item.itemName,
                details: [],
                grandTotal: 0
            });
        }
        
        const mergedItem = mergedMap.get(key);
        mergedItem.grandTotal += (item.grandTotal || 0); 
        
        if (item.details && item.details.length > 0) {
            mergedItem.details.push(...item.details);
        }
    });

    return Array.from(mergedMap.values());
}

function exportQuotation() {
    if (!window.XLSX_STYLE_LOADED) {
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('首次匯出需載入報價單排版引擎，請稍候...', 'info');
        }
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
        script.onload = () => {
            window.XLSX_STYLE_LOADED = true;
            _executeExternalExport();
        };
        script.onerror = () => {
            alert('載入樣式引擎失敗，請檢查網路連線。');
        };
        document.head.appendChild(script);
    } else {
        _executeExternalExport();
    }
}

function generateSummarySheet(projectData, mergedEstimates) {
    const wsData = [];
    
    const thStyle = { 
        font: { sz: 11, bold: true, name: '標楷體' }, 
        border: { top: {style:'thin', color: {rgb:"000000"}}, bottom: {style:'thin', color: {rgb:"000000"}}, left: {style:'thin', color: {rgb:"000000"}}, right: {style:'thin', color: {rgb:"000000"}} }, 
        alignment: { horizontal: 'center', vertical: 'center' }, 
        fill: { fgColor: { rgb: "F1F5F9" } } 
    };
    const tdStyle = { 
        font: { sz: 11, name: '標楷體' }, 
        border: { top: {style:'thin', color: {rgb:"000000"}}, bottom: {style:'thin', color: {rgb:"000000"}}, left: {style:'thin', color: {rgb:"000000"}}, right: {style:'thin', color: {rgb:"000000"}} }, 
        alignment: { vertical: 'center' } 
    };
    
    const numStyle = { ...tdStyle, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '#,##0' };
    const centerStyle = { ...tdStyle, alignment: { horizontal: 'center', vertical: 'center' } };
    const boldNumStyle = { ...numStyle, font: { bold: true, name: '標楷體', sz: 11 }, numFmt: '#,##0' };
    const boldTdStyle = { ...tdStyle, font: { bold: true, name: '標楷體', sz: 11 } };

    wsData.push([
        { v: '項目', s: thStyle },
        { v: '工號', s: thStyle },
        { v: '名稱', s: thStyle },
        { v: '材料費', s: thStyle },
        { v: '工資', s: thStyle },
        { v: '合計', s: thStyle }
    ]);

    let totalMat = 0, totalLabor = 0, totalGrand = 0;
    const subProjectRows = [];

    mergedEstimates.forEach((item, idx) => {
        let matCost = 0;
        
        if (item.details) {
            item.details.forEach(d => {
                if (d.category === '專案材料') {
                    matCost += d.finalTotal;
                }
            });
        }
        let laborCost = item.grandTotal - matCost;

        totalMat += matCost;
        totalLabor += laborCost;
        totalGrand += item.grandTotal;

        subProjectRows.push([
            { v: idx === 0 ? '子案' : '', s: centerStyle },
            { v: item.id || '', s: centerStyle },
            { v: item.itemName, s: tdStyle },
            { v: matCost, s: numStyle, t: 'n', z: '#,##0' },
            { v: laborCost, s: numStyle, t: 'n', z: '#,##0' },
            { v: item.grandTotal, s: numStyle, t: 'n', z: '#,##0' }
        ]);
    });

    const projId = document.getElementById('projectId').value || 'EQ25090001';

    wsData.push([
        { v: '母案', s: centerStyle },
        { v: projId, s: centerStyle },
        { v: projectData.name, s: tdStyle },
        { v: totalMat, s: numStyle, t: 'n', z: '#,##0' },
        { v: totalLabor, s: numStyle, t: 'n', z: '#,##0' },
        { v: totalGrand, s: numStyle, t: 'n', z: '#,##0' }
    ]);

    wsData.push(...subProjectRows);

    wsData.push([
        { v: '單位: 台幣', s: boldTdStyle },
        { v: '', s: tdStyle },
        { v: 'Total=', s: { ...boldTdStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: totalMat, s: boldNumStyle, t: 'n', z: '#,##0' },
        { v: totalLabor, s: boldNumStyle, t: 'n', z: '#,##0' },
        { v: totalGrand, s: boldNumStyle, t: 'n', z: '#,##0' }
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const merges = [];
    merges.push({ s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 1 } });
    if (subProjectRows.length > 1) {
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2 + subProjectRows.length - 1, c: 0 } });
    }
    ws['!merges'] = merges;

    ws['!cols'] = [
        { wch: 8 },  
        { wch: 15 }, 
        { wch: 40 }, 
        { wch: 15 }, 
        { wch: 15 }, 
        { wch: 15 }   
    ];

    return ws;
}

function _executeExternalExport() {
    try {
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('對外正式報價單準備匯出中...', 'info');
        }

        const projId = document.getElementById('projectId').value || '未命名專案';
        const projName = document.getElementById('projectName').value || '報價單';
        const version = document.getElementById('versionSelect').value || '';
        
        const mergedEstimates = getMergedEstimates(window.projectData);

        const wb = XLSX.utils.book_new();
        const sanitizeSheetName = (name) => name.replace(/[:\\/?*\[\]]/g, '_').substring(0, 31);

        const summaryWs = generateSummarySheet(window.projectData, mergedEstimates);
        XLSX.utils.book_append_sheet(wb, summaryWs, "彙總表");

        const generateExternalQuoteSheet = (item) => {
            const wsData = [];
            
            const titleStyle = { font: { sz: 16, bold: true, name: '標楷體' }, alignment: { horizontal: 'center', vertical: 'center' } };
            const headerStyle = { font: { sz: 11, bold: true, name: '標楷體' }, alignment: { vertical: 'center' } };
            const thStyle = { 
                font: { sz: 11, bold: true, name: '標楷體' }, 
                border: { top: {style:'thin', color: {rgb:"000000"}}, bottom: {style:'thin', color: {rgb:"000000"}}, left: {style:'thin', color: {rgb:"000000"}}, right: {style:'thin', color: {rgb:"000000"}} }, 
                alignment: { horizontal: 'center', vertical: 'center' }, 
                fill: { fgColor: { rgb: "F1F5F9" } } 
            };
            const tdStyle = { 
                font: { sz: 11, name: '標楷體' }, 
                border: { top: {style:'thin', color: {rgb:"000000"}}, bottom: {style:'thin', color: {rgb:"000000"}}, left: {style:'thin', color: {rgb:"000000"}}, right: {style:'thin', color: {rgb:"000000"}} }, 
                alignment: { vertical: 'center' } 
            };
            
            const numStyle = { ...tdStyle, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '#,##0' };
            const qtyStyle = { ...tdStyle, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '#,##0.##' }; 
            const centerStyle = { ...tdStyle, alignment: { horizontal: 'center', vertical: 'center' } };

            const today = new Date();
            const dateStr = today.getFullYear() + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + String(today.getDate()).padStart(2, '0');

            wsData.push([{ v: '良聯工業股份有限公司 - 報價單', s: titleStyle }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}]);
            wsData.push([{v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}]); 

            wsData.push([
                { v: '專案名稱：', s: headerStyle }, { v: projName, s: { font: { name: '標楷體', sz: 11 } } }, {v:''},
                {v:''},
                { v: '報價日期：', s: headerStyle }, { v: dateStr, s: { font: { name: '標楷體', sz: 11 } } }, {v:''}
            ]);
            wsData.push([
                { v: '項目名稱：', s: headerStyle },
                { v: item.itemName, s: { font: { name: '標楷體', sz: 11 } } }, {v:''},
                {v:''},
                { v: '版次：', s: headerStyle }, { v: version, s: { font: { name: '標楷體', sz: 11 } } }, {v:''}
            ]);
            wsData.push([{v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}]);

            wsData.push([
                { v: '項次', s: thStyle },
                { v: '項目說明 (品名規格)', s: thStyle },
                { v: '單位', s: thStyle },
                { v: '數量', s: thStyle },
                { v: '單價 (NT$)', s: thStyle },
                { v: '小計 (NT$)', s: thStyle },
                { v: '備註', s: thStyle }
            ]);

            let totalAmount = 0;
            let currentRowCount = 0;
            
            if (item.details && item.details.length > 0) {
                item.details.forEach((d, idx) => {
                    let desc = d.name;
                    if (d.material && d.material !== '-') desc += ` (${d.material})`;
                    
                    wsData.push([
                        { v: idx + 1, s: centerStyle, t: 'n' },
                        { v: desc, s: tdStyle },
                        { v: d.unit, s: centerStyle },
                        { v: d.qty, s: qtyStyle, t: 'n', z: '#,##0.##' },
                        { v: d.finalUnitPrice, s: numStyle, t: 'n', z: '#,##0' },
                        { v: d.finalTotal, s: numStyle, t: 'n', z: '#,##0' },
                        { v: d.note || '', s: tdStyle }
                    ]);
                    totalAmount += d.finalTotal;
                    currentRowCount++;
                });
            } else {
                wsData.push([
                    { v: 1, s: centerStyle, t: 'n' },
                    { v: item.itemName, s: tdStyle },
                    { v: '式', s: centerStyle },
                    { v: 1, s: qtyStyle, t: 'n', z: '#,##0.##' },
                    { v: item.grandTotal, s: numStyle, t: 'n', z: '#,##0' },
                    { v: item.grandTotal, s: numStyle, t: 'n', z: '#,##0' },
                    { v: '', s: tdStyle }
                ]);
                totalAmount += item.grandTotal;
                currentRowCount++;
            }

            wsData.push([
                { v: '總計 (未稅)：', s: { ...thStyle, alignment: { horizontal: 'right', vertical: 'center' } } },
                { v: '', s: thStyle }, { v: '', s: thStyle }, { v: '', s: thStyle }, { v: '', s: thStyle }, 
                { v: totalAmount, s: { ...thStyle, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '#,##0' }, t: 'n', z: '#,##0' },
                { v: '', s: thStyle }
            ]);

            wsData.push([{v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}]);
            wsData.push([{ v: '【備註事項】', s: headerStyle }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}]);
            wsData.push([{ v: '1. 本報價單由系統自動生成。', s: { font: { name: '標楷體', sz: 11 } } }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}]);
            wsData.push([{ v: '2. 以上報價未含 5% 加值營業稅。', s: { font: { name: '標楷體', sz: 11 } } }, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}, {v:''}]);

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            const merges = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, 
                { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, 
                { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } }, 
                { s: { r: 6 + currentRowCount, c: 0 }, e: { r: 6 + currentRowCount, c: 4 } }
            ];
            ws['!merges'] = merges;

            ws['!cols'] = [ { wch: 8 }, { wch: 40 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 25 } ];

            return ws;
        };

        mergedEstimates.forEach((item, index) => {
            const ws = generateExternalQuoteSheet(item);
            const sheetName = sanitizeSheetName(`${index + 1}_${item.itemName}`);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const today = new Date();
        const dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
        const fileName = `對外報價單_${projId}_${dateStr}.xlsx`;

        XLSX.writeFile(wb, fileName);

        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('對外正式報價單與彙總表匯出成功！', 'success');
        } else {
            alert('對外報價單 Excel 匯出成功！');
        }

    } catch (error) {
        console.error('匯出 Excel 發生錯誤:', error);
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast('匯出失敗，請查看主控台錯誤訊息。', 'error');
        } else {
            alert('匯出失敗，請聯絡系統管理員。');
        }
    }
}

function completeSummary() {
    const hasRevisingCost = window.projectData.costEstimates.some(i => i.status === 'revising');
    const hasRevisingEng = window.projectData.engEstimates.some(i => i.status === 'revising');
    
    if (hasRevisingCost || hasRevisingEng) {
        alert('無法完成彙總！\n\n清單中尚有處於「編修中」的估算項目，請等候相關單位完成估算並重新鎖定後，再執行此動作。');
        return;
    }

    const finalPrice = document.getElementById('projectGrandTotal').textContent;
    const version = document.getElementById('versionSelect').value;
    const quoteId = document.getElementById('projectId').value || 'EQ25090001';
    
    if (confirm(`確定要完成 ${version} 版的彙總作業嗎？\n專案彙總報價為：${finalPrice}`)) {
        if (window.LiangLianSystem && typeof window.LiangLianSystem.showToast === 'function') {
            window.LiangLianSystem.showToast(`已完成彙總！即將轉跳至議價彙整...`, 'success');
        }
        // 將本次鎖定的投標版次與報價編號帶給議價彙整頁面，避免兩頁的版次字串各自寫死、日後改版次規則時互相對不上。
        // 實際串接後端時，quoteId／version 改為連同完整明細（含每個品項當下的 A 版本）一併存檔即可，
        // 這裡的 URL 參數只負責告訴議價彙整頁「要以哪一個投標版次為基礎」。
        setTimeout(() => {
            window.location.href = `../bid-negotiation/index.html?quoteId=${encodeURIComponent(quoteId)}&bidVersion=${encodeURIComponent(version)}`;
        }, 600);
    }
}

// 格式化金錢輔助函數
function formatCurrency(number) {
    if (isNaN(number)) return "0";
    return new Intl.NumberFormat('zh-TW', { 
        minimumFractionDigits: 0
    }).format(Math.round(number));
}

// 格式化普通數字 (用於工時)
function formatNumber(number) {
    if (isNaN(number)) return "0";
    return new Intl.NumberFormat('zh-TW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
    }).format(number);
}