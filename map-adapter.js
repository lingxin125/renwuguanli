(function () {
  'use strict';
  const CENTER = [104.2, 35.8];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = m => m.lng !== null && m.lat !== null && m.lng !== '' && m.lat !== '' && Number.isFinite(Number(m.lng)) && Number.isFinite(Number(m.lat)) && Math.abs(Number(m.lng)) <= 180 && Math.abs(Number(m.lat)) <= 90;
  let sdkKey = '';
  const scripts = new Map();
  function script(url, ready) {
    if (ready()) return Promise.resolve();
    if (scripts.has(url)) return scripts.get(url);
    const promise = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      const timer = setTimeout(() => finish(new Error('地图服务加载超时')), 14000);
      function finish(error) {
        clearTimeout(timer); el.onload = el.onerror = null;
        if (error) { scripts.delete(url); reject(error); } else resolve();
      }
      el.src = url; el.async = true;
      el.onload = () => finish(ready() ? null : new Error('地图服务不可用，请检查账号与安全配置'));
      el.onerror = () => finish(new Error('无法连接地图服务，请检查网络与配置'));
      document.head.appendChild(el);
    });
    scripts.set(url, promise); return promise;
  }
  class MerchantMap {
    constructor(container, events = {}) {
      this.el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.el) throw new Error('缺少地图容器');
      this.events = events; this.center = CENTER.slice(); this.zoom = 3;
      this.options = {}; this.data = []; this.overlays = []; this.epoch = 0;
      this.el.classList.add('map-adapter');
    }
    status(kind, message) { this.events.onStatus?.({kind, message}); }
    async init(config = {}) {
      const epoch = ++this.epoch;
      this.dispose(); this.config = config; this.mode = 'offline'; this.offline();
      if (!config.key) { this.status('offline', '未配置地图服务'); return false; }
      if (sdkKey && sdkKey !== config.key && window.AMap) {
        this.status('error', '更换高德 Key 后请刷新页面再连接'); return false;
      }
      this.status('loading', '正在连接高德地图…');
      window._AMapSecurityConfig = config.serviceHost ? {serviceHost:config.serviceHost} : {securityJsCode:config.securityJsCode || ''};
      try {
        await script('https://webapi.amap.com/maps?v=2.0&key=' + encodeURIComponent(config.key), () => !!window.AMap?.Map);
        if (epoch !== this.epoch) return false;
        sdkKey = config.key;
        this.el.replaceChildren(); this.mount = document.createElement('div'); this.mount.className = 'map-sdk'; this.el.appendChild(this.mount);
        this.map = new AMap.Map(this.mount, {zoom:this.zoom, center:this.center, viewMode:'2D', resizeEnable:true, mapStyle:'amap://styles/normal'});
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('高德底图未完成加载，请检查 Key、白名单和网络')), 14000);
          this.map.on('complete', () => {clearTimeout(timer); resolve();});
          this.map.on('error', () => {clearTimeout(timer); reject(new Error('高德鉴权或地图加载失败'));});
        });
        if (epoch !== this.epoch) return false;
        this.mode = 'amap';
        AMap.plugin(['AMap.ToolBar','AMap.Scale','AMap.MapType'],()=> {
          if(!this.map)return;
          this.map.addControl(new AMap.ToolBar({position:'RB'}));
          this.map.addControl(new AMap.Scale());
          this.map.addControl(new AMap.MapType({defaultType:0}));
          const layerIcon = this.el.querySelector('.amap-ctrl-icon-layer');
          if (layerIcon) {
            layerIcon.innerHTML = '<i class="ti ti-map" aria-hidden="true"></i>';
            layerIcon.tabIndex = 0; layerIcon.setAttribute('role','button');layerIcon.setAttribute('aria-label','切换地图类型');layerIcon.setAttribute('aria-expanded','false');
            const typeControl = layerIcon.closest('.amap-maptype');
            const typeList = typeControl?.querySelector('.amap-ctrl-list-layer');
            const closeTypeList = () => {typeControl?.classList.remove('map-type-open');layerIcon.setAttribute('aria-expanded','false');};
            layerIcon.addEventListener('click', event => {
              event.preventDefault();event.stopPropagation();
              const open=typeControl.classList.toggle('map-type-open');layerIcon.setAttribute('aria-expanded',String(open));
            });
            typeControl.addEventListener('keydown', event => {
              if (event.key === 'Escape') { event.preventDefault(); closeTypeList(); layerIcon.focus(); }
              else if (event.target === layerIcon && ['Enter',' '].includes(event.key)) { event.preventDefault(); layerIcon.click(); }
            });
            typeList?.addEventListener('change', closeTypeList);
            document.addEventListener('click', event => {if(!typeControl?.contains(event.target))closeTypeList();});
          }
        });
        this.map.on('moveend', () => this.changed());
        this.map.on('zoomend', () => {this.drawReal(); this.changed();});
        this.map.on('click', event => {
          if (!this.picking) return;
          this.pickReal(event.lnglat.lng, event.lnglat.lat);
        });
        this.render(this.data, this.options); this.changed();
        this.status('ready', '地图已加载');
        return true;
      } catch (error) {
        if (epoch !== this.epoch) return false;
        this.dispose(); this.mode = 'offline'; this.offline();
        this.status('error', error.message); return false;
      }
    }
    render(merchants, options = {}) {
      this.data = Array.from(new Map((merchants || []).filter(valid).map(m => [m.id,m])).values());
      this.options = Object.assign({points:true, heat:false, outlets:false, radius:500, outletMinZoom:8, outletDetailZoom:10, selectedId:null, person:null}, options);
      if (this.mode === 'amap') this.drawReal(); else this.drawOffline();
    }
    marker(m) {
      const stage = ['target','intention','formal'].includes(m.stage) ? m.stage : 'target';
      const activity = ['active','inactive','unknown'].includes(m.active) ? m.active : 'unknown';
      const pending = (m.tasks || []).filter(t => !['completed','closed','cancelled','已完成','已关闭'].includes(t.status));
      const risk = pending.some(t => /risk|风控/.test(t.type));
      const channel = pending.some(t => /channel|切换|通道/.test(t.type));
      const badges = [risk ? '风控' : '', channel ? '切通道' : ''].filter(Boolean);
      const zoom = this.map ? this.map.getZoom() : this.zoom;
      return '<button type="button" class="map-pin map-pin-' + stage + ' map-active-' + activity + (this.options.selectedId === m.id ? ' map-pin-selected' : '') + '" aria-label="查看' + esc(m.name) + '"><i class="ti ti-map-pin map-pin-icon" aria-hidden="true"></i>' + (zoom >= 11 && badges.length ? '<b class="map-task-badge">' + badges.join(' · ') + '</b>' : '') + '</button>';
    }
    groups(project) {
      const groups = [];
      for (const m of this.data) {
        const p = project(m); if (!p) continue;
        const group = groups.find(g => Math.hypot(g.x-p.x,g.y-p.y) < 42);
        if (group) group.items.push(m); else groups.push({x:p.x,y:p.y,items:[m]});
      }
      return groups;
    }
    selectGroup(group) {
      if (group.items.length === 1) {this.events.onSelect?.(group.items[0].id); return;}
      if(this.events.onCluster){this.events.onCluster(group.items);return;}
      const zoom = this.map ? this.map.getZoom() : this.zoom;
      const first = group.items[0];
      const separate = group.items.some(m => Math.abs(+m.lng-(+first.lng)) > .00002 || Math.abs(+m.lat-(+first.lat)) > .00002);
      if (separate && zoom < 18) {
        this.center = [group.items.reduce((v,m)=>v+(+m.lng),0)/group.items.length,group.items.reduce((v,m)=>v+(+m.lat),0)/group.items.length];
        if (this.map) this.map.setZoomAndCenter(zoom+2,this.center);
        else {this.zoom=zoom+2;this.drawOffline();this.changed();}
        return;
      }
      const old = this.el.querySelector('.map-cluster-menu'); if (old) old.remove();
      const menu = document.createElement('div'); menu.className = 'map-cluster-menu';
      const heading = document.createElement('strong'); heading.textContent = group.items.length + ' 个商户'; menu.appendChild(heading);
      const close = document.createElement('button'); close.type='button'; close.className='map-cluster-close'; close.textContent='关闭'; close.onclick=()=>menu.remove(); menu.appendChild(close);
      for (const m of group.items) {const b = document.createElement('button'); b.type='button'; b.textContent=m.name; b.onclick=()=>{menu.remove();this.events.onSelect?.(m.id);};menu.appendChild(b);}
      this.el.appendChild(menu);
    }
    drawReal() {
      if (!this.map) return;
      if (this.overlays.length) this.map.remove(this.overlays); this.overlays = [];
      if (this.options.points || this.options.selectedId) {
        const groups = this.options.points ? this.groups(m => {const p=this.map.lngLatToContainer([+m.lng,+m.lat]);return {x:p.x,y:p.y};}) : this.data.filter(m=>m.id===this.options.selectedId).map(m=>({items:[m]}));
        groups.forEach(group => {
          const first = group.items[0]; const content = document.createElement('div');
          content.innerHTML = group.items.length > 1 ? '<button type="button" class="map-cluster" aria-label="展开' + group.items.length + '个商户">'+group.items.length+'</button>' : this.marker(first);
          content.firstElementChild.onclick = event => {event.stopPropagation();this.selectGroup(group);};
          this.overlays.push(new AMap.Marker({position:[+first.lng,+first.lat],content,anchor:'center',zIndex:this.options.selectedId===first.id?130:110}));
        });
      }
      if (this.options.outlets) {
        const outletData = this.options.outletData || window.MerchantMapOutlets || [];
        const zoom = this.map.getZoom();
        if (zoom >= this.options.outletMinZoom) {
        const groups = zoom < this.options.outletDetailZoom ? this.outletGroups(outletData) : outletData.map(item => ({items:[item]}));
        groups.forEach(group => {
          const item = group.items[0];
          if (group.items.length > 1) {
            const cluster = document.createElement('button'); cluster.type='button'; cluster.className='map-outlet-cluster'; cluster.textContent=group.items.length; cluster.setAttribute('aria-label','查看'+group.items.length+'个邮政网点');
            cluster.onclick=e=>{e.stopPropagation();this.map.setZoomAndCenter(Math.min(this.map.getZooms()[1], zoom+2),[+item.lng,+item.lat]);};
            this.overlays.push(new AMap.Marker({position:[+item.lng,+item.lat],content:cluster,anchor:'center',zIndex:120})); return;
          }
          const outletCenter = [item.lng,item.lat];
          if (Number(this.options.radius)>0) this.overlays.push(new AMap.Circle({center:outletCenter,radius:Number(this.options.radius),strokeColor:'#006b32',strokeOpacity:.65,strokeWeight:1,fillColor:'#00963f',fillOpacity:.10,zIndex:50}));
          const outlet = document.createElement('button');outlet.type='button';outlet.className='map-outlet';outlet.textContent='邮';outlet.setAttribute('aria-label','查看'+item.name);outlet.title=item.name;outlet.dataset.outletId=item.id;
          outlet.onclick=e=>{e.stopPropagation();this.events.onOutlet?.(item);};
          this.overlays.push(new AMap.Marker({position:outletCenter,content:outlet,anchor:'center',zIndex:120}));
        }); }
      }
      if (valid(this.options.person || {})) {
        const person = this.options.person;
        if (Number.isFinite(person.accuracy) && person.accuracy > 0) this.overlays.push(new AMap.Circle({center:[person.lng,person.lat],radius:person.accuracy,strokeColor:'#2878d6',strokeWeight:1,fillColor:'#2878d6',fillOpacity:.12,zIndex:55}));
        this.overlays.push(new AMap.Marker({position:[+person.lng,+person.lat],content:'<span class="map-person" role="img" aria-label="当前客户经理位置" title="我的位置"><span class="map-person-label">我的位置</span></span>',anchor:'center',zIndex:140}));
      }
      this.map.add(this.overlays); this.drawHeat();
    }
    outletGroups(outlets) {
      const groups=[];
      for (const item of outlets) {
        const p=this.map.lngLatToContainer([+item.lng,+item.lat]);
        const group=groups.find(g=>Math.hypot(g.x-p.x,g.y-p.y)<48);
        if(group) group.items.push(item); else groups.push({x:p.x,y:p.y,items:[item]});
      }
      return groups;
    }
    async drawHeat() {
      const epoch = this.epoch;
      if (!this.options.heat) {this.heat?.hide(); return;}
      try {
        await script('https://webapi.amap.com/loca?v=2.0.0&key='+encodeURIComponent(this.config.key),()=>!!window.Loca?.HeatMapLayer);
        if (epoch !== this.epoch || !this.map || !this.options.heat) return;
        if (!this.loca) this.loca = new Loca.Container({map:this.map});
        if (!this.heat) this.heat = new Loca.HeatMapLayer({loca:this.loca,zIndex:45,opacity:.75,visible:true});
        // HeatMapLayer styles are the second setSource argument (not ScatterLayer.setStyle).
        // Official example: https://lbs.amap.com/demo/loca-v2/demos/cat-heatmap/hz-house-order
        this.heat.setSource(new Loca.GeoJSONSource({data:{type:'FeatureCollection',features:this.data.map(m=>({type:'Feature',properties:{count:1},geometry:{type:'Point',coordinates:[+m.lng,+m.lat]}}))}}), {radius:45,unit:'px',height:0,gradient:{0.1:'#d8eeab',0.35:'#b0d16c',0.6:'#f6cc63',0.85:'#f18d51',1:'#d5493e'},value:()=>1,min:0,max:6});
        this.heat.show(); this.status('ready', '');
      } catch (error) {if (epoch===this.epoch) this.status('warning','高德底图可用，但热力图层加载失败；请检查 Loca 配置或网络');}
    }
    pickReal(lng, lat) {
      const result = {lng,lat,address:'',simulated:false};
      let sent = false;
      const finish = address => {if(sent)return;sent=true;clearTimeout(timer);this.events.onPick?.({...result,address:address||''});};
      const timer = setTimeout(()=>finish(''),6000);
      AMap.plugin('AMap.Geocoder',()=>{try {new AMap.Geocoder().getAddress([lng,lat],(status,data)=>finish(status==='complete'?data.regeocode?.formattedAddress:''));}catch (_) {finish('');}});
    }
    offline() {
      this.el.innerHTML = '<div class="map-offline"><div class="map-offline-grid"></div><div class="map-offline-caption">地图服务未连接</div><div class="map-offline-features"></div><div class="map-offline-note">请检查地图服务配置</div></div><div class="map-zoom"><button type="button" aria-label="放大地图">＋</button><button type="button" aria-label="缩小地图">−</button></div>';
      this.surface = this.el.querySelector('.map-offline'); this.layer = this.el.querySelector('.map-offline-features');
      const controls = this.el.querySelectorAll('.map-zoom button'); controls[0].onclick=()=>this.changeZoom(1);controls[1].onclick=()=>this.changeZoom(-1);
      this.surface.onclick = event => {
        if (!this.picking || event.target.closest('button')) return;
        const r=this.surface.getBoundingClientRect(),b=this.getBounds();
        this.events.onPick?.({lng:b.west+(event.clientX-r.left)/r.width*(b.east-b.west),lat:b.north-(event.clientY-r.top)/r.height*(b.north-b.south),address:'',simulated:true});
      };
      this.surface.onpointerdown = e => {if(this.picking||e.target.closest('button'))return;this.drag={x:e.clientX,y:e.clientY,center:this.center.slice()};this.surface.setPointerCapture(e.pointerId);};
      this.surface.onpointerup = e => {
        if (!this.drag) return;
        const b=this.getBounds();this.center=[this.drag.center[0]-(e.clientX-this.drag.x)/Math.max(this.el.clientWidth,1)*(b.east-b.west),this.drag.center[1]+(e.clientY-this.drag.y)/Math.max(this.el.clientHeight,1)*(b.north-b.south)];this.drag=null;this.drawOffline();this.changed();
      };
      this.surface.onpointercancel = ()=>{this.drag=null;};
      this.drawOffline(); this.setPickMode(this.picking); this.changed();
    }
    project(m) {const b=this.getBounds();return {x:(+m.lng-b.west)/(b.east-b.west)*this.el.clientWidth,y:(b.north-(+m.lat))/(b.north-b.south)*this.el.clientHeight};}
    drawOffline() {
      if (!this.layer) return;
      // 未连接高德时只显示状态，不用本地图形冒充真实地图或热力。
      if (this.mode !== 'amap') { this.layer.replaceChildren(); return; }
      this.layer.replaceChildren();
      const add = (html, p, className='') => {const n=document.createElement('div');n.className='map-object '+className;n.style.left=p.x+'px';n.style.top=p.y+'px';n.innerHTML=html;this.layer.appendChild(n);return n;};
      if (this.options.heat) this.data.forEach(m=>add('<span class="map-heat-spot"></span>',this.project(m),'map-heat-object'));
      if (this.options.outlets) {
        const p=this.project({lng:CENTER[0],lat:CENTER[1]}); const b=this.getBounds();
        const diameter=2*Number(this.options.radius)/111320/(b.north-b.south)*this.el.clientHeight;
        const n=add((diameter>0?'<span class="map-radius" style="width:'+diameter+'px;height:'+diameter+'px"></span>':'')+'<button type="button" class="map-outlet" aria-label="查看杭州示例网点">邮</button>',p,'map-outlet-object');
        n.querySelector('button').onclick=e=>{e.stopPropagation();this.events.onSelect?.('outlet');};
      }
      if(this.options.points) this.groups(m=>this.project(m)).forEach(g=>{const n=add(g.items.length>1?'<button type="button" class="map-cluster" aria-label="展开'+g.items.length+'个商户">'+g.items.length+'</button>':this.marker(g.items[0]),g);n.querySelector('button').onclick=e=>{e.stopPropagation();this.selectGroup(g);};});
      if(valid(this.options.person||{})) add('<span class="map-person" title="人员位置"></span>',this.project(this.options.person));
    }
    changed() {const bounds=this.getBounds();const signature=JSON.stringify(bounds);if(signature!==this.lastBounds){this.lastBounds=signature;this.events.onBoundsChange?.(bounds);}}
    changeZoom(amount) {this.zoom=Math.max(10,Math.min(19,this.zoom+amount));this.drawOffline();this.changed();}
    focus(lng,lat) {if(!valid({lng,lat}))return;this.center=[+lng,+lat];if(this.map)this.map.setCenter(this.center);else {this.drawOffline();this.changed();}}
    resize() {if(this.map){this.map.resize?.();this.drawReal();}else this.drawOffline();this.changed();}
    setPickMode(value) {this.picking=!!value;this.el.classList.toggle('map-picking',this.picking);if(this.map)this.map.setDefaultCursor(this.picking?'crosshair':'grab');}
    getBounds() {
      if(this.mode==='amap'&&this.map){const b=this.map.getBounds();return {west:b.getSouthWest().lng,south:b.getSouthWest().lat,east:b.getNorthEast().lng,north:b.getNorthEast().lat};}
      const width=.035*Math.pow(2,14-this.zoom),height=width*Math.max(this.el.clientHeight,200)/Math.max(this.el.clientWidth,300)*Math.cos(this.center[1]*Math.PI/180);
      return {west:this.center[0]-width/2,south:this.center[1]-height/2,east:this.center[0]+width/2,north:this.center[1]+height/2};
    }
    dispose() {this.heat?.destroy();this.loca?.destroy();this.map?.destroy();this.heat=null;this.loca=null;this.map=null;this.layer=null;this.overlays=[];}
    destroy() {this.epoch++;this.dispose();this.el.replaceChildren();}
  }
  window.MerchantMap = MerchantMap;
}());
