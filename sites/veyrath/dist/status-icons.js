// Enemy status icons (Oct 15 user request): a small badge above the head for every active effect, side by
// side when several apply, each with a ring showing the time left. Pure rendering; reads enemy status fields.
const TAU=Math.PI*2;
/* Oct 18: Warrior weapon DoTs (Twin Blades / Greataxe bleed stacks, Elemental Katana burn and poison) live in e.wDots. */
const wd=(e,k)=>{let m=0;for(const d of Object.values(e.wDots??{}))if(d.kind===k&&d.remaining>m)m=d.remaining;return m;};
const STATUSES=[
 {id:'burn',ring:'#ff8a2a',left:e=>Math.max(e.burn?.remaining??0,e.rBurn?.remaining??0,wd(e,'burn')),max:3,draw:(g,s)=>{g.fillStyle='#ffb347';g.beginPath();g.moveTo(0,-6*s);g.quadraticCurveTo(5*s,-1*s,3.5*s,3*s);g.quadraticCurveTo(0,6*s,-3.5*s,3*s);g.quadraticCurveTo(-5*s,-1*s,0,-6*s);g.fill();g.fillStyle='#fff1b0';g.beginPath();g.ellipse(0,2*s,1.6*s,2.4*s,0,0,TAU);g.fill();}},
 /* Oct 18 fix (user): Ranger Fire/Poison arrows set e.rBurn / e.rPoison, so burn also reads rBurn and poison gets its own badge (stack count shown). */
 {id:'poison',ring:'#8ee04a',left:e=>Math.max(e.rPoison?.remaining??0,wd(e,'poison')),max:4,draw:(g,s,e)=>{g.fillStyle='#9be15d';g.beginPath();g.arc(0,1*s,4.2*s,0,TAU);g.fill();g.fillStyle='#d9ffb0';g.beginPath();g.arc(-1.4*s,-.2*s,1.2*s,0,TAU);g.arc(1.8*s,2*s,.9*s,0,TAU);g.fill();g.fillStyle='#9be15d';g.fillRect(-1.2*s,-5.6*s,2.4*s,3*s);const n=e?.rPoison?.stacks??0;if(n>1){g.fillStyle='#ffffff';g.font='bold '+Math.round(7*s)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),5.5*s,5.5*s);}}},
 {id:'freeze',ring:'#7fd3f2',left:e=>e.freeze,max:1.2,draw:(g,s)=>{g.fillStyle='#b4dcea';g.strokeStyle='#e8f8ff';g.lineWidth=1;g.beginPath();g.moveTo(0,-6*s);g.lineTo(5*s,0);g.lineTo(0,6*s);g.lineTo(-5*s,0);g.closePath();g.fill();g.stroke();}},
 {id:'chill',ring:'#9fdcf0',left:e=>e.freeze>0?0:Math.max(e.mageChill??0,e.slow??0),max:2,draw:(g,s)=>{g.strokeStyle='#d8f2fb';g.lineWidth=1.4*s;g.lineCap='round';for(let i=0;i<3;i++){const a=i/3*Math.PI;g.beginPath();g.moveTo(Math.cos(a)*5.5*s,Math.sin(a)*5.5*s);g.lineTo(-Math.cos(a)*5.5*s,-Math.sin(a)*5.5*s);g.stroke();}}},
 {id:'shock',ring:'#b49cff',left:e=>e.shock,max:3,draw:(g,s)=>{g.fillStyle='#f6e27a';g.beginPath();g.moveTo(1.5*s,-6*s);g.lineTo(-3.5*s,1*s);g.lineTo(0,1*s);g.lineTo(-1.5*s,6*s);g.lineTo(3.5*s,-1*s);g.lineTo(0,-1*s);g.closePath();g.fill();}},
 {id:'bleed',ring:'#e2475f',left:e=>Math.max(e.warriorBleed?.remaining??0,e.bloodBleed?.remaining??0,e.rBleed?.remaining??0,wd(e,'bleed')),max:4,draw:(g,s)=>{g.fillStyle='#e2475f';g.beginPath();g.moveTo(0,-6*s);g.quadraticCurveTo(5*s,1*s,0,5.5*s);g.quadraticCurveTo(-5*s,1*s,0,-6*s);g.fill();g.fillStyle='#ffd6dc';g.beginPath();g.arc(-1.4*s,1*s,1.1*s,0,TAU);g.fill();}},
 {id:'soaked',ring:'#8e1030',left:e=>e.bloodSoaked,max:4,draw:(g,s)=>{g.fillStyle='#8e1030';for(const [x,y] of [[-2.5,-1],[2.5,1.5]]){g.beginPath();g.moveTo(x*s,(y-4)*s);g.quadraticCurveTo((x+3)*s,(y+1)*s,x*s,(y+3.5)*s);g.quadraticCurveTo((x-3)*s,(y+1)*s,x*s,(y-4)*s);g.fill();}}},
 {id:'weaken',ring:'#b48cff',left:e=>e.warriorWeaken,max:5,draw:(g,s)=>{g.strokeStyle='#cfb4ff';g.lineWidth=1.8*s;g.lineCap='round';g.lineJoin='round';for(const y of [-3,1.5]){g.beginPath();g.moveTo(-4*s,y*s);g.lineTo(0,(y+3.5)*s);g.lineTo(4*s,y*s);g.stroke();}}},
 {id:'held',ring:'#9d8fc0',left:e=>e.vortexHeld,max:.2,draw:(g,s)=>{g.strokeStyle='#cfc4ea';g.lineWidth=1.5*s;g.beginPath();for(let i=0;i<=24;i++){const a=i/24*TAU*1.6,r=(1+i/24*4.5)*s;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(r,0);}g.stroke();}}
];
export function enemyStatuses(e){return STATUSES.filter(st=>(st.left(e)??0)>0);}
export function drawStatusIcons(ctx,e,time){
 const list=enemyStatuses(e);if(!list.length)return;
 const s=1.15,size=17,gap=3,head=e.y-(e.skin?.startsWith('demon-')?78:76)*(e.scale??1.25),y=head-(e.role==='leader'||e.role==='boss'?40:22),w=list.length*size+(list.length-1)*gap;
 list.forEach((st,i)=>{const x=e.x-w/2+size/2+i*(size+gap),left=Math.min(1,(st.left(e)??0)/st.max);
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.92;ctx.fillStyle='#120c0ccc';ctx.beginPath();ctx.arc(0,0,size/2,0,TAU);ctx.fill();
  ctx.strokeStyle='#ffffff22';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,size/2-.5,0,TAU);ctx.stroke();
  ctx.strokeStyle=st.ring;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,size/2-.5,-Math.PI/2,-Math.PI/2+TAU*left);ctx.stroke();
  ctx.globalAlpha=1;st.draw(ctx,s*.95,e);ctx.restore();});
}
