// Apps Script supplies UTF-8 conversion through Utilities rather than Web Text APIs.
export class TextDecoder {decode(bytes){return Utilities.newBlob(Array.from(bytes,b=>b>127?b-256:b)).getDataAsString('UTF-8');}}
export class TextEncoder {encode(text){return new Uint8Array(Utilities.newBlob(String(text)).getBytes().map(b=>(b+256)%256));}}
