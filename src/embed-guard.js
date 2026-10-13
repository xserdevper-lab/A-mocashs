// PWA_NONCE is generated separately for each Google response.
(function(){
 'use strict';
 const allowedParent='https://xserdevper-lab.github.io';
 document.documentElement.classList.add('pwa-locked');
 let unlocked=false,timer;
 function ready(){if(!unlocked)window.top.postMessage({kind:'amocashs-ready',nonce:PWA_NONCE},allowedParent);}
 window.addEventListener('message',event=>{
   if(event.origin!==allowedParent||event.source!==window.top||event.data?.kind!=='amocashs-authorized-parent'||event.data.nonce!==PWA_NONCE)return;
   unlocked=true;clearInterval(timer);document.documentElement.classList.remove('pwa-locked');
 });
 window.addEventListener('DOMContentLoaded',()=>{ready();timer=setInterval(ready,1000);setTimeout(()=>clearInterval(timer),30000);});
})();
