// 專案儀表板功能管理
const ProjectDashboard = {
    projectId: '', // 系統內部唯一識別碼 (URL參數)
    currentProject: null, // 儲存當前專案資料

    // 模擬資料庫 (同步 list.js 資料，日期已更新為未來時間)
    mockProjects: [
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
        },
        {
            id: 'EQ25090003',
            projectNo: 'P2509001',
            quotationId: 'LME-11210-PC020',
            name: '鴻海土城廠智慧工廠MES系統',
            owner: '鴻海精密',
            customer: '鴻海土城廠',
            bidDate: '2025-09-10', // 過去日期 (已得標)
            status: 'awarded',
            progress: 100,
            urgent: false,
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
        },
        {
            id: 'EQ25090005',
            projectNo: 'P2509002',
            quotationId: 'LME-11210-ZZ099',
            name: '中鋼高雄廠煉鋼爐設備維護保養',
            owner: '中國鋼鐵',
            customer: '中鋼高雄廠',
            bidDate: '2025-08-05', // 過去日期 (已歸檔)
            status: 'archived',
            progress: 100,
            urgent: false,
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
        },
        // ... (其他資料可視需要調整日期)
    ],
    
    // 模組進度資料 (已將前置作業設為 100%，解鎖投標資料彙整)
    moduleProgress: {
        'erp-auth': 100,
        'basic-data': 100,
        'cost-estimation': 100, // 改為 100
        'cost-indirect': 50, // ★ 新增：專案間接成本進度 (示範先給50%)
        'construction-estimation': 100, // 改為 100
        'procurement-plan': 100, // 改為 100
        'bid-integration': 0, 
        'post-award': 0
    },

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('projectId') || 'EQ25090001'; 

        this.loadProjectData();
        this.updateOverallProgress();
        this.animateProgressBars();
        this.checkModuleAccess();
        this.startProgressAnimation();
        
        console.log(`專案儀表板已初始化 - Project ID: ${this.projectId}`);
    },

    loadProjectData() {
        this.currentProject = this.mockProjects.find(p => p.id === this.projectId);

        if (!this.currentProject) {
            this.currentProject = this.mockProjects[0];
            console.warn('查無此專案 ID，使用預設資料');
        }

        const p = this.currentProject;

        this.setElementText('headerTitle', p.name);
        
        // ★ 移除：不再顯示專案描述
        const headerDesc = document.getElementById('headerDesc');
        if (headerDesc) headerDesc.style.display = 'none';
        // this.setElementText('headerDesc', p.description || '暫無專案描述'); // Removed

        this.setElementText('headerQuotationId', p.quotationId);
        
        let displayProjectNo = '-';
        if (p.projectNo) {
            displayProjectNo = p.projectNo;
        } else if (p.status === 'awarded' || p.status === 'archived') {
            displayProjectNo = p.id; 
        }
        this.setElementText('headerProjectId', displayProjectNo);
        
        this.setElementText('headerOwner', p.owner);
        this.setElementText('headerCustomer', p.customer);
        this.setElementText('headerBidDate', p.bidDate);

        const statusEl = document.getElementById('headerStatus');
        if (statusEl) {
            const statusInfo = this.getStatusInfo(p.status);
            statusEl.textContent = statusInfo.text;
            statusEl.className = 'project-status'; 
        }

        this.calculateRemainingDays(p.bidDate, p.status);
    },

    setElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '-';
    },

    calculateRemainingDays(dateString, status) {
        const el = document.getElementById('headerRemainingDays');
        if (!el || !dateString) return;

        // ★ 修改：統一狀態顯示與顏色邏輯
        if (status === 'awarded') {
            el.textContent = '已得標';
            el.style.color = '#10b981'; // 亮綠色 (在深藍底上清晰)
            el.style.fontWeight = 'bold';
            return;
        }
        
        if (status === 'archived') {
            el.textContent = '已歸檔';
            el.style.color = '#cbd5e1'; // 淺灰白 (在深藍底上清晰)
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(dateString);
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            el.textContent = `${diffDays} 天`;
            // ★ 修改：顏色優化 (在深藍背景上)
            // 剩餘天數多：白色 / 剩餘天數少：亮橘色
            el.style.color = diffDays <= 7 ? '#fbbf24' : '#ffffff'; 
            el.style.fontWeight = 'bold';
        } else if (diffDays === 0) {
            el.textContent = '今天截標';
            el.style.color = '#fbbf24'; // 亮橘色
            el.style.fontWeight = 'bold';
        } else {
            el.textContent = '已過期';
            el.style.color = '#f87171'; // 亮紅色
        }
    },

    getStatusInfo(status) {
        // ★ 修改：統一狀態文字
        const map = {
            'draft': { text: '草稿' },
            'bidding': { text: '報價估算中' },
            'awarded': { text: '已得標' },
            'archived': { text: '已歸檔' } // 統一為已歸檔
        };
        return map[status] || { text: status };
    },

    // ... (其餘功能保持不變) ...
    updateOverallProgress() {
        const totalModules = Object.keys(this.moduleProgress).length;
        const excludedCount = Object.keys(this.moduleProgress).filter(m => this.isModuleLocked(m)).length;
        const activeModules = totalModules - excludedCount; 
        
        let totalProgress = 0;
        let completedModules = 0;
        
        Object.entries(this.moduleProgress).forEach(([module, progress]) => {
            if (!this.isModuleLocked(module)) {
                totalProgress += progress;
                if (progress === 100) completedModules++;
            }
        });
        
        const overallProgress = Math.round(totalProgress / activeModules);
        
        const progressFill = document.getElementById('overallProgressFill');
        if (progressFill) {
            setTimeout(() => {
                progressFill.style.width = overallProgress + '%';
            }, 500);
        }
        
        const statsNumbers = document.querySelectorAll('.progress-stat-number');
        if (statsNumbers.length > 0) {
            statsNumbers[0].textContent = overallProgress + '%';
        }
        if (statsNumbers.length > 1) {
            statsNumbers[1].textContent = `${completedModules}/${activeModules}`;
        }
    },

    animateProgressBars() {
        Object.entries(this.moduleProgress).forEach(([module, progress]) => {
            const progressBar = document.querySelector(`.module-card.${module} .module-progress-fill`);
            if (progressBar) {
                setTimeout(() => {
                    progressBar.style.width = progress + '%';
                }, Math.random() * 1000 + 500);
            }
        });
    },

    startProgressAnimation() {
        const overallProgressFill = document.getElementById('overallProgressFill');
        if (overallProgressFill) {
            overallProgressFill.style.background = 'linear-gradient(90deg, var(--success), var(--info), var(--primary-blue))';
            overallProgressFill.style.backgroundSize = '200% 100%';
            overallProgressFill.style.animation = 'progressGradient 3s ease infinite';
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes progressGradient {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    },

    checkModuleAccess() {
        // ★ 得標後兩張卡片（發包採購詢價／發包預算執行）已開放，不再動態鎖定
        const lockedModules = [];
        
        lockedModules.forEach(module => {
            const moduleCard = document.querySelector(`.module-card.${module}`);
            if (moduleCard) {
                const canAccess = this.canAccessModule(module);
                
                if (!canAccess) {
                    moduleCard.classList.add('locked');
                } else {
                    moduleCard.classList.remove('locked');
                }
            }
        });
    },

    canAccessModule(module) {
        // 將 bid-summary 改為 bid-integration
        // ★ post-award 已開放，不再檢查前置模組進度
        const requirements = {
            'bid-integration': ['cost-estimation', 'construction-estimation', 'procurement-plan']
        };

        if (!requirements[module]) return true;

        return requirements[module].every(reqModule => {
            return this.moduleProgress[reqModule] >= 80; 
        });
    },

    isModuleLocked(module) {
        // ★ post-award 已開放，僅 bid-integration 維持鎖定判斷（用於整體進度統計排除）
        return ['bid-integration'].includes(module);
    },

    handleModuleClick(module) {
        if (this.isModuleLocked(module) && !this.canAccessModule(module)) {
            const requirements = this.getModuleRequirements(module);
            LiangLianSystem.showToast(`請先完成：${requirements.join('、')}`, 'warning');
            return false;
        }
        return true;
    },

    getModuleRequirements(module) {
        // 將 bid-summary 改為 bid-integration
        const requirementNames = {
            'cost-estimation': '成本估算',
            'cost-indirect': '專案間接成本', 
            'construction-estimation': '工程估價',
            'procurement-plan': '發包計畫書',
            'bid-integration': '投標資料彙整' 
        };

        const requirements = {
            'bid-integration': ['cost-estimation', 'cost-indirect', 'construction-estimation', 'procurement-plan'], 
            'post-award': ['bid-integration']
        };

        return (requirements[module] || []).map(req => requirementNames[req]);
    },

    updateModuleProgress(module, progress) {
        this.moduleProgress[module] = progress;
        
        const progressBar = document.querySelector(`.module-card.${module} .module-progress-fill`);
        const progressLabel = document.querySelector(`.module-card.${module} .module-progress-label span:last-child`);
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        if (progressLabel) {
            progressLabel.textContent = progress + '%';
        }
        
        const statusElement = document.querySelector(`.module-card.${module} .module-status`);
        if (statusElement) {
            if (progress === 100) {
                statusElement.textContent = '已完成';
                statusElement.className = 'module-status status-completed';
            } else if (progress > 0) {
                statusElement.textContent = '進行中';
                statusElement.className = 'module-status status-in-progress';
            }
        }
        
        this.checkModuleAccess();
        this.updateOverallProgress();
    }
};

// 模組功能函數
function openERPAuth() {
    if (ProjectDashboard.handleModuleClick('erp-auth')) {
        LiangLianSystem.showToast('開啟報價授權單詳細資訊', 'info');
        window.location.href = `../erp-auth/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openBasicData() {
    if (ProjectDashboard.handleModuleClick('basic-data')) {
        window.location.href = `../basic-data/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openCostEstimation() {
    if (ProjectDashboard.handleModuleClick('cost-estimation')) {
        window.location.href = `../cost-estimation/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openProjectIndirect() {
    if (ProjectDashboard.handleModuleClick('cost-indirect')) {
        window.location.href = `../cost-indirect/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openProcurementPlan() {
    if (ProjectDashboard.handleModuleClick('procurement-plan')) {
        window.location.href = `../cost-outsourcing/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openConstructionEstimation() {
    if (ProjectDashboard.handleModuleClick('construction-estimation')) {
        window.location.href = `../eng-estimation/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openConstructionIndirect() {
    if (ProjectDashboard.handleModuleClick('construction-indirect')) {
        window.location.href = `../eng-indirect/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openConstructionProcurementPlan() {
    if (ProjectDashboard.handleModuleClick('construction-plan')) {
        window.location.href = `../eng-outsourcing/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openBidIntegration() {
    if (ProjectDashboard.handleModuleClick('bid-integration')) {
        window.location.href = `../bid-integration/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openNegotiationSummary() {
    window.location.href = `../negotiation/index.html?projectId=${ProjectDashboard.projectId}`;
}

function openPostAward() {
    if (ProjectDashboard.handleModuleClick('post-award')) {
        window.location.href = `../budget/index.html?projectId=${ProjectDashboard.projectId}`;
    }
}

function openProjectAnalysis() {
    window.location.href = `project_analysis.html?projectId=${ProjectDashboard.projectId}`;
}

function exportProjectData() {
    LiangLianSystem.showToast('匯出專案資料...', 'info');
}

function syncWithERP() {
    LiangLianSystem.showToast('正在與ERP系統同步...', 'info');
    setTimeout(() => {
        LiangLianSystem.showToast('ERP同步完成', 'success');
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
    ProjectDashboard.init();
});