/* detail_matrix.js - V12.30 升級：四項加權樣式比照一般模式、專案費用移至左側、並加入分類標題與小計 */

if (typeof DetailEstimation !== 'undefined') {
    
    // ==========================================
    //  新增功能函數
    // ==========================================

    // 1. 修復移回專案材料按鈕
    DetailEstimation.updateCategoryByCol = function(index, newCategory) {
        if (typeof this.updateItem === 'function') {
            this.updateItem(index, 'category', newCategory);
        } else {
            console.error("找不到 updateItem 函數");
        }
    };

    // 2. 矩陣模式專用：安全刪除
    DetailEstimation.safeDeleteMatrixItem = function(index, category) {
        const items = this.product.data.items;
        const count = items.filter(item => item.category === category).length;
        
        // 防呆機制：若為最後一筆，禁止刪除
        if (count <= 1) {
            alert(`系統保護：${category} 至少需保留一筆資料，無法刪除。`);
            return;
        }

        // 確認刪除
        if (confirm('確定要刪除此項目嗎？')) {
            this.product.data.items.splice(index, 1);
            this.renderTable();
        }
    };

    // 3. 製造數量變更連動 (公式：材料數量 = 製造數量 / 0.9)
    DetailEstimation.updateMfgQtyWithAutoCalc = function(index, newMfgQty) {
        const mfgVal = parseFloat(newMfgQty) || 0;
        this.product.data.items[index].qtyMfg = mfgVal;

        if (mfgVal !== 0) {
            const autoMatQty = Math.round(mfgVal / 0.9);
            this.product.data.items[index].qty = autoMatQty;
            console.log(`自動計算：製造 ${mfgVal} -> 材料 ${autoMatQty}`);
        }
        this.renderTable();
    };

    // ==========================================
    //  主渲染函數
    // ==========================================

    DetailEstimation.renderContinuousMatrix = function(totals) {
        try {
            // 1. 強制定義矩陣模式的分類對應 (不依賴外部的全域變數，確保專案費用在左側)
            const MAPPING = {
                ROWS: ['專案材料', '專案費用'], 
                COLS_COMMON: ['共通耗材'], 
                COLS_MFG: ['專案設計', '專案外包加工', '專案製造', '專案外包工程']
            };

            const OPTIONS = (typeof DROPDOWN_OPTIONS !== 'undefined') ? DROPDOWN_OPTIONS : {
                categories: ['專案材料', '共通耗材', '專案設計', '專案外包加工', '專案製造', '專案外包工程', '專案費用'],
                costCodes: ['DPCMM101', 'DPCMM102', 'DPCMM103', 'DPCMM104', 'DPCMM105', 'DPCMM106'],
                accountCodes: ['1251M1', '1251M2', '1251M3', '1251M4'],
                departments: ['工務部', '設計部', '製造廠', '品保部', '採購部'],
                workTypes: ['電銲工', '冷作工', '噴塗工', '焊接工'],
                units: ['kg', '式', '工', 'm', 'pcs', '組', '台']
            };

            // 預先過濾各分類項目
            const rowItems = totals.calculatedItems.filter(item => MAPPING.ROWS.includes(item.data.category) || !item.data.category);
            const colItemsCommon = totals.calculatedItems.filter(item => MAPPING.COLS_COMMON.includes(item.data.category));
            const colItemsMfg = totals.calculatedItems.filter(item => MAPPING.COLS_MFG.includes(item.data.category));
            
            // 追蹤各欄的合計
            let colTotalsCommon = new Array(colItemsCommon.length).fill(0);
            let colTotalsMfgHours = new Array(colItemsMfg.length).fill(0); 
            
            let grandTotalRow = {
                matSubtotal: 0, commonMatSubtotal: 0, matTotal: 0,
                matIndirect: 0, matProfit: 0, matRisk: 0, matNeg: 0, matGrandTotal: 0,
                mfgTotal: 0, mfgIndirect: 0, mfgProfit: 0, mfgRisk: 0, mfgNeg: 0, mfgGrandTotal: 0,
                finalTotal: 0,
                totalMatQty: 0,
                totalMfgQty: 0,
                totalMfgManHours: 0 
            };

            // 計算填充用的欄位數量 (用於分類標題列跨欄)
            // 基礎固定欄位共17欄 (從分類一直到材料利管單價共計10欄在右側需要被跨越)
            const rightFillerCols = 10 + (colItemsCommon.length * 3) + 1 + 8 + 1 + (colItemsMfg.length * 2) + 3 + 8 + 1 + 1;

            // 3. 建構表頭
            let html = `
                <table class="estimation-table w-100 matrix-table">
                <thead>
                <tr>
                <!-- 操作與基礎資訊 -->
                <th rowspan="2" class="sticky-col align-middle text-center" style="min-width: 110px;">操作</th>
                <th rowspan="2" class="sticky-col align-middle text-center text-dark" style="min-width: 60px;">項次</th>
                
                <th rowspan="2" class="align-middle text-center" style="min-width: 120px;">專案分類</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 120px;">成本代碼</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 120px;">在建會科</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 140px;">材料編號</th>
                <th rowspan="2" class="align-middle text-center sticky-col-7" style="min-width: 250px;">工程內容/品名規格</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 110px;">執行部門</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 110px;">工種</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 120px;">材質</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 80px;">單位</th>
                
                <th rowspan="2" class="align-middle text-center" style="min-width: 110px;">材料<br>數量</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 110px;">製造<br>數量</th>
                <th rowspan="2" class="align-middle text-center" style="min-width: 80px;">Cut.<br>Lose</th>
                
                <!-- 獨立的材料單價區 -->
                <th rowspan="2" class="text-center align-middle" style="min-width: 180px;">材料<br>單價</th>
                <th rowspan="2" class="text-center align-middle" style="min-width: 120px;">材料<br>小計</th>
                <th rowspan="2" class="text-center align-middle" style="min-width: 120px;">材料<br>利管<br>單價</th>

                <!-- 共通耗材區 -->
                ${colItemsCommon.map(col => `
                <th colspan="3" class="text-center bg-warning bg-opacity-10 border-bottom border-end section-border-left">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div class="small text-muted text-center w-100 ps-3" style="font-size:0.75rem;">${col.data.costCode || '-'}</div>
                        <div>
                            <button class="btn btn-sm btn-link text-muted p-0" style="font-size: 0.7rem;" 
                                onclick="DetailEstimation.updateCategoryByCol(${col.originalIndex}, '專案材料')" title="移回專案材料">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="fw-bold text-center">${col.data.name}</div>
                </th>
                `).join('')}

                <th rowspan="2" class="text-center section-border-left align-middle" style="background-color: #fef3c7; min-width: 120px;">材料<br>合計</th>
                
                <!-- ★ 修改：材料費率與間接費用區塊 (完全比照直式類別與背景色) -->
                <th rowspan="2" class="border-indirect col-indirect text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-indirect text-center align-middle" style="min-width: 100px;">間接費用</th>
                <th rowspan="2" class="border-profit col-profit text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-profit text-center align-middle" style="min-width: 100px;">利潤</th>
                <th rowspan="2" class="border-risk col-risk text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-risk text-center align-middle" style="min-width: 100px;">風險</th>
                <th rowspan="2" class="border-neg col-neg text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-neg text-center align-middle" style="min-width: 100px;">議價</th>
                
                <th rowspan="2" class="border-total col-total text-center align-middle" style="min-width: 130px;">材料<br>總計</th>

                <!-- 製造費用區 -->
                ${colItemsMfg.map(col => `
                <th colspan="2" class="text-center bg-info bg-opacity-10 border-bottom border-end section-border-left align-middle" style="min-width: 200px;">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div class="small text-muted text-center w-100 ps-3" style="font-size:0.75rem;">${col.data.costCode || '-'}</div>
                        <button class="btn btn-sm btn-link text-muted p-0" style="font-size: 0.7rem;" 
                        onclick="DetailEstimation.updateCategoryByCol(${col.originalIndex}, '專案材料')" title="移回專案材料">
                        <i class="fas fa-undo"></i>
                        </button>
                    </div>
                    <div class="fw-bold text-center mb-1">${col.data.name}</div>
                </th>
                `).join('')}

                <th rowspan="2" class="text-center section-border-left align-middle" style="background-color: #e0f2fe; min-width: 120px;">製造<br>單價</th>
                <th rowspan="2" class="text-center align-middle" style="background-color: #e0f2fe; min-width: 120px;">製造<br>利管<br>單價</th>
                <th rowspan="2" class="text-center align-middle" style="background-color: #e0f2fe; min-width: 120px;">製造<br>合計</th>
                
                <!-- ★ 修改：製造費率與間接費用區塊 (完全比照直式類別與背景色) -->
                <th rowspan="2" class="border-indirect col-indirect text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-indirect text-center align-middle" style="min-width: 100px;">間接費用</th>
                <th rowspan="2" class="border-profit col-profit text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-profit text-center align-middle" style="min-width: 100px;">利潤</th>
                <th rowspan="2" class="border-risk col-risk text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-risk text-center align-middle" style="min-width: 100px;">風險</th>
                <th rowspan="2" class="border-neg col-neg text-center align-middle" style="min-width: 70px;">%</th>
                <th rowspan="2" class="col-neg text-center align-middle" style="min-width: 100px;">議價</th>
                
                <th rowspan="2" class="border-total col-total text-center align-middle" style="min-width: 140px;">製造<br>總計</th>
                
                <!-- ★ 修改：最終總計區隔，替換為獨立的灰色左邊界與特定背景色 -->
                <th rowspan="2" class="text-center align-middle" style="min-width: 150px; border-left: 2px solid #cbd5e1 !important; background-color: #f1f5f9; color: #1e293b; font-size: 1.05rem;">
                估算<br>總計
                </th>
                </tr>
                
                <tr>
                <!-- 共通耗材子表頭 -->
                ${colItemsCommon.map(() => `
                <th class="text-center bg-warning bg-opacity-10 border-bottom border-end section-border-left" style="min-width: 70px; font-size: 0.85rem;">%</th>
                <th class="text-center bg-warning bg-opacity-10 border-bottom border-end" style="min-width: 110px; font-size: 0.85rem;">單價</th>
                <th class="text-center bg-warning bg-opacity-10 border-bottom border-end" style="min-width: 110px; font-size: 0.85rem;">小計</th>
                `).join('')}

                <!-- 製造費用子表頭 (單價 / 工時) -->
                ${colItemsMfg.map(() => `
                <th class="text-center bg-info bg-opacity-10 border-bottom border-end section-border-left" style="min-width: 110px; font-size: 0.85rem;">單價</th>
                <th class="text-center bg-info bg-opacity-10 border-bottom border-end" style="min-width: 90px; font-size: 0.85rem;">工時</th>
                `).join('')}
                </tr>
                </thead>
                <tbody>
            `;

            // 將左側項次根據分類群組化
            const groupedRowItems = {};
            MAPPING.ROWS.forEach(cat => groupedRowItems[cat] = []);
            groupedRowItems['未分類'] = [];
            
            rowItems.forEach(item => {
                const cat = item.data.category || '未分類';
                if (groupedRowItems[cat]) groupedRowItems[cat].push(item);
                else groupedRowItems['未分類'].push(item);
            });

            let globalDisplayIndex = 1;

            // 4. 依序渲染各個分類的資料夾及內容
            Object.keys(groupedRowItems).forEach(catName => {
                const items = groupedRowItems[catName];
                if (items.length === 0) return;

                // ★ 新增：分類標題列 (Folder 列)
                html += `
                    <tr class="category-header-row">
                        <td colspan="2" class="category-header-title sticky-col"><i class="fas fa-folder-open me-2 text-primary"></i>${catName}</td>
                        <td colspan="4" class="category-header-filler"></td>
                        <td class="category-header-filler sticky-col-7"></td>
                        <td colspan="${rightFillerCols}" class="category-header-filler"></td>
                    </tr>
                `;

                // 準備每個分類的小計變數
                let catTotalRow = {
                    matSubtotal: 0, commonMatSubtotal: 0, matTotal: 0,
                    matIndirect: 0, matProfit: 0, matRisk: 0, matNeg: 0, matGrandTotal: 0,
                    mfgTotal: 0, mfgIndirect: 0, mfgProfit: 0, mfgRisk: 0, mfgNeg: 0, mfgGrandTotal: 0,
                    finalTotal: 0,
                    totalMatQty: 0, totalMfgQty: 0, totalMfgManHours: 0 
                };
                let catColTotalsCommon = new Array(colItemsCommon.length).fill(0);
                let catColTotalsMfgHours = new Array(colItemsMfg.length).fill(0);

                items.forEach((rowObj) => {
                    const row = rowObj.data;
                    const originalIdx = rowObj.originalIndex;
                    
                    const matQty = parseFloat(row.qty) || 0;
                    const mfgQty = parseFloat(row.qtyMfg) || 0;
                    
                    grandTotalRow.totalMatQty += matQty;
                    catTotalRow.totalMatQty += matQty;
                    grandTotalRow.totalMfgQty += mfgQty;
                    catTotalRow.totalMfgQty += mfgQty;

                    let cuttingLosePct = 0;
                    if (matQty > 0) {
                        cuttingLosePct = ((matQty - mfgQty) / matQty) * 100;
                    }
                    const lossDisplay = matQty > 0 ? cuttingLosePct.toFixed(1) + '%' : '-';

                    const moveControls = `
                        <div class="d-flex justify-content-center gap-1">
                            <button class="btn-sort" onclick="DetailEstimation.moveItem(${originalIdx}, -1)" title="上移"><i class="fas fa-arrow-up"></i></button>
                            <button class="btn-sort" onclick="DetailEstimation.moveItem(${originalIdx}, 1)" title="下移"><i class="fas fa-arrow-down"></i></button>
                            <button class="btn-sort btn-delete" 
                                onclick="DetailEstimation.safeDeleteMatrixItem(${originalIdx}, '${row.category}')" 
                                title="刪除"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    `;

                    const matSubtotal = Math.round(matQty * row.price);
                    
                    // 共通耗材
                    let commonMatSubtotal = 0;
                    const commonColsHtml = colItemsCommon.map((col, cIdx) => {
                        const baseKey = `${row.id}_${col.data.id}`;
                        const percent = (this.matrixValues && this.matrixValues[`${baseKey}_percent`] !== undefined) ? parseFloat(this.matrixValues[`${baseKey}_percent`]) : 0;
                        const unitPrice = (this.matrixValues && this.matrixValues[`${baseKey}_price`] !== undefined) ? parseFloat(this.matrixValues[`${baseKey}_price`]) : parseFloat(col.data.price || 0);
                        
                        const subtotal = Math.round(mfgQty * (percent / 100) * unitPrice);
                        commonMatSubtotal += subtotal;
                        
                        colTotalsCommon[cIdx] += subtotal;
                        catColTotalsCommon[cIdx] += subtotal;

                        return `
                            <td class="p-1 border-end border-bottom bg-warning bg-opacity-10 section-border-left" style="min-width: 70px;">
                                <input type="number" class="form-control form-input-compact text-end bg-white w-100" style="min-width: 50px;"
                                    value="${percent}" placeholder="%"
                                    onchange="DetailEstimation.updateMatrixValue('${baseKey}_percent', this.value)">
                            </td>
                            <td class="p-1 border-end border-bottom bg-warning bg-opacity-10" style="min-width: 110px;">
                                <input type="number" class="form-control form-input-compact text-end bg-white w-100" style="min-width: 80px;"
                                    value="${unitPrice}" 
                                    onchange="DetailEstimation.updateMatrixValue('${baseKey}_price', this.value)">
                            </td>
                            <td class="p-1 border-end border-bottom bg-warning bg-opacity-10 text-end fw-bold align-middle" style="min-width: 110px;">
                                ${subtotal.toLocaleString()}
                            </td>
                        `;
                    }).join('');

                    const matSum = Math.round(matSubtotal + commonMatSubtotal);
                    
                    // 計算各項費用
                    const matIndirect = Math.round(matSum * (row.indirectRate / 100));
                    const matProfit = Math.round(matSum * (row.profitRate / 100));
                    const matRisk = Math.round(matSum * (row.riskRate / 100));
                    const matNeg = Math.round(matSum * ((row.negotiationRate || 0) / 100));
                    
                    const matGrandTotal = matSum + matIndirect + matProfit + matRisk + matNeg;
                    const matMgmtUnitPrice = matQty > 0 ? Math.round(matGrandTotal / matQty) : 0;

                    // 全局與分類小計累加
                    grandTotalRow.matSubtotal += matSubtotal; catTotalRow.matSubtotal += matSubtotal;
                    grandTotalRow.commonMatSubtotal += commonMatSubtotal; catTotalRow.commonMatSubtotal += commonMatSubtotal;
                    grandTotalRow.matTotal += matSum; catTotalRow.matTotal += matSum;
                    grandTotalRow.matIndirect += matIndirect; catTotalRow.matIndirect += matIndirect;
                    grandTotalRow.matProfit += matProfit; catTotalRow.matProfit += matProfit;
                    grandTotalRow.matRisk += matRisk; catTotalRow.matRisk += matRisk;
                    grandTotalRow.matNeg += matNeg; catTotalRow.matNeg += matNeg;
                    grandTotalRow.matGrandTotal += matGrandTotal; catTotalRow.matGrandTotal += matGrandTotal;

                    // 製造費用行內輸入
                    let mfgUnitPriceSum = 0;
                    const mfgColsHtml = colItemsMfg.map((col, cIdx) => {
                        const baseKey = `${row.id}_${col.data.id}`;
                        const price = (this.matrixValues && this.matrixValues[`${baseKey}_price`] !== undefined) ? parseFloat(this.matrixValues[`${baseKey}_price`]) : 0;
                        const hours = (this.matrixValues && this.matrixValues[`${baseKey}_hours`] !== undefined) ? parseFloat(this.matrixValues[`${baseKey}_hours`]) : 0;
                        
                        mfgUnitPriceSum += price;
                        
                        colTotalsMfgHours[cIdx] += hours; 
                        catColTotalsMfgHours[cIdx] += hours;
                        
                        grandTotalRow.totalMfgManHours += hours; 
                        catTotalRow.totalMfgManHours += hours; 

                        return `
                            <td class="p-1 border-end border-bottom text-center bg-info bg-opacity-10 section-border-left" style="min-width: 110px;">
                                <input type="number" class="form-control form-input-compact text-end bg-white w-100" style="min-width: 80px;"
                                    placeholder="-" value="${price || ''}"
                                    onchange="DetailEstimation.updateMatrixValue('${baseKey}_price', this.value)">
                            </td>
                            <td class="p-1 border-end border-bottom text-center bg-info bg-opacity-10" style="min-width: 90px;">
                                <input type="number" class="form-control form-input-compact text-end bg-white fw-bold w-100" style="min-width: 60px;"
                                    placeholder="-" value="${hours || ''}"
                                    onchange="DetailEstimation.updateMatrixValue('${baseKey}_hours', this.value)">
                            </td>
                        `;
                    }).join('');

                    const mfgSum = Math.round((mfgQty / 1000) * mfgUnitPriceSum);
                    
                    const mfgIndirect = Math.round(mfgSum * (row.indirectRate / 100));
                    const mfgProfit = Math.round(mfgSum * (row.profitRate / 100));
                    const mfgRisk = Math.round(mfgSum * (row.riskRate / 100));
                    const mfgNeg = Math.round(mfgSum * ((row.negotiationRate || 0) / 100));
                    
                    const mfgGrandTotal = mfgSum + mfgIndirect + mfgProfit + mfgRisk + mfgNeg;
                    const mfgMgmtUnitPrice = mfgQty > 0 ? Math.round((mfgGrandTotal / mfgQty) * 1000) : 0;

                    grandTotalRow.mfgTotal += mfgSum; catTotalRow.mfgTotal += mfgSum;
                    grandTotalRow.mfgIndirect += mfgIndirect; catTotalRow.mfgIndirect += mfgIndirect;
                    grandTotalRow.mfgProfit += mfgProfit; catTotalRow.mfgProfit += mfgProfit;
                    grandTotalRow.mfgRisk += mfgRisk; catTotalRow.mfgRisk += mfgRisk;
                    grandTotalRow.mfgNeg += mfgNeg; catTotalRow.mfgNeg += mfgNeg;
                    grandTotalRow.mfgGrandTotal += mfgGrandTotal; catTotalRow.mfgGrandTotal += mfgGrandTotal;

                    const finalTotal = matGrandTotal + mfgGrandTotal;
                    grandTotalRow.finalTotal += finalTotal; catTotalRow.finalTotal += finalTotal;

                    // 生成資料列
                    html += `
                        <tr>
                            <td class="text-center sticky-col" style="min-width: 110px;">${moveControls}</td>
                            <td class="text-center sticky-col text-dark fw-bold" style="min-width: 60px;">${globalDisplayIndex++}</td>
                            
                            <td class="align-middle" style="min-width: 120px;"><select class="form-input-compact w-100" style="min-width: 90px;" onchange="DetailEstimation.updateCategory(${originalIdx}, this.value)">${this.getOptionsHtml(OPTIONS.categories, row.category)}</select></td>
                            <td class="align-middle" style="min-width: 120px;"><select class="form-input-compact w-100" style="min-width: 90px;" onchange="DetailEstimation.updateItem(${originalIdx}, 'costCode', this.value)">${this.getOptionsHtml(OPTIONS.costCodes, row.costCode)}</select></td>
                            <td class="align-middle" style="min-width: 120px;"><select class="form-input-compact w-100" style="min-width: 90px;" onchange="DetailEstimation.updateItem(${originalIdx}, 'accountCode', this.value)">${this.getOptionsHtml(OPTIONS.accountCodes, row.accountCode)}</select></td>
                            <td class="align-middle" style="min-width: 140px;"><input type="text" class="form-input-compact w-100" style="min-width: 110px;" value="${row.matNo}" onchange="DetailEstimation.updateItem(${originalIdx}, 'matNo', this.value)"></td>
                            <td class="align-middle sticky-col-7" style="min-width: 250px;"><input type="text" class="form-input-compact w-100" style="min-width: 220px;" value="${row.name}" onchange="DetailEstimation.updateItem(${originalIdx}, 'name', this.value)"></td>
                            
                            <td class="align-middle" style="min-width: 110px;"><select class="form-input-compact w-100" style="min-width: 80px;" onchange="DetailEstimation.updateItem(${originalIdx}, 'dept', this.value)">${this.getOptionsHtml(OPTIONS.departments, row.dept)}</select></td>
                            <td class="align-middle" style="min-width: 110px;"><select class="form-input-compact w-100" style="min-width: 80px;" onchange="DetailEstimation.updateItem(${originalIdx}, 'workType', this.value)">${this.getOptionsHtml(OPTIONS.workTypes, row.workType)}</select></td>
                            <td class="align-middle" style="min-width: 120px;"><input type="text" class="form-input-compact w-100" style="min-width: 90px;" value="${row.material || ''}" onchange="DetailEstimation.updateItem(${originalIdx}, 'material', this.value)" placeholder="-"></td>
                            <td class="align-middle" style="min-width: 80px;"><select class="form-input-compact text-center w-100" style="min-width: 60px;" onchange="DetailEstimation.updateItem(${originalIdx}, 'unit', this.value)">${this.getOptionsHtml(OPTIONS.units, row.unit)}</select></td>
                            
                            <td class="align-middle" style="min-width: 110px;"><input type="number" class="form-input-compact text-end fw-bold text-primary w-100" style="min-width: 80px;" value="${row.qty}" onchange="DetailEstimation.updateItem(${originalIdx}, 'qty', this.value)"></td>
                            
                            <td class="align-middle" style="min-width: 110px;">
                                <input type="number" 
                                    class="form-input-compact text-end w-100" style="min-width: 80px;"
                                    value="${row.qtyMfg}" 
                                    onchange="DetailEstimation.updateMfgQtyWithAutoCalc(${originalIdx}, this.value)">
                            </td>
                            
                            <td class="text-center small text-danger align-middle fw-bold" style="min-width: 80px;">${lossDisplay}</td>

                            <td class="align-middle" style="min-width: 180px;">
                                <div class="input-group flex-nowrap input-group-price w-100">
                                    <input type="number" class="form-control form-input-compact text-end bg-white w-100" style="min-width: 80px;" value="${row.price}" onchange="DetailEstimation.updateItem(${originalIdx}, 'price', this.value)">
                                    <button class="btn btn-outline-secondary px-2 text-nowrap" type="button" onclick="DetailEstimation.showHistory(${originalIdx})" title="查看歷史"><i class="fas fa-history"></i></button>
                                </div>
                            </td>
                            <td class="text-end align-middle" style="min-width: 120px;">${Math.round(matSubtotal).toLocaleString()}</td>
                            <td class="text-end fw-bold text-primary align-middle" style="min-width: 120px;">${matMgmtUnitPrice.toLocaleString()}</td>

                            ${commonColsHtml}

                            <td class="text-end bg-warning bg-opacity-10 fw-bold align-middle section-border-left" style="min-width: 120px;">${Math.round(matSum).toLocaleString()}</td>
                            
                            <!-- ★ 修改：套用直式費率類別 (材料) -->
                            <td class="border-indirect col-indirect text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.indirectRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'indirectRate', this.value)"></td>
                            <td class="col-indirect text-end small align-middle" style="min-width: 100px;">${matIndirect.toLocaleString()}</td>
                            
                            <td class="border-profit col-profit text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.profitRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'profitRate', this.value)"></td>
                            <td class="col-profit text-end small align-middle" style="min-width: 100px;">${matProfit.toLocaleString()}</td>
                            
                            <td class="border-risk col-risk text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.riskRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'riskRate', this.value)"></td>
                            <td class="col-risk text-end small align-middle" style="min-width: 100px;">${matRisk.toLocaleString()}</td>
                            
                            <td class="border-neg col-neg text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.negotiationRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'negotiationRate', this.value)"></td>
                            <td class="col-neg text-end small align-middle" style="min-width: 100px;">${matNeg.toLocaleString()}</td>
                            
                            <td class="border-total col-total text-end align-middle" style="min-width: 130px; font-size: 1.05rem;">${matGrandTotal.toLocaleString()}</td>

                            ${mfgColsHtml}

                            <td class="text-end bg-info bg-opacity-10 align-middle section-border-left" style="min-width: 120px;">${mfgUnitPriceSum.toLocaleString()}</td>
                            <td class="text-end bg-info bg-opacity-10 fw-bold text-primary align-middle" style="min-width: 120px;">${mfgMgmtUnitPrice.toLocaleString()}</td>
                            <td class="text-end bg-info bg-opacity-10 fw-bold align-middle" style="min-width: 120px;">${Math.round(mfgSum).toLocaleString()}</td>
                            
                            <!-- ★ 修改：套用直式費率類別 (製造) -->
                            <td class="border-indirect col-indirect text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.indirectRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'indirectRate', this.value)"></td>
                            <td class="col-indirect text-end small align-middle" style="min-width: 100px;">${mfgIndirect.toLocaleString()}</td>
                            
                            <td class="border-profit col-profit text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.profitRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'profitRate', this.value)"></td>
                            <td class="col-profit text-end small align-middle" style="min-width: 100px;">${mfgProfit.toLocaleString()}</td>
                            
                            <td class="border-risk col-risk text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.riskRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'riskRate', this.value)"></td>
                            <td class="col-risk text-end small align-middle" style="min-width: 100px;">${mfgRisk.toLocaleString()}</td>
                            
                            <td class="border-neg col-neg text-center align-middle" style="min-width: 70px;"><input type="number" class="rate-input-small w-100 text-center" style="min-width: 50px;" value="${row.negotiationRate}" onchange="DetailEstimation.updateItem(${originalIdx}, 'negotiationRate', this.value)"></td>
                            <td class="col-neg text-end small align-middle" style="min-width: 100px;">${mfgNeg.toLocaleString()}</td>
                            
                            <td class="border-total col-total text-end align-middle" style="min-width: 140px; font-size: 1.05rem;">${mfgGrandTotal.toLocaleString()}</td>

                            <!-- ★ 修改：獨立灰線樣式總計欄 -->
                            <td class="text-end fw-bold align-middle" style="font-size: 1.1rem; min-width: 150px; border-left: 2px solid #cbd5e1 !important; background-color: #f8fafc; color: #0f172a;">
                                ${finalTotal.toLocaleString()}
                            </td>
                        </tr>
                    `;
                });

                // ★ 新增：分類小計列
                let catGlobalCutLose = '-';
                if (catTotalRow.totalMatQty > 0) {
                    catGlobalCutLose = (((catTotalRow.totalMatQty - catTotalRow.totalMfgQty) / catTotalRow.totalMatQty) * 100).toFixed(2) + '%';
                }

                html += `
                    <tr class="category-subtotal-row">
                        <td class="sticky-col"></td>
                        <td class="sticky-col"></td>
                        <td colspan="4"></td>
                        <td class="sticky-col-7"></td>
                        <td colspan="4" class="text-end text-secondary">${catName} 小計：</td>

                        <td class="text-end fw-bold text-dark">${Math.round(catTotalRow.totalMatQty).toLocaleString()}</td>
                        <td class="text-end fw-bold text-dark">${Math.round(catTotalRow.totalMfgQty).toLocaleString()}</td>
                        <td class="text-center text-danger fw-bold">${catGlobalCutLose}</td>

                        <td></td>
                        <td class="text-end fw-bold text-dark">${Math.round(catTotalRow.matSubtotal).toLocaleString()}</td>
                        <td></td>

                        ${colItemsCommon.map((col, cIdx) => `
                            <td class="bg-warning bg-opacity-10 section-border-left"></td>
                            <td class="bg-warning bg-opacity-10"></td>
                            <td class="text-end bg-warning bg-opacity-10 fw-bold">${Math.round(catColTotalsCommon[cIdx]).toLocaleString()}</td>
                        `).join('')}

                        <td class="text-end bg-warning bg-opacity-10 fw-bold section-border-left">${Math.round(catTotalRow.matTotal).toLocaleString()}</td>
                        
                        <td class="border-indirect col-indirect"></td>
                        <td class="col-indirect text-end">${catTotalRow.matIndirect.toLocaleString()}</td>
                        <td class="border-profit col-profit"></td>
                        <td class="col-profit text-end">${catTotalRow.matProfit.toLocaleString()}</td>
                        <td class="border-risk col-risk"></td>
                        <td class="col-risk text-end">${catTotalRow.matRisk.toLocaleString()}</td>
                        <td class="border-neg col-neg"></td>
                        <td class="col-neg text-end">${catTotalRow.matNeg.toLocaleString()}</td>
                        <td class="border-total col-total text-end" style="font-size: 1.05rem;">${catTotalRow.matGrandTotal.toLocaleString()}</td>

                        ${colItemsMfg.map((col, cIdx) => `
                            <td class="bg-info bg-opacity-10 section-border-left"></td>
                            <td class="bg-info bg-opacity-10 text-center fw-bold text-dark">${catColTotalsMfgHours[cIdx] > 0 ? catColTotalsMfgHours[cIdx].toLocaleString() : '-'}</td>
                        `).join('')}

                        <td class="section-border-left bg-info bg-opacity-10"></td>
                        <td class="bg-info bg-opacity-10"></td>
                        <td class="text-end bg-info bg-opacity-10 fw-bold">${Math.round(catTotalRow.mfgTotal).toLocaleString()}</td>

                        <td class="border-indirect col-indirect"></td>
                        <td class="col-indirect text-end">${catTotalRow.mfgIndirect.toLocaleString()}</td>
                        <td class="border-profit col-profit"></td>
                        <td class="col-profit text-end">${catTotalRow.mfgProfit.toLocaleString()}</td>
                        <td class="border-risk col-risk"></td>
                        <td class="col-risk text-end">${catTotalRow.mfgRisk.toLocaleString()}</td>
                        <td class="border-neg col-neg"></td>
                        <td class="col-neg text-end">${catTotalRow.mfgNeg.toLocaleString()}</td>
                        <td class="border-total col-total text-end" style="font-size: 1.05rem;">${catTotalRow.mfgGrandTotal.toLocaleString()}</td>

                        <!-- 獨立灰線樣式總計欄的小計 -->
                        <td class="text-end fw-bold" style="font-size: 1.1rem; border-left: 2px solid #cbd5e1 !important; background-color: #f1f5f9; color: #0f172a;">
                            ${catTotalRow.finalTotal.toLocaleString()}
                        </td>
                    </tr>
                `;
            });

            // 5. 計算 Footer
            let globalCutLose = '-';
            if (grandTotalRow.totalMatQty > 0) {
                globalCutLose = (((grandTotalRow.totalMatQty - grandTotalRow.totalMfgQty) / grandTotalRow.totalMatQty) * 100).toFixed(2) + '%';
            }

            html += `
                </tbody>
                <tfoot>
                <tr class="total-row">
                <td class="sticky-col"></td>
                <td class="sticky-col"></td>
                <td colspan="4"></td>
                <td class="sticky-col-7"></td>
                <td colspan="4" class="text-end">總計：</td>
                
                <td class="text-end fw-bold text-primary">${Math.round(grandTotalRow.totalMatQty).toLocaleString()}</td>
                <td class="text-end fw-bold text-primary">${Math.round(grandTotalRow.totalMfgQty).toLocaleString()}</td>
                <td class="text-center text-danger fw-bold">${globalCutLose}</td>
                
                <td></td>
                <td class="text-end fw-bold">${Math.round(grandTotalRow.matSubtotal).toLocaleString()}</td>
                <td></td>

                ${colItemsCommon.map((col, cIdx) => `
                    <td class="bg-warning bg-opacity-10 section-border-left"></td>
                    <td class="bg-warning bg-opacity-10"></td>
                    <td class="text-end bg-warning bg-opacity-10 fw-bold">${Math.round(colTotalsCommon[cIdx]).toLocaleString()}</td>
                `).join('')}

                <td class="text-end bg-warning bg-opacity-10 fw-bold section-border-left">${Math.round(grandTotalRow.matTotal).toLocaleString()}</td>
                
                <!-- ★ 修改：底部套用直式費率樣式 (材料) -->
                <td class="border-indirect col-indirect"></td>
                <td class="col-indirect text-end">${grandTotalRow.matIndirect.toLocaleString()}</td>
                <td class="border-profit col-profit"></td>
                <td class="col-profit text-end">${grandTotalRow.matProfit.toLocaleString()}</td>
                <td class="border-risk col-risk"></td>
                <td class="col-risk text-end">${grandTotalRow.matRisk.toLocaleString()}</td>
                <td class="border-neg col-neg"></td>
                <td class="col-neg text-end">${grandTotalRow.matNeg.toLocaleString()}</td>
                <td class="border-total col-total text-end" style="font-size: 1.05rem;">${grandTotalRow.matGrandTotal.toLocaleString()}</td>

                ${colItemsMfg.map((col, cIdx) => `
                    <td class="bg-info bg-opacity-10 section-border-left"></td>
                    <td class="bg-info bg-opacity-10 text-center fw-bold">${colTotalsMfgHours[cIdx] > 0 ? colTotalsMfgHours[cIdx].toLocaleString() : '-'}</td>
                `).join('')}

                <td class="section-border-left bg-info bg-opacity-10"></td>
                <td class="bg-info bg-opacity-10"></td>
                <td class="text-end bg-info bg-opacity-10 fw-bold">${Math.round(grandTotalRow.mfgTotal).toLocaleString()}</td>
                
                <!-- ★ 修改：底部套用直式費率樣式 (製造) -->
                <td class="border-indirect col-indirect"></td>
                <td class="col-indirect text-end">${grandTotalRow.mfgIndirect.toLocaleString()}</td>
                <td class="border-profit col-profit"></td>
                <td class="col-profit text-end">${grandTotalRow.mfgProfit.toLocaleString()}</td>
                <td class="border-risk col-risk"></td>
                <td class="col-risk text-end">${grandTotalRow.mfgRisk.toLocaleString()}</td>
                <td class="border-neg col-neg"></td>
                <td class="col-neg text-end">${grandTotalRow.mfgNeg.toLocaleString()}</td>
                <td class="border-total col-total text-end" style="font-size: 1.05rem;">${grandTotalRow.mfgGrandTotal.toLocaleString()}</td>

                <!-- ★ 修改：最終總計區塊獨立樣式 -->
                <td class="text-end fw-bold" style="font-size: 1.15rem; border-left: 2px solid #cbd5e1 !important; background-color: #e2e8f0; color: #0f172a;">
                    ${grandTotalRow.finalTotal.toLocaleString()}
                </td>
                </tr>
                </tfoot>
                </table>
            `;
            
            // 更新外層系統所需的統計資料
            if(this.currentTotals) {
                this.currentTotals.matSum = grandTotalRow.matTotal;
                this.currentTotals.matGrand = grandTotalRow.matGrandTotal;
                this.currentTotals.mfgSum = grandTotalRow.mfgTotal;
                this.currentTotals.mfgGrand = grandTotalRow.mfgGrandTotal;
                this.currentTotals.finalTotal = grandTotalRow.finalTotal;
                this.currentTotals.totalMatQty = grandTotalRow.totalMatQty;
                this.currentTotals.totalMfgQty = grandTotalRow.totalMfgQty;
                this.currentTotals.totalKgWeight = grandTotalRow.totalMatQty; 
                this.currentTotals.totalMfgManHours = grandTotalRow.totalMfgManHours; 
            }

            // ★ 新增保護機制：渲染完成後強制同步更新儀表板上與工時單價相關的 DOM 元素
            setTimeout(() => {
                const totalMhEl = document.getElementById('mxTotalManHours');
                const priceMhEl = document.getElementById('pricePerMh'); // 資訊總覽列的工時單價

                if (totalMhEl) {
                    totalMhEl.textContent = grandTotalRow.totalMfgManHours.toLocaleString();
                }

                if (priceMhEl && grandTotalRow.totalMfgManHours > 0) {
                    // 工時單價 = 製造費用總額 / 總工時
                    const unitPrice = Math.round(grandTotalRow.mfgGrandTotal / grandTotalRow.totalMfgManHours);
                    priceMhEl.textContent = unitPrice.toLocaleString();
                } else if (priceMhEl) {
                    priceMhEl.textContent = '0';
                }
            }, 0);

            return html;

        } catch (error) {
            console.error("Matrix Render Error:", error);
            return `<div class="alert alert-danger">
                矩陣模式載入失敗。<br>
                錯誤訊息: ${error.message}
            </div>`;
        }
    };
}