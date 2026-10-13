(function(){
 'use strict';
 const origin='https://xserdevper-lab.github.io';
 function ready(){window.top.postMessage({kind:'amocashs-bridge-ready',nonce:BRIDGE_NONCE,client:BRIDGE_CLIENT_ID},origin);}
 window.addEventListener('message',event=>{
  const d=event.data;
  if(event.origin!==origin||event.source!==window.top||d?.kind!=='amocashs-rpc'||d.nonce!==BRIDGE_NONCE||typeof d.id!=='string'||!['getState','mutate'].includes(d.method))return;
  const send=payload=>event.source.postMessage({kind:'amocashs-rpc-result',nonce:BRIDGE_NONCE,id:d.id,...payload},origin);
  const runner=google.script.run.withSuccessHandler(data=>send({data})).withFailureHandler(error=>send({error:error.message||'Google Sheet ไม่ตอบสนอง'}));
  if(d.method==='getState')runner.getState();else runner.mutate(d.args?.[0]);
 });
 window.addEventListener('DOMContentLoaded',()=>{ready();const interval=setInterval(ready,1000);setTimeout(()=>clearInterval(interval),30000);});
})();
