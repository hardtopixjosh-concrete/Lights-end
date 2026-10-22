const fs=require('fs');
for(const lab of (process.env.LABS||'live,local').split(',')){const p=JSON.parse(fs.readFileSync(process.env.D+'/'+lab+'.json'));
 const f=p.f.slice(1),d=f.map(x=>x[1]).sort((a,b)=>a-b),q=k=>d[Math.floor(d.length*k)];
 console.log(`\n== ${lab} ${p.title} screen=${p.screen} size=${p.size} quality=${p.quality} frames=${f.length} fps=${(f.length/(f.at(-1)[0]/1000)).toFixed(1)}`);
 console.log(` frame ms p50=${q(.5)} p90=${q(.9)} p99=${q(.99)} max=${d.at(-1)}  >25ms: ${f.filter(x=>x[1]>25).length}  >50ms: ${f.filter(x=>x[1]>50).length}`);
 // per-second fps timeline
 const sec=new Array(76).fill(0);for(const [t] of f)sec[Math.min(75,Math.floor(t/1000))]++;console.log(' fps/sec:',sec.join(' '));
 const heap=p.mem.map(m=>m[1]);console.log(' heap MB:',heap.filter((_,i)=>i%3==0).join(' '));
 console.log(' LoAF count',p.loaf.length,p.loafErr||'');
 const agg={};for(const l of p.loaf)for(const s of l.scripts){const k=s.src+' '+(s.fn||'')+' '+s.inv;agg[k]=(agg[k]||0)+s.d;}
 console.log(' top script time in long frames:');Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>console.log('   ',v,'ms',k));
 const tot=p.loaf.reduce((a,l)=>({d:a.d+l.d,r:a.r+l.render,s:a.s+l.style,sc:a.sc+l.scripts.reduce((x,y)=>x+y.d,0)}),{d:0,r:0,s:0,sc:0});console.log(' long-frame totals ms: all',tot.d,'render',tot.r,'style/layout',tot.s,'scripts',tot.sc);
 console.log(' resources during window:',p.res.length,'kb',p.res.reduce((a,r)=>a+r.kb,0),p.res.slice(0,8).map(r=>r.t+':'+r.n+'('+r.kb+'k)').join(' '));
}
