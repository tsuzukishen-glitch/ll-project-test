/* modules/quotation/eng-estimation/eng_estimation.js */

(function() {
    'use strict';

    // 模擬專案基本資料
    const projectData = {
        'EQ25090001': {
            projectNo: 'P25-09-001',
            quotationNo: 'LME-11210-PE060',
            name: '台積電12廠潔淨室建置工程',
            owner: '台灣積體電路',
            customer: '互助營造',
            bidDate: '2025-11-15',
            status: 'bidding'
        }
    };

    // 模擬工程項目資料 
    let engineeringItems = [
        {
            id: 'ENG-001',
            name: '現場管線安裝工程',
            location: '無塵室 A區',
            unit: '建造部',
            unitClass: 'build',
            assignee: '陳建國',
            deadline: '2025-11-10', // 替換原本的 duration
            cost: 2500000,
            status: 'processing',
            selected: false
        },
        {
            id: 'ENG-002',
            name: '大型設備吊裝定位',
            location: '廠房 1F',
            unit: '建造部',
            unitClass: 'build',
            assignee: '陳建國',
            deadline: '2025-11-12',
            cost: 850000,
            status: 'completed',
            selected: false
        },
        {
            id: 'ENG-003',
            name: '系統測試與驗收作業',
            location: '全廠區',
            unit: '建造部',
            unitClass: 'build',
            assignee: '陳建國',
            deadline: '2025-11-15',
            cost: 0,
            status: 'pending',
            selected: false
        }
    ];

    function init() {
        loadProjectInfo('EQ25090001');
        renderTable();
    }

    // 載入專案表頭資訊
    function loadProjectInfo(id) {
        const data = projectData[id];
        if (!data) return;

        document.getElementById('headerTitle').textContent = data.name;
        document.getElementById('headerQuotationId').textContent = data.quotationNo;
        document.getElementById('headerProjectId').textContent = data.projectNo || id;
        
        const ownerEl = document.getElementById('headerOwner');
        if (ownerEl) ownerEl.textContent = data.owner || '-';
        
        const customerEl = document.getElementById('headerCustomer');
        if (customerEl) customerEl.textContent = data.customer || '-';
        
        const bidDateEl = document.getElementById('headerBidDate');
        if (bidDateEl) bidDateEl.textContent = data.bidDate || '-';
        
        const statusEl = document.getElementById('headerStatus');
        if (statusEl) {
            statusEl.textContent = data.status === 'bidding' ? '估算作業中' : data.status;
        }
    }

    // 渲染表格
    function renderTable() {
        const tbody = document.getElementById('engineeringTableBody');
        let totalCost = 0;

        if (!tbody) return;

        if (engineeringItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">目前尚無工程估算項目</td></tr>`;
            document.getElementById('headerTotalCost').textContent = '0';
            return;
        }

        tbody.innerHTML = engineeringItems.map((item, index) => {
            totalCost += item.cost;
            const statusInfo = getStatusDisplay(item.status);
            const assigneeAvatar = item.assignee !== '待指派' ? item.assignee.charAt(0) : '?';
            
return `
                <tr style="cursor: pointer; font-size: 0.9rem;" onmouseover="this.style.backgroundColor='rgba(30, 64, 175, 0.05)'" onmouseout="this.style.backgroundColor=''" onclick="if(event.target.type !== 'checkbox') openEngineeringDetail('${item.id}', '${item.name}')">
                    <td class="text-center py-3" onclick="event.stopPropagation();">
                        <input type="checkbox" class="form-check-input" ${item.selected ? 'checked' : ''} onchange="window.updateSelectState(${index}, this.checked)">
                    </td>
                    <td class="text-center py-3">${index + 1}</td>
                    <td class="py-3 fw-bold text-dark" style="font-size: 0.95rem;">${item.name}</td>
                    <td class="py-3 text-muted">${item.location}</td>
                    <td class="text-center py-3">
                        <span class="unit-badge ${item.unitClass}">${item.unit}</span>
                    </td>
                    <td class="py-3">
                        <div class="d-flex align-items-center">
                            <div class="user-avatar-small ${item.assignee === '待指派' ? 'bg-secondary' : ''}">${assigneeAvatar}</div>
                            <span class="${item.assignee === '待指派' ? 'text-danger' : ''}">${item.assignee}</span>
                        </div>
                    </td>
                    <td class="py-3">${item.deadline}</td>
                    <!-- 將估算金額的欄位設定為 display: none 隱藏 -->
                    <td class="py-3 text-end fw-bold" style="display: none;">${item.cost > 0 ? item.cost.toLocaleString() : '-'}</td>
                    <td class="text-center py-3">
                        <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                    </td>
                </tr>
            `;
        }).join('');

        const totalCostEl = document.getElementById('headerTotalCost');
        if (totalCostEl) totalCostEl.textContent = totalCost.toLocaleString();
        
        updateBatchUI();
    }

    // 狀態轉換
    function getStatusDisplay(status) {
        switch(status) {
            case 'completed': return { text: '已完成', class: 'status-completed' };
            case 'processing': return { text: '估算中', class: 'status-processing' };
            default: return { text: '待處理', class: 'status-pending' };
        }
    }

    // 全選邏輯
    window.toggleSelectAll = function(checkbox) {
        engineeringItems.forEach(item => item.selected = checkbox.checked);
        renderTable();
    };

    // 單選邏輯
    window.updateSelectState = function(index, isChecked) {
        engineeringItems[index].selected = isChecked;
        updateBatchUI();
    };

    // 更新批次操作介面
    function updateBatchUI() {
        const selectedCount = engineeringItems.filter(item => item.selected).length;
        const batchArea = document.getElementById('batchActionArea');
        const selectAllBtn = document.getElementById('selectAllBtn');

        if (selectAllBtn) {
            selectAllBtn.checked = selectedCount === engineeringItems.length && selectedCount > 0;
            selectAllBtn.indeterminate = selectedCount > 0 && selectedCount < engineeringItems.length;
        }

        if (batchArea) {
            if (selectedCount > 0) {
                batchArea.style.opacity = '1';
                batchArea.style.pointerEvents = 'auto';
                document.getElementById('selectedCountBadge').textContent = `已選 ${selectedCount} 項`;
            } else {
                batchArea.style.opacity = '0';
                batchArea.style.pointerEvents = 'none';
            }
        }
    }

    // 開啟工程估算工作台
    window.openEngineeringDetail = function(id, name) {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId') || 'EQ25090001';
        
        if (typeof LiangLianSystem !== 'undefined') {
            LiangLianSystem.showToast(`正在進入：${name}`, 'info');
        }
        
        setTimeout(() => {
            window.location.href = `../eng-detail/index.html?projectId=${projectId}&id=${id}&name=${encodeURIComponent(name)}`;
        }, 300);
    };


    // 打開變更人員 Modal
    window.openChangeAssigneeModal = function() {
        const selectedItems = engineeringItems.filter(item => item.selected);
        if (selectedItems.length === 0) {
            if (window.LiangLianSystem) LiangLianSystem.showToast('請先勾選項目', 'warning');
            return;
        }

        document.getElementById('selectedItemsCount').textContent = `已選擇 ${selectedItems.length} 個工程項目`;
        const modal = new bootstrap.Modal(document.getElementById('changeAssigneeModal'));
        modal.show();
    };

    // 確認變更人員
    window.confirmChangeAssignee = function() {
        const newAssignee = document.getElementById('newAssigneeSelect').value;
        let count = 0;
        
        engineeringItems.forEach(item => {
            if (item.selected) {
                item.assignee = newAssignee;
                item.status = newAssignee !== '待指派' ? 'processing' : 'pending';
                item.selected = false;
                count++;
            }
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('changeAssigneeModal'));
        modal.hide();
        
        renderTable();
        
        if(window.LiangLianSystem) {
            LiangLianSystem.showToast(`已成功指派 ${count} 個項目的工程估算人員`, 'success');
        } else {
            alert(`已成功指派 ${count} 個項目的工程估算人員`);
        }
    };

    // 模擬同步成本估算按鈕
    window.syncFromCostEstimation = function() {
        if(window.LiangLianSystem) {
            LiangLianSystem.showToast('正在與成本估算資料同步...', 'info');
            setTimeout(() => LiangLianSystem.showToast('同步完成！', 'success'), 1000);
        } else {
            alert('正在同步資料...');
        }
    };

    // 啟動初始化
    document.addEventListener('DOMContentLoaded', init);
})();