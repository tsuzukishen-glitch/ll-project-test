// 成本代碼設定
// ★★★ 重要架構說明 ★★★
// 這張表在後端實際有 20 幾萬筆資料（已經匯入完成），前端絕對不能把全部資料
// 一次載入瀏覽器做過濾/排序/分頁——那種做法只適合範本、查詢中心歷史紀錄這種
// 幾十~幾百筆量級的資料，20 萬筆規模下瀏覽器會直接卡死。
//
// 所以這裡的每一次搜尋、篩選、排序、換頁、新增/編輯/刪除之後，都設計成「重新
// 呼叫一次查詢」，模擬真正串接後端時的行為：條件跟分頁參數送出去，後端只回傳
// 「這一頁」的資料 + 總筆數，前端只負責顯示，不做任何自己的過濾/排序/分頁運算。
//
// ★ TODO(後端整合)：fetchCostCodes() 現在是用一份約 60 筆的 mock 資料模擬「伺服器
//   查詢」的行為（含篩選/排序/分頁邏輯 + 人工延遲，模擬網路來回），介面呼叫的參數
//   格式已經照真正 API 會需要的樣子設計。串接真正後端時，只要把這個函式內部換成
//   實際的 fetch/axios 呼叫，呼叫端（下面的 loadPage 等函式）完全不用改。
// ★ TODO(後端整合)：產品代碼／成本歸屬代碼的下拉選項，假設後端會提供對應的「代碼表」
//   查詢（這兩張表本身筆數不大，是主檔層級，不是 20 萬筆那張明細表），所以這裡用
//   fetchProductCodeOptions()／fetchAttrCodeOptions() 個別模擬，不是從 20 萬筆裡現撈。
const CostCodeSettings = (function() {
    'use strict';

    // ============================================================
    // 1. 模擬資料庫 (僅供前端展示用，代表後端 20 幾萬筆資料裡的一小部分)
    // ============================================================
    const mockDatabase = [
        { id: 'CC001', productCode: 'EB', productName: '建築', attrCode: 'X', attrName: '專案管理', costCode: 'DEBX00H00', costDesc: '專案管理', accountCode: '1253A03' },
        { id: 'CC002', productCode: 'EB', productName: '建築', attrCode: 'X', attrName: '專案管理', costCode: 'DEBXFIH01', costDesc: 'MOM(會議紀錄)', accountCode: '1253A03' },
        { id: 'CC003', productCode: 'EB', productName: '建築', attrCode: 'X', attrName: '專案管理', costCode: 'DEBXFIH02', costDesc: 'Proposal', accountCode: '1253A03' },
        { id: 'CC004', productCode: 'EB', productName: '建築', attrCode: 'X', attrName: '專案管理', costCode: 'DEBXFIH03', costDesc: '竣工報告', accountCode: '1253A03' },
        { id: 'CC005', productCode: 'EB', productName: '建築', attrCode: 'X', attrName: '專案管理', costCode: 'DEBXFIH04', costDesc: '品管報告', accountCode: '1253A03' },
        { id: 'CC006', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH01', costDesc: '專案設計管理', accountCode: '1253A02' },
        { id: 'CC007', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH02', costDesc: '撿料', accountCode: '1253A02' },
        { id: 'CC008', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH03', costDesc: '拆圖', accountCode: '1253A02' },
        { id: 'CC009', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH04', costDesc: '模具設計', accountCode: '1253A02' },
        { id: 'CC010', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH05', costDesc: '治具設計', accountCode: '1253A02' },
        { id: 'CC011', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH06', costDesc: '強度計算', accountCode: '1253A02' },
        { id: 'CC012', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH07', costDesc: '細部圖繪製', accountCode: '1253A02' },
        { id: 'CC013', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH08', costDesc: '設計+繪圖', accountCode: '1253A02' },
        { id: 'CC014', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH09', costDesc: '設計', accountCode: '1253A02' },
        { id: 'CC015', productCode: 'EB', productName: '建築', attrCode: 'Y', attrName: '專案設計', costCode: 'DEBYDEH10', costDesc: '繪圖', accountCode: '1253A02' },
        // ↓ 額外補幾筆不同產品代碼，純粹為了讓「產品代碼」篩選在展示時看得出效果，
        //   跟業主提供的原始截圖無關，實際資料以後端 20 萬筆為準。
        { id: 'CC016', productCode: 'PR', productName: '反應器', attrCode: 'M', attrName: '專案材料', costCode: 'DPRM00H00', costDesc: '主體鋼板', accountCode: '1251M1' },
        { id: 'CC017', productCode: 'PR', productName: '反應器', attrCode: 'M', attrName: '專案材料', costCode: 'DPRM00H01', costDesc: '法蘭', accountCode: '1251M1' },
        { id: 'CC018', productCode: 'PR', productName: '反應器', attrCode: 'F', attrName: '專案製造', costCode: 'DPRF00H00', costDesc: '焊接工', accountCode: '1251M2' }
    ];

    // 補上建立人／最後更新（展示用固定規則產生，不是真的操作紀錄）
    // ★ TODO(後端整合)：改為後端實際記錄的建立人/更新時間
    const MOCK_CREATORS = ['張育霖', '陳怡君'];
    mockDatabase.forEach((r, i) => {
        r.createdBy = MOCK_CREATORS[i % MOCK_CREATORS.length];
        r.updatedAt = `2025-${String(9 + (i % 4)).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`;
    });

    // ============================================================
    // 2. 模擬「後端查詢 API」
    //    參數/回傳格式照真正 API 應該長的樣子設計，內部實作用 mock 資料+延遲代替
    // ============================================================
    function fetchCostCodes({ keyword, productCode, attrCode, page, pageSize, sortColumn, sortDirection }) {
        return new Promise(resolve => {
            setTimeout(() => {
                const kw = (keyword || '').trim().toLowerCase();
                let result = mockDatabase.filter(r => {
                    const matchKeyword = !kw || r.costCode.toLowerCase().includes(kw) || r.costDesc.toLowerCase().includes(kw);
                    const matchProduct = !productCode || r.productCode === productCode;
                    const matchAttr = !attrCode || r.attrCode === attrCode;
                    return matchKeyword && matchProduct && matchAttr;
                });

                result.sort((a, b) => {
                    const valA = (a[sortColumn] || '').toString().toLowerCase();
                    const valB = (b[sortColumn] || '').toString().toLowerCase();
                    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });

                const total = result.length;
                const start = (page - 1) * pageSize;
                const records = result.slice(start, start + pageSize);

                resolve({ records, total });
            }, 250); // 模擬網路往返時間
        });
    }

    // 產品代碼／成本歸屬代碼是各自獨立的小型代碼表，不是從 20 萬筆明細現撈
    function fetchProductCodeOptions() {
        return new Promise(resolve => {
            setTimeout(() => {
                const map = new Map();
                mockDatabase.forEach(r => { if (!map.has(r.productCode)) map.set(r.productCode, r.productName); });
                resolve([...map.entries()].map(([code, name]) => ({ code, name })));
            }, 120);
        });
    }

    function fetchAttrCodeOptions(productCode) {
        return new Promise(resolve => {
            setTimeout(() => {
                const map = new Map();
                mockDatabase
                    .filter(r => !productCode || r.productCode === productCode)
                    .forEach(r => { if (!map.has(r.attrCode)) map.set(r.attrCode, { name: r.attrName, accountCode: r.accountCode }); });
                resolve([...map.entries()].map(([code, info]) => ({ code, name: info.name, accountCode: info.accountCode })));
            }, 120);
        });
    }

    // ============================================================
    // 3. 模擬新增／更新／刪除 API
    // ============================================================
    // ★ TODO(後端整合)：改為讀取實際登入者資訊，這裡先用固定名稱代替
    function getCurrentUserName() {
        return '張育霖';
    }

    function apiCreate(record) {
        return new Promise(resolve => {
            setTimeout(() => {
                const isDuplicate = mockDatabase.some(r => r.costCode === record.costCode);
                if (isDuplicate) { resolve({ ok: false, message: `成本碼「${record.costCode}」已存在` }); return; }
                const today = new Date().toISOString().slice(0, 10);
                mockDatabase.push({ id: 'CC' + String(Date.now()).slice(-6), ...record, createdBy: getCurrentUserName(), updatedAt: today });
                resolve({ ok: true });
            }, 250);
        });
    }

    function apiUpdate(id, record) {
        return new Promise(resolve => {
            setTimeout(() => {
                const isDuplicate = mockDatabase.some(r => r.costCode === record.costCode && r.id !== id);
                if (isDuplicate) { resolve({ ok: false, message: `成本碼「${record.costCode}」已存在` }); return; }
                const target = mockDatabase.find(r => r.id === id);
                if (!target) { resolve({ ok: false, message: '找不到該筆資料' }); return; }
                Object.assign(target, record, { updatedAt: new Date().toISOString().slice(0, 10) });
                resolve({ ok: true });
            }, 250);
        });
    }

    function apiDelete(id) {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = mockDatabase.findIndex(r => r.id === id);
                if (index === -1) { resolve({ ok: false }); return; }
                mockDatabase.splice(index, 1);
                resolve({ ok: true });
            }, 200);
        });
    }

    // ============================================================
    // 4. 狀態
    // ============================================================
    let state = {
        records: [],       // 目前這一頁的資料（不是全部）
        total: 0,          // 後端回報的符合條件總筆數
        currentPage: 1,
        pageSize: 25,
        filters: { keyword: '', productCode: '', attrCode: '' },
        sort: { column: 'productCode', direction: 'asc' },
        editingId: null,
        isLoading: false
    };

    let editModal = null;
    let searchDebounceTimer = null;

    // ============================================================
    // 5. 初始化
    // ============================================================
    async function init() {
        bindEvents();

        const modalEl = document.getElementById('editModal');
        if (modalEl && window.bootstrap) {
            editModal = new bootstrap.Modal(modalEl);
        }

        await populateProductCodeFilter();
        await populateAttrCodeFilter('');
        await loadPage(1);
    }

    async function populateProductCodeFilter() {
        const el = document.getElementById('filterProductCode');
        if (!el) return;
        const options = await fetchProductCodeOptions();
        el.innerHTML = '<option value="">全部產品</option>' +
            options.map(o => `<option value="${o.code}">${o.code} ${o.name}</option>`).join('');
    }

    async function populateAttrCodeFilter(productCode) {
        const el = document.getElementById('filterAttrCode');
        if (!el) return;
        const options = await fetchAttrCodeOptions(productCode);
        el.innerHTML = '<option value="">全部歸屬</option>' +
            options.map(o => `<option value="${o.code}">${o.code} ${o.name}</option>`).join('');
    }

    // ============================================================
    // 6. 查詢流程：所有互動最後都收斂到 loadPage()，統一呼叫「後端」
    // ============================================================
    async function loadPage(page) {
        state.currentPage = page;
        setLoading(true);

        const { records, total } = await fetchCostCodes({
            keyword: state.filters.keyword,
            productCode: state.filters.productCode,
            attrCode: state.filters.attrCode,
            page: state.currentPage,
            pageSize: state.pageSize,
            sortColumn: state.sort.column,
            sortDirection: state.sort.direction
        });

        state.records = records;
        state.total = total;
        setLoading(false);
        renderTable();
        renderPagination();
    }

    function setLoading(isLoading) {
        state.isLoading = isLoading;
        const loadingMsg = document.getElementById('loadingMessage');
        const tableWrap = document.querySelector('.table-responsive');
        if (loadingMsg) loadingMsg.style.display = isLoading ? 'block' : 'none';
        if (tableWrap) tableWrap.style.display = isLoading ? 'none' : '';
    }

    function sortData(column) {
        if (state.isLoading) return;
        if (state.sort.column === column) {
            state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.sort.column = column;
            state.sort.direction = 'asc';
        }
        updateSortIcons();
        loadPage(1);
    }

    function updateSortIcons() {
        document.querySelectorAll('.ccs-table th i.fas').forEach(icon => {
            if (icon.id && icon.id.startsWith('icon-')) icon.className = 'fas fa-sort';
        });
        document.querySelectorAll('.ccs-table th').forEach(th => th.classList.remove('active-sort'));
        const activeIcon = document.getElementById(`icon-${state.sort.column}`);
        if (activeIcon) {
            activeIcon.className = state.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            if (activeIcon.parentElement) activeIcon.parentElement.classList.add('active-sort');
        }
    }

    // ============================================================
    // 7. 事件綁定
    // ============================================================
    function bindEvents() {
        // 關鍵字輸入用 debounce：20 萬筆資料不能每打一個字就觸發一次查詢
        const searchInput = document.getElementById('searchKeyword');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const value = this.value;
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    state.filters.keyword = value;
                    loadPage(1);
                }, 400);
            });
        }

        const productCodeSelect = document.getElementById('filterProductCode');
        if (productCodeSelect) {
            productCodeSelect.addEventListener('change', async function() {
                state.filters.productCode = this.value;
                state.filters.attrCode = '';
                await populateAttrCodeFilter(this.value);
                document.getElementById('filterAttrCode').value = '';
                loadPage(1);
            });
        }

        const attrCodeSelect = document.getElementById('filterAttrCode');
        if (attrCodeSelect) {
            attrCodeSelect.addEventListener('change', function() {
                state.filters.attrCode = this.value;
                loadPage(1);
            });
        }

        const clearBtn = document.getElementById('clearFilterBtn');
        if (clearBtn) clearBtn.addEventListener('click', clearFilters);

        const addBtn = document.getElementById('addBtn');
        if (addBtn) addBtn.addEventListener('click', () => openEditModal(null));

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.addEventListener('click', saveRecord);

        // 表單裡輸入產品代碼／成本歸屬代碼時，比對目前已載入的代碼表自動帶出名稱
        const formProductCode = document.getElementById('formProductCode');
        if (formProductCode) {
            formProductCode.addEventListener('change', async function() {
                const options = await fetchProductCodeOptions();
                const found = options.find(o => o.code === this.value);
                if (found) document.getElementById('formProductName').value = found.name;
                await populateFormAttrDatalist(this.value);
            });
        }

        const formAttrCode = document.getElementById('formAttrCode');
        if (formAttrCode) {
            formAttrCode.addEventListener('change', async function() {
                const productCode = document.getElementById('formProductCode').value;
                const options = await fetchAttrCodeOptions(productCode);
                const found = options.find(o => o.code === this.value);
                if (found) {
                    document.getElementById('formAttrName').value = found.name;
                    document.getElementById('formAccountCode').value = found.accountCode;
                }
            });
        }
    }

    async function populateFormProductDatalist() {
        const options = await fetchProductCodeOptions();
        document.getElementById('productCodeOptions').innerHTML =
            options.map(o => `<option value="${o.code}">${o.code} ${o.name}</option>`).join('');
    }

    async function populateFormAttrDatalist(productCode) {
        const options = await fetchAttrCodeOptions(productCode);
        document.getElementById('attrCodeOptions').innerHTML =
            options.map(o => `<option value="${o.code}"></option>`).join('');
    }

    function clearFilters() {
        state.filters = { keyword: '', productCode: '', attrCode: '' };
        document.getElementById('searchKeyword').value = '';
        document.getElementById('filterProductCode').value = '';
        populateAttrCodeFilter('');
        document.getElementById('filterAttrCode').value = '';
        loadPage(1);
    }

    // ============================================================
    // 8. 渲染（只渲染「這一頁」，不做任何篩選/排序運算）
    // ============================================================
    function renderTable() {
        const tbody = document.getElementById('ccsTableBody');
        const noDataMsg = document.getElementById('noDataMessage');
        const totalRecordsEl = document.getElementById('totalRecords');
        const paginationSection = document.getElementById('paginationSection');
        if (!tbody) return;

        if (totalRecordsEl) totalRecordsEl.textContent = state.total;

        if (state.records.length === 0) {
            tbody.innerHTML = '';
            if (noDataMsg) noDataMsg.style.display = 'block';
            if (paginationSection) paginationSection.style.display = 'none';
            return;
        }
        if (noDataMsg) noDataMsg.style.display = 'none';
        if (paginationSection) paginationSection.style.display = 'block';

        tbody.innerHTML = state.records.map(r => `
            <tr>
                <td><span class="pcode-badge">${r.productCode}</span></td>
                <td>${r.productName}</td>
                <td><span class="attr-badge">${r.attrCode}</span></td>
                <td>${r.attrName}</td>
                <td><span class="costcode-badge">${r.costCode}</span></td>
                <td>${r.costDesc}</td>
                <td>${r.accountCode}</td>
                <td>${r.createdBy || '-'}</td>
                <td>${r.updatedAt || '-'}</td>
                <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-outline-primary" title="編輯" onclick="CostCodeSettings.editRecord('${r.id}')">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="刪除" onclick="CostCodeSettings.deleteRecord('${r.id}')">
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

        if (state.total === 0) {
            paginationEl.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(state.total / state.pageSize);
        let html = `
            <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); CostCodeSettings.goToPage(${state.currentPage - 1})">上一頁</a>
            </li>
        `;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                html += `
                    <li class="page-item ${i === state.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); CostCodeSettings.goToPage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        html += `
            <li class="page-item ${state.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); CostCodeSettings.goToPage(${state.currentPage + 1})">下一頁</a>
            </li>
        `;
        paginationEl.innerHTML = html;
    }

    // ============================================================
    // 9. 新增／編輯／刪除：動作完成後一律重新查詢當前頁，不在前端手動塞資料
    //    （因為前端手上的 state.records 只是「這一頁」，不是完整資料源）
    // ============================================================
    async function openEditModal(id) {
        state.editingId = id;
        let record = null;
        if (id) {
            // 編輯時，該筆資料理論上就在目前這一頁的 state.records 裡（使用者從表格點編輯進來的）
            record = state.records.find(r => r.id === id);
        }

        document.getElementById('editModalTitle').textContent = record ? '編輯成本碼' : '新增成本碼';
        document.getElementById('formProductCode').value = record ? record.productCode : '';
        document.getElementById('formProductName').value = record ? record.productName : '';
        document.getElementById('formAttrCode').value = record ? record.attrCode : '';
        document.getElementById('formAttrName').value = record ? record.attrName : '';
        document.getElementById('formAccountCode').value = record ? record.accountCode : '';
        document.getElementById('formCostCode').value = record ? record.costCode : '';
        document.getElementById('formCostDesc').value = record ? record.costDesc : '';

        await populateFormProductDatalist();
        await populateFormAttrDatalist(record ? record.productCode : '');
        if (editModal) editModal.show();
    }

    function editRecord(id) {
        openEditModal(id);
    }

    async function saveRecord() {
        const productCode = document.getElementById('formProductCode').value.trim();
        const productName = document.getElementById('formProductName').value.trim();
        const attrCode = document.getElementById('formAttrCode').value.trim();
        const attrName = document.getElementById('formAttrName').value.trim();
        const accountCode = document.getElementById('formAccountCode').value.trim();
        const costCode = document.getElementById('formCostCode').value.trim();
        const costDesc = document.getElementById('formCostDesc').value.trim();

        if (!productCode || !productName || !attrCode || !attrName || !accountCode || !costCode || !costDesc) {
            LiangLianSystem.showToast('請完整填寫所有必填欄位', 'warning');
            return;
        }

        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = true;

        const payload = { productCode, productName, attrCode, attrName, accountCode, costCode, costDesc };
        const result = state.editingId ? await apiUpdate(state.editingId, payload) : await apiCreate(payload);

        saveBtn.disabled = false;

        if (!result.ok) {
            LiangLianSystem.showToast(result.message || '儲存失敗，請稍後再試', 'warning');
            return;
        }

        LiangLianSystem.showToast(state.editingId ? '成本碼已更新' : '成本碼已新增', 'success');
        if (editModal) editModal.hide();

        await populateProductCodeFilter();
        await populateAttrCodeFilter(state.filters.productCode);
        await loadPage(state.editingId ? state.currentPage : 1);
    }

    async function deleteRecord(id) {
        const record = state.records.find(r => r.id === id);
        if (!record) return;

        if (!confirm(`確定要刪除成本碼「${record.costCode}（${record.costDesc}）」嗎？此動作無法復原。`)) return;

        const result = await apiDelete(id);
        if (!result.ok) {
            LiangLianSystem.showToast('刪除失敗，請稍後再試', 'warning');
            return;
        }

        LiangLianSystem.showToast('成本碼已刪除', 'success');
        await populateProductCodeFilter();
        await populateAttrCodeFilter(state.filters.productCode);

        // 如果刪掉的是這一頁最後一筆，且不是第一頁，往前翻一頁避免停在空頁面
        const remainingOnPage = state.records.length - 1;
        const targetPage = (remainingOnPage === 0 && state.currentPage > 1) ? state.currentPage - 1 : state.currentPage;
        await loadPage(targetPage);
    }

    // ============================================================
    // 10. 公開方法
    // ============================================================
    return {
        init: init,
        sortData: sortData,
        editRecord: editRecord,
        deleteRecord: deleteRecord,
        goToPage: function(page) {
            if (state.isLoading) return;
            const totalPages = Math.ceil(state.total / state.pageSize);
            if (page < 1 || page > totalPages) return;
            loadPage(page);
        },
        changePageSize: function(size) {
            state.pageSize = parseInt(size);
            loadPage(1);
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    CostCodeSettings.init();
});