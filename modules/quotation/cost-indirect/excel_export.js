/* excel_export.js - 人力系統 Excel 匯出專用模組 V1.6 (修正基礎資料未帶入及表頭名稱) */

const IndirectCostExcelExporter = {
    // 共用常數定義 (與 indirect.js 保持一致)
    CATEGORIES: ['專案人力', '臨時辦公室', '住宿', '交通費', '機具', '整地', '臨時圍籬', '工安設施', '其他'],

    export(context) {
        if (!window.XLSX_STYLE_LOADED) {
            if (typeof LiangLianSystem !== 'undefined' && typeof LiangLianSystem.showToast === 'function') {
                LiangLianSystem.showToast('首次匯出需載入樣式引擎，請稍候...', 'info');
            }
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";
            script.onload = () => {
                window.XLSX_STYLE_LOADED = true;
                this._execute(context);
            };
            script.onerror = () => {
                alert('載入樣式引擎失敗，無法進行格式化匯出。');
            };
            document.head.appendChild(script);
        } else {
            this._execute(context);
        }
    },

    _execute(context) {
        try {
            const workbook = XLSX.utils.book_new();

            const projectInfo = this._getProjectInfo(context);
            const dateStr = projectInfo.date.replace(/-/g, '');
            const fileName = `人力間接成本與進度表_${projectInfo.qNo}_${dateStr}.xlsx`;

            const wsMain = this._buildMainSheet(context, projectInfo);
            if (wsMain) XLSX.utils.book_append_sheet(workbook, wsMain, "人力間接成本");

            const wsSchedule = this._buildScheduleSheet(context, projectInfo);
            if (wsSchedule) XLSX.utils.book_append_sheet(workbook, wsSchedule, "人力進度規劃");

            XLSX.writeFile(workbook, fileName);

            if (typeof LiangLianSystem !== 'undefined' && typeof LiangLianSystem.showToast === 'function') {
                LiangLianSystem.showToast('Excel 匯出成功！包含成本與進度表。', 'success');
            } else {
                alert('Excel 匯出成功！包含成本與進度表。');
            }

        } catch (error) {
            console.error('匯出 Excel 發生錯誤:', error);
            alert('匯出 Excel 失敗，請檢查操作是否正確。');
        }
    },

    _getProjectInfo(context) {
        const urlParams = new URLSearchParams(window.location.search);
        
        // ★ 核心修正：如果 URL 沒有帶入 projectId，給予預設值 'EQ25090001'，確保匯出時基礎資料能成功帶入
        const currentProjectId = urlParams.get('projectId') || urlParams.get('id') || 'EQ25090001'; 
        
        const mockProjectMaster = [
            { id: 'EQ25090001', quotationId: 'LME-11210-PE060', name: '台積電12廠潔淨室建置工程', owner: '台灣積體電路', product: '潔淨室系統' },
            { id: 'EQ25090002', quotationId: 'LME-11210-PD201', name: '聯電8廠產線自動化升級工程', owner: '聯華電子', product: '產線自動化系統' },
            { id: 'EQ25090003', quotationId: 'LME-11210-PC020', name: '鴻海土城廠智慧工廠MES系統', owner: '鴻海精密', product: 'MES系統' }
        ];
        
        const projData = mockProjectMaster.find(p => p.id === currentProjectId) || {
            owner: '未指定', name: '未指定', product: '未指定', quotationId: '未提供'
        };

        const qNo = projData.quotationId || '未提供';
        const parsedProduct = context.getProductTypeFromNo ? context.getProductTypeFromNo(qNo) : '未定義';
        const product = parsedProduct !== '未定義' ? parsedProduct : projData.product;
        
        return {
            qNo: qNo,
            owner: projData.owner,
            projectName: urlParams.get('name') || projData.name || '未提供名稱',
            product: product,
            revision: 'V1.0',
            date: document.getElementById('estimationDate')?.value || new Date().toISOString().split('T')[0]
        };
    },

    _cleanTableDom(tableElement, targetKeywordsToRemove) {
        const cloneTable = tableElement.cloneNode(true);

        cloneTable.querySelectorAll('th, td').forEach(cell => {
            cell.removeAttribute('style');
            cell.classList.remove('text-danger', 'text-primary', 'bg-light', 'bg-white');
        });

        cloneTable.querySelectorAll('input').forEach(input => {
            const textNode = document.createTextNode(input.value || '');
            input.parentNode.replaceChild(textNode, input);
        });

        cloneTable.querySelectorAll('select').forEach(select => {
            const selectedOption = select.options[select.selectedIndex];
            const textNode = document.createTextNode(selectedOption ? selectedOption.text : '');
            select.parentNode.replaceChild(textNode, select);
        });

        cloneTable.querySelectorAll('button, .btn-sort').forEach(btn => btn.remove());

        let colIndicesToRemove = [];
        const firstRow = cloneTable.querySelector('thead tr');
        
        if (firstRow) {
            Array.from(firstRow.children).forEach((cell, idx) => {
                if (targetKeywordsToRemove.some(kw => cell.textContent.trim().includes(kw))) {
                    colIndicesToRemove.push(idx);
                }
            });
        }
        
        colIndicesToRemove.sort((a, b) => b - a);

        if (firstRow) {
            colIndicesToRemove.forEach(idx => {
                if (firstRow.children[idx]) firstRow.removeChild(firstRow.children[idx]);
            });
        }

        const tbody = cloneTable.querySelector('tbody');
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(row => {
                if (row.classList.contains('category-header-row') || 
                    row.classList.contains('category-subtotal-row') || 
                    row.id === 'estimationTableFooter') {
                    while(row.firstChild) { row.removeChild(row.firstChild); }
                    return; 
                }
                
                colIndicesToRemove.forEach(idx => {
                    if (row.children[idx]) row.removeChild(row.children[idx]);
                });
            });
        }

        const tfoot = cloneTable.querySelector('tfoot');
        if (tfoot) {
            tfoot.querySelectorAll('tr').forEach(row => {
                while(row.firstChild) { row.removeChild(row.firstChild); }
            });
        }
        const footerRow = cloneTable.querySelector('#estimationTableFooter');
        if (footerRow) {
            while(footerRow.firstChild) { footerRow.removeChild(footerRow.firstChild); }
        }

        return cloneTable;
    },

    _insertProjectInfoHeaders(thead, maxCols, title, info) {
        if (!thead) return;

        const infoPairs = [
            [ { label: '業主：', value: info.owner }, { label: '版次：', value: info.revision } ],
            [ { label: '工程名稱：', value: info.projectName }, { label: '估算日期：', value: info.date } ],
            [ { label: '產品：', value: info.product }, { label: '報價編號：', value: info.qNo } ]
        ];

        let rowsToInsert = [];
        const trTitle = document.createElement('tr');
        trTitle.className = 'title-row';
        const thTitle = document.createElement('th');
        thTitle.textContent = title;
        thTitle.colSpan = maxCols; 
        trTitle.appendChild(thTitle);
        rowsToInsert.push(trTitle);

        const halfCols = Math.floor(maxCols / 2);
        const val1Cols = halfCols - 2;
        const val2Cols = maxCols - halfCols - 2;

        infoPairs.forEach(pair => {
            const tr = document.createElement('tr');
            tr.className = 'basic-info-row';
            const th1 = document.createElement('th'); th1.textContent = pair[0].label; th1.colSpan = 2; tr.appendChild(th1);
            const td1 = document.createElement('td'); td1.textContent = pair[0].value; td1.colSpan = val1Cols > 0 ? val1Cols : 1; tr.appendChild(td1);
            const th2 = document.createElement('th'); th2.textContent = pair[1].label; th2.colSpan = 2; tr.appendChild(th2);
            const td2 = document.createElement('td'); td2.textContent = pair[1].value; td2.colSpan = val2Cols > 0 ? val2Cols : 1; tr.appendChild(td2);
            rowsToInsert.push(tr);
        });

        rowsToInsert.reverse().forEach(tr => {
            thead.insertBefore(tr, thead.firstChild);
        });
    },

    // =========== 產生「人力進度規劃」分頁 ===========
    _buildScheduleSheet(context, projectInfo) {
        const tableElement = document.getElementById('scheduleTableBody')?.closest('table');
        if (!tableElement) return null;

        const cloneTable = this._cleanTableDom(tableElement, ['操作']);
        
        const originalHeaders = cloneTable.querySelectorAll('thead tr');
        originalHeaders.forEach(tr => tr.classList.add('table-header-row'));

        const months = context.getMonthsRange();
        const ganttStartIdx = 4; // E欄開始是甘特圖
        
        // 進度表的 maxCols 是固定的：前方欄位數 + 月份數
        let maxCols = ganttStartIdx + months.length;

        // ★ 修改此處報表標題名稱為「人力進度規劃表」
        this._insertProjectInfoHeaders(cloneTable.querySelector('thead'), maxCols, '人力進度規劃表', projectInfo);

        cloneTable.querySelectorAll('th, td').forEach(cell => {
            if (!cell.textContent || cell.textContent.trim() === '') cell.textContent = '\u00A0';
        });

        const trs = cloneTable.querySelectorAll('tr');
        const rowTypes = Array.from(trs).map(tr => {
            if (tr.classList.contains('title-row')) return 'title';
            if (tr.classList.contains('basic-info-row')) return 'basic_info';
            if (tr.classList.contains('table-header-row')) return 'table_header';
            return 'table_data';
        });

        const ws = XLSX.utils.table_to_sheet(cloneTable, { raw: true });
        
        if (ws['!ref']) {
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                    if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
                }

                const rType = rowTypes[R] || 'table_data';
                const isDataRow = rType === 'table_data';
                const itemIndex = R - 6; 
                const scheduleItem = isDataRow ? context.data.scheduleItems[itemIndex] : null;

                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                    const cell = ws[cellAddress];
                    
                    if (!cell.s) cell.s = {};
                    cell.s.font = { name: '標楷體', sz: 11, color: { rgb: "000000" } };
                    cell.s.alignment = { vertical: 'center', wrapText: true, horizontal: 'center' };

                    let borderStyle = null;

                    if (!['title', 'basic_info'].includes(rType)) {
                        borderStyle = {
                            top: { style: 'thin', color: { rgb: "000000" } }, 
                            bottom: { style: 'thin', color: { rgb: "000000" } },
                            left: { style: 'thin', color: { rgb: "000000" } }, 
                            right: { style: 'thin', color: { rgb: "000000" } }
                        };
                    }

                    if (['title', 'table_header'].includes(rType)) cell.s.font.bold = true;
                    if (rType === 'basic_info' && typeof cell.v === 'string' && cell.v.includes('：')) cell.s.font.bold = true;

                    if (rType === 'title') {
                        cell.s.font.sz = 16; cell.s.font.underline = true;
                    } else if (rType === 'basic_info') {
                        cell.s.alignment.horizontal = 'left';
                    } else if (rType === 'table_header') {
                        cell.s.fill = { patternType: "solid", fgColor: { rgb: "F1F5F9" } }; 
                    } else if (isDataRow) {
                        if (C === 1) cell.s.alignment.horizontal = 'left'; 
                        
                        if (C >= ganttStartIdx && scheduleItem) {
                            const monthIndex = C - ganttStartIdx;
                            const monthData = months[monthIndex];
                            
                            if (monthData) {
                                let itemStartMonth = (scheduleItem.startMonth.length === 7 ? scheduleItem.startMonth + '-01' : scheduleItem.startMonth).substring(0, 7);
                                let itemEndMonth = (scheduleItem.endMonth.length === 7 ? scheduleItem.endMonth + '-28' : scheduleItem.endMonth).substring(0, 7);
                                
                                let isCurrentActive = monthData.key >= itemStartMonth && monthData.key <= itemEndMonth;

                                if (isCurrentActive) {
                                    cell.s.fill = { patternType: "solid", fgColor: { rgb: "93C5FD" } };

                                    let isPrevActive = false;
                                    if (monthIndex > 0) {
                                        const prevMonth = months[monthIndex - 1];
                                        isPrevActive = prevMonth.key >= itemStartMonth && prevMonth.key <= itemEndMonth;
                                    }
                                    
                                    let isNextActive = false;
                                    if (monthIndex < months.length - 1) {
                                        const nextMonth = months[monthIndex + 1];
                                        isNextActive = nextMonth.key >= itemStartMonth && nextMonth.key <= itemEndMonth;
                                    }

                                    if (isPrevActive) {
                                        borderStyle.left = { style: 'thin', color: { rgb: "93C5FD" } };
                                    }
                                    if (isNextActive) {
                                        borderStyle.right = { style: 'thin', color: { rgb: "93C5FD" } };
                                    }
                                }
                            }
                        }
                    }

                    if (borderStyle) {
                        cell.s.border = borderStyle;
                    }
                }
            }

            const colWidths = [];
            for (let i = 0; i < maxCols; i++) {
                if (i === 0) colWidths.push({ wch: 6 });       
                else if (i === 1) colWidths.push({ wch: 28 }); 
                else if (i === 2 || i === 3) colWidths.push({ wch: 12 }); 
                else colWidths.push({ wch: 6 });               
            }
            ws['!cols'] = colWidths;
        }
        return ws;
    },

    // =========== 產生「人力間接成本」分頁 ===========
    _buildMainSheet(context, projectInfo) {
        const tableElement = document.getElementById('mainTable');
        if (!tableElement) return null;

        const cloneTable = this._cleanTableDom(tableElement, ['操作', '專案分類']);
        
        let maxCols = 0;
        const headerRowForCount = cloneTable.querySelector('thead tr');
        if (headerRowForCount) {
            Array.from(headerRowForCount.children).forEach(th => {
                maxCols += parseInt(th.getAttribute('colspan') || 1);
            });
        }

        const originalHeaders = cloneTable.querySelectorAll('thead tr');
        originalHeaders.forEach(tr => tr.classList.add('table-header-row'));
        
        const colAlignments = {};
        const months = context.getMonthsRange();
        const ganttStartIdx = 7; 
        const ganttEndIdx = ganttStartIdx + months.length;

        const headerRow = originalHeaders[0]; 
        if (headerRow) {
            let currentIdx = 0;
            for (const th of headerRow.children) {
                const text = th.textContent.trim();
                const colspan = parseInt(th.getAttribute('colspan') || 1);
                
                let align = 'center'; 
                if (text.includes('工程項目名稱') || text.includes('品名規格') || text.includes('備註') || text.includes('內容') || text.includes('職稱')) {
                    align = 'left';
                } else if (['單價', '小計', '費用', '利潤', '風險', '議價', '總計', '金額'].some(kw => text.includes(kw))) {
                    align = 'right';
                }
                
                for (let i = 0; i < colspan; i++) {
                    colAlignments[currentIdx + i] = align;
                }
                currentIdx += colspan;
            }
        }

        cloneTable.querySelectorAll('.category-header-row').forEach(row => {
            const td = document.createElement('td');
            td.colSpan = maxCols;
            td.textContent = row.getAttribute('data-catname') || '分類項目';
            row.appendChild(td);
        });

        const totalsObj = context.calculateAllTotals().totals;
        const groups = {};
        this.CATEGORIES.forEach(c => groups[c] = []);
        groups['未分類'] = [];
        context.data.items.forEach(obj => {
            const cat = obj.category || '未分類';
            if (groups[cat]) groups[cat].push(obj);
            else groups['未分類'].push(obj);
        });

        let subtotalIdx = 0;
        const subtotalRows = cloneTable.querySelectorAll('.category-subtotal-row');
        
        Object.keys(groups).forEach(catName => {
            const groupItems = groups[catName];
            if (groupItems.length === 0) return;
            
            let catGanttSums = {};
            let catSum = { qty: 0, base: 0, indirectAmt: 0, profitAmt: 0, riskAmt: 0, negotiationAmt: 0, grand: 0, manHours: 0, itemCount: 0 };
            
            groupItems.forEach(item => {
                if (String(item.unit).toLowerCase() === 'm' && item.ganttData) {
                    Object.keys(item.ganttData).forEach(k => {
                        if(!catGanttSums[k]) catGanttSums[k] = 0;
                        catGanttSums[k] += (parseFloat(item.ganttData[k]) || 0);
                    });
                }
                const qty = parseFloat(item.qty) || 0;
                const price = parseFloat(item.price) || 0;
                const baseCost = Math.round(qty * price);
                const indAmt = Math.round(baseCost * ((parseFloat(item.indirectRate)||0) / 100));
                const proAmt = Math.round((baseCost + indAmt) * ((parseFloat(item.profitRate)||0) / 100));
                const riskAmt = Math.round((baseCost + indAmt + proAmt) * ((parseFloat(item.riskRate)||0) / 100));
                const negAmt = Math.round((baseCost + indAmt + proAmt + riskAmt) * ((parseFloat(item.negotiationRate)||0) / 100));

                catSum.qty += qty;
                catSum.base += baseCost;
                catSum.indirectAmt += indAmt;
                catSum.profitAmt += proAmt;
                catSum.riskAmt += riskAmt;
                catSum.negotiationAmt += negAmt;
                catSum.grand += (baseCost + indAmt + proAmt + riskAmt + negAmt);
                catSum.manHours += (parseFloat(item.manHours) || 0);
                catSum.itemCount++;
            });

            if (subtotalRows[subtotalIdx]) {
                const tr = subtotalRows[subtotalIdx];
                let subGanttHtml = '';
                months.forEach(m => { subGanttHtml += `<td>${catGanttSums[m.key] || ''}</td>`; });

                tr.innerHTML = `
                    <td colspan="7">${catName} 小計：</td>
                    ${subGanttHtml}
                    <td></td><td>${catSum.qty}</td><td></td>
                    <td>${Math.round(catSum.base).toLocaleString()}</td><td></td><td></td>
                    <td>${Math.round(catSum.indirectAmt).toLocaleString()}</td><td></td>
                    <td>${Math.round(catSum.profitAmt).toLocaleString()}</td><td></td>
                    <td>${Math.round(catSum.riskAmt).toLocaleString()}</td><td></td>
                    <td>${Math.round(catSum.negotiationAmt).toLocaleString()}</td>
                    <td>${Math.round(catSum.grand).toLocaleString()}</td>
                    <td>${catSum.manHours}</td><td></td>
                `;
            }
            subtotalIdx++;
        });

        const footerRow = cloneTable.querySelector('#estimationTableFooter');
        if (footerRow) {
            const calcAvg = (sum, count) => count > 0 ? (sum / count).toFixed(1) + '%' : '0.0%';
            let ganttTotalHtml = '';
            months.forEach(m => { ganttTotalHtml += `<td>${totalsObj.ganttMonthlyTotals[m.key] || ''}</td>`; });

            footerRow.innerHTML = `
                <td colspan="7">間接總計：</td>
                ${ganttTotalHtml}
                <td></td><td>${totalsObj.totalQty}</td><td></td>
                <td>${Math.round(totalsObj.base).toLocaleString()}</td><td></td>
                <td>${calcAvg(totalsObj.sumInd, totalsObj.itemCount)}</td>
                <td>${Math.round(totalsObj.indirect).toLocaleString()}</td>
                <td>${calcAvg(totalsObj.sumPro, totalsObj.itemCount)}</td>
                <td>${Math.round(totalsObj.profit).toLocaleString()}</td>
                <td>${calcAvg(totalsObj.sumRisk, totalsObj.itemCount)}</td>
                <td>${Math.round(totalsObj.risk).toLocaleString()}</td>
                <td>${calcAvg(totalsObj.sumNeg, totalsObj.itemCount)}</td>
                <td>${Math.round(totalsObj.negotiation).toLocaleString()}</td>
                <td>${Math.round(totalsObj.grand).toLocaleString()}</td>
                <td>${totalsObj.manHours.toLocaleString()}</td><td></td>
            `;
        }

        // ★ 修改此處報表標題名稱為「人力間接成本估算表」
        this._insertProjectInfoHeaders(cloneTable.querySelector('thead'), maxCols, '人力間接成本估算表', projectInfo);

        const tfoot = cloneTable.querySelector('tfoot') || cloneTable.querySelector('tbody');
        if (tfoot) {
            const remarksValue = document.getElementById('projectRemarks')?.value || '';
            const trRemarkTitle = document.createElement('tr');
            trRemarkTitle.className = 'remark-title-row'; 
            const tdRemarkTitle = document.createElement('td'); 
            tdRemarkTitle.textContent = '【備註事項】'; 
            tdRemarkTitle.colSpan = maxCols; 
            trRemarkTitle.appendChild(tdRemarkTitle); 
            tfoot.appendChild(trRemarkTitle);

            const lines = (remarksValue || '無').split('\n');
            lines.forEach(line => {
                const trRemark = document.createElement('tr');
                trRemark.className = 'remark-data-row'; 
                const tdRemark = document.createElement('td');
                tdRemark.textContent = line || '\u200B'; 
                tdRemark.colSpan = maxCols;
                trRemark.appendChild(tdRemark);
                tfoot.appendChild(trRemark);
            });

            const space1 = Math.floor((maxCols - 9) / 3);
            const space2 = space1;
            const space3 = (maxCols - 9) - space1 - space2;

            const trSign = document.createElement('tr');
            trSign.className = 'signature-row'; 
            
            const tdSign1 = document.createElement('td'); tdSign1.textContent = '估算人：'; tdSign1.colSpan = 3; trSign.appendChild(tdSign1);
            const tdSign1Space = document.createElement('td'); tdSign1Space.colSpan = space1 > 0 ? space1 : 1; trSign.appendChild(tdSign1Space);
            
            const tdSign2 = document.createElement('td'); tdSign2.textContent = '單位主管：'; tdSign2.colSpan = 3; trSign.appendChild(tdSign2);
            const tdSign2Space = document.createElement('td'); tdSign2Space.colSpan = space2 > 0 ? space2 : 1; trSign.appendChild(tdSign2Space);
            
            const tdSign3 = document.createElement('td'); tdSign3.textContent = '核准：'; tdSign3.colSpan = 3; trSign.appendChild(tdSign3);
            const tdSign3Space = document.createElement('td'); tdSign3Space.colSpan = space3 > 0 ? space3 : 1; trSign.appendChild(tdSign3Space);
            
            tfoot.appendChild(trSign);
        }

        cloneTable.querySelectorAll('th, td').forEach(cell => {
            if (!cell.textContent || cell.textContent.trim() === '') {
                cell.textContent = '\u00A0';
            }
        });

        const trs = cloneTable.querySelectorAll('tr');
        const rowTypes = Array.from(trs).map(tr => {
            if (tr.classList.contains('title-row')) return 'title';
            if (tr.classList.contains('basic-info-row')) return 'basic_info';
            if (tr.classList.contains('table-header-row')) return 'table_header';
            if (tr.classList.contains('category-header-row')) return 'category_header';
            if (tr.classList.contains('category-subtotal-row')) return 'subtotal';
            if (tr.classList.contains('total-row') || tr.id === 'estimationTableFooter') return 'total';
            if (tr.classList.contains('remark-title-row')) return 'remarks_title';
            if (tr.classList.contains('remark-data-row')) return 'remarks_data';
            if (tr.classList.contains('signature-row')) return 'signatures';
            return 'table_data';
        });

        const ws = XLSX.utils.table_to_sheet(cloneTable, { raw: true });

        if (ws['!ref']) {
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                    if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
                }

                const rType = rowTypes[R] || 'table_data';
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                    const cell = ws[cellAddress];
                    
                    if (!cell.s) cell.s = {};
                    cell.s.font = { name: '標楷體', sz: 11, color: { rgb: "000000" } };
                    cell.s.alignment = { vertical: 'center', wrapText: true };

                    if (['table_header', 'total'].includes(rType)) {
                        cell.s.fill = { patternType: "solid", fgColor: { rgb: "F1F5F9" } }; 
                    } else if (['subtotal'].includes(rType)) {
                        cell.s.fill = { patternType: "solid", fgColor: { rgb: "FBF9EF" } }; 
                    } else if (rType === 'table_data' && C >= ganttStartIdx && C < ganttEndIdx) {
                        cell.s.fill = { patternType: "solid", fgColor: { rgb: "F9EEED" } };
                    }

                    const isNoBorder = ['title', 'basic_info'].includes(rType);
                    if (!isNoBorder) {
                        cell.s.border = {
                            top: { style: 'thin', color: { rgb: "000000" } }, bottom: { style: 'thin', color: { rgb: "000000" } },
                            left: { style: 'thin', color: { rgb: "000000" } }, right: { style: 'thin', color: { rgb: "000000" } }
                        };
                    }

                    if (['title', 'table_header', 'category_header', 'subtotal', 'total', 'remarks_title'].includes(rType)) {
                        cell.s.font.bold = true;
                    } else if (['basic_info', 'signatures'].includes(rType) && typeof cell.v === 'string' && cell.v.includes('：')) {
                        cell.s.font.bold = true;
                    }

                    if (rType === 'title') {
                        cell.s.font.sz = 16; cell.s.font.underline = true; cell.s.alignment.horizontal = 'center';
                    } else if (rType === 'basic_info' || rType === 'signatures' || rType === 'category_header' || rType === 'remarks_title' || rType === 'remarks_data') {
                        cell.s.alignment.horizontal = 'left';
                    } else if (['table_header', 'table_data'].includes(rType)) {
                        cell.s.alignment.horizontal = colAlignments[C] || 'center';
                    } else if (['subtotal', 'total'].includes(rType)) {
                        if (C < ganttStartIdx) {
                            cell.s.alignment.horizontal = 'right';
                        } else if (C >= ganttStartIdx && C < ganttEndIdx) {
                            cell.s.alignment.horizontal = 'center';
                        } else {
                            cell.s.alignment.horizontal = colAlignments[C] || 'center';
                        }
                    }
                }
            }
        }
        return ws;
    }
};