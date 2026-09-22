// 材料編號設定
// ★★★ 重要架構說明 ★★★
// 這張表比照「成本代碼設定」的假設：實際資料量非常大（業主估計可能超過 20 萬筆，
// 因為一個成本代碼底下可以掛好幾筆材料編號），所以前端一樣不整批載入、不整批過濾，
// 每次搜尋/篩選/排序/換頁/新增/編輯/刪除都設計成「重新查詢一次」，模擬串接後端
// API 的行為。
//
// ★ 跟業主的最終規劃是：材料編號主檔最終會由後端跟 LL 系統做「中間檔」資料串接
//   （不是使用者手動匯入檔案），現階段業主自己的材編基礎還沒建好，所以這個畫面
//   先當作正式的手動維護介面來用。之後後端接上中間檔之後，資料來源在背後換掉，
//   這個畫面的 API 呼叫介面不需要跟著改。
//
// ★ TODO(後端整合)：fetchMaterialCodes()／fetchCostCodeOptions() 都是用一份不到
//   100 筆的 mock 資料模擬「伺服器查詢」，實際串接後端時把內部實作換成真正的
//   API 呼叫即可，呼叫端的參數格式已經照真正 API 會需要的樣子設計。
// ★ TODO(後端整合)：成本代碼下拉查詢目前呼叫的是這裡自己模擬的一份成本代碼清單，
//   跟「成本代碼設定」頁面各自維護一份 mock 資料。串接後端後，兩邊都應該呼叫
//   同一支「成本代碼查詢」API，不要各自模擬。
const MaterialCodeSettings = (function() {
    'use strict';

    // ============================================================
    // 1. 模擬資料庫 —— 材料編號明細（僅為展示用，代表後端大量資料的一小部分樣本）
    //    照業主提供的參考截圖轉換，涵蓋 7 個產品代碼：PD/MM/SF/SM/SS/ST/PS
    // ============================================================
    const mockMaterials = [
        // --- PD 貯槽 ---
        { id: 'MC001', costCode: 'DPDMM101', materialNo: 'M101-C5F', description: 'PLATE_Shell (SA537 CL1)' },
        { id: 'MC002', costCode: 'DPDMM101', materialNo: 'M101-C5F', description: 'PLATE_Head (SA537 CL1)' },
        { id: 'MC003', costCode: 'DPDMM101', materialNo: 'M101-C5F', description: 'PLATE_other (SA537 CL1)' },
        { id: 'MC004', costCode: 'DPDMM101', materialNo: 'M101-C06Q', description: 'PLATE_other (SA36)' },
        { id: 'MC005', costCode: 'DPDMP204', materialNo: 'P204-C3N', description: 'PIPE (SA333-6)' },
        { id: 'MC006', costCode: 'DPDMP415', materialNo: 'P415-C3N', description: 'Flange (SA350 LF2)' },
        { id: 'MC007', costCode: 'DPDMM305', materialNo: 'M305-C0000', description: 'Bolts & Nuts (C.S.)' },
        { id: 'MC008', costCode: 'DPDMM702', materialNo: 'M702-H44A1', description: 'Gasket' },
        { id: 'MC009', costCode: 'DPDME420', materialNo: 'M990', description: '其他(五金零件及配件等)' },
        { id: 'MC010', costCode: 'DPDMM451', materialNo: 'M451-C00', description: '焊條 (CS)' },
        { id: 'MC011', costCode: 'DPDMZ000', materialNo: 'T790', description: '消耗性材料' },

        // --- MM 材料買賣 ---
        { id: 'MC012', costCode: 'DMMMM866', materialNo: 'M866-C04', description: 'H BEAM(A36)' },
        { id: 'MC013', costCode: 'DMMMM863', materialNo: 'M863-CSL', description: 'CHANNEL(A36)' },
        { id: 'MC014', costCode: 'DMMMM101', materialNo: 'M101-C04', description: 'Plate(A36)' },
        { id: 'MC015', costCode: 'DMMMM101', materialNo: 'M101-ST8', description: 'Plate(#316L)' },
        { id: 'MC016', costCode: 'DMMMA423', materialNo: 'A423', description: '百葉窗(#316L)' },
        { id: 'MC017', costCode: 'DMMMM210', materialNo: 'M210-SS5', description: 'Wire Mesh(#316L)' },
        { id: 'MC018', costCode: 'DMMMM924', materialNo: 'M704-PR0', description: 'Rubber' },
        { id: 'MC019', costCode: 'DMMMM302', materialNo: 'M302', description: 'Anchor Bolt' },
        { id: 'MC020', costCode: 'DMMMM305', materialNo: 'M305', description: 'ST-Bolt' },
        { id: 'MC021', costCode: 'DMMMM305', materialNo: 'M303', description: 'M-Bolt' },
        { id: 'MC022', costCode: 'DMMME420', materialNo: 'M990', description: '其他' },
        { id: 'MC023', costCode: 'DMMMM451', materialNo: 'M451-C00', description: '焊條 (C.S.)' },
        { id: 'MC024', costCode: 'DMMMM451', materialNo: 'M451-S00', description: '焊條 (S.S.)' },
        { id: 'MC025', costCode: 'DMMMZ000', materialNo: 'T790', description: '消耗性材料' },

        // --- SF 加熱爐 ---
        { id: 'MC026', costCode: 'DSFMM101', materialNo: 'M101-C04', description: '對流區爐體Plate(A36)' },
        { id: 'MC027', costCode: 'DSFMM866', materialNo: 'M866-C04', description: '對流區爐體H BEAM(A36)' },
        { id: 'MC028', costCode: 'DSFMM861', materialNo: 'M861-C04', description: '對流區爐體CHANNEL(A36)' },
        { id: 'MC029', costCode: 'DSFMM863', materialNo: 'M863-CSQ', description: '對流區爐體ANGLE(A36)' },
        { id: 'MC030', costCode: 'DSFMP30E', materialNo: 'P30E-C04', description: 'End Tubesheet Plate(13t-A36)' },
        { id: 'MC031', costCode: 'DSFMP852', materialNo: 'P852-C04', description: 'End Tubesheet F.B(13t-A36)' },
        { id: 'MC032', costCode: 'DSFMM101', materialNo: 'M101-C04', description: 'Rad. Arch(A36)' },
        { id: 'MC033', costCode: 'DSFMM101', materialNo: 'M101-ST1', description: 'Top Stack(6t-#304)' },
        { id: 'MC034', costCode: 'DSFMP204', materialNo: 'P204-C17', description: 'Rad. Coil(A106-B)' },
        { id: 'MC035', costCode: 'DSFMP204', materialNo: 'P304-C10', description: 'Fitting(A105)' },

        // --- SM 模組設備 ---
        { id: 'MC036', costCode: 'DSMMM101', materialNo: 'M101-ST3', description: "鋼板 22t*5' (A240-304L)(SHELL)" },
        { id: 'MC037', costCode: 'DSMMM101', materialNo: 'M101-ST3', description: "鋼板 22t*2000 (A240-304L)(HEAD)" },
        { id: 'MC038', costCode: 'DSMMM101', materialNo: 'M101-ST3', description: "鋼板 24t*8' (A240-304L)(CONE)" },
        { id: 'MC039', costCode: 'DSMMM101', materialNo: 'M101-C57', description: "鋼板 散料' (A516-70)(LUGS)" },
        { id: 'MC040', costCode: 'DSMMP415', materialNo: 'P415-S10', description: 'Flange (A182-F304)' },
        { id: 'MC041', costCode: 'DSMMP204', materialNo: 'P204-S31', description: 'PIPE (A312-TP304)' },
        { id: 'MC042', costCode: 'DSMMM702', materialNo: 'M702-H03', description: 'Gasket' },
        { id: 'MC043', costCode: 'DSMMM908', materialNo: 'M908-ST1', description: '銘牌' },
        { id: 'MC044', costCode: 'DSMMM303', materialNo: 'M305-SH0', description: 'Bolt' },
        { id: 'MC045', costCode: 'DSMMZ000', materialNo: 'T790', description: '消耗性材料' },

        // --- SS 鋼結構 ---
        { id: 'MC046', costCode: 'DSSMM863', materialNo: 'M863-CSQ', description: 'H型鋼 Monorail' },
        { id: 'MC047', costCode: 'DSSMM869', materialNo: 'M861-C06', description: 'L型鋼 Monorail' },
        { id: 'MC048', costCode: 'DSSMM101', materialNo: 'M101-C06', description: '鋼板 Monorail' },
        { id: 'MC049', costCode: 'DSSMM305', materialNo: 'M303-C10', description: '螺栓 Monorail' },
        { id: 'MC050', costCode: 'DSSMM852', materialNo: 'M852-C06', description: 'FB Handrail & Ladders' },
        { id: 'MC051', costCode: 'DSSMM851', materialNo: 'M851-C06', description: 'RB Handrail & Ladders' },
        { id: 'MC052', costCode: 'DSSMP204', materialNo: 'P204-C0D', description: 'PIPE Handrail & Ladders' },
        { id: 'MC053', costCode: 'DSSMP30B', materialNo: 'P304-C24', description: '90 ELBOW Handrail & Ladders' },
        { id: 'MC054', costCode: 'DSSME420', materialNo: 'M990', description: '其他' },
        { id: 'MC055', costCode: 'DSSMM451', materialNo: 'M451-C00', description: '焊條' },

        // --- ST 大型儲槽 ---
        { id: 'MC056', costCode: 'DSTMM101', materialNo: 'M101-STJ', description: "鋼板(SA-240-304) 8'板(主體料)10t" },
        { id: 'MC057', costCode: 'DSTMM101', materialNo: 'M101-STJ', description: "鋼板(SA-240-304) 8'板(主體料)6t" },
        { id: 'MC058', costCode: 'DSTMM101', materialNo: 'M101-C06', description: '鋼板(SA-36)(欄杆,旋梯用料)' },
        { id: 'MC059', costCode: 'DSTMP415', materialNo: 'P415-S18', description: 'Flange' },
        { id: 'MC060', costCode: 'DSTMM702', materialNo: 'M702-H03', description: 'Gasket' },
        { id: 'MC061', costCode: 'DSTMP204', materialNo: 'P204-S3B', description: 'PIPE (SA-312-TP304)' },
        { id: 'MC062', costCode: 'DSTMM917', materialNo: 'P304-S47', description: '管件(fitting) ELBOW SA-403-WP304' },

        // --- PS 球形槽 ---
        { id: 'MC063', costCode: 'DPSMM101', materialNo: 'M101-AP0', description: 'PLATE-鋼板本體(34t~36t-SPV490 Q SR)' },
        { id: 'MC064', costCode: 'DPSMM101', materialNo: 'M101-AP0', description: "PLATE-上腳柱Column(12t-SPV490 Q SR)" },
        { id: 'MC065', costCode: 'DPSMP204', materialNo: 'P204-C0A', description: '腳柱及斜接(12"&18"A53-B-S)-管件' },
        { id: 'MC066', costCode: 'DPSMM851', materialNo: 'M851-C04', description: 'Round Bar(A36)' },
        { id: 'MC067', costCode: 'DPSMP347', materialNo: 'P306-C22AS', description: '上腳柱CAP(18"-A234-WPB)' },
        { id: 'MC068', costCode: 'DPSMP415', materialNo: 'P415-C10', description: "Noz. Fl'g(A105)" },
        { id: 'MC069', costCode: 'DPSMP204', materialNo: 'P204-C17', description: 'Noz. PIPE(A106-B)' }
    ];

    // 補上建立人／最後更新（用固定規則產生展示用資料，不是真的操作紀錄）
    // ★ TODO(後端整合)：改為後端實際記錄的建立人/更新時間
    const MOCK_CREATORS = ['張育霖', '陳怡君'];
    mockMaterials.forEach((m, i) => {
        m.createdBy = MOCK_CREATORS[i % MOCK_CREATORS.length];
        m.updatedAt = `2025-${String(9 + (i % 4)).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`;
    });

    // ============================================================
    // 2. 模擬資料庫 —— 成本代碼查詢用（跟成本代碼設定各自維護一份 mock，見檔頭 TODO）
    // ============================================================
    const mockCostCodes = [
        { costCode: 'DPDMM101', productCode: 'PD', costDesc: '鋼板類', accountCode: '1251M1' },
        { costCode: 'DPDMP204', productCode: 'PD', costDesc: 'PIPE類', accountCode: '1251P2' },
        { costCode: 'DPDMP415', productCode: 'PD', costDesc: 'Flange類', accountCode: '1251P4' },
        { costCode: 'DPDMM305', productCode: 'PD', costDesc: '螺栓類', accountCode: '1251M3' },
        { costCode: 'DPDMM702', productCode: 'PD', costDesc: '墊片類', accountCode: '1251M7' },
        { costCode: 'DPDME420', productCode: 'PD', costDesc: '其他雜項', accountCode: '1251E4' },
        { costCode: 'DPDMM451', productCode: 'PD', costDesc: '焊材類', accountCode: '1251M4' },
        { costCode: 'DPDMZ000', productCode: 'PD', costDesc: '消耗性材料', accountCode: '1251Z0' },

        { costCode: 'DMMMM866', productCode: 'MM', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DMMMM863', productCode: 'MM', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DMMMM101', productCode: 'MM', costDesc: '鋼板類', accountCode: '1251M1' },
        { costCode: 'DMMMA423', productCode: 'MM', costDesc: '雜項材料', accountCode: '1251A4' },
        { costCode: 'DMMMM210', productCode: 'MM', costDesc: '網類材料', accountCode: '1251M2' },
        { costCode: 'DMMMM924', productCode: 'MM', costDesc: '橡膠類', accountCode: '1251M9' },
        { costCode: 'DMMMM302', productCode: 'MM', costDesc: '螺栓類', accountCode: '1251M3' },
        { costCode: 'DMMMM305', productCode: 'MM', costDesc: '螺栓類', accountCode: '1251M3' },
        { costCode: 'DMMME420', productCode: 'MM', costDesc: '其他雜項', accountCode: '1251E4' },
        { costCode: 'DMMMM451', productCode: 'MM', costDesc: '焊材類', accountCode: '1251M4' },
        { costCode: 'DMMMZ000', productCode: 'MM', costDesc: '消耗性材料', accountCode: '1251Z0' },

        { costCode: 'DSFMM101', productCode: 'SF', costDesc: '鋼板類', accountCode: '1251M1' },
        { costCode: 'DSFMM866', productCode: 'SF', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DSFMM861', productCode: 'SF', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DSFMM863', productCode: 'SF', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DSFMP30E', productCode: 'SF', costDesc: '板類特殊件', accountCode: '1251P3' },
        { costCode: 'DSFMP852', productCode: 'SF', costDesc: '板類特殊件', accountCode: '1251P8' },
        { costCode: 'DSFMP204', productCode: 'SF', costDesc: 'PIPE/爐管類', accountCode: '1251P2' },

        { costCode: 'DSMMM101', productCode: 'SM', costDesc: '鋼板類', accountCode: '1251M1' },
        { costCode: 'DSMMP415', productCode: 'SM', costDesc: 'Flange類', accountCode: '1251P4' },
        { costCode: 'DSMMP204', productCode: 'SM', costDesc: 'PIPE類', accountCode: '1251P2' },
        { costCode: 'DSMMM702', productCode: 'SM', costDesc: '墊片類', accountCode: '1251M7' },
        { costCode: 'DSMMM908', productCode: 'SM', costDesc: '銘牌類', accountCode: '1251M9' },
        { costCode: 'DSMMM303', productCode: 'SM', costDesc: '螺栓類', accountCode: '1251M3' },
        { costCode: 'DSMME420', productCode: 'SM', costDesc: '其他雜項', accountCode: '1251E4' },
        { costCode: 'DSMMM451', productCode: 'SM', costDesc: '焊材類', accountCode: '1251M4' },
        { costCode: 'DSMMZ000', productCode: 'SM', costDesc: '消耗性材料', accountCode: '1251Z0' },

        { costCode: 'DSSMM863', productCode: 'SS', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DSSMM869', productCode: 'SS', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DSSMM101', productCode: 'SS', costDesc: '鋼板類', accountCode: '1251M1' },
        { costCode: 'DSSMM305', productCode: 'SS', costDesc: '螺栓類', accountCode: '1251M3' },
        { costCode: 'DSSMM852', productCode: 'SS', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DSSMM851', productCode: 'SS', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DSSMP204', productCode: 'SS', costDesc: 'PIPE類', accountCode: '1251P2' },
        { costCode: 'DSSMP30B', productCode: 'SS', costDesc: '管件類', accountCode: '1251P3' },
        { costCode: 'DSSME420', productCode: 'SS', costDesc: '其他雜項', accountCode: '1251E4' },
        { costCode: 'DSSMM451', productCode: 'SS', costDesc: '焊材類', accountCode: '1251M4' },

        { costCode: 'DSTMM101', productCode: 'ST', costDesc: '鋼板類', accountCode: '1251M1' },
        { costCode: 'DSTMP415', productCode: 'ST', costDesc: 'Flange類', accountCode: '1251P4' },
        { costCode: 'DSTMM702', productCode: 'ST', costDesc: '墊片類', accountCode: '1251M7' },
        { costCode: 'DSTMP204', productCode: 'ST', costDesc: 'PIPE類', accountCode: '1251P2' },
        { costCode: 'DSTMM917', productCode: 'ST', costDesc: '管件類', accountCode: '1251M9' },

        { costCode: 'DPSMM101', productCode: 'PS', costDesc: '鋼板類', accountCode: '1251M1' },
        { costCode: 'DPSMP204', productCode: 'PS', costDesc: 'PIPE/管件類', accountCode: '1251P2' },
        { costCode: 'DPSMM851', productCode: 'PS', costDesc: '型鋼類', accountCode: '1251M8' },
        { costCode: 'DPSMP347', productCode: 'PS', costDesc: '板類特殊件', accountCode: '1251P3' },
        { costCode: 'DPSMP415', productCode: 'PS', costDesc: 'Flange類', accountCode: '1251P4' }
    ];

    // ============================================================
    // 3. 模擬「後端查詢 API」—— 材料編號主表
    // ============================================================
    function fetchMaterialCodes({ keyword, productCode, page, pageSize, sortColumn, sortDirection }) {
        return new Promise(resolve => {
            setTimeout(() => {
                const kw = (keyword || '').trim().toLowerCase();
                const pc = (productCode || '').trim();

                let result = mockMaterials.map(m => {
                    const costInfo = mockCostCodes.find(c => c.costCode === m.costCode);
                    return { ...m, productCode: costInfo ? costInfo.productCode : '-', accountCode: costInfo ? costInfo.accountCode : '-' };
                }).filter(m => {
                    const matchKeyword = !kw ||
                        m.costCode.toLowerCase().includes(kw) ||
                        m.materialNo.toLowerCase().includes(kw) ||
                        m.description.toLowerCase().includes(kw);
                    const matchProductCode = !pc || m.productCode === pc;
                    return matchKeyword && matchProductCode;
                });

                result.sort((a, b) => {
                    const valA = (a[sortColumn] || '').toString().toLowerCase();
                    const valB = (b[sortColumn] || '').toString().toLowerCase();
                    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });

                const total = result.length;
                const start = (page - 1) * pageSize;
                resolve({ records: result.slice(start, start + pageSize), total });
            }, 250);
        });
    }

    // ============================================================
    // 4. 模擬「後端查詢 API」—— 成本代碼選擇器（20 幾萬筆，只回傳搜尋結果，不回傳全部）
    // ============================================================
    function searchCostCodes(keyword) {
        return new Promise(resolve => {
            setTimeout(() => {
                const kw = (keyword || '').trim().toLowerCase();
                if (!kw) { resolve([]); return; }
                const result = mockCostCodes.filter(c =>
                    c.costCode.toLowerCase().includes(kw) ||
                    c.costDesc.toLowerCase().includes(kw) ||
                    c.productCode.toLowerCase().includes(kw)
                );
                resolve(result.slice(0, 20)); // 最多回 20 筆，逼使用者用更精確的關鍵字
            }, 200);
        });
    }

    // ============================================================
    // 5. 模擬新增／更新／刪除 API
    // ============================================================
    function apiCreate(record) {
        return new Promise(resolve => {
            setTimeout(() => {
                const isDuplicate = mockMaterials.some(m => m.costCode === record.costCode && m.materialNo === record.materialNo);
                if (isDuplicate) { resolve({ ok: false, message: `成本代碼「${record.costCode}」底下已經有材料編號「${record.materialNo}」了` }); return; }
                const today = new Date().toISOString().slice(0, 10);
                mockMaterials.push({ id: 'MC' + String(Date.now()).slice(-6), ...record, createdBy: getCurrentUserName(), updatedAt: today });
                resolve({ ok: true });
            }, 250);
        });
    }

    function apiUpdate(id, record) {
        return new Promise(resolve => {
            setTimeout(() => {
                const isDuplicate = mockMaterials.some(m => m.costCode === record.costCode && m.materialNo === record.materialNo && m.id !== id);
                if (isDuplicate) { resolve({ ok: false, message: `成本代碼「${record.costCode}」底下已經有材料編號「${record.materialNo}」了` }); return; }
                const target = mockMaterials.find(m => m.id === id);
                if (!target) { resolve({ ok: false, message: '找不到該筆資料' }); return; }
                Object.assign(target, record, { updatedAt: new Date().toISOString().slice(0, 10) });
                resolve({ ok: true });
            }, 250);
        });
    }

    function apiDelete(id) {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = mockMaterials.findIndex(m => m.id === id);
                if (index === -1) { resolve({ ok: false }); return; }
                mockMaterials.splice(index, 1);
                resolve({ ok: true });
            }, 200);
        });
    }

    // ============================================================
    // 6. 狀態
    // ============================================================
    let state = {
        records: [],
        total: 0,
        currentPage: 1,
        pageSize: 25,
        filters: { keyword: '', productCode: '' },
        sort: { column: 'costCode', direction: 'asc' },
        editingId: null,
        isLoading: false
    };

    let editModal = null;
    let pickerModal = null;
    let searchDebounceTimer = null;
    let pickerDebounceTimer = null;
    let selectedCostCodeInfo = null; // 目前 Modal 裡選到的成本代碼完整資訊

    // ============================================================
    // 7. 初始化
    // ============================================================
    async function init() {
        populateProductCodeFilter();
        bindEvents();

        const modalEl = document.getElementById('editModal');
        if (modalEl && window.bootstrap) editModal = new bootstrap.Modal(modalEl);
        const pickerEl = document.getElementById('costCodePickerModal');
        if (pickerEl && window.bootstrap) pickerModal = new bootstrap.Modal(pickerEl);

        await loadPage(1);
    }

    function populateProductCodeFilter() {
        const el = document.getElementById('filterProductCode');
        if (!el) return;
        const codes = [...new Set(mockCostCodes.map(c => c.productCode))].sort();
        el.innerHTML = '<option value="">全部產品</option>' + codes.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // ★ TODO(後端整合)：改為讀取實際登入者資訊，這裡先用固定名稱代替
    function getCurrentUserName() {
        return '張育霖';
    }

    function bindEvents() {
        const searchInput = document.getElementById('searchKeyword');
        searchInput.addEventListener('input', function() {
            const value = this.value;
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                state.filters.keyword = value;
                loadPage(1);
            }, 400);
        });

        document.getElementById('filterProductCode').addEventListener('change', function() {
            state.filters.productCode = this.value;
            loadPage(1);
        });

        document.getElementById('clearFilterBtn').addEventListener('click', function() {
            state.filters = { keyword: '', productCode: '' };
            document.getElementById('searchKeyword').value = '';
            document.getElementById('filterProductCode').value = '';
            loadPage(1);
        });

        document.getElementById('addBtn').addEventListener('click', () => openEditModal(null));
        document.getElementById('saveBtn').addEventListener('click', saveRecord);

        document.getElementById('pickCostCodeBtn').addEventListener('click', openCostCodePicker);
        document.getElementById('pickerSearchInput').addEventListener('input', function() {
            const value = this.value;
            clearTimeout(pickerDebounceTimer);
            pickerDebounceTimer = setTimeout(() => runCostCodeSearch(value), 350);
        });
    }

    // ============================================================
    // 8. 查詢流程
    // ============================================================
    async function loadPage(page) {
        state.currentPage = page;
        setLoading(true);

        const { records, total } = await fetchMaterialCodes({
            keyword: state.filters.keyword,
            productCode: state.filters.productCode,
            page: state.currentPage,
            pageSize: state.pageSize,
            sortColumn: state.sort.column,
            sortDirection: state.sort.direction
        });

        state.records = records;
        state.total = total;
        setLoading(false);
        renderTable();
        renderPagination();
    }

    function setLoading(isLoading) {
        state.isLoading = isLoading;
        document.getElementById('loadingMessage').style.display = isLoading ? 'block' : 'none';
        const tableWrap = document.querySelector('.table-responsive');
        if (tableWrap) tableWrap.style.display = isLoading ? 'none' : '';
    }

    function sortData(column) {
        if (state.isLoading) return;
        if (state.sort.column === column) {
            state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.sort.column = column;
            state.sort.direction = 'asc';
        }
        updateSortIcons();
        loadPage(1);
    }

    function updateSortIcons() {
        document.querySelectorAll('.mcs-table th i.fas').forEach(icon => {
            if (icon.id && icon.id.startsWith('icon-')) icon.className = 'fas fa-sort';
        });
        document.querySelectorAll('.mcs-table th').forEach(th => th.classList.remove('active-sort'));
        const activeIcon = document.getElementById(`icon-${state.sort.column}`);
        if (activeIcon) {
            activeIcon.className = state.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            if (activeIcon.parentElement) activeIcon.parentElement.classList.add('active-sort');
        }
    }

    // ============================================================
    // 9. 渲染
    // ============================================================
    function renderTable() {
        const tbody = document.getElementById('materialTableBody');
        const noDataMsg = document.getElementById('noDataMessage');
        const paginationSection = document.getElementById('paginationSection');
        document.getElementById('totalRecords').textContent = state.total;

        if (state.records.length === 0) {
            tbody.innerHTML = '';
            noDataMsg.style.display = 'block';
            paginationSection.style.display = 'none';
            return;
        }
        noDataMsg.style.display = 'none';
        paginationSection.style.display = 'block';

        tbody.innerHTML = state.records.map(m => `
            <tr>
                <td><span class="costcode-badge">${m.costCode}</span></td>
                <td><span class="pcode-badge">${m.productCode}</span></td>
                <td><span class="matno-badge">${m.materialNo}</span></td>
                <td>${m.description}</td>
                <td>${m.accountCode}</td>
                <td>${m.createdBy || '-'}</td>
                <td>${m.updatedAt || '-'}</td>
                <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-outline-primary" title="編輯" onclick="MaterialCodeSettings.editRecord('${m.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" title="刪除" onclick="MaterialCodeSettings.deleteRecord('${m.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (state.total === 0) { paginationEl.innerHTML = ''; return; }

        const totalPages = Math.ceil(state.total / state.pageSize);
        let html = `<li class="page-item ${state.currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); MaterialCodeSettings.goToPage(${state.currentPage - 1})">上一頁</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
                html += `<li class="page-item ${i === state.currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); MaterialCodeSettings.goToPage(${i})">${i}</a></li>`;
            } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        html += `<li class="page-item ${state.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); MaterialCodeSettings.goToPage(${state.currentPage + 1})">下一頁</a></li>`;
        paginationEl.innerHTML = html;
    }

    // ============================================================
    // 10. 成本代碼選擇器（Modal 內的 Modal）
    // ============================================================
    function openCostCodePicker() {
        document.getElementById('pickerSearchInput').value = '';
        document.getElementById('pickerResultsBody').innerHTML = '';
        document.getElementById('pickerEmptyMessage').style.display = 'block';
        if (pickerModal) pickerModal.show();
    }

    async function runCostCodeSearch(keyword) {
        const loadingEl = document.getElementById('pickerLoadingMessage');
        const emptyEl = document.getElementById('pickerEmptyMessage');
        const resultsBody = document.getElementById('pickerResultsBody');

        if (!keyword || !keyword.trim()) {
            resultsBody.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        loadingEl.style.display = 'block';
        resultsBody.innerHTML = '';

        const results = await searchCostCodes(keyword);
        loadingEl.style.display = 'none';

        if (results.length === 0) {
            resultsBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">沒有符合的成本代碼</td></tr>`;
            return;
        }

        resultsBody.innerHTML = results.map(c => `
            <tr>
                <td><span class="costcode-badge">${c.costCode}</span></td>
                <td><span class="pcode-badge">${c.productCode}</span></td>
                <td>${c.costDesc}</td>
                <td>${c.accountCode}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary" onclick='MaterialCodeSettings.selectCostCode(${JSON.stringify(c)})'>選擇</button>
                </td>
            </tr>
        `).join('');
    }

    function selectCostCode(costCodeInfo) {
        selectedCostCodeInfo = costCodeInfo;
        document.getElementById('formCostCode').value = costCodeInfo.costCode;
        document.getElementById('formCostCodeInfo').textContent =
            `產品代碼：${costCodeInfo.productCode}　成本描述：${costCodeInfo.costDesc}　在建會科：${costCodeInfo.accountCode}`;
        if (pickerModal) pickerModal.hide();
    }

    // ============================================================
    // 11. 新增／編輯／刪除
    // ============================================================
    async function openEditModal(id) {
        state.editingId = id;
        const record = id ? state.records.find(m => m.id === id) : null;

        document.getElementById('editModalTitle').textContent = record ? '編輯材料編號' : '新增材料編號';
        document.getElementById('formMaterialNo').value = record ? record.materialNo : '';
        document.getElementById('formDescription').value = record ? record.description : '';

        if (record) {
            selectedCostCodeInfo = { costCode: record.costCode, productCode: record.productCode, costDesc: '', accountCode: record.accountCode };
            document.getElementById('formCostCode').value = record.costCode;
            document.getElementById('formCostCodeInfo').textContent = `產品代碼：${record.productCode}　在建會科：${record.accountCode}`;
        } else {
            selectedCostCodeInfo = null;
            document.getElementById('formCostCode').value = '';
            document.getElementById('formCostCodeInfo').textContent = '尚未選擇成本代碼';
        }

        if (editModal) editModal.show();
    }

    function editRecord(id) { openEditModal(id); }

    async function saveRecord() {
        const costCode = document.getElementById('formCostCode').value.trim();
        const materialNo = document.getElementById('formMaterialNo').value.trim();
        const description = document.getElementById('formDescription').value.trim();

        if (!costCode || !materialNo || !description) {
            LiangLianSystem.showToast('請選擇成本代碼並完整填寫材料編號與品名規格', 'warning');
            return;
        }

        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = true;

        const payload = { costCode, materialNo, description };
        const result = state.editingId ? await apiUpdate(state.editingId, payload) : await apiCreate(payload);

        saveBtn.disabled = false;

        if (!result.ok) {
            LiangLianSystem.showToast(result.message || '儲存失敗，請稍後再試', 'warning');
            return;
        }

        LiangLianSystem.showToast(state.editingId ? '材料編號已更新' : '材料編號已新增', 'success');
        if (editModal) editModal.hide();
        await loadPage(state.editingId ? state.currentPage : 1);
    }

    async function deleteRecord(id) {
        const record = state.records.find(m => m.id === id);
        if (!record) return;

        if (!confirm(`確定要刪除材料編號「${record.materialNo}（${record.description}）」嗎？此動作無法復原。`)) return;

        const result = await apiDelete(id);
        if (!result.ok) {
            LiangLianSystem.showToast('刪除失敗，請稍後再試', 'warning');
            return;
        }

        LiangLianSystem.showToast('材料編號已刪除', 'success');
        const remainingOnPage = state.records.length - 1;
        const targetPage = (remainingOnPage === 0 && state.currentPage > 1) ? state.currentPage - 1 : state.currentPage;
        await loadPage(targetPage);
    }

    // ============================================================
    // 12. 公開方法
    // ============================================================
    return {
        init: init,
        sortData: sortData,
        editRecord: editRecord,
        deleteRecord: deleteRecord,
        selectCostCode: selectCostCode,
        goToPage: function(page) {
            if (state.isLoading) return;
            const totalPages = Math.ceil(state.total / state.pageSize);
            if (page < 1 || page > totalPages) return;
            loadPage(page);
        },
        changePageSize: function(size) {
            state.pageSize = parseInt(size);
            loadPage(1);
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    MaterialCodeSettings.init();
});