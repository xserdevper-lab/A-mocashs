(function(){
 'use strict';
 const bytes=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const encode=value=>btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 function options(request){const value=structuredClone(request.publicKey);value.challenge=bytes(value.challenge);if(value.user)value.user.id=bytes(value.user.id);if(value.excludeCredentials)value.excludeCredentials=value.excludeCredentials.map(item=>({...item,id:bytes(item.id)}));return value;}
 function error(e){if(e.name==='NotAllowedError'||e.name==='AbortError')return new Error('ยกเลิกการยืนยันหรือไม่พบ Passkey ในเครื่องนี้');if(e.name==='InvalidStateError')return new Error('เครื่องนี้มี Passkey ของบัญชีนี้แล้ว');return new Error('เครื่องนี้ยังไม่รองรับ Passkey กรุณาใช้ Google');}
 const serialize=credential=>({id:credential.id,rawId:encode(credential.rawId),type:credential.type,response:credential.response.attestationObject?{clientDataJSON:encode(credential.response.clientDataJSON),attestationObject:encode(credential.response.attestationObject),transports:credential.response.getTransports?.()||['internal']}:{clientDataJSON:encode(credential.response.clientDataJSON),authenticatorData:encode(credential.response.authenticatorData),signature:encode(credential.response.signature),userHandle:credential.response.userHandle?encode(credential.response.userHandle):null}});
 window.Passkeys={
  async available(){try{return !!(window.isSecureContext&&window.PublicKeyCredential&&navigator.credentials&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());}catch{return false;}},
  async register(request){try{const credential=await navigator.credentials.create({publicKey:options(request)});if(!credential)throw new Error('Cancelled');return serialize(credential);}catch(e){throw error(e);}},
  async unlock(request){try{const credential=await navigator.credentials.get({publicKey:options(request)});if(!credential)throw new Error('Cancelled');return serialize(credential);}catch(e){throw error(e);}}
 };
})();
