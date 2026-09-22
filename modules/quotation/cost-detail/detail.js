/* detail.js - V12.26 升級：費用改以小計乘算，並修復滿版模式下的歷史單價彈窗層級問題 */

const CATEGORIES = ['專案材料', '共通耗材', '專案設計', '專案外包加工', '專案製造', '專案外包工程', '專案費用'];

const MATRIX_MAPPING = {
    ROWS: ['專案材料'], 
    COLS_COMMON: ['共通耗材'], 
    COLS_MFG: ['專案設計', '專案外包加工', '專案製造', '專案外包工程', '專案費用']
};

const DROPDOWN_OPTIONS = {
    categories: CATEGORIES,
    costCodes: ['DPCMM101', 'DPCMM102', 'DPCMM103', 'DPCMM104', 'DPCMM105', 'DPCMM106'],
    accountCodes: ['1251M1', '1251M2', '1251M3', '1251M4'],
    departments: ['工務部', '設計部', '製造廠', '品保部', '採購部'],
    workTypes: ['電銲工', '冷作工', '噴塗工', '焊接工'],
    units: ['kg', '式', '工', 'm', 'pcs', '組', '台']
};

const DetailEstimation = {
    estimationMode: 'standard', 
    viewMode: 'category', 
    
    currentEditingIndex: null, 
    matrixValues: {}, 
    
    currentTotals: {
        matSum: 0, matGrand: 0,
        mfgSum: 0, mfgGrand: 0,
        finalTotal: 0,
        totalMatQty: 0, totalMfgQty: 0, totalKgWeight: 0,
        totalMfgManHours: 0
    },

    product: {
        data: {
            items: [],
            basicData: {
                equipmentId: '', equipmentName: '', version: 'V1.0',
                shellThickness: '', innerDiameter: '', totalLength: '',
                totalWeight: 0, setQty: 1
            }
        }
    },

    init() {
        console.log('詳細估算工作台 V12.26 初始化...');
        
        // ★ 新增：修復滿版模式下的彈窗層疊問題
        this.fixModalStacking();

        const urlParams = new URLSearchParams(window.location.search);
        this.estimationMode = urlParams.get('mode') || 'standard';
        
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('estimationDate');
        if (dateInput) {
            dateInput.value = today;
        }

        if (!this.checkUrlParams()) {
            this.loadInitialData(); 
        }

        this.updateModeUI();
        this.renderTable(); 
        this.calculateMetrics(); 
        
        this.initBackLink();

        setTimeout(() => this.initHistoryLink(), 500);
        setTimeout(() => this.initHistoryLink(), 1500);
    },

    // ★ 新增功能：強制修正 Modal 在滿版時的層級
    fixModalStacking() {
        // 1. 強制拉高 Bootstrap Modal 及其遮罩的 z-index，確保蓋過滿版(z-index:9999)
        const style = document.createElement('style');
        style.innerHTML = `
            .modal-backdrop { z-index: 10400 !important; }
            .modal { z-index: 10500 !important; }
        `;
        document.head.appendChild(style);

        // 2. 將 Modal 實體移至 body 尾端，避免陷入父層的 Stacking Context (層疊上下文) 中
        const modalEl = document.getElementById('historyPriceModal');
        if (modalEl && modalEl.parentNode !== document.body) {
            document.body.appendChild(modalEl);
        }
    },

    initBackLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId') || urlParams.get('id') || urlParams.get('eqId');
        
        if (projectId) {
            const backBtn = document.querySelector('.back-btn');
            if (backBtn) {
                const currentHref = backBtn.getAttribute('href');
                if (currentHref) {
                    const separator = currentHref.includes('?') ? '&' : '?';
                    if (!currentHref.includes('projectId=')) {
                        backBtn.href = `${currentHref}${separator}projectId=${projectId}`;
                    }
                }
            }
        }
    },

    initHistoryLink() {
        const currentSearch = window.location.search;
        const historyLinks = document.querySelectorAll('a[href*="history"], a[href*="version"]');
        historyLinks.forEach(link => {
            if (link.href && !link.href.startsWith('#') && !link.href.includes('javascript')) {
                link.setAttribute('target', '_blank'); 
                if (currentSearch) {
                    const baseUrl = link.getAttribute('href').split('?')[0];
                    link.href = `${baseUrl}${currentSearch}`;
                }
            }
        });

        const historyBtns = document.querySelectorAll('button[onclick*="cost-history"]');
        if (historyBtns.length > 0) {
            historyBtns.forEach(btn => {
                btn.removeAttribute('onclick');
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetPath = '../cost-history/index.html'; 
                    const finalUrl = targetPath + currentSearch;
                    window.open(finalUrl, '_blank'); 
                };
            });
        }
    },

    updateModeUI() {
        const badge = document.getElementById('currentModeBadge');
        const viewControls = document.getElementById('viewModeControls');
        const matrixMetricsRow = document.getElementById('matrixMetricsRow');
        
        if (this.estimationMode === 'matrix') {
            if(badge) {
                badge.innerHTML = '<i class="fas fa-th me-2" style="font-size: 0.8rem;"></i>矩陣估算模式';
                badge.className = 'badge border border-success text-success bg-white';
            }
            if(viewControls) viewControls.style.display = 'none'; 
            if(matrixMetricsRow) matrixMetricsRow.style.display = 'flex';
        } else {
            if(badge) {
                badge.innerHTML = '<i class="fas fa-layer-group me-2" style="font-size: 0.8rem;"></i>一般估算模式';
                badge.className = 'badge border border-primary text-primary bg-white';
            }
            if(viewControls) viewControls.style.display = 'none'; 
            if(matrixMetricsRow) matrixMetricsRow.style.display = 'none';
        }
    },

    toggleFullscreen() {
        const section = document.getElementById('workbenchSection');
        const btn = document.getElementById('fullscreenBtn');
        const icon = btn.querySelector('i');

        if (section.classList.contains('fullscreen-mode')) {
            section.classList.remove('fullscreen-mode');
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
            btn.innerHTML = '<i class="fas fa-expand"></i> 滿版編輯';
            document.body.style.overflow = ''; 
        } else {
            section.classList.add('fullscreen-mode');
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
            btn.innerHTML = '<i class="fas fa-compress"></i> 退出滿版';
            document.body.style.overflow = 'hidden'; 
        }
    },

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const paramId = urlParams.get('id') || urlParams.get('eqId');
        const paramName = urlParams.get('name') || urlParams.get('title');
        
        if (paramId || paramName) {
            const pageTitle = document.getElementById('pageTitle');
            if(pageTitle) pageTitle.textContent = [paramName].filter(Boolean).join(' ');
            this.loadInitialData(); 
            if(paramId) document.getElementById('equipmentId').value = paramId;
            if(paramName) document.getElementById('equipmentName').value = paramName;
            return true;
        }
        return false;
    },

    toggleViewMode(mode) {
        this.viewMode = 'category';
        this.renderTable();
    },

    loadInitialData() {
        this.product.data.items = [
            { id: 1, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-STOQ', name: '鋼板(9t)', material: 'SS400', dept: '採購部', workType: '冷作工', unit: 'kg', qty: 2778, qtyMfg: 2500, cuttingLose: 10, price: 35, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '主體材料' },
            { id: 101, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-FLG', name: '法蘭 20K', material: 'SUS304', dept: '採購部', workType: '冷作工', unit: 'pcs', qty: 5, qtyMfg: 4, cuttingLose: 20, price: 1200, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '進口件' },
            
            { id: 201, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'C-WELD-01', name: '焊條 (E7016)', material: '-', dept: '製造廠', workType: '焊接工', unit: 'kg', qty: 50, qtyMfg: 50, cuttingLose: 0, price: 85, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '待轉共通耗材' },
            { id: 202, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'C-PAINT-01', name: '防鏽底漆', material: 'Epoxy', dept: '製造廠', workType: '噴塗工', unit: 'kg', qty: 20, qtyMfg: 20, cuttingLose: 0, price: 250, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '待轉共通耗材' },
            { id: 203, category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'C-BOLT-01', name: '鍍鋅螺栓 M16', material: 'SS41', dept: '採購部', workType: '冷作工', unit: 'set', qty: 200, qtyMfg: 200, cuttingLose: 0, price: 12, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 0, note: '待轉共通耗材' },

            { id: 2, category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '焊接工', material: '-', dept: '工務部', workType: '焊接工', unit: '工', qty: 1, qtyMfg: 0, cuttingLose: 0, price: 3500, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 2, note: '' },
            { id: 3, category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '冷作工', material: '-', dept: '工務部', workType: '冷作工', unit: '工', qty: 1, qtyMfg: 0, cuttingLose: 0, price: 3200, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 4, note: '' },
            { id: 4, category: '專案外包加工', costCode: 'DPCMM104', accountCode: '1251M4', matNo: '', name: '熱處理', material: '-', dept: '製造廠', workType: '熱處理', unit: '式', qty: 1, qtyMfg: 0, cuttingLose: 0, price: 15, indirectRate: 0, profitRate: 0, riskRate: 0, negotiationRate: 0, manHours: 0, note: '' }
        ];
        this.matrixValues = { '1_5_percent': 5, '1_5_price': 120, '1_2_price': 3500, '1_4_price': 15 }; 
    },

    renderTable() {
        const totals = this.calculateAllTotals();
        const mainTable = document.getElementById('mainTable');
        const matrixContainer = document.getElementById('matrixModeContainer');
        const tbody = document.getElementById('estimationTableBody');

        let metricsSource = totals;

        if (this.estimationMode === 'matrix') {
            if(mainTable) mainTable.style.display = 'none';
            if(matrixContainer) {
                matrixContainer.style.display = 'block';
                if(typeof this.renderContinuousMatrix === 'function') {
                    matrixContainer.innerHTML = this.renderContinuousMatrix(totals);
                    if (this.currentTotals) {
                        metricsSource = this.currentTotals;
                    }
                }
            }
        } else {
            if(matrixContainer) matrixContainer.style.display = 'none';
            if(mainTable) mainTable.style.display = 'table';
            if(tbody) {
                tbody.innerHTML = this.renderCategoryView(totals.calculatedItems);
            }
            this.updateFooter(totals);
        }
        
        this.updatePanelMetrics(metricsSource);
    },

    calculateAllTotals() {
        let totals = {
            base: 0, indirect: 0, profit: 0, risk: 0, negotiation: 0, grand: 0, manHours: 0,
            sumIndirectRate: 0, sumProfitRate: 0, sumRiskRate: 0, sumNegRate: 0, itemCount: 0,
            totalMatQty: 0, totalMfgQty: 0, totalKgWeight: 0, 
            calculatedItems: []
        };

        totals.calculatedItems = this.product.data.items.map((item, index) => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.price) || 0;
            const indirectRate = parseFloat(item.indirectRate) || 0;
            const profitRate = parseFloat(item.profitRate) || 0;
            const riskRate = parseFloat(item.riskRate) || 0;
            const negotiationRate = parseFloat(item.negotiationRate) || 0;

            const baseCost = Math.round(qty * price);
            
            const indirectAmt = Math.round(baseCost * (indirectRate / 100));
            const profitAmt = Math.round(baseCost * (profitRate / 100));
            const riskAmt = Math.round(baseCost * (riskRate / 100));
            const negotiationAmt = Math.round(baseCost * (negotiationRate / 100));
            
            const itemGrandTotal = baseCost + indirectAmt + profitAmt + riskAmt + negotiationAmt;
            const mgmtUnitPrice = qty > 0 ? Math.round(itemGrandTotal / qty) : 0;

            totals.base += baseCost;
            totals.indirect += indirectAmt;
            totals.profit += profitAmt;
            totals.risk += riskAmt;
            totals.negotiation += negotiationAmt;
            totals.grand += itemGrandTotal;
            totals.manHours += parseFloat(item.manHours || 0);

            const qtyMfg = parseFloat(item.qtyMfg) || 0;
            
            if (String(item.unit || '').toLowerCase() === 'kg') {
                totals.totalMatQty += qty;
                totals.totalMfgQty += qtyMfg;
                totals.totalKgWeight += qtyMfg; 
            }

            totals.sumIndirectRate += indirectRate;
            totals.sumProfitRate += profitRate;
            totals.sumRiskRate += riskRate;
            totals.sumNegRate += negotiationRate;
            totals.itemCount++;

            let rowCutLose = '-';
            if (qty > 0) { 
                 const lossPct = ((qty - qtyMfg) / qty) * 100;
                 rowCutLose = lossPct.toFixed(1) + '%';
            }

            return {
                originalIndex: index,
                data: item,
                metrics: { baseCost, indirectAmt, profitAmt, riskAmt, negotiationAmt, itemGrandTotal, mgmtUnitPrice, rowCutLose }
            };
        });

        this.currentTotals = totals;
        return totals;
    },

    generateRowHtml(item, originalIndex, metrics, displayIndex) {
        const { baseCost, indirectAmt, profitAmt, riskAmt, negotiationAmt, itemGrandTotal, mgmtUnitPrice, rowCutLose } = metrics;
        
        const moveControls = `
            <div class="d-flex justify-content-center gap-1">
                <button class="btn-sort" onclick="DetailEstimation.moveItem(${originalIndex}, -1)" title="上移"><i class="fas fa-arrow-up"></i></button>
                <button class="btn-sort" onclick="DetailEstimation.moveItem(${originalIndex}, 1)" title="下移"><i class="fas fa-arrow-down"></i></button>
                <button class="btn-sort btn-delete" onclick="DetailEstimation.removeItem(${originalIndex})" title="刪除"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        return `
            <tr data-id="${item.id}">
                <td class="text-center sticky-col">${moveControls}</td>
                <td class="text-center sticky-col text-dark fw-bold">${displayIndex}</td>
                <td><select class="form-input-compact" onchange="DetailEstimation.updateCategory(${originalIndex}, this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.categories, item.category)}</select></td>
                <td><select class="form-input-compact" onchange="DetailEstimation.updateItem(${originalIndex}, 'costCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.costCodes, item.costCode)}</select></td>
                <td><select class="form-input-compact" onchange="DetailEstimation.updateItem(${originalIndex}, 'accountCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.accountCodes, item.accountCode)}</select></td>
                <td><input type="text" class="form-input-compact" value="${item.matNo}" onchange="DetailEstimation.updateItem(${originalIndex}, 'matNo', this.value)"></td>
                
                <td class="sticky-col-7"><input type="text" class="form-input-compact" value="${item.name}" onchange="DetailEstimation.updateItem(${originalIndex}, 'name', this.value)"></td>
                
                <td><select class="form-input-compact" onchange="DetailEstimation.updateItem(${originalIndex}, 'dept', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.departments, item.dept)}</select></td>
                <td><select class="form-input-compact" onchange="DetailEstimation.updateItem(${originalIndex}, 'workType', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.workTypes, item.workType)}</select></td>
                <td><input type="text" class="form-input-compact" value="${item.material || ''}" onchange="DetailEstimation.updateItem(${originalIndex}, 'material', this.value)" placeholder="-"></td>
                <td><select class="form-input-compact text-center" onchange="DetailEstimation.updateItem(${originalIndex}, 'unit', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.units, item.unit)}</select></td>
                
                <td><input type="number" class="form-input-compact text-end" value="${item.qty}" onchange="DetailEstimation.updateItem(${originalIndex}, 'qty', this.value)"></td>
                <td><input type="number" class="form-input-compact text-end" value="${item.qtyMfg}" onchange="DetailEstimation.updateItem(${originalIndex}, 'qtyMfg', this.value)"></td>
                <td class="text-center small text-danger align-middle fw-bold">${rowCutLose}</td>

                <td>
                    <div class="input-group flex-nowrap input-group-price">
                        <input type="number" class="form-control form-input-compact text-end" value="${item.price}" onchange="DetailEstimation.updateItem(${originalIndex}, 'price', this.value)">
                        <button class="btn btn-outline-secondary" type="button" onclick="DetailEstimation.showHistory(${originalIndex})" title="查看歷史"><i class="fas fa-history"></i></button>
                    </div>
                </td>
                <td class="text-end border-cost col-cost align-middle">${Math.round(baseCost).toLocaleString()}</td>
                <td class="text-end border-cost col-cost align-middle">${mgmtUnitPrice.toLocaleString()}</td>
                
                <td class="border-indirect col-indirect p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.indirectRate}" onchange="DetailEstimation.updateItem(${originalIndex}, 'indirectRate', this.value)"></td>
                <td class="col-indirect text-end small align-middle">${indirectAmt.toLocaleString()}</td>
                <td class="border-profit col-profit p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.profitRate}" onchange="DetailEstimation.updateItem(${originalIndex}, 'profitRate', this.value)"></td>
                <td class="col-profit text-end small align-middle">${profitAmt.toLocaleString()}</td>
                <td class="border-risk col-risk p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.riskRate}" onchange="DetailEstimation.updateItem(${originalIndex}, 'riskRate', this.value)"></td>
                <td class="col-risk text-end small align-middle">${riskAmt.toLocaleString()}</td>
                <td class="border-neg col-neg p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.negotiationRate || 0}" onchange="DetailEstimation.updateItem(${originalIndex}, 'negotiationRate', this.value)"></td>
                <td class="col-neg text-end small align-middle">${negotiationAmt.toLocaleString()}</td>
                <td class="border-total col-total text-primary text-end align-middle">${itemGrandTotal.toLocaleString()}</td>
                <td class="p-1 border-cost"><input type="number" class="form-input-compact text-end bg-light" value="${item.manHours}" onchange="DetailEstimation.updateItem(${originalIndex}, 'manHours', this.value)"></td>
                <td><input type="text" class="form-input-compact" value="${item.note}" onchange="DetailEstimation.updateItem(${originalIndex}, 'note', this.value)"></td>
            </tr>
        `;
    },

    renderCategoryView(calculatedItems) {
        let html = '';
        const groups = {};
        CATEGORIES.forEach(c => groups[c] = []);
        groups['未分類'] = [];
        calculatedItems.forEach(obj => {
            const cat = obj.data.category || '未分類';
            if (groups[cat]) groups[cat].push(obj);
            else groups['未分類'].push(obj);
        });

        let globalDisplayIndex = 1;

        Object.keys(groups).forEach(catName => {
            const groupItems = groups[catName];
            if (groupItems.length === 0) return;
            
            const sub = groupItems.reduce((acc, obj) => {
                acc.base += obj.metrics.baseCost;
                acc.grand += obj.metrics.itemGrandTotal;
                acc.manHours += (obj.data.manHours || 0);
                return acc;
            }, { base: 0, grand: 0, manHours: 0 });

            html += `
                <tr class="category-header-row">
                    <td colspan="2" class="category-header-title sticky-col"><i class="fas fa-folder-open me-2 text-primary"></i>${catName}</td>
                    <td colspan="4" class="category-header-filler"></td>
                    <td class="category-header-filler sticky-col-7"></td>
                    <td colspan="21" class="category-header-filler"></td>
                </tr>
            `;
            groupItems.forEach(obj => {
                html += this.generateRowHtml(obj.data, obj.originalIndex, obj.metrics, globalDisplayIndex++);
            });
            html += `
                <tr class="category-subtotal-row">
                    <td colspan="2" class="sticky-col"></td>
                    <td colspan="4"></td>
                    <td class="sticky-col-7"></td>
                    <td colspan="8" class="text-end text-secondary">${catName} 小計：</td>
                    <td class="text-end text-dark">${Math.round(sub.base).toLocaleString()}</td>
                    <td colspan="9"></td>
                    <td class="text-end text-primary">${Math.round(sub.grand).toLocaleString()}</td>
                    <td class="text-center text-dark">${sub.manHours}</td>
                    <td></td>
                </tr>
            `;
        });
        return html;
    },

    updateFooter(totals) {
        if(!document.getElementById('footerBaseTotal')) return; 
        
        document.getElementById('footerBaseTotal').textContent = Math.round(totals.base).toLocaleString();
        document.getElementById('footerIndirectTotal').textContent = Math.round(totals.indirect).toLocaleString();
        document.getElementById('footerProfitTotal').textContent = Math.round(totals.profit).toLocaleString();
        document.getElementById('footerRiskTotal').textContent = Math.round(totals.risk).toLocaleString();
        document.getElementById('footerNegTotal').textContent = Math.round(totals.negotiation).toLocaleString();
        document.getElementById('footerGrandTotal').textContent = Math.round(totals.grand).toLocaleString();
        document.getElementById('footerManHours').textContent = totals.manHours.toLocaleString();

        const calcSimpleAvg = (sumRate, count) => {
            if (count > 0) return (sumRate / count).toFixed(2) + '%';
            return '0.00%';
        };

        document.getElementById('footerIndirectAvg').textContent = calcSimpleAvg(totals.sumIndirectRate, totals.itemCount);
        document.getElementById('footerProfitAvg').textContent = calcSimpleAvg(totals.sumProfitRate, totals.itemCount);
        document.getElementById('footerRiskAvg').textContent = calcSimpleAvg(totals.sumRiskRate, totals.itemCount);
        document.getElementById('footerNegAvg').textContent = calcSimpleAvg(totals.sumNegRate, totals.itemCount);

        if (document.getElementById('footerMatQty')) {
            document.getElementById('footerMatQty').textContent = Math.round(totals.totalMatQty).toLocaleString();
            document.getElementById('footerMfgQty').textContent = Math.round(totals.totalMfgQty).toLocaleString();
            
            let globalCutLose = '-';
            if (totals.totalMatQty > 0) {
                globalCutLose = (((totals.totalMatQty - totals.totalMfgQty) / totals.totalMatQty) * 100).toFixed(2) + '%';
            }
            document.getElementById('footerCutLose').textContent = globalCutLose;
        }

        let tfoot = document.querySelector('#mainTable tfoot');
        if (tfoot) {
            tfoot.querySelectorAll('.custom-summary-row').forEach(el => el.remove());
        }
    },

    updatePanelMetrics(totals) {
        const { 
            grand = 0, manHours = 0, totalKgWeight = 0, finalTotal = 0,
            matSum = 0, matGrand = 0, 
            mfgSum = 0, mfgGrand = 0, 
            totalMfgQty = 0, totalMfgManHours = 0 
        } = totals;

        const displayTotal = (this.estimationMode === 'matrix') ? finalTotal : grand;
        const displayManHours = (this.estimationMode === 'matrix') ? totalMfgManHours : manHours;

        const grandTotalDisplay = document.getElementById('grandTotalDisplay');
        if(grandTotalDisplay) grandTotalDisplay.textContent = Math.round(displayTotal).toLocaleString();
        
        const setInput = document.getElementById('setQty');
        const setQty = parseFloat(setInput ? setInput.value : 1) || 1;
        this.product.data.basicData.setQty = setQty;
        
        const projectTotal = Math.round(displayTotal * setQty);
        const projectTotalDisplay = document.getElementById('projectTotalDisplay');
        if(projectTotalDisplay) projectTotalDisplay.textContent = projectTotal.toLocaleString();

        const pricePerMh = displayManHours > 0 ? Math.round(displayTotal / displayManHours) : 0;
        const pricePerMhEl = document.getElementById('pricePerMh');
        if(pricePerMhEl) pricePerMhEl.textContent = pricePerMh.toLocaleString();
        
        const pricePerKg = totalKgWeight > 0 ? Math.round(displayTotal / totalKgWeight) : 0;
        const pricePerKgEl = document.getElementById('pricePerKg');
        if(pricePerKgEl) pricePerKgEl.textContent = pricePerKg.toLocaleString();

        if (this.estimationMode === 'matrix') {
            const factor = totalMfgQty > 0 ? (1000 / totalMfgQty) : 0;
            const mxMatCostUnit = Math.round(matSum * factor);
            const mxMatMgmtUnit = Math.round(matGrand * factor);
            const mxMfgCostUnit = Math.round(mfgSum * factor);
            const mxMfgMgmtUnit = Math.round(mfgGrand * factor);
            const mxTotalMgmtUnit = mxMatMgmtUnit + mxMfgMgmtUnit;
            
            const setText = (id, val) => {
                const el = document.getElementById(id);
                if(el) el.textContent = val.toLocaleString();
            };

            setText('mxMatCostUnit', mxMatCostUnit);
            setText('mxMatMgmtUnit', mxMatMgmtUnit);
            setText('mxMfgCostUnit', mxMfgCostUnit);
            setText('mxMfgMgmtUnit', mxMfgMgmtUnit);
            setText('mxTotalMgmtUnit', mxTotalMgmtUnit);
            setText('mxTotalManHours', totalMfgManHours);
        }
    },

    calculateMetrics() { this.renderTable(); },
    
    updateItem(index, field, value) {
        const item = this.product.data.items[index];
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        if (['qty', 'price', 'qtyMfg', 'manHours', 'indirectRate', 'profitRate', 'riskRate', 'negotiationRate'].includes(field)) {
            item[field] = numValue;
        } else { item[field] = value; }
        this.renderTable();
    },

    addItem(targetGroup = null) {
        const defaultIndirect = parseFloat(document.getElementById('globalIndirect')?.value || 2);
        const defaultProfit = parseFloat(document.getElementById('globalProfit')?.value || 2);
        const defaultRisk = parseFloat(document.getElementById('globalRisk')?.value || 2);
        const defaultNeg = parseFloat(document.getElementById('globalNeg')?.value || 2);

        this.product.data.items.push({
            id: Date.now(), 
            category: '專案材料', 
            costCode: DROPDOWN_OPTIONS.costCodes[0], 
            accountCode: DROPDOWN_OPTIONS.accountCodes[0], 
            matNo: '', name: '', material: '', 
            dept: '採購部', 
            workType: '冷作工', 
            unit: 'kg', 
            qty: 0, qtyMfg: 0, cuttingLose: 0, price: 0, 
            indirectRate: defaultIndirect, 
            profitRate: defaultProfit, 
            riskRate: defaultRisk, 
            negotiationRate: defaultNeg, 
            manHours: 0, note: ''
        });
        this.renderTable();
    },

    removeItem(index) {
        if(confirm('確定要刪除此項目嗎？')) {
            this.product.data.items.splice(index, 1);
            this.renderTable();
        }
    },
    
    applyGlobalRate(type, rateValue) {
        const rate = parseFloat(rateValue) || 0;
        if(confirm(`確定更新所有項目的費率為 ${rate}% 嗎？`)) {
            this.product.data.items.forEach(item => {
                if(type === 'indirect') item.indirectRate = rate;
                if(type === 'profit') item.profitRate = rate;
                if(type === 'risk') item.riskRate = rate;
                if(type === 'negotiation') item.negotiationRate = rate;
            });
            this.renderTable();
        }
    },
    
    saveData() { 
        if (typeof LiangLianSystem !== 'undefined') LiangLianSystem.showToast('成本估算資料已儲存', 'success');
        else alert('成本估算資料已儲存'); 
    },
    
    completeEstimation() { 
        if(confirm('確定要完成成本估算嗎？\n完成後將鎖定本份估算單，並同步狀態至專案總覽。')) {
            if (typeof LiangLianSystem !== 'undefined') {
                LiangLianSystem.showToast('成本估算已完成並鎖定', 'success');
                setTimeout(() => {
                    const backBtn = document.querySelector('.back-btn');
                    if (backBtn) backBtn.click();
                }, 1500);
            } else {
                alert('成本估算已完成並鎖定');
            }
        }
    },

    getOptionsHtml(options, selectedValue) {
        return options.map(opt => `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`).join('');
    },
    
    showHistory(index) {
        this.currentEditingIndex = index;
        const item = this.product.data.items[index];
        document.getElementById('historyItemName').textContent = item.name || '-';
        document.getElementById('historyItemMatNo').textContent = item.matNo || '-';
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = this.generateMockHistory(item.price > 0 ? item.price : 1000).map(r => `<tr><td>${r.date}</td><td>${r.vendor}</td><td>${r.projectNo}</td><td class="text-end">${Math.round(r.price).toLocaleString()}</td><td>${r.note}</td><td class="text-center"><button class="btn btn-sm btn-primary" onclick="DetailEstimation.applyHistoryPrice(${r.price})">選擇</button></td></tr>`).join('');
        new bootstrap.Modal(document.getElementById('historyPriceModal')).show();
    },
    
    applyHistoryPrice(price) {
        if (this.currentEditingIndex !== null) {
            this.updateItem(this.currentEditingIndex, 'price', price);
            bootstrap.Modal.getInstance(document.getElementById('historyPriceModal')).hide();
        }
    },
    
    generateMockHistory(basePrice) {
        return Array.from({length: 5}, (_, i) => ({ date: '2024-01-0' + (i+1), vendor: '中鋼機械', projectNo: 'EQ-00' + i, price: Math.round(basePrice * (1 + (Math.random()-0.5)*0.2)), note: '-' }));
    },
    
    moveItem(index, direction) {
        if ((direction === -1 && index === 0) || (direction === 1 && index === this.product.data.items.length - 1)) return;
        const temp = this.product.data.items[index];
        this.product.data.items[index] = this.product.data.items[index + direction];
        this.product.data.items[index + direction] = temp;
        this.renderTable();
    },
    
    updateCategory(index, newCategory) { this.updateItem(index, 'category', newCategory); },
    
    updateMatrixValue(key, value) {
        if(value === '' || value === '0') delete this.matrixValues[key]; else this.matrixValues[key] = parseFloat(value);
        this.renderTable();
    },

    getProductTypeFromNo(qNo) {
        const upperQNo = (qNo || '').toUpperCase();
        if (upperQNo.includes('PC')) return '塔槽 (PC)';
        if (upperQNo.includes('SS')) return '鋼結構 (SS)';
        if (upperQNo.includes('HE')) return '熱交換器 (HE)';
        if (upperQNo.includes('TK')) return '儲槽 (TK)';
        if (qNo.trim() !== '') return '一般設備';
        return '未定義';
    },

    exportToExcel() {
        if (!window.XLSX_STYLE_LOADED) {
            if (typeof LiangLianSystem !== 'undefined' && typeof LiangLianSystem.showToast === 'function') {
                LiangLianSystem.showToast('首次匯出需載入樣式引擎，請稍候...', 'info');
            }
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
            script.onload = () => {
                window.XLSX_STYLE_LOADED = true;
                this._executeExcelExport();
            };
            script.onerror = () => {
                alert('載入樣式引擎失敗，將以基本無樣式格式匯出。');
                this._executeExcelExport();
            };
            document.head.appendChild(script);
        } else {
            this._executeExcelExport();
        }
    },

    _executeExcelExport() {
        try {
            let tableElement;
            if (this.estimationMode === 'matrix') {
                const container = document.getElementById('matrixModeContainer');
                tableElement = container ? container.querySelector('table') : null;
            } else {
                tableElement = document.getElementById('mainTable');
            }

            if (!tableElement) {
                alert('找不到可匯出的表格資料！');
                return;
            }

            const cloneTable = tableElement.cloneNode(true);

            cloneTable.querySelectorAll('.custom-summary-row').forEach(row => row.remove());

            cloneTable.querySelectorAll('input').forEach(input => {
                const textNode = document.createTextNode(input.value || '');
                input.parentNode.replaceChild(textNode, input);
            });

            cloneTable.querySelectorAll('select').forEach(select => {
                const selectedOption = select.options[select.selectedIndex];
                const textNode = document.createTextNode(selectedOption ? selectedOption.text : '');
                select.parentNode.replaceChild(textNode, select);
            });

            cloneTable.querySelectorAll('button, .btn-sort').forEach(btn => btn.remove());

            if (this.estimationMode !== 'matrix') {
                const rows = cloneTable.querySelectorAll('tr');
                rows.forEach(tr => {
                    if (tr.classList.contains('category-header-row')) {
                        while(tr.children.length > 1) {
                            tr.removeChild(tr.lastChild);
                        }
                        if (tr.children[0]) {
                            tr.children[0].colSpan = 26; 
                            tr.children[0].style.textAlign = 'left';
                        }
                    } else if (tr.classList.contains('category-subtotal-row')) {
                        const catTitle = tr.children[3].textContent;
                        const baseCost = tr.children[4].textContent; 
                        const grandCost = tr.children[6].textContent;
                        const manHours = tr.children[7].textContent;
                        
                        while(tr.firstChild) tr.removeChild(tr.firstChild);
                        tr.innerHTML = `
                            <td colspan="13" class="text-end text-secondary">${catTitle}</td>
                            <td class="text-end text-dark">${baseCost}</td>
                            <td colspan="9"></td>
                            <td class="text-end text-primary">${grandCost}</td>
                            <td class="text-center text-dark">${manHours}</td>
                            <td></td>
                        `;
                    } else if (tr.classList.contains('total-row')) {
                        const actualMetricsTds = Array.from(tr.children).slice(5);
                        const newTr = document.createElement('tr');
                        const tdTotal = document.createElement('td');
                        tdTotal.colSpan = 9; 
                        tdTotal.className = "text-end";
                        tdTotal.textContent = "總計：";
                        newTr.appendChild(tdTotal);
                        actualMetricsTds.forEach(td => newTr.appendChild(td.cloneNode(true)));
                        tr.parentNode.replaceChild(newTr, tr);
                    } else {
                        if (tr.children.length > 2) {
                            tr.removeChild(tr.children[2]); 
                            tr.removeChild(tr.children[0]); 
                        }
                    }
                });
            }

            let maxCols = 0;
            cloneTable.querySelectorAll('tr').forEach(tr => {
                let currentCols = 0;
                Array.from(tr.children).forEach(td => {
                    currentCols += parseInt(td.getAttribute('colspan') || 1);
                });
                if (currentCols > maxCols) maxCols = currentCols;
            });
            if (maxCols === 0) maxCols = 26;

            cloneTable.querySelectorAll('.category-header-row').forEach(row => {
                if (row.children.length > 0) row.children[0].colSpan = maxCols;
            });

            let excelTotalColIdx = 23; 
            const originalHeaders = cloneTable.querySelectorAll('thead tr');
            const headerRow = originalHeaders[originalHeaders.length - 1]; 
            
            const colAlignments = {};
            if (headerRow) {
                headerRow.classList.add('table-header-row');
                let currentIdx = 0;
                for (const th of headerRow.children) {
                    const text = th.textContent.trim();
                    const colspan = parseInt(th.getAttribute('colspan') || 1);
                    
                    if (text === '總計') {
                        excelTotalColIdx = currentIdx;
                    }

                    let align = 'center'; 
                    if (text.includes('工程內容') || text.includes('品名規格') || text.includes('備註')) {
                        align = 'left';
                    } else if (['單價', '小計', '費用', '利潤', '風險', '議價', '總計', '金額'].some(kw => text.includes(kw))) {
                        align = 'right';
                    }
                    
                    for (let i = 0; i < colspan; i++) {
                        colAlignments[currentIdx + i] = align;
                    }
                    currentIdx += colspan;
                }
            }

            const thead = cloneTable.querySelector('thead');
            
            const urlParams = new URLSearchParams(window.location.search);
            const currentProjectId = urlParams.get('projectId') || urlParams.get('id') || urlParams.get('eqId');
            
            const mockProjectMaster = [
                { id: 'EQ25090001', quotationId: 'LME-11210-PE060', name: '台積電12廠潔淨室建置工程', owner: '台灣積體電路', product: '潔淨室系統' },
                { id: 'EQ25090002', quotationId: 'LME-11210-PD201', name: '聯電8廠產線自動化升級工程', owner: '聯華電子', product: '產線自動化系統' },
                { id: 'EQ25090003', quotationId: 'LME-11210-PC020', name: '鴻海土城廠智慧工廠MES系統', owner: '鴻海精密', product: 'MES系統' },
                { id: 'EQ25090004', quotationId: 'LME-11210-EI060', name: '廣達龜山廠伺服器機房冷卻系統', owner: '廣達電腦', product: '冷卻系統' },
                { id: 'EQ25090005', quotationId: 'LME-11210-ZZ099', name: '中鋼高雄廠煉鋼爐設備維護保養', owner: '中國鋼鐵', product: '維護保養服務' },
                { id: 'EQ25090006', quotationId: 'LME-11211-AA001', name: '日月光K7廠廢水處理擴建工程', owner: '日月光投控', product: '廢水處理系統' }
            ];
            
            const projData = mockProjectMaster.find(p => p.id === currentProjectId) || {
                owner: '未指定', name: '未指定', product: '未指定', quotationId: '未提供'
            };

            const qNoInput = document.getElementById('quotationNo');
            const qNo = qNoInput?.value || projData.quotationId || '未提供';
            
            const parsedProduct = this.getProductTypeFromNo(qNo);
            const product = parsedProduct !== '未定義' ? parsedProduct : projData.product;
            
            const owner = projData.owner;
            const projectName = urlParams.get('name') || projData.name;
            const revision = document.getElementById('version')?.value || 'V1.0';
            const estDate = document.getElementById('estimationDate')?.value || new Date().toISOString().split('T')[0];
            const location = document.getElementById('projectLocation')?.value || '未指定地點';
            const workNature = document.getElementById('workNature')?.value || '一般工程';

            if (thead) {
                const infoPairs = [
                    [ { label: '業主：', value: owner }, { label: '版次：', value: revision } ],
                    [ { label: '工程名稱：', value: projectName }, { label: '估算日期：', value: estDate }],
                    [ { label: '產品：', value: product }, { label: '報價編號：', value: qNo } ],
                    [ { label: '設備編號：', value: document.getElementById('equipmentId')?.value || '' }, { label: '設備名稱：', value: document.getElementById('equipmentName')?.value || '' } ]
                ];

                let rowsToInsert = [];
                const trTitle = document.createElement('tr');
                trTitle.className = 'title-row'; 
                const thTitle = document.createElement('th');
                thTitle.textContent = '成本估算表'; 
                thTitle.colSpan = maxCols; 
                thTitle.style.textAlign = 'center';
                trTitle.appendChild(thTitle);
                rowsToInsert.push(trTitle);

                const halfCols = Math.floor(maxCols / 2);
                const val1Cols = halfCols - 2;
                const val2Cols = maxCols - halfCols - 2;

                infoPairs.forEach(pair => {
                    const tr = document.createElement('tr');
                    tr.className = 'basic-info-row'; 
                    const th1 = document.createElement('th'); th1.textContent = pair[0].label; th1.colSpan = 2; tr.appendChild(th1);
                    const td1 = document.createElement('td'); td1.textContent = pair[0].value; td1.colSpan = val1Cols > 0 ? val1Cols : 1; tr.appendChild(td1);
                    const th2 = document.createElement('th'); th2.textContent = pair[1].label; th2.colSpan = 2; tr.appendChild(th2);
                    const td2 = document.createElement('td'); td2.textContent = pair[1].value; td2.colSpan = val2Cols > 0 ? val2Cols : 1; tr.appendChild(td2);
                    rowsToInsert.push(tr);
                });

                const bodyThickness = document.getElementById('shellThickness')?.value || '-';
                const innerDiameter = document.getElementById('innerDiameter')?.value || '-';
                const totalLength = document.getElementById('totalLength')?.value || '-';
                
                const trDimTitle = document.createElement('tr');
                trDimTitle.className = 'dim-title-row';
                const thDim1 = document.createElement('th'); thDim1.textContent = '胴身厚'; thDim1.colSpan = Math.floor(maxCols / 3); 
                const thDim2 = document.createElement('th'); thDim2.textContent = '內徑'; thDim2.colSpan = Math.floor(maxCols / 3); 
                const thDim3 = document.createElement('th'); thDim3.textContent = '總長度'; thDim3.colSpan = maxCols - thDim1.colSpan - thDim2.colSpan; 
                trDimTitle.appendChild(thDim1); trDimTitle.appendChild(thDim2); trDimTitle.appendChild(thDim3);

                const trDimVal = document.createElement('tr');
                trDimVal.className = 'dim-val-row';
                const tdDim1 = document.createElement('td'); tdDim1.textContent = bodyThickness; tdDim1.colSpan = thDim1.colSpan; 
                const tdDim2 = document.createElement('td'); tdDim2.textContent = innerDiameter; tdDim2.colSpan = thDim2.colSpan; 
                const tdDim3 = document.createElement('td'); tdDim3.textContent = totalLength; tdDim3.colSpan = thDim3.colSpan; 
                trDimVal.appendChild(tdDim1); trDimVal.appendChild(tdDim2); trDimVal.appendChild(tdDim3);

                rowsToInsert.push(trDimTitle);
                rowsToInsert.push(trDimVal);

                rowsToInsert.reverse().forEach(tr => {
                    thead.insertBefore(tr, thead.firstChild);
                });
            }

            let tfoot = cloneTable.querySelector('tfoot');
            if (!tfoot) {
                tfoot = document.createElement('tfoot');
                cloneTable.appendChild(tfoot);
            }

            const equipmentQty = document.getElementById('setQty')?.value || '1';
            const projectGrandTotalDisplay = document.getElementById('projectTotalDisplay')?.textContent || Math.round((this.currentTotals.grand || 0) * (parseFloat(equipmentQty) || 1)).toLocaleString();
            const totalWeight = Math.round(this.currentTotals.totalKgWeight || 0).toLocaleString();

            const appendSummaryRow = (label, value) => {
                const tr = document.createElement('tr');
                tr.className = 'custom-summary-row'; 
                
                const th = document.createElement('th');
                th.colSpan = excelTotalColIdx; 
                th.textContent = label;
                
                const td = document.createElement('td');
                td.textContent = value;
                
                const tdEmpty = document.createElement('td');
                tdEmpty.colSpan = maxCols - excelTotalColIdx - 1;

                tr.appendChild(th);
                tr.appendChild(td);
                if (tdEmpty.colSpan > 0) tr.appendChild(tdEmpty);
                
                tfoot.appendChild(tr);
            };

            appendSummaryRow('總重量(KG)：', totalWeight);
            appendSummaryRow('套數：', equipmentQty);
            appendSummaryRow('專案總價：', projectGrandTotalDisplay);

            const remarksValue = document.getElementById('projectRemarks')?.value || '';
            const trRemarkTitle = document.createElement('tr');
            trRemarkTitle.className = 'remark-title-row'; 
            const tdRemarkTitle = document.createElement('td');
            tdRemarkTitle.textContent = '【備註事項】'; 
            tdRemarkTitle.colSpan = maxCols; 
            trRemarkTitle.appendChild(tdRemarkTitle);
            tfoot.appendChild(trRemarkTitle);

            const lines = (remarksValue || '無').split('\n');
            lines.forEach(line => {
                const trRemark = document.createElement('tr');
                trRemark.className = 'remark-data-row'; 
                const tdRemark = document.createElement('td');
                tdRemark.textContent = line || '\u200B'; 
                tdRemark.colSpan = maxCols;
                trRemark.appendChild(tdRemark);
                tfoot.appendChild(trRemark);
            });

            const space1 = Math.floor((maxCols - 9) / 3);
            const space2 = space1;
            const space3 = (maxCols - 9) - space1 - space2;

            const trSign = document.createElement('tr');
            trSign.className = 'signature-row'; 
            const tdSign1 = document.createElement('td'); tdSign1.textContent = '估算人：'; tdSign1.colSpan = 3; tdSign1.style.textAlign = 'left'; 
            trSign.appendChild(tdSign1);
            const tdSign1Space = document.createElement('td'); tdSign1Space.colSpan = space1 > 0 ? space1 : 1; trSign.appendChild(tdSign1Space);

            const tdSign2 = document.createElement('td'); tdSign2.textContent = '單位主管：'; tdSign2.colSpan = 3; tdSign2.style.textAlign = 'left'; 
            trSign.appendChild(tdSign2);
            const tdSign2Space = document.createElement('td'); tdSign2Space.colSpan = space2 > 0 ? space2 : 1; trSign.appendChild(tdSign2Space);

            const tdSign3 = document.createElement('td'); tdSign3.textContent = '核准：'; tdSign3.colSpan = 3; tdSign3.style.textAlign = 'left'; 
            trSign.appendChild(tdSign3);
            const tdSign3Space = document.createElement('td'); tdSign3Space.colSpan = space3 > 0 ? space3 : 1; trSign.appendChild(tdSign3Space);

            tfoot.appendChild(trSign);

            cloneTable.querySelectorAll('th, td').forEach(cell => {
                if (!cell.textContent || cell.textContent.trim() === '') {
                    cell.textContent = '\u200B'; 
                }
            });

            const trs = cloneTable.querySelectorAll('tr');
            const rowTypes = Array.from(trs).map(tr => {
                if (tr.classList.contains('title-row')) return 'title';
                if (tr.classList.contains('basic-info-row')) return 'basic_info';
                if (tr.classList.contains('dim-title-row')) return 'dim_header';
                if (tr.classList.contains('dim-val-row')) return 'dim_value';
                if (tr.classList.contains('table-header-row')) return 'table_header';
                if (tr.classList.contains('category-header-row')) return 'category_header';
                if (tr.classList.contains('category-subtotal-row')) return 'subtotal';
                if (tr.classList.contains('total-row')) return 'total';
                if (tr.classList.contains('custom-summary-row')) return 'summary';
                if (tr.classList.contains('remark-title-row')) return 'remarks_title';
                if (tr.classList.contains('remark-data-row')) return 'remarks_data';
                if (tr.classList.contains('signature-row')) return 'signatures';
                return 'table_data';
            });

            const workbook = XLSX.utils.table_to_book(cloneTable, { sheet: "成本估算", raw: true });
            const ws = workbook.Sheets["成本估算"];

            if (ws['!ref']) {
                const range = XLSX.utils.decode_range(ws['!ref']);
                
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                        if (!ws[cellAddress]) {
                            ws[cellAddress] = { v: '', t: 's' };
                        }
                    }
                }

                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const rType = rowTypes[R] || 'table_data';
                    
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                        const cell = ws[cellAddress];
                        if (!cell) continue;

                        if (!cell.s) cell.s = {};
                        
                        cell.s.font = { name: '標楷體', sz: 11 };
                        cell.s.alignment = { vertical: 'center', wrapText: true };

                        const isNoBorder = ['title', 'basic_info'].includes(rType);
                        if (!isNoBorder) {
                            cell.s.border = {
                                top: { style: 'thin', color: { rgb: "000000" } },
                                bottom: { style: 'thin', color: { rgb: "000000" } },
                                left: { style: 'thin', color: { rgb: "000000" } },
                                right: { style: 'thin', color: { rgb: "000000" } }
                            };
                        }

                        if (['dim_header', 'table_header'].includes(rType)) {
                            cell.s.fill = { fgColor: { rgb: "F1F5F9" } };
                        } else if (['subtotal', 'total', 'summary'].includes(rType)) {
                            cell.s.fill = { fgColor: { rgb: "FBF9EF" } };
                        }

                        if (['title', 'dim_header', 'table_header', 'category_header', 'subtotal', 'total', 'summary', 'remarks_title', 'signatures'].includes(rType)) {
                            cell.s.font.bold = true;
                        } else if (rType === 'basic_info' && typeof cell.v === 'string' && cell.v.includes('：')) {
                            cell.s.font.bold = true;
                        }

                        if (rType === 'title') {
                            cell.s.font.sz = 16;
                            cell.s.font.underline = true;
                            cell.s.alignment.horizontal = 'center';
                        } else if (rType === 'basic_info') {
                            cell.s.alignment.horizontal = 'left';
                        } else if (['dim_header', 'dim_value'].includes(rType)) {
                            cell.s.alignment.horizontal = 'center';
                        } else if (['table_header', 'table_data'].includes(rType)) {
                            cell.s.alignment.horizontal = colAlignments[C] || 'center';
                        } else if (['category_header', 'remarks_title', 'remarks_data'].includes(rType)) {
                            cell.s.alignment.horizontal = 'left';
                        } else if (['subtotal', 'total', 'summary'].includes(rType)) {
                            cell.s.alignment.horizontal = 'right';
                        } else if (rType === 'signatures') {
                            cell.s.alignment.horizontal = 'left';
                        }
                    }
                }
            }

            const today = new Date();
            const dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
            
            const eqName = document.getElementById('equipmentName')?.value || '未命名設備';
            const fileName = `成本估算表_${qNo}_${eqName}_${dateStr}.xlsx`;

            XLSX.writeFile(workbook, fileName);

            if (typeof LiangLianSystem !== 'undefined' && typeof LiangLianSystem.showToast === 'function') {
                LiangLianSystem.showToast('Excel 匯出成功！', 'success');
            } else {
                alert('Excel 匯出成功！');
            }

        } catch (error) {
            console.error('匯出 Excel 發生錯誤:', error);
            alert('匯出 Excel 失敗，請檢查操作是否正確。');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { 
    DetailEstimation.init(); 
});