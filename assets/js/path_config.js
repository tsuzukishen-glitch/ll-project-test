/* assets/js/path_config.js */
/* 路徑配置工具 - V2.0 */

const PathConfig = {
    // 1. 取得根目錄路徑
    // 這個函數會讀取我們在 HTML <head> 裡設定的 window.ASSETS_PATH
    // 例如在 core/home/index.html 裡，它會抓到 "../../"
    getBasePath() {
        if (typeof window.ASSETS_PATH !== 'undefined') {
            return window.ASSETS_PATH;
        }
        // 如果沒設定，預設為空字串 (代表在根目錄)
        return '';
    },

    // 2. 組合完整路徑 (JS 內部使用)
    // 當你在 JS 裡需要載入圖片或跳轉頁面時使用
    // 例如: PathConfig.getFullUrl('assets/images/logo.jpg')
    getFullUrl(relativePath) {
        // 移除開頭的 ./ 或 / (避免重複)
        const cleanPath = relativePath.replace(/^\.?\//, '');
        return this.getBasePath() + cleanPath;
    },

    // 3. 頁面跳轉工具
    // 例如: PathConfig.navigateTo('login.html')
    navigateTo(relativePath) {
        window.location.href = this.getFullUrl(relativePath);
    }
};

// 暴露到全域變數，讓其他腳本可以使用
window.PathConfig = PathConfig;