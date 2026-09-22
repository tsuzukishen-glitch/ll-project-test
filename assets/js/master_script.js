/* 良聯工程管理系統 - 母版腳本 V2.3 (修正啟動邏輯) */

const LiangLianSystem = {
    // ========== 系統配置 ==========
    config: {
        currentUser: {
            id: 'user001',
            name: '張育霖',
            role: '業務經理',
            department: '業務部',
            avatar: '張',
            email: 'chang@lianglian.com.tw',
            phone: '0912-345-678',
            ext: '101'
        },
        notifications: {
            unreadCount: 3,
            items: [
                { id: 'n1', title: '報價單待簽核', content: '台積電專案 LME-11210-PE060 需要您的核准', time: '10分鐘前', type: 'urgent', read: false },
                { id: 'n2', title: '新專案指派', content: '您已被指派為「聯電8廠升級案」的專案經理', time: '2小時前', type: 'info', read: false },
                { id: 'n3', title: '系統維護通知', content: '系統將於今晚 22:00 進行例行維護', time: '1天前', type: 'warning', read: false }
            ]
        }
    },

    // ========== 系統初始化 ==========
    init() {
        console.log('良聯系統核心初始化...');
        
        // ★★★ 優先檢查瀏覽器 ★★★
        // this.checkBrowser(); // 暫時註解掉：隱藏遮罩功能

        // 注意：這裡不直接 bindEvents，因為 DOM 可能還沒由 layout_loader 生成
        // bindEvents 會由 layout_loader 生成完畢後主動呼叫
    },

    // ========== ★★★ 瀏覽器檢測功能 ★★★ ==========
    checkBrowser() {
        const userAgent = navigator.userAgent;
        // 檢查是否包含 "Edg" (Chromium Edge 的標識)
        // 注意：Edge 的 User Agent 通常包含 "Edg/"，Chrome 則無
        const isEdge = userAgent.indexOf("Edg") > -1;

        console.log('[瀏覽器檢測]', isEdge ? '是 Edge 瀏覽器' : '非 Edge 瀏覽器', userAgent);

        // 如果不是 Edge，顯示警告遮罩
        if (!isEdge) {
            this.showBrowserWarning();
        }
    },

    showBrowserWarning() {
        console.log('顯示瀏覽器警告遮罩...');
        // 獲取當前網址
        const currentUrl = window.location.href;
        // Windows 特有的 Edge 開啟協議
        const edgeProtocolUrl = `microsoft-edge:${currentUrl}`;

        const warningHtml = `
            <div class="browser-warning-overlay">
                <div class="browser-warning-modal">
                    <div class="browser-warning-icon">
                       <img src="../../../assets/images/edge-logo.png" alt="Microsoft Edge">
                    </div>
                    <h3 class="browser-warning-title">請使用 Microsoft Edge</h3>
                    <p class="browser-warning-desc">
                        為了確保網站功能完整性與工程符號正確顯示，<br>
                        本平台<strong>僅支援 Microsoft Edge 瀏覽器</strong>。<br>
                        ⚠ 偵測到您目前使用其他瀏覽器。
                    </p>
                    <div class="browser-btn-group">
                        <a href="${edgeProtocolUrl}" class="btn-edge">
                            <i class="fab fa-windows"></i>
                            在 Edge 中開啟此頁面
                        </a>
                        <button onclick="LiangLianSystem.copyCurrentUrl()" class="btn-copy-link">
                            <i class="fas fa-copy me-2"></i>
                            複製網址自行開啟
                        </button>
                    </div>
                    <div class="mt-3">
                        <small class="text-muted" style="font-size: 0.8rem;">
                            如果您在使用上有任何疑問，請聯繫資訊部門。
                        </small>
                    </div>
                </div>
            </div>
        `;

        // 確保 body 存在後再插入
        if (document.body) {
            document.body.insertAdjacentHTML('afterbegin', warningHtml);
            document.body.style.overflow = 'hidden';
        } else {
            // 如果腳本在 head 執行且 body 還沒好，等待載入
            document.addEventListener('DOMContentLoaded', () => {
                document.body.insertAdjacentHTML('afterbegin', warningHtml);
                document.body.style.overflow = 'hidden';
            });
        }
    },

    copyCurrentUrl() {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            const btn = document.querySelector('.btn-copy-link');
            const originalContent = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-check me-2 text-success"></i> 已複製！請至 Edge 貼上';
            btn.style.borderColor = '#22c55e';
            btn.style.color = '#22c55e';
            
            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 3000);
        }).catch(err => {
            console.error('複製失敗:', err);
            alert('複製失敗，請手動複製網址列的連結');
        });
    },

    // ========== 事件綁定 ==========
    bindEvents() {
        console.log('綁定系統事件...');
        
        // 1. 側邊欄切換
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileToggle = document.getElementById('mobileSidebarToggle');
        
        // 先移除舊監聽器 (防止重複綁定)
        if (sidebarToggle) {
            const newBtn = sidebarToggle.cloneNode(true);
            sidebarToggle.parentNode.replaceChild(newBtn, sidebarToggle);
            newBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (mobileToggle) {
            const newBtn = mobileToggle.cloneNode(true);
            mobileToggle.parentNode.replaceChild(newBtn, mobileToggle);
            newBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        // 2. 通知按鈕
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            const newBtn = notificationBtn.cloneNode(true);
            notificationBtn.parentNode.replaceChild(newBtn, notificationBtn);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationDropdown();
            });
        }

        // 3. 點擊外部關閉通知與選單
        document.addEventListener('click', (e) => {
            const notificationArea = document.getElementById('notificationArea');
            const dropdown = document.getElementById('notificationDropdown');
            
            if (dropdown && dropdown.classList.contains('show')) {
                if (notificationArea && !notificationArea.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            }
            
            // 手機版側邊欄點擊外部關閉
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('mobileSidebarToggle');
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('show')) {
                if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                    sidebar.classList.remove('show');
                }
            }
        });

        // 4. 側邊欄連結亮燈
        this.highlightCurrentPage();
        
        // 5. 初始化通知
        this.renderNotifications();
    },

    // ========== 側邊欄管理 ==========
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('collapsed');
            
            // 儲存狀態
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
        }
    },

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    },

    initSidebar() {
        // 恢復縮合狀態
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (isCollapsed && sidebar && mainContent) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('collapsed');
        }
    },

    // ========== 通知系統 ==========
    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    },

    renderNotifications() {
        const container = document.querySelector('#notificationDropdown .notification-body');
        const countBadge = document.getElementById('notificationCount');
        
        if (!container) return;

        const items = this.config.notifications.items;
        const unreadCount = items.filter(i => !i.read).length;

        // 更新紅點
        if (countBadge) {
            countBadge.textContent = unreadCount;
            countBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        if (items.length === 0) {
            container.innerHTML = '<div class="p-3 text-center text-muted">暫無通知</div>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="notification-item ${item.read ? '' : 'unread'}" onclick="LiangLianSystem.readNotification('${item.id}')">
                <div class="notification-title">
                    <i class="fas ${this.getNotificationIcon(item.type)} me-2"></i>
                    ${item.title}
                </div>
                <div class="notification-content">${item.content}</div>
                <div class="notification-time">${item.time}</div>
            </div>
        `).join('');
    },

    getNotificationIcon(type) {
        const icons = {
            urgent: 'fa-exclamation-circle text-danger',
            warning: 'fa-exclamation-triangle text-warning',
            info: 'fa-info-circle text-info',
            success: 'fa-check-circle text-success'
        };
        return icons[type] || 'fa-bell';
    },

    readNotification(id) {
        const item = this.config.notifications.items.find(i => i.id === id);
        if (item) {
            item.read = true;
            this.renderNotifications();
            // 可以在這裡加入跳轉邏輯
        }
    },

    markAllNotificationsAsRead() {
        this.config.notifications.items.forEach(i => i.read = true);
        this.renderNotifications();
        this.showToast('所有通知已標記為已讀', 'success');
    },

    // ========== 使用者面板 ==========
    openCurrentUserPanel() {
        const user = this.config.currentUser;
        
        // 填入資料
        this.setElementText('panelUserName', user.name);
        this.setElementText('panelUserTitle', `${user.department} - ${user.role}`);
        this.setElementText('panelUserId', user.id);
        this.setElementText('panelName', user.name);
        this.setElementText('panelDept', user.department);
        this.setElementText('panelEmail', user.email);
        this.setElementText('panelPhone', user.phone);
        this.setElementText('panelExt', user.ext);
        
        // 顯示面板
        const overlay = document.getElementById('globalUserOverlay');
        const panel = document.getElementById('globalUserPanel');
        
        if (overlay && panel) {
            overlay.classList.add('show');
            panel.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    closeCurrentUserPanel() {
        const overlay = document.getElementById('globalUserOverlay');
        const panel = document.getElementById('globalUserPanel');
        
        if (overlay && panel) {
            overlay.classList.remove('show');
            panel.classList.remove('show');
            document.body.style.overflow = '';
        }
    },

    setElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '-';
    },

    // ========== 導航與工具 ==========
    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('#sidebar .nav-link');
        
        // 先移除所有 active
        links.forEach(l => l.classList.remove('active'));

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            
            const tempLink = document.createElement('a');
            tempLink.href = href;
            const linkPath = tempLink.pathname;

            if (currentPath === linkPath) {
                link.classList.add('active');
                return;
            }

            const cleanHref = href.replace(/\.\.\//g, '').replace('/index.html', '').replace('./', '');
            const cleanCurrentPath = currentPath.replace('/index.html', '');

            if (cleanHref.length > 2 && cleanCurrentPath.includes(cleanHref)) {
                if (currentPath.includes('core/home/index.html')) {
                    return; 
                }
                link.classList.add('active');
            }
        });
    },

    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
            document.body.appendChild(container);
        }

        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: white;
            border-left: 4px solid ${colors[type]};
            padding: 1rem 1.5rem;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        toast.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}" style="color: ${colors[type]}"></i>
            <span style="color: #333; font-weight: 500;">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ========== 登出 ==========
    logout() {
        if (confirm('確定要登出系統嗎？')) {
            let loginPath = 'login.html';
            
            if (window.PathConfig) {
                loginPath = window.PathConfig.getFullUrl('login.html');
            } else if (window.ASSETS_PATH) {
                loginPath = window.ASSETS_PATH + 'login.html';
            }

            window.location.href = loginPath;
        }
    },

    showUserProfile() {
        this.openCurrentUserPanel();
    },

    showUserSettings() {
        this.showToast('設定功能開發中', 'info');
    }
};

// 暴露到全域
window.LiangLianSystem = LiangLianSystem;

// 添加 Toast 動畫樣式
if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// 確保 DOM 載入完成後執行 init()，這會觸發 checkBrowser()
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 載入完成，執行 LiangLianSystem.init()');
    LiangLianSystem.init();
});