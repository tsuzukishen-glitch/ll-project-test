// 薪資差旅設定
// ★ 設計調整說明：
//   原始後端資料是「角色key值」+「角色中文名稱」+「地區」三層對照，但角色key值
//   （site_manager/manager/supervisor...）是後端資料庫自己的識別方式，業主不會知道
//   要怎麼建立、也不需要知道。這裡把它拿掉，前端只留業主看得懂、會操作的東西：
//   角色中文名稱（主要識別）、基本薪資（月薪/社會保險/二次成本/時薪，不分地區）、
//   以及這個角色在各地區的差旅津貼（工地加班費/差旅工作津貼/伙食津貼/住宿津貼）。
//   新增一個角色 = 一次填完基本薪資＋各地區津貼，符合實際建立角色的操作情境。
// ★ TODO(後端整合)：若後端其他系統（例如原本的 HR 匯入來源）仍需要用角色key值
//   互相對應，這個轉換應該在後端做（例如用角色中文名稱或這裡的角色 id 去對應），
//   不應該讓前端使用者自己輸入 key 值。
const SalaryTravelSettings = (function() {
    'use strict';

    // ★ 地區清單是共用主檔，所有角色共用同一份，不是每個角色各自維護一份地區清單
    let masterRegions = ['北部', '中部', '南部', '高雄同一區域'];

    function blankRegionRow(region) {
        return { region: region || '', overtime: null, travelAllowance: null, mealAllowance: null, lodgingAllowance: null };
    }

    // ============================================================
    // 1. 模擬資料 (Mock Data)
    // ★ 照業主提供的截圖轉換：原本「角色key值」相同的職稱（例如正課長/主任/副課長/資深
    //   都對應 supervisor），這裡拆成各自獨立的角色，各自帶一份完整的薪資與地區津貼設定
    // ★ TODO(後端整合)：改為呼叫後端 API 取得角色清單，欄位結構不變
    // ============================================================

    // ★ const 有暫時性死區(TDZ)，必須放在 roles 陣列（下面會立刻呼叫 makeRole）之前，
    //   不然會出現「Cannot access before initialization」的錯誤
    const MOCK_CREATORS = ['張育霖', '陳怡君'];

    let roles = [
        makeRole('R01', '專案經理', 'Site Manager', 90000, 18900, 15300, 375),
        makeRole('R02', '總管理師', 'Manager', 90000, 18900, 15300, 375),
        makeRole('R03', '總工程師', 'Manager', 90000, 18900, 15300, 375),
        makeRole('R04', '工地副理', 'Deputy Manager', 75000, 15750, 12750, 313),
        makeRole('R05', '工地主任', 'Deputy Manager', 75000, 15750, 12750, 313),
        makeRole('R06', '監工', 'Site Supervisor', 65000, 13650, 11050, 271),
        makeRole('R07', '品保', 'Site Supervisor', 65000, 13650, 11050, 271),
        makeRole('R08', '正課長', 'Supervisor', 65000, 13650, 11050, 271),
        makeRole('R09', '主任', 'Supervisor', 65000, 13650, 11050, 271),
        makeRole('R10', '副課長', 'Supervisor', 65000, 13650, 11050, 271),
        makeRole('R11', '資深', 'Supervisor', 65000, 13650, 11050, 271),
        makeRole('R12', '助理', 'Engineer', 60000, 12600, 10200, 250),
        makeRole('R13', '高級', 'Engineer', 60000, 12600, 10200, 250),
        makeRole('R14', '正組長', 'Engineer', 60000, 12600, 10200, 250),
        makeRole('R15', '副組長', 'Engineer', 60000, 12600, 10200, 250),
        makeRole('R16', '中級', 'Engineer', 60000, 12600, 10200, 250),
        makeRole('R17', '工安', 'HSE', 50000, 10500, 8500, 208),
        makeRole('R18', '初級', 'HSE', 50000, 10500, 8500, 208),
        makeRole('R19', '助理', 'HSE', 50000, 10500, 8500, 208),
        makeRole('R20', '事務', 'HSE', 50000, 10500, 8500, 208)
    ];

    function makeRole(id, roleName, roleNameEn, monthlySalary, insurance, secondCost, hourly) {
        const idx = parseInt(id.replace(/\D/g, ''), 10) || 0;
        return {
            id, roleName, roleNameEn, monthlySalary, insurance, secondCost, hourly,
            createdBy: MOCK_CREATORS[idx % MOCK_CREATORS.length],
            updatedAt: `2025-${String(9 + (idx % 4)).padStart(2, '0')}-${String((idx % 27) + 1).padStart(2, '0')}`,
            regionRates: [
                { region: '北部', overtime: null, travelAllowance: 15000, mealAllowance: 9900, lodgingAllowance: 8000 },
                { region: '中部', overtime: null, travelAllowance: 12000, mealAllowance: 8100, lodgingAllowance: 7000 },
                { region: '南部', overtime: null, travelAllowance: 9000, mealAllowance: 8100, lodgingAllowance: 6500 },
                { region: '高雄同一區域', overtime: null, travelAllowance: 4500, mealAllowance: 8100, lodgingAllowance: null }
            ]
        };
    }

    // ============================================================
    // 2. 狀態
    // ============================================================
    let state = {
        filtered: [],
        currentPage: 1,
        pageSize: 10,
        filters: { keyword: '', roleNameEn: '' },
        sort: { column: 'roleName', direction: 'asc' },
        editingId: null
    };

    let roleModal = null;
    let regionModal = null;

    function formatNum(n) {
        if (n === null || n === undefined || n === '') return '-';
        return new Intl.NumberFormat('zh-TW').format(n);
    }

    // ★ TODO(後端整合)：改為讀取實際登入者資訊，這裡先用固定名稱代替
    function getCurrentUserName() {
        return '張育霖';
    }

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        populateRoleNameEnFilter();
        bindEvents();
        applyFilters();

        const modalEl = document.getElementById('roleEditModal');
        if (modalEl && window.bootstrap) roleModal = new bootstrap.Modal(modalEl);

        const regionModalEl = document.getElementById('regionManageModal');
        if (regionModalEl && window.bootstrap) regionModal = new bootstrap.Modal(regionModalEl);
    }

    // 角色英文名稱是選填欄位，選項只列出目前實際存在、且不為空的值
    function populateRoleNameEnFilter() {
        const el = document.getElementById('searchRoleNameEn');
        if (!el) return;
        const current = el.value;
        const names = [...new Set(roles.map(r => r.roleNameEn).filter(Boolean))].sort();
        el.innerHTML = '<option value="">全部英文名稱</option>' +
            names.map(n => `<option value="${n}">${n}</option>`).join('');
        if (names.includes(current)) el.value = current;
    }

    function bindEvents() {
        document.getElementById('searchKeyword').addEventListener('input', function() {
            state.filters.keyword = this.value;
            state.currentPage = 1;
            applyFilters();
        });
        document.getElementById('searchRoleNameEn').addEventListener('change', function() {
            state.filters.roleNameEn = this.value;
            state.currentPage = 1;
            applyFilters();
        });
        document.getElementById('clearFilterBtn').addEventListener('click', function() {
            state.filters = { keyword: '', roleNameEn: '' };
            document.getElementById('searchKeyword').value = '';
            document.getElementById('searchRoleNameEn').value = '';
            state.currentPage = 1;
            applyFilters();
        });
        document.getElementById('addRoleBtn').addEventListener('click', () => openRoleModal(null));
        document.getElementById('saveRoleBtn').addEventListener('click', saveRole);

        document.getElementById('manageRegionsBtn').addEventListener('click', openRegionManageModal);
        document.getElementById('addRegionBtn').addEventListener('click', addMasterRegion);
    }

    // ============================================================
    // 4. 篩選、排序、渲染（角色清單）
    // ============================================================
    function applyFilters() {
        const kw = state.filters.keyword.trim().toLowerCase();
        const selectedRoleNameEn = state.filters.roleNameEn;
        let result = roles.filter(r => {
            const matchKeyword = !kw || r.roleName.toLowerCase().includes(kw);
            const matchRoleNameEn = !selectedRoleNameEn || r.roleNameEn === selectedRoleNameEn;
            return matchKeyword && matchRoleNameEn;
        });

        const { column, direction } = state.sort;
        result.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];
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
        document.querySelectorAll('.sts-table th i.fas').forEach(icon => {
            if (icon.id && icon.id.startsWith('icon-')) icon.className = 'fas fa-sort';
        });
        const activeIcon = document.getElementById(`icon-${state.sort.column}`);
        if (activeIcon) activeIcon.className = state.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }

    function renderTable() {
        const tbody = document.getElementById('roleTableBody');
        const noDataMsg = document.getElementById('noDataMessage');
        const paginationSection = document.getElementById('paginationSection');
        document.getElementById('totalRecords').textContent = state.filtered.length;

        if (state.filtered.length === 0) {
            tbody.innerHTML = '';
            noDataMsg.style.display = 'block';
            paginationSection.style.display = 'none';
            return;
        }
        noDataMsg.style.display = 'none';
        paginationSection.style.display = 'block';

        const start = (state.currentPage - 1) * state.pageSize;
        const pageData = state.filtered.slice(start, start + state.pageSize);

        tbody.innerHTML = pageData.map(r => `
            <tr>
                <td class="fw-bold">${r.roleName}</td>
                <td>${r.roleNameEn || '-'}</td>
                <td class="text-end">${formatNum(r.monthlySalary)}</td>
                <td class="text-end">${formatNum(r.insurance)}</td>
                <td class="text-end">${formatNum(r.secondCost)}</td>
                <td class="text-end">${formatNum(r.hourly)}</td>
                <td class="text-center">${r.regionRates.length}</td>
                <td>${r.createdBy || '-'}</td>
                <td>${r.updatedAt || '-'}</td>
                <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-outline-primary" title="編輯" onclick="SalaryTravelSettings.editRole('${r.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" title="刪除" onclick="SalaryTravelSettings.deleteRole('${r.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (state.filtered.length === 0) { paginationEl.innerHTML = ''; return; }

        const totalPages = Math.ceil(state.filtered.length / state.pageSize);
        let html = `<li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); SalaryTravelSettings.goToPage(${state.currentPage - 1})">上一頁</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                html += `<li class="page-item ${i === state.currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); SalaryTravelSettings.goToPage(${i})">${i}</a></li>`;
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        html += `<li class="page-item ${state.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); SalaryTravelSettings.goToPage(${state.currentPage + 1})">下一頁</a></li>`;
        paginationEl.innerHTML = html;
    }

    // ============================================================
    // 5. 地區津貼子表格（Modal 內）
    // ★ 地區欄位改成唯讀顯示，列的數量與順序永遠對齊 masterRegions，
    //   不再讓使用者自己新增/刪除/改名地區——地區清單只能透過「管理地區清單」維護
    // ============================================================
    let currentRegionRows = [];

    function renderRegionRows() {
        const tbody = document.getElementById('regionRowsBody');
        tbody.innerHTML = currentRegionRows.map((row, index) => `
            <tr>
                <td class="fw-bold">${row.region}</td>
                <td><input type="number" class="form-control form-control-sm text-end" value="${row.overtime === null || row.overtime === undefined ? '' : row.overtime}" data-index="${index}" data-field="overtime" placeholder=""></td>
                <td><input type="number" class="form-control form-control-sm text-end" value="${row.travelAllowance === null || row.travelAllowance === undefined ? '' : row.travelAllowance}" data-index="${index}" data-field="travelAllowance" placeholder=""></td>
                <td><input type="number" class="form-control form-control-sm text-end" value="${row.mealAllowance === null || row.mealAllowance === undefined ? '' : row.mealAllowance}" data-index="${index}" data-field="mealAllowance" placeholder=""></td>
                <td><input type="number" class="form-control form-control-sm text-end" value="${row.lodgingAllowance === null || row.lodgingAllowance === undefined ? '' : row.lodgingAllowance}" data-index="${index}" data-field="lodgingAllowance" placeholder=""></td>
            </tr>
        `).join('');

        // 綁定輸入變更（用事件代理避免每次重繪都要重新綁定）
        tbody.oninput = function(e) {
            const target = e.target;
            const index = target.getAttribute('data-index');
            const field = target.getAttribute('data-field');
            if (index === null || !field) return;
            const value = target.value === '' ? null : parseFloat(target.value);
            currentRegionRows[index][field] = value;
        };
    }

    // 依 masterRegions 的順序組出這個角色的地區列，該角色若還沒有這個地區的資料就給空白列
    function buildRegionRowsFor(record) {
        const existingByRegion = {};
        if (record) {
            record.regionRates.forEach(r => { existingByRegion[r.region] = r; });
        }
        return masterRegions.map(region => existingByRegion[region] || blankRegionRow(region));
    }

    // ============================================================
    // 5B. 管理地區清單（共用主檔，影響所有角色）
    // ★ TODO(後端整合)：改為呼叫後端 API 新增/刪除地區主檔
    // ============================================================
    function openRegionManageModal() {
        renderRegionList();
        document.getElementById('newRegionName').value = '';
        if (regionModal) regionModal.show();
    }

    function renderRegionList() {
        const listEl = document.getElementById('regionListBody');
        listEl.innerHTML = masterRegions.map(region => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${region}
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="SalaryTravelSettings.removeMasterRegion('${region}')" title="移除地區">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');
    }

    function addMasterRegion() {
        const input = document.getElementById('newRegionName');
        const name = input.value.trim();
        if (!name) {
            LiangLianSystem.showToast('請輸入地區名稱', 'warning');
            return;
        }
        if (masterRegions.includes(name)) {
            LiangLianSystem.showToast(`地區「${name}」已經存在`, 'warning');
            return;
        }

        masterRegions.push(name);
        // 所有角色都補上這個新地區的空白列，維持每個角色的地區列表跟主清單一致
        roles.forEach(r => r.regionRates.push(blankRegionRow(name)));

        input.value = '';
        renderRegionList();
        applyFilters();
        LiangLianSystem.showToast(`已新增地區「${name}」`, 'success');
    }

    function removeMasterRegion(region) {
        if (!confirm(`確定要移除地區「${region}」嗎？所有角色裡這個地區的津貼設定會一併刪除，此動作無法復原。`)) return;

        masterRegions = masterRegions.filter(r => r !== region);
        roles.forEach(r => { r.regionRates = r.regionRates.filter(rr => rr.region !== region); });

        renderRegionList();
        applyFilters();
        LiangLianSystem.showToast(`已移除地區「${region}」`, 'success');
    }

    // ============================================================
    // 6. 新增／編輯／刪除角色
    // ★ TODO(後端整合)：改為呼叫後端 API 新增/更新/刪除
    // ============================================================
    function openRoleModal(id) {
        state.editingId = id;
        const record = id ? roles.find(r => r.id === id) : null;

        document.getElementById('roleEditModalTitle').textContent = record ? '編輯角色' : '新增角色';
        document.getElementById('formRoleName').value = record ? record.roleName : '';
        document.getElementById('formRoleNameEn').value = record ? (record.roleNameEn || '') : '';
        document.getElementById('formMonthlySalary').value = record ? record.monthlySalary : '';
        document.getElementById('formInsurance').value = record && record.insurance !== null ? record.insurance : '';
        document.getElementById('formSecondCost').value = record && record.secondCost !== null ? record.secondCost : '';
        document.getElementById('formHourly').value = record && record.hourly !== null ? record.hourly : '';

        currentRegionRows = buildRegionRowsFor(record);
        renderRegionRows();

        if (roleModal) roleModal.show();
    }

    function editRole(id) { openRoleModal(id); }

    function saveRole() {
        const roleName = document.getElementById('formRoleName').value.trim();
        const roleNameEn = document.getElementById('formRoleNameEn').value.trim();
        const monthlySalary = document.getElementById('formMonthlySalary').value;
        const insurance = document.getElementById('formInsurance').value;
        const secondCost = document.getElementById('formSecondCost').value;
        const hourly = document.getElementById('formHourly').value;

        if (!roleName || monthlySalary === '') {
            LiangLianSystem.showToast('請至少填寫角色中文名稱與月薪', 'warning');
            return;
        }

        const payload = {
            roleName, roleNameEn,
            monthlySalary: parseFloat(monthlySalary),
            insurance: insurance === '' ? null : parseFloat(insurance),
            secondCost: secondCost === '' ? null : parseFloat(secondCost),
            hourly: hourly === '' ? null : parseFloat(hourly),
            regionRates: currentRegionRows.map(r => ({
                region: r.region,
                overtime: r.overtime,
                travelAllowance: r.travelAllowance,
                mealAllowance: r.mealAllowance,
                lodgingAllowance: r.lodgingAllowance
            }))
        };

        if (state.editingId) {
            const record = roles.find(r => r.id === state.editingId);
            Object.assign(record, payload, { updatedAt: new Date().toISOString().slice(0, 10) });
            LiangLianSystem.showToast('角色已更新', 'success');
        } else {
            roles.push({
                id: 'R' + String(Date.now()).slice(-6),
                ...payload,
                createdBy: getCurrentUserName(),
                updatedAt: new Date().toISOString().slice(0, 10)
            });
            LiangLianSystem.showToast('角色已新增', 'success');
        }

        if (roleModal) roleModal.hide();
        populateRoleNameEnFilter();
        applyFilters();
    }

    function deleteRole(id) {
        const record = roles.find(r => r.id === id);
        if (!record) return;
        if (!confirm(`確定要刪除角色「${record.roleName}」嗎？此動作無法復原。`)) return;

        roles = roles.filter(r => r.id !== id);
        populateRoleNameEnFilter();
        applyFilters();
        LiangLianSystem.showToast('角色已刪除', 'success');
    }

    // ============================================================
    // 7. 公開方法
    // ============================================================
    return {
        init: init,
        sortData: sortData,
        editRole: editRole,
        deleteRole: deleteRole,
        removeMasterRegion: removeMasterRegion,
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
    SalaryTravelSettings.init();
});