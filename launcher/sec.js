const p=JSON.parse(require('fs').readFileSync(process.argv[2]));const sec={};for(const [t] of p.f){const k=Math.floor(t/1000);sec[k]=(sec[k]||0)+1;}
const v=Object.values(sec).slice(0,-1);console.log(process.argv[2],'fps/sec:',v.join(' '));console.log(' seconds below 60 fps:',v.filter(x=>x<60).length,'of',v.length);
