/* indirect.js - V4.2.1 升級版 (修復 Excel 匯出網址 ID 判斷機能) */

const CATEGORIES = ['專案人力', '臨時辦公室', '住宿', '交通費', '機具', '整地', '臨時圍籬', '工安設施', '其他'];
const DROPDOWN_OPTIONS = {
    categories: CATEGORIES,
    costCodes: ['DSTESVH01', 'DSTESVH02', 'DSTESVH03', 'DSTEAF752', 'DSTETE751', 'DSTCTC255', 'DSTEIN754', 'DSTMX537', 'DSTMA625'],
    accountCodes: ['1253A01', '125411', '125401', '1256CTC', '125409', '1256CCV', '1251X5', '1251A6'],
    departments: ['建造部', '工務部', '品保部', '採購部'],
    workTypes: ['機電', '保溫', '搭架', '清運', '其他'],
    units: ['m', 'set', 'd', 'lot', '式', '人', 'hr'] 
};

// 薪資計算參數
const SALARY_RATES = {
    "北部": { "專案經理 (Site Manager)": { base: 90000, offsite: 15000, food: 9900, acc: 8000 }, "總管理師/總工程師 (Manager)": { base: 90000, offsite: 15000, food: 9900, acc: 8000 }, "工地主任/副理 (Deputy Manager)": { base: 75000, offsite: 15000, food: 9900, acc: 8000 }, "監工/品保 (Site Supervisor)": { base: 65000, offsite: 15000, food: 9900, acc: 8000 }, "正副課長/主任/資深 (Supervisor)": { base: 65000, offsite: 15000, food: 9900, acc: 8000 }, "正副組長/高級/中級/助理 (Engineer)": { base: 60000, offsite: 15000, food: 9900, acc: 8000 }, "工安/初級/助理/事務 (HSE)": { base: 50000, offsite: 15000, food: 9900, acc: 8000 } },
    "中部": { "專案經理 (Site Manager)": { base: 90000, offsite: 12000, food: 8100, acc: 7000 }, "總管理師/總工程師 (Manager)": { base: 90000, offsite: 15000, food: 9900, acc: 8000 }, "工地主任/副理 (Deputy Manager)": { base: 75000, offsite: 12000, food: 8100, acc: 7000 }, "監工/品保 (Site Supervisor)": { base: 65000, offsite: 12000, food: 8100, acc: 7000 }, "正副課長/主任/資深 (Supervisor)": { base: 65000, offsite: 15000, food: 9900, acc: 8000 }, "正副組長/高級/中級/助理 (Engineer)": { base: 60000, offsite: 12000, food: 8100, acc: 7000 }, "工安/初級/助理/事務 (HSE)": { base: 50000, offsite: 12000, food: 8100, acc: 7000 } },
    "南部": { "專案經理 (Site Manager)": { base: 90000, offsite: 9000, food: 8100, acc: 6500 }, "總管理師/總工程師 (Manager)": { base: 90000, offsite: 15000, food: 9900, acc: 8000 }, "工地主任/副理 (Deputy Manager)": { base: 75000, offsite: 9000, food: 8100, acc: 6500 }, "監工/品保 (Site Supervisor)": { base: 65000, offsite: 9000, food: 8100, acc: 6500 }, "正副課長/主任/資深 (Supervisor)": { base: 65000, offsite: 15000, food: 9900, acc: 8000 }, "正副組長/高級/中級/助理 (Engineer)": { base: 60000, offsite: 9000, food: 8100, acc: 6500 }, "工安/初級/助理/事務 (HSE)": { base: 50000, offsite: 9000, food: 8100, acc: 6500 } },
    "高雄同一區域": { "專案經理 (Site Manager)": { base: 90000, offsite: 4500, food: 8100, acc: 0 }, "總管理師/總工程師 (Manager)": { base: 90000, offsite: 15000, food: 9900, acc: 8000 }, "工地主任/副理 (Deputy Manager)": { base: 75000, offsite: 4500, food: 8100, acc: 0 }, "監工/品保 (Site Supervisor)": { base: 65000, offsite: 4500, food: 8100, acc: 0 }, "正副課長/主任/資深 (Supervisor)": { base: 65000, offsite: 15000, food: 9900, acc: 8000 }, "正副組長/高級/中級/助理 (Engineer)": { base: 60000, offsite: 4500, food: 8100, acc: 0 }, "工安/初級/助理/事務 (HSE)": { base: 50000, offsite: 4500, food: 8100, acc: 0 } }
};

const INS_RATE = 0.21; 
const SEC_RATE = 0.17; 

const BASE_ROLES = ["專案經理 (Site Manager)","總管理師/總工程師 (Manager)", "工地主任/副理 (Deputy Manager)", "監工/品保 (Site Supervisor)","正副課長/主任/資深 (Supervisor)", "正副組長/高級/中級/助理 (Engineer)", "工安/初級/助理/事務 (HSE)"];
const PERSONNEL_ROLES = [];
BASE_ROLES.forEach(role => {
    PERSONNEL_ROLES.push(role);
    PERSONNEL_ROLES.push(`${role} - 加班`);
});

const IndirectCost = {
    currentTotals: { grandTotal: 0 },
    currentEditingIndex: null,
    data: { items: [], scheduleItems: [] },

    init() {
        console.log('工程間接成本工作台 V4.2.1 初始化...');
        const today = new Date().toISOString().split('T')[0];
        const dateEl = document.getElementById('estimationDate');
        if (dateEl) dateEl.value = today;
        
        const urlParams = new URLSearchParams(window.location.search);
        const itemName = urlParams.get('name');
        if (itemName) {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = itemName; 
        }

        this.loadInitialData();
        this.renderTable();
        this.renderScheduleTable();
    },

    getMonthsRange() {
        const startVal = document.getElementById('startDate').value || '2025-11';
        const endVal = document.getElementById('endDate').value || '2026-12';
        
        let d1 = new Date(startVal + '-01');
        let d2 = new Date(endVal + '-01');
        if(d2 < d1) d2 = new Date(d1);

        let startObj = new Date(d1);
        startObj.setMonth(startObj.getMonth() - 1);
        let startExtraKey = `${startObj.getFullYear()}-${String(startObj.getMonth()+1).padStart(2, '0')}`;

        let endObj = new Date(d2);
        endObj.setMonth(endObj.getMonth() + 1);
        let endExtraKey = `${endObj.getFullYear()}-${String(endObj.getMonth()+1).padStart(2, '0')}`;

        const months = [];
        let curr = new Date(startObj);
        while(curr <= endObj) {
            let key = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2, '0')}`;
            months.push({
                year: curr.getFullYear(),
                month: curr.getMonth() + 1,
                key: key,
                isExtra: (key === startExtraKey || key === endExtraKey)
            });
            curr.setMonth(curr.getMonth() + 1);
        }
        return months;
    },

    getExtraMonthsKeys() {
        const startVal = document.getElementById('startDate').value || '2025-11';
        const endVal = document.getElementById('endDate').value || '2026-12';
        
        let d1 = new Date(startVal + '-01');
        d1.setMonth(d1.getMonth() - 1);
        let startExtraKey = `${d1.getFullYear()}-${String(d1.getMonth()+1).padStart(2, '0')}`;
        let minDate = `${startExtraKey}-01`;

        let d2 = new Date(endVal + '-01');
        d2.setMonth(d2.getMonth() + 1);
        let endExtraKey = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2, '0')}`;
        let lastDay = new Date(d2.getFullYear(), d2.getMonth() + 1, 0).getDate();
        let maxDate = `${endExtraKey}-${String(lastDay).padStart(2, '0')}`;
        
        return { minDate, maxDate };
    },

    onDateChange() {
        const { minDate, maxDate } = this.getExtraMonthsKeys();

        if (this.data.scheduleItems) {
            this.data.scheduleItems.forEach(item => {
                if (item.startMonth.length === 7) item.startMonth += '-01';
                if (item.endMonth.length === 7) item.endMonth += '-28';

                if (item.startMonth < minDate) item.startMonth = minDate;
                if (item.startMonth > maxDate) item.startMonth = maxDate;
                if (item.endMonth > maxDate) item.endMonth = maxDate;
                if (item.endMonth < minDate) item.endMonth = minDate;
                if (item.startMonth > item.endMonth) {
                    item.endMonth = item.startMonth;
                }
            });
        }
        this.renderTable();
        this.renderScheduleTable();
    },

    calculateMonthlySalary(region, roleName) {
        const isOvertime = roleName.endsWith(' - 加班');
        const baseRoleName = isOvertime ? roleName.replace(' - 加班', '') : roleName;

        if (!SALARY_RATES[region] || !SALARY_RATES[region][baseRoleName]) return 0;
        const data = SALARY_RATES[region][baseRoleName];

        if (isOvertime) {
            const hourlyWage = Math.round(data.base / 240);
            const siteOvertimeAllowance = data.site_overtime_allowance || 0; 
            return hourlyWage + siteOvertimeAllowance;
        }

        const subtotal1 = data.base + (data.base * INS_RATE) + (data.base * SEC_RATE);
        const subtotal3 = data.offsite + data.food + data.acc;
        return Math.round(subtotal1 + subtotal3);
    },

    onRegionChange() {
        const region = document.getElementById('projectRegion').value;
        if(confirm(`確定切換為「${region}」嗎？\n系統將重新計算所有人員的薪資單價。`)) {
            this.data.items.forEach(item => {
                if (item.isPersonnel) {
                    item.price = this.calculateMonthlySalary(region, item.name);
                }
            });
            this.renderTable();
        }
    },

    loadInitialData() {
        const region = document.getElementById('projectRegion').value || '南部';
        
        this.data.scheduleItems = [
            { id: 'A', name: '電氣工程', startMonth: '2025-11-01', endMonth: '2026-10-31' },
            { id: 'B', name: '儀控工程', startMonth: '2025-11-15', endMonth: '2026-10-15' }, 
            { id: 'C', name: '設備工程', startMonth: '2026-01-01', endMonth: '2026-09-30' },
            { id: 'D', name: '管架鋼構工程', startMonth: '2026-01-10', endMonth: '2026-09-20' }, 
            { id: 'E', name: '配管工程', startMonth: '2026-02-01', endMonth: '2026-12-31' },
            { id: 'F', name: '保溫工程', startMonth: '2026-04-01', endMonth: '2026-12-31' }
        ];

        // 預設資料的 note 均設為空字串，不自動產生薪資公式
        this.data.items = [
            { id: 1, category: '專案人力', isPersonnel: true, costCode: 'DSTESVH01', accountCode: '1253A01', itemCode: 'DSTESVH01', name: '專案經理 (Site Manager)', dept: '建造部', workType: '機電', unit: 'm', qty: 0, price: this.calculateMonthlySalary(region, '專案經理 (Site Manager)'), indirectRate: 2, profitRate: 5, riskRate: 2, negotiationRate: 2, manHours: 0, note: '', ganttData: { '2025-11': 1, '2025-12': 1, '2026-01': 1 } },
            { id: 2, category: '專案人力', isPersonnel: true, costCode: 'DSTESVH02', accountCode: '1253A01', itemCode: 'DSTESVH02', name: '工安 (HSE)', dept: '建造部', workType: '機電', unit: 'm', qty: 0, price: this.calculateMonthlySalary(region, '工安 (HSE)'), indirectRate: 2, profitRate: 5, riskRate: 2, negotiationRate: 2, manHours: 0, note: '', ganttData: { '2025-10': 1, '2025-11': 1, '2025-12': 1, '2026-01': 2 } },
            { id: 3, category: '專案人力', isPersonnel: true, costCode: 'DSTESVH01', accountCode: '1253A01', itemCode: 'DSTESVH01', name: '專案經理 (Site Manager) - 加班', dept: '建造部', workType: '機電', unit: 'hr', qty: 0, price: this.calculateMonthlySalary(region, '專案經理 (Site Manager) - 加班'), indirectRate: 2, profitRate: 5, riskRate: 2, negotiationRate: 2, manHours: 30, note: '', ganttData: { '2025-11': 10, '2025-12': 20 } },
            { id: 4, category: '臨時辦公室', isPersonnel: false, costCode: 'DSTEAF752', accountCode: '125411', itemCode: 'X444', name: '辦公室物品', dept: '建造部', workType: '其他', unit: 'm', qty: 0, price: 5000, indirectRate: 0, profitRate: 5, riskRate: 0, negotiationRate: 0, manHours: 0, note: '材料類', ganttData: { '2025-11': 1, '2025-12': 1, '2027-01': 1 } }
        ];
        this.data.items.forEach(item => this.recalcItemQty(item));
    },

    recalcItemQty(item) {
        let sum = 0;
        if(item.ganttData) {
            Object.values(item.ganttData).forEach(v => sum += (parseFloat(v) || 0));
        }
        item.qty = sum;
    },

    calculateAllTotals() {
        let totals = { base: 0, indirect: 0, profit: 0, risk: 0, negotiation: 0, grand: 0, manHours: 0, totalQty: 0, itemCount: 0, sumInd: 0, sumPro: 0, sumRisk: 0, sumNeg: 0 };
        let ganttMonthlyTotals = {}; 
        
        const calculatedItems = this.data.items.map((item, index) => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.price) || 0;
            const baseCost = Math.round(qty * price);

            const indirectRate = parseFloat(item.indirectRate) || 0;
            const profitRate = parseFloat(item.profitRate) || 0;
            const riskRate = parseFloat(item.riskRate) || 0;
            const negotiationRate = parseFloat(item.negotiationRate) || 0;

            const indirectAmt = Math.round(baseCost * (indirectRate / 100));
            const costAfterIndirect = baseCost + indirectAmt;
            
            const profitAmt = Math.round(costAfterIndirect * (profitRate / 100));
            const costAfterProfit = costAfterIndirect + profitAmt;
            
            const riskAmt = Math.round(costAfterProfit * (riskRate / 100));
            const costAfterRisk = costAfterProfit + riskAmt;
            
            const negotiationAmt = Math.round(costAfterRisk * (negotiationRate / 100));
            
            const itemGrandTotal = costAfterRisk + negotiationAmt;
            const itemGrandUnitPrice = qty > 0 ? (itemGrandTotal / qty) : 0;

            totals.base += baseCost;
            totals.indirect += indirectAmt;
            totals.profit += profitAmt;
            totals.risk += riskAmt;
            totals.negotiation += negotiationAmt;
            totals.grand += itemGrandTotal;
            totals.manHours += parseFloat(item.manHours) || 0;
            totals.totalQty += qty;
            
            totals.sumInd += indirectRate;
            totals.sumPro += profitRate;
            totals.sumRisk += riskRate;
            totals.sumNeg += negotiationRate;
            totals.itemCount++;

            // ★ 甘特圖月份統計，嚴格檢查單位是否為 "m"
            if (String(item.unit).toLowerCase() === 'm' && item.ganttData) {
                Object.keys(item.ganttData).forEach(k => {
                    if (!ganttMonthlyTotals[k]) ganttMonthlyTotals[k] = 0;
                    ganttMonthlyTotals[k] += (parseFloat(item.ganttData[k]) || 0);
                });
            }

            return { 
                originalIndex: index, 
                data: item, 
                metrics: { baseCost, indirectAmt, profitAmt, riskAmt, negotiationAmt, itemGrandTotal, itemGrandUnitPrice } 
            };
        });
        
        totals.ganttMonthlyTotals = ganttMonthlyTotals;
        this.currentTotals.grandTotal = totals.grand;
        
        const grandDisplay = document.getElementById('grandTotalDisplay');
        if (grandDisplay) grandDisplay.textContent = Math.round(totals.grand).toLocaleString();

        const mhPriceDisplay = document.getElementById('manHourUnitPriceDisplay');
        if (mhPriceDisplay) {
            const mhPrice = totals.manHours > 0 ? (totals.grand / totals.manHours) : 0;
            if (mhPriceDisplay.tagName === 'INPUT') {
                mhPriceDisplay.value = Math.round(mhPrice).toLocaleString();
            } else {
                mhPriceDisplay.textContent = Math.round(mhPrice).toLocaleString();
            }
        }

        return { totals, calculatedItems };
    },

    getOptionsHtml(options, selectedValue) {
        return options.map(opt => `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`).join('');
    },

    renderScheduleHeader(months) {
        const thead = document.getElementById('scheduleTableHeader');
        if (!thead) return;

        const yearColspans = {};
        months.forEach(m => { yearColspans[m.year] = (yearColspans[m.year] || 0) + 1; });

        // 恢復不同年份的甘特圖表頭底色
        const yearColors = ['#fef08a', '#bae6fd', '#bbf7d0', '#e9d5ff', '#ffedd5'];
        let yearIndex = 0;

        let yearTr = `<tr>
            <th rowspan="2" class="sticky-col text-center align-middle bg-light" style="min-width: 110px;">操作</th>
            <th rowspan="2" class="sticky-col text-center align-middle bg-light" style="min-width: 50px;">項次</th>
            <th rowspan="2" class="sticky-col-7 align-middle bg-light" style="min-width: 350px;">工程項目名稱</th>
            <th rowspan="2" class="text-center align-middle bg-light" style="min-width: 140px;">開始日期</th>
            <th rowspan="2" class="text-center align-middle border-end bg-light" style="min-width: 140px;">結束日期</th>`;
            
        Object.entries(yearColspans).forEach(([year, span]) => {
            const color = yearColors[yearIndex % yearColors.length];
            yearTr += `<th colspan="${span}" class="text-center align-middle" style="background-color: ${color} !important; border-bottom: 2px solid rgba(0,0,0,0.1); font-size:1.05rem; letter-spacing: 2px; color: #1e293b;">${year}</th>`;
            yearIndex++;
        });
        yearTr += `</tr>`;

        let monthTr = `<tr>`;
        yearIndex = 0;
        let currentYear = months.length > 0 ? months[0].year : null;

        months.forEach(m => {
            if (m.year !== currentYear) {
                yearIndex++;
                currentYear = m.year;
            }
            // 月份也依據年份配出對應顏色
            const color = yearColors[yearIndex % yearColors.length];
            const bgColor = m.isExtra ? '#e2e8f0' : color;
            monthTr += `<th class="text-center align-middle" style="background-color: ${bgColor} !important; min-width: 55px; border-bottom: 1px solid #cbd5e1; font-weight: 600; color: #1e293b;" title="${m.isExtra ? '準備期/收尾期' : ''}">${m.month}</th>`;
        });
        monthTr += `</tr>`;

        thead.innerHTML = yearTr + monthTr;
    },

    getDatePercentage(dateStr, isEnd) {
        if (!dateStr || dateStr.length < 10) return isEnd ? 100 : 0;
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(5, 7));
        const day = parseInt(dateStr.substring(8, 10));
        
        const daysInMonth = new Date(year, month, 0).getDate();
        
        if (isEnd) {
            return 100 - ((day / daysInMonth) * 100);
        } else {
            return ((day - 1) / daysInMonth) * 100;
        }
    },

    generateScheduleRowHtml(itemObj, displayIndex, months) {
        const index = itemObj.originalIndex;
        const item = itemObj.data;
        const { minDate, maxDate } = this.getExtraMonthsKeys();

        const moveControls = `<span class="text-muted small"><i class="fas fa-lock" title="系統連動項目"></i></span>`;

        let currentStart = item.startMonth.length === 7 ? item.startMonth + '-01' : item.startMonth;
        let currentEnd = item.endMonth.length === 7 ? item.endMonth + '-28' : item.endMonth;
        
        let itemStartMonth = currentStart.substring(0, 7);
        let itemEndMonth = currentEnd.substring(0, 7);

        let ganttBars = '';
        months.forEach(m => {
            let bgClass = m.isExtra ? 'bg-light' : 'bg-white';
            let isStart = (m.key === itemStartMonth);
            let isEnd = (m.key === itemEndMonth);
            let isBetween = (m.key >= itemStartMonth && m.key <= itemEndMonth);

            if (isBetween) {
                let leftPos = isStart ? this.getDatePercentage(currentStart, false) : 0;
                let rightPos = isEnd ? this.getDatePercentage(currentEnd, true) : 0;

                let dotStart = isStart ? `<div style="width: 12px; height: 12px; background: var(--primary-blue); border-radius: 50%; position: absolute; left: ${leftPos}%; top: 50%; transform: translate(-50%, -50%); z-index: 2;"></div>` : '';
                let dotEnd = isEnd ? `<div style="width: 12px; height: 12px; background: var(--primary-blue); border-radius: 50%; position: absolute; right: ${rightPos}%; top: 50%; transform: translate(50%, -50%); z-index: 2;"></div>` : '';

                ganttBars += `
                    <td class="p-0 border-end align-middle ${bgClass}" style="position: relative; min-width: 55px; height: 45px;">
                        <div style="position: absolute; left: ${leftPos}%; right: ${rightPos}%; top: 50%; transform: translateY(-50%); height: 4px; background: var(--primary-blue); z-index: 1;"></div>
                        ${dotStart}
                        ${dotEnd}
                    </td>
                `;
            } else {
                ganttBars += `<td class="p-0 border-end ${bgClass}"></td>`;
            }
        });

        return `
            <tr>
                <td class="text-center sticky-col bg-white">${moveControls}</td>
                <td class="text-center sticky-col text-dark fw-bold bg-white">${displayIndex}</td>
                <td class="sticky-col-7 bg-white"><input type="text" class="form-input-compact fw-bold text-dark bg-light" value="${item.name}" readonly title="來自專案排程系統，無法修改"></td>
                <td class="bg-white text-center"><input type="date" class="form-control form-control-sm text-center fw-bold text-primary" value="${currentStart}" min="${minDate}" max="${maxDate}" onchange="IndirectCost.updateScheduleItem(${index}, 'startMonth', this.value)"></td>
                <td class="bg-white text-center border-end"><input type="date" class="form-control form-control-sm text-center fw-bold text-primary" value="${currentEnd}" min="${minDate}" max="${maxDate}" onchange="IndirectCost.updateScheduleItem(${index}, 'endMonth', this.value)"></td>
                ${ganttBars}
            </tr>
        `;
    },

    renderScheduleTable() {
        const months = this.getMonthsRange();
        this.renderScheduleHeader(months);

        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;

        let html = '';
        const scheduleItems = this.data.scheduleItems || [];
        
        scheduleItems.forEach((item, index) => {
            const alphaIndex = String.fromCharCode(65 + index); 
            html += this.generateScheduleRowHtml({ originalIndex: index, data: item }, alphaIndex, months);
        });

        tbody.innerHTML = html;
    },

    updateScheduleItem(index, field, value) {
        const item = this.data.scheduleItems[index];
        const { minDate, maxDate } = this.getExtraMonthsKeys();

        if (!value || value.length < 10) return;

        if (value < minDate) value = minDate;
        if (value > maxDate) value = maxDate;

        item[field] = value;
        
        if (field === 'startMonth' && item.endMonth < value) item.endMonth = value;
        else if (field === 'endMonth' && item.startMonth > value) item.startMonth = value;
        
        this.renderScheduleTable();
    },

    applyGlobalRate(type, rateValue) {
        const rate = parseFloat(rateValue) || 0;
        if(confirm(`確定更新所有項目的費率為 ${rate}% 嗎？`)) {
            this.data.items.forEach(item => {
                if(type === 'indirect') item.indirectRate = rate;
                if(type === 'profit') item.profitRate = rate;
                if(type === 'risk') item.riskRate = rate;
                if(type === 'negotiation') item.negotiationRate = rate;
            });
            this.renderTable();
        }
    },

    renderHeader(months) {
        const thead = document.getElementById('estimationTableHeader');
        if (!thead) return;

        const yearColspans = {};
        months.forEach(m => { yearColspans[m.year] = (yearColspans[m.year] || 0) + 1; });

        // 恢復不同年份的顏色設定
        const yearColors = ['#fef08a', '#bae6fd', '#bbf7d0', '#e9d5ff', '#ffedd5'];
        let yearIndex = 0;

        let yearTr = `<tr>
            <th rowspan="2" class="sticky-col text-center align-middle" style="min-width: 110px;">操作</th>
            <th rowspan="2" class="sticky-col text-center align-middle" style="min-width: 50px;">項次</th>
            <th rowspan="2" class="align-middle" style="min-width: 150px;">專案分類</th>
            <th rowspan="2" class="align-middle" style="min-width: 130px;">成本代碼</th>
            <th rowspan="2" class="align-middle" style="min-width: 130px;">在建會科</th>
            <th rowspan="2" class="align-middle" style="min-width: 130px;">施工代號</th>
            <th rowspan="2" class="sticky-col-7 align-middle" style="min-width: 350px;">品名規格 / 職稱</th>
            <th rowspan="2" class="align-middle" style="min-width: 120px;">執行部門</th>
            <th rowspan="2" class="align-middle border-end" style="min-width: 110px;">工種</th>`;
            
        Object.entries(yearColspans).forEach(([year, span]) => {
            const color = yearColors[yearIndex % yearColors.length];
            yearTr += `<th colspan="${span}" class="text-center align-middle" style="background-color: ${color} !important; border-bottom: 2px solid rgba(0,0,0,0.1); font-size:1.05rem; letter-spacing: 2px; color: #1e293b;">${year}</th>`;
            yearIndex++;
        });

        // 恢復寬度設定，確保資料不被擠壓
        yearTr += `
            <th rowspan="2" class="align-middle border-start" style="min-width: 80px;">單位</th>
            <th rowspan="2" class="text-center align-middle" style="min-width: 90px;">數量(合計)</th>
            <th rowspan="2" class="text-center align-middle" style="min-width: 150px;">單價</th>
            <th rowspan="2" class="text-end border-cost col-cost align-middle" style="min-width: 140px;">小計</th>
            <th rowspan="2" class="text-end align-middle border-cost" style="min-width: 130px;">利管單價</th>
            
            <th rowspan="2" class="border-indirect col-indirect text-center align-middle fw-bold" style="min-width: 50px;">%</th>
            <th rowspan="2" class="col-indirect text-end align-middle fw-bold" style="min-width: 110px;">間接費用</th>
            <th rowspan="2" class="border-profit col-profit text-center align-middle fw-bold" style="min-width: 50px;">%</th>
            <th rowspan="2" class="col-profit text-end align-middle fw-bold" style="min-width: 110px;">利潤</th>
            <th rowspan="2" class="border-risk col-risk text-center align-middle fw-bold" style="min-width: 50px;">%</th>
            <th rowspan="2" class="col-risk text-end align-middle fw-bold" style="min-width: 110px;">風險</th>
            <th rowspan="2" class="border-neg col-neg text-center align-middle fw-bold" style="min-width: 50px;">%</th>
            <th rowspan="2" class="col-neg text-end align-middle fw-bold" style="min-width: 110px;">議價</th>
            
            <th rowspan="2" class="text-end border-total col-total align-middle" style="min-width: 140px;">總計</th>
            <th rowspan="2" class="text-center border-cost align-middle" style="min-width: 90px;">工時(H)</th>
            <th rowspan="2" class="align-middle" style="min-width: 250px;">備註</th>
        </tr>`;

        let monthTr = `<tr>`;
        yearIndex = 0;
        let currentYear = months.length > 0 ? months[0].year : null;

        months.forEach(m => {
            if (m.year !== currentYear) {
                yearIndex++;
                currentYear = m.year;
            }
            const color = yearColors[yearIndex % yearColors.length];
            const bgColor = m.isExtra ? '#e2e8f0' : color;
            monthTr += `<th class="text-center align-middle" style="background-color: ${bgColor} !important; min-width: 55px; border-bottom: 1px solid #cbd5e1; font-weight: 600; color: #1e293b;" title="${m.isExtra ? '準備/收尾期' : ''}">${m.month}</th>`;
        });
        
        monthTr += `</tr>`;

        thead.innerHTML = yearTr + monthTr;
    },

    generateRowHtml(itemObj, displayIndex, months) {
        const index = itemObj.originalIndex;
        const item = itemObj.data;
        const metrics = itemObj.metrics;

        const moveControls = `
            <div class="d-flex justify-content-center gap-1">
                <button class="btn-sort" onclick="IndirectCost.moveItem(${index}, -1)" title="上移"><i class="fas fa-arrow-up"></i></button>
                <button class="btn-sort" onclick="IndirectCost.moveItem(${index}, 1)" title="下移"><i class="fas fa-arrow-down"></i></button>
                <button class="btn-sort btn-delete" onclick="IndirectCost.removeItem(${index})" title="刪除"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        let nameInputHtml = item.isPersonnel ? 
            `<select class="form-input-compact col-personnel" onchange="IndirectCost.updatePersonnelRole(${index}, this.value)">
                ${this.getOptionsHtml(PERSONNEL_ROLES, item.name)}
            </select>` : 
            `<input type="text" class="form-input-compact" value="${item.name}" onchange="IndirectCost.updateItem(${index}, 'name', this.value)">`;

        let ganttInputs = '';
        months.forEach(m => {
            let val = (item.ganttData && item.ganttData[m.key] !== undefined) ? item.ganttData[m.key] : '';
            // 網頁版維持正常的淺色底，甘特圖底色留給 Excel 獨立處理
            let bgClass = m.isExtra ? 'bg-light' : 'bg-transparent';
            let titleAttr = m.isExtra ? 'title="準備期 / 收尾期"' : '';
            
            ganttInputs += `<td class="p-1 border-end ${bgClass} align-middle" style="background-color: #F9EEED;"><input type="number" class="form-control form-control-sm text-center text-primary fw-bold px-1 py-1" style="min-width:45px; background: transparent;" value="${val}" step="0.5" ${titleAttr} onchange="IndirectCost.updateGantt(${index}, '${m.key}', this.value)"></td>`;
        });

        let priceHtml = '';
        if (item.isPersonnel) {
            priceHtml = `<input type="number" class="form-input-compact text-end bg-transparent" value="${item.price}" readonly onchange="IndirectCost.updateItem(${index}, 'price', this.value)" title="依據工作地區薪資自動帶入">`;
        } else {
            priceHtml = `
                <div class="input-group flex-nowrap input-group-price">
                    <input type="number" class="form-control form-input-compact text-end bg-transparent" style="border-right: none;" value="${item.price}" onchange="IndirectCost.updateItem(${index}, 'price', this.value)">
                    <button class="btn btn-outline-secondary px-2 bg-white" type="button" onclick="IndirectCost.showHistory(${index})" title="查看歷史"><i class="fas fa-history"></i></button>
                </div>
            `;
        }

        const availableCategories = item.isPersonnel ? ['專案人力'] : DROPDOWN_OPTIONS.categories.filter(c => c !== '專案人力');

        return `
            <tr>
                <td class="text-center sticky-col">${moveControls}</td>
                <td class="text-center sticky-col text-dark fw-bold">${displayIndex}</td>
                <td><select class="form-input-compact" onchange="IndirectCost.updateItem(${index}, 'category', this.value)">${this.getOptionsHtml(availableCategories, item.category)}</select></td>
                <td><select class="form-input-compact" onchange="IndirectCost.updateItem(${index}, 'costCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.costCodes, item.costCode)}</select></td>
                <td><select class="form-input-compact" onchange="IndirectCost.updateItem(${index}, 'accountCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.accountCodes, item.accountCode)}</select></td>
                <td><input type="text" class="form-input-compact text-center" value="${item.itemCode}" onchange="IndirectCost.updateItem(${index}, 'itemCode', this.value)"></td>
                
                <td class="sticky-col-7">${nameInputHtml}</td>
                
                <td><select class="form-input-compact" onchange="IndirectCost.updateItem(${index}, 'dept', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.departments, item.dept)}</select></td>
                <td><select class="form-input-compact text-center" onchange="IndirectCost.updateItem(${index}, 'workType', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.workTypes, item.workType)}</select></td>
                
                ${ganttInputs}
                
                <td><select class="form-input-compact text-center" onchange="IndirectCost.updateItem(${index}, 'unit', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.units, item.unit)}</select></td>
                <td class="text-center fw-bold text-primary align-middle" style="font-size:1.05rem;">${item.qty}</td>
                <td class="fw-bold align-middle">${priceHtml}</td>
                
                <td class="text-end align-middle fw-bold border-cost col-cost">${metrics.baseCost.toLocaleString()}</td>
                <td class="text-end align-middle fw-bold border-cost">${metrics.itemGrandUnitPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td>
                <td class="border-indirect col-indirect p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.indirectRate}" onchange="IndirectCost.updateItem(${index}, 'indirectRate', this.value)"></td>
                <td class="col-indirect text-end small align-middle">${metrics.indirectAmt.toLocaleString()}</td>
                <td class="border-profit col-profit p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.profitRate}" onchange="IndirectCost.updateItem(${index}, 'profitRate', this.value)"></td>
                <td class="col-profit text-end small align-middle">${metrics.profitAmt.toLocaleString()}</td>
                <td class="border-risk col-risk p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.riskRate}" onchange="IndirectCost.updateItem(${index}, 'riskRate', this.value)"></td>
                <td class="col-risk text-end small align-middle">${metrics.riskAmt.toLocaleString()}</td>
                <td class="border-neg col-neg p-1 text-center align-middle"><input type="number" class="rate-input-small" value="${item.negotiationRate || 0}" onchange="IndirectCost.updateItem(${index}, 'negotiationRate', this.value)"></td>
                <td class="col-neg text-end small align-middle">${metrics.negotiationAmt.toLocaleString()}</td>
                <td class="border-total col-total text-primary text-end fw-bold align-middle">${metrics.itemGrandTotal.toLocaleString()}</td>
                <td class="p-1 border-cost"><input type="number" class="form-input-compact text-end bg-transparent" value="${item.manHours || 0}" onchange="IndirectCost.updateItem(${index}, 'manHours', this.value)"></td>

                <td><input type="text" class="form-input-compact text-muted" value="${item.note}" onchange="IndirectCost.updateItem(${index}, 'note', this.value)"></td>
            </tr>
        `;
    },

    renderTable() {
        const months = this.getMonthsRange();
        this.renderHeader(months);

        const { totals, calculatedItems } = this.calculateAllTotals();
        const tbody = document.getElementById('estimationTableBody');
        if (!tbody) return;

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
            
            let catGanttSums = {};
            let catSum = { qty: 0, base: 0, indirectAmt: 0, profitAmt: 0, riskAmt: 0, negotiationAmt: 0, grand: 0, manHours: 0, indRate: 0, proRate: 0, riskRate: 0, negRate: 0, count: 0 };
            
            groupItems.forEach(obj => {
                // 只針對單位為 'm' 進行彙總
                if (String(obj.data.unit).toLowerCase() === 'm' && obj.data.ganttData) {
                    Object.keys(obj.data.ganttData).forEach(k => {
                        if(!catGanttSums[k]) catGanttSums[k] = 0;
                        catGanttSums[k] += (parseFloat(obj.data.ganttData[k]) || 0);
                    });
                }
                catSum.qty += (parseFloat(obj.data.qty) || 0);
                catSum.base += obj.metrics.baseCost;
                catSum.indirectAmt += obj.metrics.indirectAmt;
                catSum.profitAmt += obj.metrics.profitAmt;
                catSum.riskAmt += obj.metrics.riskAmt;
                catSum.negotiationAmt += obj.metrics.negotiationAmt;
                catSum.grand += obj.metrics.itemGrandTotal;
                catSum.manHours += (parseFloat(obj.data.manHours) || 0);
                catSum.indRate += (parseFloat(obj.data.indirectRate) || 0);
                catSum.proRate += (parseFloat(obj.data.profitRate) || 0);
                catSum.riskRate += (parseFloat(obj.data.riskRate) || 0);
                catSum.negRate += (parseFloat(obj.data.negotiationRate) || 0);
                catSum.count++;
            });

            // 標題列：
            html += `
                <tr class="category-header-row" data-catname="${catName}">
                    <td colspan="2" class="category-header-title sticky-col bg-light fw-bold"><i class="fas fa-folder-open me-2 text-primary"></i>${catName}</td>
                    <td colspan="4" class="category-header-filler"></td>
                    <td class="category-header-filler sticky-col-7"></td>
                    <td colspan="${2 + months.length + 16}" class="category-header-filler"></td>
                </tr>
            `;

            // 資料列
            groupItems.forEach(obj => {
                html += this.generateRowHtml(obj, globalDisplayIndex++, months);
            });

            // ★ 分類小計列 (網頁加上底色並留空 % 欄位)
            let subGanttHtml = '';
            months.forEach(m => {
                subGanttHtml += `<td class="text-center fw-bold" style="background-color: #FBF9EF;">${catGanttSums[m.key] || ''}</td>`;
            });

            html += `
                <tr class="category-subtotal-row">
                    <td colspan="2" class="sticky-col bg-light"></td>
                    <td colspan="4" class="bg-light"></td>
                    <td class="sticky-col-7 bg-light"></td>
                    <td colspan="2" class="text-end text-secondary fw-bold bg-light">${catName} 小計：</td>
                    ${subGanttHtml}
                    <td class="border-start" style="background-color: #FBF9EF;"></td>
                    <td class="text-center fw-bold" style="background-color: #FBF9EF;">${catSum.qty}</td>
                    <td style="background-color: #FBF9EF;"></td>
                    <td class="text-end fw-bold border-cost" style="background-color: #FBF9EF;">${Math.round(catSum.base).toLocaleString()}</td>
                    <td class="border-cost" style="background-color: #FBF9EF;"></td>
                    
                    <td class="border-indirect col-indirect text-muted text-center fw-bold" style="background-color: #FBF9EF;"></td>
                    <td class="col-indirect text-end fw-bold" style="background-color: #FBF9EF;">${Math.round(catSum.indirectAmt).toLocaleString()}</td>
                    
                    <td class="border-profit col-profit text-muted text-center fw-bold" style="background-color: #FBF9EF;"></td>
                    <td class="col-profit text-end fw-bold" style="background-color: #FBF9EF;">${Math.round(catSum.profitAmt).toLocaleString()}</td>
                    
                    <td class="border-risk col-risk text-muted text-center fw-bold" style="background-color: #FBF9EF;"></td>
                    <td class="col-risk text-end fw-bold" style="background-color: #FBF9EF;">${Math.round(catSum.riskAmt).toLocaleString()}</td>
                    
                    <td class="border-neg col-neg text-center text-danger fw-bold" style="background-color: #FBF9EF;"></td>
                    <td class="col-neg text-end text-danger fw-bold" style="background-color: #FBF9EF;">${Math.round(catSum.negotiationAmt).toLocaleString()}</td>
                    
                    <td class="border-total col-total text-primary text-end fw-bold" style="background-color: #FBF9EF;">${Math.round(catSum.grand).toLocaleString()}</td>
                    <td class="border-cost text-center  fw-bold" style="background-color: #FBF9EF;">${catSum.manHours}</td>
                    <td style="background-color: #FBF9EF;"></td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        this.renderFooter(months, totals);
    },

    renderFooter(months, totalsObj) {
        const tfoot = document.getElementById('estimationTableFooter');
        if (!tfoot) return;

        const calcAvg = (sum, count) => count > 0 ? (sum / count).toFixed(1) + '%' : '0.0%';

        let ganttTotalHtml = '';
        months.forEach(m => {
            let val = totalsObj.ganttMonthlyTotals[m.key] || '';
            ganttTotalHtml += `<td class="text-center fw-bold" style="background-color: #f1f5f9;">${val}</td>`;
        });

        // ★ 表尾總計 (含百分比)
        tfoot.innerHTML = `
            <td colspan="2" class="sticky-col"></td>
            <td colspan="4" ></td>
            <td class="sticky-col-7"></td>
            <td colspan="2" class="text-end text-secondary fw-bold">間接總計：</td>
            ${ganttTotalHtml}
            <td class="border-start" style="background-color: #f1f5f9;"></td>
            <td class="text-center text-primary fw-bold" style="background-color: #f1f5f9;">${totalsObj.totalQty}</td>
            <td style="background-color: #f1f5f9;"></td>
            <td class="text-end fw-bold border-cost col-cost" style="background-color: #f1f5f9;">${Math.round(totalsObj.base).toLocaleString()}</td>
            <td class="border-cost" style="background-color: #f1f5f9;"></td>
            
            <td class="border-indirect col-indirect text-muted text-center  fw-bold" style="background-color: #f1f5f9;">${calcAvg(totalsObj.sumInd, totalsObj.itemCount)}</td>
            <td class="col-indirect text-end fw-bold" style="background-color: #f1f5f9;">${Math.round(totalsObj.indirect).toLocaleString()}</td>
            
            <td class="border-profit col-profit text-muted text-center fw-bold" style="background-color: #f1f5f9;">${calcAvg(totalsObj.sumPro, totalsObj.itemCount)}</td>
            <td class="col-profit text-end fw-bold" style="background-color: #f1f5f9;">${Math.round(totalsObj.profit).toLocaleString()}</td>
            
            <td class="border-risk col-risk text-muted text-center fw-bold" style="background-color: #f1f5f9;">${calcAvg(totalsObj.sumRisk, totalsObj.itemCount)}</td>
            <td class="col-risk text-end fw-bold" style="background-color: #f1f5f9;">${Math.round(totalsObj.risk).toLocaleString()}</td>
            
            <td class="border-neg col-neg text-center text-danger fw-bold" style="background-color: #f1f5f9;">${calcAvg(totalsObj.sumNeg, totalsObj.itemCount)}</td>
            <td class="col-neg text-end text-danger fw-bold" style="background-color: #f1f5f9;">${Math.round(totalsObj.negotiation).toLocaleString()}</td>
            
            <td class="text-end fw-bold text-primary border-total col-total" style="font-size: 1.15rem; background-color: #f1f5f9;">${Math.round(totalsObj.grand).toLocaleString()}</td>
            <td class="text-center fw-bold border-cost" style="background-color: #f1f5f9;">${totalsObj.manHours.toLocaleString()}</td>
            <td style="background-color: #f1f5f9;"></td>
        `;
    },

    updateItem(index, field, value) {
        const item = this.data.items[index];
        if (['price', 'qty', 'indirectRate', 'profitRate', 'riskRate', 'negotiationRate', 'manHours'].includes(field)) {
            item[field] = parseFloat(value) || 0;
        } else {
            item[field] = value;
        }
        this.renderTable();
    },

    updateGantt(index, monthKey, value) {
        const item = this.data.items[index];
        if (!item.ganttData) item.ganttData = {};
        
        if (value === '') delete item.ganttData[monthKey];
        else item.ganttData[monthKey] = parseFloat(value) || 0;
        
        this.recalcItemQty(item);
        this.renderTable();
    },

    updatePersonnelRole(index, newRole) {
        const item = this.data.items[index];
        const region = document.getElementById('projectRegion').value;
        item.name = newRole;
        item.price = this.calculateMonthlySalary(region, newRole);
        item.note = ''; 
        
        if (newRole.includes('加班')) {
            item.unit = 'hr';
        } else {
            item.unit = 'm';
        }
        
        this.renderTable();
    },

    addPersonnelItem() {
        const region = document.getElementById('projectRegion').value;
        const defaultRole = PERSONNEL_ROLES[0]; 
        
        const defaultIndirect = parseFloat(document.getElementById('globalIndirect')?.value || 2);
        const defaultProfit = parseFloat(document.getElementById('globalProfit')?.value || 5);
        const defaultRisk = parseFloat(document.getElementById('globalRisk')?.value || 2);
        const defaultNeg = parseFloat(document.getElementById('globalNeg')?.value || 2);

        this.data.items.push({
            id: Date.now(), category: '專案人力', isPersonnel: true,
            costCode: DROPDOWN_OPTIONS.costCodes[0], accountCode: DROPDOWN_OPTIONS.accountCodes[0], itemCode: '',
            name: defaultRole, dept: DROPDOWN_OPTIONS.departments[0], workType: DROPDOWN_OPTIONS.workTypes[0],
            unit: defaultRole.includes('加班') ? 'hr' : 'm', qty: 0, price: this.calculateMonthlySalary(region, defaultRole),
            indirectRate: defaultIndirect, profitRate: defaultProfit, riskRate: defaultRisk, negotiationRate: defaultNeg, manHours: 0,
            note: '', ganttData: {}
        });
        this.renderTable();
    },

    addOtherItem() {
        const defaultOtherCategory = DROPDOWN_OPTIONS.categories.find(c => c !== '專案人力');
        
        const defaultIndirect = parseFloat(document.getElementById('globalIndirect')?.value || 2);
        const defaultProfit = parseFloat(document.getElementById('globalProfit')?.value || 5);
        const defaultRisk = parseFloat(document.getElementById('globalRisk')?.value || 2);
        const defaultNeg = parseFloat(document.getElementById('globalNeg')?.value || 2);

        this.data.items.push({
            id: Date.now(), category: defaultOtherCategory, isPersonnel: false,
            costCode: DROPDOWN_OPTIONS.costCodes[0], accountCode: DROPDOWN_OPTIONS.accountCodes[0], itemCode: '',
            name: '新增費用項目', dept: DROPDOWN_OPTIONS.departments[0], workType: DROPDOWN_OPTIONS.workTypes[0],
            unit: '式', qty: 0, price: 0,
            indirectRate: defaultIndirect, profitRate: defaultProfit, riskRate: defaultRisk, negotiationRate: defaultNeg, manHours: 0,
            note: '', ganttData: {}
        });
        this.renderTable();
    },

    removeItem(index) {
        if(confirm('確定要刪除此項目嗎？')) {
            this.data.items.splice(index, 1);
            this.renderTable();
        }
    },

    moveItem(index, direction) {
        if ((direction === -1 && index === 0) || (direction === 1 && index === this.data.items.length - 1)) return;
        const temp = this.data.items[index];
        this.data.items[index] = this.data.items[index + direction];
        this.data.items[index + direction] = temp;
        this.renderTable();
    },

    showHistory(index) {
        this.currentEditingIndex = index;
        const item = this.data.items[index];
        const nameEl = document.getElementById('historyItemName');
        if(nameEl) nameEl.textContent = item.name || '-';
        const matEl = document.getElementById('historyItemMatNo');
        if(matEl) matEl.textContent = item.itemCode || '-';
        
        const tbody = document.getElementById('historyTableBody');
        if(tbody) {
            const basePrice = item.price > 0 ? item.price : 1000;
            tbody.innerHTML = Array.from({length: 5}, (_, i) => ({ date: '2026-01-0' + (i+1), vendor: '三煌實業', projectNo: 'EQ-00' + i, price: Math.round(basePrice * (1 + (Math.random()-0.5)*0.2)), note: '-' }))
                .map(r => `<tr><td>${r.date}</td><td>${r.vendor}</td><td>${r.projectNo}</td><td class="text-end">${Math.round(r.price).toLocaleString()}</td><td>${r.note}</td><td class="text-center"><button class="btn btn-sm btn-primary" onclick="IndirectCost.applyHistoryPrice(${r.price})">選擇</button></td></tr>`).join('');
            
            const modalEl = document.getElementById('historyPriceModal');
            if (modalEl) new bootstrap.Modal(modalEl).show();
        }
    },

    applyHistoryPrice(price) {
        if (this.currentEditingIndex !== null) {
            this.updateItem(this.currentEditingIndex, 'price', price);
            const modalEl = document.getElementById('historyPriceModal');
            if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();
        }
    },

    toggleFullscreen() {
        const section = document.getElementById('workbenchSection');
        const btn = document.getElementById('fullscreenBtn');
        const icon = btn.querySelector('i');

        if (section.classList.contains('fullscreen-mode')) {
            section.classList.remove('fullscreen-mode');
            icon.classList.replace('fa-compress', 'fa-expand');
            btn.innerHTML = '<i class="fas fa-expand"></i> 滿版編輯';
            document.body.style.overflow = ''; 
        } else {
            section.classList.add('fullscreen-mode');
            icon.classList.replace('fa-expand', 'fa-compress');
            btn.innerHTML = '<i class="fas fa-compress"></i> 退出滿版';
            document.body.style.overflow = 'hidden'; 
        }
    },

    saveData() {
        if (typeof LiangLianSystem !== 'undefined') LiangLianSystem.showToast('間接成本估算資料已儲存！', 'success');
        else alert('間接成本估算資料已儲存！');
    },

    completeEstimation() {
        if(confirm('確定要完成間接成本估算嗎？\n資料將同步至專案總覽。')) {
            if (typeof LiangLianSystem !== 'undefined') LiangLianSystem.showToast('估算已完成並鎖定！', 'success');
            else alert('估算已完成並鎖定！');
        }
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
        if (typeof IndirectCostExcelExporter !== 'undefined') {
            // 將自己 (IndirectCost 物件本身) 傳給模組去處理
            IndirectCostExcelExporter.export(this);
        } else {
            alert('系統找不到匯出模組！\n\n請確認 HTML 檔案中是否有載入 excel_export.js');
        }
    }
};

window.showVersionHistory = function() {
    const currentSearch = window.location.search;
    window.open(`../eng-history/index.html${currentSearch}`, '_blank');
};

document.addEventListener('DOMContentLoaded', () => { IndirectCost.init(); });