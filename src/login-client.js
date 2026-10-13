(function(){
 'use strict';
 const key='amocashs-login-request';
 const redirect='https://xserdevper-lab.github.io/A-mocashs/';
 let result=null;
 const fragment=new URLSearchParams(location.hash.slice(1));
 if(fragment.has('access_token')||fragment.has('error')){
  // Remove credentials from the address and browser history before rendering.
  history.replaceState(null,'',location.pathname+location.search);
  let request;try{request=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
  sessionStorage.removeItem(key);
  if(!request||fragment.get('state')!==request.state||Date.now()-request.createdAt>300000){result={error:'คำขอเข้าสู่ระบบหมดอายุ กรุณาลองอีกครั้ง'};}
  else if(fragment.has('error'))result={error:'เข้าสู่ระบบไม่สำเร็จ'};
  else if(fragment.get('token_type')?.toLowerCase()!=='bearer')result={error:'ไม่สามารถยืนยันบัญชี Google ได้'};
  else result={token:fragment.get('access_token'),challenge:request.challenge};
 }
 window.LoginFlow={
  consume(){const value=result;result=null;return value;},
  start(config){
   const state=crypto.randomUUID()+crypto.randomUUID();
   sessionStorage.setItem(key,JSON.stringify({state,challenge:config.challenge,createdAt:Date.now()}));
   const query=new URLSearchParams({client_id:config.clientId,redirect_uri:redirect,response_type:'token',scope:'openid email profile',state,prompt:'select_account'});
   location.assign('https://accounts.google.com/o/oauth2/v2/auth?'+query);
  }
 };
})();
