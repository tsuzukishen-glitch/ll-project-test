/**
 * 氣體偵測系統核心邏輯 (Gas System Core)
 * 優化：加入員工資料庫搜尋、標籤化通報人設定
 */

const GasSystem = {
    config: {
        refreshRate: 2000,      
        mapCenter: [22.50184,120.40602], 
        mapZoom: 18,
        minZoom: 17,            
        maxZoom: 19             
    },

    // 模擬員工資料庫
    employees: [
        '王大明', '李小華', '陳志強', '林美玲', '張建國', 
        '黃雅婷', '劉俊傑', '吳佩珊', '鄭雅芳', '蔡明宏', 
        '楊淑芬', '張廠長', '安環組長'
    ],

    sensors: [
        { id: 'G01', label: 'A', name: '行政大樓 - B1F 廚房', lat: 22.5027, lng: 120.4051, value: 0, unit: 'PPM', limit: 50, notifiers: ['王大明', '安環組長'], status: 'normal', alarmTime: null, alarmStartTimestamp: null, highestValue: 0 },
        { id: 'G02', label: 'B', name: '行政大樓 - 1F LPG室', lat: 22.50255, lng: 120.40512, value: 0, unit: 'PPM', limit: 50, notifiers: ['王大明'], status: 'normal', alarmTime: null, alarmStartTimestamp: null, highestValue: 0 },
        { id: 'G03', label: 'C', name: '氣體鋼瓶區 - 乙炔', lat: 22.50095, lng: 120.4055, value: 0, unit: 'PPM', limit: 20, notifiers: ['李小華', '張廠長'], status: 'normal', alarmTime: null, alarmStartTimestamp: null, highestValue: 0 },
        { id: 'G04', label: 'D', name: '氣體鋼瓶區 - LPG', lat: 22.5008, lng: 120.40554, value: 0, unit: 'PPM', limit: 20, notifiers: ['陳志強', '安環組長'], status: 'normal', alarmTime: null, alarmStartTimestamp: null, highestValue: 0 },
    ],

    currentSensorId: null,
    map: null,
    mobileMap: null, 
    markers: {}, 
    tempNotifiers: {}, // 用於儲存設定彈窗中暫存的標籤名單
    
    init() {
        this.initMap();
        this.renderMapPoints();
        this.renderList();
        this.injectConnectionStatusUI();
        
        const badge = document.getElementById('totalSensorsBadge');
        if(badge) badge.textContent = `${this.sensors.length} 點位`;

        this.simulator.start();
        this.updateAbnormalList(); 

        // 綁定全域點擊事件，用於關閉員工搜尋下拉選單
        document.addEventListener('click', (e) => {
            // ★ 修正：改用 composedPath() 取得事件派發當下的路徑快照，
            // 避免下拉選單項目被點擊後其節點已從 DOM 移除，造成 e.target.closest() 誤判為「點擊外部」
            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            const clickedInsideSearch = path.some(el => el instanceof Element && el.classList.contains('notifier-search-group'));
            if (!clickedInsideSearch) {
                document.querySelectorAll('.notifier-dropdown.show').forEach(el => el.classList.remove('show'));
            }
        });
    },

    injectConnectionStatusUI() {
        const headerDiv = document.querySelector('.sensor-list-header .d-flex');
        if (headerDiv && !document.getElementById('lastRefreshTime')) {
            const timeSpan = document.createElement('span');
            timeSpan.id = 'lastRefreshTime';
            timeSpan.className = 'text-success small fw-medium me-3 d-flex align-items-center';
            timeSpan.innerHTML = '<span class="spinner-grow spinner-grow-sm text-success me-2" style="width: 0.7rem; height: 0.7rem;" role="status"></span> 連線中...';
            headerDiv.insertBefore(timeSpan, headerDiv.firstChild);
        }
    },

    initMap() {
        this.map = L.map('map', {
            minZoom: this.config.minZoom,
            maxZoom: this.config.maxZoom
        }).setView(this.config.mapCenter, this.config.mapZoom);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: this.config.maxZoom
        }).addTo(this.map);
    },

    resetMapView() {
        if(this.map) {
            this.map.flyTo(this.config.mapCenter, this.config.mapZoom);
            this.clearListFocus(); 
        }
    },

    focusSensor(sensorId) {
        const sensor = this.sensors.find(s => s.id === sensorId);
        if (sensor) {
            this.map.flyTo([sensor.lat, sensor.lng], 19);
        }
        this.clearListFocus();
        const activeItem = document.getElementById(`list-item-${sensorId}`);
        if (activeItem) {
            activeItem.style.backgroundColor = 'rgba(30, 64, 175, 0.08)'; 
        }
    },

    clearListFocus() {
        document.querySelectorAll('.sensor-item').forEach(el => {
            el.style.backgroundColor = '';
        });
    },

    renderMapPoints() {
        for (let id in this.markers) {
            this.map.removeLayer(this.markers[id]);
        }
        this.markers = {};

        this.sensors.forEach(sensor => {
            const displayVal = Number(sensor.value).toFixed(1);
            
            const customIcon = L.divIcon({
                className: 'custom-sensor-icon-container',
                html: `
                    <div id="marker-icon-${sensor.id}" class="sensor-point status-${sensor.status}">
                        <div class="sensor-dot">${sensor.label}</div>
                        <div class="sensor-label shadow-sm">
                            ${sensor.name} <span class="val fw-bold">${displayVal}</span> ${sensor.unit}
                        </div>
                    </div>
                `,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker([sensor.lat, sensor.lng], { icon: customIcon }).addTo(this.map);
            marker.on('click', () => {
                this.focusSensor(sensor.id);
                this.openHistoryModal(sensor.id);
            });
            this.markers[sensor.id] = marker;
        });
    },

    renderList() {
        const listBody = document.getElementById('sensorListBody');
        if (!listBody) return;
        listBody.innerHTML = '';

        this.sensors.forEach(sensor => {
            const item = document.createElement('div');
            item.className = `sensor-item status-${sensor.status}`;
            item.id = `list-item-${sensor.id}`;
            item.style.cursor = 'pointer';
            item.onclick = () => { this.focusSensor(sensor.id); };
            
            const displayVal = Number(sensor.value).toFixed(1);
            const notifiersStr = sensor.notifiers.join(', ');

            item.innerHTML = `
                <div class="d-flex align-items-center w-100">
                    <div class="list-badge">${sensor.label}</div>
                    <div class="sensor-info">
                        <div class="sensor-name">${sensor.name}</div>
                        <div class="sensor-location text-muted small text-truncate" style="max-width: 150px;">通知: ${notifiersStr}</div>
                    </div>
                    <div class="sensor-value-box">
                        <span class="sensor-value">${displayVal}</span>
                        <span class="sensor-unit">${sensor.unit}</span>
                    </div>
                </div>
            `;
            listBody.appendChild(item);
        });
    },

    updateSensorData(id, newValue) {
        const sensor = this.sensors.find(s => s.id === id);
        if (!sensor) return;

        sensor.value = newValue;

        let oldStatus = sensor.status;
        let newStatus = newValue >= sensor.limit ? 'alarm' : 'normal'; 
        
        sensor.status = newStatus;

        if (newStatus === 'alarm') {
            if (newValue > sensor.highestValue) sensor.highestValue = newValue;
        }

        if (newStatus === 'alarm' && oldStatus === 'normal') {
            sensor.alarmTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });
            sensor.alarmStartTimestamp = Date.now();
            sensor.highestValue = newValue;

            if (window.LiangLianSystem) {
                window.LiangLianSystem.addNewNotification({
                    title: `氣體異常: 區域 ${sensor.label} - ${sensor.name}`,
                    content: `當前數值 ${Number(newValue).toFixed(1)} ${sensor.unit} (通知: ${sensor.notifiers.join(', ')})`,
                    type: 'urgent'
                });
            }
        } else if (newStatus === 'normal') {
            sensor.alarmTime = null;
            sensor.alarmStartTimestamp = null;
            sensor.highestValue = 0;
        }

        const displayVal = Number(newValue).toFixed(1);

        const markerIconEl = document.getElementById(`marker-icon-${id}`);
        if (markerIconEl) {
            markerIconEl.className = `sensor-point status-${newStatus}`;
            const valSpan = markerIconEl.querySelector('.val');
            if (valSpan) valSpan.textContent = displayVal;
        }

        const listEl = document.getElementById(`list-item-${id}`);
        if (listEl) {
            listEl.className = `sensor-item status-${newStatus}`;
            listEl.querySelector('.sensor-value').textContent = displayVal;
        }

        this.updateAbnormalList();
    },

    updateAbnormalList() {
        const abnormalBody = document.getElementById('abnormalListBody');
        if (!abnormalBody) return;

        const abnormalSensors = this.sensors.filter(s => s.status === 'alarm');

        if (abnormalSensors.length === 0) {
            abnormalBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-5">
                        <i class="fas fa-shield-alt text-success fs-2 mb-3 d-block opacity-75"></i>
                        <span class="fw-medium">目前全區氣體濃度皆在安全範圍內</span>
                    </td>
                </tr>
            `;
            return;
        }

        abnormalBody.innerHTML = abnormalSensors.map(s => {
            const timeStr = s.alarmTime || new Date().toLocaleTimeString('zh-TW', { hour12: false });
            
            let durationStr = '-';
            if (s.alarmStartTimestamp) {
                const diffSecs = Math.floor((Date.now() - s.alarmStartTimestamp) / 1000);
                const mins = Math.floor(diffSecs / 60);
                const secs = diffSecs % 60;
                durationStr = mins > 0 ? `<span class="fw-bold text-danger">${mins}分 ${secs}秒</span>` : `${secs}秒`;
            }

            const currentDisplay = Number(s.value).toFixed(1);
            const notifiersStr = s.notifiers.join(', ');
            
            return `
                <tr>
                    <td><span class="circle-badge bg-danger text-white" style="width:28px;height:28px;font-size:0.9rem;">${s.label}</span></td>
                    <td class="fw-bold">${s.name}</td>
                    <td class="fw-bold fs-5 text-danger">${currentDisplay} <span class="fs-6 text-muted fw-normal">${s.unit}</span></td>
                    <td class="text-muted">${s.limit} ${s.unit}</td>
                    <td class="fw-medium text-truncate" style="max-width: 150px;" title="${notifiersStr}"><i class="fas fa-users me-1 text-primary"></i>${notifiersStr}</td>
                    <td class="text-muted"><i class="far fa-clock me-1 opacity-75"></i>${timeStr}</td>
                    <td>${durationStr}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="GasSystem.openHistoryModal('${s.id}')">
                            <i class="fas fa-history me-1"></i> 查詢
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    simulateSendAlert() {
        const abnormalSensors = this.sensors.filter(s => s.status === 'alarm');
        if (abnormalSensors.length === 0) {
            if (window.LiangLianSystem) {
                window.LiangLianSystem.showToast('目前無任何異常點位，無需發送通報', 'info');
            } else {
                alert('目前無異常點位');
            }
            return;
        }

        // ★ 修改：改為呼叫模擬 LINE 訊息的 UI
        this.showLineSimulator(abnormalSensors);
    },

    // ★ 新增：模擬通訊軟體 (LINE) 接收訊息的畫面
    showLineSimulator(abnormalSensors) {
        // 取得所有要通知的人員清單 (去重複)
        let allNotifiers = new Set();
        abnormalSensors.forEach(s => s.notifiers.forEach(n => allNotifiers.add(n)));
        const notifiersStr = Array.from(allNotifiers).join(', ');

        // 建立訊息內容，為每個異常點位產生獨立網址
        let messageHtml = abnormalSensors.map(s => {
            return `
                <div class="mb-3 p-2 border rounded" style="background-color: #f8fafc;">
                    <div class="fw-bold text-danger mb-1"><i class="fas fa-exclamation-circle me-1"></i>【${s.label}】${s.name}</div>
                    <div class="small text-dark mb-2">當前濃度: <span class="fw-bold">${Number(s.value).toFixed(1)}</span> ${s.unit}</div>
                    <a href="mobile_alert.html?id=${s.id}" target="_blank" class="btn btn-sm w-100 fw-bold text-white" style="background-color: #06c755;">
                        <i class="fas fa-external-link-alt me-1"></i> 開啟專屬警報網址
                    </a>
                </div>
            `;
        }).join('');

        // 建立模擬彈窗 (LINE 風格)
        const modalHtml = `
            <div class="modal fade" id="lineSimulatorModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 380px;">
                    <div class="modal-content" style="background-color: #849ebf; border: none; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
                        <div class="modal-header border-0 pb-0 pt-3 px-4 d-flex justify-content-between align-items-center">
                            <h5 class="modal-title text-white fw-bold d-flex align-items-center">
                                <i class="fab fa-line fa-lg me-2 text-white"></i> 模擬通訊群發
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4 pt-3">
                            <div class="bg-white rounded-4 p-3 shadow-sm position-relative">
                                <!-- 對話框的小尾巴 -->
                                <div style="position: absolute; top: 20px; left: -10px; width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-right: 15px solid white;"></div>
                                
                                <h6 class="fw-bold mb-2">⚠️ 廠區氣體異常通報</h6>
                                <p class="small text-muted mb-3 border-bottom pb-2">已發送給: ${notifiersStr}</p>
                                ${messageHtml}
                                <div class="text-end small text-muted mt-2">${new Date().toLocaleTimeString('zh-TW', {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 將舊的移除，加入新的並顯示
        const oldModal = document.getElementById('lineSimulatorModal');
        if (oldModal) oldModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById('lineSimulatorModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    },

    simulator: {
        timer: null,
        start() {
            if (this.timer) return;
            this.timer = setInterval(() => {
                GasSystem.sensors.forEach(sensor => {
                    let change = (Math.random() * 2 - 1).toFixed(1);
                    let val = parseFloat(sensor.value) + parseFloat(change);
                    if (val > 15 && sensor.status === 'normal') { val -= 0.5; } 
                    else { val = Math.max(0, Math.min(sensor.limit + 10, val)); } 
                    GasSystem.updateSensorData(sensor.id, parseFloat(val.toFixed(1)));
                });
                GasSystem.updateAbnormalList();
                const timeSpan = document.getElementById('lastRefreshTime');
                if (timeSpan) {
                    const nowStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
                    timeSpan.innerHTML = `<span class="spinner-grow spinner-grow-sm text-success me-2" style="width: 0.6rem; height: 0.6rem;" role="status"></span> <span class="text-success">最後更新：${nowStr}</span>`;
                }
            }, GasSystem.config.refreshRate); 
        },
        triggerAlarm() {
            const target1 = GasSystem.sensors.find(s => s.id === 'G01');
            if(target1) GasSystem.updateSensorData(target1.id, target1.limit + 15.5); 
            
            if (window.LiangLianSystem) {
                window.LiangLianSystem.showToast('已模擬區域 A 發生氣體洩漏警報！', 'error');
            }
        }
    },

    // ★ 修改：加入標籤化與搜尋功能
    openBulkSettings() {
        const tabList = document.getElementById('v-pills-tab');
        const tabContent = document.getElementById('v-pills-tabContent');
        tabList.innerHTML = '';
        tabContent.innerHTML = '';
        
        // 每次打開彈窗時，初始化一個全新的暫存名單物件
        this.tempNotifiers = {};

        this.sensors.forEach((sensor, index) => {
            // 將現有通報人陣列複製一份放入暫存
            this.tempNotifiers[index] = [...sensor.notifiers];

            const isActive = index === 0 ? 'active' : '';
            const isAriaSelected = index === 0 ? 'true' : 'false';
            
            tabList.innerHTML += `
                <button class="nav-link ${isActive} text-start d-flex align-items-center mb-2 fw-bold" id="v-pills-${sensor.id}-tab" data-bs-toggle="pill" data-bs-target="#v-pills-${sensor.id}" type="button" role="tab" aria-controls="v-pills-${sensor.id}" aria-selected="${isAriaSelected}">
                    <div class="circle-badge ${isActive ? 'bg-white text-primary' : 'bg-primary text-white'} me-2 border" style="width:24px;height:24px;font-size:0.8rem;" id="badge-${sensor.id}">${sensor.label}</div>
                    ${sensor.name}
                </button>
            `;

            tabContent.innerHTML += `
                <div class="tab-pane fade ${isActive ? 'show active' : ''}" id="v-pills-${sensor.id}" role="tabpanel" aria-labelledby="v-pills-${sensor.id}-tab">
                    <h5 class="fw-bold mb-4 d-flex align-items-center border-bottom pb-3">
                        <span class="circle-badge bg-primary text-white me-3" style="width:32px;height:32px;">${sensor.label}</span>
                        ${sensor.name}
                    </h5>
                    
                    <div class="mb-4 bg-white p-3 rounded shadow-sm border">
                        <label class="form-label fw-bold text-dark"><i class="fas fa-tachometer-alt me-2 text-primary"></i>設定警戒值</label>
                        <div class="input-group" style="max-width: 250px;">
                            <input type="number" class="form-control text-center fw-bold" id="limit-${index}" value="${sensor.limit}">
                            <span class="input-group-text">${sensor.unit}</span>
                        </div>
                        <div class="alert alert-warning small mb-0 mt-2 py-2 px-3">
                            <div class="fw-bold mb-1"><i class="fas fa-exclamation-circle me-2"></i>設定提醒</div>
                            <p class="mb-2">依據台灣勞動部勞安法規，可燃性高壓氣體場所的氣體漏洩檢知警報設備，其警報設定值必須設定在該氣體爆炸下限 (LEL) 之 1/4 (25%) 以下之值。相關詳細規範與性能要求如下：警報設定與性能規範設定值標準：可燃性氣體警報設定必須在爆炸下限 (LEL) 的 1/4 以下。</p>
                            <p class="mb-2">偵測器偵測爆炸下限，LPG (18,000ppm)、乙炔 (25,000ppm)，各從 1% LEL 開始偵測。</p>
                            <table class="table table-sm table-bordered bg-white mb-0" style="font-size:0.8rem;">
                                <thead class="table-light">
                                    <tr>
                                        <th>氣體</th>
                                        <th>LEL</th>
                                        <th>一段警報(20% LEL)</th>
                                        <th>二段警報(25% LEL)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>LPG</td>
                                        <td>18,000 ppm</td>
                                        <td>3,600 ppm</td>
                                        <td>4,500 ppm</td>
                                    </tr>
                                    <tr>
                                        <td>乙炔</td>
                                        <td>25,000 ppm</td>
                                        <td>5,000 ppm</td>
                                        <td>6,250 ppm</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="mb-3 bg-white p-3 rounded shadow-sm border">
                        <label class="form-label fw-bold text-dark"><i class="fas fa-users me-2 text-primary"></i>通報人員名單</label>
                        <p class="text-muted small mb-2">請從員工資料庫搜尋並加入。異常發生時將自動發送訊息給清單中的人員。</p>
                        
                        <div class="position-relative mb-3 notifier-search-group">
                            <div class="input-group">
                                <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" class="form-control" id="search-input-${index}" placeholder="輸入姓名搜尋員工..." autocomplete="off">
                            </div>
                            <ul class="dropdown-menu w-100 shadow notifier-dropdown" id="search-dropdown-${index}" style="max-height: 200px; overflow-y: auto;"></ul>
                        </div>
                        
                        <!-- 標籤容器 -->
                        <div class="notifier-tags-container" id="tags-container-${index}"></div>
                    </div>
                </div>
            `;
        });

        const triggerTabList = document.querySelectorAll('#v-pills-tab button')
        triggerTabList.forEach(tabEl => {
            tabEl.addEventListener('shown.bs.tab', event => {
                document.querySelectorAll('#v-pills-tab .circle-badge').forEach(b => {
                    b.classList.remove('bg-white', 'text-primary');
                    b.classList.add('bg-primary', 'text-white');
                });
                const activeBadge = event.target.querySelector('.circle-badge');
                if(activeBadge) {
                    activeBadge.classList.remove('bg-primary', 'text-white');
                    activeBadge.classList.add('bg-white', 'text-primary');
                }
            })
        });

        // HTML 寫入完成後，初始化每個點位的搜尋功能與渲染標籤
        this.sensors.forEach((sensor, index) => {
            this.renderNotifierTags(index);
            this.initNotifierSearch(index);
        });

        const modal = new bootstrap.Modal(document.getElementById('bulkSettingsModal'));
        modal.show();
    },

    // 渲染名單標籤 (Chips)
    renderNotifierTags(index) {
        const container = document.getElementById(`tags-container-${index}`);
        if (!container) return;
        
        if (this.tempNotifiers[index].length === 0) {
            container.innerHTML = '<span class="text-muted small p-1 w-100 text-center">尚未設定通報人員</span>';
            return;
        }

        container.innerHTML = this.tempNotifiers[index].map(name => `
            <div class="notifier-tag">
                <i class="fas fa-user-circle me-1 opacity-75"></i>${name}
                <i class="fas fa-times remove-tag" onclick="GasSystem.removeNotifierTag(${index}, '${name}')"></i>
            </div>
        `).join('');
    },

    // 刪除名單標籤
    removeNotifierTag(index, name) {
        this.tempNotifiers[index] = this.tempNotifiers[index].filter(n => n !== name);
        this.renderNotifierTags(index);
    },

    // 員工搜尋與下拉選單邏輯
    initNotifierSearch(index) {
        const input = document.getElementById(`search-input-${index}`);
        const dropdown = document.getElementById(`search-dropdown-${index}`);
        
        if (!input || !dropdown) return;

        // ★ 修正：將下拉選單項目的渲染邏輯抽成共用函式，並改用 mousedown + preventDefault 處理選取，
        // 避免點選項目時瀏覽器的預設行為（把焦點搶去 <a>）先發生，導致後續清空/重建
        // dropdown 內容時，冒泡中的 click 事件 target 已變成離開 DOM 的孤兒節點，
        // 讓外層「點擊外部關閉選單」的判斷失準。
        // 選完人之後改成明確 blur()，符合「點擊才 focus、選完就 focus 消失、
        // 要再選就要重新點一次輸入框」的正常互動邏輯。
        const renderDropdownItems = (list) => {
            dropdown.innerHTML = '';
            if (list.length > 0) {
                list.forEach(match => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a class="dropdown-item" href="javascript:void(0)"><i class="fas fa-user-plus me-2 text-primary"></i>${match}</a>`;
                    li.addEventListener('mousedown', (e) => {
                        // 阻止預設行為，避免焦點在選取過程中被瀏覽器搶到 <a> 上
                        e.preventDefault();
                        this.tempNotifiers[index].push(match);
                        this.renderNotifierTags(index);
                        input.value = '';
                        dropdown.classList.remove('show');
                        dropdown.innerHTML = '';
                        input.blur();
                    });
                    dropdown.appendChild(li);
                });
            } else {
                dropdown.innerHTML = '<li class="dropdown-item text-muted disabled">查無相符員工</li>';
            }
        };

        // 當輸入改變時篩選名單
        input.addEventListener('input', (e) => {
            const keyword = e.target.value.trim().toLowerCase();

            if (!keyword) {
                dropdown.classList.remove('show');
                dropdown.innerHTML = '';
                return;
            }

            // 過濾員工 (符合關鍵字 且 不在目前的暫存名單內)
            const matches = this.employees.filter(emp => 
                emp.toLowerCase().includes(keyword) && 
                !this.tempNotifiers[index].includes(emp)
            );

            renderDropdownItems(matches);
            dropdown.classList.add('show');
        });
        
        // 輸入框獲取焦點時，如果沒字就顯示所有「尚未加入」的人員
        // 因為選人後會明確 blur()，所以每次點擊輸入框都會是「focus 狀態真的改變」，
        // focus 事件能正常再次觸發，不需要額外再綁 click。
        input.addEventListener('focus', (e) => {
            if(!e.target.value.trim()) {
                 const available = this.employees.filter(emp => !this.tempNotifiers[index].includes(emp));
                 if (available.length > 0) {
                    renderDropdownItems(available);
                    dropdown.classList.add('show');
                 }
            }
        });
    },

    saveBulkSettings() {
        let changedCount = 0;
        this.sensors.forEach((sensor, index) => {
            const newLimit = parseFloat(document.getElementById(`limit-${index}`).value);
            const newNotifiers = this.tempNotifiers[index] || [];
            
            // 檢查陣列內容是否改變
            const isNotifiersChanged = sensor.notifiers.join(',') !== newNotifiers.join(',');

            if (sensor.limit !== newLimit || isNotifiersChanged) {
                sensor.limit = newLimit;
                // 若被清空，則填入預設提示
                sensor.notifiers = newNotifiers.length > 0 ? newNotifiers : ['未設定'];
                changedCount++;
                this.updateSensorData(sensor.id, sensor.value);
            }
        });

        if (window.LiangLianSystem && changedCount > 0) {
            window.LiangLianSystem.showToast(`已成功更新 ${changedCount} 個點位的參數與通報名單`, 'success');
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkSettingsModal'));
        modal.hide();
    },

    openHistoryModal(sensorId) {
        if (!sensorId && this.sensors.length > 0) {
            sensorId = this.sensors[0].id;
        }

        this.currentSensorId = sensorId;
        
        const sensorSelect = document.getElementById('historyFilterSensor');
        if (sensorSelect) {
            sensorSelect.innerHTML = this.sensors.map(s => 
                `<option value="${s.id}" ${s.id === sensorId ? 'selected' : ''}>[${s.label}] ${s.name}</option>`
            ).join('');
        }
        
        const now = new Date();
        const startOf24hAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        
        const formatDateTimeLocal = (date) => {
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0') + 'T' + 
                   String(date.getHours()).padStart(2, '0') + ':' + 
                   String(date.getMinutes()).padStart(2, '0');
        };

        document.getElementById('historyFilterStart').value = formatDateTimeLocal(startOf24hAgo);
        document.getElementById('historyFilterEnd').value = formatDateTimeLocal(now);
        document.getElementById('historyFilterStatus').value = ''; 

        this.generateHistoryListData();

        const modalEl = document.getElementById('historyModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    },

    changeHistorySensor() {
        const sensorSelect = document.getElementById('historyFilterSensor');
        if (sensorSelect) {
            this.currentSensorId = sensorSelect.value;
            this.focusSensor(this.currentSensorId);
            this.generateHistoryListData();
        }
    },

        generateHistoryListData() {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        const sensor = this.sensors.find(s => s.id === this.currentSensorId);
        if(!sensor) return;

        const filterStatus = document.getElementById('historyFilterStatus').value;
        const filterStart = new Date(document.getElementById('historyFilterStart').value);
        const filterEnd = new Date(document.getElementById('historyFilterEnd').value);
        
        let html = '';
        let validPoints = 0;
        let currentTime = filterEnd.getTime();
        const intervalMs = 60000; 

        for (let i = 0; i < 60; i++) { 
            if (currentTime < filterStart.getTime()) break;

            const t = new Date(currentTime);
            const timeLabel = `${t.getFullYear()}/${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')} ${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}:${t.getSeconds().toString().padStart(2, '0')}`;
            
            let val = (i === 0) ? sensor.value : (Math.random() * 5 + 2).toFixed(1); 
            if(Math.random() > 0.85) {
                val = (parseFloat(val) + sensor.limit + 5).toFixed(1);
            }

            let statusText = 'Normal';
            let statusDisplay = '正常';
            let statusColor = '#1e293b'; 
            
            if (val >= sensor.limit) {
                statusText = 'Alarm';
                statusDisplay = '警報';
                statusColor = 'var(--danger)';
            }

            if (filterStatus === '' || filterStatus === statusText) {
                const displayVal = Number(val).toFixed(1);
                
                html += `
                    <tr style="transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(0,0,0,0.02)'" onmouseout="this.style.backgroundColor=''">
                        <td class="ps-3"><span class="circle-badge ${statusText==='Normal' ? 'bg-primary text-white' : 'bg-danger text-white'}" style="width:24px;height:24px;font-size:0.8rem;">${sensor.label}</span></td>
                        <td class="fw-bold">${sensor.name}</td>
                        <td class="text-muted"><i class="far fa-clock me-2 opacity-50"></i>${timeLabel}</td>
                        <td class="fw-bold text-end pe-4" style="color: ${statusColor};">${displayVal} <span class="fs-6 text-muted fw-normal ms-1">${sensor.unit}</span></td>
                        <td>
                            <span class="px-2 py-1 rounded" style="color: ${statusColor}; background-color: ${statusText==='Normal' ? 'transparent' : statusColor+'15'}; font-weight: 600;">
                                ${statusDisplay}
                            </span>
                        </td>
                    </tr>
                `;
                validPoints++;
            }

            currentTime -= intervalMs; 
        }
        
        if (validPoints === 0) {
            html = `<tr><td colspan="5" class="text-center text-muted py-5"><i class="fas fa-search me-2 opacity-50"></i>此區間內查無符合條件之歷史數據</td></tr>`;
        }

        tbody.innerHTML = html;
    },

    exportHistoryReport() {
        const sensor = this.sensors.find(s => s.id === this.currentSensorId);
        const tbody = document.getElementById('historyTableBody');

        if (!tbody || tbody.querySelectorAll('tr').length === 0 || tbody.textContent.includes('查無符合條件')) {
            if (window.LiangLianSystem) {
                window.LiangLianSystem.showToast('目前沒有符合條件的數據可供匯出', 'warning');
            } else {
                alert('目前沒有符合條件的數據可供匯出');
            }
            return;
        }

        if (window.LiangLianSystem) {
            window.LiangLianSystem.showToast(`正在產生 [${sensor.name}] 報表，請稍候...`, 'info');
        }

        let csvContent = '\uFEFF'; 
        // 匯出報表最上方加上報表標題與點位名稱
        csvContent += `氣體偵測歷史報表\n點位名稱：[${sensor.label}] ${sensor.name}\n\n`;
        csvContent += "標示,點位名稱,記錄時間,測量數值,單位,狀態判定\n";

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length === 5) { // 已經改為 5 個欄位
                const label = cols[0].textContent.trim();
                const name = cols[1].textContent.trim();
                const time = cols[2].textContent.trim();
                const valueText = cols[3].textContent.trim();
                const value = parseFloat(valueText);
                const status = cols[4].textContent.trim();

                csvContent += `"${label}","${name}","${time}","${value}","${sensor.unit}","${status}"\n`;
            }
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute("href", url);
        link.setAttribute("download", `氣體偵測歷史報表_${sensor.label}_${sensor.name}_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (window.LiangLianSystem) {
            setTimeout(() => {
                window.LiangLianSystem.showToast('報表下載完成！', 'success');
            }, 800);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GasSystem.init();
});