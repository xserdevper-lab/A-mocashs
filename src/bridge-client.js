(function(){
 'use strict';
 const url='https://script.google.com/macros/s/AKfycbzgekZnYJDaZhRx-CoMgmA_FJOAJTU_u3pstsJFOh1ljXxgaVUGw-2cfrtJjAqon_SQ/exec';
 let clientId=crypto.randomUUID();
 let remote=null,nonce=null,origin=null,waiting=[],pending=new Map(),timer;
 const frame=document.createElement('iframe');frame.id='sheet-api-transport';frame.title='ช่องทางเชื่อมข้อมูล Google Sheet';frame.hidden=true;frame.setAttribute('aria-hidden','true');document.body.append(frame);
 const change=status=>window.dispatchEvent(new CustomEvent('sheet-connection',{detail:status}));
 function reset(){clientId=crypto.randomUUID();for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('การเชื่อมต่อถูกรีเฟรช กรุณาลองอีกครั้ง'));}pending.clear();remote=null;nonce=null;origin=null;clearTimeout(timer);change('loading');frame.src=url+'?bridge=1&v=5&client='+encodeURIComponent(clientId);timer=setTimeout(()=>{change('error');waiting.splice(0).forEach(p=>p.reject(new Error('กรุณาลงชื่อเข้าใช้ Google แล้วกดเชื่อมต่ออีกครั้ง')));},20000);}
 function send(method,args,resolve,reject){const id=crypto.randomUUID();const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('Google Sheet ไม่ตอบสนอง กรุณารีเฟรชเพื่อตรวจรายการก่อนบันทึกซ้ำ'));},45000);pending.set(id,{resolve,reject,timer:timeout});remote.postMessage({kind:'amocashs-rpc',nonce,id,method,args},origin);}
 window.addEventListener('message',event=>{
  if(!/^https:\/\/([a-z0-9-]+-)?script\.googleusercontent\.com$/.test(event.origin)||!event.source)return;
  const d=event.data;
  if(d?.kind==='amocashs-bridge-ready'&&typeof d.nonce==='string'&&d.nonce.length<=100){
   if(d.client!==clientId||remote)return;
   remote=event.source;origin=event.origin;nonce=d.nonce;clearTimeout(timer);change('ready');waiting.splice(0).forEach(p=>send(p.method,p.args,p.resolve,p.reject));return;
  }
  if(event.source!==remote||event.origin!==origin||d?.nonce!==nonce||d?.kind!=='amocashs-rpc-result')return;
  const p=pending.get(d.id);if(!p)return;clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(new Error(d.error)):p.resolve(d.data);
 });
 window.SheetAPI={url,connect:reset,call:(method,...args)=>new Promise((resolve,reject)=>{if(!navigator.onLine){reject(new Error('ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อบันทึก Google Sheet'));return;}if(remote)send(method,args,resolve,reject);else waiting.push({method,args,resolve,reject});})};
 window.addEventListener('online',reset);window.addEventListener('offline',()=>change('offline'));reset();
})();
