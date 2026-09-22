# 良聯工程管理平台 - 技術文檔

## 📋 目錄

- [項目概述](#項目概述)
- [技術架構](#技術架構)
- [目錄結構](#目錄結構)
- [環境配置](#環境配置)
- [測試流程](#測試流程)
- [聯絡資訊](#聯絡資訊)
- [版本紀錄](#版本記錄)

---

## 項目概述

良聯工程管理平台是一個企業級的工程管理系統，提供報價估算、人員派工/報工等核心功能。
本平台採用模組化架構 (Modular Architecture) 開發，將龐大的工程管理系統拆分為核心層與業務模組層，以解決維護困難與路徑混亂的問題。

### 重構目標

1. **模組化架構**：將功能按業務領域分組，降低耦合度
2. **統一資源管理**：集中管理 CSS、JavaScript、圖片等資源
3. **關注點分離**：Core (系統骨幹) vs Modules (業務功能)。
4. **自動化佈局**：透過 layout_loader.js 自動生成側邊欄與導航。
5. **可擴展性**：為未來功能擴展預留空間

---

## 技術架構

### 前端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 頁面結構 |
| CSS3 | - | 樣式設計 |
| JavaScript (ES6) | - | 交互邏輯 |
| Bootstrap | 5.3.2 | UI 框架 |
| Font Awesome | 7.0.0 | 圖標庫 |
| Three.js | r128 | 3D 背景動畫 |
| Google Fonts | - | 思源黑體 Noto Sans TC |

### 架構模式

```
├── 入口層 (Entry)        # login.html
├── 核心層 (Core)         # 系統首頁、系統管理
├── 業務層 (Modules)      # 報價估算、人員派工等
└── 資源層 (Assets)       # CSS、JS、圖片等共用資源
```

### 設計原則

- **單一職責**：每個模組專注於特定業務功能
- **DRY**：共用代碼統一管理
- **關注點分離**：樣式、邏輯、資料分離
- **向下兼容**：保持原有功能不受影響

---

給開發者的話： 為了確保系統的一致性與維護性，所有新增頁面與功能請務必遵守以下規範。

## 1. 檔案結構與路徑

### 1.1 萬用範本

所有新頁面**必須**基於 `standard_page_template.html` 建立。

### 1.2 設定相對路徑

在每個 HTML 頁面的 <head> 中，必須定義 window.ASSETS_PATH。
這取決於你的檔案在第幾層資料夾：

- **Core 層級** (`core/home/index.html`): `../../`
- **Module 子功能層級** (`modules/quotation/basic-data/index.html`): `../../../`

### 1.3 頁面跳轉

請勿在 JS 中寫死路徑。請統一使用 PathConfig 工具：

- `PathConfig.navigateTo('login.html');`
- `img.src = PathConfig.getFullUrl('assets/images/logo.png');`

## 2. 專案目錄結構規範

請依照下列架構建立新功能。每個**子功能**都應有獨立的資料夾，並包含自己的 `index.html`、`css` 與 `js`。

```
project-root/
│
├── login.html                                   # 系統登入頁面
├── index.html                                   # 入口轉址頁
├── standard_page_template.html                  # 標準頁面開發模板
│
├── assets/                                      # [系統] 共用資源目錄 (禁止修改)
│   ├── css/
│   │   ├── master_style.css                     # 母版樣式（側邊欄、統計卡片、表格等）
│   │   ├── all.min.css                          # Font Awesome icon 樣式
│   │   ├── bootstrap.min.css                    # Bootstrap  v5.3.8
│   │   └── flatpickr.min.css                    # flatpickr 日期樣式
│   │
│   ├── fonts/                                   # 所有字型檔
│   │
│   ├── js/
│   │   ├── master_script.js                     # 母版腳本（全域功能、通知系統）
│   │   ├── path_config.js                       # 路徑配置工具（虛擬機路徑處理）
│   │   └── layout_loader.js                     # 側邊欄+頂部導航（對應所有頁面側邊欄處理）
│   │
│   └── images/
│       ├── LL-logo.jpg                          # 良聯 Logo
│       └── favicons/
│           └── favicon.ico                      # 網站圖標
│
├── core/                                        # [系統] 核心功能模組
│   ├── home/
│   │   ├── index.html                           # 系統首頁
│   │   └── home.css                             
│   │
│   └── system-admin/                            # 系統管理模組
│       ├── user-management/                     # 員工管理
│       │   ├── index.html                       # 員工管理頁面
│       │   ├── user.js
│       │   └── user.css
│       │
│       └── permission-management/               # 權限管理
│           ├── index.html
│           ├── permission.js
│           └── permission.css
│
└── modules/                                      # [業務] 功能模組
    ├── quotation/                                # 報價估算模組
    │   ├── project-list/                         # 專案列表
    │   │   ├── index.html                        # 專案列表頁面
    │   │   ├── list.js
    │   │   └── list.css
    │   │
    │   ├── project-dashboard/                    # 專案儀表板
    │   │   ├── index.html                        # 儀表板頁面
    │   │   ├── dashboard.js
    │   │   └── dashboard.css
    │   │
    │   ├── erp-auth/                             # 報價授權單
    │   │   ├── index.html                        # 授權單頁面
    │   │   ├── auth.js
    │   │   └── auth.css
    │   │
    │   ├── basic-data/                           # 邀標單資料
    │   │   ├── index.html                        # 邀標單頁面
    │   │   ├── data.js
    │   │   └── data.css
    │   │
    │   ├── cost-estimation/                      # 成本估算管理
    │   │   ├── index.html                        # 估算管理頁面
    │   │   ├── estimation.js                     
    │   │   └── estimation.css    
    │   │
    │   ├── cost-detail/                          # 成本估算詳細
    │   │   ├── index.html                        # 詳細頁面
    │   │   ├── detail.js                         
    │   │   └── detail.css
    │   │
    │   └── version-history/                      # 版本歷史
    │       ├── index.html                        # 版本歷史頁面
    │       ├── history.js                        
    │       └── history.css  
    │   
    ├── dispatch/                                 # 人員派工/報工模組
    │
    └── gas-detection/                            # 氣體洩漏偵測模組
        ├── index.html                            # 氣體洩漏偵測頁面
        ├── detection.js                        
        └── detection.css  
```

### 2.1 目錄命名規範

- **目錄名稱**：使用 `kebab-case`（小寫字母，連字符分隔）
- **HTML 檔案**：統一使用 `index.html` 作為模組入口
- **JavaScript 檔案**：使用 `kebab_case.js`
- **CSS 檔案**：使用 `kebab_case.css`

## 3. 介面設計 (UI Components)

請優先使用 `master_style.css` 內建樣式。

### 3.1 統計卡片與狀態

- **卡片**：`<div class="stats-card total">...</div>`
- **狀態**：`<span class="status-badge stage-4">執行中</span>`

---

## 環境配置

### 開發環境需求

- **Web Server**：IIS 10+
- **瀏覽器**：Chrome 90+, Firefox 88+, Edge 90+
- **.NET Core**：
- **Node.js**：

---

### 登入流程

```
URL: login.html
帳號: test
密碼: 123
預期: 跳轉到 core/home/index.html
```

## 聯絡資訊

### 技術支援

- **開發團隊**：台塑電子材料部 雲端運算組
- **問題回報**：[內部問題追蹤系統](建置中)

---

## 版本記錄

| 版本 | 日期 | 說明 |
|------|------|------|
| v1.0.0 | 2025-12-02 | Phase 1 完成：核心模組重構 |
| v1.1.0 | 2025-12-03 | Phase 2：進行中：業務模組遷移 |
| v2.0.0 | TBD | Phase 3：優化與增強 |

---

**最後更新**：2025-12-03
**文檔版本**：1.1.0  
**維護者**：良聯工程管理平台開發團隊