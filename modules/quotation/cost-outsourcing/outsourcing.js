/* 成本發包計畫管理邏輯 - V5.1 Modal 整合導航修復版 */

// 模擬供應商資料庫 (擴充欄位以符合業主需求)
const VENDOR_DATABASE = [
    { id: "V001", name: "欣興金屬工業股份有限公司", taxId: "22334455", category: "A01", categoryName: "金屬加工類", contact: "陳建國", phone: "0911-222-333", email: "service@xin-xing.com", location: "良聯" },
    { id: "V002", name: "德義專業塗裝廠", taxId: "33445566", category: "A02", categoryName: "表面處理類", contact: "林美華", phone: "04-23456789", email: "dy.paint@gmail.com", location: "廠商" },
    { id: "V003", name: "中鋼機械股份有限公司", taxId: "11223344", category: "B01", categoryName: "機械設備類", contact: "王立民", phone: "07-8021111", email: "sales@cssc.com.tw", location: "良聯" },
    { id: "V004", name: "利通工程行", taxId: "55667788", category: "C01", categoryName: "工程施作類", contact: "李利通", phone: "0933-444-555", email: "litong@outlook.com", location: "廠商" },
    { id: "V005", name: "成泰工業社", taxId: "66778899", category: "A01", categoryName: "金屬加工類", contact: "張成泰", phone: "03-4567890", email: "chen-tai@seed.net.tw", location: "廠商" },
    { id: "V006", name: "良聯金屬加工部", taxId: "00000000", category: "A01", categoryName: "金屬加工類", contact: "郭長宏", phone: "03-1112222", email: "factory@lianglian.com", location: "良聯" },
    // 模擬更多資料以測試篩選
    { id: "V007", name: "大同機電", taxId: "12341234", category: "B01", categoryName: "機械設備類", contact: "趙美華", phone: "02-22223333", email: "sales@tatung.com", location: "廠商" },
    { id: "V008", name: "永安工程", taxId: "43214321", category: "C01", categoryName: "工程施作類", contact: "孫亦傑", phone: "0988-777-666", email: "yongan@gmail.com", location: "廠商" },
];

const OutsourcingPlan = {
    itemCounter: 0,
    projectId: '', // 儲存專案 ID
    currentEditingRowId: null, // 用來記錄目前正在編輯哪一列
    selectedVendorIdInModal: null, // 用來記錄 Modal 中選了哪個廠商
    vendorModal: null,

    /**
     * 頁面初始化
     */
    init() {
        console.log("發包計畫工作台 V5.1 啟動 (Modal + Navigation)...");
        this.handleNavigation(); // ★ 執行導航處理
        this.setDefaultDate();
        this.renderInitialData();
        
        // 初始化 Bootstrap Modal
        const modalEl = document.getElementById('vendorModal');
        if (modalEl) {
            this.vendorModal = new bootstrap.Modal(modalEl);
        }
    },

    /**
     * 處理導航邏輯 (取得 projectId 並修正返回按鈕)
     */
    handleNavigation() {
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('projectId') || 'EQ25090001'; // 預設值以防萬一
        
        // 修正 "返回列表" 按鈕，使其導回專案儀表板
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.removeAttribute('href');
            backBtn.style.cursor = 'pointer';
            backBtn.onclick = () => {
                window.location.href = `../project-dashboard/index.html?projectId=${this.projectId}`;
            };
        }
        
        console.log(`目前專案 ID: ${this.projectId}`);
    },

    setDefaultDate() {
        const dateInput = document.getElementById('planDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    },

    renderInitialData() {
        document.getElementById('planBody').innerHTML = '';
        
        this.addItem({
            code: "ST-01",
            content: "不鏽鋼壓力容器加工 (主體)",
            qty: 1,
            unit: "式",
            vendorId: "V001",
            budget: 1500000,
            note: "配合多年，技術成熟，需追蹤進度"
        });
        
        this.addItem({
            code: "EP-02",
            content: "設備表面噴塗處理",
            qty: 2500,
            unit: "m2",
            vendorId: "V002",
            budget: 350000,
            note: "依最新規格書(V3)要求施作"
        });
        
        this.calculateTotals();
    },

    /**
     * 新增發包詢價項目 (使用 Modal 選擇器 UI)
     */
    addItem(data = null) {
        this.itemCounter++;
        const tbody = document.getElementById('planBody');
        const row = document.createElement('tr');
        row.id = `row-${this.itemCounter}`; // 給每一行一個唯一 ID
        row.dataset.itemId = this.itemCounter;

        const d = data || { code: "", content: "", qty: 1, unit: "式", vendorId: "", budget: 0, note: "" };
        const vendor = VENDOR_DATABASE.find(v => v.id === d.vendorId);
        const vendorName = vendor ? vendor.name : ""; 
        const contactInfo = vendor || { contact: "", phone: "", email: "", location: "良聯" };

        row.innerHTML = `
            <td class="sticky-col col-ops text-center">
                <button class="btn-sort btn-delete" title="刪除此項" onclick="OutsourcingPlan.removeRow(this)">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
            <td class="sticky-col col-idx text-center fw-bold">${this.itemCounter}</td>
            <td><input type="text" class="form-input-compact" value="${d.code}" placeholder="代號"></td>
            <td><input type="text" class="form-input-compact" value="${d.content}" placeholder="發包內容/規格"></td>
            <td><input type="number" class="form-input-compact text-center" value="${d.qty}" placeholder="數量"></td>
            <td><input type="text" class="form-input-compact text-center" value="${d.unit}" placeholder="單位"></td>
            
            <!-- 廠商選擇欄位 -->
            <td>
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-input-compact vendor-name-display" 
                           value="${vendorName}" placeholder="請選擇廠商..." readonly 
                           onclick="OutsourcingPlan.openVendorModal('${row.id}')" style="cursor: pointer; background-color: #fff;">
                    <button class="btn btn-outline-secondary" type="button" onclick="OutsourcingPlan.openVendorModal('${row.id}')">
                        <i class="fas fa-search"></i>
                    </button>
                    <!-- 隱藏欄位：儲存 Vendor ID -->
                    <input type="hidden" class="vendor-id-hidden" value="${d.vendorId}">
                </div>
            </td>

            <td><input type="text" class="form-input-compact contact-field" value="${contactInfo.contact}" readonly></td>
            <td><input type="text" class="form-input-compact phone-field" value="${contactInfo.phone}" readonly></td>
            <td><input type="text" class="form-input-compact email-field" value="${contactInfo.email}" readonly></td>
            <td>
                <select class="form-input-compact location-field">
                    <option ${contactInfo.location === '良聯' ? 'selected' : ''}>良聯</option>
                    <option ${contactInfo.location === '廠商' ? 'selected' : ''}>廠商</option>
                </select>
            </td>
            <td class="col-budget">
                <input type="number" class="form-input-compact text-end fw-bold" 
                       value="${d.budget}" onchange="OutsourcingPlan.calculateTotals()">
            </td>
            <td><input type="text" class="form-input-compact" value="${d.note}" placeholder="備註內容..."></td>
        `;
        
        tbody.appendChild(row);
    },

    /**
     * 開啟廠商選擇 Modal
     * @param {string} rowId - 呼叫此 Modal 的表格列 ID
     */
    openVendorModal(rowId) {
        this.currentEditingRowId = rowId;
        this.selectedVendorIdInModal = null; // 重置選擇
        
        // 重置搜尋條件
        document.getElementById('vendorSearchInput').value = '';
        document.getElementById('vendorCategorySelect').value = '';
        
        // 渲染列表 (顯示所有廠商)
        this.renderVendorList(VENDOR_DATABASE);
        
        // 顯示 Modal
        this.vendorModal.show();
    },

    /**
     * 渲染 Modal 內的廠商列表
     */
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
            // 擴充欄位顯示 (含電話與 Email)
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

    /**
     * 在 Modal 內點選某一行
     */
    selectVendorInModal(tr, vendorId) {
        // 移除其他行的高亮
        document.querySelectorAll('.vendor-row').forEach(row => row.classList.remove('table-active'));
        // 高亮當前行
        tr.classList.add('table-active');
        // 選中 Radio
        const radio = tr.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        
        this.selectedVendorIdInModal = vendorId;
    },

    /**
     * 根據關鍵字與分類篩選廠商
     */
    filterVendors() {
        const keyword = document.getElementById('vendorSearchInput').value.toLowerCase().trim();
        const category = document.getElementById('vendorCategorySelect').value;

        const filtered = VENDOR_DATABASE.filter(v => {
            // 關鍵字搜尋：代號、名稱、統編
            const matchKeyword = !keyword || 
                                 v.id.toLowerCase().includes(keyword) || 
                                 v.name.toLowerCase().includes(keyword) || 
                                 v.taxId.includes(keyword);
            
            // 分類搜尋
            const matchCategory = !category || v.category === category;

            return matchKeyword && matchCategory;
        });

        this.renderVendorList(filtered);
    },

    /**
     * 確認選擇並回填資料
     */
    confirmVendorSelection() {
        if (!this.selectedVendorIdInModal) {
            alert("請先選擇一家廠商");
            return;
        }

        const vendor = VENDOR_DATABASE.find(v => v.id === this.selectedVendorIdInModal);
        const row = document.getElementById(this.currentEditingRowId);

        if (vendor && row) {
            // 回填資料
            row.querySelector('.vendor-id-hidden').value = vendor.id;
            row.querySelector('.vendor-name-display').value = vendor.name;
            
            row.querySelector('.contact-field').value = vendor.contact;
            row.querySelector('.phone-field').value = vendor.phone;
            row.querySelector('.email-field').value = vendor.email;
            row.querySelector('.location-field').value = vendor.location;

            // 視覺提示：閃爍背景
            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.style.backgroundColor = '#f0fdf4'; // 淺綠色
                setTimeout(() => input.style.backgroundColor = '', 800);
            });
        }

        // 關閉 Modal
        this.vendorModal.hide();
    },

    removeRow(btn) {
        if (confirm("確定要刪除此筆發包詢價資料嗎？")) {
            btn.closest('tr').remove();
            this.calculateTotals();
        }
    },

    calculateTotals() {
        let totalBudget = 0;
        document.querySelectorAll('#planBody tr').forEach(row => {
            const budgetInput = row.querySelector('.col-budget input');
            if (budgetInput) {
                totalBudget += parseFloat(budgetInput.value) || 0;
            }
        });
        const display = document.getElementById('totalBudgetDisplay');
        if (display) {
            display.textContent = totalBudget.toLocaleString();
        }
    },

    handleFileUpload(event) {
        const grid = document.getElementById('fileGrid');
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            const fileId = "file_" + Date.now() + Math.random().toString(36).substr(2, 5);
            const extension = file.name.split('.').pop().toLowerCase();
            let iconClass = "fa-file-alt text-secondary";
            
            if (['pdf'].includes(extension)) iconClass = "fa-file-pdf text-danger";
            if (['xls', 'xlsx', 'csv'].includes(extension)) iconClass = "fa-file-excel text-success";
            if (['doc', 'docx'].includes(extension)) iconClass = "fa-file-word text-primary";
            if (['jpg', 'jpeg', 'png'].includes(extension)) iconClass = "fa-file-image text-info";

            const card = document.createElement('div');
            card.className = 'file-card';
            card.id = fileId;
            card.innerHTML = `
                <div class="file-remove" onclick="OutsourcingPlan.removeFile('${fileId}')"><i class="fas fa-times"></i></div>
                <div class="file-icon"><i class="fas ${iconClass}"></i></div>
                <span class="file-name" title="${file.name}">${file.name}</span>
            `;
            grid.appendChild(card);
        });
    },

    removeFile(fileId) {
        const card = document.getElementById(fileId);
        if (card) {
            card.style.transform = "scale(0.8)";
            card.style.opacity = "0";
            setTimeout(() => card.remove(), 250);
        }
    },

    saveData() {
        if (typeof LiangLianSystem !== 'undefined') {
            LiangLianSystem.showToast("發包計畫暫存成功", "success");
        } else {
            alert("計畫已暫存成功！");
        }
    },

    submitPlan() {
        if (confirm("完成計畫後將鎖定內容，確定完成嗎？")) {
            if (typeof LiangLianSystem !== 'undefined') {
                LiangLianSystem.showToast("發包計畫已完成", "info");
            } else {
                alert("發包計畫已完成。");
            }
        }
    },

    showHistory() {
        if (typeof LiangLianSystem !== 'undefined') {
            LiangLianSystem.showToast("版本紀錄讀取中...", "info");
        } else {
            alert("正在載入歷史版本資訊...");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => OutsourcingPlan.init());