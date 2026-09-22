// 檔案位置：core/system-admin/user-management/user_management.js
// 員工管理系統 - 列表頁面

(function() {
    'use strict';

    // 模擬員工資料（實際應從 ERP 系統同步）
    const mockUsers = [
        {
            id: 'E0001234567',
            name: '王大明',
            englishName: 'David Wang',
            department: '工程部',
            deptCode: 'ENG',
            position: '專案經理',
            positionCode: 'PM',
            email: 'david.wang@lianglian.com',
            phone: '0912-345-678',
            ext: '101',
            hireDate: '2018-03-15',
            status: 'active',
            supervisor: '張董事長',
            location: '台北總公司',
            workHistory: [
                { date: '2018-03-15', event: '加入良聯工程，擔任工程師' },
                { date: '2019-06-01', event: '升任資深工程師' },
                { date: '2021-01-01', event: '升任專案經理' }
            ],
            loginLogs: [
                {
                    loginTime: '2024-11-28 09:15:23',
                    logoutTime: '2024-11-28 18:30:45',
                    ipAddress: '192.168.1.100',
                    device: 'Windows 10 - Chrome 119',
                    location: '台北總公司',
                    status: 'success'
                },
                {
                    loginTime: '2024-11-27 08:45:12',
                    logoutTime: '2024-11-27 17:55:30',
                    ipAddress: '192.168.1.100',
                    device: 'Windows 10 - Chrome 119',
                    location: '台北總公司',
                    status: 'success'
                },
                {
                    loginTime: '2024-11-26 09:00:05',
                    logoutTime: '2024-11-26 18:15:20',
                    ipAddress: '192.168.1.100',
                    device: 'Windows 10 - Chrome 119',
                    location: '台北總公司',
                    status: 'success'
                },
                {
                    loginTime: '2024-11-25 08:30:45',
                    logoutTime: null,
                    ipAddress: '192.168.1.100',
                    device: 'Windows 10 - Chrome 119',
                    location: '台北總公司',
                    status: 'timeout'
                },
                {
                    loginTime: '2024-11-24 14:20:10',
                    logoutTime: null,
                    ipAddress: '192.168.1.50',
                    device: 'Windows 10 - Chrome 119',
                    location: '台北總公司',
                    status: 'failed'
                }
            ]
        },
        {
            id: 'E0001234568',
            name: '李小華',
            englishName: 'Lisa Li',
            department: '業務部',
            deptCode: 'SAL',
            position: '業務主管',
            positionCode: 'SM',
            email: 'lisa.li@lianglian.com',
            phone: '0923-456-789',
            ext: '102',
            hireDate: '2019-06-20',
            status: 'active',
            supervisor: '王大明',
            location: '台北總公司',
            workHistory: [
                { date: '2019-06-20', event: '加入良聯工程，擔任業務專員' },
                { date: '2021-07-01', event: '升任業務主管' }
            ],
            loginLogs: [
                {
                    loginTime: '2024-11-28 08:30:15',
                    logoutTime: '2024-11-28 17:45:30',
                    ipAddress: '192.168.1.105',
                    device: 'Windows 11 - Edge 120',
                    location: '台北總公司',
                    status: 'success'
                },
                {
                    loginTime: '2024-11-27 09:10:22',
                    logoutTime: '2024-11-27 18:20:15',
                    ipAddress: '192.168.1.105',
                    device: 'Windows 11 - Edge 120',
                    location: '台北總公司',
                    status: 'success'
                },
                {
                    loginTime: '2024-11-26 08:55:10',
                    logoutTime: '2024-11-26 17:30:45',
                    ipAddress: '192.168.1.105',
                    device: 'Windows 11 - Edge 120',
                    location: '台北總公司',
                    status: 'success'
                }
            ]
        },
        {
            id: 'E0001234569',
            name: '陳志強',
            englishName: 'Jack Chen',
            department: '工程部',
            deptCode: 'ENG',
            position: '資深工程師',
            positionCode: 'SE',
            email: 'jack.chen@lianglian.com',
            phone: '0934-567-890',
            ext: '103',
            hireDate: '2017-01-10',
            status: 'active',
            supervisor: '王大明',
            location: '台北總公司',
            workHistory: [
                { date: '2017-01-10', event: '加入良聯工程，擔任工程師' },
                { date: '2019-01-01', event: '升任資深工程師' }
            ]
        },
        {
            id: 'E0001234558',
            name: '林美玲',
            englishName: 'Mary Lin',
            department: '財務部',
            deptCode: 'FIN',
            position: '財務經理',
            positionCode: 'FM',
            email: 'mary.lin@lianglian.com',
            phone: '0945-678-901',
            ext: '104',
            hireDate: '2016-09-05',
            status: 'active',
            supervisor: '張董事長',
            location: '台北總公司',
            workHistory: [
                { date: '2016-09-05', event: '加入良聯工程，擔任會計專員' },
                { date: '2018-03-01', event: '升任會計主管' },
                { date: '2020-01-01', event: '升任財務經理' }
            ]
        },
        {
            id: 'E0000234560',
            name: '張建國',
            englishName: 'John Chang',
            department: '工程部',
            deptCode: 'ENG',
            position: '工程師',
            positionCode: 'ENG',
            email: 'john.chang@lianglian.com',
            phone: '0956-789-012',
            ext: '105',
            hireDate: '2020-02-15',
            status: 'active',
            supervisor: '陳志強',
            location: '台中分公司',
            workHistory: [
                { date: '2020-02-15', event: '加入良聯工程，擔任工程師' }
            ]
        },
        {
            id: 'E0002234456',
            name: '黃雅婷',
            englishName: 'Tina Huang',
            department: '行政部',
            deptCode: 'ADM',
            position: '行政專員',
            positionCode: 'AS',
            email: 'tina.huang@lianglian.com',
            phone: '0967-890-123',
            ext: '106',
            hireDate: '2021-04-01',
            status: 'active',
            supervisor: '林美玲',
            location: '台北總公司',
            workHistory: [
                { date: '2021-04-01', event: '加入良聯工程，擔任行政專員' }
            ]
        },
        {
            id: 'E0003568521',
            name: '劉俊傑',
            englishName: 'James Liu',
            department: '業務部',
            deptCode: 'SAL',
            position: '業務專員',
            positionCode: 'SS',
            email: 'james.liu@lianglian.com',
            phone: '0978-901-234',
            ext: '107',
            hireDate: '2020-08-15',
            status: 'active',
            supervisor: '李小華',
            location: '高雄分公司',
            workHistory: [
                { date: '2020-08-15', event: '加入良聯工程，擔任業務專員' }
            ]
        },
        {
            id: 'E0005529459',
            name: '吳佩珊',
            englishName: 'Penny Wu',
            department: '採購部',
            deptCode: 'PUR',
            position: '採購主管',
            positionCode: 'PUM',
            email: 'penny.wu@lianglian.com',
            phone: '0989-012-345',
            ext: '108',
            hireDate: '2015-11-20',
            status: 'active',
            supervisor: '林美玲',
            location: '台北總公司',
            workHistory: [
                { date: '2015-11-20', event: '加入良聯工程，擔任採購專員' },
                { date: '2018-06-01', event: '升任採購主管' }
            ]
        },
        {
            id: 'E0003456789',
            name: '周文龍',
            englishName: 'Allen Chou',
            department: '工程部',
            deptCode: 'ENG',
            position: '工程師',
            positionCode: 'ENG',
            email: 'allen.chou@lianglian.com',
            phone: '0912-123-456',
            ext: '109',
            hireDate: '2019-03-10',
            status: 'inactive',
            supervisor: '王大明',
            location: '台北總公司',
            leaveDate: '2024-06-30',
            workHistory: [
                { date: '2019-03-10', event: '加入良聯工程，擔任工程師' },
                { date: '2024-06-30', event: '離職' }
            ]
        },
        {
            id: 'E0003569780',
            name: '鄭雅芳',
            englishName: 'Sophia Cheng',
            department: '財務部',
            deptCode: 'FIN',
            position: '會計專員',
            positionCode: 'ACC',
            email: 'sophia.cheng@lianglian.com',
            phone: '0923-234-567',
            ext: '110',
            hireDate: '2021-07-01',
            status: 'active',
            supervisor: '林美玲',
            location: '台北總公司',
            workHistory: [
                { date: '2021-07-01', event: '加入良聯工程，擔任會計專員' }
            ]
        },
        {
            id: 'E0006458978',
            name: '蔡明宏',
            englishName: 'Michael Tsai',
            department: '業務部',
            deptCode: 'SAL',
            position: '業務經理',
            positionCode: 'SLM',
            email: 'michael.tsai@lianglian.com',
            phone: '0934-345-678',
            ext: '111',
            hireDate: '2014-05-15',
            status: 'active',
            supervisor: '張董事長',
            location: '台北總公司',
            workHistory: [
                { date: '2014-05-15', event: '加入良聯工程，擔任業務專員' },
                { date: '2016-08-01', event: '升任業務主管' },
                { date: '2019-01-01', event: '升任業務經理' }
            ]
        },
        {
            id: 'E0003562895',
            name: '楊淑芬',
            englishName: 'Susan Yang',
            department: '行政部',
            deptCode: 'ADM',
            position: '行政助理',
            positionCode: 'AA',
            email: 'susan.yang@lianglian.com',
            phone: '0945-456-789',
            ext: '112',
            hireDate: '2022-01-10',
            status: 'active',
            supervisor: '黃雅婷',
            location: '台北總公司',
            workHistory: [
                { date: '2022-01-10', event: '加入良聯工程，擔任行政助理' }
            ]
        }
    ];

    // 狀態管理
    let state = {
        users: [...mockUsers],
        filteredUsers: [...mockUsers],
        sort: {
            column: '',
            direction: 'asc'
        }
    };

    // DOM 元素 (使用 try-catch 或檢查存在性避免錯誤)
    const userTableBody = document.getElementById('userTableBody');
    const searchInput = document.getElementById('searchInput');
    const deptFilter = document.getElementById('deptFilter');
    const statusFilter = document.getElementById('statusFilter');
    const positionFilter = document.getElementById('positionFilter');
    const noData = document.getElementById('noData');
    const clearBtn = document.getElementById('clearFilterBtn');

    // 初始化頁面
    function initPage() {
        // 安全檢查：確保關鍵元素存在才執行
        if (!userTableBody) {
            console.error('找不到 userTableBody 元素，無法渲染表格');
            return;
        }

        updateStatistics();
        renderUsers();
        bindEvents();
    }

    // 更新統計資料
    function updateStatistics() {
        const totalUsers = state.users.length;
        const activeUsers = state.users.filter(u => u.status === 'active').length;
        const inactiveUsers = state.users.filter(u => u.status === 'inactive').length;

        // 安全更新，防止元素不存在報錯
        const totalEl = document.getElementById('totalUsers');
        const activeEl = document.getElementById('activeUsers');
        const inactiveEl = document.getElementById('inactiveUsers');

        if (totalEl) totalEl.textContent = totalUsers;
        if (activeEl) activeEl.textContent = activeUsers;
        if (inactiveEl) inactiveEl.textContent = inactiveUsers;
    }

    // 渲染員工表格
    function renderUsers() {
        // 雙重檢查
        if (!userTableBody) return;

        if (state.filteredUsers.length === 0) {
            userTableBody.style.display = 'none';
            if (noData) noData.style.display = 'block';
            return;
        }

        userTableBody.style.display = '';
        if (noData) noData.style.display = 'none';

        userTableBody.innerHTML = state.filteredUsers.map(user => {
            const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
            const statusText = user.status === 'active' ? '在職' : '離職';

            return `
                <tr onclick="window.userManagement.viewUserDetail('${user.id}')">
                    <td>
                        <span class="user-id-badge">${user.id}</span>
                    </td>
                    <td>${user.name}</td>
                    <td>${user.deptCode}</td>
                    <td>${user.department}</td>
                    <td>${user.positionCode}</td>
                    <td>${user.position}</td>
                    <td>${user.ext}</td>
                    <td>${user.email}</td>
                    <td>
                        <span class="user-status-badge ${statusClass}">${statusText}</span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 獲取姓名首字母
    function getInitials(name) {
        if (!name) return '?';
        // 取中文姓名的第一個字
        return name.charAt(0);
    }

    // 篩選與排序邏輯
    function applyFilters() {
        // 安全獲取值
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedDept = deptFilter ? deptFilter.value : '';
        const selectedStatus = statusFilter ? statusFilter.value : '';
        const selectedPosition = positionFilter ? positionFilter.value : '';

        // 1. 篩選
        let result = state.users.filter(user => {
            // 搜尋過濾
            const matchSearch = !searchTerm || 
                user.name.toLowerCase().includes(searchTerm) ||
                user.id.toLowerCase().includes(searchTerm) ||
                user.department.toLowerCase().includes(searchTerm) ||
                user.deptCode.toLowerCase().includes(searchTerm) ||
                user.position.toLowerCase().includes(searchTerm) ||
                user.positionCode.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.ext.includes(searchTerm);

            // 部門過濾
            const matchDept = !selectedDept || user.department === selectedDept;

            // 狀態過濾
            const matchStatus = !selectedStatus || user.status === selectedStatus;

            // 職位過濾
            const matchPosition = !selectedPosition || user.position.includes(selectedPosition);

            return matchSearch && matchDept && matchStatus && matchPosition;
        });

        // 2. 排序
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

        state.filteredUsers = result;
        renderUsers();
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
        const allIcons = document.querySelectorAll('.user-table th i');
        const allThs = document.querySelectorAll('.user-table th');
        
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

    // 清空篩選
    function clearFilters() {
        if (searchInput) searchInput.value = '';
        if (deptFilter) deptFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (positionFilter) positionFilter.value = '';

        // 重置排序狀態
        state.sort = { column: '', direction: 'asc' };
        updateSortIcons();

        applyFilters();
        
        // 這裡可以使用 LiangLianSystem.showToast，但為了避免相依性問題，這裡先不呼叫
        // if (window.LiangLianSystem) LiangLianSystem.showToast('已清空篩選條件', 'success');
    }

    // 綁定事件
    function bindEvents() {
        // 搜尋輸入
        if (searchInput) searchInput.addEventListener('input', applyFilters);

        // 下拉選單篩選
        if (deptFilter) deptFilter.addEventListener('change', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        if (positionFilter) positionFilter.addEventListener('change', applyFilters);

        // 清空按鈕
        if (clearBtn) clearBtn.addEventListener('click', clearFilters);

        // ESC 鍵關閉側邊欄
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeUserDetailPanel();
            }
        });
    }

    // 查看員工詳情（打開側邊欄）
    function viewUserDetail(userId) {
        const user = state.users.find(u => u.id === userId);
        if (!user) return;

        // 填充側邊欄資料
        displayUserInPanel(user);

        // 顯示側邊欄
        openUserDetailPanel();
    }

    // 顯示員工資料到側邊欄
    function displayUserInPanel(user) {
        // 安全設置文字內容的輔助函數
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text || '-';
        };

        // 頭像和基本資訊
        const initials = getInitials(user.name);
        setText('panelAvatar', initials);
        setText('panelUserName', user.name);
        setText('panelUserTitle', `${user.department} - ${user.position}`);

        // 員工資訊
        setText('panelUserId', user.id);
        setText('panelName', user.name);
        setText('panelDeptCode', user.deptCode);
        setText('panelDept', user.department);
        setText('panelPositionCode', user.positionCode);
        setText('panelPosition', user.position);

        // 狀態
        const statusElement = document.getElementById('panelStatus');
        if (statusElement) {
            if (user.status === 'active') {
                statusElement.className = 'user-status-badge status-active';
                statusElement.textContent = '在職';
            } else {
                statusElement.className = 'user-status-badge status-inactive';
                statusElement.textContent = '離職';
            }
        }

        // 聯絡資訊
        setText('panelEmail', user.email);
        setText('panelPhone', user.phone);
        setText('panelExt', user.ext);

        // 組織資訊
        setText('panelHireDate', formatDate(user.hireDate));

        // 離職日期（僅離職員工顯示）
        const leaveDateRow = document.getElementById('panelLeaveDateRow');
        if (leaveDateRow) {
            if (user.status === 'inactive' && user.leaveDate) {
                leaveDateRow.style.display = 'flex';
                setText('panelLeaveDate', formatDate(user.leaveDate));
            } else {
                leaveDateRow.style.display = 'none';
            }
        }

        // 計算年資
        const tenure = calculateTenure(user.hireDate, user.leaveDate);
        setText('panelTenure', tenure);

        // 顯示登入記錄
        displayLoginLogs(user.loginLogs);
    }

    // 顯示登入記錄
    function displayLoginLogs(loginLogs) {
        const logsContainer = document.getElementById('panelLoginLogs');
        if (!logsContainer) return;
        
        if (!loginLogs || loginLogs.length === 0) {
            logsContainer.innerHTML = `
                <div class="login-log-empty">
                    <i class="fas fa-clock-rotate-left"></i>
                    <p style="font-size: 0.9rem; margin: 0;">暫無登入記錄</p>
                </div>
            `;
            return;
        }

        // 只顯示最近5筆登入記錄
        const recentLogs = loginLogs.slice(0, 5);

        logsContainer.innerHTML = recentLogs.map(log => {
            // 判斷狀態
            let statusClass = 'login-status-success';
            let statusText = '成功';
            if (log.status === 'failed') {
                statusClass = 'login-status-failed';
                statusText = '失敗';
            } else if (log.status === 'timeout') {
                statusClass = 'login-status-timeout';
                statusText = '逾時';
            }

            // 計算登入時長
            let duration = '-';
            if (log.logoutTime) {
                const loginTime = new Date(log.loginTime);
                const logoutTime = new Date(log.logoutTime);
                const diffMs = logoutTime - loginTime;
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                duration = `${hours}小時${minutes}分鐘`;
            }

            return `
                <div class="login-log-item">
                    <div class="login-log-header">
                        <div class="login-log-time">${formatDateTime(log.loginTime)}</div>
                        <span class="login-log-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="login-log-details">
                        <div class="login-log-detail-item">
                            <i class="fas fa-network-wired"></i>
                            <span>IP：${log.ipAddress}</span>
                        </div>
                        <div class="login-log-detail-item">
                            <i class="fas fa-desktop"></i>
                            <span>${log.device}</span>
                        </div>
                        <div class="login-log-detail-item">
                            <i class="fas fa-location-dot"></i>
                            <span>${log.location}</span>
                        </div>
                        ${log.logoutTime ? `
                        <div class="login-log-detail-item">
                            <i class="fas fa-clock"></i>
                            <span>登入時長：${duration}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 格式化日期時間
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '-';
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    // 格式化日期
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 計算年資
    function calculateTenure(hireDateString, leaveDateString) {
        if (!hireDateString) return '-';

        const hireDate = new Date(hireDateString);
        const endDate = leaveDateString ? new Date(leaveDateString) : new Date();
        
        let years = endDate.getFullYear() - hireDate.getFullYear();
        let months = endDate.getMonth() - hireDate.getMonth();
        
        if (months < 0) {
            years--;
            months += 12;
        }

        if (years === 0) {
            return `${months} 個月`;
        } else if (months === 0) {
            return `${years} 年`;
        } else {
            return `${years} 年 ${months} 個月`;
        }
    }

    // 打開側邊欄
    function openUserDetailPanel() {
        const overlay = document.getElementById('userDetailOverlay');
        const panel = document.getElementById('userDetailPanel');
        
        if (overlay && panel) {
            overlay.classList.add('show');
            panel.classList.add('show');
            // 防止背景滾動
            document.body.style.overflow = 'hidden';
        }
    }

    // 關閉側邊欄
    function closeUserDetailPanel() {
        const overlay = document.getElementById('userDetailOverlay');
        const panel = document.getElementById('userDetailPanel');
        
        if (overlay && panel) {
            overlay.classList.remove('show');
            panel.classList.remove('show');
            // 恢復背景滾動
            document.body.style.overflow = '';
        }
    }

    // 導出公開方法
    window.userManagement = {
        viewUserDetail: viewUserDetail,
        sortData: sortData // 導出排序方法
    };

    // 全局關閉函數（供 HTML onclick 使用）
    window.closeUserDetail = closeUserDetailPanel;

    // 頁面載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

})();