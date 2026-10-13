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
  return createSession_({id:digest_(profile.sub).slice(0,24),email,name:String(profile.name||email)});
 }finally{lock.releaseLock();}
}
function createSession_(identity,passkeyKey){
 const members=JSON.parse(PropertiesService.getScriptProperties().getProperty('MEMBER_EMAILS')||'[]');
 if(!members.includes(identity.email))throw new Error('บัญชีนี้ไม่มีสิทธิ์เข้าใช้แอป');
 const token=Utilities.getUuid()+Utilities.getUuid();
 const user={id:identity.id,email:identity.email,name:identity.name,owner:identity.email===members[0],expires:Date.now()+21600000};
 if(passkeyKey)user.passkeyKey=passkeyKey;
 CacheService.getScriptCache().put('session:'+digest_(token),JSON.stringify(user),21600);
 return {token,user};
}
function session_(token){
 if(typeof token!=='string'||token.length!==72)throw new Error('กรุณาเข้าสู่ระบบ');
 const raw=CacheService.getScriptCache().get('session:'+digest_(token));
 if(!raw)throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
 const user=JSON.parse(raw),members=JSON.parse(PropertiesService.getScriptProperties().getProperty('MEMBER_EMAILS')||'[]');
 if(user.expires<=Date.now()||!members.includes(user.email)||(user.passkeyKey&&!PropertiesService.getScriptProperties().getProperty(user.passkeyKey)))throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
 return user;
}
function sessionInfo(token){return session_(token);}
function logout(token){if(typeof token==='string')CacheService.getScriptCache().remove('session:'+digest_(token));return true;}
function scope_(token,area){const user=session_(token);if(area==='shared')return 'Amocashs';if(area==='private')return 'Private_'+user.id;throw new Error('ไม่มีสิทธิ์เข้าถึงพื้นที่นี้');}
