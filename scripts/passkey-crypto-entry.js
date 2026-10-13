import {p256} from '@noble/curves/nist.js';
import {decodeCBOR,decodePartialCBOR,encodeCBOR} from '@levischuck/tiny-cbor';
export const verify=(signature,message,key)=>p256.verify(signature,message,key,{format:'der',prehash:true,lowS:false});
export const validKey=key=>{p256.Point.fromBytes(key).assertValidity();return true;};
export const decode=decodeCBOR;
export const decodePartial=bytes=>decodePartialCBOR(bytes,0);

export const encode=encodeCBOR;
