import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});fs.mkdirSync('google-apps-script',{recursive:true});
for(const name of ['index.html','styles.css','core.js','app.js'])fs.copyFileSync('src/'+name,'dist/'+name);
let html=fs.readFileSync('src/index.html','utf8').replace('<link rel="stylesheet" href="styles.css">',()=>'<style>'+fs.readFileSync('src/styles.css','utf8')+'</style>');
html=html.replace('<script src="core.js"></script>',()=>'<script>'+fs.readFileSync('src/core.js','utf8')+'</script>').replace('<script src="app.js"></script>',()=>'<script>'+fs.readFileSync('src/app.js','utf8')+'</script>');
fs.writeFileSync('google-apps-script/Index.html',html);
fs.writeFileSync('google-apps-script/Code.gs',fs.readFileSync('src/core.js','utf8')+'\n'+fs.readFileSync('src/backend.gs','utf8'));
console.log('Built dist/ and Google Apps Script files.');
