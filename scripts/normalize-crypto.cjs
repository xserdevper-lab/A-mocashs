// Apps Script's source validator rejects BigInt literal syntax. Its V8 runtime
// supports the equivalent BigInt constructor, so adapt literals after bundling.
const fs=require('node:fs'),acorn=require(process.env.AMOCASHS_ACORN_PATH||'acorn');
const path='vendor/passkey-crypto.gs';let source=fs.readFileSync(path,'utf8');const edits=[];
function visit(node){if(!node||typeof node!=='object')return;if(node.type==='Literal'&&typeof node.bigint==='string')edits.push({start:node.start,end:node.end,text:'BigInt('+JSON.stringify(String(node.value))+')'});for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
visit(acorn.parse(source,{ecmaVersion:2020}));for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
fs.writeFileSync(path,source);
