/* template-editor.js - 改寫自 detail.js (DetailEstimation)
   拿掉：estimationMode/矩陣模式、4項利管費率與費率換算、ERP綁定(專案id/完成估算/版本紀錄連結)、總金額計算
   保留：資訊面板、項目清單(新增/刪除/排序/分類檢視)、歷史單價查詢彈窗、滿版編輯模式 */

const CATEGORIES = ['專案材料', '共通耗材', '專案設計', '專案外包加工', '專案製造', '專案外包工程', '專案費用'];

const DROPDOWN_OPTIONS = {
    categories: CATEGORIES,
    costCodes: ['DPCMM101', 'DPCMM102', 'DPCMM103', 'DPCMM104', 'DPCMM105', 'DPCMM106'],
    accountCodes: ['1251M1', '1251M2', '1251M3', '1251M4'],
    departments: ['工務部', '設計部', '製造廠', '品保部', '採購部'],
    workTypes: ['電銲工', '冷作工', '噴塗工', '焊接工'],
    units: ['kg', '式', '工', 'm', 'pcs', '組', '台']
};

// ★ 業主固定的分類標準：設備範本／工程範本各自對應固定的分類代碼，做成正式下拉選單
//   （不再開放自由輸入），選了範本類型後，分類代碼的選項會跟著換成對應那組。
const PRODUCT_CODE_OPTIONS = {
    equipment: [
        { code: 'PC', name: '塔槽' },
        { code: 'PD', name: '貯槽' },
        { code: 'PE', name: '熱交換器' },
        { code: 'PR', name: '反應器' },
        { code: 'PS', name: '球形槽' },
        { code: 'PA', name: '空氣冷卻器' },
        { code: 'PB', name: '鍋爐' },
        { code: 'SD', name: '煙道及煙囪' },
        { code: 'SF', name: '加熱爐' },
        { code: 'SS', name: '鋼結構' },
        { code: 'ST', name: '大型儲槽' }
    ],
    engineering: [
        { code: 'IE', name: '管線安裝工程' },
        { code: 'IP', name: '配管預製與安裝' },
        { code: 'SM', name: '模組設備' },
        { code: 'IC', name: '保溫保冷防蝕包覆' },
        { code: 'MM', name: '材料買賣' },
        { code: 'SE', name: '環保工程' }
    ]
};

// ============================================================
// 模擬資料 (Mock Data)
// ★ TODO(後端整合)：與 template-list.js 各自維護一份相同資料，串接 API 後移除，
//   兩頁改成呼叫同一支「取得範本」介面。
// ============================================================
const MOCK_TEMPLATES = [
    {
        id: 'TPL001',
        basicData: { templateCode: '', name: '潔淨室建置工程標準範本', templateType: 'engineering', productCode: 'IE', isActive: true, shellThickness: '', innerDiameter: '', totalLength: '', setQty: 1 },
        remarks: '',
        items: [
            { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-STOQ', name: '鋼板(9t)', material: 'SS400', dept: '採購部', workType: '冷作工', unit: 'kg', qty: 2778, qtyMfg: 2500, price: 35, manHours: 0, note: '主體材料' },
            { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-FLG', name: '法蘭 20K', material: 'SUS304', dept: '採購部', workType: '冷作工', unit: 'pcs', qty: 5, qtyMfg: 4, price: 1200, manHours: 0, note: '進口件' },
            { category: '共通耗材', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'C-WELD-01', name: '焊條', material: 'E7016', dept: '製造廠', workType: '焊接工', unit: 'kg', qty: 50, qtyMfg: 50, price: 85, manHours: 0, note: '' },
            { category: '共通耗材', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'C-PAINT-01', name: '防鏽底漆', material: 'Epoxy', dept: '製造廠', workType: '噴塗工', unit: 'kg', qty: 20, qtyMfg: 20, price: 180, manHours: 0, note: '' },
            { category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '焊接工', material: '-', dept: '工務部', workType: '焊接工', unit: '工', qty: 1, qtyMfg: 0, price: 3200, manHours: 2, note: '依現場人力排班' },
            { category: '專案外包加工', costCode: 'DPCMM104', accountCode: '1251M4', matNo: '', name: '熱處理', material: '-', dept: '製造廠', workType: '', unit: '式', qty: 1, qtyMfg: 0, price: null, manHours: 0, note: '依案場委外報價' }
        ]
    },
    {
        id: 'TPL002',
        basicData: { templateCode: '', name: 'MES系統建置範本', templateType: 'engineering', productCode: 'SM', isActive: true, shellThickness: '', innerDiameter: '', totalLength: '', setQty: 1 },
        remarks: '',
        items: [
            { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'E-SENSOR-01', name: '感測器模組', material: '-', dept: '採購部', workType: '', unit: 'pcs', qty: 24, qtyMfg: 24, price: 1500, manHours: 0, note: '' },
            { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'E-PANEL-01', name: '電控盤', material: '-', dept: '採購部', workType: '', unit: '台', qty: 3, qtyMfg: 3, price: 45000, manHours: 0, note: '' },
            { category: '專案外包工程', costCode: 'DPCMM106', accountCode: '1251M4', matNo: '', name: '配線工程', material: '-', dept: '工務部', workType: '電銲工', unit: '式', qty: 1, qtyMfg: 0, price: null, manHours: 0, note: '依廠區配電圖估算' }
        ]
    },
    {
        id: 'TPL003',
        basicData: { templateCode: '', name: '廢水處理擴建範本', templateType: 'equipment', productCode: 'PD', isActive: false, shellThickness: '', innerDiameter: '', totalLength: '', setQty: 1 },
        remarks: '',
        items: [
            { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'P-150', name: 'PIPE 無縫鋼管', material: '-', dept: '採購部', workType: '', unit: 'M', qty: 180, qtyMfg: 180, price: 1200, manHours: 0, note: '' },
            { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-STOQ', name: '鋼板(9t)', material: 'SS400', dept: '採購部', workType: '冷作工', unit: 'kg', qty: 1500, qtyMfg: 1500, price: 35, manHours: 0, note: '' },
            { category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '冷作工', material: '-', dept: '工務部', workType: '冷作工', unit: '工', qty: 1, qtyMfg: 0, price: 3800, manHours: 4, note: '' }
        ]
    },
    {
        id: 'TPL004',
        basicData: { templateCode: '', name: '電力系統改善範本', templateType: 'engineering', productCode: 'IE', isActive: true, shellThickness: '', innerDiameter: '', totalLength: '', setQty: 1 },
        remarks: '',
        items: [
            { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'S-100', name: 'H型鋼', material: '型鋼製品', dept: '採購部', workType: '', unit: 'TON', qty: 2.5, qtyMfg: 2.5, price: 45000, manHours: 0, note: '支撐架構' },
            { category: '專案外包工程', costCode: 'DPCMM106', accountCode: '1251M4', matNo: '', name: '配電盤更新工程', material: '-', dept: '工務部', workType: '電銲工', unit: '式', qty: 1, qtyMfg: 0, price: null, manHours: 0, note: '' }
        ]
    }
];

// ★ 新增範本時預帶的範例備註（常見的報價排除/納入條款），使用者可直接編輯或整段替換
const DEFAULT_REMARKS_EXAMPLE =
`1.本報價不含5%營業稅、任何第三者公正費用(但有含工檢)。
2.本報價不含基礎模板、塔槽內所有物件材料及安裝(SUPPORT RING除外)。
3.本報價不含設計、繪圖費用、不含儀表、閥類、保溫、各類備品及氮封。
4.本報價不含鈍化、脫脂，僅於不銹鋼槽內進行一般酸洗。
5.本報價不含熱處理、應力消除，僅含端板成形後固熔化處理。
6.本報價槽體噴砂、油漆範圍：桶槽外側及裙座內外側。
7.本報價運輸包裝：防布。
8.本報價若有法蘭大於24"，則以B16.47 SERIES B進行報價。
9.本報價大於12"以上之管及管件，皆以銲接有縫加RT 100%進行報價。
10.本報價RT(HEAD:100%，OTHER:20%)`;

const TemplateEditor = {
    templateId: null, // null = 新增模式
    currentEditingIndex: null,

    template: {
        items: [],
        basicData: {
            templateCode: '', name: '', templateType: 'equipment', productCode: '', isActive: true,
            shellThickness: '', innerDiameter: '', totalLength: '', setQty: 1
        },
        remarks: ''
    },

    init() {
        console.log('範本編輯器初始化...');
        this.fixModalStacking();
        this.populateProductCodeOptions('equipment'); // 預設先給設備範本的選項，loadFromUrl 若是編輯模式會再依實際類型覆蓋
        this.loadFromUrl();
        this.renderTable();
    },

    // ★ 分類代碼固定為業主提供的清單，依「範本類型」切換對應那組選項
    populateProductCodeOptions(type, selectedCode) {
        const el = document.getElementById('productCode');
        if (!el) return;
        const options = PRODUCT_CODE_OPTIONS[type] || [];
        el.innerHTML = options.map(o => `<option value="${o.code}" ${o.code === selectedCode ? 'selected' : ''}>${o.code} ${o.name}</option>`).join('');
    },

    // ★ 切換範本類型：分類代碼選項跟著換，且工程範本不需要設備幾何欄位（胴身厚/內徑/總長度/參考套數），直接隱藏
    handleTypeChange(type) {
        this.populateProductCodeOptions(type);
        document.querySelectorAll('.geometry-field').forEach(el => {
            el.style.display = (type === 'engineering') ? 'none' : '';
        });
    },

    handleStatusChange(checked) {
        const label = document.getElementById('isActiveLabel');
        if (label) label.textContent = checked ? '啟用' : '停用';
    },

    // ★ 沿用 detail.js：避免滿版模式下歷史單價彈窗層級被蓋住
    fixModalStacking() {
        const style = document.createElement('style');
        style.innerHTML = `
            .modal-backdrop { z-index: 10400 !important; }
            .modal { z-index: 10500 !important; }
        `;
        document.head.appendChild(style);

        const modalEl = document.getElementById('historyPriceModal');
        if (modalEl && modalEl.parentNode !== document.body) {
            document.body.appendChild(modalEl);
        }
    },

    // ★ 取代 detail.js 的 checkUrlParams/loadInitialData：
    //   範本編輯器不綁定專案/ERP，只依 ?id= 決定「編輯既有範本」或「新增空白範本」
    loadFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
            document.getElementById('pageTitle').textContent = '新增範本';
            document.getElementById('templateRemarks').value = DEFAULT_REMARKS_EXAMPLE;
            return; // 新增模式，備註先帶入範例文字，其餘欄位維持空白
        }

        // ★ TODO(後端整合)：先查 sessionStorage（範本管理列表複製功能用來暫時橋接的資料），
        //   查不到再查本頁自己的 MOCK_TEMPLATES。串接真正後端後，兩邊都改成呼叫同一支
        //   「取得範本」API，這個 sessionStorage 分支可以整個移除。
        let target = null;
        try {
            const stored = sessionStorage.getItem('tpl_' + id);
            if (stored) target = JSON.parse(stored);
        } catch (e) {
            console.warn('讀取 sessionStorage 失敗', e);
        }
        if (!target) {
            target = MOCK_TEMPLATES.find(t => t.id === id);
        }
        if (!target) {
            LiangLianSystem.showToast('找不到指定的範本，改為新增模式', 'warning');
            return;
        }

        this.templateId = target.id;
        this.template.basicData = { ...target.basicData };
        this.template.remarks = target.remarks || '';
        this.template.items = JSON.parse(JSON.stringify(target.items));

        const type = target.basicData.templateType || 'equipment';

        document.getElementById('pageTitle').textContent = `編輯範本：${target.basicData.name}`;
        document.getElementById('templateCode').value = target.basicData.templateCode || '';
        document.getElementById('templateName').value = target.basicData.name || '';
        document.getElementById('templateType').value = type;
        this.populateProductCodeOptions(type, target.basicData.productCode || '');
        const isActive = target.basicData.isActive !== false; // 預設為啟用，未存過的舊資料也視為啟用
        document.getElementById('isActive').checked = isActive;
        document.getElementById('isActiveLabel').textContent = isActive ? '啟用' : '停用';
        document.getElementById('shellThickness').value = target.basicData.shellThickness || '';
        document.getElementById('innerDiameter').value = target.basicData.innerDiameter || '';
        document.getElementById('totalLength').value = target.basicData.totalLength || '';
        document.getElementById('setQty').value = target.basicData.setQty || 1;
        document.getElementById('templateRemarks').value = target.remarks || '';

        document.querySelectorAll('.geometry-field').forEach(el => {
            el.style.display = (type === 'engineering') ? 'none' : '';
        });
    },

    // ============================================================
    // 項目清單渲染（比照 detail.js 的分類檢視，不含小計金額）
    // ============================================================
    renderTable() {
        const tbody = document.getElementById('itemsTableBody');
        const noItemsMsg = document.getElementById('noItemsMessage');
        if (!tbody) return;

        if (this.template.items.length === 0) {
            tbody.innerHTML = '';
            if (noItemsMsg) noItemsMsg.style.display = 'block';
            return;
        }
        if (noItemsMsg) noItemsMsg.style.display = 'none';

        tbody.innerHTML = this.renderCategoryView();
    },

    renderCategoryView() {
        let html = '';
        const groups = {};
        CATEGORIES.forEach(c => groups[c] = []);
        groups['未分類'] = [];

        this.template.items.forEach((item, index) => {
            const cat = item.category || '未分類';
            const target = groups[cat] || groups['未分類'];
            target.push({ data: item, originalIndex: index });
        });

        let globalDisplayIndex = 1;

        Object.keys(groups).forEach(catName => {
            const groupItems = groups[catName];
            if (groupItems.length === 0) return;

            html += `
                <tr class="category-header-row">
                    <td colspan="2" class="category-header-title sticky-col"><i class="fas fa-folder-open me-2 text-primary"></i>${catName}</td>
                    <td colspan="4" class="category-header-filler"></td>
                    <td class="category-header-filler sticky-col-7"></td>
                    <td colspan="10" class="category-header-filler"></td>
                </tr>
            `;
            groupItems.forEach(obj => {
                html += this.generateRowHtml(obj.data, obj.originalIndex, globalDisplayIndex++);
            });
        });

        return html;
    },

    generateRowHtml(item, originalIndex, displayIndex) {
        const qty = parseFloat(item.qty) || 0;
        const qtyMfg = parseFloat(item.qtyMfg) || 0;
        let rowCutLose = '-';
        if (qty > 0) {
            const lossPct = ((qty - qtyMfg) / qty) * 100;
            rowCutLose = lossPct.toFixed(1) + '%';
        }

        const moveControls = `
            <div class="d-flex justify-content-center gap-1">
                <button class="btn-sort" onclick="TemplateEditor.moveItem(${originalIndex}, -1)" title="上移"><i class="fas fa-arrow-up"></i></button>
                <button class="btn-sort" onclick="TemplateEditor.moveItem(${originalIndex}, 1)" title="下移"><i class="fas fa-arrow-down"></i></button>
                <button class="btn-sort btn-delete" onclick="TemplateEditor.removeItem(${originalIndex})" title="刪除"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        return `
            <tr>
                <td class="text-center sticky-col">${moveControls}</td>
                <td class="text-center sticky-col text-dark fw-bold">${displayIndex}</td>
                <td><select class="form-input-compact" onchange="TemplateEditor.updateItem(${originalIndex}, 'category', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.categories, item.category)}</select></td>
                <td><select class="form-input-compact" onchange="TemplateEditor.updateItem(${originalIndex}, 'costCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.costCodes, item.costCode)}</select></td>
                <td><select class="form-input-compact" onchange="TemplateEditor.updateItem(${originalIndex}, 'accountCode', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.accountCodes, item.accountCode)}</select></td>
                <td><input type="text" class="form-input-compact" value="${item.matNo || ''}" onchange="TemplateEditor.updateItem(${originalIndex}, 'matNo', this.value)"></td>
                <td class="sticky-col-7"><input type="text" class="form-input-compact" value="${item.name || ''}" onchange="TemplateEditor.updateItem(${originalIndex}, 'name', this.value)"></td>
                <td><select class="form-input-compact" onchange="TemplateEditor.updateItem(${originalIndex}, 'dept', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.departments, item.dept)}</select></td>
                <td><select class="form-input-compact" onchange="TemplateEditor.updateItem(${originalIndex}, 'workType', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.workTypes, item.workType)}</select></td>
                <td><input type="text" class="form-input-compact" value="${item.material || ''}" onchange="TemplateEditor.updateItem(${originalIndex}, 'material', this.value)" placeholder="-"></td>
                <td><select class="form-input-compact text-center" onchange="TemplateEditor.updateItem(${originalIndex}, 'unit', this.value)">${this.getOptionsHtml(DROPDOWN_OPTIONS.units, item.unit)}</select></td>
                <td><input type="number" class="form-input-compact text-end" value="${item.qty === null || item.qty === undefined ? '' : item.qty}" onchange="TemplateEditor.updateItem(${originalIndex}, 'qty', this.value)"></td>
                <td><input type="number" class="form-input-compact text-end" value="${item.qtyMfg === null || item.qtyMfg === undefined ? '' : item.qtyMfg}" onchange="TemplateEditor.updateItem(${originalIndex}, 'qtyMfg', this.value)"></td>
                <td class="text-center small text-danger align-middle fw-bold">${rowCutLose}</td>
                <td>
                    <div class="input-group flex-nowrap input-group-price">
                        <input type="number" class="form-control form-input-compact text-end" value="${item.price === null || item.price === undefined ? '' : item.price}" onchange="TemplateEditor.updateItem(${originalIndex}, 'price', this.value)">
                        <button class="btn btn-outline-secondary" type="button" onclick="TemplateEditor.showHistory(${originalIndex})" title="查看歷史單價"><i class="fas fa-history"></i></button>
                    </div>
                </td>
                <td class="p-1"><input type="number" class="form-input-compact text-end" value="${item.manHours || 0}" onchange="TemplateEditor.updateItem(${originalIndex}, 'manHours', this.value)"></td>
                <td><input type="text" class="form-input-compact" value="${item.note || ''}" onchange="TemplateEditor.updateItem(${originalIndex}, 'note', this.value)"></td>
            </tr>
        `;
    },

    getOptionsHtml(options, selectedValue) {
        return ['<option value="">-</option>']
            .concat(options.map(opt => `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`))
            .join('');
    },

    // ============================================================
    // 項目操作（比照 detail.js：updateItem / addItem / removeItem / moveItem）
    // ============================================================
    updateItem(index, field, value) {
        const item = this.template.items[index];
        if (['qty', 'qtyMfg', 'price', 'manHours'].includes(field)) {
            item[field] = value === '' ? null : (parseFloat(value) || 0);
        } else {
            item[field] = value;
        }
        this.renderTable();
    },

    addItem() {
        this.template.items.push({
            category: '專案材料',
            costCode: DROPDOWN_OPTIONS.costCodes[0],
            accountCode: DROPDOWN_OPTIONS.accountCodes[0],
            matNo: '', name: '', material: '',
            dept: '採購部',
            workType: '冷作工',
            unit: 'kg',
            qty: null, qtyMfg: null, price: null, manHours: 0, note: ''
        });
        this.renderTable();
    },

    removeItem(index) {
        if (confirm('確定要刪除此項目嗎？')) {
            this.template.items.splice(index, 1);
            this.renderTable();
        }
    },

    moveItem(index, direction) {
        if ((direction === -1 && index === 0) || (direction === 1 && index === this.template.items.length - 1)) return;
        const temp = this.template.items[index];
        this.template.items[index] = this.template.items[index + direction];
        this.template.items[index + direction] = temp;
        this.renderTable();
    },

    // ============================================================
    // 歷史單價查詢（沿用 detail.js 的 showHistory/applyHistoryPrice/generateMockHistory）
    // ★ TODO(後端整合)：與查詢中心、估算工作台共用同一支歷史單價 API，不要三邊各自模擬。
    // ============================================================
    showHistory(index) {
        this.currentEditingIndex = index;
        const item = this.template.items[index];
        document.getElementById('historyItemName').textContent = item.name || '-';
        document.getElementById('historyItemMatNo').textContent = item.matNo || '-';
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = this.generateMockHistory(item.price > 0 ? item.price : 1000).map(r => `<tr><td>${r.date}</td><td>${r.vendor}</td><td>${r.projectNo}</td><td class="text-end">${Math.round(r.price).toLocaleString()}</td><td>${r.note}</td><td class="text-center"><button class="btn btn-sm btn-primary" onclick="TemplateEditor.applyHistoryPrice(${r.price})">選擇</button></td></tr>`).join('');
        new bootstrap.Modal(document.getElementById('historyPriceModal')).show();
    },

    applyHistoryPrice(price) {
        if (this.currentEditingIndex !== null) {
            this.updateItem(this.currentEditingIndex, 'price', price);
            bootstrap.Modal.getInstance(document.getElementById('historyPriceModal')).hide();
        }
    },

    generateMockHistory(basePrice) {
        return Array.from({ length: 5 }, (_, i) => ({
            date: '2025-0' + ((i % 9) + 1) + '-1' + i,
            vendor: ['春源鋼鐵', '中鋼構', '大成鋼', '捷流', '信宏'][i % 5],
            projectNo: 'EQ-00' + i,
            price: Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.2)),
            note: '-'
        }));
    },

    // ============================================================
    // 滿版編輯模式（沿用 detail.js）
    // ============================================================
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

    // ============================================================
    // 儲存（取代 detail.js 的 saveData/completeEstimation：不涉及 ERP 鎖定/同步）
    // ★ TODO(後端整合)：改為呼叫後端 API 新增/更新範本
    // ============================================================
    saveTemplate() {
        const name = document.getElementById('templateName').value.trim();
        if (!name) {
            LiangLianSystem.showToast('請輸入範本名稱', 'warning');
            document.getElementById('templateName').focus();
            return;
        }
        const productCode = document.getElementById('productCode').value;
        if (!productCode) {
            LiangLianSystem.showToast('請選擇分類代碼', 'warning');
            return;
        }
        if (this.template.items.length === 0) {
            LiangLianSystem.showToast('請至少新增一個項目', 'warning');
            return;
        }
        const hasEmptyKeyItem = this.template.items.some(i => !i.name && !i.matNo);
        if (hasEmptyKeyItem) {
            LiangLianSystem.showToast('有項目尚未填寫料號或品名，請確認後再儲存', 'warning');
            return;
        }

        const templateType = document.getElementById('templateType').value;
        this.template.basicData = {
            templateCode: document.getElementById('templateCode').value.trim(),
            name: name,
            templateType: templateType,
            productCode: productCode,
            isActive: document.getElementById('isActive').checked,
            shellThickness: templateType === 'engineering' ? '' : document.getElementById('shellThickness').value,
            innerDiameter: templateType === 'engineering' ? '' : document.getElementById('innerDiameter').value,
            totalLength: templateType === 'engineering' ? '' : document.getElementById('totalLength').value,
            setQty: templateType === 'engineering' ? null : (parseFloat(document.getElementById('setQty').value) || 1)
        };
        this.template.remarks = document.getElementById('templateRemarks').value;

        console.log('儲存範本（模擬）:', JSON.parse(JSON.stringify(this.template)));

        LiangLianSystem.showToast(this.templateId ? '範本已更新' : '範本已建立', 'success');
        setTimeout(() => {
            window.location.href = '../template-list/index.html';
        }, 800);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TemplateEditor.init();
});