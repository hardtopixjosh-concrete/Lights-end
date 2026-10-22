export function drawLootBeam(ctx,d,color,skyHeight=550){
  const height=Math.max(500,skyHeight),pulse=.8+Math.sin(d.clock*3)*.12;
  ctx.save();ctx.translate(d.x,d.y);ctx.globalCompositeOperation='screen';ctx.shadowColor=color;ctx.shadowBlur=18;
  const glow=ctx.createLinearGradient(0,0,0,-height);glow.addColorStop(0,color);glow.addColorStop(.7,color+'75');glow.addColorStop(1,color+'00');
  ctx.globalAlpha=.32*pulse;ctx.fillStyle=glow;ctx.fillRect(-11,-height,22,height);
  ctx.globalAlpha=.9*pulse;ctx.fillRect(-2,-height,4,height);
  ctx.globalAlpha=.85;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,23,13,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<7;i++){const rise=(d.clock*90+i*67)%height;ctx.globalAlpha=(1-rise/height)*.85;ctx.fillStyle=color;ctx.fillRect(Math.sin(i*4+d.clock)*6,-rise,3,5);}
  ctx.restore();
}
