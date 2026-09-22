// 專案列表功能模組
const ProjectList = (function() {
    'use strict';

    // 1. 模擬資料 (Mock Data)
    // ★ 更新：同步 dashboard.js 的完整資料 (含 projectNo 與未來日期)
    const mockProjects = [
        {
            id: 'EQ25090001',
            projectNo: '',
            quotationId: 'LME-11210-PE060',
            name: '台積電12廠潔淨室建置工程',
            owner: '台灣積體電路',
            customer: '互助營造',
            bidDate: '2025-11-15', // 未來日期
            status: 'bidding', 
            progress: 25,
            urgent: true,
            description: '建置12英吋圓晶潔淨室系統，包含空調系統、製程氣體供應系統、化學品供應系統及相關配套設施。'
        },
        {
            id: 'EQ25090002',
            projectNo: '',
            quotationId: 'LME-11210-PD201',
            name: '聯電8廠產線自動化升級工程',
            owner: '聯華電子',
            customer: '聯電竹科廠',
            bidDate: '2025-12-20', // 未來日期
            status: 'bidding',
            progress: 65,
            urgent: false,
            description: '針對8廠既有產線進行自動化搬運系統升級，包含OHT軌道延伸與儲位擴充，需配合歲修期間施工。'
        },
        {
            id: 'EQ25090003',
            projectNo: 'P2509001',
            quotationId: 'LME-11210-PC020',
            name: '鴻海土城廠智慧工廠MES系統',
            owner: '鴻海精密',
            customer: '鴻海土城廠',
            bidDate: '2025-09-10', // 過去 (已得標)
            status: 'awarded',
            progress: 100,
            urgent: false,
            description: '導入工業4.0智慧製造系統，整合現場設備數據與MES系統，實現生產可視化與即時監控。'
        },
        {
            id: 'EQ25090004',
            projectNo: '',
            quotationId: 'LME-11210-EI060',
            name: '廣達龜山廠伺服器機房冷卻系統',
            owner: '廣達電腦',
            customer: '廣達龜山廠',
            bidDate: '2026-01-25', // 未來日期
            status: 'draft',
            progress: 10,
            urgent: false,
            description: '新建AI伺服器機房之液冷散熱系統規劃與建置，包含冷卻水塔、冰水主機及管路配置。'
        },
        {
            id: 'EQ25090005',
            projectNo: 'P2509002',
            quotationId: 'LME-11210-ZZ099',
            name: '中鋼高雄廠煉鋼爐設備維護保養',
            owner: '中國鋼鐵',
            customer: '中鋼高雄廠',
            bidDate: '2025-08-05', // 過去 (已歸檔)
            status: 'archived',
            progress: 100,
            urgent: false,
            description: '年度煉鋼爐耐火材料更換與設備檢修工程，需在停爐期間內完成所有維護作業。'
        },
        {
            id: 'EQ25090006',
            projectNo: '',
            quotationId: 'LME-11211-AA001',
            name: '日月光K7廠廢水處理擴建工程',
            owner: '日月光投控',
            customer: '日月光高雄廠',
            bidDate: '2025-10-30', // 近期未來
            status: 'bidding',
            progress: 40,
            urgent: true,
            description: '擴建K7廠工業廢水回收處理系統，提升水資源回收率至85%，包含UF/RO系統增設。'
        },
        {
            id: 'EQ25090007',
            projectNo: '',
            quotationId: 'LME-11211-BB002',
            name: '友達光電L8B廠房空調系統更新',
            owner: '友達光電',
            customer: '友達台中廠',
            bidDate: '2026-02-15', // 未來日期
            status: 'draft',
            progress: 5,
            urgent: false,
            description: '既有廠房MAU與FFU系統效能提升與老舊設備汰換，需進行潔淨度模擬與氣流分析。'
        },
        {
            id: 'EQ25090008',
            projectNo: '',
            quotationId: 'LME-11211-CC003',
            name: '南亞科3A廠無塵室隔間工程',
            owner: '南亞科技',
            customer: '南亞科林口廠',
            bidDate: '2025-11-10', // 未來日期
            status: 'bidding',
            progress: 30,
            urgent: false,
            description: '3A廠新製程區無塵室隔間牆與天花板系統建置，包含抗靜電地板鋪設與氣密測試。'
        },
        {
            id: 'EQ25090009',
            projectNo: 'P2510001',
            quotationId: 'LME-11211-DD004',
            name: '華邦電高雄廠特氣供應系統',
            owner: '華邦電子',
            customer: '華邦電高雄廠',
            bidDate: '2025-10-15', // 過去 (已得標)
            status: 'awarded',
            progress: 100,
            urgent: true,
            description: '特殊氣體供應系統(ESG)擴充工程，包含氣體櫃(GC)、閥箱(VMB)安裝及雙套管路配置。'
        },
        {
            id: 'EQ25090010',
            projectNo: 'P2510002',
            quotationId: 'LME-11211-EE005',
            name: '力積電P1/P2廠電力系統改善',
            owner: '力積電',
            customer: '力積電竹科廠',
            bidDate: '2025-10-20', // 過去 (已歸檔)
            status: 'archived',
            progress: 100,
            urgent: false,
            description: '廠區高低壓配電盤更新與不斷電系統(UPS)容量擴充，提升供電穩定度。'
        },
        {
            id: 'EQ25090011',
            projectNo: '',
            quotationId: 'LME-11211-FF006',
            name: '世界先進二廠純水系統維護',
            owner: '世界先進',
            customer: '世界先進新竹廠',
            bidDate: '2025-12-05', // 未來日期
            status: 'bidding',
            progress: 55,
            urgent: false,
            description: '純水系統離子交換樹脂再生與耗材更換，以及水質監測儀表校正維護。'
        },
        {
            id: 'EQ25090012',
            projectNo: '',
            quotationId: 'LME-11211-GG007',
            name: '群創光電D廠自動倉儲系統',
            owner: '群創光電',
            customer: '群創台南廠',
            bidDate: '2026-03-01', // 未來日期
            status: 'draft',
            progress: 0,
            urgent: false,
            description: '新建自動化立體倉儲系統(AS/RS)，包含堆垛機安裝、輸送帶系統及WMS倉儲管理軟體整合。'
        }
    ];

    // 2. 狀態管理
    let state = {
        projects: [],          
        filteredProjects: [],  
        currentPage: 1,        
        pageSize: 10,          
        filters: {             
            keyword: '',       
            status: '',
            startDate: '', 
            endDate: ''    
        },
        sort: {
            column: '',
            direction: 'asc'
        }
    };

    // 3. 初始化
    function init() {
        state.projects = [...mockProjects];
        state.filteredProjects = [...mockProjects];
        
        initFlatpickr(); // 初始化日期選擇器
        bindEvents();
        updateStatistics();
        renderTable();
        renderPagination();
        
        console.log('專案列表初始化完成');
    }

    // 初始化 Flatpickr
    function initFlatpickr() {
        if (typeof flatpickr !== 'undefined') {
            flatpickr(".flatpickr-date", {
                locale: "zh_tw",
                dateFormat: "Y-m-d",
                allowInput: true,
                onChange: function(selectedDates, dateStr, instance) {
                    handleFilterChange(instance.element.id, dateStr);
                }
            });
        }
    }

    // 4. 事件綁定
    function bindEvents() {
        const searchInput = document.getElementById('searchKeyword');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => handleFilterChange('keyword', e.target.value));
        }

        const statusSelect = document.getElementById('filterStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => handleFilterChange('status', e.target.value));
        }

        // 清空按鈕
        const clearBtn = document.getElementById('clearFilterBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearFilters);
        }
    }

    // 清空篩選功能
    function clearFilters() {
        const ids = ['searchKeyword', 'filterStatus', 'startDate', 'endDate'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                if (el._flatpickr) {
                    el._flatpickr.clear();
                }
            }
        });

        state.filters = { keyword: '', status: '', startDate: '', endDate: '' };
        state.currentPage = 1;
        state.sort = { column: '', direction: 'asc' };

        applyFilters();
        updateSortIcons();
        LiangLianSystem.showToast('已清空所有篩選與排序條件', 'success');
    }

    // 處理篩選變更
    function handleFilterChange(key, value) {
        state.filters[key] = value.trim();
        state.currentPage = 1;
        applyFilters();
    }

    // 應用篩選邏輯
    function applyFilters() {
        let result = state.projects.filter(project => {
            const keyword = state.filters.keyword.toLowerCase();
            const matchKeyword = keyword === '' || 
                project.id.toLowerCase().includes(keyword) ||
                (project.projectNo && project.projectNo.toLowerCase().includes(keyword)) || // 搜尋 projectNo
                project.quotationId.toLowerCase().includes(keyword) ||
                project.name.toLowerCase().includes(keyword) ||
                project.customer.toLowerCase().includes(keyword) ||
                project.owner.toLowerCase().includes(keyword);

            const matchStatus = state.filters.status === '' || project.status === state.filters.status;

            let matchDate = true;
            const projDateStr = project.bidDate;
            
            if (!projDateStr && (state.filters.startDate || state.filters.endDate)) {
                matchDate = false;
            } else if (projDateStr) {
                if (state.filters.startDate && projDateStr < state.filters.startDate) {
                    matchDate = false;
                }
                if (state.filters.endDate && projDateStr > state.filters.endDate) {
                    matchDate = false;
                }
            }

            return matchKeyword && matchStatus && matchDate;
        });

        if (state.sort.column) {
            const { column, direction } = state.sort;
            result.sort((a, b) => {
                let valA = a[column];
                let valB = b[column];

                if (valA === undefined || valA === null) valA = '';
                if (valB === undefined || valB === null) valB = '';

                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
                
                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        state.filteredProjects = result;
        renderTable();
        renderPagination();
    }

    // 排序功能
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

    // 更新排序圖示
    function updateSortIcons() {
        const allIcons = document.querySelectorAll('.project-table th i');
        const allThs = document.querySelectorAll('.project-table th');
        
        allIcons.forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        allThs.forEach(th => {
            th.classList.remove('active-sort');
        });

        if (state.sort.column) {
            const activeIcon = document.getElementById(`icon-${state.sort.column}`);
            const activeTh = activeIcon ? activeIcon.parentElement : null;

            if (activeIcon) {
                activeIcon.className = state.sort.direction === 'asc' 
                    ? 'fas fa-sort-up' 
                    : 'fas fa-sort-down';
            }
            if (activeTh) {
                activeTh.classList.add('active-sort');
            }
        }
    }

    // 渲染表格
    function renderTable() {
        const tbody = document.getElementById('projectListBody');
        const noDataMsg = document.getElementById('noDataMessage');
        const totalRecordsEl = document.getElementById('totalRecords');

        if (!tbody) return;

        if (totalRecordsEl) {
            totalRecordsEl.textContent = state.filteredProjects.length;
        }

        if (state.filteredProjects.length === 0) {
            tbody.innerHTML = '';
            if (noDataMsg) noDataMsg.style.display = 'block';
            return;
        }

        if (noDataMsg) noDataMsg.style.display = 'none';

        const startIndex = (state.currentPage - 1) * state.pageSize;
        const endIndex = Math.min(startIndex + state.pageSize, state.filteredProjects.length);
        const pageData = state.filteredProjects.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(project => {
            const statusInfo = getStatusInfo(project.status);
            const deadlineClass = project.urgent ? 'deadline-urgent' : 'deadline-normal';
            
            // ★ 顯示邏輯：優先顯示 projectNo，若無則顯示 '-'
            // 這裡使用內部 ID (project.id) 作為連結參數，但顯示的是正式編號 (projectNo)
            const displayProjectNo = project.projectNo ? 
                `<span class="project-id-badge">${project.projectNo}</span>` : 
                `<span class="text-muted text-center d-block">-</span>`;

            return `
                <tr onclick="ProjectList.openProjectDashboard('${project.id}')">
                    <td><span class="quotation-id-badge">${project.quotationId}</span></td>
                    <td>${displayProjectNo}</td>
                    <td>${project.name}</td>
                    <td>${project.owner}</td>
                    <td>${project.customer}</td>
                    <td class="${deadlineClass}">${project.bidDate}</td>
                    <td><span class="project-status-badge ${statusInfo.className}">${statusInfo.text}</span></td>
                </tr>
            `;
        }).join('');
    }

    // 渲染分頁
    function renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        const totalPages = Math.ceil(state.filteredProjects.length / state.pageSize);
        let html = '';

        html += `
            <li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); ProjectList.goToPage(${state.currentPage - 1})">上一頁</a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                html += `
                    <li class="page-item ${i === state.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); ProjectList.goToPage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        html += `
            <li class="page-item ${state.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); ProjectList.goToPage(${state.currentPage + 1})">下一頁</a>
            </li>
        `;

        paginationEl.innerHTML = html;
    }

    // 更新統計數字
    function updateStatistics() {
        const stats = {
            total: state.projects.length,
            bidding: state.projects.filter(p => p.status === 'bidding').length,
            awarded: state.projects.filter(p => p.status === 'awarded').length,
            completed: state.projects.filter(p => p.status === 'archived').length
        };

        const setStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setStat('statTotalCount', stats.total);
        setStat('statBiddingCount', stats.bidding);
        setStat('statAwardedCount', stats.awarded);
        setStat('statCompletedCount', stats.completed);
    }

    // 取得狀態樣式
    function getStatusInfo(status) {
        const map = {
            'draft': { text: '草稿', className: 'status-draft' },
            'bidding': { text: '報價估算中', className: 'status-bidding' },
            'awarded': { text: '已得標', className: 'status-awarded' },
            'archived': { text: '已歸檔', className: 'status-archived' } // 統一為已歸檔
        };
        return map[status] || { text: status, className: '' };
    }

    // 公開方法
    return {
        init: init,
        goToPage: function(page) {
            const totalPages = Math.ceil(state.filteredProjects.length / state.pageSize);
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
        },
        sortData: sortData,
        openProjectDashboard: function(projectId) {
            window.location.href = `../project-dashboard/index.html?projectId=${projectId}`;
        },
        clearFilters: clearFilters,
        syncAllERP: function() {
            LiangLianSystem.showToast('正在連線至 ERP 系統...', 'info');
            setTimeout(() => {
                LiangLianSystem.showToast('同步成功！已更新 2 筆專案資料', 'success');
            }, 1500);
        },
        exportAllProjects: function() {
            LiangLianSystem.showToast('正在產生 Excel 報表...', 'info');
            setTimeout(() => {
                LiangLianSystem.showToast('下載開始：Project_List_2025.xlsx', 'success');
            }, 1500);
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    ProjectList.init();
});