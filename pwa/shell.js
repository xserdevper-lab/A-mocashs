'use strict';
const CLOUD_URL='https://script.google.com/macros/s/AKfycby2CeqjaCPRyYlSOylsuGtQX8dSGTtYk7XLF72Vmwd3LbQT7TLo1bIMEpyo_t3yCl7L/exec';
const $=id=>document.getElementById(id);let installPrompt=null,frameReady=false,loadingTimer;
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function notify(text){$('notification').textContent=text;$('notification').style.display='block';clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('notification').style.display='none',4500);}
for(const id of ['sign-in','direct-app'])$(id).href=CLOUD_URL;
function showWelcome(message){frameReady=false;$('cloud').hidden=true;$('welcome').hidden=false;$('welcome-text').textContent=message;$('connection').textContent=navigator.onLine?'รอลงชื่อเข้าใช้ Google':'ออฟไลน์';}
function loadCloud(){clearTimeout(loadingTimer);if(!navigator.onLine){showWelcome('ไม่มีอินเทอร์เน็ต เชื่อมต่อเพื่ออ่านและบันทึก Google Sheet');return;}showWelcome('กำลังเปิดบัญชี Google Sheet ของคุณ…');$('cloud').src=CLOUD_URL+'?pwa=1';loadingTimer=setTimeout(()=>{if(!frameReady)showWelcome('หากแอปยังไม่เปิด ให้ลงชื่อเข้าใช้ Google แล้วกดโหลดบัญชีอีกครั้ง');},15000);}
function googleOrigin(origin){return /^https:\/\/([a-z0-9-]+-)?script\.googleusercontent\.com$/.test(origin);}
window.addEventListener('message',event=>{
 if(!googleOrigin(event.origin)||!event.source||event.data?.kind!=='amocashs-ready'||typeof event.data.nonce!=='string'||event.data.nonce.length>100)return;
 event.source.postMessage({kind:'amocashs-authorized-parent',nonce:event.data.nonce},event.origin);
 frameReady=true;clearTimeout(loadingTimer);$('cloud').hidden=false;$('welcome').hidden=true;$('connection').textContent='Google Sheet ส่วนตัว';
});
window.addEventListener('offline',()=>showWelcome('ไม่มีอินเทอร์เน็ต ข้อมูลเงินจริงยังอยู่ใน Google Sheet'));
window.addEventListener('online',loadCloud);
$('retry').onclick=loadCloud;
$('help').onclick=()=>$('install-help').showModal();$('close-help').onclick=()=>$('install-help').close();
function openCalculator(){if($('install-help').open)$('install-help').close();$('calculator').showModal();}
$('offline-calc').onclick=openCalculator;$('calculator-link').onclick=openCalculator;$('close-calculator').onclick=()=>$('calculator').close();
document.querySelectorAll('[data-key]').forEach(button=>button.onclick=()=>{const key=button.dataset.key,input=$('expression');try{if(key==='C'){input.value='';$('answer').textContent='0.00';}else if(key==='⌫')input.value=input.value.slice(0,-1);else if(key==='=')$('answer').textContent=Finance.calculate(input.value).toFixed(2);else input.value+=key;}catch(e){notify(e.message);}});
$('expression').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();try{$('answer').textContent=Finance.calculate(e.target.value).toFixed(2);}catch(err){notify(err.message);}}};
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('install').hidden=installed();$('install').textContent='ติดตั้งแอป';});
window.addEventListener('appinstalled',()=>{installPrompt=null;$('install').hidden=true;notify('ติดตั้ง A-mocashs แล้ว');});
$('install').hidden=installed();$('install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}else $('install-help').showModal();};
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{const waiting=()=>{if(reg.waiting)$('update-banner').hidden=false;};waiting();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',waiting);});$('update').onclick=()=>reg.waiting?.postMessage({kind:'activate-update'});}).catch(()=>notify('เปิดแอปได้ แต่การใช้งานออฟไลน์ยังไม่พร้อม'));
 let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload();});}
loadCloud();
