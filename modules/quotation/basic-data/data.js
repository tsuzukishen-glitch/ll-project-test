/* modules/quotation/basic-data/data.js */

(function() {
    'use strict';

    // ★ 自動載入 SheetJS (XLSX) 函式庫
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = "../../../assets/js/xlsx.full.min.js";
        script.onload = () => console.log('Excel 元件載入成功');
        script.onerror = () => console.error('Excel 元件載入失敗');
        document.head.appendChild(script);
    }

    // ★ 定義特殊字型：MingLiU-ExtB (細明體擴充 B 區) 與 MingLiU (細明體)
    const SPECIAL_CHAR_FONT = 'font-family: "MingLiU-ExtB", "MingLiU", "PMingLiU", "Microsoft JhengHei", sans-serif;';

    const fractionStyle = document.createElement('style');
    fractionStyle.innerHTML = `
        /* 工程分數樣式 (斜式堆疊) */
        .fraction { 
            display: inline-flex; 
            flex-direction: row;
            align-items: center;
            font-size: 0.85em;
            vertical-align: baseline;
            margin: 0 1px;
        }
        .fraction sup { font-size: 0.75em; vertical-align: 0.3em; margin-right: 1px; }
        .fraction sub { font-size: 0.75em; vertical-align: -0.2em; margin-left: 1px; }
        .fraction-slash { font-size: 1.1em; margin: 0 1px; color: #555; font-weight: 300; }
        .inch-symbol { font-family: Arial, sans-serif; font-weight: bold; margin-left: 1px; }
    `;
    document.head.appendChild(fractionStyle);

    // ★ 核心：工程符號處理 (簡化版)示
    function renderEngineeringText(text) {
        if (!text) return '';
        let html = text.toString();
        html = html.replace(/²/g, '<sup>2</sup>');
        html = html.replace(/³/g, '<sup>3</sup>');
        html = html.replace(/(?<!\d)(\d{1,2})\/(\d{1,2})(?!\d)/g, (match, n, d) => {
            const validDenominators = ['2', '3', '4', '8', '16', '32', '64'];
            if (validDenominators.includes(d)) {
                return `<span class="fraction"><sup>${n}</sup><span class="fraction-slash">/</span><sub>${d}</sub></span>`;
            }
            return match;
        });
        html = html.replace(/"/g, '<span class="inch-symbol">"</span>');
        return html;
    }

    const projectData = {
        'EQ25090001': {
            projectNo: '',
            quotationNo: 'LME-11210-PE060',
            name: '台積電12廠潔淨室建置工程',
            owner: '台灣積體電路',
            customer: '互助營造',
            bidDate: '2025-11-15',
            status: 'bidding',
            authorizedUnits: ['CONST', 'PURCHASE', 'PROJ'] 
        },
        'EQ25090003': {
            projectNo: 'P2509001',
            quotationNo: 'LME-11210-PC020',
            name: '鴻海土城廠智慧工廠MES系統',
            owner: '鴻海精密',
            customer: '鴻海土城廠',
            bidDate: '2025-09-10',
            status: 'awarded',
            authorizedUnits: ['DESIGN', 'COST']
        }
    };

    const allUnitOptions = [
        { value: 'COST', label: '成本部' },
        { value: 'CONST', label: '建造部' },
        { value: 'DESIGN', label: '設計部' },
        { value: 'PURCHASE', label: '採購部' },
        { value: 'PROJ', label: '專案部' }
    ];

    // ==========================================
    // ★ 依需求 2 修改：僅包含產品清單
    // ==========================================
    const mockTemplates = [
        { id: 'T01', name: 'PC塔槽', items: [{ name: 'PC塔槽', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T02', name: 'PD貯槽', items: [{ name: 'PD貯槽', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T03', name: 'PE熱交換器', items: [{ name: 'PE熱交換器', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T04', name: 'PR反應器', items: [{ name: 'PR反應器', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T05', name: 'PS球形槽', items: [{ name: 'PS球形槽', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T06', name: 'PA空氣冷卻器', items: [{ name: 'PA空氣冷卻器', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T07', name: 'PB鍋爐', items: [{ name: 'PB鍋爐', unit: '式', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T08', name: 'SD煙道及煙囪', items: [{ name: 'SD煙道及煙囪', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T09', name: 'SF加熱爐', items: [{ name: 'SF加熱爐', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T10', name: 'SS鋼結構', items: [{ name: 'SS鋼結構', unit: '座', qty: 10, units: ['COST','CONST'] }] },
        { id: 'T11', name: 'ST大型儲槽', items: [{ name: 'ST大型儲槽', unit: '座', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T12', name: 'IE管線安裝工程', items: [{ name: 'IE管線安裝工程', unit: '式', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T13', name: 'IP配管預製與安裝', items: [{ name: 'IP配管預製與安裝', unit: '式', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T14', name: 'SM模組設備', items: [{ name: 'SM模組設備', unit: '式', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T15', name: 'IC保溫保冷防蝕包覆', items: [{ name: 'IC保溫保冷防蝕包覆', unit: '式', qty: 100, units: ['COST','CONST'] }] },
        { id: 'T16', name: 'MM材料買賣', items: [{ name: 'MM材料買賣', unit: '式', qty: 1, units: ['COST','CONST'] }] },
        { id: 'T17', name: 'SE環保工程', items: [{ name: 'SE環保工程', unit: '式', qty: 1, units: ['COST','CONST'] }] }
    ];

    const mockHistory = [
        { id: 'H01', projectName: '台積電南科 18 廠純水系統', customer: '台積電', fileName: '純水管路.xlsx', date: '2024-05-12', year: '2024', items: [
            { name: 'UPVC 雙層管 4"', unit: 'M', qty: 250, units: ['COST','CONST'] },
            { name: '純水閥門組', unit: '組', qty: 20, units: ['COST','CONST'] },
            { name: '配管施工工資', unit: '式', qty: 1, units: ['CONST','CONST'] }
        ]},
        { id: 'H01', projectName: '台積電南科 18 廠純水系統', customer: '台積電', fileName: '大型儲槽.xlsx', date: '2024-05-12', year: '2024', items: [
            { name: 'UPVC 雙層管 4"', unit: 'M', qty: 250, units: ['COST','CONST'] },
            { name: '純水閥門組', unit: '組', qty: 20, units: ['COST','CONST'] },
            { name: '配管施工工資', unit: '式', qty: 1, units: ['CONST','CONST'] }
        ]}
    ];

    let currentProjectOptions = [];
    let subProjects = [];
    let currentSubProjectIndex = -1;
    let activeDropdown = null;
    let selectedRowIndexes = new Set(); // 目前子標單中被勾選的「項目列」索引（items 陣列索引）

    let filteredTemplates = [];
    let filteredHistory = [];

    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId') || 'EQ25090001';
        loadProjectInfo(projectId);
        renderFileList();
        renderAssignmentTable();
        updateProgress(); 
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.multi-select-trigger') && !e.target.closest('.portal-dropdown') && !e.target.closest('#batchAssignBtn')) {
                closePortalDropdown();
            }
        });
        window.addEventListener('scroll', closePortalDropdown, true);
    }

    function loadProjectInfo(id) {
        const data = projectData[id];
        if (!data) { loadProjectInfo('EQ25090001'); return; }
        if (data.authorizedUnits && data.authorizedUnits.length > 0) {
            currentProjectOptions = allUnitOptions.filter(opt => data.authorizedUnits.includes(opt.value));
        } else {
            currentProjectOptions = [...allUnitOptions];
        }
        setValue('headerTitle', data.name);
        const headerDesc = document.getElementById('headerDesc');
        if (headerDesc) headerDesc.style.display = 'none';
        setValue('headerQuotationId', data.quotationNo);
        setValue('headerProjectId', data.projectNo || (data.status === 'awarded' ? id : '-'));
        setValue('headerOwner', data.owner);
        setValue('headerCustomer', data.customer);
        setValue('headerBidDate', data.bidDate);
        const statusEl = document.getElementById('headerStatus');
        const statusMap = { 'bidding': '報價估算中', 'awarded': '已得標', 'draft': '草稿' };
        if(statusEl) statusEl.textContent = statusMap[data.status] || data.status;
        calculateRemainingDays(data.bidDate, data.status);
    }

    function calculateRemainingDays(dateString, status) {
        const el = document.getElementById('headerRemainingDays');
        if (!el || !dateString) return;
        if (status === 'awarded') {
            el.textContent = '已得標';
            el.style.color = '#10b981';
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateString);
        const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
            el.textContent = `${diffDays} 天`;
            el.style.color = diffDays <= 7 ? '#fbbf24' : '#ffffff';
        } else if (diffDays === 0) {
            el.textContent = '今天截標';
            el.style.color = '#fbbf24';
        } else {
            el.textContent = '已過期';
            el.style.color = '#f87171';
        }
    }

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
    }

    window.handleFileUpload = function(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        if (!validExtensions.some(ext => fileName.endsWith(ext))) {
            LiangLianSystem.showToast('格式錯誤！請上傳 .xlsx 檔案', 'error');
            input.value = '';
            return;
        }
        if (typeof XLSX === 'undefined') {
            LiangLianSystem.showToast('系統正在初始化 Excel 元件，請稍後再試...', 'warning');
            return;
        }
        LiangLianSystem.showToast('正在讀取 Excel 檔案...', 'info');
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (!rows || rows.length < 2) {
                    LiangLianSystem.showToast('檔案內容為空或格式不正確', 'warning');
                    return;
                }
                const parsedItems = parseExcelData(rows);
                addVirtualFileToSystem(file.name, parsedItems, 'excel');
                input.value = '';
            } catch (error) {
                console.error('Parsing error:', error);
                LiangLianSystem.showToast('檔案解析失敗，請確認檔案格式', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    function parseExcelData(rows) {
        const items = [];
        let currentCategory = '';
        let itemIndex = 1;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const category = row[1] ? String(row[1]).trim() : '';
            const name = row[3] ? String(row[3]).trim() : ''; 
            const unit = row[4] ? String(row[4]).trim() : '';
            let qty = 0;
            if (row[5] !== undefined && row[5] !== null && row[5] !== '') {
                const qtyStr = String(row[5]).replace(/,/g, '');
                qty = parseFloat(qtyStr);
                if (isNaN(qty)) qty = 0;
            }
            if (!name) continue;
            if (category && category !== currentCategory) {
                items.push({ type: 'category', title: category });
                currentCategory = category;
            }
            items.push({ type: 'item', id: itemIndex++, name: name, unit: unit, qty: qty, units: [] });
        }
        return items;
    }

    function addVirtualFileToSystem(fileName, items, sourceIconType = 'excel') {
        const uploadDate = new Date().toLocaleString('zh-TW', { hour12: false });
        subProjects.push({
            id: Date.now(),
            fileName: fileName,
            fileDate: uploadDate,
            items: items,
            sourceType: sourceIconType 
        });
        switchSubProject(subProjects.length - 1);
        LiangLianSystem.showToast(`成功匯入 ${items.filter(i=>i.type==='item').length} 筆項目`, 'success');
        updateProgress();
    }

    window.switchSubProject = function(index) {
        currentSubProjectIndex = index;
        renderFileList();
        renderAssignmentTable();
    };

    function renderFileList() {
        const container = document.getElementById('fileList');
        if (subProjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-cloud-upload-alt mb-2 fs-3"></i>
                    <p>尚未上傳或匯入任何文件</p>
                </div>`;
            return;
        }
        container.innerHTML = subProjects.map((project, index) => {
            let iconClass = 'fa-file-excel text-success';
            if (project.sourceType === 'template') iconClass = 'fa-puzzle-piece text-info';
            if (project.sourceType === 'history') iconClass = 'fa-history text-secondary';
            return `
            <div class="file-item ${index === currentSubProjectIndex ? 'active' : ''}" onclick="switchSubProject(${index})">
                <div class="file-icon"><i class="fas ${iconClass}"></i></div>
                <div class="file-info">
                    <div class="file-name" title="${project.fileName}">${project.fileName}</div>
                    <div class="file-meta">${project.fileDate} • ${project.items.filter(i=>i.type==='item').length} 項目</div>
                </div>
                <button class="btn btn-sm text-danger" onclick="event.stopPropagation(); deleteFile(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            `;
        }).join('');
    }

    window.deleteFile = function(index) {
        if (confirm(`確定要刪除「${subProjects[index].fileName}」嗎？此操作無法復原。`)) {
            subProjects.splice(index, 1);
            if (subProjects.length === 0) {
                currentSubProjectIndex = -1;
            } else {
                if (index < currentSubProjectIndex) {
                    currentSubProjectIndex--;
                } else if (index === currentSubProjectIndex) {
                    currentSubProjectIndex = Math.max(0, index - 1);
                }
            }
            renderFileList();
            renderAssignmentTable();
            updateProgress();
            LiangLianSystem.showToast('標單資料已成功移除', 'success');
        }
    };

    function renderAssignmentTable() {
        const tbody = document.getElementById('assignmentTableBody');
        const headerText = document.querySelector('.content-card .card-header span:first-child');
        // 每次重繪表格（切換標單、刪除、套用批次後）都重置勾選狀態
        selectedRowIndexes.clear();
        updateBatchToolbar();
        if (currentSubProjectIndex === -1 || !subProjects[currentSubProjectIndex]) {
            tbody.innerHTML = `<tr><td colspan=\"6\" class=\"text-center py-5 text-muted\">請先上傳或從範本匯入資料</td></tr>`;
            document.getElementById('itemCount').textContent = '共 0 項';
            headerText.innerHTML = '<i class="fas fa-list-ol me-2"></i>標單項目指派';
            return;
        }
        const currentProject = subProjects[currentSubProjectIndex];
        const items = currentProject.items;
        let iconClass = 'fa-edit';
        if(currentProject.sourceType === 'template') iconClass = 'fa-puzzle-piece';
        if(currentProject.sourceType === 'history') iconClass = 'fa-history';
        headerText.innerHTML = `<i class="fas ${iconClass} me-2"></i>${currentProject.fileName} - 項目指派`;
        document.getElementById('itemCount').textContent = `共 ${items.filter(i => i.type === 'item').length} 項`;
        tbody.innerHTML = items.map((row, index) => {
            if (row.type === 'category') {
                return `
                    <tr class=\"category-row\">
                        <td class=\"text-center\"><input type=\"checkbox\" class=\"row-checkbox\" id=\"cat-check-${index}\" onchange=\"toggleCategoryCheckbox(${index}, this.checked)\"></td>
                        <td colspan=\"5\">${row.title}</td>
                    </tr>`;
            } else {
                const formattedQty = new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.qty);
                const processedName = renderEngineeringText(row.name);
                return `
                    <tr>
                        <td class=\"text-center\"><input type=\"checkbox\" class=\"row-checkbox\" id=\"row-check-${index}\" onchange=\"toggleRowCheckbox(${index}, this.checked)\"></td>
                        <td class=\"text-center\">${row.id}</td>
                        <td style=\"font-size: 0.95rem; ${SPECIAL_CHAR_FONT}\">${processedName}</td>
                        <td class=\"text-center\">${row.unit}</td>
                        <td class=\"text-center\">${formattedQty}</td>
                        <td>${renderMultiSelectTrigger(index, row.units)}</td>
                    </tr>
                `;
            }
        }).join('');
    }

    // ==========================================
    // ★ 批次指派執行單位（方案二 + 方案四）
    // ==========================================

    // 取得某個分類標題列底下所有「項目列」的 items 索引
    function getCategoryItemIndexes(categoryIndex) {
        const items = subProjects[currentSubProjectIndex].items;
        const indexes = [];
        for (let i = categoryIndex + 1; i < items.length; i++) {
            if (items[i].type === 'category') break;
            indexes.push(i);
        }
        return indexes;
    }

    window.toggleRowCheckbox = function(index, checked) {
        if (checked) selectedRowIndexes.add(index);
        else selectedRowIndexes.delete(index);
        syncCategoryCheckboxStates();
        updateBatchToolbar();
    };

    window.toggleCategoryCheckbox = function(categoryIndex, checked) {
        const indexes = getCategoryItemIndexes(categoryIndex);
        indexes.forEach(i => {
            if (checked) selectedRowIndexes.add(i);
            else selectedRowIndexes.delete(i);
            const cb = document.getElementById(`row-check-${i}`);
            if (cb) cb.checked = checked;
        });
        updateBatchToolbar();
    };

    // 依目前勾選狀況，把每個分類列 checkbox 同步成 全選 / 部分選取(indeterminate) / 未選
    function syncCategoryCheckboxStates() {
        const items = subProjects[currentSubProjectIndex].items;
        items.forEach((row, index) => {
            if (row.type !== 'category') return;
            const indexes = getCategoryItemIndexes(index);
            const selectedCount = indexes.filter(i => selectedRowIndexes.has(i)).length;
            const cb = document.getElementById(`cat-check-${index}`);
            if (!cb) return;
            cb.checked = indexes.length > 0 && selectedCount === indexes.length;
            cb.indeterminate = selectedCount > 0 && selectedCount < indexes.length;
        });
    }

    function updateBatchToolbar() {
        const toolbar = document.getElementById('batchToolbar');
        const countEl = document.getElementById('batchSelectedCount');
        if (!toolbar) return;
        if (selectedRowIndexes.size > 0) {
            toolbar.style.display = 'flex';
            if (countEl) countEl.textContent = selectedRowIndexes.size;
        } else {
            toolbar.style.display = 'none';
            closePortalDropdown();
        }
    }

    window.clearBatchSelection = function() {
        selectedRowIndexes.clear();
        renderAssignmentTable();
    };

    window.openBatchAssignDropdown = function(event) {
        event.stopPropagation();
        if (activeDropdown && activeDropdown.dataset.batch === 'true') { closePortalDropdown(); return; }
        closePortalDropdown();
        createBatchDropdown(event.currentTarget);
    };

    function createBatchDropdown(triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const items = subProjects[currentSubProjectIndex].items;
        const selectedItems = Array.from(selectedRowIndexes).map(i => items[i]);

        const dropdown = document.createElement('div');
        dropdown.className = 'portal-dropdown show';
        dropdown.dataset.batch = 'true';

        const header = document.createElement('div');
        header.className = 'portal-dropdown-header';
        header.textContent = `批次指派：已選取 ${selectedItems.length} 項（套用將覆蓋原指派）`;
        dropdown.appendChild(header);

        // 每個單位選項依「已選項目中有幾項已指派此單位」顯示 全選/部分選取(indeterminate)/未選
        currentProjectOptions.forEach(opt => {
            const countWithUnit = selectedItems.filter(it => (it.units || []).includes(opt.value)).length;
            const isAll = selectedItems.length > 0 && countWithUnit === selectedItems.length;
            const isSome = countWithUnit > 0 && !isAll;

            const optionEl = document.createElement('div');
            optionEl.className = 'multi-select-option';
            optionEl.innerHTML = `<input type="checkbox" data-unit="${opt.value}" ${isAll ? 'checked' : ''}><label>${opt.label}</label>`;
            const checkbox = optionEl.querySelector('input');
            checkbox.indeterminate = isSome;

            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                checkbox.indeterminate = false;
            });
            dropdown.appendChild(optionEl);
        });

        const applyBar = document.createElement('div');
        applyBar.className = 'portal-dropdown-apply';
        applyBar.innerHTML = `<button type="button" class="btn btn-primary btn-sm w-100">套用（覆蓋）</button>`;
        applyBar.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            applyBatchAssign(dropdown);
        });
        dropdown.appendChild(applyBar);

        positionFloatingDropdown(dropdown, rect, 240);
        activeDropdown = dropdown;
    }

    function applyBatchAssign(dropdown) {
        const checkedUnits = Array.from(dropdown.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.dataset.unit);
        const items = subProjects[currentSubProjectIndex].items;
        const appliedCount = selectedRowIndexes.size;
        selectedRowIndexes.forEach(i => {
            items[i].units = [...checkedUnits];
        });
        closePortalDropdown();
        renderAssignmentTable(); // 會一併清空勾選狀態
        updateProgress();
        LiangLianSystem.showToast(`已套用執行單位至 ${appliedCount} 項`, 'success');
    }

    function renderMultiSelectContent(selectedUnits) {
        const selectedLabels = (selectedUnits || []).map(u => {
            const opt = allUnitOptions.find(o => o.value === u);
            return opt ? opt.label.split(' ')[0].substring(0, 2) : u; 
        });
        const displayHtml = selectedLabels.length === 0 
            ? '<span class="multi-select-text placeholder">請選擇執行單位...</span>'
            : `<div class="unit-tags">${selectedLabels.map(l => `<span class="unit-tag">${l}</span>`).join('')}</div>`;
        return `${displayHtml}<i class="fas fa-chevron-down text-muted ms-2" style="font-size: 0.8rem;"></i>`;
    }

    function renderMultiSelectTrigger(index, selectedUnits) {
        const hasSelection = (selectedUnits || []).length > 0;
        return `
            <div class="multi-select-trigger ${hasSelection ? 'active' : ''}" id="trigger-${index}" onclick="toggleDropdown(${index}, event)">
                ${renderMultiSelectContent(selectedUnits)}
            </div>
        `;
    }

    window.toggleDropdown = function(index, event) {
        event.stopPropagation();
        if (activeDropdown && activeDropdown.dataset.index == index) { closePortalDropdown(); return; }
        closePortalDropdown();
        createPortalDropdown(index, event.currentTarget);
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

    function createPortalDropdown(index, triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const item = subProjects[currentSubProjectIndex].items[index];
        const selectedUnits = item.units || [];
        const dropdown = document.createElement('div');
        dropdown.className = 'portal-dropdown show';
        dropdown.dataset.index = index;
        const header = document.createElement('div');
        header.className = 'portal-dropdown-header';
        header.textContent = `指派：${item.name}`;
        dropdown.appendChild(header);
        currentProjectOptions.forEach(opt => {
            const isChecked = selectedUnits.includes(opt.value);
            const optionEl = document.createElement('div');
            optionEl.className = 'multi-select-option';
            optionEl.innerHTML = `<input type="checkbox" ${isChecked ? 'checked' : ''}><label>${opt.label}</label>`;
            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const checkbox = optionEl.querySelector('input');
                if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                updateUnitSelection(index, opt.value, checkbox.checked);
            });
            dropdown.appendChild(optionEl);
        });
        positionFloatingDropdown(dropdown, rect, 250);
        activeDropdown = dropdown;
    }

    function updateUnitSelection(index, value, isChecked) {
        if (currentSubProjectIndex === -1) return;
        const item = subProjects[currentSubProjectIndex].items[index];
        if (!item.units) item.units = [];
        if (isChecked) { if (!item.units.includes(value)) item.units.push(value); } 
        else { item.units = item.units.filter(u => u !== value); }
        const trigger = document.getElementById(`trigger-${index}`);
        if (trigger) {
            trigger.innerHTML = renderMultiSelectContent(item.units);
            if (item.units.length > 0) trigger.classList.add('active');
            else trigger.classList.remove('active');
        }
        updateProgress();
    }

    function closePortalDropdown() {
        if (activeDropdown) { activeDropdown.remove(); activeDropdown = null; }
    }

    function updateProgress() {
        let score = 0;
        if (subProjects.length > 0) score += 50;
        let totalItems = 0; let totalAssigned = 0;
        subProjects.forEach(proj => {
            const items = proj.items.filter(i => i.type === 'item');
            totalItems += items.length;
            totalAssigned += items.filter(i => i.units && i.units.length > 0).length;
        });
        if (totalItems > 0) score += (totalAssigned / totalItems) * 50;
        const percent = Math.round(score);
        const el = document.getElementById('headerCompleteness');
        if (el) el.textContent = `${percent}%`;
        const bar = document.getElementById('headerCompletenessBar');
        if (bar) bar.style.width = `${percent}%`;
    }

    // ==========================================
    // ★ 依需求 1 & 2 修改：加入範本邏輯
    // ==========================================
    let templateModalInstance = null;
    window.openTemplateModal = function() {
        document.getElementById('templateSearch').value = '';
        filterTemplates();
        if(!templateModalInstance) templateModalInstance = new bootstrap.Modal(document.getElementById('templateModal'));
        templateModalInstance.show();
    };

    window.filterTemplates = function() {
        const keyword = document.getElementById('templateSearch').value.toLowerCase();
        filteredTemplates = mockTemplates.filter(t => t.name.toLowerCase().includes(keyword));
        renderTemplateTable();
    };

    function renderTemplateTable() {
        const tbody = document.getElementById('templateTableBody');
        if(filteredTemplates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">找不到符合的範本</td></tr>`;
            return;
        }
        // 依需求 2 簡化欄位
        tbody.innerHTML = filteredTemplates.map(t => `
            <tr>
                <td><input class="form-check-input template-checkbox" type="checkbox" value="${t.id}" onchange="toggleTemplateQty('${t.id}', this.checked)"></td>
                <td class="fw-bold text-primary">${t.name}</td>
                <td><input type="number" class="form-control form-control-sm qty-input" id="qty_${t.id}" min="1" value="1" disabled></td>
            </tr>
        `).join('');
    }

    window.toggleTemplateQty = function(id, isChecked) {
        const qtyInput = document.getElementById(`qty_${id}`);
        if(qtyInput) {
            qtyInput.disabled = !isChecked;
            if(!isChecked) qtyInput.value = 1;
        }
    };

    window.confirmAddTemplates = function() {
        const checkboxes = document.querySelectorAll('.template-checkbox:checked');
        if(checkboxes.length === 0) { LiangLianSystem.showToast('請至少勾選一個範本', 'warning'); return; }
        checkboxes.forEach(cb => {
            const tId = cb.value;
            const template = mockTemplates.find(t => t.id === tId);
            const multiplier = parseInt(document.getElementById(`qty_${tId}`).value) || 1;
            const parsedItems = [];
            let itemIndex = 1;
            parsedItems.push({ type: 'category', title: `[範本] ${template.name}` });
            template.items.forEach(item => {
                parsedItems.push({
                    type: 'item', id: itemIndex++, name: item.name, unit: item.unit, qty: item.qty * multiplier,
                    units: item.units ? [...item.units] : [] 
                });
            });
            const fileName = `範本: ${template.name} (x${multiplier})`;
            addVirtualFileToSystem(fileName, parsedItems, 'template');
        });
        templateModalInstance.hide();
    };

    // --- 歷史標單邏輯 ---
    let historyModalInstance = null;
    window.openHistoryModal = function() {
        document.getElementById('historySearch').value = '';
        filterHistory();
        if(!historyModalInstance) historyModalInstance = new bootstrap.Modal(document.getElementById('historyModal'));
        historyModalInstance.show();
    };

    window.filterHistory = function() {
        const keyword = document.getElementById('historySearch').value.toLowerCase();
        const year = document.getElementById('historyYear').value;
        const customer = document.getElementById('historyCustomer').value;
        filteredHistory = mockHistory.filter(h => {
            const matchKey = h.projectName.toLowerCase().includes(keyword) || h.fileName.toLowerCase().includes(keyword);
            const matchYear = year === '' || h.year === year;
            const matchCus = customer === '' || h.customer === customer;
            return matchKey && matchYear && matchCus;
        });
        renderHistoryTable();
    };

    function renderHistoryTable() {
        const tbody = document.getElementById('historyTableBody');
        if(filteredHistory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">找不到標單</td></tr>`;
            return;
        }
        tbody.innerHTML = filteredHistory.map(h => `
            <tr>
                <td><input class="form-check-input history-checkbox" type="checkbox" value="${h.id}"></td>
                <td class="fw-bold text-secondary">${h.projectName}</td>
                <td><span class="badge bg-light text-dark border">${h.customer}</span></td>
                <td><i class="fas fa-file-excel text-success me-1"></i>${h.fileName}</td>
                <td class="text-muted small">${h.date}</td>
            </tr>
        `).join('');
    }

    window.confirmAddHistory = function() {
        const checkboxes = document.querySelectorAll('.history-checkbox:checked');
        if(checkboxes.length === 0) { LiangLianSystem.showToast('請勾選歷史標單', 'warning'); return; }
        checkboxes.forEach(cb => {
            const hId = cb.value;
            const historyObj = mockHistory.find(h => h.id === hId);
            const parsedItems = [];
            let itemIndex = 1;
            parsedItems.push({ type: 'category', title: `[歷史] ${historyObj.projectName}` });
            historyObj.items.forEach(item => {
                parsedItems.push({ type: 'item', id: itemIndex++, name: item.name, unit: item.unit, qty: item.qty, units: item.units ? [...item.units] : [] });
            });
            addVirtualFileToSystem(`歷史: ${historyObj.fileName}`, parsedItems, 'history');
        });
        historyModalInstance.hide();
    };

    window.downloadTemplate = function() {
        const header = ["分類項次", "分類", "內容項次", "工程內容/品名規格", "單位", "數量"];
        const data = [header, [1, "帶料", 1, "範例項目", "式", 1.00]];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "標單範本");
        XLSX.writeFile(wb, "標單模板.xlsx");
    };

    window.saveProgress = function() { LiangLianSystem.showToast('已暫存', 'success'); };
    window.completeAssignment = function() {
        if (subProjects.length === 0) { alert('請先匯入資料'); return; }
        if (confirm('確定要完成指派嗎？')) { LiangLianSystem.showToast('任務分派成功', 'success'); }
    };

    document.addEventListener('DOMContentLoaded', init);
})();