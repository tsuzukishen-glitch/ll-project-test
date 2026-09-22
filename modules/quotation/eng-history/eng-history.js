// history.js - 工程估算版本歷史紀錄 (整合費率與工時擴充版)

// ==========================================
// 1. 基礎設定
// ==========================================
const STANDARD_NOTES = [
    '1. 上述金額以新台幣計及不含5%加值營業稅。附件圖面僅為參考圖面，實際以施工圖面為主。',
    '2. 本工程為總價承包責任施工，責任範圍內不得以任何原因及理由辦理追加。',
    '3. 以上報價金額已含為完成本工程所需之人力及相關施工人員保險。'
];

const CATEGORIES = ['直接費用', '專業外包工程', '假設工程', '安衛環設施', '其他費用'];

// ==========================================
// 2. 模擬歷史資料 (加入費率與工時)
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
            workName: '台積電12廠潔淨室建置工程',
            location: '中油林園廠',
            workNature: '保溫工程',
            version: 'V3.0',
            contractorName: '三煌實業股份有限公司',
            personInCharge: '洪鋒文',
            estimationDate: new Date().toISOString().split('T')[0],
            quoteDate: new Date().toISOString().split('T')[0],
            pricePerMh: 0,
            grandTotal: 0 
        },
        items: [
            { id: 1, category: '專業外包工程', costCode: 'DPCCIN013', accountCode: '1256CIN', itemCode: 'DPCCIN013', name: 'V-1204 塔槽保溫拆除(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 1232, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 120, note: '', change: null },
            { id: 2, category: '專業外包工程', costCode: 'DPCCIN254', accountCode: '1256CIN', itemCode: 'DPCCIN254', name: 'V-1204 塔槽保溫(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 3310, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 200, note: '*依中油保溫規範', change: 'modified' },
            { id: 7, category: '專業外包工程', costCode: 'DPCEIN755', accountCode: '125409', itemCode: 'DPCEIN755', name: '廢棄物清運', dept: '建造部', workType: '清運', unit: '式', qty: 1, price: 25000, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 8, note: '', change: 'added' },
            { id: 9, category: '安衛環設施', costCode: 'DPCEIN752', accountCode: '125409', itemCode: 'DPCEIN752', name: '安衛環設施及利管費', dept: '建造部', workType: '其他', unit: '式', qty: 1, price: 67163, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '', change: null }
        ],
        remarks: STANDARD_NOTES.join('\n')
    },
    'V2.0': {
        meta: {
            date: '2025-09-18 16:45',
            user: '陳主管',
            desc: '修訂版 (調整單價與刪除臨時工)',
            isCurrent: false
        },
        projectSettings: {
            workName: '台積電12廠潔淨室建置工程 - 修訂版',
            location: '中油林園廠',
            workNature: '保溫工程',
            version: 'V2.0',
            contractorName: '三煌實業股份有限公司',
            personInCharge: '洪鋒文',
            estimationDate: '2025-09-18',
            quoteDate: '2025-09-19',
            pricePerMh: 0,
            grandTotal: 0
        },
        items: [
            { id: 1, category: '專業外包工程', costCode: 'DPCCIN013', accountCode: '1256CIN', itemCode: 'DPCCIN013', name: 'V-1204 塔槽保溫拆除(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 1232, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 120, note: '', change: null },
            { id: 2, category: '專業外包工程', costCode: 'DPCCIN254', accountCode: '1256CIN', itemCode: 'DPCCIN254', name: 'V-1204 塔槽保溫(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 3000, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 200, note: '*單價調整', change: 'modified' },
            { id: 99, category: '直接費用', costCode: 'DPCME420', accountCode: '1251E4', itemCode: 'TEMP-01', name: '臨時點工', dept: '建造部', workType: '其他', unit: '工', qty: 5, price: 3000, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 40, note: '本次不編列', change: 'deleted' },
            { id: 9, category: '安衛環設施', costCode: 'DPCEIN752', accountCode: '125409', itemCode: 'DPCEIN752', name: '安衛環設施及利管費', dept: '建造部', workType: '其他', unit: '式', qty: 1, price: 67163, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '', change: null }
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
            workName: '台積電12廠潔淨室建置工程 - 草稿',
            location: '中油林園廠',
            workNature: '保溫工程',
            version: 'V1.0',
            contractorName: '三煌實業股份有限公司',
            personInCharge: '洪鋒文',
            estimationDate: '2025-09-10',
            quoteDate: '2025-09-11',
            pricePerMh: 0,
            grandTotal: 0
        },
        items: [
            { id: 1, category: '專業外包工程', costCode: 'DPCCIN013', accountCode: '1256CIN', itemCode: 'DPCCIN013', name: 'V-1204 塔槽保溫拆除(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 1232, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 120, note: '', change: null },
            { id: 2, category: '專業外包工程', costCode: 'DPCCIN254', accountCode: '1256CIN', itemCode: 'DPCCIN254', name: 'V-1204 塔槽保溫(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 3000, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 200, note: '', change: null },
            { id: 99, category: '直接費用', costCode: 'DPCME420', accountCode: '1251E4', itemCode: 'TEMP-01', name: '臨時點工', dept: '建造部', workType: '其他', unit: '工', qty: 5, price: 3000, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 40, note: '', change: null },
            { id: 9, category: '安衛環設施', costCode: 'DPCEIN752', accountCode: '125409', itemCode: 'DPCEIN752', name: '安衛環設施及利管費', dept: '建造部', workType: '其他', unit: '式', qty: 1, price: 67163, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '', change: null }
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

    if (params.get('name')) target.projectSettings.workName = params.get('name');
    
    // 計算每項與總和，包含階梯式費率
    Object.keys(versionData).forEach(key => {
        let total = 0;
        let totalMh = 0;
        versionData[key].items.forEach(item => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.price) || 0;
            
            const baseCost = Math.round(qty * price);
            const indirectAmt = Math.round(baseCost * ((item.indirectRate || 0) / 100));
            const costAfterIndirect = baseCost + indirectAmt;
            const profitAmt = Math.round(costAfterIndirect * ((item.profitRate || 0) / 100));
            const costAfterProfit = costAfterIndirect + profitAmt;
            const riskAmt = Math.round(costAfterProfit * ((item.riskRate || 0) / 100));
            const costAfterRisk = costAfterProfit + riskAmt;
            const negotiationAmt = Math.round(costAfterRisk * ((item.negotiationRate || 0) / 100));
            
            item.itemGrandTotal = costAfterRisk + negotiationAmt;
            total += item.itemGrandTotal;
            totalMh += parseFloat(item.manHours || 0);
        });
        versionData[key].projectSettings.grandTotal = total;
        versionData[key].projectSettings.pricePerMh = totalMh > 0 ? Math.round(total / totalMh) : 0;
    });
}

function initBackButton() {
    const backBtn = document.getElementById('backToWorkspace');
    if (!backBtn) return;
    const currentSearch = window.location.search;
    backBtn.href = currentSearch ? `../eng-detail/index.html${currentSearch}` : `../eng-detail/index.html`;
}

// ==========================================
// 4. 核心渲染邏輯
// ==========================================

window.selectVersion = function(element, version) {
    document.querySelectorAll('.version-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('selectedVersionInfo').innerHTML = `
        <span class="badge bg-primary me-2">工程估算</span>
        版本：${version}
    `;
    
    loadVersionContent(version);
};

function loadVersionContent(version) {
    const data = versionData[version];
    if (!data) return;

    const content = document.getElementById('estimationContent');
    const projectInfoHtml = renderProjectInfo(data.projectSettings);
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
            <div style="white-space: pre-line; color: #475569; font-size: 0.95rem;">${data.remarks}</div>
        </div>
    `;
}

// ==========================================
// 5. 專案參數顯示 (包含工時單價)
// ==========================================
function renderProjectInfo(settings) {
    const formatNum = (val) => (val !== undefined && val !== null) ? Number(val).toLocaleString() : '0';
    const formatText = (val) => (val !== undefined && val !== null && val !== '') ? val : '-';

    return `
    <div class="content-section">
        <div class="section-header">
            <h6 class="section-title"><i class="fas fa-sliders-h me-2"></i>專案資訊快照</h6>
            <span class="text-muted small">單位：新台幣 (NTD)</span>
        </div>
        
        <div class="dashboard-body">
            <div class="row g-3">
                <div class="col-lg-2 col-md-6">
                    <div class="info-field">
                        <label class="info-label">施工地點</label>
                        <div class="info-value">${formatText(settings.location)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="info-field">
                        <label class="info-label">工作性質</label>
                        <div class="info-value">${formatText(settings.workNature)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="info-field">
                        <label class="info-label">工作名稱</label>
                        <div class="info-value">${formatText(settings.workName)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <div class="info-field">
                        <label class="info-label">版次</label>
                        <div class="info-value">${formatText(settings.version)}</div>
                    </div>
                </div>
                <div class="col-lg-2 col-md-4">
                    <div class="info-field">
                        <label class="info-label">估算日期</label>
                        <div class="info-value">${formatText(settings.estimationDate)}</div>
                    </div>
                </div>

                <div class="col-lg-2 col-md-4">
                    <div class="info-field" style="background-color: #f8fafc;">
                        <label class="info-label">工時單價 (NT$/Hr)</label>
                        <div class="info-value text-end">${formatNum(settings.pricePerMh)}</div>
                    </div>
                </div>
                
                <div class="col-lg-3 col-md-4">
                    <div class="info-field">
                        <label class="info-label">包商名稱</label>
                        <div class="info-value">${formatText(settings.contractorName)}</div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-4">
                    <div class="info-field">
                        <label class="info-label">負責人</label>
                        <div class="info-value">${formatText(settings.personInCharge)}</div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-4">
                    <div class="info-field">
                        <label class="info-label">報價日期</label>
                        <div class="info-value">${formatText(settings.estimationDate)}</div>
                    </div>
                </div>

                <div class="col-lg-3 col-md-8">
                    <div class="amount-box" style="border-left-color: #10b981; background: linear-gradient(to right, #ecfdf5, #ffffff);">
                        <label class="amount-label">工程估算總價</label>
                        <div class="amount-value text-success">${formatNum(settings.grandTotal)}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ==========================================
// 6. 表格明細渲染器 (擴充至 24 欄)
// ==========================================
function renderCategoryView(data) {
    const totals = {
        base: 0, indirect: 0, profit: 0, risk: 0, neg: 0, grand: 0,
        manHours: 0,
        sumIndirectRate: 0, sumProfitRate: 0, sumRiskRate: 0, sumNegRate: 0, itemCount: 0
    };

    const processedItems = data.items.map((item, idx) => {
        const qty = parseFloat(item.qty) || 0;
        const price = parseFloat(item.price) || 0;
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

            totals.sumIndirectRate += (item.indirectRate || 0);
            totals.sumProfitRate += (item.profitRate || 0);
            totals.sumRiskRate += (item.riskRate || 0);
            totals.sumNegRate += (item.negotiationRate || 0);
            totals.itemCount++;
        }

        return {
            ...item,
            baseCost, indirectAmt, profitAmt, riskAmt, negotiationAmt, 
            itemGrandTotal, mgmtUnitPrice,
            displayIndex: idx + 1
        };
    });

    let html = `
    <div class="table-container" style="border:none; border-radius:0;">
        <table class="estimation-table">
            <thead>
                <tr>
                    <th class="text-center sticky-col" style="min-width:50px">項次</th>
                    <th style="min-width: 150px;">專案分類</th>
                    <th style="min-width: 120px;">成本代碼</th>
                    <th style="min-width: 120px;">在建會科</th>
                    <th style="min-width: 120px;">項目編號</th>
                    <th style="min-width: 350px;">工程內容</th>
                    <th style="min-width: 120px;">執行部門</th>
                    <th style="min-width: 100px;">工種</th>
                    <th style="min-width: 90px;">單位</th>
                    <th class="text-end" style="min-width: 90px;">數量</th>
                    <th class="text-end" style="min-width: 120px;">單價</th> 
                    
                    <th class="border-cost col-cost text-end" style="min-width: 120px;">小計</th>
                    <th class="border-cost col-cost text-end" style="min-width: 120px;">利管單價</th>
                    <th class="border-indirect col-indirect text-center" style="min-width: 50px;">%</th>
                    <th class="col-indirect text-end" style="min-width: 90px;">間接費用</th>
                    <th class="border-profit col-profit text-center" style="min-width: 50px;">%</th>
                    <th class="col-profit text-end" style="min-width: 90px;">利潤</th>
                    <th class="border-risk col-risk text-center" style="min-width: 50px;">%</th>
                    <th class="col-risk text-end" style="min-width: 90px;">風險</th>
                    <th class="border-neg col-neg text-center" style="min-width: 50px;">%</th>
                    <th class="col-neg text-end" style="min-width: 90px;">議價</th>
                    <th class="border-total col-total text-end" style="min-width: 130px;">總計</th>
                    <th class="border-cost text-center" style="min-width: 80px;">工時(H)</th>
                    
                    <th style="min-width: 250px;">備註</th>
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

        html += `
            <tr class="category-header-row">
                <td class="category-header-title text-start ps-2 sticky-col" colspan="1" style="white-space: nowrap; overflow: visible;">
                    <i class="fas fa-folder-open me-2 text-primary"></i>${catName}
                </td>
                <td colspan="23" class="category-header-filler"></td>
            </tr>
        `;

        groupItems.forEach(item => {
            const trClass = item.change ? `change-${item.change}` : '';
            const badge = item.change ? getChangeBadge(item.change) : '';
            const rowStyle = item.change === 'deleted' ? 'text-decoration: line-through; color: #991b1b;' : '';

            html += `
                <tr class="${trClass}" style="${rowStyle}">
                    <td class="text-center sticky-col fw-bold text-dark">${displayCounter++}</td>
                    <td>${item.category}</td>
                    <td class="text-center">${item.costCode || ''}</td>
                    <td class="text-center">${item.accountCode || ''}</td>
                    <td class="text-center">${item.itemCode || ''}</td>
                    <td>${item.name} ${badge}</td>
                    <td class="text-center">${item.dept || ''}</td>
                    <td class="text-center">${item.workType || '-'}</td>
                    <td class="text-center">${item.unit}</td>
                    <td class="text-end fw-bold">${item.qty}</td>
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
                    
                    <td class="col-total">${item.change === 'deleted' ? '-' : item.itemGrandTotal.toLocaleString()}</td>
                    <td class="text-end">${item.manHours || '-'}</td>
                    
                    <td><small>${item.note || ''}</small></td>
                </tr>
            `;
        });

        html += `
            <tr class="category-subtotal-row bg-light fw-bold">
                <td></td>
                <td colspan="10" class="text-end text-secondary">${catName} 小計：</td>
                <td class="text-end text-dark">${sub.base.toLocaleString()}</td>
                <td colspan="9"></td>
                <td class="col-total">${sub.grand.toLocaleString()}</td>
                <td class="text-end text-dark">${sub.manHours}</td>
                <td></td>
            </tr>
        `;
    });

    const calcSimpleAvg = (sumRate, count) => count > 0 ? (sumRate / count).toFixed(2) + '%' : '0.00%';
    const avgIndirect = calcSimpleAvg(totals.sumIndirectRate, totals.itemCount);
    const avgProfit = calcSimpleAvg(totals.sumProfitRate, totals.itemCount);
    const avgRisk = calcSimpleAvg(totals.sumRiskRate, totals.itemCount);
    const avgNeg = calcSimpleAvg(totals.sumNegRate, totals.itemCount);

    const footerStyle = 'background-color: #f1f5f9 !important; font-weight: 700; border-top: 2px solid #94a3b8; color: #1e293b;';

    html += `
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td style="${footerStyle}"></td>
                    <td colspan="9" class="text-end" style="${footerStyle}">總計：</td>
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
                    <td class="text-center" style="${footerStyle}">${totals.manHours.toLocaleString()}</td>
                    <td style="${footerStyle}"></td>
                </tr>
            </tfoot>
        </table>
    </div>
    `;

    return { html, total: totals.grand };
}

function getChangeBadge(type) {
    if (type === 'added') return '<span class="badge bg-success ms-1">新</span>';
    if (type === 'modified') return '<span class="badge bg-warning text-dark ms-1">修</span>';
    if (type === 'deleted') return '<span class="badge bg-danger ms-1">刪</span>';
    return '';
}