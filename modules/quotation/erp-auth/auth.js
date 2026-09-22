/* modules/quotation/erp-auth/auth.js */

(function() {
    'use strict';

    // 1. 模擬 ERP 資料庫 (已更新結構)
    const erpData = {
        'EQ25090001': {
            // Header Info & Identifiers
            quotationNo: 'LME-11210-PE060',
            projectNo: '', // 尚未得標
            projectTitle: '台積電12廠潔淨室建置工程',
            status: 'bidding',
            
            // Project Basic & Dates
            owner: '台灣積體電路',
            customer: '互助營造',
            bidDate: '2025-11-15',
            scope: '1. 無塵室隔間牆系統 (含門窗)\n2. 高架地板系統\n3. 循環風機濾網機組 (FFU)\n4. 製程冷卻水系統 (PCW)\n5. 測試與平衡 (TAB)',
            inquiryDate: '2025-09-01',
            customerReqDate: '2025-11-15',
            projStart: '2026-01-01',
            projEnd: '2026-12-31',

            // Manager Info
            manager: '張育霖',
            department: '工程業務部',
            jobTitle: '資深業務',

            // Support Teams (新結構)
            supportTeams: [
                {
                    dept: '工程部',
                    empId: '00001100',
                    name: '王小明',
                    dueDate: '2025-11-10',
                    hours: 80
                },
                {
                    dept: '採購部',
                    empId: '00004563',
                    name: '陳採購',
                    dueDate: '2025-11-08',
                    hours: 40
                },
                {
                    dept: '品保部',
                    empId: '00007895',
                    name: '林品管',
                    dueDate: '2025-11-12',
                    hours: 24
                }
            ],
            
            syncTime: '2025-10-01 09:00:00'
        },
        'EQ25090003': {
            quotationNo: 'LME-11210-PC020',
            projectNo: 'P2509001',
            projectTitle: '鴻海土城廠智慧工廠MES系統',
            status: 'awarded',
            
            owner: '鴻海精密',
            customer: '鴻海土城廠',
            bidDate: '2025-09-10',
            scope: '1. MES 軟體授權\n2. 現場設備 IoT 模組安裝\n3. 戰情室電視牆建置',
            inquiryDate: '2025-08-01',
            customerReqDate: '2025-09-10',
            projStart: '2025-10-01',
            projEnd: '2026-03-31',

            manager: '李小華',
            department: '軟體開發部',
            jobTitle: '專案經理',

            supportTeams: [
                {
                    dept: '軟體部',
                    empId: 'S00111',
                    name: '趙工程',
                    dueDate: '2025-09-05',
                    hours: 120
                },
                {
                    dept: '資訊部',
                    empId: 'I00222',
                    name: '錢網管',
                    dueDate: '2025-09-05',
                    hours: 40
                }
            ],
            
            syncTime: '2025-09-15 14:00:00'
        }
    };

    // 初始化
    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId') || 'EQ25090001';
        loadAuthData(projectId);
    }

    // 載入資料
    function loadAuthData(projectId) {
        const data = erpData[projectId];

        if (!data) {
            loadAuthData('EQ25090001'); // Fallback
            return;
        }

        // ============ 1. 更新 Header ============
        setValue('headerTitle', data.projectTitle);
        setValue('headerQuotationId', data.quotationNo);
        setValue('headerOwner', data.owner);
        setValue('headerCustomer', data.customer);
        setValue('headerBidDate', data.bidDate);

        let displayProjectNo = data.projectNo || '-';
        if (data.status === 'awarded' && !data.projectNo) displayProjectNo = projectId;
        setValue('headerProjectId', displayProjectNo);

        const statusInfo = getStatusInfo(data.status);
        const statusEl = document.getElementById('headerStatus');
        if(statusEl) statusEl.textContent = statusInfo.text;
        
        calculateRemainingDays(data.bidDate, data.status);

        // ============ 2. 更新新版表單欄位 ============
        
        // 識別資訊
        setValue('fieldQuotationNo', data.quotationNo);
        setValue('fieldProjectNo', data.projectNo || '(尚未產生)');

        // 專案基本資料
        setValue('fieldProjectTitle', data.projectTitle);
        setValue('fieldOwner', data.owner);
        setValue('fieldCustomer', data.customer);
        setValue('fieldBidDate', data.bidDate);
        setValue('fieldScope', data.scope);

        // 重要日程
        setValue('fieldInquiryDate', data.inquiryDate);
        setValue('fieldCustomerReqDate', data.customerReqDate);
        setValue('fieldProjStart', data.projStart);
        setValue('fieldProjEnd', data.projEnd);

        // 報價負責人
        setValue('fieldManager', data.manager);
        setValue('fieldDept', data.department);
        setValue('fieldTitle', data.jobTitle);

        // ============ 3. 生成支援部門表格 (新功能) ============
        renderSupportTable(data.supportTeams);
        
        // 其他
        setValue('lastSyncTime', '最後同步：' + data.syncTime);
    }

    // 渲染支援部門表格的函數
    function renderSupportTable(teams) {
        const tbody = document.getElementById('supportDeptTableBody');
        if (!tbody) return;

        if (!teams || teams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">無支援部門資料</td></tr>';
            return;
        }

        let html = '';
        teams.forEach(item => {
            html += `
                <tr>
                    <td class="fw-bold text-primary">${item.dept}</td>
                    <td>${item.empId}</td>
                    <td>${item.name}</td>
                    <td class="text-danger">${item.dueDate}</td>
                    <td>${item.hours}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    // 輔助函式：設定值
    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = value || '-';
            } else {
                el.textContent = value || '-';
            }
        }
    }

    // 輔助函式：狀態文字
    function getStatusInfo(status) {
        const map = {
            'draft': { text: '草稿' },
            'bidding': { text: '報價估算中' },
            'awarded': { text: '已得標' },
            'archived': { text: '已歸檔' }
        };
        return map[status] || { text: status };
    }

    // 輔助函式：計算剩餘天數
    function calculateRemainingDays(dateString, status) {
        const el = document.getElementById('headerRemainingDays');
        if (!el || !dateString) return;

        if (status === 'awarded') {
            el.textContent = '已得標';
            el.style.color = '#10b981';
            el.style.fontWeight = 'bold';
            return;
        }
        
        if (status === 'archived') {
            el.textContent = '已歸檔';
            el.style.color = '#cbd5e1';
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(dateString);
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            el.textContent = `${diffDays} 天`;
            el.style.color = diffDays <= 7 ? '#fbbf24' : '#ffffff'; 
            el.style.fontWeight = 'bold';
        } else if (diffDays === 0) {
            el.textContent = '今天截標';
            el.style.color = '#fbbf24';
            el.style.fontWeight = 'bold';
        } else {
            el.textContent = '已過期';
            el.style.color = '#f87171';
        }
    }

    // ERP 同步功能
    window.syncERPAuth = function() {
        const btn = document.getElementById('btnSync');
        const originalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>同步中...';

        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            
            const now = new Date().toLocaleString('zh-TW', { hour12: false });
            document.getElementById('lastSyncTime').textContent = '最後同步：' + now;
            
            if (typeof LiangLianSystem !== 'undefined') {
                LiangLianSystem.showToast('ERP 資料同步完成', 'success');
            } else {
                alert('ERP 資料同步完成');
            }
        }, 1500);
    };

    document.addEventListener('DOMContentLoaded', init);

})();