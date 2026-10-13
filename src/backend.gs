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
