/* assets/js/layout_loader.js - V4.0 側邊欄鎖定防護機制版 */

document.addEventListener("DOMContentLoaded", function() {
    const assetsPath = window.ASSETS_PATH || ''; 
    const sidebarType = window.SIDEBAR_TYPE || 'global';
    
    // 1. 從 URL 獲取當前 projectId
    const urlParams = new URLSearchParams(window.location.search);
    const currentProjectId = urlParams.get('projectId');
    
    const breadcrumbs = window.BREADCRUMBS || [
        { name: '首頁', link: `${assetsPath}core/home/index.html` }
    ];

    // ==========================================
    // Part A: 生成 Header (頂部導航)
    // ==========================================
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        const breadcrumbHTML = breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            let finalLink = item.link;
            if (currentProjectId && finalLink && finalLink !== '#' && !finalLink.endsWith('project-list/index.html')) {
                const separator = finalLink.includes('?') ? '&' : '?';
                finalLink = `${finalLink}${separator}projectId=${currentProjectId}`;
            }

            if (isLast) {
                return `<li class="breadcrumb-item active">${item.name}</li>`;
            } else if (item.link && item.link !== '') {
                return `<li class="breadcrumb-item"><a href="${finalLink}">${item.name}</a></li>`;
            } else {
                return `<li class="breadcrumb-item text-muted">${item.name}</li>`;
            }
        }).join('');

        const headerHTML = `
        <header class="top-header d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <button class="sidebar-toggle me-3" id="sidebarToggle" title="縮合/展開側邊欄">
                    <i class="fas fa-bars" id="toggleIcon"></i>
                </button>
                
                <button class="btn btn-outline-secondary d-md-none me-3" id="mobileSidebarToggle" title="手機版選單">
                    <i class="fas fa-bars"></i>
                </button>

                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        ${breadcrumbHTML}
                    </ol>
                </nav>
            </div>
            
            <div class="d-flex align-items-center gap-3">
                <div class="position-relative" id="notificationArea">
                    <button class="notification-btn" id="notificationBtn" title="通知">
                        <i class="fas fa-bell"></i>
                        <span class="notification-count" id="notificationCount">0</span>
                    </button>
                    
                    <div class="notification-dropdown" id="notificationDropdown">
                        <div class="notification-header">
                            <span>系統通知</span>
                            <button class="btn btn-sm btn-outline-primary" onclick="LiangLianSystem.markAllNotificationsAsRead()">
                                全部已讀
                            </button>
                        </div>
                        <div class="notification-body">
                            <!-- 由 JS 動態載入 -->
                        </div>
                    </div>
                </div>
                
                <div class="user-dropdown">
                    <div class="user-info d-flex align-items-center" data-bs-toggle="dropdown" style="cursor: pointer;">
                        <div class="user-avatar">張</div>
                        <div>
                            <div class="fw-bold mb-0">張育霖</div>
                            <small class="text-muted">業務部</small>
                        </div>
                        <i class="fas fa-chevron-down ms-2 text-muted"></i>
                    </div>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item text-danger" href="#" onclick="LiangLianSystem.logout(); return false;">
                            <i class="fas fa-sign-out-alt me-2"></i>登出
                        </a></li>
                    </ul>
                </div>
            </div>
        </header>
        `;
        
        headerPlaceholder.innerHTML = headerHTML;
    }

    // ==========================================
    // Part B: 生成 Sidebar (側邊欄)
    // ==========================================
    let sidebarContent = '';

    // 加入 isLocked 參數
    const createLink = (url, icon, text, isLocked = false) => {
        // 如果該模組處於鎖定狀態
        if (isLocked) {
            return `
            <a href="#" class="nav-link" onclick="if(window.LiangLianSystem) window.LiangLianSystem.showToast('前置作業尚未完成，此模組目前鎖定中', 'warning'); return false;" data-tooltip="${text} (未解鎖)" style="opacity: 0.6; cursor: not-allowed; background-color: rgba(0,0,0,0.1);">
                <i class="fas ${icon}"></i> 
                <span class="nav-link-text">${text}</span>
                <i class="fas fa-lock ms-auto" style="font-size: 0.8rem; opacity: 0.7;"></i>
            </a>`;
        }

        let finalUrl = url;
        if (currentProjectId && url !== '#' && !url.includes('core/home') && !url.endsWith('project-list/index.html')) {
            const separator = url.includes('?') ? '&' : '?';
            finalUrl = `${url}${separator}projectId=${currentProjectId}`;
        }

        return `
        <a href="${finalUrl}" class="nav-link" data-tooltip="${text}">
            <i class="fas ${icon}"></i> 
            <span class="nav-link-text">${text}</span>
        </a>`;
    };

    if (sidebarType === 'project') {
        sidebarContent = `
        <div class="nav-section">
            ${createLink(`${assetsPath}core/home/index.html`, 'fa-home', '回系統首頁')}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">專案管理</div>
            ${createLink('../project-list/index.html', 'fa-list-ul', '專案列表')}
            ${createLink('../project-dashboard/index.html', 'fa-tachometer-alt', '專案儀表板')}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">估算作業</div>
            ${createLink('../erp-auth/index.html', 'fa-file-contract', '報價授權單')}
            ${createLink('../basic-data/index.html', 'fa-edit', '邀標單資料')}
            ${createLink('../cost-estimation/index.html', 'fa-calculator', '成本估算')}
            ${createLink('../cost-indirect/index.html', 'fa-industry', '人力間接成本')}
            ${createLink('../cost-outsourcing/index.html', 'fa-file-upload', '成本發包計劃')}
            ${createLink('../eng-estimation/index.html', 'fa-calculator', '工程估算')}
            ${createLink('../eng-indirect/index.html', 'fa-industry', '工程間接成本')}
            ${createLink('../eng-outsourcing/index.html', 'fa-file-upload', '工程發包計劃')}
            ${createLink('../bid-integration/index.html', 'fa-file-contract', '估算價格檢討')}
            ${createLink('../negotiation/index.html', 'fas fa-comments-dollar', '議價價格檢討')}
            ${createLink('../budget/index.html', 'fa-sack-dollar', '專案預算管理')}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">查詢管理</div>
            ${createLink('../query/index.html', 'fa-search', '查詢中心')}
            ${createLink('../template-list/index.html', 'fa-database', '範本管理')}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">基礎設定</div>
            ${createLink('../cost-code/index.html', 'fa-cogs', '成本代碼設定')}
            ${createLink('../material-code/index.html', 'fa-database', '材料編碼設定')}
            ${createLink('#', 'fa-cogs', '施工代碼設定', true)}
            ${createLink('../salary/index.html', 'fa-database', '薪資津貼設定')}
        </div>
        `;
    } else if (sidebarType === 'quotation-entry') {
        sidebarContent = `
        <div class="nav-section">
            ${createLink(`${assetsPath}core/home/index.html`, 'fa-home', '回系統首頁')}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">專案管理</div>
            ${createLink('../project-list/index.html', 'fa-list-ul', '專案列表')}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">查詢管理</div>
            ${createLink('../query/index.html', 'fa-search', '查詢中心')}
            ${createLink('../template-list/index.html', 'fa-database', '範本管理',)}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">基礎設定</div>
            ${createLink('../cost-code/index.html', 'fa-cogs', '成本代碼設定')}
            ${createLink('../material-code/index.html', 'fa-cogs', '材料編碼設定')}
            ${createLink('#', 'fa-cogs', '施工代碼設定', true)}
            ${createLink('../salary/index.html', 'fa-cogs', '薪資津貼設定')}
        </div>
        `;
    } else {
        // Global
        sidebarContent = `
        <div class="nav-section">
            ${createLink(`${assetsPath}core/home/index.html`, 'fa-home', '首頁')}
        </div>
        <div class="nav-section">
            <div class="nav-section-title">功能模組</div>
            ${createLink(`${assetsPath}modules/quotation/project-list/index.html`, 'fa-calculator', '報價估算系統')}
            ${createLink(`${assetsPath}modules/gas-detection/index.html`, 'fa-triangle-exclamation', '氣體洩漏偵測')} 
            <!-- ${createLink('#', 'fa-calendar-alt', '派工報工系統')} -->
            <!-- ${createLink('#', 'fa-map-marker-alt', '人員定位系統')} -->
        </div>
        <div class="nav-section">
            <div class="nav-section-title">系統管理</div>
            ${createLink(`${assetsPath}core/system-admin/user-management/index.html`, 'fa-users-cog', '員工管理')}
            ${createLink(`${assetsPath}core/system-admin/permission-management/index.html`, 'fa-shield-halved', '權限管理')}
        </div>
        `;
    }

    const sidebarHTML = `
    <nav class="sidebar" id="sidebar" style="overflow-x: hidden;">
        <div class="sidebar-header">
            <img src="${assetsPath}assets/images/LL-logo.jpg" alt="良聯工業" class="sidebar-logo-img">
            <div class="logo-text">
                <h6 class="mb-0 fw-bold">良聯｜工程管理平台</h6>
            </div>
        </div>
        ${sidebarContent}
    </nav>
    `;

    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
        sidebarPlaceholder.innerHTML = sidebarHTML;
    }

    highlightCurrentPage();
    
    if (window.LiangLianSystem && typeof window.LiangLianSystem.init === 'function') {
        window.LiangLianSystem.initSidebar();
        window.LiangLianSystem.bindEvents(); 
    }
});

function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(l => l.classList.remove('active'));

    links.forEach(link => {
        let href = link.getAttribute('href');
        if (!href || href === '#') return;
        
        const cleanHref = href.split('?')[0].replace(/\.\.\//g, '').replace('./', '');
        
        if (currentPath.endsWith(cleanHref)) {
            link.classList.add('active');
            return;
        }
        
        const folderName = cleanHref.replace('/index.html', '');
        if (folderName.length > 0 && currentPath.includes(folderName)) {
            link.classList.add('active');
        }
    });
}