// 範本管理列表
// ★ 範本項目欄位比照估算工作台（qty/qtyMfg/price），拿掉矩陣模式與4項利管費率。
//   欄位命名與 template-editor.js 的 MOCK_TEMPLATES 保持一致，方便日後串接同一支後端 API。
const TemplateList = (function() {
    'use strict';

    // ★ 與 template-editor.js 的 PRODUCT_CODE_OPTIONS 保持一致（業主固定的分類標準）
    const PRODUCT_CODE_OPTIONS = {
        equipment: [
            { code: 'PC', name: '塔槽' }, { code: 'PD', name: '貯槽' }, { code: 'PE', name: '熱交換器' },
            { code: 'PR', name: '反應器' }, { code: 'PS', name: '球形槽' }, { code: 'PA', name: '空氣冷卻器' },
            { code: 'PB', name: '鍋爐' }, { code: 'SD', name: '煙道及煙囪' }, { code: 'SF', name: '加熱爐' },
            { code: 'SS', name: '鋼結構' }, { code: 'ST', name: '大型儲槽' }
        ],
        engineering: [
            { code: 'IE', name: '管線安裝工程' }, { code: 'IP', name: '配管預製與安裝' }, { code: 'SM', name: '模組設備' },
            { code: 'IC', name: '保溫保冷防蝕包覆' }, { code: 'MM', name: '材料買賣' }, { code: 'SE', name: '環保工程' }
        ]
    };
    const TYPE_LABELS = { equipment: '設備範本', engineering: '工程範本' };

    function findProductName(code) {
        const all = [...PRODUCT_CODE_OPTIONS.equipment, ...PRODUCT_CODE_OPTIONS.engineering];
        const found = all.find(o => o.code === code);
        return found ? found.name : '';
    }

    // ============================================================
    // 1. 模擬資料 (Mock Data)
    // ★ TODO(後端整合)：改為呼叫後端 API 取得範本清單，欄位結構不變
    // ============================================================
    let mockTemplates = [
        {
            id: 'TPL001',
            name: '潔淨室建置工程標準範本',
            templateType: 'engineering',
            productCode: 'IE',
            isActive: true,
            createdBy: '張育霖',
            updatedAt: '2025-11-20',
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
            name: 'MES系統建置範本',
            templateType: 'engineering',
            productCode: 'SM',
            isActive: true,
            createdBy: '陳怡君',
            updatedAt: '2025-11-08',
            items: [
                { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'E-SENSOR-01', name: '感測器模組', material: '-', dept: '採購部', workType: '', unit: 'pcs', qty: 24, qtyMfg: 24, price: 1500, manHours: 0, note: '' },
                { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'E-PANEL-01', name: '電控盤', material: '-', dept: '採購部', workType: '', unit: '台', qty: 3, qtyMfg: 3, price: 45000, manHours: 0, note: '' },
                { category: '專案外包工程', costCode: 'DPCMM106', accountCode: '1251M4', matNo: '', name: '配線工程', material: '-', dept: '工務部', workType: '電銲工', unit: '式', qty: 1, qtyMfg: 0, price: null, manHours: 0, note: '依廠區配電圖估算' }
            ]
        },
        {
            id: 'TPL003',
            name: '廢水處理擴建範本',
            templateType: 'equipment',
            productCode: 'PD',
            isActive: false,
            createdBy: '張育霖',
            updatedAt: '2025-10-25',
            items: [
                { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'P-150', name: 'PIPE 無縫鋼管', material: '-', dept: '採購部', workType: '', unit: 'M', qty: 180, qtyMfg: 180, price: 1200, manHours: 0, note: '' },
                { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'M101-STOQ', name: '鋼板(9t)', material: 'SS400', dept: '採購部', workType: '冷作工', unit: 'kg', qty: 1500, qtyMfg: 1500, price: 35, manHours: 0, note: '' },
                { category: '專案製造', costCode: 'DPCMM102', accountCode: '1251M2', matNo: '', name: '冷作工', material: '-', dept: '工務部', workType: '冷作工', unit: '工', qty: 1, qtyMfg: 0, price: 3800, manHours: 4, note: '' }
            ]
        },
        {
            id: 'TPL004',
            name: '電力系統改善範本',
            templateType: 'engineering',
            productCode: 'IE',
            isActive: true,
            createdBy: '陳怡君',
            updatedAt: '2025-10-12',
            items: [
                { category: '專案材料', costCode: 'DPCMM101', accountCode: '1251M1', matNo: 'S-100', name: 'H型鋼', material: '型鋼製品', dept: '採購部', workType: '', unit: 'TON', qty: 2.5, qtyMfg: 2.5, price: 45000, manHours: 0, note: '支撐架構' },
                { category: '專案外包工程', costCode: 'DPCMM106', accountCode: '1251M4', matNo: '', name: '配電盤更新工程', material: '-', dept: '工務部', workType: '電銲工', unit: '式', qty: 1, qtyMfg: 0, price: null, manHours: 0, note: '' }
            ]
        }
    ];

    // ============================================================
    // 2. 狀態
    // ============================================================
    let state = {
        filtered: [],
        currentPage: 1,
        pageSize: 10,
        filters: { keyword: '', templateType: '', productCode: '', status: '' },
        sort: { column: 'updatedAt', direction: 'desc' }
    };

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        populateProductCodeFilter('');
        bindEvents();
        applyFilters();
    }

    // ★ 分類代碼篩選：依「範本類型」篩選結果縮小選項；未選類型時顯示全部代碼
    function populateProductCodeFilter(type) {
        const el = document.getElementById('filterProductCode');
        if (!el) return;
        const options = type ? PRODUCT_CODE_OPTIONS[type] : [...PRODUCT_CODE_OPTIONS.equipment, ...PRODUCT_CODE_OPTIONS.engineering];
        el.innerHTML = '<option value="">全部代碼</option>' +
            options.map(o => `<option value="${o.code}">${o.code} ${o.name}</option>`).join('');
    }

    function bindEvents() {
        const searchInput = document.getElementById('searchKeyword');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                state.filters.keyword = this.value;
                state.currentPage = 1;
                applyFilters();
            });
        }

        const typeSelect = document.getElementById('filterType');
        if (typeSelect) {
            typeSelect.addEventListener('change', function() {
                state.filters.templateType = this.value;
                state.filters.productCode = ''; // 切換類型時，先前選的代碼可能不屬於新類型，清空避免篩不出東西
                populateProductCodeFilter(this.value);
                document.getElementById('filterProductCode').value = '';
                state.currentPage = 1;
                applyFilters();
            });
        }

        const productCodeSelect = document.getElementById('filterProductCode');
        if (productCodeSelect) {
            productCodeSelect.addEventListener('change', function() {
                state.filters.productCode = this.value;
                state.currentPage = 1;
                applyFilters();
            });
        }

        const statusSelect = document.getElementById('filterStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                state.filters.status = this.value;
                state.currentPage = 1;
                applyFilters();
            });
        }

        const clearBtn = document.getElementById('clearFilterBtn');
        if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    }

    function clearFilters() {
        state.filters = { keyword: '', templateType: '', productCode: '', status: '' };
        const searchInput = document.getElementById('searchKeyword');
        if (searchInput) searchInput.value = '';
        const typeSelect = document.getElementById('filterType');
        if (typeSelect) typeSelect.value = '';
        const statusSelect = document.getElementById('filterStatus');
        if (statusSelect) statusSelect.value = '';
        populateProductCodeFilter('');
        state.currentPage = 1;
        applyFilters();
    }

    // ============================================================
    // 4. 篩選、排序
    // ============================================================
    function applyFilters() {
        const kw = state.filters.keyword.trim().toLowerCase();

        let result = mockTemplates.filter(t => {
            const matchKeyword = !kw ||
                t.name.toLowerCase().includes(kw) ||
                t.items.some(i => (i.matNo || '').toLowerCase().includes(kw) || (i.name || '').toLowerCase().includes(kw));
            const matchType = !state.filters.templateType || t.templateType === state.filters.templateType;
            const matchProductCode = !state.filters.productCode || t.productCode === state.filters.productCode;
            const matchStatus = !state.filters.status ||
                (state.filters.status === 'active' && t.isActive) ||
                (state.filters.status === 'inactive' && !t.isActive);
            return matchKeyword && matchType && matchProductCode && matchStatus;
        });

        const { column, direction } = state.sort;
        result.sort((a, b) => {
            let valA = column === 'itemCount' ? a.items.length : a[column];
            let valB = column === 'itemCount' ? b.items.length : b[column];
            if (typeof valA === 'boolean' && typeof valB === 'boolean') {
                valA = valA ? 1 : 0;
                valB = valB ? 1 : 0;
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return direction === 'asc' ? valA - valB : valB - valA;
            }
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        state.filtered = result;
        renderTable();
        renderPagination();
    }

    function sortData(column) {
        if (state.sort.column === column) {
            state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.sort.column = column;
            state.sort.direction = 'asc';
        }
        updateSortIcons();
        applyFilters();
    }

    function updateSortIcons() {
        document.querySelectorAll('.template-table th i.fas').forEach(icon => {
            if (icon.id && icon.id.startsWith('icon-')) icon.className = 'fas fa-sort';
        });
        document.querySelectorAll('.template-table th').forEach(th => th.classList.remove('active-sort'));
        const activeIcon = document.getElementById(`icon-${state.sort.column}`);
        if (activeIcon) {
            activeIcon.className = state.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            if (activeIcon.parentElement) activeIcon.parentElement.classList.add('active-sort');
        }
    }

    // ============================================================
    // 5. 渲染
    // ============================================================
    function renderTable() {
        const tbody = document.getElementById('templateTableBody');
        const noDataMsg = document.getElementById('noDataMessage');
        const totalRecordsEl = document.getElementById('totalRecords');
        const paginationSection = document.getElementById('paginationSection');
        if (!tbody) return;

        if (totalRecordsEl) totalRecordsEl.textContent = state.filtered.length;

        if (state.filtered.length === 0) {
            tbody.innerHTML = '';
            if (noDataMsg) noDataMsg.style.display = 'block';
            if (paginationSection) paginationSection.style.display = 'none';
            return;
        }
        if (noDataMsg) noDataMsg.style.display = 'none';
        if (paginationSection) paginationSection.style.display = 'block';

        const startIndex = (state.currentPage - 1) * state.pageSize;
        const endIndex = Math.min(startIndex + state.pageSize, state.filtered.length);
        const pageData = state.filtered.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(t => `
            <tr>
                <td class="fw-bold">${t.name}</td>
                <td><span class="type-tag type-${t.templateType}">${TYPE_LABELS[t.templateType] || '-'}</span></td>
                <td><span class="category-tag">${t.productCode} ${findProductName(t.productCode)}</span></td>
                <td class="text-center">${t.items.length}</td>
                <td>${t.createdBy}</td>
                <td>${t.updatedAt}</td>
                <td class="text-center">
                    <div class="form-check form-switch d-flex justify-content-center align-items-center gap-2 mb-0">
                        <input class="form-check-input" type="checkbox" role="switch"
                               id="statusSwitch-${t.id}"
                               ${t.isActive ? 'checked' : ''}
                               onchange="TemplateList.toggleActive('${t.id}')"
                               title="${t.isActive ? '啟用中，點擊停用' : '已停用，點擊啟用'}">
                        <label class="form-check-label small ${t.isActive ? 'text-success' : 'text-muted'}" for="statusSwitch-${t.id}">${t.isActive ? '啟用' : '停用'}</label>
                    </div>
                </td>
                <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                        <a href="../template-editor/index.html?id=${t.id}" class="btn btn-sm btn-outline-primary" title="編輯">
                            <i class="fas fa-pen"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-secondary" title="複製" onclick="TemplateList.duplicateTemplate('${t.id}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="刪除" onclick="TemplateList.deleteTemplate('${t.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        if (state.filtered.length === 0) {
            paginationEl.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(state.filtered.length / state.pageSize);
        let html = `
            <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); TemplateList.goToPage(${state.currentPage - 1})">上一頁</a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                html += `
                    <li class="page-item ${i === state.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); TemplateList.goToPage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        html += `
            <li class="page-item ${state.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); TemplateList.goToPage(${state.currentPage + 1})">下一頁</a>
            </li>
        `;

        paginationEl.innerHTML = html;
    }

    // ============================================================
    // 6. 操作：複製 / 刪除
    // ★ TODO(後端整合)：複製與刪除都要換成實際 API 呼叫
    // ============================================================
    function duplicateTemplate(id) {
        const original = mockTemplates.find(t => t.id === id);
        if (!original) return;

        const newId = 'TPL' + String(Date.now()).slice(-6);
        const copy = JSON.parse(JSON.stringify(original));
        copy.id = newId;
        copy.name = original.name + '（複製）';
        copy.updatedAt = new Date().toISOString().slice(0, 10);
        mockTemplates.unshift(copy);

        // ★ TODO(後端整合)：範本列表跟範本編輯器目前是各自獨立的 mock 資料（見檔案開頭說明），
        //   複製出來的新範本編輯器那邊完全不知道存在，點「編輯」會找不到、變成新增模式。
        //   這裡先用 sessionStorage 當暫時的跨頁橋接，把複製結果轉成編輯器期待的資料格式存起來，
        //   編輯器載入時會先查 sessionStorage 再查自己的 MOCK_TEMPLATES。串接真正後端 API 後，
        //   兩邊都改成呼叫同一支「取得範本」介面，這段橋接可以整個刪除。
        // 注意：列表這邊的 mock 資料沒有存幾何欄位（胴身厚/內徑/總長度/參考套數），
        //   複製後這幾欄會是空的，這是目前 mock-only 架構下的已知限制，不是新 bug。
        try {
            sessionStorage.setItem('tpl_' + newId, JSON.stringify({
                id: newId,
                basicData: {
                    templateCode: '',
                    name: copy.name,
                    templateType: copy.templateType,
                    productCode: copy.productCode,
                    isActive: copy.isActive,
                    shellThickness: '', innerDiameter: '', totalLength: '', setQty: 1
                },
                remarks: '',
                items: copy.items
            }));
        } catch (e) {
            console.warn('sessionStorage 寫入失敗，複製的範本仍會顯示在列表中，但編輯時可能找不到內容', e);
        }

        populateProductCodeFilter(state.filters.templateType);
        applyFilters();
        LiangLianSystem.showToast(`已複製範本：${copy.name}`, 'success');
    }

    // ★ 刪除確認改用瀏覽器原生 confirm()，不再另外做 Modal
    function deleteTemplate(id) {
        const target = mockTemplates.find(t => t.id === id);
        if (!target) return;

        if (!confirm(`確定要刪除範本「${target.name}」嗎？此動作無法復原。`)) return;

        mockTemplates = mockTemplates.filter(t => t.id !== id);
        populateProductCodeFilter(state.filters.templateType);
        applyFilters();
        LiangLianSystem.showToast('範本已刪除', 'success');
    }

    // ★ TODO(後端整合)：改為呼叫後端 API 更新 is_active 狀態
    function toggleActive(id) {
        const target = mockTemplates.find(t => t.id === id);
        if (!target) return;
        target.isActive = !target.isActive;
        applyFilters();
        LiangLianSystem.showToast(`範本「${target.name}」已${target.isActive ? '啟用' : '停用'}`, 'success');
    }

    // ============================================================
    // 7. 公開方法
    // ============================================================
    return {
        init: init,
        sortData: sortData,
        duplicateTemplate: duplicateTemplate,
        deleteTemplate: deleteTemplate,
        toggleActive: toggleActive,
        goToPage: function(page) {
            const totalPages = Math.ceil(state.filtered.length / state.pageSize);
            if (page < 1 || page > totalPages) return;
            state.currentPage = page;
            renderTable();
            renderPagination();
        },
        changePageSize: function(size) {
            state.pageSize = parseInt(size);
            state.currentPage = 1;
            renderTable();
            renderPagination();
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    TemplateList.init();
});