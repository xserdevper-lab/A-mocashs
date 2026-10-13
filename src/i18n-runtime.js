(function(root){
 'use strict';
 const locales={th:'th-TH',en:'en-GB',ko:'ko-KR',ja:'ja-JP'};
 let language='th';try{const saved=localStorage.getItem('amocashs-language');if(locales[saved])language=saved;}catch{}
 const dictionary=AMOCASHS_TRANSLATIONS;
 const keys=Object.keys(dictionary).sort((a,b)=>b.length-a.length);
 const pattern=new RegExp(keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 const originals=new WeakMap(),attributes=new WeakMap();
 function text(value){const s=String(value??'');if(language==='th')return s;return s.replace(pattern,key=>dictionary[key]?.[language]||key);}
 function html(strings,...values){return strings.reduce((result,segment,i)=>result+text(segment)+(i<values.length?values[i]:''),'');}
 function applyStatic(){
  document.documentElement.lang=language;document.title=text('A-mocashs • เงินของคุณ ในมุมที่ชัดเจน');
  document.querySelectorAll('.sidebar,header,footer,#install-help,#update-banner').forEach(container=>{
   const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode())){if(node.parentElement?.closest('#status,#crumb'))continue;if(!originals.has(node))originals.set(node,node.textContent);node.textContent=text(originals.get(node));}
   container.querySelectorAll('[aria-label],[placeholder]').forEach(el=>{if(!attributes.has(el))attributes.set(el,{label:el.getAttribute('aria-label'),placeholder:el.getAttribute('placeholder')});const original=attributes.get(el);if(original.label)el.setAttribute('aria-label',text(original.label));if(original.placeholder)el.setAttribute('placeholder',text(original.placeholder));});
  });
 }
 const api={text,html,applyStatic,get language(){return language;},get locale(){return locales[language];},set(value){if(!locales[value])throw new Error('Unsupported language');language=value;try{localStorage.setItem('amocashs-language',value);}catch{}return language;}};
 root.I18n=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
