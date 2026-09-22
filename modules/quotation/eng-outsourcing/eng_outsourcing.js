/* 工程發包計畫管理邏輯 - 依據圖四需求開發並還原原版樣式 */

// 模擬供應商資料庫 (沿用，稍作擴充以符合圖中範例)
const VENDOR_DATABASE = [
    { id: "V001", name: "盛發", taxId: "22334455", category: "C01", categoryName: "工程施作類", contact: "陳建文", phone: "0918-566678", email: "hc47737889@gmail.com", location: "工地" },
    { id: "V002", name: "皇壹", taxId: "33445566", category: "C01", categoryName: "工程施作類", contact: "王全家", phone: "0932-727011", email: "frankbetty88@yahoo.com.tw", location: "工地" },
    { id: "V003", name: "鈺安", taxId: "11223344", category: "C01", categoryName: "工程施作類", contact: "陳振三", phone: "0919-537545", email: "chenathree@gmail.com", location: "工地" },
    { id: "V004", name: "璟凱", taxId: "55667788", category: "C01", categoryName: "工程施作類", contact: "蘇融垣", phone: "0920-421488", email: "jingkai8168@yahoo.com.tw", location: "工地" },
    { id: "V005", name: "三煜", taxId: "66778899", category: "C01", categoryName: "工程施作類", contact: "洪鋒文", phone: "07-6465081", email: "sanyu.kh@msa.hinet.net", location: "工地" },
    { id: "V006", name: "鴻耀", taxId: "00000000", category: "C01", categoryName: "工程施作類", contact: "邱榮建", phone: "0936-031023", email: "hongyao5482@gmail.com", location: "工地" }
];

const ConstructionPlan = {
    projectId: '', 
    currentEditingRowId: null, 
    selectedVendorIdInModal: null, 
    vendorModal: null,

    init() {
        console.log("工程發包計畫啟動...");
        this.handleNavigation();
        this.renderInitialData();
        
        const modalEl = document.getElementById('vendorModal');
        if (modalEl) {
            this.vendorModal = new bootstrap.Modal(modalEl);
        }
    },

    handleNavigation() {
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('projectId') || 'EQ25090001'; 
        
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.removeAttribute('href');
            backBtn.style.cursor = 'pointer';
            backBtn.onclick = () => {
                window.location.href = `../project-dashboard/index.html?projectId=${this.projectId}`;
            };
        }
    },

    // 載入圖四的預設資料 (移除換行符號以符合 form-input-compact 樣式)
    renderInitialData() {
        document.getElementById('constructionPlanBody').innerHTML = '';
        
        // 項次 1 - 盛發
        this.addItem({
            index: "1", type: "設備安裝", content: "V-1204塔槽新舊拆裝(含爬梯、操作平台及欄杆)", qty: "ID 3000 * H 16000 重量:61000 KG", 
            vendorId: "V001", site: "工地", budget: "", quoteStatus: "N", 
            dateHope: "", vendorReply: "N", dateActual: "", selectResult: "N", quotation: "", note: "工作飽和，無法報價"
        });

        // 項次 1 - 皇壹
        this.addItem({
            index: "1", type: "設備安裝", content: "V-1204塔槽新舊拆裝(含爬梯、操作平台及欄杆)", qty: "ID 3000 * H 16000 重量:61000 KG", 
            vendorId: "V002", site: "工地", budget: "", quoteStatus: "Y", 
            dateHope: "", vendorReply: "Y", dateActual: "", selectResult: "Y", quotation: 2087800, note: "不含施工架"
        });

        // 項次 2 - 鈺安
        this.addItem({
            index: "2", type: "設備安裝", content: "內構件拆裝", qty: "塔盤10層, 重量:3400 KG", 
            vendorId: "V003", site: "工地", budget: "", quoteStatus: "Y", 
            dateHope: "", vendorReply: "Y", dateActual: "", selectResult: "Y", quotation: 299200, note: ""
        });

        this.calculateTotals();
    },

    /**
     * 建立一筆發包資料列 (完全使用 .form-input-compact 及 .col-budget 樣式)
     */
    addItem(data = null) {
        const tbody = document.getElementById('constructionPlanBody');
        const rowId = `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`; 
        const row = document.createElement('tr');
        row.id = rowId;

        // 預設空資料
        const d = data || { 
            index: "", type: "", content: "", qty: "", vendorId: "", 
            site: "工地", budget: "", quoteStatus: "Y", 
            dateHope: "", vendorReply: "", dateActual: "", 
            selectResult: "", quotation: "", note: "" 
        };

        const vendor = VENDOR_DATABASE.find(v => v.id === d.vendorId);
        const vendorName = vendor ? vendor.name : ""; 
        const contactInfo = vendor || { contact: "", phone: "", email: "" };

        // 建立 select 幫助函數
        const renderSelect = (value, options) => {
            return options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('');
        };

        // 替換 textarea 為 input 確保高度一致，套用 col-budget 保留藍色背景樣式
        row.innerHTML = `
            <td class="sticky-col col-ops text-center">
                <button class="btn-sort btn-delete" title="刪除此項" onclick="ConstructionPlan.removeRow(this)">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
            <td class="sticky-col col-idx text-center fw-bold">${d.index}</td>
            <td><input type="text" class="form-input-compact text-center" value="${d.type}"></td>
            <td><input type="text" class="form-input-compact" value="${d.content}" title="${d.content}"></td>
            <td><input type="text" class="form-input-compact" value="${d.qty}" title="${d.qty}"></td>
            
            <!-- 廠商選擇欄位 -->
            <td>
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-input-compact vendor-name-display" 
                           value="${vendorName}" placeholder="請選擇廠商..." readonly 
                           onclick="ConstructionPlan.openVendorModal('${rowId}')" style="cursor: pointer; background-color: #fff;">
                    <button class="btn btn-outline-secondary" type="button" onclick="ConstructionPlan.openVendorModal('${rowId}')">
                        <i class="fas fa-search"></i>
                    </button>
                    <input type="hidden" class="vendor-id-hidden" value="${d.vendorId}">
                </div>
            </td>

            <!-- 廠商資訊 -->
            <td><input type="text" class="form-input-compact contact-field" value="${contactInfo.contact}" readonly></td>
            <td><input type="text" class="form-input-compact phone-field" value="${contactInfo.phone}" readonly></td>
            <td><input type="text" class="form-input-compact email-field" value="${contactInfo.email}" readonly></td>
            
            <!-- 施工場地 (Dropdown) -->
            <td>
                <select class="form-input-compact text-center">
                    ${renderSelect(d.site, ['良聯', '廠商', '工地'])}
                </select>
            </td>
            
            <!-- 預算 (套用原版藍底 col-budget) -->
            <td class="col-budget">
                <input type="number" class="form-input-compact text-end text-danger fw-bold" value="${d.budget}">
            </td>
            
            <!-- 廠商報價 (Dropdown) -->
            <td>
                <select class="form-input-compact text-center">
                    ${renderSelect(d.quoteStatus, ['Y', 'N'])}
                </select>
            </td>
            
            <!-- 發包議價日期區塊 -->
            <td><input type="date" class="form-input-compact" value="${d.dateHope}"></td>
            <td>
                <select class="form-input-compact text-center">
                    <option value="">請選擇</option>
                    ${renderSelect(d.vendorReply, ['Y', 'N'])}
                </select>
            </td>
            <td><input type="date" class="form-input-compact" value="${d.dateActual}"></td>
            
            <!-- 遴選結果 -->
            <td>
                <select class="form-input-compact text-center fw-bold text-primary">
                    <option value="">未定</option>
                    ${renderSelect(d.selectResult, ['Y', 'N'])}
                </select>
            </td>
            
            <!-- 報價金額 (套用原版藍底 col-budget) -->
            <td class="col-budget">
                <input type="number" class="form-input-compact text-end fw-bold quotation-input" 
                       value="${d.quotation}" onchange="ConstructionPlan.calculateTotals()">
            </td>
            
            <!-- 備註 -->
            <td><input type="text" class="form-input-compact" value="${d.note}"></td>
        `;
        
        tbody.appendChild(row);
    },

    openVendorModal(rowId) {
        this.currentEditingRowId = rowId;
        this.selectedVendorIdInModal = null; 
        document.getElementById('vendorSearchInput').value = '';
        document.getElementById('vendorCategorySelect').value = '';
        this.renderVendorList(VENDOR_DATABASE);
        this.vendorModal.show();
    },

    renderVendorList(vendors) {
        const tbody = document.getElementById('vendorListBody');
        const countSpan = document.getElementById('vendorCount');
        countSpan.textContent = vendors.length;
        tbody.innerHTML = '';

        if (vendors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">沒有符合條件的廠商</td></tr>`;
            return;
        }

        vendors.forEach(v => {
            const tr = document.createElement('tr');
            tr.className = 'vendor-row';
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
                <td>${v.email}</td>
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
        const row = document.getElementById(this.currentEditingRowId);

        if (vendor && row) {
            row.querySelector('.vendor-id-hidden').value = vendor.id;
            row.querySelector('.vendor-name-display').value = vendor.name;
            row.querySelector('.contact-field').value = vendor.contact;
            row.querySelector('.phone-field').value = vendor.phone;
            row.querySelector('.email-field').value = vendor.email;

            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.style.transition = 'background-color 0.3s';
                const originalBg = input.style.backgroundColor;
                input.style.backgroundColor = '#f0fdf4'; 
                setTimeout(() => input.style.backgroundColor = originalBg, 800);
            });
        }
        this.vendorModal.hide();
    },

    removeRow(btn) {
        if (confirm("確定要刪除此筆發包資料嗎？")) {
            btn.closest('tr').remove();
            this.calculateTotals();
        }
    },

    /**
     * 計算總金額
     */
    calculateTotals() {
        let totalQuotation = 0;
        document.querySelectorAll('#constructionPlanBody tr').forEach(row => {
            const quoteInput = row.querySelector('.quotation-input');
            if (quoteInput && quoteInput.value) {
                totalQuotation += parseFloat(quoteInput.value) || 0;
            }
        });
        const display = document.getElementById('totalQuotationDisplay');
        if (display) {
            display.textContent = totalQuotation.toLocaleString();
        }
    },

    saveData() {
        if (typeof LiangLianSystem !== 'undefined') {
            LiangLianSystem.showToast("工程發包計畫暫存成功", "success");
        } else {
            alert("計畫已暫存成功！");
        }
    },

    submitPlan() {
        if (confirm("完成計畫後將鎖定內容，確定完成嗎？")) {
            if (typeof LiangLianSystem !== 'undefined') {
                LiangLianSystem.showToast("工程發包計畫已完成", "info");
            } else {
                alert("發包計畫已完成。");
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ConstructionPlan.init());