// history.js - V17.1 修正網址參數連動與麵包屑導航版

// ==========================================
// 1. 基礎設定
// ==========================================
const STANDARD_NOTES = [
    '1.本報價不含5%營業稅、任何第三者公正、工檢費用。',
    '2.本報價不含儀表、閥類、保溫(冷)、耐火、備品、氮封。',
    '3.本報價範圍：設備本體、平台、欄杆、爬梯；其餘皆不含。'
];

const CATEGORIES = ['專案材料', '共通材料', '專案設計', '專案外包加工', '專案製造', '專案外包工程', '專案費用'];

// ==========================================
// 2. 模擬歷史資料
// ==========================================
const versionData = {
    'V3.0': {
        meta: {
            date: '2025-09-22 14:30',
            user: '張工程師',
            desc: '當前編輯版本 (資料同步自 URL)',
            isCurrent: true
        },
        projectSettings: {
            equipmentId: 'EQP-2025-001', 
            equipmentName: '高效能混合反應器', 
            estimationDate: new Date().toISOString().split('T')[0],
            shellThickness: 12,
            innerDiameter: 2500,
            totalLength: 6000,
            setQty: 1, 
            pricePerMh: 2500,
            pricePerKg: 120,
            singleSetTotal: 0, 
            projectTotal: 0,
            // 隱藏欄位 (用於返回連結)
            projectId: '',
            basicInfo: ''
        },
        items: [
            { id: 1, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-STOQ', name: '鋼板(12t)', material: 'SS400', dept: '採購部', workType: '冷作工', unit: 'kg', qty: 5556, qtyMfg: 5000, price: 35, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '厚度變更', change: 'modified' },
            { id: 2, category: '共通材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'C-WELD-01', name: '焊條 (E7016)', material: '-', dept: '製造廠', workType: '焊接工', unit: 'kg', qty: 100, qtyMfg: 100, price: 85, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '新增項目', change: 'added' },
            { id: 3, category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '焊接工', material: '-', dept: '工務部', workType: '焊接工', unit: '工', qty: 2, qtyMfg: 0, price: 3500, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 10, note: '', change: null }
        ],
        remarks: STANDARD_NOTES.join('\n')
    },
    'V2.0': {
        meta: {
            date: '2025-09-18 16:45',
            user: '陳主管',
            desc: '修訂版 (刪除運費項目)',
            isCurrent: false
        },
        projectSettings: {
            equipmentId: 'EST-002_COST',
            equipmentName: '整廠保溫工程 (成本部) - 修訂版',
            estimationDate: '2025-09-18',
            shellThickness: 10,
            innerDiameter: 2500,
            totalLength: 6000,
            setQty: 1,
            pricePerMh: 2400,
            pricePerKg: 110,
            singleSetTotal: 127000,
            projectTotal: 127000
        },
        items: [
            { id: 1, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-STOQ', name: '鋼板(10t)', material: 'SS400', dept: '採購部', workType: '冷作工', unit: 'kg', qty: 2778, qtyMfg: 2500, price: 35, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '', change: null },
            { id: 99, category: '專案費用', costCode: 'DPCMM106', accountCode: '1251M4', matNo: 'TEMP-FEE', name: '臨時運費', material: '-', dept: '採購部', workType: '運輸', unit: '式', qty: 1, qtyMfg: 0, price: 5000, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 0, note: '本次移除', change: 'deleted' },
            { id: 3, category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '焊接工', material: '-', dept: '工務部', workType: '焊接工', unit: '工', qty: 2, qtyMfg: 0, price: 3500, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 8, note: '', change: null }
        ],
        remarks: STANDARD_NOTES.join('\n')
    },
    'V1.0': {
        meta: {
            date: '2025-09-10 09:00',
            user: '張工程師',
            desc: '初始草稿 (無變更標記)',
            isCurrent: false
        },
        projectSettings: {
            equipmentId: 'EST-002_COST',
            equipmentName: '整廠保溫工程 (成本部) - 草稿',
            estimationDate: '2025-09-10',
            shellThickness: 10,
            innerDiameter: 2500,
            totalLength: 6000,
            setQty: 1,
            pricePerMh: 2400,
            pricePerKg: 110,
            singleSetTotal: 132000,
            projectTotal: 132000
        },
        items: [
            { id: 1, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-STOQ', name: '鋼板(10t)', material: 'SS400', dept: '採購部', workType: '冷作工', unit: 'kg', qty: 2778, qtyMfg: 2500, price: 35, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '', change: null },
            { id: 99, category: '專案費用', costCode: 'DPCMM106', accountCode: '1251M4', matNo: 'TEMP-FEE', name: '臨時運費', material: '-', dept: '採購部', workType: '運輸', unit: '式', qty: 1, qtyMfg: 0, price: 5000, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 0, note: '', change: null },
            { id: 3, category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '焊接工', material: '-', dept: '工務部', workType: '焊接工', unit: '工', qty: 2, qtyMfg: 0, price: 3500, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 8, note: '', change: null }
        ],
        remarks: STANDARD_NOTES.join('\n')
    }
};

// ==========================================
// 3. 初始化與導航
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    syncCurrentVersionWithUrl();
    initBackButton();
    updateBreadcrumbs();
    
    const firstVersion = document.querySelector('.version-item');
    if (firstVersion) {
        const ver = firstVersion.dataset.version || 'V3.0';
        selectVersion(firstVersion, ver);
    }
});

function syncCurrentVersionWithUrl() {
    const params = new URLSearchParams(window.location.search);
    const target = versionData['V3.0'];
    if (!target) return;

    if (params.get('id')) target.projectSettings.equipmentId = params.get('id');
    if (params.get('name')) target.projectSettings.equipmentName = params.get('name');
    if (params.get('qty')) target.projectSettings.setQty = parseFloat(params.get('qty')) || 1;
    
    // ★ 接收 basicInfo 與 projectId，確保返回時不遺失
    if (params.get('basicInfo')) target.projectSettings.basicInfo = params.get('basicInfo');
    if (params.get('projectId')) target.projectSettings.projectId = params.get('projectId');

    let grandTotal = 0;
    let totalManHours = 0;
    
    target.items.forEach(item => {
        const base = (item.qty || 0) * (item.price || 0);
        const totalRate = (item.indirectRate || 0) + (item.profitRate || 0) + (item.riskRate || 0) + (item.negotiationRate || 0);
        item.itemGrandTotal = Math.round(base * (1 + totalRate/100));
        grandTotal += item.itemGrandTotal;
        totalManHours += (item.manHours || 0);
    });

    target.projectSettings.singleSetTotal = grandTotal;
    target.projectSettings.projectTotal = grandTotal * target.projectSettings.setQty;
    
    const weight = 4500;
    target.projectSettings.pricePerKg = weight > 0 ? Math.round(grandTotal / weight) : 0;
    const hours = totalManHours > 0 ? totalManHours : 150;
    target.projectSettings.pricePerMh = Math.round(grandTotal / hours);
}

function initBackButton() {
    const backBtn = document.getElementById('backToWorkspace');
    if (!backBtn) return;
    const currentSearch = window.location.search;
    backBtn.href = currentSearch ? `../cost-detail/index.html${currentSearch}` : `../cost-detail/index.html`;
}

// ★ 麵包屑導航連結
function updateBreadcrumbs() {
    // 延遲一點執行，確保 layout_loader 已生成麵包屑
    setTimeout(() => {
        const breadcrumbs = document.querySelectorAll('.breadcrumb-item a');
        breadcrumbs.forEach(link => {
            if (link.href && link.href.includes('cost-detail')) {
                const currentSearch = window.location.search;
                const baseUrl = link.href.split('?')[0];
                link.href = `${baseUrl}${currentSearch}`;
            }
        });
    }, 100);
}

// ==========================================
// 4. 核心渲染邏輯
// ==========================================

function selectVersion(element, version) {
    document.querySelectorAll('.version-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('selectedVersionInfo').innerHTML = `
        <span class="badge bg-primary me-2">一般模式</span>
        版本：${version}
    `;
    
    loadVersionContent(version);
}

function loadVersionContent(version) {
    const data = versionData[version];
    if (!data) return;

    const content = document.getElementById('estimationContent');
    
    const prevVersion = getPreviousVersion(version);
    const prevData = prevVersion ? versionData[prevVersion] : null;
    
    const projectInfoHtml = renderProjectInfo(data.projectSettings, prevData ? prevData.projectSettings : null);
    const result = renderCategoryView(data);

    content.innerHTML = `
        ${projectInfoHtml}
        
        <div class="content-section mt-4">
            <div class="section-header">
                <h6 class="section-title"><i class="fas fa-list-ol me-2"></i>估算明細快照</h6>
            </div>
            ${result.html}
        </div>

        <div class="content-section mt-4 p-4">
            <h6 class="fw-bold border-bottom pb-2 mb-3"><i class="fas fa-sticky-note me-2"></i>備註欄</h6>
            <div style="white-space: pre-line;">${data.remarks}</div>
        </div>
    `;
}

// ==========================================
// 5. 專案參數顯示
// ==========================================
function renderProjectInfo(settings, prev) {
    const formatNum = (val) => (val !== undefined && val !== null) ? Number(val).toLocaleString() : '0';
    const formatText = (val) => (val !== undefined && val !== null && val !== '') ? val : '-';

    return `
    <div class="content-section">
        <div class="section-header">
            <h6 class="section-title"><i class="fas fa-sliders-h me-2"></i>專案資訊快照</h6>
            <span class="text-muted small">單位：新台幣 (NTD) / mm / kg</span>
        </div>
        
        <div class="dashboard-body">
            <div class="row g-3">
                <div class="col-lg-2 col-md-4">
                    <div class="info-field">
                        <label class="info-label">設備編號</label>
                        <div class="info-value">${formatText(settings.equipmentId)}</div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-4">
                    <div class="info-field">
                        <label class="info-label">設備名稱</label>
                        <div class="info-value">${formatText(settings.equipmentName)}</div>
                    </div>
                </div>
                <div class="col-lg-1 col-md-2">
                    <div class="info-field">
                        <label class="info-label">版次</label>
                        <div class="info-value">V1.0</div>
                    </div>
                </div>
                 <div class="col-lg-2 col-md-2">
                    <div class="info-field">
                        <label class="info-label">估算日期</label>
                        <div class="info-value">${formatText(settings.estimationDate)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                     <div class="info-field" style="background-color: #f8fafc;">
                        <label class="info-label">工時單價 (NT$/Hr)</label>
                        <div class="info-value text-end">${formatNum(settings.pricePerMh)}</div>
                    </div>
                </div>
                 <div class="col-lg-2 col-md-6">
                     <div class="info-field" style="background-color: #f8fafc;">
                        <label class="info-label">數量單價 (NT$/KG)</label>
                        <div class="info-value text-end">${formatNum(settings.pricePerKg)}</div>
                    </div>
                </div>

                <div class="col-lg-2 col-md-3">
                    <div class="info-field">
                        <label class="info-label">胴身厚 (mm)</label>
                        <div class="info-value text-end">${formatNum(settings.shellThickness)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-3">
                    <div class="info-field">
                        <label class="info-label">內徑 (mm)</label>
                        <div class="info-value text-end">${formatNum(settings.innerDiameter)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-3">
                    <div class="info-field">
                        <label class="info-label">總長度 (mm)</label>
                        <div class="info-value text-end">${formatNum(settings.totalLength)}</div>
                    </div>
                </div>
                 <div class="col-lg-2 col-md-3">
                    <div class="info-field">
                        <label class="info-label">套數 (SET)</label>
                        <div class="info-value text-end fw-bold text-primary">${formatNum(settings.setQty)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="amount-box">
                        <label class="amount-label">單套總計</label>
                        <div class="amount-value">${formatNum(settings.singleSetTotal)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="amount-box" style="border-left-color: #22c55e; background: linear-gradient(to right, #f0fdf4, #ffffff);">
                        <label class="amount-label">專案總價</label>
                        <div class="amount-value text-success">${formatNum(settings.projectTotal)}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ==========================================
// 6. 分類檢視渲染器
// ==========================================
function renderCategoryView(data) {
    const totals = {
        base: 0, indirect: 0, profit: 0, risk: 0, neg: 0, grand: 0,
        manHours: 0, matQty: 0, mfgQty: 0,
        baseForIndirect: 0, baseForProfit: 0, baseForRisk: 0, baseForNeg: 0
    };

    const processedItems = data.items.map((item, idx) => {
        const qty = parseFloat(item.qty) || 0;
        const price = parseFloat(item.price) || 0;
        const qtyMfg = parseFloat(item.qtyMfg) || 0;
        const manHours = parseFloat(item.manHours) || 0;

        const baseCost = Math.round(qty * price);
        const indirectAmt = Math.round(baseCost * ((item.indirectRate || 0) / 100));
        const costAfterIndirect = baseCost + indirectAmt;
        const profitAmt = Math.round(costAfterIndirect * ((item.profitRate || 0) / 100));
        const costAfterProfit = costAfterIndirect + profitAmt;
        const riskAmt = Math.round(costAfterProfit * ((item.riskRate || 0) / 100));
        const costAfterRisk = costAfterProfit + riskAmt;
        const negotiationAmt = Math.round(costAfterRisk * ((item.negotiationRate || 0) / 100));
        const itemGrandTotal = costAfterRisk + negotiationAmt;
        const mgmtUnitPrice = qty > 0 ? Math.round(itemGrandTotal / qty) : 0;
        
        if (item.change !== 'deleted') {
            totals.base += baseCost;
            totals.indirect += indirectAmt;
            totals.profit += profitAmt;
            totals.risk += riskAmt;
            totals.neg += negotiationAmt;
            totals.grand += itemGrandTotal;
            totals.manHours += manHours;
            totals.matQty += qty;
            totals.mfgQty += qtyMfg;

            totals.baseForIndirect += baseCost;
            totals.baseForProfit += costAfterIndirect;
            totals.baseForRisk += costAfterProfit;
            totals.baseForNeg += costAfterRisk;
        }

        let cutLose = '-';
        if (qty > 0) {
            const lossPct = ((qty - qtyMfg) / qty) * 100;
            cutLose = lossPct.toFixed(1) + '%';
        }

        return {
            ...item,
            baseCost, indirectAmt, profitAmt, riskAmt, negotiationAmt, 
            itemGrandTotal, mgmtUnitPrice, cutLoseDisplay: cutLose,
            displayIndex: idx + 1
        };
    });

    let html = `
    <div class="table-container" style="border:none; border-radius:0;">
        <table class="estimation-table">
            <thead>
                <tr>
                    <th class="text-center sticky-col" style="width:50px">項次</th>
                    <th class="col-basic">分類</th>
                    <th class="col-basic">成本代碼</th>
                    <th class="col-basic">在建會科</th>
                    <th class="col-basic">材料編號</th>
                    <th class="col-desc">工程內容/品名規格</th>
                    <th class="col-short">執行部門</th>
                    <th class="col-short">工種</th>
                    <th class="col-short">材質</th>
                    <th class="col-short">單位</th>
                    <th class="col-num">材料數量</th>
                    <th class="col-num">製造數量</th>
                    <th class="col-short">Cut.Lose</th>
                    <th class="col-num">單價</th>
                    <th class="col-cost">小計</th>
                    <th class="col-cost">利管單價</th>
                    <th style="min-width:60px">%</th>
                    <th class="col-indirect">間接費</th>
                    <th style="min-width:60px">%</th>
                    <th class="col-profit">利潤</th>
                    <th style="min-width:60px">%</th>
                    <th class="col-risk">風險</th>
                    <th style="min-width:60px">%</th>
                    <th class="col-neg">議價</th>
                    <th class="col-total">總計</th>
                    <th class="col-num">工時</th>
                    <th class="col-note">備註</th>
                </tr>
            </thead>
            <tbody>
    `;

    const groups = {};
    CATEGORIES.forEach(c => groups[c] = []);
    groups['未分類'] = [];
    processedItems.forEach(item => {
        const cat = item.category || '未分類';
        if (groups[cat]) groups[cat].push(item);
        else groups['未分類'].push(item);
    });

    let displayCounter = 1;
    [...CATEGORIES, '未分類'].forEach(catName => {
        const groupItems = groups[catName];
        if (!groupItems || groupItems.length === 0) return;

        const sub = groupItems.reduce((acc, obj) => {
            if (obj.change !== 'deleted') {
                acc.base += obj.baseCost;
                acc.grand += obj.itemGrandTotal;
                acc.manHours += obj.manHours;
            }
            return acc;
        }, { base: 0, grand: 0, manHours: 0 });

        // ★ 修正重點：分類標題只凍結第一欄 (colspan=1)
        // 剩餘寬度由填充格 (colspan=26) 負責，並隨內容捲動
        html += `
            <tr class="category-header-row">
                <td class="category-header-title text-start ps-2 sticky-col" colspan="1" style="white-space: nowrap; overflow: visible;">
                    <i class="fas fa-folder-open me-2 text-primary"></i>${catName}
                </td>
                <td colspan="26" class="category-header-filler"></td>
            </tr>
        `;

        groupItems.forEach(item => {
            const trClass = item.change ? `change-${item.change}` : '';
            const badge = item.change ? getChangeBadge(item.change) : '';
            const rowStyle = item.change === 'deleted' ? 'text-decoration: line-through; color: #991b1b;' : '';

            // ★ 修正重點：內容列的第一欄 (項次) 加上 sticky-col
            html += `
                <tr class="${trClass}" style="${rowStyle}">
                    <td class="text-center sticky-col fw-bold text-dark">${displayCounter++}</td>
                    <td>${item.category}</td>
                    <td>${item.costCode || ''}</td>
                    <td>${item.accountCode || ''}</td>
                    <td>${item.matNo || ''}</td>
                    <td>${item.name} ${badge}</td>
                    <td class="text-center">${item.dept || ''}</td>
                    <td class="text-center">${item.workType || ''}</td>
                    <td class="text-center">${item.material || ''}</td>
                    <td class="text-center">${item.unit}</td>
                    <td class="text-end fw-bold">${item.qty}</td>
                    <td class="text-end text-muted">${item.qtyMfg || '-'}</td>
                    <td class="text-center small text-danger">${item.cutLoseDisplay}</td>
                    <td class="text-end">${item.price.toLocaleString()}</td>
                    <td class="col-cost">${item.baseCost.toLocaleString()}</td>
                    <td class="col-cost text-primary">${item.change === 'deleted' ? '-' : item.mgmtUnitPrice.toLocaleString()}</td>
                    
                    <td class="text-center small">${item.indirectRate || 0}</td>
                    <td class="col-indirect small">${item.indirectAmt.toLocaleString()}</td>
                    <td class="text-center small">${item.profitRate || 0}</td>
                    <td class="col-profit small">${item.profitAmt.toLocaleString()}</td>
                    <td class="text-center small">${item.riskRate || 0}</td>
                    <td class="col-risk small">${item.riskAmt.toLocaleString()}</td>
                    <td class="text-center small">${item.negotiationRate || 0}</td>
                    <td class="col-neg small">${item.negotiationAmt.toLocaleString()}</td>
                    
                    <td class="col-total">${item.itemGrandTotal.toLocaleString()}</td>
                    <td class="text-end">${item.manHours || '-'}</td>
                    <td><small>${item.note || ''}</small></td>
                </tr>
            `;
        });

        html += `
            <tr class="category-subtotal-row bg-light fw-bold">
                <td></td>
                <td colspan="13" class="text-end text-secondary">${catName} 小計：</td>
                <td class="text-end text-dark">${sub.base.toLocaleString()}</td>
                <td colspan="9"></td>
                <td class="col-total">${sub.grand.toLocaleString()}</td>
                <td class="text-end text-dark">${sub.manHours}</td>
                <td></td>
            </tr>
        `;
    });

    const avgIndirect = totals.baseForIndirect > 0 ? ((totals.indirect / totals.baseForIndirect) * 100).toFixed(2) + '%' : '-';
    const avgProfit = totals.baseForProfit > 0 ? ((totals.profit / totals.baseForProfit) * 100).toFixed(2) + '%' : '-';
    const avgRisk = totals.baseForRisk > 0 ? ((totals.risk / totals.baseForRisk) * 100).toFixed(2) + '%' : '-';
    const avgNeg = totals.baseForNeg > 0 ? ((totals.neg / totals.baseForNeg) * 100).toFixed(2) + '%' : '-';

    let totalCutLose = '-';
    if (totals.matQty > 0) {
        totalCutLose = (((totals.matQty - totals.mfgQty) / totals.matQty) * 100).toFixed(2) + '%';
    }

    const footerStyle = 'background-color: #f1f5f9 !important; font-weight: 700; border-top: 2px solid #94a3b8; color: #1e293b;';

    html += `
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td style="${footerStyle}"></td>
                    <td colspan="9" class="text-end" style="${footerStyle}">總計：</td>
                    <td class="text-end" style="${footerStyle} color: var(--color-cost-text, #334155);">${Math.round(totals.matQty).toLocaleString()}</td>
                    <td class="text-end" style="${footerStyle} color: var(--color-cost-text, #334155);">${Math.round(totals.mfgQty).toLocaleString()}</td>
                    <td class="text-center text-danger" style="${footerStyle}">${totalCutLose}</td>
                    <td style="${footerStyle}"></td>
                    <td class="text-end" style="${footerStyle} color: var(--color-cost-text, #334155);">${totals.base.toLocaleString()}</td>
                    <td style="${footerStyle}"></td>
                    <td class="text-center text-muted small" style="${footerStyle}">${avgIndirect}</td>
                    <td class="text-end" style="${footerStyle} color: var(--color-indirect-text, #64748b);">${totals.indirect.toLocaleString()}</td>
                    <td class="text-center text-muted small" style="${footerStyle}">${avgProfit}</td>
                    <td class="text-end" style="${footerStyle} color: var(--color-profit-text, #059669);">${totals.profit.toLocaleString()}</td>
                    <td class="text-center text-muted small" style="${footerStyle}">${avgRisk}</td>
                    <td class="text-end" style="${footerStyle} color: var(--color-risk-text, #d97706);">${totals.risk.toLocaleString()}</td>
                    <td class="text-center text-muted small" style="${footerStyle}">${avgNeg}</td>
                    <td class="text-end" style="${footerStyle} color: var(--color-neg-text, #dc2626);">${totals.neg.toLocaleString()}</td>
                    <td class="text-end" style="${footerStyle} color: var(--color-total-text, #1e40af); font-size: 1.1rem;">${totals.grand.toLocaleString()}</td>
                    <td class="text-end" style="${footerStyle}">${totals.manHours.toLocaleString()}</td>
                    <td style="${footerStyle}"></td>
                </tr>
            </tfoot>
        </table>
    </div>
    `;

    return { html, total: totals.grand };
}

function getPreviousVersion(ver) {
    const keys = Object.keys(versionData);
    const idx = keys.indexOf(ver);
    return idx < keys.length - 1 ? keys[idx + 1] : null;
}

function getChangeBadge(type) {
    if (type === 'added') return '<span class="badge bg-success ms-1">新</span>';
    if (type === 'modified') return '<span class="badge bg-warning text-dark ms-1">修</span>';
    if (type === 'deleted') return '<span class="badge bg-danger ms-1">刪</span>';
    return '';
}