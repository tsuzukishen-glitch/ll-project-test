/* eng_detail.js - V3.1 升級版 (完全比照成本估算工作台的 Excel 樣式與邏輯) */

const CATEGORIES = ['直接費用', '專業外包工程', '假設工程', '安衛環設施', '其他費用'];

// ★ 預設選項設定，供給下拉選單使用
const DROPDOWN_OPTIONS = {
    categories: CATEGORIES,
    costCodes: ['DPCCIN013', 'DPCCIN254', 'DPCCIN014', 'DPCCIN010', 'DPCCPP008', 'DPCEIN755', 'DPCME420', 'DPCEIN752'],
    accountCodes: ['1256CIN', '1256CPP', '125409', '1251E4'],
    departments: ['建造部', '工務部', '設計部', '採購部'],
    workTypes: ['保溫', '搭架', '清運', '其他'],
    units: ['SM', '式', 'PC', 'M', '組', '台']
};

const DEFAULT_REMARKS = `1. 上述金額以新台幣計及不含5%加值營業稅。附件圖面僅為參考圖面，實際以施工圖面為主。
2. 本工程為總價承包責任施工，責任範圍內不得以任何原因及理由辦理追加。
3. 以上報價金額已含為完成本工程所需之人力及相關施工人員保險。
4. 所有為完成本工程所需之施工機具如：吊具、吊車、高空作業車、發電機、銲機、砂輪機、個人手工具、安全衛生器材…等等均由承商負責。
5. 物料載運至工地現場，承商需負責相關儲存、保管工作。
6. 現場施工區域環境清理含廢棄物載運清理(事業及生活廢棄物載出廠外或業主指定區域)
7. 相關施工說明/規範及圖面詳附件。
8. 其他未盡事宜依現場監工及業主指示辦理。
9. 保溫工資/材料已包含保溫支撐環(不分尺寸)、保溫小料(不鏽鋼束帶、保溫釘及Silicon等規範訂定之小料)，以連工帶料方式。
10. 工期：預計112/11/1~112/11/30 (實際日期依業主排定時程)。`;

const EngineeringDetail = {
    currentTotals: { grandTotal: 0, manHours: 0 },
    currentEditingIndex: null, 
    
    product: {
        data: {
            items: [],
            basicData: {}
        }
    },

    // 取得產品類別 (供匯出 Excel 動態計算使用)
    getProductTypeFromNo(qNo) {
        const upperQNo = (qNo || '').toUpperCase();
        if (upperQNo.includes('PC')) return '塔槽 (PC)';
        if (upperQNo.includes('SS')) return '鋼結構 (SS)';
        if (upperQNo.includes('HE')) return '熱交換器 (HE)';
        if (upperQNo.includes('TK')) return '儲槽 (TK)';
        if (qNo.trim() !== '') return '一般設備';
        return '未定義';
    },

    init() {
        console.log('工程估算工作台 V3.1 (升級版) 初始化...');
        
        this.fixHtmlStructure();

        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('estimationDate');
        if (dateInput) {
            dateInput.value = today;
        }

        const remarksEl = document.getElementById('projectRemarks');
        if (remarksEl && !remarksEl.value.trim()) {
            remarksEl.value = DEFAULT_REMARKS;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const itemName = urlParams.get('name');
        if (itemName) {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = itemName; 
        }

        this.loadInitialData();
        this.renderTable();
        this.initBackLink();

        setTimeout(() => this.initHistoryLink(), 500);
        setTimeout(() => this.initHistoryLink(), 1500);
    },

    fixHtmlStructure() {
        const th7 = document.querySelector('#mainTable thead th:nth-child(7)');
        if (th7 && !th7.classList.contains('sticky-col-7')) {
            th7.classList.add('sticky-col-7');
        }
    },

    initBackLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId') || urlParams.get('id') || urlParams.get('eqId');
        
        if (projectId) {
            const backBtn = document.querySelector('.back-btn');
            if (backBtn) {
                const currentHref = backBtn.getAttribute('href');
                if (currentHref && !currentHref.includes('projectId=')) {
                    const separator = currentHref.includes('?') ? '&' : '?';
                    backBtn.href = `${currentHref}${separator}projectId=${projectId}`;
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

        const historyBtns = document.querySelectorAll('button[onclick*="history"], button[onclick*="showVersionHistory"]');
        if (historyBtns.length > 0) {
            historyBtns.forEach(btn => {
                btn.removeAttribute('onclick');
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetPath = '../eng-history/index.html'; 
                    const finalUrl = targetPath + currentSearch;
                    window.open(finalUrl, '_blank'); 
                };
            });
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

    loadInitialData() {
        this.product.data.items = [
            { id: 1, category: '專業外包工程', costCode: 'DPCCIN013', accountCode: '1256CIN', itemCode: 'DPCCIN013', name: 'V-1204 塔槽保溫拆除(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 1232, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 120, note: '' },
            { id: 2, category: '專業外包工程', costCode: 'DPCCIN254', accountCode: '1256CIN', itemCode: 'DPCCIN254', name: 'V-1204 塔槽保溫(ID.2780 * H 10000)', dept: '建造部', workType: '保溫', unit: 'SM', qty: 94, price: 3310, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 200, note: '*依中油保溫規範:內覆材(50mm)+外覆材' },
            { id: 7, category: '專業外包工程', costCode: 'DPCEIN755', accountCode: '125409', itemCode: 'DPCEIN755', name: '廢棄物清運', dept: '建造部', workType: '清運', unit: '式', qty: 1, price: 25000, indirectRate: 2, profitRate: 2, riskRate: 2, negotiationRate: 2, manHours: 8, note: '' }
        ];
    },

    calculateAllTotals() {
        let totals = {
            base: 0, indirect: 0, profit: 0, risk: 0, negotiation: 0, grand: 0, manHours: 0,
            sumIndirectRate: 0, sumProfitRate: 0, sumRiskRate: 0, sumNegRate: 0, itemCount: 0,
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
            const costAfterIndirect = baseCost + indirectAmt;
            const profitAmt = Math.round(costAfterIndirect * (profitRate / 100));
            const costAfterProfit = costAfterIndirect + profitAmt;
            const riskAmt = Math.round(costAfterProfit * (riskRate / 100));
            const costAfterRisk = costAfterProfit + riskAmt;
            const negotiationAmt = Math.round(costAfterRisk * (negotiationRate / 100));
            
            const itemGrandTotal = costAfterRisk + negotiationAmt;
            const mgmtUnitPrice = qty > 0 ? Math.round(itemGrandTotal / qty) : 0;

            totals.base += baseCost;
            totals.indirect += indirectAmt;
            totals.profit += profitAmt;
            totals.risk += riskAmt;
            totals.negotiation += negotiationAmt;
            totals.grand += itemGrandTotal;
            totals.manHours += parseFloat(item.manHours || 0);

            totals.sumIndirectRate += indirectRate;
            totals.sumProfitRate += profitRate;
            totals.sumRiskRate += riskRate;
            totals.sumNegRate += negotiationRate;
            totals.itemCount++;

            return {
                originalIndex: index,
                data: item,
                metrics: { baseCost, indirectAmt, profitAmt, riskAmt, negotiationAmt, itemGrandTotal, mgmtUnitPrice }
            };
        });
        
        this.currentTotals = totals;
        this.updatePanelMetrics(totals);

        return totals;
    },

    updatePanelMetrics(totals) {
        const { grand = 0, manHours = 0 } = totals;
        
        const grandTotalDisplay = document.getElementById('grandTotalDisplay');
        if (grandTotalDisplay) grandTotalDisplay.textContent = Math.round(grand).toLocaleString();
        
        const pricePerMh = manHours > 0 ? Math.round(grand / manHours) : 0;
        const pricePerMhEl = document.getElementById('pricePerMh');
        if (pricePerMhEl) pricePerMhEl.textContent = pricePerMh.toLocaleString();
    },

    generateRowHtml(item, originalIndex, metrics, displayIndex) {
        const { baseCost, indirectAmt, profitAmt, riskAmt, negotiationAmt, itemGrandTotal, mgmtUnitPrice } = metrics;
        
        const moveControls = `
            <div class="d-flex justify-content-center gap-1">
                <button class="btn-sort" onclick="EngineeringDetail.moveItem(${originalIndex}, -1)" title="上移"><i class="fas fa-arrow-up"></i></button>
                <button class="btn-sort" onclick="EngineeringDetail.moveItem(${originalIndex}, 1)" title="下移"><i class="fas fa-arrow-down"></i></button>
                <button class="btn-sort btn-delete" onclick="EngineeringDetail.removeItem(${originalIndex})" title="刪除"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        return `
            <tr data-id="${item.id}">
                <td class="text-center sticky-col">${moveControls}</td>
                <td class="text-center sticky-col text-dark fw-bold">${displayIndex}</td>
                <td><select class="form-input-compact" onchange="EngineeringDetail.updateItem(${originalIndex}, 'category', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.categories, item.category)}</select></td>
                <td><select class="form-input-compact" onchange="EngineeringDetail.updateItem(${originalIndex}, 'costCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.costCodes, item.costCode)}</select></td>
                <td><select class="form-input-compact" onchange="EngineeringDetail.updateItem(${originalIndex}, 'accountCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.accountCodes, item.accountCode)}</select></td>
                <td><input type="text" class="form-input-compact text-center" value="${item.itemCode}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'itemCode', this.value)"></td>
                <td class="sticky-col-7"><input type="text" class="form-input-compact" value="${item.name}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'name', this.value)"></td>
                <td><select class="form-input-compact" onchange="EngineeringDetail.updateItem(${originalIndex}, 'dept', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.departments, item.dept)}</select></td>
                <td><select class="form-input-compact text-center" onchange="EngineeringDetail.updateItem(${originalIndex}, 'workType', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.workTypes, item.workType)}</select></td>
                <td><select class="form-input-compact text-center" onchange="EngineeringDetail.updateItem(${originalIndex}, 'unit', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.units, item.unit)}</select></td>
                <td><input type="number" class="form-input-compact text-end text-primary fw-bold" value="${item.qty}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'qty', this.value)"></td>
                <td>
                    <div class="input-group flex-nowrap input-group-price">
                        <input type="number" class="form-control form-input-compact text-end" value="${item.price}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'price', this.value)">
                        <button class="btn btn-outline-secondary" type="button" onclick="EngineeringDetail.showHistory(${originalIndex})" title="查看歷史"><i class="fas fa-history"></i></button>
                    </div>
                </td>
                
                <td class="text-end border-cost col-cost align-middle">${Math.round(baseCost).toLocaleString()}</td>
                <td class="text-end border-cost col-cost align-middle">${mgmtUnitPrice.toLocaleString()}</td>
                
                <td class="border-indirect col-indirect p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.indirectRate}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'indirectRate', this.value)"></td>
                <td class="col-indirect text-end small align-middle">${indirectAmt.toLocaleString()}</td>
                
                <td class="border-profit col-profit p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.profitRate}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'profitRate', this.value)"></td>
                <td class="col-profit text-end small align-middle">${profitAmt.toLocaleString()}</td>
                
                <td class="border-risk col-risk p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.riskRate}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'riskRate', this.value)"></td>
                <td class="col-risk text-end small align-middle">${riskAmt.toLocaleString()}</td>
                
                <td class="border-neg col-neg p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.negotiationRate || 0}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'negotiationRate', this.value)"></td>
                <td class="col-neg text-end small align-middle">${negotiationAmt.toLocaleString()}</td>
                
                <td class="border-total col-total text-primary text-end align-middle">${itemGrandTotal.toLocaleString()}</td>
                <td class="p-1 border-cost"><input type="number" class="form-input-compact text-end bg-light" value="${item.manHours}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'manHours', this.value)"></td>
                
                <td><input type="text" class="form-input-compact" value="${item.note}" onchange="EngineeringDetail.updateItem(${originalIndex}, 'note', this.value)"></td>
            </tr>
        `;
    },

    renderTable() {
        const totals = this.calculateAllTotals();
        const tbody = document.getElementById('estimationTableBody');
        if (!tbody) return;

        let html = '';
        const groups = {};
        CATEGORIES.forEach(c => groups[c] = []);
        groups['未分類'] = [];
        
        totals.calculatedItems.forEach(obj => {
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
                    <td colspan="18" class="category-header-filler"></td>
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
                    <td colspan="5" class="text-end text-secondary">${catName} 小計：</td>
                    <td class="text-end text-dark">${Math.round(sub.base).toLocaleString()}</td>
                    <td colspan="9"></td>
                    <td class="text-end text-primary">${Math.round(sub.grand).toLocaleString()}</td>
                    <td class="text-center text-dark">${sub.manHours}</td>
                    <td></td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        this.updateFooter(totals);
    },

    updateFooter(totals) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.textContent = val.toLocaleString();
        };
        
        setVal('footerBaseTotal', Math.round(totals.base));
        setVal('footerIndirectTotal', Math.round(totals.indirect));
        setVal('footerProfitTotal', Math.round(totals.profit));
        setVal('footerRiskTotal', Math.round(totals.risk));
        setVal('footerNegTotal', Math.round(totals.negotiation));
        setVal('footerGrandTotal', Math.round(totals.grand));
        setVal('footerManHours', totals.manHours);

        const calcSimpleAvg = (sumRate, count) => count > 0 ? (sumRate / count).toFixed(2) + '%' : '0.00%';
        setVal('footerIndirectAvg', calcSimpleAvg(totals.sumIndirectRate, totals.itemCount));
        setVal('footerProfitAvg', calcSimpleAvg(totals.sumProfitRate, totals.itemCount));
        setVal('footerRiskAvg', calcSimpleAvg(totals.sumRiskRate, totals.itemCount));
        setVal('footerNegAvg', calcSimpleAvg(totals.sumNegRate, totals.itemCount));
    },

    updateItem(index, field, value) {
        const item = this.product.data.items[index];
        if (['qty', 'price', 'indirectRate', 'profitRate', 'riskRate', 'negotiationRate', 'manHours'].includes(field)) {
            let numValue = parseFloat(value);
            item[field] = isNaN(numValue) ? 0 : numValue;
        } else {
            item[field] = value;
        }
        this.renderTable();
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

    addItem() {
        const defaultIndirect = parseFloat(document.getElementById('globalIndirect')?.value || 2);
        const defaultProfit = parseFloat(document.getElementById('globalProfit')?.value || 2);
        const defaultRisk = parseFloat(document.getElementById('globalRisk')?.value || 2);
        const defaultNeg = parseFloat(document.getElementById('globalNeg')?.value || 2);

        this.product.data.items.push({
            id: Date.now(), 
            category: '專業外包工程', 
            costCode: DROPDOWN_OPTIONS.costCodes[0], 
            accountCode: DROPDOWN_OPTIONS.accountCodes[0], 
            itemCode: '', 
            name: '', dept: '建造部', 
            workType: DROPDOWN_OPTIONS.workTypes[0], 
            unit: '式', qty: 1, price: 0,
            indirectRate: defaultIndirect, profitRate: defaultProfit, 
            riskRate: defaultRisk, negotiationRate: defaultNeg, manHours: 0, note: ''
        });
        this.renderTable();
    },

    removeItem(index) {
        if(confirm('確定要刪除此項目嗎？')) {
            this.product.data.items.splice(index, 1);
            this.renderTable();
        }
    },

    moveItem(index, direction) {
        if ((direction === -1 && index === 0) || (direction === 1 && index === this.product.data.items.length - 1)) return;
        const temp = this.product.data.items[index];
        this.product.data.items[index] = this.product.data.items[index + direction];
        this.product.data.items[index + direction] = temp;
        this.renderTable();
    },

    getOptionsHtml(options, selectedValue) {
        return options.map(opt => `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`).join('');
    },

    showHistory(index) {
        this.currentEditingIndex = index;
        const item = this.product.data.items[index];
        document.getElementById('historyItemName').textContent = item.name || '-';
        document.getElementById('historyItemMatNo').textContent = item.itemCode || '-';
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = this.generateMockHistory(item.price > 0 ? item.price : 1000).map(r => `<tr><td>${r.date}</td><td>${r.vendor}</td><td>${r.projectNo}</td><td class="text-end">${Math.round(r.price).toLocaleString()}</td><td>${r.note}</td><td class="text-center"><button class="btn btn-sm btn-primary" onclick="EngineeringDetail.applyHistoryPrice(${r.price})">選擇</button></td></tr>`).join('');
        new bootstrap.Modal(document.getElementById('historyPriceModal')).show();
    },
    
    applyHistoryPrice(price) {
        if (this.currentEditingIndex !== null) {
            this.updateItem(this.currentEditingIndex, 'price', price);
            bootstrap.Modal.getInstance(document.getElementById('historyPriceModal')).hide();
        }
    },

    generateMockHistory(basePrice) {
        return Array.from({length: 5}, (_, i) => ({ date: '2024-01-0' + (i+1), vendor: '三煌實業', projectNo: 'EQ-00' + i, price: Math.round(basePrice * (1 + (Math.random()-0.5)*0.2)), note: '-' }));
    },

    saveData() { 
        if (typeof LiangLianSystem !== 'undefined') LiangLianSystem.showToast('工程估算資料已儲存', 'success');
        else alert('工程估算資料已儲存'); 
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
            const tableElement = document.getElementById('mainTable');
            if (!tableElement) return;

            const cloneTable = tableElement.cloneNode(true);

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

            // ★ 智慧化欄位動態刪除 (比照 detail.js)
            const targetKeywords = ['操作', '專案分類'];
            let removeColIndexes = new Set();
            
            cloneTable.querySelectorAll('thead tr').forEach(row => {
                let colIdx = 0;
                Array.from(row.children).forEach(cell => {
                    const text = cell.textContent.trim();
                    const colspan = parseInt(cell.getAttribute('colspan') || 1);
                    if (targetKeywords.some(kw => text.includes(kw))) {
                        for(let i=0; i<colspan; i++) removeColIndexes.add(colIdx + i);
                    }
                    colIdx += colspan;
                });
            });

            cloneTable.querySelectorAll('tr').forEach(row => {
                if (row.classList.contains('category-header-row')) {
                    while(row.children.length > 1) { row.removeChild(row.lastChild); }
                    return; 
                }
                
                let colIdx = 0;
                let cells = Array.from(row.children);
                let cellsToRemove = [];

                cells.forEach(cell => {
                    const colspan = parseInt(cell.getAttribute('colspan') || 1);
                    let overlap = 0;
                    for (let i = 0; i < colspan; i++) {
                        if (removeColIndexes.has(colIdx + i)) overlap++;
                    }
                    
                    if (overlap === colspan) {
                        cellsToRemove.push(cell);
                    } else if (overlap > 0) {
                        cell.setAttribute('colspan', colspan - overlap);
                    }
                    colIdx += colspan;
                });

                cellsToRemove.forEach(cell => row.removeChild(cell));
            });

            let maxCols = 0;
            cloneTable.querySelectorAll('tr').forEach(tr => {
                let currentCols = 0;
                Array.from(tr.children).forEach(td => {
                    currentCols += parseInt(td.getAttribute('colspan') || 1);
                });
                if (currentCols > maxCols) maxCols = currentCols;
            });
            if (maxCols === 0) maxCols = 23;

            cloneTable.querySelectorAll('.category-header-row').forEach(row => {
                if (row.children.length > 0) row.children[0].colSpan = maxCols;
            });

            // 尋找「總計」欄位，以對齊摘要內容
            let excelTotalColIdx = 20; 
            const originalHeaders = cloneTable.querySelectorAll('thead tr');
            const headerRow = originalHeaders[originalHeaders.length - 1]; 
            
            // ★ 動態建立各欄位的文字對齊方式設定
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
                    if (text.includes('工程項目名稱') || text.includes('品名規格') || text.includes('備註') || text.includes('內容')) {
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
            const currentProjectId = urlParams.get('projectId') || urlParams.get('id') || ''; 
            
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
            const location = document.getElementById('location')?.value || '未指定地點';
            const workNature = document.getElementById('workNature')?.value || '一般工程';

            if (thead) {
                const infoPairs = [
                    [ { label: '業主：', value: owner }, { label: '版次：', value: revision } ],
                    [ { label: '工程名稱：', value: projectName }, { label: '估算日期：', value: estDate } ],
                    [ { label: '產品：', value: product }, { label: '報價編號：', value: qNo } ],
                    [ { label: '施工地點：', value: location }, { label: '工作性質：', value: workNature } ]
                ];

                let rowsToInsert = [];
                const trTitle = document.createElement('tr');
                trTitle.className = 'title-row'; 
                const thTitle = document.createElement('th');
                thTitle.textContent = '工程估算表'; // ★ 取消 【】
                thTitle.colSpan = maxCols; 
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

                rowsToInsert.reverse().forEach(tr => {
                    thead.insertBefore(tr, thead.firstChild);
                });
            }

            let tfoot = cloneTable.querySelector('tfoot');
            if (!tfoot) {
                tfoot = document.createElement('tfoot');
                cloneTable.appendChild(tfoot);
            }

            const remarksValue = document.getElementById('projectRemarks')?.value || '';
            const trRemarkTitle = document.createElement('tr');
            trRemarkTitle.className = 'remark-title-row'; 
            const tdRemarkTitle = document.createElement('td');
            tdRemarkTitle.textContent = '【備註事項】'; // ★ 更名為備註事項
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

            // 移除空行，直上簽核區塊
            const space1 = Math.floor((maxCols - 9) / 3);
            const space2 = space1;
            const space3 = (maxCols - 9) - space1 - space2;

            const contractorName = document.getElementById('contractorName')?.value || '';
            const personInCharge = document.getElementById('personInCharge')?.value || '';
            const quoteDate = document.getElementById('quotationDate')?.value || '';

            // ★ 包商名稱、負責人、報價日期 (這三個項目比照簽核列，並全置左)
            const trSignTop = document.createElement('tr');
            trSignTop.className = 'signature-row'; 
            const tdTop1 = document.createElement('td'); tdTop1.textContent = '包商名稱：'; tdTop1.colSpan = 3; 
            trSignTop.appendChild(tdTop1);
            const tdTop1Space = document.createElement('td'); tdTop1Space.colSpan = space1 > 0 ? space1 : 1; tdTop1Space.textContent = contractorName; trSignTop.appendChild(tdTop1Space);

            const tdTop2 = document.createElement('td'); tdTop2.textContent = '負責人：'; tdTop2.colSpan = 3; 
            trSignTop.appendChild(tdTop2);
            const tdTop2Space = document.createElement('td'); tdTop2Space.colSpan = space2 > 0 ? space2 : 1; tdTop2Space.textContent = personInCharge; trSignTop.appendChild(tdTop2Space);

            const tdTop3 = document.createElement('td'); tdTop3.textContent = '報價日期：'; tdTop3.colSpan = 3; 
            trSignTop.appendChild(tdTop3);
            const tdTop3Space = document.createElement('td'); tdTop3Space.colSpan = space3 > 0 ? space3 : 1; tdTop3Space.textContent = quoteDate; trSignTop.appendChild(tdTop3Space);

            tfoot.appendChild(trSignTop);

            // ★ 估算人、單位主管、核准 (全置左)
            const trSign = document.createElement('tr');
            trSign.className = 'signature-row'; 
            const tdSign1 = document.createElement('td'); tdSign1.textContent = '估算人：'; tdSign1.colSpan = 3; 
            trSign.appendChild(tdSign1);
            const tdSign1Space = document.createElement('td'); tdSign1Space.colSpan = space1 > 0 ? space1 : 1; trSign.appendChild(tdSign1Space);

            const tdSign2 = document.createElement('td'); tdSign2.textContent = '單位主管：'; tdSign2.colSpan = 3; 
            trSign.appendChild(tdSign2);
            const tdSign2Space = document.createElement('td'); tdSign2Space.colSpan = space2 > 0 ? space2 : 1; trSign.appendChild(tdSign2Space);

            const tdSign3 = document.createElement('td'); tdSign3.textContent = '核准：'; tdSign3.colSpan = 3; 
            trSign.appendChild(tdSign3);
            const tdSign3Space = document.createElement('td'); tdSign3Space.colSpan = space3 > 0 ? space3 : 1; trSign.appendChild(tdSign3Space);

            tfoot.appendChild(trSign);

            cloneTable.querySelectorAll('th, td').forEach(cell => {
                if (!cell.textContent || cell.textContent.trim() === '') {
                    cell.textContent = '\u200B'; 
                }
            });

            // ★ 將 DOM 行解析出語意類別，供 SheetJS 精準套用樣式
            const trs = cloneTable.querySelectorAll('tr');
            const rowTypes = Array.from(trs).map(tr => {
                if (tr.classList.contains('title-row')) return 'title';
                if (tr.classList.contains('basic-info-row')) return 'basic_info';
                if (tr.classList.contains('table-header-row')) return 'table_header';
                if (tr.classList.contains('category-header-row')) return 'category_header';
                if (tr.classList.contains('category-subtotal-row')) return 'subtotal';
                if (tr.classList.contains('total-row') || tr.classList.contains('avg-row')) return 'total';
                if (tr.classList.contains('remark-title-row')) return 'remarks_title';
                if (tr.classList.contains('remark-data-row')) return 'remarks_data';
                if (tr.classList.contains('signature-row')) return 'signatures';
                return 'table_data';
            });

            const workbook = XLSX.utils.table_to_book(cloneTable, { sheet: "工程估算", raw: true });
            const ws = workbook.Sheets["工程估算"];

            if (ws['!ref']) {
                const range = XLSX.utils.decode_range(ws['!ref']);
                
                // 第一階段：補齊隱藏格
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                        if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
                    }
                }

                // 第二階段：精準應用樣式 (框線、背景色、對齊、粗體)
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const rType = rowTypes[R] || 'table_data';
                    
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                        const cell = ws[cellAddress];
                        if (!cell) continue;

                        if (!cell.s) cell.s = {};
                        
                        // 基本字體設定
                        cell.s.font = { name: '標楷體', sz: 11 };
                        cell.s.alignment = { vertical: 'center', wrapText: true };

                        // 1. 處理框線 (僅基礎資料與大標題無框線，其餘包含備註全框)
                        const isNoBorder = ['title', 'basic_info'].includes(rType);
                        if (!isNoBorder) {
                            cell.s.border = {
                                top: { style: 'thin', color: { rgb: "000000" } },
                                bottom: { style: 'thin', color: { rgb: "000000" } },
                                left: { style: 'thin', color: { rgb: "000000" } },
                                right: { style: 'thin', color: { rgb: "000000" } }
                            };
                        }

                        // 2. 處理背景色
                        if (['table_header'].includes(rType)) {
                            cell.s.fill = { fgColor: { rgb: "F1F5F9" } };
                        } else if (['subtotal', 'total'].includes(rType)) {
                            cell.s.fill = { fgColor: { rgb: "FBF9EF" } };
                        }

                        // 3. 處理粗體 (修改：簽核資料內文不加粗，僅標題加粗)
                        if (['title', 'table_header', 'category_header', 'subtotal', 'total', 'remarks_title'].includes(rType)) {
                            cell.s.font.bold = true;
                        } else if (['basic_info', 'signatures'].includes(rType) && typeof cell.v === 'string' && cell.v.includes('：')) {
                            cell.s.font.bold = true;
                        }

                        // 4. 處理對齊
                        if (rType === 'title') {
                            cell.s.font.sz = 16;
                            cell.s.font.underline = true;
                            cell.s.alignment.horizontal = 'center';
                        } else if (rType === 'basic_info') {
                            cell.s.alignment.horizontal = 'left';
                        } else if (['table_header', 'table_data'].includes(rType)) {
                            cell.s.alignment.horizontal = colAlignments[C] || 'center';
                        } else if (['category_header', 'remarks_title', 'remarks_data'].includes(rType)) {
                            cell.s.alignment.horizontal = 'left';
                        } else if (['subtotal', 'total'].includes(rType)) {
                            cell.s.alignment.horizontal = 'right';
                        } else if (rType === 'signatures') {
                            cell.s.alignment.horizontal = 'left';
                        }
                    }
                }
            }

            const today = new Date();
            const dateStr = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
            
            // ★ 確保產出正確的工程估算檔名
            const fileName = `工程估算表_${qNo}_${workNature}_${dateStr}.xlsx`;

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

window.showVersionHistory = function() {
    const currentSearch = window.location.search;
    window.open(`../eng-history/index.html${currentSearch}`, '_blank');
};

window.completeEstimation = function() {
    if(confirm('確定要完成工程估算嗎？\n完成後將鎖定本份估算單，並同步狀態至專案總覽。')) {
        if (typeof LiangLianSystem !== 'undefined') {
            LiangLianSystem.showToast('工程估算已完成並鎖定', 'success');
            setTimeout(() => {
                const backBtn = document.querySelector('.back-btn');
                if (backBtn) backBtn.click();
            }, 1500);
        } else {
            alert('工程估算已完成並鎖定');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { EngineeringDetail.init(); });