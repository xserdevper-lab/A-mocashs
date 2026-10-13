(function(root){
  'use strict';
  const fail = message => { throw new Error(message); };
  const cents = value => { const n=Number(value); if(!Number.isFinite(n)||n<0||n>1e10) fail('จำนวนเงินไม่ถูกต้อง'); return Math.round(n*100); };
  const text = value => {const t=String(value||'').trim(); if(!t||t.length>160) fail('กรุณาระบุชื่อไม่เกิน 160 ตัวอักษร');return t;};
  const empty = () => ({revision:0,accounts:[],transactions:[],debts:[],payments:[],requests:[]});
  const balance = (s,id) => {const a=s.accounts.find(x=>x.id===id);if(!a)fail('ไม่พบบัญชี');return a.opening+s.transactions.reduce((sum,t)=>sum+(t.account===id?(t.type==='income'?t.amount:-t.amount):0)+(t.to===id?t.amount:0),0);};
  function apply(source,op) {
    const s=JSON.parse(JSON.stringify(source));
    if(!op.id||!op.at||!/^\d{4}-\d{2}-\d{2}$/.test(op.date))fail('ข้อมูลรายการไม่ถูกต้อง');
    if(s.requests.includes(op.id))return s;
    if(op.revision!==s.revision)fail('ข้อมูลเปลี่ยนจากอุปกรณ์อื่น กรุณารีเฟรชแล้วลองอีกครั้ง');
    const p=op.payload||{}; const account=id=>{if(!s.accounts.some(a=>a.id===id))fail('กรุณาเลือกบัญชี');};
    const spend=(id,amount)=>{account(id);if(balance(s,id)<amount)fail('ยอดเงินในบัญชีไม่เพียงพอ');};
    if(op.action==='account') { s.accounts.push({id:op.id,name:text(p.name),opening:cents(p.opening),color:['blue','green','purple','orange'].includes(p.color)?p.color:'blue'}); }
    else if(op.action==='transaction') {
      if(!['income','expense','transfer'].includes(p.type))fail('ประเภทรายการไม่ถูกต้อง');
      const amount=cents(p.amount);if(!amount)fail('จำนวนเงินต้องมากกว่า 0');account(p.account);
      if(p.type!=='income')spend(p.account,amount);
      if(p.type==='transfer'){account(p.to);if(p.account===p.to)fail('บัญชีต้นทางและปลายทางต้องต่างกัน');}
      s.transactions.push({id:op.id,type:p.type,amount,account:p.account,to:p.type==='transfer'?p.to:'',title:text(p.title),category:String(p.category||'อื่น ๆ').slice(0,80),date:op.date,at:op.at});
    } else if(op.action==='debt') {
      const amount=cents(p.amount);if(!amount)fail('จำนวนเงินต้องมากกว่า 0');
      if(!Number.isInteger(Number(p.day))||p.day<1||p.day>31)fail('วันครบกำหนดต้องเป็น 1–31');
      s.debts.push({id:op.id,name:text(p.name),amount,day:Number(p.day),start:op.date.slice(0,7)});
    } else if(op.action==='pay') {
      const d=s.debts.find(x=>x.id===p.debt);if(!d)fail('ไม่พบรายการหนี้');
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.month)||p.month<d.start)fail('เดือนชำระไม่ถูกต้อง');
      if(s.payments.some(x=>x.debt===d.id&&x.month===p.month))fail('รายการนี้ชำระแล้ว');
      spend(p.account,d.amount);
      s.transactions.push({id:op.id,type:'expense',amount:d.amount,account:p.account,to:'',title:'ชำระ '+d.name,category:'ชำระหนี้',date:op.date,at:op.at});
      s.payments.push({id:op.id,debt:d.id,month:p.month,account:p.account,amount:d.amount,date:op.date});
    } else fail('คำสั่งไม่ถูกต้อง');
    s.requests.push(op.id);s.revision++;return s;
  }
  function calculate(expression) {
    const tokens=String(expression).replace(/×/g,'*').replace(/÷/g,'/').match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/()]/g)||[];
    if(tokens.join('')!==String(expression).replace(/\s/g,'').replace(/×/g,'*').replace(/÷/g,'/')||tokens.length>100)fail('สูตรไม่ถูกต้อง');
    let i=0;const primary=()=>{if(tokens[i]==='-'){i++;return -primary();}if(tokens[i]==='+'){i++;return primary();}if(tokens[i]==='('){i++;const n=sum();if(tokens[i++]!==')')fail('วงเล็บไม่ครบ');return n;}const t=tokens[i++];if(!t||!/^\d|^\./.test(t))fail('สูตรไม่ถูกต้อง');return Number(t);};
    const product=()=>{let n=primary();while(['*','/'].includes(tokens[i])){const t=tokens[i++],v=primary();if(t==='/'&&v===0)fail('ไม่สามารถหารด้วยศูนย์');n=t==='*'?n*v:n/v;}return n;};
    const sum=()=>{let n=product();while(['+','-'].includes(tokens[i])){const t=tokens[i++],v=product();n=t==='+'?n+v:n-v;}return n;};
    const n=sum();if(i!==tokens.length||!Number.isFinite(n))fail('สูตรไม่ถูกต้อง');return Math.round(n*100)/100;
  }
  const api={empty,cents,balance,apply,calculate};if(typeof module!=='undefined')module.exports=api;root.Finance=api;
})(typeof globalThis!=='undefined'?globalThis:this);

const BRIDGE_SERVER="(function(){\n 'use strict';\n const origin='https://xserdevper-lab.github.io';\n function ready(){window.top.postMessage({kind:'amocashs-bridge-ready',nonce:BRIDGE_NONCE,client:BRIDGE_CLIENT_ID},origin);}\n window.addEventListener('message',event=>{\n  const d=event.data;\n  if(event.origin!==origin||event.source!==window.top||d?.kind!=='amocashs-rpc'||d.nonce!==BRIDGE_NONCE||typeof d.id!=='string'||!['authConfig','authenticateGoogle','sessionInfo','logout','getState','mutate'].includes(d.method))return;\n  const send=payload=>event.source.postMessage({kind:'amocashs-rpc-result',nonce:BRIDGE_NONCE,id:d.id,...payload},origin);\n  const runner=google.script.run.withSuccessHandler(data=>send({data})).withFailureHandler(error=>send({error:error.message||'Google Sheet ไม่ตอบสนอง'}));\n  runner[d.method](...(Array.isArray(d.args)?d.args:[]));\n });\n window.addEventListener('DOMContentLoaded',()=>{ready();const interval=setInterval(ready,1000);setTimeout(()=>clearInterval(interval),30000);});\n})();\n";
// Identity and membership configuration lives in Script Properties, never in public UI.
function authConfig() {
 const clientId=PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
 if(!clientId)throw new Error('ระบบเข้าสู่ระบบยังไม่ได้ตั้งค่า');
 const challenge=Utilities.getUuid()+Utilities.getUuid();
 CacheService.getScriptCache().put('login:'+digest_(challenge),'1',300);
 return {clientId,challenge};
}
function digest_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value)).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function authenticateGoogle(accessToken,challenge) {
 if(typeof accessToken!=='string'||accessToken.length<20||accessToken.length>4096||typeof challenge!=='string')throw new Error('ไม่สามารถยืนยันบัญชี Google ได้');
 const cache=CacheService.getScriptCache(),key='login:'+digest_(challenge);
 if(!cache.get(key))throw new Error('คำขอเข้าสู่ระบบหมดอายุ กรุณาลองอีกครั้ง');
 const properties=PropertiesService.getScriptProperties(),clientId=properties.getProperty('GOOGLE_CLIENT_ID');
 // Same token-info mechanism used by Google's OAuth2Client.getTokenInfo.
 // Send credentials in Authorization headers, never in URLs or logs.
 const response=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo',{method:'post',headers:{Authorization:'Bearer '+accessToken},muteHttpExceptions:true});
 if(response.getResponseCode()!==200)throw new Error('ไม่สามารถยืนยันบัญชี Google ได้');
 const info=JSON.parse(response.getContentText());
 if(!clientId||info.aud!==clientId||(!Number.isFinite(Number(info.expires_in))||Number(info.expires_in)<=0))throw new Error('ไม่สามารถยืนยันบัญชี Google ได้');
 const profileResponse=UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+accessToken},muteHttpExceptions:true});
 if(profileResponse.getResponseCode()!==200)throw new Error('ไม่สามารถยืนยันบัญชี Google ได้');
 const profile=JSON.parse(profileResponse.getContentText());
 const email=String(profile.email||'').toLowerCase();
 const members=JSON.parse(properties.getProperty('MEMBER_EMAILS')||'[]');
 if(!profile.sub||profile.email_verified!==true||!email.endsWith('@gmail.com')||!members.includes(email)||(info.sub&&info.sub!==profile.sub))throw new Error('บัญชีนี้ไม่มีสิทธิ์เข้าใช้แอป');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try {
  if(!cache.get(key))throw new Error('คำขอเข้าสู่ระบบหมดอายุ กรุณาลองอีกครั้ง');
  cache.remove(key);
  const bindingKey='MEMBER_SUB_'+digest_(email),bound=properties.getProperty(bindingKey);
  if(bound&&bound!==profile.sub)throw new Error('ไม่สามารถยืนยันบัญชี Google ได้');
  if(!bound)properties.setProperty(bindingKey,profile.sub);
  const token=Utilities.getUuid()+Utilities.getUuid(),expires=Date.now()+21600000;
  const user={id:digest_(profile.sub).slice(0,24),email,name:String(profile.name||email),owner:email===members[0],expires};
  cache.put('session:'+digest_(token),JSON.stringify(user),21600);
  return {token,user};
 }finally{lock.releaseLock();}
}
function session_(token){
 if(typeof token!=='string'||token.length!==72)throw new Error('กรุณาเข้าสู่ระบบ');
 const raw=CacheService.getScriptCache().get('session:'+digest_(token));
 if(!raw)throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
 const user=JSON.parse(raw),members=JSON.parse(PropertiesService.getScriptProperties().getProperty('MEMBER_EMAILS')||'[]');
 if(user.expires<=Date.now()||!members.includes(user.email))throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
 return user;
}
function sessionInfo(token){return session_(token);}
function logout(token){if(typeof token==='string')CacheService.getScriptCache().remove('session:'+digest_(token));return true;}
function scope_(token,area){const user=session_(token);if(area==='shared')return 'Amocashs';if(area==='private')return 'Private_'+user.id;throw new Error('ไม่มีสิทธิ์เข้าถึงพื้นที่นี้');}

function doGet(e) {
  if(e&&e.parameter&&e.parameter.bridge==='1') {
    const html='<!doctype html><html><head><meta charset="utf-8"></head><body><script>const BRIDGE_NONCE='+JSON.stringify(Utilities.getUuid())+';const BRIDGE_CLIENT_ID='+JSON.stringify(/^[a-zA-Z0-9-]{1,100}$/.test(String(e.parameter.client||''))?String(e.parameter.client):'')+';'+BRIDGE_SERVER+'</script></body></html>';
    return HtmlService.createHtmlOutput(html).setTitle('A-mocashs Data API').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutput('<!doctype html><html lang="th"><head><meta charset="utf-8"></head><body style="font-family:system-ui;padding:32px"><h2>เชื่อมต่อ Google สำหรับ A-mocashs แล้ว</h2><p>กลับไปที่แอปบน GitHub แล้วกดเชื่อมต่ออีกครั้ง</p><a href="https://xserdevper-lab.github.io/A-mocashs/" target="_top">เปิด A-mocashs</a></body></html>').setTitle('เชื่อมต่อ A-mocashs').addMetaTag('viewport','width=device-width, initial-scale=1');
}
// An append-only snapshot log makes each commit one atomic Sheet row write.
// The readable tabs are projections and are rebuilt from the committed snapshot.
function book_() {
  const b=SpreadsheetApp.openById('16cELFn6q08ITvp8uT-3PKHfsAf-R7wIMNH6t6DgTd5U');
  if(!b||b.getId()!=='16cELFn6q08ITvp8uT-3PKHfsAf-R7wIMNH6t6DgTd5U')throw new Error('โปรดติดตั้งสคริปต์จาก Google Sheet ที่กำหนด');
  return b;
}
function read_(prefix) {
  const b=book_(),sheet=b.getSheetByName(prefix+'_Log');
  if(!sheet||sheet.getLastRow()<2)return Finance.empty();
  return JSON.parse(sheet.getRange(sheet.getLastRow(),3,1,sheet.getLastColumn()-2).getValues()[0].join(''));
}
function getState(token,area) { return read_(scope_(token,area)); }
function mutate(op,token,area) {
  const prefix=scope_(token,area);
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const previous=read_(prefix);const next=Finance.apply(previous,op);
    if(next.revision===previous.revision)return previous;
    const json=JSON.stringify(next);
    if(json.length>2000000)throw new Error('ข้อมูลใกล้เต็ม กรุณาสำรองข้อมูลและติดต่อผู้ดูแลก่อนเพิ่มรายการ');
    const b=book_();let log=b.getSheetByName(prefix+'_Log');
    if(!log){log=b.insertSheet(prefix+'_Log');log.appendRow(['revision','saved_at','snapshot_json']);log.setFrozenRows(1);}
    const chunks=[];for(let i=0;i<json.length;i+=40000)chunks.push(json.slice(i,i+40000));
    const columns=chunks.length+2;
    if(log.getMaxColumns()<columns)log.insertColumnsAfter(log.getMaxColumns(),columns-log.getMaxColumns());
    log.getRange(log.getLastRow()+1,1,1,columns).setValues([[next.revision,new Date().toISOString(),...chunks.map(sheetText_)]]);SpreadsheetApp.flush();
    try{project_(next,b,prefix);}catch(err){console.warn('Projection update failed: '+err.message);}
    return next;
  } finally{lock.releaseLock();}
}
function sheetText_(s) { const t=String(s??'');return /^[=+@-]/.test(t)?"'"+t:t; }
function projection_(b,name,headers,rows) {
  let sheet=b.getSheetByName(name);if(!sheet)sheet=b.insertSheet(name);
  sheet.clearContents();sheet.getRange(1,1,1,headers.length).setValues([headers]);
  if(rows.length)sheet.getRange(2,1,rows.length,headers.length).setValues(rows);
  sheet.setFrozenRows(1);sheet.getRange(1,1,1,headers.length).setBackground('#456ce8').setFontColor('#ffffff').setFontWeight('bold');sheet.autoResizeColumns(1,headers.length);
}
function project_(s,b,prefix) {
 projection_(b,prefix+'_Accounts',['id','ชื่อบัญชี','ยอดเริ่มต้น','ยอดคงเหลือ','สี'],s.accounts.map(a=>[a.id,sheetText_(a.name),a.opening/100,Finance.balance(s,a.id)/100,a.color]));
 projection_(b,prefix+'_Transactions',['id','วันที่','ประเภท','จำนวนบาท','บัญชี','ปลายทาง','รายละเอียด','หมวดหมู่','บันทึกเมื่อ'],s.transactions.map(t=>[t.id,t.date,t.type,t.amount/100,t.account,t.to,sheetText_(t.title),sheetText_(t.category),t.at]));
 projection_(b,prefix+'_Debts',['id','ชื่อหนี้','ยอดต่อเดือน','วันครบกำหนด','เดือนเริ่มต้น'],s.debts.map(d=>[d.id,sheetText_(d.name),d.amount/100,d.day,d.start]));
 projection_(b,prefix+'_Payments',['id','หนี้','เดือนที่ชำระ','บัญชี','จำนวนบาท','วันที่ชำระ'],s.payments.map(p=>[p.id,p.debt,p.month,p.account,p.amount/100,p.date]));
}
function rebuildViews_() { const lock=LockService.getScriptLock();lock.waitLock(30000);try{project_(read_('Amocashs'),book_(),'Amocashs');}finally{lock.releaseLock();} }
