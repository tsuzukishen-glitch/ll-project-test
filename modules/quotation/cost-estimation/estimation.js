/* modules/quotation/cost-estimation/estimation.js */

(function() {
    'use strict';

    // 1. 模擬專案資料
    const projectData = {
        'EQ25090001': {
            projectNo: '',
            quotationNo: 'LME-11210-PE060',
            name: '台積電12廠潔淨室建置工程',
            owner: '台灣積體電路',
            customer: '互助營造',
            bidDate: '2025-11-15',
            deadline: '2025-11-10', 
            status: 'bidding'
        }
    };

    // 單位代碼對照表
    const unitMap = {
        'COST': '成本部', 'DESIGN': '設計部', 'PURCHASE': '採購部', 'PROJ': '專案部'
    };

    // 預設派發的單位人員
    const deptDefaultAssignees = {
        'COST': '張志豪', 'DESIGN': '林書豪', 'PURCHASE': '吳小美', 'PROJ': '王大明'
    };

    // 所有可選人員列表 (供變更人員 Modal 使用)
    const usersList = ['張志豪', '林書豪', '吳小美', '王大明', '李小華', '陳志強', '黃雅婷'];

    // 模擬從邀標單匯入的項目 (移除了 CONST 建造部)
    const sourceBiddingItems = [
        {
            sourceId: 'BID-001', fileName: 'A0AY1GC1_鍋爐與風煙道製裝.xlsx', itemName: '鍋爐與風煙道製裝',
            assignedUnits: ['COST'], totalItems: 45, originalCost: 1580000, quantity: 1
        },
        {
            sourceId: 'BID-T01', fileName: '範本導入: 標準50噸不鏽鋼儲槽 (x50)', itemName: '標準50噸不鏽鋼儲槽',
            assignedUnits: ['COST'], totalItems: 3, originalCost: 0, 
            quantity: 50
        },
        {
            sourceId: 'BID-H02', fileName: '歷史導入: 機房_冰水管路標單.xlsx', itemName: '鴻海高雄廠伺服器機房',
            assignedUnits: ['PURCHASE', 'DESIGN'], totalItems: 120, originalCost: 0, quantity: 1
        }
    ];

    let estimationItems = [];
    let currentProjectMode = null; 
    let currentProjectId = 'EQ25090001';
    
    // ★ 新增：目前排序狀態
    let currentSort = {
        column: '',
        direction: 'asc'
    };

    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        currentProjectId = urlParams.get('projectId') || 'EQ25090001';
        
        loadProjectMode(currentProjectId);

        generateEstimationItems();
        loadProjectInfo(currentProjectId);
        renderEstimationTable(); 
        calculateTotalProjectCost();

        // 若未設定模式，延遲後跳出設定視窗
        if (!currentProjectMode) {
            setTimeout(() => {
                window.openModeSettings(true);
            }, 500);
        }
    }

    function loadProjectMode(projectId) {
        const savedMode = localStorage.getItem(`est_mode_${projectId}`);
        if (savedMode) {
            currentProjectMode = savedMode;
        } else {
            currentProjectMode = null; 
        }
        updateModeButton();
    }

    function updateModeButton() {
        const btn = document.getElementById('modeSettingBtn');
        const label = document.getElementById('currentModeLabel');
        if (!btn || !label) return;

        if (currentProjectMode) {
            const modeText = currentProjectMode === 'matrix' ? '橫式估算' : '直式估算';
            label.textContent = modeText;
            
            btn.classList.remove('btn-outline-danger'); 
            btn.classList.add('btn-outline-secondary');
            
            if(currentProjectMode === 'matrix') {
                label.className = 'text-success fw-bold';
            } else {
                label.className = 'text-primary fw-bold';
            }
        } else {
            label.textContent = '未設定';
            label.className = 'text-danger fw-bold';
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-outline-danger');
        }
    }

    window.openModeSettings = function(isInit = false) {
        if (!isInit && currentProjectMode) {
            if (!confirm('警告：此專案已設定估算模式。\n變更模式將會「重置」部分已設定估算資料！\n確定要重新設定嗎？')) {
                return;
            }
        }
        
        const modalEl = document.getElementById('modeSettingModal');
        const modal = new bootstrap.Modal(modalEl, {
            backdrop: isInit ? 'static' : true,
            keyboard: !isInit
        });
        
        const cancelBtn = document.getElementById('modeModalCancelBtn');
        if (cancelBtn) {
            cancelBtn.style.display = isInit ? 'none' : 'inline-block';
        }

        if (currentProjectMode) {
            const radio = document.querySelector(`input[name="estimationMode"][value="${currentProjectMode}"]`);
            if (radio) radio.checked = true;
            const card = radio.closest('.mode-selection-card');
            if(card) selectCard(card);
        } else {
            document.querySelectorAll('input[name="estimationMode"]').forEach(el => el.checked = false);
            document.querySelectorAll('.mode-selection-card').forEach(c => c.classList.remove('selected'));
        }
        
        modal.show();
    };

    window.confirmProjectMode = function() {
        const selectedRadio = document.querySelector('input[name="estimationMode"]:checked');
        if (!selectedRadio) {
            alert('請選擇一種估算模式');
            return;
        }

        const newMode = selectedRadio.value;
        const isChange = currentProjectMode && currentProjectMode !== newMode;

        currentProjectMode = newMode;
        localStorage.setItem(`est_mode_${currentProjectId}`, newMode);
        
        updateModeButton();

        const modalEl = document.getElementById('modeSettingModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        if (isChange) {
            LiangLianSystem.showToast('估算模式已變更，正在重置專案資料...', 'warning');
            setTimeout(() => {
                generateEstimationItems();
                renderEstimationTable();
                calculateTotalProjectCost();
                LiangLianSystem.showToast('專案資料已重置完成', 'success');
            }, 1000);
        } else {
            LiangLianSystem.showToast('估算模式設定成功', 'success');
        }
    };

    window.openCostDetail = function(estId, estName, estFile, estQty) {
        if (!currentProjectMode) {
            LiangLianSystem.showToast('請先設定本專案的「估算模式」才能開始作業', 'warning');
            window.openModeSettings(); 
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId') || 'EQ25090001';
        
        const targetUrl = `../cost-detail/index.html?projectId=${projectId}&id=${estId}&name=${encodeURIComponent(estName)}&basicInfo=${encodeURIComponent(estFile)}&qty=${estQty}&mode=${currentProjectMode}`;

        if (typeof LiangLianSystem !== 'undefined') {
            LiangLianSystem.showToast(`正在進入：${estName}`, 'info');
        }
        
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 300);
    };

    window.importFromBasicData = function() {
        LiangLianSystem.showToast('正在同步邀標單最新資料...', 'info');
        setTimeout(() => {
            generateEstimationItems();
            renderEstimationTable();
            calculateTotalProjectCost();
            LiangLianSystem.showToast('資料已同步至最新狀態', 'success');
        }, 1000);
    };

    function generateEstimationItems() {
        estimationItems = []; 
        let globalIndex = 0;

        sourceBiddingItems.forEach(source => {
            let loopCount = source.quantity || 1;

            for (let i = 1; i <= loopCount; i++) {
                source.assignedUnits.forEach((unit) => {
                    const baseId = `EST-${source.sourceId.split('-')[1]}_${unit}`;
                    const newId = loopCount > 1 ? `${baseId}-${i}` : baseId;
                    
                    const assignee = deptDefaultAssignees[unit] || '待指派';
                    
                    let displayName = source.itemName;
                    if (loopCount > 1) displayName += ` #${i}`; 

                    const isMain = unit === 'COST';
                    
                    estimationItems.push({
                        _index: globalIndex++, 
                        id: newId,
                        sourceId: source.sourceId,
                        fileName: source.fileName,
                        itemName: displayName,
                        equipNo: '', 
                        equipName: '',
                        assignedUnit: unit,
                        estimator: assignee,
                        deadline: projectData['EQ25090001'].deadline,
                        totalItems: source.totalItems,
                        estimatedCost: isMain ? (source.originalCost / loopCount) : 0, 
                        status: isMain ? (source.originalCost > 0 ? 'processing' : 'pending') : 'pending',
                        progress: isMain ? (source.originalCost > 0 ? 60 : 0) : 0, 
                        selected: false 
                    });
                });
            }
        });
    }

    function loadProjectInfo(id) {
        const data = projectData[id] || projectData['EQ25090001']; 
        if (!data) return;

        setValue('headerTitle', data.name);
        setValue('headerQuotationId', data.quotationNo);
        
        let displayProjectNo = '-';
        if (data.projectNo) displayProjectNo = data.projectNo;
        else if (data.status === 'awarded') displayProjectNo = id;
        setValue('headerProjectId', displayProjectNo);
        
        setValue('headerOwner', data.owner);
        setValue('headerCustomer', data.customer);
        setValue('headerBidDate', data.bidDate);

        const statusEl = document.getElementById('headerStatus');
        const statusMap = { 'bidding': '報價估算中', 'awarded': '已得標', 'draft': '草稿' };
        if(statusEl) statusEl.textContent = statusMap[data.status] || data.status;
    }
    
    // ==========================================
    // ★ 新增：表格標題排序邏輯
    // ==========================================
    window.sortEstimationData = function(column) {
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }
        
        estimationItems.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
            
            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        updateSortIcons();
        renderEstimationTable();
    };

    function updateSortIcons() {
        const allIcons = document.querySelectorAll('.estimation-table th i[id^="icon-"]');
        const allThs = document.querySelectorAll('.estimation-table th.sortable');
        
        allIcons.forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        allThs.forEach(th => {
            th.classList.remove('active-sort');
        });

        if (currentSort.column) {
            const activeIcon = document.getElementById(`icon-${currentSort.column}`);
            const activeTh = activeIcon ? activeIcon.parentElement : null;

            if (activeIcon) {
                activeIcon.className = currentSort.direction === 'asc' 
                    ? 'fas fa-sort-up' 
                    : 'fas fa-sort-down';
            }
            if (activeTh) {
                activeTh.classList.add('active-sort');
            }
        }
    }

    function renderEstimationTable() {
        const tbody = document.getElementById('estimationTableBody');
        if (!tbody) return;

        if (estimationItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <i class="fas fa-file-invoice fa-3x text-muted mb-3 d-block opacity-50"></i>
                        <h6 class="text-muted fw-bold">尚無估算項目</h6>
                        <p class="text-muted small mb-0">尚未匯入或產生任何成本估算項目</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = estimationItems.map((item, index) => {
            const statusInfo = getStatusDisplay(item.status);
            const unitName = unitMap[item.assignedUnit] || item.assignedUnit;

            // 比照專案列表：空值顯示為置中的減號，字體大小統一
            const equipNoDisplay = item.equipNo ? item.equipNo : '<span class="text-muted text-center d-block">-</span>';
            const equipNameDisplay = item.equipName ? item.equipName : '<span class="text-muted text-center d-block">-</span>';

            return `
                <tr style="cursor: pointer; transition: all 0.2s ease; font-size: 0.9rem;" 
                    onmouseover="this.style.backgroundColor='rgba(30, 64, 175, 0.05)'" 
                    onmouseout="this.style.backgroundColor=''"
                    onclick="if(event.target.type !== 'checkbox') openCostDetail('${item.id}', '${item.itemName}', '${item.fileName}', '${item.totalItems}')">
                    <td class="text-center py-3" onclick="event.stopPropagation();">
                        <input type="checkbox" class="form-check-input" value="${index}" ${item.selected ? 'checked' : ''} onchange="updateSelectState(${index}, this.checked)">
                    </td>
                    <td class="text-center py-3">${index + 1}</td>
                    <td class="py-3">
                        <div class="fw-bold text-dark" style="font-size: 0.95rem;">${item.itemName}</div>
                    </td>
                    <td class="text-muted py-3">${equipNoDisplay}</td>
                    <td class="text-muted py-3">${equipNameDisplay}</td>
                    <td class="text-center py-3"><span class="unit-badge">${unitName}</span></td>
                    <td class="py-3">
                        <div class="d-flex align-items-center">
                            <div class="user-avatar-small">${item.estimator.charAt(0)}</div>
                            <span>${item.estimator}</span>
                        </div>
                    </td>
                    <td class="py-3">${item.deadline}</td>
                    <td class="text-center py-3"><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                </tr>
            `;
        }).join('');

        updateSelectAllState();
    }

    // ==========================================
    // ★ 表格勾選邏輯與批次按鈕控制
    // ==========================================
    window.toggleSelectAll = function(checkbox) {
        const isChecked = checkbox.checked;
        estimationItems.forEach(item => item.selected = isChecked);
        renderEstimationTable(); 
    };

    window.updateSelectState = function(index, isChecked) {
        estimationItems[index].selected = isChecked;
        updateSelectAllState();
    };

    function updateSelectAllState() {
        const selectAllBtn = document.getElementById('selectAllBtn');
        const batchActionArea = document.getElementById('batchActionArea');
        const selectedCountBadge = document.getElementById('selectedCountBadge');
        
        const selectedCount = estimationItems.filter(item => item.selected).length;
        
        // 更新全選 Checkbox 狀態
        if (selectAllBtn) {
            if (selectedCount === 0) {
                selectAllBtn.checked = false;
                selectAllBtn.indeterminate = false;
            } else if (selectedCount === estimationItems.length && estimationItems.length > 0) {
                selectAllBtn.checked = true;
                selectAllBtn.indeterminate = false;
            } else {
                selectAllBtn.checked = false;
                selectAllBtn.indeterminate = true;
            }
        }

        // 更新動態出現的操作按鈕區塊
        if (batchActionArea && selectedCountBadge) {
            if (selectedCount > 0) {
                batchActionArea.style.opacity = '1';
                batchActionArea.style.pointerEvents = 'auto';
                selectedCountBadge.textContent = `已選 ${selectedCount} 項`;
            } else {
                batchActionArea.style.opacity = '0';
                batchActionArea.style.pointerEvents = 'none';
            }
        }
    }

    // ==========================================
    // ★ 變更估算人員 Modal 邏輯
    // ==========================================
    let changeAssigneeModalInstance = null;

    window.openChangeAssigneeModal = function() {
        const selectedItems = estimationItems.filter(item => item.selected);
        if (selectedItems.length === 0) {
            LiangLianSystem.showToast('請先勾選要變更估算人員的項目', 'warning');
            return;
        }

        document.getElementById('selectedItemsCount').textContent = `已選擇 ${selectedItems.length} 個項目`;
        
        const selectEl = document.getElementById('newAssigneeSelect');
        selectEl.innerHTML = usersList.map(u => `<option value="${u}">${u}</option>`).join('');

        if (!changeAssigneeModalInstance) {
            changeAssigneeModalInstance = new bootstrap.Modal(document.getElementById('changeAssigneeModal'));
        }
        changeAssigneeModalInstance.show();
    };

    window.confirmChangeAssignee = function() {
        const newAssignee = document.getElementById('newAssigneeSelect').value;
        let count = 0;
        let assignedItems = []; // 收集被指派的項目名稱
        
        estimationItems.forEach(item => {
            if (item.selected) {
                item.estimator = newAssignee;
                item.selected = false; // 更新完成後取消勾選
                assignedItems.push(item.itemName);
                count++;
            }
        });

        changeAssigneeModalInstance.hide();
        renderEstimationTable();
        LiangLianSystem.showToast(`成功變更 ${count} 個項目的估算人員為 ${newAssignee}`, 'success');

        // 觸發發送通知信與推播
        if (count > 0) {
            sendNotificationEmail(newAssignee, assignedItems);
        }
    };

    // ★ 新增：模擬寄發通知信與系統推播
    function sendNotificationEmail(assignee, items) {
        // 模擬 API 請求延遲 (600ms 後發送)
        setTimeout(() => {
            // 1. 顯示寄信成功提示 (模擬 Email 發送)
            LiangLianSystem.showToast(`已自動寄發指派通知信至 ${assignee} 的電子信箱`, 'info');
            
            // 2. 寫入系統通知 (呼叫母版腳本功能，右上角鈴鐺會跳出通知)
            if (typeof LiangLianSystem.addNewNotification === 'function') {
                const projName = projectData[currentProjectId] ? projectData[currentProjectId].name : currentProjectId;
                LiangLianSystem.addNewNotification({
                    title: '新估算任務指派',
                    content: `您已被指派參與「${projName}」的 ${items.length} 項成本估算作業。`,
                    type: 'info'
                });
            }
        }, 600);
    }

    function calculateTotalProjectCost() {
        const total = estimationItems.reduce((sum, item) => sum + item.estimatedCost, 0);
        const el = document.getElementById('headerTotalCost');
        if(el) el.textContent = total.toLocaleString();
    }

    function getStatusDisplay(status) {
        switch(status) {
            case 'completed': return { text: '已完成', class: 'status-completed' };
            case 'processing': return { text: '估算中', class: 'status-processing' };
            default: return { text: '待處理', class: 'status-pending' };
        }
    }

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
    }

    document.addEventListener('DOMContentLoaded', init);
})();