(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', init, { once: true });
  function init() {
    const $ = selector => document.querySelector(selector);
    const store = new window.PrototypeStore.Store();
    store.list({entry:'data',status:'all',stage:'formal'}).filter(merchant => !merchant.tasks.length).forEach(merchant => store.issueTask(merchant.id,{type:'maintenance'}));
    const stages = { formal: '正式商户', target: '目标商户', intention: '意向商户' };
    const mapMerchants = [
      ['m-cn-01','北京国贸便利','formal','BJ100001','北京市朝阳区建国门外大街甲6号',116.461,39.909,'active'],
      ['m-cn-02','北京西单商行','formal','BJ100002','北京市西城区西单北大街131号',116.375,39.908,'inactive'],
      ['m-cn-03','天津和平茶铺','formal','TJ100001','天津市和平区南京路189号',117.202,39.119,'active'],
      ['m-cn-04','石家庄中山便利','formal','SJZ100001','石家庄市长安区中山东路',114.52,38.048,'active'],
      ['m-cn-05','太原迎泽商店','formal','TY100001','太原市迎泽区解放路',112.569,37.862,'inactive'],
      ['m-cn-06','呼和浩特新华商行','formal','HHHT100001','呼和浩特市新城区新华大街',111.749,40.842,'active'],
      ['m-cn-07','沈阳中街便利','formal','SY100001','沈阳市沈河区中街路',123.469,41.802,'active'],
      ['m-cn-08','大连青泥商行','formal','DL100001','大连市中山区青泥街',121.635,38.918,'inactive'],
      ['m-cn-09','长春重庆路商铺','formal','CC100001','长春市朝阳区重庆路',125.324,43.899,'active'],
      ['m-cn-10','哈尔滨中央大街商铺','formal','HEB100001','哈尔滨市道里区中央大街',126.622,45.768,'active'],
      ['m-cn-11','上海南京路便利','formal','SH100001','上海市黄浦区南京东路',121.484,31.238,'active'],
      ['m-cn-12','南京新街口商行','formal','NJ100001','南京市秦淮区中山南路',118.789,32.041,'active'],
      ['m-cn-13','苏州观前街商铺','formal','SZ100001','苏州市姑苏区观前街',120.619,31.316,'inactive'],
      ['m-cn-14','合肥淮河路便利','formal','HF100001','合肥市庐阳区淮河路',117.291,31.866,'active'],
      ['m-cn-15','福州东街商行','formal','FZ100001','福州市鼓楼区东街',119.303,26.085,'active'],
      ['m-cn-16','厦门中山路商铺','formal','XM100001','厦门市思明区中山路',118.088,24.459,'active'],
      ['m-cn-17','南昌中山路便利','formal','NC100001','南昌市东湖区中山路',115.899,28.681,'inactive'],
      ['m-cn-18','济南泉城路商行','formal','JN100001','济南市历下区泉城路',117.025,36.669,'active'],
      ['m-cn-19','青岛台东商铺','formal','QD100001','青岛市市北区台东三路',120.375,36.087,'active'],
      ['m-cn-20','郑州二七路便利','formal','ZZ100001','郑州市二七区二七路',113.667,34.758,'active'],
      ['m-cn-21','武汉江汉路商行','formal','WH100001','武汉市江汉区江汉路',114.291,30.581,'active'],
      ['m-cn-22','长沙黄兴路商铺','formal','CS100001','长沙市天心区黄兴南路',112.978,28.193,'active'],
      ['m-cn-23','广州北京路便利','formal','GZ100001','广州市越秀区北京路',113.271,23.126,'active'],
      ['m-cn-24','深圳东门商行','formal','SZ100002','深圳市罗湖区东门步行街',114.12,22.545,'active'],
      ['m-cn-25','南宁朝阳路便利','formal','NN100001','南宁市兴宁区朝阳路',108.324,22.817,'inactive'],
      ['m-cn-26','海口骑楼商铺','formal','HK100001','海口市龙华区骑楼老街',110.35,20.037,'active'],
      ['m-cn-27','重庆解放碑商行','formal','CQ100001','重庆市渝中区解放碑步行街',106.58,29.562,'active'],
      ['m-cn-28','成都春熙路便利','formal','CD100001','成都市锦江区春熙路',104.08,30.657,'active'],
      ['m-cn-29','贵阳喷水池商铺','formal','GY100001','贵阳市云岩区喷水池',106.713,26.59,'inactive'],
      ['m-cn-30','昆明南屏街商行','formal','KM100001','昆明市五华区南屏街',102.709,25.038,'active'],
      ['m-cn-31','拉萨八廓街商铺','formal','LS100001','拉萨市城关区八廓街',91.132,29.653,'active'],
      ['m-cn-32','西安钟楼便利','formal','XA100001','西安市碑林区东大街',108.954,34.26,'active'],
      ['m-cn-33','兰州张掖路商行','formal','LZ100001','兰州市城关区张掖路',103.826,36.063,'inactive'],
      ['m-cn-34','西宁中心广场商铺','formal','XN100001','西宁市城中区中心广场',101.778,36.623,'active'],
      ['m-cn-35','银川鼓楼便利','formal','YC100001','银川市兴庆区解放东街',106.289,38.472,'active'],
      ['m-cn-36','乌鲁木齐中山路商行','formal','WLMQ100001','乌鲁木齐市天山区中山路',87.616,43.797,'active']
    ].map(([id,name,stage,no,address,lng,lat,active], index) => ({id,name,stage,no,address,lng,lat,active,contact:'李经理',phone:'1380000'+String(index + 1).padStart(4,'0'),recentTrade:index%3!==0,tags:[],tasks:stage==='formal'&&index%4===0?[{id:'national-task-'+id,type:'maintenance',title:'走访维护',status:'pending',dueAt:Date.now()+5*86400000}]:[]}));
    const cityMerchants = mapMerchants.slice();
    const outlets = window.MerchantMapOutlets || [];
    cityMerchants.forEach((m, i) => {
      // 每个重点城市补充 10 个县域/片区商户，保持全国地图在省市与县域层级都有可下钻的数据密度。
      for (let j = 1; j <= 10; j++) {
        const stage = j % 3 === 1 ? 'target' : j % 3 === 2 ? 'intention' : 'formal';
        const angle = (i * 37 + j * 53) * Math.PI / 180;
        const distance = 0.06 + (j % 5) * 0.045;
        const areaNames = ['东片区','西片区','南片区','北片区','新区','开发区','中心镇','临近县','产业园','商圈'];
        const tasks = stage==='formal' && j%5===0 ? [{id:'national-task-'+m.id+'-'+j,type:'maintenance',title:'走访维护',status:'pending',dueAt:Date.now()+5*86400000}] : [];
        mapMerchants.push({...m, id:m.id+'-'+j, no:m.no+'-'+j, name:m.name.replace(/便利|商行|商店|商铺|茶铺/, '') + ['','咖啡','花店','生鲜','面馆','烘焙','文具','超市','餐饮','服饰','药房'][j], address:m.address + ' · ' + areaNames[j - 1], stage, lng:m.lng + Math.cos(angle) * distance, lat:m.lat + Math.sin(angle) * distance, active:stage==='formal'?'inactive':'unknown', recentTrade:stage==='formal'?false:null, tags:[], contact:'李经理', phone:'13800001234',tasks});
      }
    });
    // 重点区域每个网点增加 36 户，覆盖 100 米至 3 公里，形成疏密不同的商圈。
    outlets.filter(outlet => outlet.city !== '杭州').forEach((outlet, i) => {
      for (let j = 1; j <= 36; j++) {
        const angle = (j * 137.508 + i * 29) * Math.PI / 180;
        const meters = j <= 24 ? 100 + (j % 12) * 75 : 1100 + (j % 12) * 160;
        const lat = outlet.lat + Math.sin(angle) * meters / 111320;
        const lng = outlet.lng + Math.cos(angle) * meters / (111320 * Math.cos(outlet.lat * Math.PI / 180));
        const stage = j % 5 < 3 ? 'formal' : j % 5 === 3 ? 'target' : 'intention';
        const category = ['便利店','生鲜超市','面馆','药房','花店','咖啡店'][j % 6];
        const district = outlet.name.replace('邮政营业所','');
        const tasks = stage==='formal' && j%8===0 ? [{id:'national-task-'+outlet.id+'-'+j,type:'maintenance',title:'走访维护',status:'pending',dueAt:Date.now()+5*86400000}] : [];
        mapMerchants.push({id:'m-cn-area-'+outlet.id+'-'+j,no:outlet.id.toUpperCase()+String(j).padStart(5,'0'),name:district+category+j,address:district+'商圈'+j+'号',lng,lat,stage,active:stage==='formal'?(j%4?'active':'inactive'):'unknown',recentTrade:stage==='formal'?j%3!==0:null,tags:j%9===0?['重点跟进']:[],tasks,contact:'王经理',phone:'13800001234'});
      }
    });
    const nationalStorageKey = 'youfu.merchant-map.national.v1';
    try {
      const saved = JSON.parse(localStorage.getItem(nationalStorageKey) || '{}');
      mapMerchants.forEach(m => { if(saved[m.id]) Object.assign(m, saved[m.id]); });
    } catch (_) { /* 保留初始地图数据。 */ }
    mapMerchants.forEach(merchant => {
      if (merchant.stage === 'formal' && !merchant.tasks.length) {
        merchant.tasks = [{id:'national-task-'+merchant.id,type:'maintenance',title:'走访维护',status:'pending',dueAt:Date.now()+5*86400000}];
      }
    });
    function updateNational(id, changes) {
      const merchant = mapMerchants.find(m=>m.id===id);
      try {
        const saved = JSON.parse(localStorage.getItem(nationalStorageKey) || '{}');
        saved[id] = {...saved[id],...changes};
        localStorage.setItem(nationalStorageKey, JSON.stringify(saved));
      } catch (_) { throw Error('保存失败，请检查浏览器存储空间后重试'); }
      Object.assign(merchant, changes);
    }
    const state = { stage: 'all', active: 'all', recent: 'all', taskType: 'all', q: '', points: false, heat: true, outlets: true, radius: 500, person: null, selected: null, rows: [], picking: false };
    const restored = history.state?.merchantMapView;
    if (restored) {
      for (const key of ['stage','active','recent','taskType','q','points','heat','outlets','radius','person','selected','cluster']) {
        if (Object.prototype.hasOwnProperty.call(restored, key)) state[key] = restored[key];
      }
      $('#merchant-query').value = state.q;
    }
    if (state.active === 'unknown') state.active = 'all';
    if (state.recent === 'unknown') state.recent = 'all';
    const map = new MerchantMap($('#merchant-map-canvas'), {
      onSelect: id => { if (id === 'outlet') return; selectMerchant(id, false); },
      onOutlet: outlet => {
        openDialog(outlet.name, '<p>'+esc(outlet.city)+' · 邮政网点</p>',
          '<a class="primary-button" href="'+esc(navigationUrl(outlet))+'" target="_blank" rel="noopener">导航到网点</a>',
          null, placeDistance(outlet));
      },
      onCluster: items => {
        const zoom = map.map ? map.map.getZoom() : map.zoom;
        const maxZoom = map.map ? map.map.getZooms()[1] : 19;
        // 聚合点始终先下钻，仅在地图最大缩放级别仍重叠时展示区域商户。
        if (zoom < maxZoom) {
          const center = [items.reduce((sum, item) => sum + Number(item.lng), 0) / items.length, items.reduce((sum, item) => sum + Number(item.lat), 0) / items.length];
          const nextZoom = Math.min(maxZoom, zoom + (zoom < 8 ? 4 : 3));
          state.selected = null; state.cluster = null;
          if (map.map) map.map.setZoomAndCenter(nextZoom, center);
          else { map.center = center; map.zoom = nextZoom; map.drawOffline(); map.changed(); }
          render();
          return;
        }
        state.selected=null;state.cluster=items.map(item=>item.id);render();
      },
      onStatus: value => {
        $('#map-connection').textContent = value.kind === 'error' || value.kind === 'warning' ? value.message : '';
        if (value.kind === 'ready') $('#map-connection').textContent = '';
        $('#retry-map').hidden = value.kind !== 'error' || map.mode === 'amap';
      },
      onPick: value => {
        if (!state.picking || !state.selected) return;
        state.picking = false;
        map.setPickMode(false);
        $('#cancel-map-pick').hidden = true;
        positionDialog(getMerchant(state.selected), {...value,detailAddress:state.correctionDraft || ''});
      }
    });
    let toastTimer;
    const toast = message => {
      const node = $('#map-toast');
      node.textContent = message; node.hidden = false;
      clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 3600);
    };
    const located = merchant => window.PrototypeStore.located(merchant);
    const distanceTo = (a,b) => window.PrototypeStore.distance(a,b);
    const formatDistance = meters => meters < 1000 ? Math.round(meters)+' 米' : (meters/1000).toFixed(1)+' 公里';
    const placeDistance = place => {
      if (!state.person || !place || !located(state.person) || !located(place)) return '';
      const meters = distanceTo(state.person, place);
      return Number.isFinite(meters) ? '距您 ' + formatDistance(meters) : '';
    };
    const navigationUrl = place => located(place)
      ? 'https://uri.amap.com/navigation?to=' + encodeURIComponent(place.lng + ',' + place.lat + ',' + place.name) + '&mode=walk&coordinate=gaode'
      : 'https://uri.amap.com/search?keyword=' + encodeURIComponent(place.address || place.name);
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
    // 同一商户的累计交易数据保持稳定，统计范围为进件以来。
    function tradeTotals(merchant) {
      const seed = Array.from(merchant.id).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
      const hasTrade = merchant.active === 'active' || merchant.recentTrade === true || seed % 5 !== 0;
      const count = hasTrade ? 120 + seed % 24881 : 0;
      return { count, amount: count * (1800 + seed % 48200) / 100 };
    }
    const matchesTrade = merchant => state.recent === 'all' || (merchant.stage === 'formal' && (tradeTotals(merchant).count > 0) === (state.recent === 'yes'));
    const listAll = () => {
      try {
        const local = store.list({ entry: 'data', status: state.stage === 'tasks' ? 'unfinished' : state.taskType === 'all' ? 'all' : 'unfinished', type: state.stage === 'tasks' ? state.taskType === 'all' ? 'all' : state.taskType : state.taskType, q: state.q, stage: state.stage === 'tasks' ? 'formal' : state.stage, active: state.active, recent: 'all', person: state.person });
        const query = state.q.trim().toLowerCase();
        const national = mapMerchants.filter(m => (!query || `${m.name} ${m.no} ${m.address}`.toLowerCase().includes(query)) && (state.stage === 'tasks' ? m.stage === 'formal' && m.tasks.some(t=>(state.taskType==='all'||t.type===state.taskType)&&!['completed','cancelled','closed'].includes(t.status)) : (state.stage === 'all' || m.stage === state.stage)) && (state.stage==='tasks'||state.taskType==='all'||m.tasks.some(t=>t.type===state.taskType&&!['completed','cancelled','closed'].includes(t.status))) && (state.active === 'all' || m.active === state.active) && matchesTrade(m));
        return [...local.filter(matchesTrade), ...national];
      } catch (error) { toast(error.message); return []; }
    };
    const getMerchant = id => id.startsWith('m-cn-') ? mapMerchants.find(item => item.id === id) : store.get(id);
    const openTaskUrl = merchant => '../移动端/商户任务详情页.html?merchantId=' + encodeURIComponent(merchant.id) + '&merchantNo=' + encodeURIComponent(merchant.no) + '&fromMerchantMap=1';
    const merchantUrl = merchant => {
      if (merchant.stage === 'formal') return null;
      const file = merchant.stage === 'intention' ? '意向商户详情页.html' : '目标商户详情页.html';
      return '../移动端/' + encodeURIComponent(file) + '?merchantId=' + encodeURIComponent(merchant.id) + '&merchantNo=' + encodeURIComponent(merchant.no) + '&fromMerchantMap=1';
    };
    function render() {
      state.rows = listAll();
      applyTaskFilter();
      map.render(state.rows, { points: state.points, heat: state.heat, outlets: state.outlets, outletData: outlets, radius: state.radius, outletMinZoom: 8, outletDetailZoom: 10, selectedId: state.selected, person: state.person });
      const target = state.selected ? getMerchant(state.selected) : null;
      $('#location-distance .location-text').textContent = state.person ? (state.person.address || '已定位') : '尚未定位';
      $('#location-distance').title = state.person?.address || '';
      $('#map-merchant-count').textContent = state.rows.length;
      $('#map-merchant-count-surface').textContent = state.rows.length;
      $('#map-merchant-list').innerHTML = state.rows.length ? state.rows.map(merchant => {
        const stage = merchant.stage || 'target';
        const taskCount = merchant.tasks.filter(task => !['completed', 'cancelled','closed'].includes(task.status)).length;
        return '<button class="merchant-row'+(state.stage==='tasks'?' task-merchant-row':'')+'" type="button" data-select-merchant="' + esc(merchant.id) + '"><span class="merchant-row-head"><b class="dot ' + stage + '"></b><strong>' + esc(merchant.name) + '</strong><small class="merchant-stage-chip stage-'+esc(stage)+'">' + esc(stages[stage] || '商户') + '</small></span><p>' + esc(merchant.address) + '</p>'+(state.stage==='tasks'?'<p class="task-count-field"><i class="ti ti-list-check" aria-hidden="true"></i><span>任务数量</span><strong>'+taskCount+' 项</strong></p>':'<p>' + (merchant.stage==='formal'?esc(({active:'活跃',inactive:'沉默',unknown:'活跃未知'})[merchant.active]):'') + '</p>')+'</button>';
      }).join('') : '<div class="empty-results">没有符合条件的商户</div>';
      document.querySelectorAll('[data-stage]').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.stage === state.stage)));
      $('#active-filter-count').textContent = [state.active !== 'all', state.recent !== 'all', state.taskType !== 'all'].filter(Boolean).length || '';
      $('#heat-toggle').setAttribute('aria-pressed', String(state.heat));
      $('#points-toggle').setAttribute('aria-pressed', String(state.points));
      $('#heat-toggle').setAttribute('aria-label', state.heat ? '关闭热力图' : '开启热力图');
      $('#points-toggle').setAttribute('aria-label', state.points ? '关闭点位' : '开启点位');
      $('#points-toggle span').textContent = state.points ? '关闭点位' : '开启点位';
      $('#outlets-toggle').setAttribute('aria-pressed', String(state.outlets));
      $('#outlets-toggle').setAttribute('aria-label', state.outlets ? '关闭网点' : '开启网点');
      $('#outlets-toggle span').textContent = state.outlets ? '关闭网点' : '开启网点';
      $('#heat-legend').hidden = !state.heat;
      $('#merchant-sheet').hidden=!state.selected&&!state.cluster;
      $('.sheet-summary').hidden=Boolean(state.selected);
      if(state.cluster){
        $('#map-merchant-list').querySelectorAll('[data-select-merchant]').forEach(row=>{row.hidden=!state.cluster.includes(row.dataset.selectMerchant);});
        $('#map-merchant-count').textContent=state.cluster.length;
      }
      renderSelected();
    }
    function merchantTags(merchant) {
      const parts = [];
      if (merchant.stage === 'formal') parts.push(({ active: '活跃', inactive: '沉默', unknown: '活跃未知' })[merchant.active] || '活跃未知');
      if (merchant.stage === 'formal') parts.push(tradeTotals(merchant).count > 0 ? '有交易' : '无交易');
      if (merchant.tags?.length) parts.push(...merchant.tags);
      return parts.map(esc).join(' · ');
    }
    function selectMerchant(id, focus = true) {
      const merchant = getMerchant(id);
      state.cluster=null;
      state.selected = id;
      if (focus && located(merchant)) {if(map.map)map.map.setZoomAndCenter(16,[merchant.lng,merchant.lat]);else map.focus(merchant.lng,merchant.lat);}
      $('#merchant-sheet').classList.add('has-selection');
      render();
    }
    function renderSelected() {
      const panel = $('#selected-merchant'), merchant = state.selected ? getMerchant(state.selected) : null;
      if (!merchant) { panel.hidden = true; panel.innerHTML = ''; $('#map-merchant-list').hidden=false; $('#merchant-sheet').classList.remove('has-selection'); return; }
      panel.hidden = false;
      $('#map-merchant-list').hidden = true;
      const nav = navigationUrl(merchant);
      const distance = placeDistance(merchant);
      const detailUrl = merchantUrl(merchant);
      const totals = merchant.stage === 'formal' ? tradeTotals(merchant) : null;
      const tradeInfo = totals ? '<p class="selected-meta trade-meta"><i class="ti ti-currency-yuan" aria-hidden="true"></i><span class="info-label">交易金额（进件以来）</span><strong>' + totals.amount.toLocaleString('zh-CN', {style:'currency',currency:'CNY'}) + '</strong></p><p class="selected-meta trade-meta"><i class="ti ti-receipt" aria-hidden="true"></i><span class="info-label">交易笔数（进件以来）</span><strong>' + totals.count.toLocaleString('zh-CN') + ' 笔</strong></p>' : '';
      const activeTaskCount = merchant.tasks.filter(task => !['completed', 'cancelled', 'closed'].includes(task.status)).length;
      panel.innerHTML = '<div class="selected-heading"><b class="dot ' + esc(merchant.stage) + '"></b><h2>' + esc(merchant.name) + '</h2><span class="selected-stage-chip stage-' + esc(merchant.stage) + '">' + esc(stages[merchant.stage] || '商户') + '</span>' + (distance ? '<span class="place-distance">'+esc(distance)+'</span>' : '') + '<button type="button" data-close-selected aria-label="关闭商户信息"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
        '<div class="merchant-tags">' + merchantTags(merchant).split(' · ').filter(Boolean).map(tag => '<span class="merchant-tag stage-' + esc(merchant.stage) + '">' + esc(tag) + '</span>').join('') + '</div>' +
        '<div class="selected-info"><p class="selected-meta"><i class="ti ti-id" aria-hidden="true"></i><span class="info-label">商户号</span><span>' + esc(merchant.no) + '</span></p><p class="selected-meta"><i class="ti ti-phone" aria-hidden="true"></i><span class="info-label">联系电话</span><span>' + esc(merchant.phone || '暂无联系电话') + '</span></p>' + (merchant.stage === 'formal' ? '<p class="selected-meta task-count-detail"><i class="ti ti-list-check" aria-hidden="true"></i><span class="info-label">任务数量</span><strong>' + activeTaskCount + ' 项</strong></p>' : '') + tradeInfo + '<div class="selected-meta address"><i class="ti ti-map-pin" aria-hidden="true"></i><span class="info-label">商户地址</span><span class="address-content"><span class="address-text">' + esc(merchant.address) + '</span><button class="address-edit" type="button" data-correct-position="'+esc(merchant.id)+'" aria-label="校正地址" title="校正地址"><i class="ti ti-current-location" aria-hidden="true"></i></button></span></div></div>' +
        '<div class="selected-actions"><a class="navigation" href="' + nav + '" target="_blank" rel="noopener"><i class="ti ti-navigation" aria-hidden="true"></i>导航到店</a>' +
        '<button class="merchant-detail" type="button" data-open-merchant="' + esc(merchant.id) + '"><i class="ti ti-building-store" aria-hidden="true"></i>查看详情</button>' +
        (merchant.stage === 'formal' ? '<a class="tasks" href="' + openTaskUrl(merchant) + '"><i class="ti ti-list-check" aria-hidden="true"></i>查看任务</a>' : '<a class="tasks" href="'+esc(detailUrl)+'"><i class="ti '+(merchant.stage==='target'?'ti-map-pin-check':'ti-arrows-exchange')+'" aria-hidden="true"></i>'+(merchant.stage==='target'?'到店打卡':'跟进转化')+'</a>') + '</div>';
    }
    function openDialog(title, body, buttons, onSubmit, distance = '') {
      $('#dialog-title').textContent = title;
      $('#dialog-distance').textContent = distance;
      $('#dialog-distance').hidden = !distance;
      $('#dialog-body').innerHTML = body;
      $('#dialog-error').hidden = true;
      $('#dialog-footer').innerHTML = buttons;
      const dialog = $('#map-dialog'), form = $('#map-dialog-form'), backdrop = $('#map-dialog-backdrop');
      dialog.classList.remove('position-dialog');
      backdrop.hidden = false;
      dialog.show();
      form.onsubmit = async event => {
        event.preventDefault();
        if (!onSubmit) return;
        try { await onSubmit(new FormData(form)); dialog.close(); }
        catch (error) { $('#dialog-error').textContent = error.message; $('#dialog-error').hidden = false; }
      };
    }
    function filterDialog() {
      const group = (name, title, icon, options) => '<fieldset class="filter-group"><legend><i class="ti '+icon+'" aria-hidden="true"></i>'+title+'</legend><div class="filter-options">'+options.map(([value,label])=>'<label><input type="radio" name="'+name+'" value="'+value+'" '+(state[name]===value?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div></fieldset>';
      openDialog('筛选商户',
        group('active','活跃状态','ti-activity',[['all','全部'],['active','活跃商户'],['inactive','沉默商户']]) +
        group('recent','是否交易','ti-receipt',[['all','全部'],['yes','有交易'],['no','无交易']]) +
        group('taskType','任务类型','ti-list-check',[['all','全部任务'],['supplement','补充商户资料'],['channel_switch','切换备用通道'],['maintenance','走访维护商户'],['risk','风控任务'],['suspense','挂账任务']]),
        '<button class="secondary-button" type="button" id="filter-reset">重置</button><button class="primary-button" type="submit">应用筛选</button>',
        fd => { state.selected=null;state.cluster=null;state.active = fd.get('active') || 'all'; state.recent = fd.get('recent') || 'all'; state.taskType = fd.get('taskType') || 'all'; applyTaskFilter(); render(); });
      $('#filter-reset').onclick = () => { state.active='all';state.recent='all';state.taskType='all';state.selected=null;state.cluster=null;render();$('#map-dialog').close(); };
    }
    function applyTaskFilter() {
      if (state.taskType === 'all') return;
      state.rows = state.rows.filter(merchant => {
        return merchant.tasks.some(task => task.type===state.taskType && !['completed', 'cancelled','closed'].includes(task.status));
      });
    }
    function outletSettingsDialog() {
      openDialog('网点设置',
        '<p>统一设置所有邮政网点的辐射范围。网点在城市级别放大后显示范围圈。</p>' +
        '<label class="field">辐射范围<select name="radius"><option value="0">不显示</option><option value="300">300 米</option><option value="500">500 米</option><option value="1000">1,000 米</option><option value="2000">2,000 米</option></select></label>',
        '<button class="primary-button" type="submit">保存设置</button>',
        fd => { state.radius=Number(fd.get('radius'));render(); });
      $('#map-dialog-form').querySelector('[name=radius]').value=String(state.radius);
    }
    function positionDialog(merchant, value = {}) {
      if (value.simulated) { toast('地图服务暂不可用，无法校正坐标'); return; }
      openDialog('校正地址',
        '<label class="field">原地址<div class="original-address">'+esc(merchant.address)+'</div></label>' +
        '<input name="lng" type="hidden" value="'+esc(value.lng ?? '')+'"><input name="lat" type="hidden" value="'+esc(value.lat ?? '')+'">' +
        '<label class="field">现地址<input name="address" readonly required placeholder="请通过地图选点或定位获取" value="' + esc(value.address || '') + '"></label>' +
        '<div class="position-methods"><button class="secondary-button" type="button" id="pick-position-again"><i class="ti ti-map-pin" aria-hidden="true"></i>地图选点</button><button class="secondary-button" type="button" id="locate-address"><i class="ti ti-current-location" aria-hidden="true"></i>直接定位</button></div>' +
        '<label class="field">详细地址<input name="detailAddress" maxlength="100" placeholder="楼栋、楼层、门牌号等" value="'+esc(value.detailAddress || merchant.detailAddress || '')+'"></label>',
        '<button class="secondary-button" type="button" id="cancel-position-dialog">取消</button><button class="primary-button" type="submit">更新地址</button>',
        fd => {
          if (!fd.get('lng') || !fd.get('lat')) throw Error('请先在地图上选择新位置');
          const mapAddress = fd.get('address').trim(), detailAddress = fd.get('detailAddress').trim();
          const change = { lng: Number(fd.get('lng')), lat: Number(fd.get('lat')), address: mapAddress + (detailAddress ? ' ' + detailAddress : ''), mapAddress, detailAddress };
          if (!mapAddress) throw Error('未获取到现地址，请重新定位或选点');
          if (merchant.id.startsWith('m-cn-')) {
            if (!Number.isFinite(change.lng) || !Number.isFinite(change.lat) || Math.abs(change.lng)>180 || Math.abs(change.lat)>90) throw Error('请填写有效经纬度坐标');
            updateNational(merchant.id, change);
          } else store.correctPosition(merchant.id, change, merchant.version);
          state.selected = merchant.id; state.correctionDraft=''; render(); toast('商户位置已更新');
        });
      $('#map-dialog').classList.add('position-dialog');
      $('#cancel-position-dialog').onclick = () => $('#map-dialog').close();
      $('#pick-position-again').onclick = () => { state.correctionDraft=$('[name=detailAddress]').value;$('#map-dialog').close(); state.selected=merchant.id;state.picking=true;map.setPickMode(true);$('#cancel-map-pick').hidden=false;toast('请在地图上选择商户实际走访位置'); };
      const locationButton=$('#locate-address');
      locationButton.onclick = () => {
        if (!navigator.geolocation || !window.AMap?.convertFrom) {toast('定位服务尚未就绪，请稍后重试');return;}
        locationButton.disabled=true;
        const fail = message => {locationButton.disabled=false;toast(message);};
        navigator.geolocation.getCurrentPosition(position => {
          AMap.convertFrom([position.coords.longitude,position.coords.latitude],'gps',(status,result)=>{
            if(status!=='complete'||!result.locations?.[0]){fail('定位坐标转换失败，请重试');return;}
            const point=result.locations[0],lng=point.lng??point.getLng(),lat=point.lat??point.getLat();
            AMap.plugin('AMap.Geocoder',()=>{
              new AMap.Geocoder().getAddress([lng,lat],(geoStatus,data)=>{
                if(!locationButton.isConnected)return;
                locationButton.disabled=false;
                const address=data?.regeocode?.formattedAddress;
                if(geoStatus!=='complete'||!address){toast('地址获取失败，请重试或地图选点');return;}
                $('[name=lng]').value=lng;$('[name=lat]').value=lat;$('[name=address]').value=address;
              });
            });
          });
        },error=>fail(error.code===1?'请允许使用当前位置':'定位失败，请重试'),{enableHighAccuracy:true,timeout:10000,maximumAge:0});
      };
    }
    function focusSearch(event) {
      event.preventDefault();
      const query = $('#merchant-query').value.trim();
      if (!query) { toast('请输入商户名称或商户号'); return; }
      state.q = query;
      const all = [...store.list({ entry: 'data', status: 'all' }), ...mapMerchants];
      const exactNo = all.filter(merchant => merchant.no.toLowerCase() === query.toLowerCase());
      const results = exactNo.length ? exactNo : listAll();
      if (!results.length) { state.selected=null;state.cluster=null;render();toast('未找到匹配商户');return; }
      if (results.length === 1) {
        const merchant = results[0];
        if(exactNo.length){state.stage='all';state.active='all';state.recent='all';state.taskType='all';}
        selectMerchant(merchant.id);
        if (located(merchant)) toast('已定位到 ' + merchant.name);
        else toast('该商户暂无准确坐标，已在列表中显示');
      } else { state.selected=null;state.cluster=results.map(m=>m.id);render();toast('找到 ' + results.length + ' 户商户，请从列表选择'); }
    }
    let locationRequest = 0;
    function locatePerson() {
      const request = ++locationRequest;
      if (!navigator.geolocation) { toast('当前设备不支持定位'); return; }
      toast('正在获取当前位置');
      navigator.geolocation.getCurrentPosition(position => {
        if (request !== locationRequest) return;
        if (!window.AMap?.convertFrom) { toast('定位服务尚未就绪，请稍后重试'); return; }
        AMap.convertFrom([position.coords.longitude, position.coords.latitude], 'gps', (status, result) => {
          if (request !== locationRequest) return;
          if (status !== 'complete' || !result.locations?.[0]) { toast('当前位置转换失败，请重试'); return; }
          const point = result.locations[0];
          state.person = { lng: point.lng ?? point.getLng(), lat: point.lat ?? point.getLat(), accuracy: position.coords.accuracy, address: '' };
          map.focus(state.person.lng, state.person.lat);if(map.map)map.map.setZoom(14);state.selected=null;state.cluster=null;render(); toast('当前位置已更新');
          AMap.plugin('AMap.Geocoder', () => {
            try {
              new AMap.Geocoder().getAddress([state.person.lng, state.person.lat], (geoStatus, geoResult) => {
                if (request !== locationRequest || geoStatus !== 'complete') return;
                state.person.address = geoResult.regeocode?.formattedAddress || '';
                render();
              });
            } catch (_) { /* 地址解析失败时保留“已定位” */ }
          });
        });
      }, error => {if(request===locationRequest)toast(error.code === 1 ? '请允许使用当前位置' : '定位失败，请检查定位服务后重试');},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }
    $('#merchant-search').addEventListener('submit', focusSearch);
    $('#merchant-query').addEventListener('search', () => { if (!$('#merchant-query').value) { state.q='';state.selected=null;state.cluster=null;render(); } });
    document.querySelectorAll('[data-stage]').forEach(tab => tab.addEventListener('click', () => {
      state.stage=tab.dataset.stage;state.selected=null;state.cluster=null;$('#merchant-sheet').classList.remove('has-selection');render();
    }));
    $('#locate-person').addEventListener('click', locatePerson);
    $('#retry-map').addEventListener('click', () => map.init(window.MerchantMapConfig || {}));
    $('#open-filters').addEventListener('click', filterDialog);
    $('#heat-toggle').addEventListener('click', () => { state.heat=!state.heat;render(); });
    $('#points-toggle').addEventListener('click', () => { state.points=!state.points;render(); });
    $('#outlets-toggle').addEventListener('click', () => { state.outlets=!state.outlets;render(); });
    $('#outlets-settings').addEventListener('click', outletSettingsDialog);
    $('#zoom-in').addEventListener('click', () => map.map ? map.map.setZoom(map.map.getZoom()+1) : map.changeZoom(1));
    $('#zoom-out').addEventListener('click', () => map.map ? map.map.setZoom(map.map.getZoom()-1) : map.changeZoom(-1));
    $('#sheet-expand').addEventListener('click', event => {
      const expanded=$('#merchant-sheet').classList.toggle('expanded');
      event.currentTarget.setAttribute('aria-expanded',String(expanded));
      requestAnimationFrame(()=>map.resize());
    });
    $('#close-sheet').addEventListener('click', () => { state.selected=null;state.cluster=null;render();requestAnimationFrame(()=>map.resize()); });
    $('#cancel-map-pick').addEventListener('click', () => { state.picking=false;map.setPickMode(false);$('#cancel-map-pick').hidden=true; });
    $('#dialog-close').addEventListener('click', () => $('#map-dialog').close());
    $('#map-dialog-backdrop').addEventListener('click', () => $('#map-dialog').close());
    $('#map-dialog').addEventListener('close', () => { $('#map-dialog-backdrop').hidden = true; });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('#map-dialog').open) {
        event.preventDefault();
        $('#map-dialog').close();
      }
    });
    $('#map-merchant-list').addEventListener('click', event => {
      const row=event.target.closest('[data-select-merchant]');if(row)selectMerchant(row.dataset.selectMerchant);
    });
    $('#selected-merchant').addEventListener('click', event => {
      const button=event.target.closest('button');if(!button)return;
      if(button.hasAttribute('data-close-selected')){state.selected=null;state.cluster=null;$('#merchant-sheet').classList.remove('has-selection');render();return;}
      const merchant=getMerchant(button.dataset.openMerchant || button.dataset.correctPosition || button.dataset.markIntention);
      if(button.hasAttribute('data-open-merchant')){
        const url=merchantUrl(merchant);
        if(url) location.href=url;
        else openDialog('正式商户详情', '<p>正式商户详情将在正式系统上线后接入。</p>', '<button class="primary-button" type="button" id="formal-detail-ok">知道了</button>');
        const ok=$('#formal-detail-ok');if(ok)ok.onclick=()=>$('#map-dialog').close();
      } else if(button.hasAttribute('data-correct-position')) {
        state.correctionDraft='';
        positionDialog(merchant);
      } else if(button.hasAttribute('data-mark-intention')) {
        openDialog('标记为意向', '<label class="field">联系人<input name="contact" maxlength="50" required value="'+esc(merchant.contact||'')+'"></label><label class="field">联系电话<input name="phone" type="tel" maxlength="32" required value="'+esc(merchant.phone||'')+'"></label>', '<button type="submit" class="primary-button">确认标记</button>',fd=>{const changes={contact:fd.get('contact').trim(),phone:fd.get('phone').trim()};if(merchant.id.startsWith('m-cn-')){if(!changes.contact||!/^\+?[\d ()-]{7,32}$/.test(changes.phone))throw Error('请填写联系人及有效联系电话');updateNational(merchant.id,{...changes,stage:'intention'});}else store.markIntention(merchant.id,changes);render();toast('商户已标记为意向');});
      }
    });
    window.addEventListener('resize', () => map.resize());
    window.addEventListener('pagehide', () => {
      const view = {};
      for (const key of ['stage','active','recent','taskType','q','points','heat','outlets','radius','person','selected','cluster']) view[key] = state[key];
      view.center = map.map ? [map.map.getCenter().lng,map.map.getCenter().lat] : map.center;
      view.zoom = map.map ? map.map.getZoom() : map.zoom;
      history.replaceState({...history.state,merchantMapView:view},'');
    });
    if (restored?.center && restored?.zoom) { map.center = restored.center; map.zoom = restored.zoom; }
    render();
    map.init(window.MerchantMapConfig || {}).then(ready => {
      if (!ready) return;
      render();requestAnimationFrame(()=>map.resize());
      const query=new URLSearchParams(location.search).get('merchantNo');
      if(query){$('#merchant-query').value=query;$('#merchant-search').requestSubmit();}
    });
  }
})();
