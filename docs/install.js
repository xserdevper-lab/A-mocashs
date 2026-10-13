(function(){
 let prompt=null;
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function help(){document.getElementById('install-help').showModal();}
 document.getElementById('install').hidden=installed();
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;});
 window.addEventListener('appinstalled',()=>{prompt=null;document.getElementById('install').hidden=true;});
 document.getElementById('install').onclick=async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;prompt=null;}else help();};
 document.getElementById('close-install-help').onclick=()=>document.getElementById('install-help').close();
 if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(reg=>{const show=()=>{if(reg.waiting)document.getElementById('update-banner').hidden=false;};show();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',show));document.getElementById('update').onclick=()=>reg.waiting?.postMessage({kind:'activate-update'});}).catch(()=>{});let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload();});}
})();
