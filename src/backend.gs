function doGet() { return HtmlService.createHtmlOutputFromFile('Index').setTitle('A-mocashs').addMetaTag('viewport','width=device-width, initial-scale=1'); }
// An append-only snapshot log makes each commit one atomic Sheet row write.
// The readable tabs are projections and are rebuilt from the committed snapshot.
function book_() {
  const b=SpreadsheetApp.openById('16cELFn6q08ITvp8uT-3PKHfsAf-R7wIMNH6t6DgTd5U');
  if(!b||b.getId()!=='16cELFn6q08ITvp8uT-3PKHfsAf-R7wIMNH6t6DgTd5U')throw new Error('โปรดติดตั้งสคริปต์จาก Google Sheet ที่กำหนด');
  return b;
}
function read_() {
  const b=book_(),sheet=b.getSheetByName('Amocashs_Log');
  if(!sheet||sheet.getLastRow()<2)return Finance.empty();
  return JSON.parse(sheet.getRange(sheet.getLastRow(),3,1,sheet.getLastColumn()-2).getValues()[0].join(''));
}
function getState() { return read_(); }
function mutate(op) {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const previous=read_();const next=Finance.apply(previous,op);
    if(next.revision===previous.revision)return previous;
    const json=JSON.stringify(next);
    if(json.length>2000000)throw new Error('ข้อมูลใกล้เต็ม กรุณาสำรองข้อมูลและติดต่อผู้ดูแลก่อนเพิ่มรายการ');
    const b=book_();let log=b.getSheetByName('Amocashs_Log');
    if(!log){log=b.insertSheet('Amocashs_Log');log.appendRow(['revision','saved_at','snapshot_json']);log.setFrozenRows(1);}
    const chunks=[];for(let i=0;i<json.length;i+=40000)chunks.push(json.slice(i,i+40000));
    const columns=chunks.length+2;
    if(log.getMaxColumns()<columns)log.insertColumnsAfter(log.getMaxColumns(),columns-log.getMaxColumns());
    log.getRange(log.getLastRow()+1,1,1,columns).setValues([[next.revision,new Date().toISOString(),...chunks.map(sheetText_)]]);SpreadsheetApp.flush();
    try{project_(next,b);}catch(err){console.warn('Projection update failed: '+err.message);}
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
function project_(s,b) {
 projection_(b,'Amocashs_Accounts',['id','ชื่อบัญชี','ยอดเริ่มต้น','ยอดคงเหลือ','สี'],s.accounts.map(a=>[a.id,sheetText_(a.name),a.opening/100,Finance.balance(s,a.id)/100,a.color]));
 projection_(b,'Amocashs_Transactions',['id','วันที่','ประเภท','จำนวนบาท','บัญชี','ปลายทาง','รายละเอียด','หมวดหมู่','บันทึกเมื่อ'],s.transactions.map(t=>[t.id,t.date,t.type,t.amount/100,t.account,t.to,sheetText_(t.title),sheetText_(t.category),t.at]));
 projection_(b,'Amocashs_Debts',['id','ชื่อหนี้','ยอดต่อเดือน','วันครบกำหนด','เดือนเริ่มต้น'],s.debts.map(d=>[d.id,sheetText_(d.name),d.amount/100,d.day,d.start]));
 projection_(b,'Amocashs_Payments',['id','หนี้','เดือนที่ชำระ','บัญชี','จำนวนบาท','วันที่ชำระ'],s.payments.map(p=>[p.id,p.debt,p.month,p.account,p.amount/100,p.date]));
}
function rebuildViews() { const lock=LockService.getScriptLock();lock.waitLock(30000);try{project_(read_(),book_());}finally{lock.releaseLock();} }
