(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrototypeStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'youfu.map.prototype.v1';
  const HOUR = 3600000;
  const MANUAL_TAGS = ['重点跟进', '待回访', '已联系'];
  const TYPES = {supplement:'补充资料',channel_switch:'切换备用通道',maintenance:'走访维护',risk:'风控处理',suspense:'挂账处理',target_visit:'目标走访'};
  const clone = value => JSON.parse(JSON.stringify(value));
  const unfinished = task => !['completed', 'cancelled'].includes(task.status);
  const located = m => typeof m.lng === 'number' && typeof m.lat === 'number' && Number.isFinite(m.lng) && Number.isFinite(m.lat);
  const required = (value, label, max=100) => { const s=String(value ?? '').trim(); if(!s || s.length>max) throw Error(label+'不能为空且不能超过'+max+'字'); return s; };
  function coordinates(lng,lat,optional=false) {
    if(optional && (lng==null || lng==='') && (lat==null || lat==='')) return {lng:null,lat:null};
    if(lng==null || lat==null || lng==='' || lat==='' || !Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat)) || Math.abs(Number(lng))>180 || Math.abs(Number(lat))>90) throw Error('请填写有效经纬度坐标');
    return {lng:Number(lng),lat:Number(lat)};
  }
  function distance(a,b) { if(!located(a)||!located(b)) return null; const r=Math.PI/180; const p=(b.lat-a.lat)*r;const q=(b.lng-a.lng)*r;return 6371000*2*Math.atan2(Math.sqrt(Math.sin(p/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(q/2)**2),Math.sqrt(1-(Math.sin(p/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(q/2)**2))); }
  function seed(now) {
    const rows=[
      ['青禾便利','formal',120.1633,30.2735,'active',['channel_switch','supplement','risk']],
      ['西桥面馆','formal',120.158,30.2708,'inactive',['risk','maintenance']],
      ['晴日花房','target',120.169,30.2755,'unknown',['target_visit']],
      ['麦穗烘焙','intention',120.166,30.2678,'unknown',['target_visit']],
      ['星桥文具','formal',120.173,30.272,'active',['suspense']],
      ['云间茶铺','formal',120.1633,30.2735,'active',['maintenance']],
      ['湖畔水果','target',120.151,30.279,'unknown',['target_visit']],
      ['晨光杂货','formal',null,null,'unknown',['supplement']],
      ['南巷轻食','formal',120.176,30.282,'inactive',['maintenance']],
      ['拾光书屋','intention',120.149,30.264,'unknown',['target_visit']],
      ['圆点咖啡','formal',120.18,30.262,'active',[]],
      ['桥南修理','target',null,null,'unknown',[]]
    ];
    return {schema:1,sequence:20,requests:{},merchants:rows.map((r,i)=>({id:'m'+(i+1),name:r[0],no:r[1]==='formal'?'DEMO'+String(i+1).padStart(8,'0'):'TARGET'+String(i+1).padStart(4,'0'),stage:r[1],source:i%3===0?'系统导入':'手工录入',org:'武林支行',address:'杭州市拱墅区湖墅南路'+(i===5?1:i+1)+'号',lng:r[2],lat:r[3],positionVersion:1,positionVerified:false,active:r[4],recentTrade:r[4]==='unknown'?null:i%2===0,tags:i%3===0?['重点跟进']:[],contact:'联系人'+(i+1),phone:'1380000'+String(i+1).padStart(4,'0'),version:1,leadStatus:'open',updatedAt:now-i*HOUR,claim:i===4?{owner:'other',at:now-HOUR,deadline:now+71*HOUR,firstActionAt:null}:i===5?{owner:'me',at:now-50*HOUR,deadline:now+22*HOUR,firstActionAt:null}:null,tasks:r[5].map((type,j)=>({id:'t'+(i+1)+'-'+(j+1),type,title:TYPES[type],status:i===1&&j===0?'completed':i===8?'completed':i===9?'rejected':'pending',reviewRequired:['supplement','risk','suspense'].includes(type),dueAt:now+120*HOUR,rejectionReason:i===9?'请补充到店说明':'',submissions:[]})),visits:[],history:[]}))};
  }
  class Store {
    constructor({storage,now}={}) {
      this.now=now||Date.now;this.storage=storage; if(storage===undefined) {try {this.storage=typeof localStorage!=='undefined'?localStorage:null;}catch(_){this.storage=null;}}
      try { const saved=this.storage?.getItem(KEY);this.state=saved?JSON.parse(saved):seed(this.now());if(this.state.schema!==1||!Array.isArray(this.state.merchants))this.state=seed(this.now()); } catch(_){this.state=seed(this.now());}
      let migrated=false;const cleanText=value=>typeof value==='string'?value.replace(/演示路/g,'湖墅南路').replace(/演示|虚构/g,''):value;const cleanDeep=value=>{if(Array.isArray(value))return value.map(cleanDeep);if(value&&typeof value==='object'){for(const key of Object.keys(value)){const clean=cleanDeep(value[key]);if(clean!==value[key])migrated=true;value[key]=clean;}return value;}return cleanText(value);};cleanDeep(this.state);if(migrated){try{this.storage?.setItem(KEY,JSON.stringify(this.state));}catch(_){} }
      this.persisted=JSON.stringify(this.state);this.expireClaims();
    }
    _sync(){try{const saved=this.storage?.getItem(KEY);if(saved&&saved!==this.persisted){const parsed=JSON.parse(saved);if(parsed.schema===1&&Array.isArray(parsed.merchants)){this.state=parsed;this.persisted=saved;}}}catch(_){/* 已读取的本地快照仍可查看。 */}}
    _save(){try {const saved=JSON.stringify(this.state);this.storage?.setItem(KEY,saved);this.persisted=saved;}catch(_){this.state=JSON.parse(this.persisted);throw Error('本地存储不可用，操作未保存，请检查浏览器存储权限');}}
    _find(id){this._sync();const m=this.state.merchants.find(m=>m.id===id);if(!m)throw Error('商户不存在');return m;}
    _check(m,version){if(version!==undefined&&m.version!==version)throw Error('商户已更新，请刷新后重试（版本冲突）');}
    _change(m,event,detail){m.version++;m.updatedAt=this.now();m.history.push({at:this.now(),event,detail:clone(detail||{}),actor:'me'});this._save();return clone(m);}
    _owner(m){this.expireClaims();if(!m.claim||m.claim.owner!=='me')throw Error('请先领取商户，且仅有效领取人可以处理任务');}
    _lead(m){if(m.stage==='formal')throw Error('正式商户不可执行线索操作');if(m.leadStatus==='abandoned')throw Error('已放弃线索不可继续操作');if(m.claim&&m.claim.owner!=='me')throw Error('其他人员已领取该商户');}
    _request(scope,key){this._sync();return key?this.state.requests[scope+':'+key]:null;}
    _remember(scope,key,result){if(key)this.state.requests[scope+':'+key]=clone(result);this._save();return result;}
    get(id){this.expireClaims();return clone(this._find(id));}
    completedTasks(id,window='90') {
      const tasks=this.get(id).tasks.filter(t=>t.status==='completed');
      return window==='all'?tasks:tasks.filter(t=>{const at=t.completedAt??t.submissions.at(-1)?.at;return at==null||at>=this.now()-90*24*HOUR;});
    }
    list(filters={}) {
      this.expireClaims();const f=filters;const status=f.status||(f.entry==='data'?'all':'unfinished');
      if(f.distance!=null&&(!f.person||!located(f.person)))throw Error('请先获取有效定位后使用距离筛选');
      const query=String(f.q||'').trim().toLowerCase();
      const day=24*HOUR;
      const visitStart=f.visitStart?new Date(f.visitStart+'T00:00:00').getTime():this.now()-30*day;
      const visitEnd=f.visitEnd?new Date(f.visitEnd+'T00:00:00').getTime()+day-1:this.now();
      if(f.visit&&f.visit!=='all'&&(!Number.isFinite(visitStart)||!Number.isFinite(visitEnd)||visitStart>visitEnd||visitEnd-visitStart>366*day))throw Error('走访日期区间需有效、起止有序且不超过366天');
      let rows=this.state.merchants.filter(m=>{
        if(m.leadStatus==='abandoned')return false;
        if(query&&!`${m.name} ${m.no} ${m.address}`.toLowerCase().includes(query))return false;
        for(const field of ['stage','active','source'])if(f[field]&&f[field]!=='all'&&m[field]!==f[field])return false;
        if(f.recent&&f.recent!=='all'&&m.recentTrade!==({yes:true,no:false,unknown:null})[f.recent])return false;
        if(f.tag&&f.tag!=='all'&&!m.tags.includes(f.tag))return false;
        if(f.unlocated&&located(m))return false;
        const visited=m.visits.some(v=>v.at>=visitStart&&v.at<=visitEnd);
        if(f.visit==='visited'&&!visited || f.visit==='unvisited'&&visited)return false;
        if(f.urgency==='reclaim'&&!(m.claim&&m.claim.firstActionAt==null&&m.claim.deadline-this.now()<=24*HOUR))return false;
        if(f.urgency==='overdue'&&!m.tasks.some(t=>unfinished(t)&&t.dueAt<this.now()))return false;
        if(f.urgency==='rejected'&&!m.tasks.some(t=>t.status==='rejected'))return false;
        if(f.claim==='unclaimed'&&(m.claim||!m.tasks.some(t=>['pending','rejected'].includes(t.status))) || f.claim==='mine'&&m.claim?.owner!=='me' || f.claim==='others'&&(!m.claim||m.claim.owner==='me'))return false;
        if(f.distance!=null&&(!located(m)||distance(m,f.person)>Number(f.distance)))return false;
        if(status!=='all'||f.type&&f.type!=='all')return m.tasks.some(t=>(!f.type||f.type==='all'||t.type===f.type)&&(status==='all'||status==='unfinished'&&unfinished(t)||t.status===status));
        return true;
      });
      rows=clone(rows);rows.forEach(m=>m.distance=f.person?distance(m,f.person):null);
      rows.sort((a,b)=>f.sort==='distance'?(a.distance??Infinity)-(b.distance??Infinity):f.sort==='tasks'?b.tasks.filter(unfinished).length-a.tasks.filter(unfinished).length:b.updatedAt-a.updatedAt);
      return rows;
    }
    counts(filters={}) {filters={...filters,status:filters.status||(filters.entry==='data'?'all':'unfinished')};const rows=this.list(filters);return {total:rows.length,located:rows.filter(located).length,unlocated:rows.filter(m=>!located(m)).length,tasks:rows.reduce((n,m)=>n+m.tasks.filter(t=>(!filters.type||filters.type==='all'||t.type===filters.type)&&((filters.status||'unfinished')==='all'||(filters.status||'unfinished')==='unfinished'&&unfinished(t)||t.status===filters.status)).length,0)};}
    claim(id,expectedVersion){this.expireClaims();const m=this._find(id);this._check(m,expectedVersion);if(m.leadStatus==='abandoned')throw Error('已放弃线索不可领取');if(!m.tasks.some(t=>['pending','rejected'].includes(t.status)))throw Error('没有待处理任务，无需领取');if(m.claim&&m.claim.owner!=='me')throw Error('其他人员已领取，请刷新');if(m.claim)return clone(m);m.claim={owner:'me',at:this.now(),deadline:this.now()+72*HOUR,firstActionAt:null};return this._change(m,'领取商户');}
    issueTask(id,{type}={}) {
      this.expireClaims();const m=this._find(id);
      if(m.leadStatus==='abandoned')throw Error('已放弃线索不能下发任务');
      if(!Object.prototype.hasOwnProperty.call(TYPES,type))throw Error('请选择有效任务类型');
      if((m.stage==='formal')===(type==='target_visit'))throw Error('任务类型与商户阶段不符');
      const task={id:'t-new-'+(++this.state.sequence),type,title:TYPES[type],status:'pending',reviewRequired:['supplement','risk','suspense'].includes(type),issuedAt:this.now(),dueAt:this.now()+120*HOUR,rejectionReason:'',submissions:[]};
      m.tasks.push(task);return this._change(m,'任务下发',{taskId:task.id,owner:m.claim?.owner||null,simulation:true});
    }
    submitTask(id,taskId,payload={}, {idempotencyKey}={}) {
      const scope='task:'+id+':'+taskId;const prior=this._request(scope,idempotencyKey);if(prior)return clone(prior);
      const m=this._find(id);this._owner(m);const t=m.tasks.find(t=>t.id===taskId);if(!t)throw Error('任务不存在');if(!['pending','rejected'].includes(t.status))throw Error('当前任务状态不可提交');
      const result=String(payload.result||'已处理');const note=required(payload.note,'处理说明',500);const fields=payload.fields||payload;
      if(['supplement','risk','suspense'].includes(t.type)&&(!Array.isArray(payload.attachments)||!payload.attachments.length))throw Error('请补充任务所需附件');
      if(t.type==='channel_switch'){required(fields.channel,'备用通道');if(fields.wechatConfirmed!==true||fields.alipayConfirmed!==true)throw Error('请确认微信和支付宝通道查询结果');}
      if(t.type==='suspense'){for(const [key,label] of Object.entries({method:'处理方式',accountName:'账户姓名',accountNo:'账号',bank:'开户银行',branch:'开户支行',idNo:'证件号码'}))required(fields[key],label);if(!/^\d{12,30}$/.test(fields.accountNo))throw Error('账号应为12至30位数字');if(!/^(\d{15}|\d{17}[\dXx])$/.test(fields.idNo))throw Error('证件号码格式不正确');}
      t.submissions.push({...clone(payload),result,note,at:this.now(),actor:'me'});t.status=t.reviewRequired?'reviewing':'completed';t.rejectionReason='';m.claim.firstActionAt=m.claim.firstActionAt??this.now();if(!m.tasks.some(unfinished))m.claim=null;
      return this._remember(scope,idempotencyKey,this._change(m,'提交任务',{taskId,status:t.status}));
    }
    reviewTask(id,taskId,{approved,reason}={}) {
      const m=this._find(id);const task=m.tasks.find(t=>t.id===taskId);
      if(!task||task.status!=='reviewing')throw Error('只有待审核任务可以审核');
      if(typeof approved!=='boolean')throw Error('请选择审核结果');
      const rejection=approved?'':required(reason,'驳回原因',500);
      task.status=approved?'completed':'rejected';task.rejectionReason=rejection;
      if(approved)task.completedAt=this.now();
      if(!m.tasks.some(unfinished))m.claim=null;
      return this._change(m,approved?'任务审核通过':'任务审核驳回',{taskId,reason:rejection,simulation:true});
    }
    visit(id,payload={}, {idempotencyKey}={}) {
      const scope='visit:'+id;const prior=this._request(scope,idempotencyKey);if(prior)return clone(prior);const m=this._find(id);if(m.leadStatus==='abandoned')throw Error('已放弃线索不可走访');
      const result=required(payload.result,'走访结果');const note=String(payload.note||'').trim();if(note.length>100)throw Error('走访备注不能超过100字');
      if(result==='其他'&&!note)throw Error('走访结果为其他时，请填写备注');
      if(payload.linkedTaskIds&&(!Array.isArray(payload.linkedTaskIds)||payload.linkedTaskIds.some(id=>!m.tasks.some(t=>t.id===id))))throw Error('只能关联当前商户的任务');
      const loc=payload.location;const metres=loc&&located(loc)?distance(m,loc):null;const age=loc?this.now()-Number(loc.capturedAt):Infinity;
      const verified=metres!==null&&metres<=100&&!loc.simulated&&Number.isFinite(loc.accuracy)&&loc.accuracy>=0&&loc.accuracy<=50&&age>=0&&age<=60000;
      const reason=verified?'':required(payload.supplementReason||payload.supplement_reason,'未核验走访原因',200);
      const record={id:'v'+(++this.state.sequence),at:this.now(),result,note,location:loc?clone(loc):null,distance:metres,positionVersion:m.positionVersion,verificationStatus:verified?'verified':'unverified',supplementReason:reason,photos:clone(payload.photos||[]),linkedTaskIds:clone(payload.linkedTaskIds||[]),actor:'me'};
      m.visits.push(record);this._change(m,'记录走访',{visitId:record.id,verificationStatus:record.verificationStatus});return this._remember(scope,idempotencyKey,clone(record));
    }
    updateTags(id,tags,expectedVersion){const m=this._find(id);this._check(m,expectedVersion);if(!Array.isArray(tags)||tags.some(t=>!MANUAL_TAGS.includes(t)))throw Error('只能选择允许的手动标签');m.tags=[...new Set(tags)];return this._change(m,'更新手动标签',{tags:m.tags});}
    correctPosition(id,payload,expectedVersion){const m=this._find(id);this._check(m,expectedVersion);const pos=coordinates(payload.lng,payload.lat);const address=required(payload.address,'经营地址',200);const before={lng:m.lng,lat:m.lat,address:m.address};Object.assign(m,pos,{address,mapAddress:String(payload.mapAddress||address),detailAddress:String(payload.detailAddress||''),positionVersion:m.positionVersion+1,positionVerified:true});return this._change(m,'地址校正',{before,after:{...pos,address}});}
    markIntention(id,payload){const m=this._find(id);this._lead(m);const contact=required(payload.contact,'联系人',50);const phone=required(payload.phone,'联系电话',32);if(!/^\+?[\d ()-]{7,32}$/.test(phone))throw Error('联系电话格式不正确');m.stage='intention';m.contact=contact;m.phone=phone;return this._change(m,'标记意向',{note:String(payload.note||'').slice(0,500)});}
    abandon(id,reason){const m=this._find(id);this._lead(m);reason=required(reason,'放弃原因',200);m.leadStatus='abandoned';m.claim=null;m.tasks.filter(unfinished).forEach(t=>t.status='cancelled');return this._change(m,'放弃线索',{reason});}
    beginConversion(id){const m=this._find(id);this._lead(m);if(m.stage!=='intention')throw Error('请先标记为意向商户');if(m.conversion?.status==='processing')throw Error('进件正在处理中');m.conversion={status:'processing',at:this.now()};return this._change(m,'发起进件');}
    resolveConversion(id,payload){const m=this._find(id);if(m.conversion?.status!=='processing')throw Error('没有处理中的进件');if(payload.success)return this.convert(id,payload);m.conversion={status:'failed',reason:required(payload.reason,'失败原因',200),at:this.now()};return this._change(m,'进件失败');}
    convert(id,payload){const m=this._find(id);this._lead(m);if(m.stage!=='intention')throw Error('请先标记为意向商户');const no=required(payload.no,'正式商户号',32);if(!/^[a-zA-Z0-9_-]{5,32}$/.test(no))throw Error('商户号格式不正确');if(this.state.merchants.some(x=>x.id!==id&&x.no===no))throw Error('商户号已存在，请核对避免重复绑定');const name=required(payload.name||m.name,'商户名称');const priorNo=m.no;m.no=no;m.name=name;m.stage='formal';m.leadStatus='converted';m.conversion={status:'succeeded',at:this.now()};m.tasks.filter(t=>t.type==='target_visit'&&unfinished(t)).forEach(t=>t.status='completed');if(!m.tasks.some(unfinished))m.claim=null;return this._change(m,'正式绑定成功',{priorNo,no});}
    create(payload){const name=required(payload.name,'商户名称');const address=required(payload.address,'经营地址',200);const pos=coordinates(payload.lng,payload.lat,true);const id='m'+(++this.state.sequence);const m={id,name,no:'TARGET'+this.state.sequence,stage:'target',source:payload.source||'手工录入',org:'武林支行',address,...pos,positionVersion:1,positionVerified:false,active:'unknown',recentTrade:null,tags:[],contact:String(payload.contact||''),phone:String(payload.phone||''),version:1,leadStatus:'open',updatedAt:this.now(),claim:null,tasks:[{id:'t'+this.state.sequence+'-1',type:'target_visit',title:TYPES.target_visit,status:'pending',reviewRequired:false,dueAt:this.now()+120*HOUR,rejectionReason:'',submissions:[]}],visits:[],history:[]};this.state.merchants.push(m);this._save();return clone(m);}
    expireClaims(){this._sync();let changed=false;for(const m of this.state.merchants){if(m.claim&&(!m.tasks.some(unfinished)||m.claim.firstActionAt==null&&this.now()>=m.claim.deadline)){m.history.push({at:this.now(),event:m.tasks.some(unfinished)?'首次处理超时回收':'全部任务结束释放',detail:{owner:m.claim.owner},actor:'system'});m.claim=null;m.version++;changed=true;}}if(changed)this._save();}
    exportState(){this.expireClaims();return clone(this.state);}
    reset(){this.state=seed(this.now());this._save();this.expireClaims();return this.exportState();}
  }
  return {Store,MANUAL_TAGS,TYPES,distance,located,STORAGE_KEY:KEY};
});
