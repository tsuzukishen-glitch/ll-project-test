/* 檔案位置：core/system-admin/permission-management/permission_management.js */

(function() {
    'use strict';

    // 1. 資料與狀態
    let roles = [
        { id: 'admin', name: '系統管理員', description: '擁有系統所有權限，可進行全域設定與系統管理。', color: '#dc2626', isSystem: true, linkedModule: 'all' },
        { id: 'manager', name: '專案經理', description: '負責專案進度控管、成本審核及報價單簽核。', color: '#ea580c', isSystem: false, linkedModule: 'sys_quotation' },
        { id: 'cost_dept', name: '成本部', description: '負責詳細成本估算、詢價分析與發包預算編列。', color: '#059669', isSystem: false, linkedModule: 'sys_quotation' }, 
        { id: 'construction_dept', name: '建造部', description: '執行詳細工程估算、詢價分析與發包預算編列。', color: '#7c3aed', isSystem: false, linkedModule: 'sys_quotation' }
    ];

    const users = [
        { id: 1, name: '張育霖', email: 'zhang@lianlian.com', department: '業務部', roleIds: ['admin'], employeeId: '0001001' },
        { id: 2, name: '李明哲', email: 'li@lianlian.com', department: '工程部', roleIds: ['manager', 'cost_dept'], employeeId: '0001002' }, // 示範：一人多角色
        { id: 3, name: '王大同', email: 'wang@lianlian.com', department: '財務部', roleIds: ['cost_dept'], employeeId: '0001003' },
        { id: 4, name: '陳美玲', email: 'chen@lianlian.com', department: '業務部', roleIds: ['manager'], employeeId: '0001004' },
        { id: 5, name: '林小美', email: 'lin.m@lianlian.com', department: '建造部', roleIds: ['construction_dept'], employeeId: '0001005' }
    ];

    // 排序狀態
    let roleSort = { key: 'name', dir: 'asc' };
    let userSort = { key: 'name', dir: 'asc' };

    // 使用者多角色指派下拉的狀態
    let activeDropdown = null;

    // 即時計算某角色目前有幾位用戶（一人多角色時，會同時算進每個角色的人數）
    function getRoleUserCount(roleId) {
        return users.filter(u => (u.roleIds || []).includes(roleId)).length;
    }

    const systemStructure = [
        {
            id: 'section_func_module', name: '功能模組', icon: 'fa-cubes', expanded: true,
            modules: [
                {
                    id: 'sys_quotation', name: '報價估算系統', icon: 'fa-calculator', expanded: true,
                    items: [
                        { id: 'proj_list', name: '專案列表', type: 'page' },
                        { id: 'auth_form', name: '報價授權單', type: 'data' },
                        { id: 'bid_data', name: '邀標單資料', type: 'data' },
                        { id: 'cost_est', name: '成本估算', type: 'data' },
                        { id: 'eng_est', name: '工程估價', type: 'data' },
                        { id: 'proc_plan', name: '發包計畫書管理', type: 'data' },
                        { id: 'tender_data', name: '投標資料彙整', type: 'data' },
                        { id: 'proc_inquiry', name: '發包採購詢價', type: 'data' },
                        { id: 'proc_budget', name: '發包預算費用', type: 'data' },
                    ]
                },
                {
                    id: 'sys_schedule', name: '人員排班系統', icon: 'fa-calendar-alt', expanded: true,
                    items: [
                        { id: 'schedule_view', name: '排班表', type: 'page' },
                        { id: 'leave_apply', name: '請假申請', type: 'data' }
                    ]
                },
                {
                    id: 'sys_location', name: '人員定位系統', icon: 'fa-map-marker-alt', expanded: true,
                    items: [
                        { id: 'loc_map', name: '即時地圖', type: 'page' },
                        { id: 'loc_history', name: '軌跡查詢', type: 'page' }
                    ]
                },
                {
                    id: 'sys_gas', name: '氣體洩漏偵測', icon: 'fa-triangle-exclamation', expanded: true,
                    items: [
                        { id: 'gas_monitor', name: '即時監控', type: 'page' },
                        { id: 'gas_alert', name: '警報紀錄', type: 'page' }
                    ]
                }
            ]
        },
        {
            id: 'section_sys_admin', name: '系統管理', icon: 'fa-cog', expanded: true,
            modules: [
                {
                    id: 'sys_base', name: '基礎管理', icon: 'fa-server', expanded: true,
                    items: [
                        { id: 'emp_mgmt', name: '員工管理', type: 'data' },
                        { id: 'perm_mgmt', name: '權限管理', type: 'data' }
                    ]
                }
            ]
        }
    ];

    let permissions = {};
    
    function initPermissions() {
        systemStructure.forEach(section => {
            section.modules.forEach(module => {
                module.items.forEach(item => {
                    if (!permissions[item.id]) {
                        permissions[item.id] = {
                            admin: 'full',
                            manager: 'view',
                            cost_dept: 'none',
                            purchase_dept: 'none',
                            user: 'none'
                        };
                        if (module.id === 'sys_quotation') {
                            if (item.id.includes('cost')) permissions[item.id].cost_dept = 'edit';
                            if (item.id.includes('proc')) permissions[item.id].purchase_dept = 'edit';
                        }
                    }
                });
            });
        });
    }
    initPermissions();

    function getModuleName(moduleId) {
        if (moduleId === 'all') return '全域 (所有系統)';
        for (const section of systemStructure) {
            const mod = section.modules.find(m => m.id === moduleId);
            if (mod) return mod.name;
        }
        return moduleId;
    }

    // 計算權限數量的函數 (雖然卡片不顯示了，但邏輯保留備用)
    function calculatePermissionCount(roleId) {
        let count = 0;
        Object.keys(permissions).forEach(itemId => {
            if (permissions[itemId][roleId] && permissions[itemId][roleId] !== 'none') {
                count++;
            }
        });
        return count;
    }

    function sortData(data, key, dir) {
        return data.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];
            
            if (key === 'name' && a.id === 'admin') return -1;
            if (key === 'name' && b.id === 'admin') return 1;

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // [Task 1] 渲染角色列表
    window.renderRoles = function() {
        const container = document.getElementById('rolesList');
        if(!container) return;
        
        const sortedRoles = sortData([...roles], roleSort.key, roleSort.dir);

        container.innerHTML = sortedRoles.map(role => {
            const isSystem = role.isSystem; 
            const isAdmin = role.id === 'admin';
            
            // 一般系統角色(若有)仍保留編輯按鈕但受 JS editRole 限制，但 admin 直接不渲染按鈕
            const editBtnHtml = !isAdmin 
                ? `<button class="btn-icon" title="編輯角色" onclick="editRole('${role.id}')"><i class="fas fa-edit"></i></button>`
                : ``;

            // 系統角色隱藏刪除按鈕
            const deleteBtnHtml = !isSystem 
                ? `<button class="btn-icon text-danger" title="刪除角色" onclick="deleteRole('${role.id}')"><i class="fas fa-trash-alt"></i></button>`
                : ``; 

            // 卡片 HTML 結構
            return `
            <div class="col-md-6 col-lg-4">
                <div class="role-card" style="color: ${role.color};">
                    <div class="role-header">
                        <div class="d-flex align-items-center">
                            <div class="role-icon" style="background: ${role.color};">
                                <i class="fas fa-user-tag"></i>
                            </div>
                            <div class="role-title-section">
                                <div class="role-title">
                                    ${role.name}
                                    ${isSystem ? '<span class="role-sys-badge">系統角色</span>' : ''}
                                </div>
                            </div>
                        </div>

                        <div class="role-actions-top">
                            ${editBtnHtml}
                            ${deleteBtnHtml}
                        </div>
                    </div>

                    <div class="role-module-tag">
                        <i class="fas fa-link"></i>
                        ${getModuleName(role.linkedModule || 'all')}
                    </div>

                    <div class="role-description">${role.description || '無描述'}</div>

                    <div class="role-footer">
                        <div class="role-stats-group">
                            <div class="role-stat">
                                <i class="fas fa-users"></i>
                                <span>${getRoleUserCount(role.id)} 位用戶</span>
                            </div>
                        </div>
                        <div class="role-btn-group">
                            <button class="btn btn-sm btn-outline-info" onclick="viewRoleUsers('${role.id}')">
                                <i class="fas fa-users"></i> 檢視用戶
                            </button>
                            <button class="btn btn-sm btn-outline-primary" onclick="goToPermissionMatrix('${role.id}')">
                                <i class="fas fa-key"></i> 檢視權限
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        updateRoleFilterOptions();
        updateMatrixRoleSelect();
        populateModuleScopeSelect();
    };

    window.viewRoleUsers = function(roleId) {
        const userTabBtn = document.querySelector('#users-tab');
        if(userTabBtn) {
            const userTab = new bootstrap.Tab(userTabBtn);
            userTab.show();
        }
        setTimeout(() => {
            const roleFilter = document.getElementById('roleFilter');
            if (roleFilter) {
                roleFilter.value = roleId;
                searchUsers();
            }
        }, 50);
    };

    // [Task 4] 系統管理員權限僅能檢視 (按鈕禁用)
    function generatePermissionButtons(itemId, roleId, currentVal) {
        const options = [
            { val: 'full', label: '完全控制' },
            { val: 'edit', label: '編輯/執行' },
            { val: 'view', label: '僅檢視' },
            { val: 'none', label: '無權限' }
        ];

        // 若為系統管理員，則禁用按鈕操作 (樣式上做區隔)
        const isAdmin = roleId === 'admin';
        const disabledAttr = isAdmin ? 'disabled style="opacity: 0.7; cursor: not-allowed; pointer-events: none;"' : '';

        return `
            <div class="perm-btn-group">
                ${options.map(opt => `
                    <button class="perm-btn ${opt.val} ${currentVal === opt.val ? 'active' : ''}"
                            ${disabledAttr}
                            onclick="updatePermission('${itemId}', '${roleId}', '${opt.val}')">
                        ${opt.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    window.updateMatrixRoleSelect = function() {
        const select = document.getElementById('matrixRoleSelect');
        if (!select) return;
        
        const currentVal = select.value;
        select.innerHTML = roles.map(r => 
            `<option value="${r.id}">${r.name}</option>`
        ).join('');

        if (currentVal && roles.find(r => r.id === currentVal)) {
            select.value = currentVal;
        } else if (roles.length > 0) {
            select.value = roles[0].id;
        }
    };

    window.populateModuleScopeSelect = function() {
        const select = document.getElementById('roleModuleScope');
        if (!select) return;
        
        let html = '<option value="all">全域 (所有系統)</option>';
        systemStructure.forEach(section => {
            section.modules.forEach(mod => {
                html += `<option value="${mod.id}">[${section.name}] ${mod.name}</option>`;
            });
        });
        select.innerHTML = html;
    };

    window.renderPermissionTable = function() {
        const select = document.getElementById('matrixRoleSelect');
        if (!select) return;
        
        const selectedRoleId = select.value;
        const targetRole = roles.find(r => r.id === selectedRoleId);
        const tbody = document.getElementById('permissionTableBody');
        const hintEl = document.getElementById('matrixRoleHint');
        
        if (!targetRole || !tbody) return;

        const scopeName = getModuleName(targetRole.linkedModule || 'all');
        if (hintEl) hintEl.innerHTML = `<span class="badge bg-light text-dark border me-2">綁定範圍</span> <strong>${scopeName}</strong>`;

        let html = '';
        
        systemStructure.forEach((section, sIdx) => {
            const hasRelevantModule = section.modules.some(m => 
                targetRole.linkedModule === 'all' || targetRole.linkedModule === m.id
            );

            if (!hasRelevantModule) return;

            const isSectionExpanded = section.expanded !== false;
            const sectionIcon = isSectionExpanded ? 'fa-chevron-down' : 'fa-chevron-right';
            
            html += `
                <tr class="section-header-row" onclick="toggleSection('${sIdx}')" style="cursor: pointer;">
                    <td colspan="2" style="background: #1e3a8a; color: white; font-weight: bold; padding: 12px 15px;">
                        <div class="d-flex align-items-center">
                            <i class="fas ${section.icon} me-2"></i>
                            ${section.name}
                            <i class="fas ${sectionIcon} ms-auto small text-white-50"></i>
                        </div>
                    </td>
                </tr>
            `;

            if (isSectionExpanded) {
                section.modules.forEach((module, mIdx) => {
                    if (targetRole.linkedModule !== 'all' && targetRole.linkedModule !== module.id) return;

                    const isModuleExpanded = module.expanded !== false;
                    const moduleIcon = isModuleExpanded ? 'fa-chevron-down' : 'fa-chevron-right';

                    html += `
                        <tr class="module-header-row" onclick="toggleModule('${sIdx}', '${mIdx}')" style="cursor: pointer;">
                            <td colspan="2" style="background: #f1f5f9; color: #1e40af; font-weight: 600; padding: 10px 15px 10px 30px; border-bottom: 2px solid #e2e8f0;">
                                <div class="d-flex align-items-center">
                                    <i class="fas ${module.icon} me-2"></i>
                                    ${module.name}
                                    <i class="fas ${moduleIcon} ms-auto small text-muted"></i>
                                </div>
                            </td>
                        </tr>
                    `;

                    if (isModuleExpanded) {
                        module.items.forEach(item => {
                            let itemIcon = 'fa-file-alt'; 
                            if (item.type === 'page') itemIcon = 'fa-columns';
                            if (item.type === 'action') itemIcon = 'fa-gavel';
                            
                            const currentPerm = permissions[item.id]?.[selectedRoleId] || 'none';

                            html += `
                                <tr class="function-row">
                                    <td class="function-name-cell" style="padding-left: 50px !important;">
                                        <div class="d-flex align-items-center">
                                            <i class="fas ${itemIcon} me-2 text-muted small" style="width: 16px;"></i>
                                            <span style="font-weight: 500; color: #334155;">${item.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        ${generatePermissionButtons(item.id, selectedRoleId, currentPerm)}
                                    </td>
                                </tr>
                            `;
                        });
                    }
                });
            }
        });
        tbody.innerHTML = html;
    };

    window.sortUsers = function(key) {
        if (userSort.key === key) {
            userSort.dir = userSort.dir === 'asc' ? 'desc' : 'asc';
        } else {
            userSort.key = key;
            userSort.dir = 'asc';
        }
        searchUsers(); 
    };

    window.searchUsers = function() {
        const searchTerm = document.getElementById('userSearchInput').value.toLowerCase().trim();
        const deptFilter = document.getElementById('deptFilter').value;
        const roleFilterVal = document.getElementById('roleFilter').value;

        let filtered = users.filter(u => {
            const matchText = !searchTerm || u.name.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm);
            const matchDept = !deptFilter || u.department === deptFilter;
            const matchRole = !roleFilterVal || (u.roleIds || []).includes(roleFilterVal);
            return matchText && matchDept && matchRole;
        });

        if (userSort.key === 'roles') {
            // 陣列欄位無法直接比大小，改用角色名稱組合字串排序
            const roleNameOf = (u) => (u.roleIds || []).map(rid => roles.find(r => r.id === rid)?.name || '').join('、');
            filtered = [...filtered].sort((a, b) => {
                const cmp = roleNameOf(a).localeCompare(roleNameOf(b), 'zh-Hant');
                return userSort.dir === 'asc' ? cmp : -cmp;
            });
        } else {
            filtered = sortData(filtered, userSort.key, userSort.dir);
        }

        renderUsersTable(filtered);
    };

    // 用戶列表：角色欄位的內容（標籤群 + chevron），供初次渲染與更新後局部刷新共用
    function renderUserRoleTriggerContent(roleIdsArr) {
        const selectedRoles = (roleIdsArr || []).map(rid => roles.find(r => r.id === rid)).filter(Boolean);
        const content = selectedRoles.length === 0
            ? '<span class="role-select-placeholder">請選擇角色...</span>'
            : `<div class="role-tags">${selectedRoles.map(r => `<span class="role-tag" style="color:${r.color}; background:${r.color}1A; border:1px solid ${r.color}55;">${r.name}</span>`).join('')}</div>`;
        return `${content}<i class="fas fa-chevron-down text-muted ms-2" style="font-size: 0.8rem;"></i>`;
    }

    function renderRoleSelectTrigger(userId, roleIdsArr) {
        const hasSelection = (roleIdsArr || []).length > 0;
        return `
            <div class="role-select-trigger ${hasSelection ? 'active' : ''}" id="role-trigger-${userId}" onclick="toggleUserRoleDropdown(${userId}, event)">
                ${renderUserRoleTriggerContent(roleIdsArr)}
            </div>
        `;
    }

    window.toggleUserRoleDropdown = function(userId, event) {
        event.stopPropagation();
        if (activeDropdown && activeDropdown.dataset.userId == userId) { closeRoleDropdown(); return; }
        closeRoleDropdown();
        createUserRoleDropdown(userId, event.currentTarget);
    };

    // 依視窗剩餘空間決定下拉選單開在觸發元件的上方還是下方，避免被畫面下緣切掉
    function positionFloatingDropdown(dropdown, rect, minWidth) {
        dropdown.style.width = Math.max(rect.width, minWidth) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.top = '0px';
        dropdown.style.visibility = 'hidden'; // 先隱藏量測高度，避免閃爍
        document.body.appendChild(dropdown);

        const dropdownHeight = dropdown.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        let topPos;
        if (spaceBelow < dropdownHeight + 10 && spaceAbove > spaceBelow) {
            // 下方空間不夠、上方空間更充足 → 開在觸發元件上方
            topPos = Math.max(8, rect.top - dropdownHeight - 5);
        } else {
            topPos = rect.bottom + 5;
        }
        dropdown.style.top = topPos + 'px';
        dropdown.style.visibility = 'visible';
    }

    function createUserRoleDropdown(userId, triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const selectedRoleIds = user.roleIds || [];

        const dropdown = document.createElement('div');
        dropdown.className = 'role-portal-dropdown';
        dropdown.dataset.userId = userId;

        const header = document.createElement('div');
        header.className = 'role-portal-dropdown-header';
        header.textContent = `指派角色：${user.name}（可複選）`;
        dropdown.appendChild(header);

        roles.forEach(role => {
            const isChecked = selectedRoleIds.includes(role.id);
            const optionEl = document.createElement('div');
            optionEl.className = 'role-select-option';
            optionEl.innerHTML = `
                <input type="checkbox" ${isChecked ? 'checked' : ''}>
                <label><span class="role-color-dot" style="background:${role.color};"></span>${role.name}</label>
            `;
            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const checkbox = optionEl.querySelector('input');
                if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                updateUserRoleSelection(userId, role.id, checkbox.checked);
            });
            dropdown.appendChild(optionEl);
        });

        positionFloatingDropdown(dropdown, rect, 220);
        activeDropdown = dropdown;
    }

    function updateUserRoleSelection(userId, roleId, isChecked) {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        if (!user.roleIds) user.roleIds = [];
        if (isChecked) {
            if (!user.roleIds.includes(roleId)) user.roleIds.push(roleId);
        } else {
            user.roleIds = user.roleIds.filter(rid => rid !== roleId);
        }
        // 只更新 trigger 內容，不要整個外層再重繪一次（避免外框變成雙層）
        const trigger = document.getElementById(`role-trigger-${userId}`);
        if (trigger) {
            trigger.innerHTML = renderUserRoleTriggerContent(user.roleIds);
            if (user.roleIds.length > 0) trigger.classList.add('active');
            else trigger.classList.remove('active');
        }
        renderRoles(); // 角色卡片的用戶數要即時反映
    }

    function closeRoleDropdown() {
        if (activeDropdown) { activeDropdown.remove(); activeDropdown = null; }
    }

    window.renderUsersTable = function(filteredUsers = null) {
        const container = document.getElementById('usersTableBody');
        if(!container) return;
        const usersToRender = filteredUsers || users;
        
        document.querySelectorAll('.user-table th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if(th.onclick && th.getAttribute('onclick').includes(userSort.key)) {
                th.classList.add(userSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });

        if (usersToRender.length === 0) {
            container.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">查無符合條件的用戶</td></tr>`;
            return;
        }
        
        container.innerHTML = usersToRender.map(user => {
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <div class="user-avatar">${user.name.charAt(0)}</div>
                            <div>
                                <div class="user-name">${user.name}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="user-id-badge">${user.employeeId || '9999'}</span></td>
                    <td><span class="text-dark">${user.email}</span></td>
                    <td><span class="text-dark">${user.department}</span></td>
                    <td>${renderRoleSelectTrigger(user.id, user.roleIds || [])}</td>
                </tr>
            `;
        }).join('');
    };
    
    window.goToPermissionMatrix = function(roleId) {
        const tabEl = document.querySelector('#permissions-tab');
        const tab = new bootstrap.Tab(tabEl);
        tab.show();
        setTimeout(() => {
            const select = document.getElementById('matrixRoleSelect');
            if(select) {
                select.value = roleId;
                renderPermissionTable();
            }
        }, 100);
    };

    window.toggleSection = function(index) {
        systemStructure[index].expanded = !systemStructure[index].expanded;
        renderPermissionTable();
    };

    window.toggleModule = function(sectionIndex, moduleIndex) {
        const module = systemStructure[sectionIndex].modules[moduleIndex];
        module.expanded = !module.expanded;
        renderPermissionTable();
    };

    window.updatePermission = function(itemId, roleId, level) {
        if (!permissions[itemId]) permissions[itemId] = {};
        permissions[itemId][roleId] = level;
        const row = event.target.closest('tr');
        if(row) {
            const buttons = row.querySelectorAll('.perm-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }
        renderRoles(); 
    };

    window.updateRoleFilterOptions = function() {
        const roleSelect = document.getElementById('roleFilter');
        if(roleSelect) {
            const currentVal = roleSelect.value;
            let options = '<option value="">所有角色</option>';
            roles.forEach(r => {
                options += `<option value="${r.id}">${r.name}</option>`;
            });
            roleSelect.innerHTML = options;
            if (currentVal) roleSelect.value = currentVal;
        }
    };

    window.savePermissions = function() {
        const btn = event.target.closest('button');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>儲存中...';
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            alert('權限設定已成功保存！');
        }, 800);
    };

    window.deleteRole = function(roleId) {
        const role = roles.find(r => r.id === roleId);
        if (roleId === 'admin' || role.isSystem) { 
            alert('無法刪除系統預設角色！'); 
            return; 
        }
        if (confirm(`確定要刪除「${role.name}」角色嗎？已指派此角色的用戶會一併移除此角色關聯。`)) {
            roles = roles.filter(r => r.id !== roleId);
            users.forEach(u => {
                if (u.roleIds) u.roleIds = u.roleIds.filter(rid => rid !== roleId);
            });
            renderRoles();
            renderPermissionTable(); 
            renderUsersTable();
            alert('角色已刪除。');
        }
    };

    window.showAddRoleModal = function() {
        const modal = new bootstrap.Modal(document.getElementById('roleModal'));
        document.getElementById('roleModalTitle').textContent = '新增角色';
        document.getElementById('roleId').value = '';
        document.getElementById('roleName').value = '';
        document.getElementById('roleDescription').value = '';
        document.getElementById('roleModuleScope').value = 'all';
        document.getElementById('roleColor').value = '#2563eb';
        
        // 恢復欄位可用性
        document.getElementById('roleModuleScope').disabled = false;
        document.getElementById('roleColor').disabled = false;
        
        modal.show();
    };

    window.editRole = function(roleId) {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        const modal = new bootstrap.Modal(document.getElementById('roleModal'));
        document.getElementById('roleModalTitle').textContent = '編輯角色';
        document.getElementById('roleId').value = role.id;
        document.getElementById('roleName').value = role.name;
        document.getElementById('roleDescription').value = role.description;
        document.getElementById('roleModuleScope').value = role.linkedModule || 'all';
        document.getElementById('roleColor').value = role.color;

        // 若為系統角色，禁用綁定與顏色修改
        if (role.isSystem) {
            document.getElementById('roleModuleScope').disabled = true;
            document.getElementById('roleColor').disabled = true;
        } else {
            document.getElementById('roleModuleScope').disabled = false;
            document.getElementById('roleColor').disabled = false;
        }

        modal.show();
    };

    window.saveRole = function() {
        const roleId = document.getElementById('roleId').value;
        const roleName = document.getElementById('roleName').value.trim();
        const roleDesc = document.getElementById('roleDescription').value.trim();
        const roleModule = document.getElementById('roleModuleScope').value;
        const roleColor = document.getElementById('roleColor').value;

        if(!roleName) { alert('請輸入角色名稱'); return; }

        if (roleId) {
            const role = roles.find(r => r.id === roleId);
            if(role) {
                role.name = roleName;
                role.description = roleDesc;
                // 系統角色不更新綁定與顏色
                if (!role.isSystem) {
                    role.linkedModule = roleModule;
                    role.color = roleColor;
                }
            }
        } else {
            const newId = 'role_' + Date.now();
            const newRole = {
                id: newId,
                name: roleName,
                description: roleDesc,
                linkedModule: roleModule,
                color: roleColor,
                isSystem: false
            };
            roles.push(newRole);
            Object.keys(permissions).forEach(permId => { permissions[permId][newId] = 'none'; });
        }

        const modalEl = document.getElementById('roleModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();

        renderRoles();
        renderPermissionTable(); 
        alert(roleId ? '角色已更新' : '角色已新增');
    };
    
    window.exportUsers = function() { alert('匯出 CSV 中...'); };

    // [Task 3] 重置頁籤篩選器
    function resetTabFilters() {
        const deptFilter = document.getElementById('deptFilter');
        const roleFilter = document.getElementById('roleFilter');
        const searchInput = document.getElementById('userSearchInput');
        if (deptFilter) deptFilter.value = '';
        if (roleFilter) roleFilter.value = '';
        if (searchInput) searchInput.value = '';
        searchUsers();

        const matrixSelect = document.getElementById('matrixRoleSelect');
        if (matrixSelect && roles.length > 0) {
            matrixSelect.value = roles[0].id;
            renderPermissionTable();
        }
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
        console.log('初始化權限管理系統 (V10.0 - Admin Locked)...');
        renderRoles();
        renderPermissionTable();
        renderUsersTable();

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.role-select-trigger') && !e.target.closest('.role-portal-dropdown')) {
                closeRoleDropdown();
            }
        });
        window.addEventListener('scroll', closeRoleDropdown, true);

        setTimeout(() => {
            const firstTabTriggerEl = document.querySelector('#permissionTab button[data-bs-target="#roles"]');
            if(firstTabTriggerEl) {
                const tab = bootstrap.Tab.getOrCreateInstance(firstTabTriggerEl);
                tab.show();
            }
        }, 100);

        // 監聽 Tab 點擊事件
        const tabButtons = document.querySelectorAll('#permissionTab button[data-bs-toggle="tab"]');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                resetTabFilters();
            });
        });
    });

})();