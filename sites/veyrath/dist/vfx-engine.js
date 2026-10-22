// VEYRATH shader VFX engine (Oct 15). A small WebGL2 instanced-quad renderer for stylised "3D-looking"
// spell effects (toon-lit orbs, noise-scrolled flames, dissolving explosion clouds, eroded shock rings,
// scorch decals, smoke, sparks, glows). Effects are queued per pass ('ground' | 'upper') in WORLD
// coordinates during the normal 2D draw, then flush(ctx, pass) renders the queue into a private WebGL
// canvas using the ctx's current camera transform and composites it into the 2D canvas at exactly that
// point in the draw order, so depth layering matches the Canvas FX it replaces. Output is premultiplied;
// `add` makes a primitive glow (additive-like) instead of covering. No WebGL2 -> vfx.ok is false and
// callers keep their Canvas visuals. Visual only; never touches simulation state.
export const MAT={orb:0,flame:1,ring:2,burst:3,smoke:4,decal:5,tail:6,glow:7,spark:8,crystal:9,frost:10,swirl:11,bolt:12,liquid:13,stream:14,beam:15,slash:16};
const F=25,MAX=4096,KEY='veyrath.vfx.shader';

const VS=`#version 300 es
layout(location=0) in vec2 corner;
layout(location=1) in vec4 iA;layout(location=2) in vec4 iB;layout(location=3) in vec4 iC;layout(location=4) in vec4 iP;
layout(location=5) in vec3 iC0;layout(location=6) in vec3 iC1;layout(location=7) in vec3 iC2;
uniform vec2 uRes;uniform mat3 uM;
out vec2 vUv;flat out vec4 vB;flat out vec4 vC;flat out vec4 vP;flat out vec3 c0;flat out vec3 c1;flat out vec3 c2;
void main(){float c=cos(iB.x),s=sin(iB.x);vec2 l=corner*iA.zw*.5;vec2 w=iA.xy+vec2(l.x*c-l.y*s,l.x*s+l.y*c);
 vec3 p=uM*vec3(w,1.);vec2 q=p.xy/uRes*2.-1.;gl_Position=vec4(q.x,-q.y,0.,1.);
 vUv=corner;vB=iB;vC=iC;vP=iP;c0=iC0;c1=iC1;c2=iC2;}`;

const FS=`#version 300 es
precision highp float;
in vec2 vUv;flat in vec4 vB;flat in vec4 vC;flat in vec4 vP;flat in vec3 c0;flat in vec3 c1;flat in vec3 c2;
out vec4 o;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*vn(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
vec3 ramp(float v){v=clamp(v,0.,1.);return v<.5?mix(c0,c1,v*2.):mix(c1,c2,v*2.-1.);}
float band(float v,float n){return n<1.?v:floor(clamp(v,0.,1.)*n+.5)/n;}
void main(){
 vec2 uv=vUv;int m=int(vB.y+.5);float t=vB.z,tm=vB.w,sd=vC.x*17.13;vec4 P=vP;vec3 col=vec3(0);float a=0.;
 if(m==0){ // ORB: toon-lit sphere, scrolling surface noise, fresnel rim, outer halo. P: radius, crust, bands, scroll
  float d=length(uv),R=P.x,r=d/R;float halo=pow(clamp(1.-(d-R)/(1.-R),0.,1.),2.2)*.55;col=c1;a=halo*step(R,d);
  if(r<1.){vec3 n=vec3(uv/R,sqrt(1.-r*r));vec3 L=normalize(vec3(-.45,-.6,.66));float df=max(dot(n,L),0.),rim=pow(1.-n.z,2.);
   float nz=fbm(n.xy*2.6+vec2(sd,-tm*P.w));vec3 c;
   if(P.y>.5){float ck=1.-smoothstep(0.,.07,abs(fbm(n.xy*3.2+sd+tm*.15)-.5));vec3 rock=c0*mix(.35,1.,band(df,3.));c=mix(rock,ramp(.75+.25*nz),ck)+c1*rim*.9;}
   else{float heat=.35+.55*df+.4*(nz-.5)+.25*(1.-r);c=ramp(band(heat,P.z))+c2*rim*.35;}
   float e=smoothstep(1.,.93,r);col=mix(col,c,e);a=max(a,e);}
 }else if(m==1){ // FLAME tongue, base at bottom. P: scroll, wobble, bands, softness
  float v=(1.-uv.y)*.5;float n=fbm(vec2(uv.x*1.7+sd,v*2.4-tm*P.x));float x=uv.x+(n-.5)*P.y*v;
  float w=mix(.9,.04,pow(v,.75));float k=1.-abs(x)/w;float inten=k*smoothstep(0.,.14,v)-v*.3+(n-.5)*.55-t*t*.9;
  a=smoothstep(0.,.06+P.w,inten);col=ramp(band(clamp(inten*1.7+.1,0.,1.),P.z));
 }else if(m==2){ // RING shockwave. P: radius, thickness, bands, noise
  float d=length(uv);float ang=atan(uv.y,uv.x);float n=fbm(vec2(cos(ang),sin(ang))*1.6+vec2(sd,d*5.-tm*2.));float k=1.-abs(d-P.x)/P.y;
  float inten=k+(n-.5)*P.w-t*.85;a=smoothstep(0.,.1,inten);col=ramp(band(clamp(inten*1.4,0.,1.),P.z));
 }else if(m==3){ // BURST: billowing explosion cloud that cools and dissolves. P: grow, heat, bands, roughness
  float g=mix(P.x,1.,1.-pow(1.-t,3.));vec2 q=uv/g;float d=length(q);float n=fbm(q*2.2+vec2(sd,tm*.7)),n2=fbm(q*4.5-vec2(tm*.4,sd));
  float dens=1.-d+(n-.5)*P.w+(n2-.5)*.25-t*t*.95;a=smoothstep(0.,.07,dens);
  float heat=clamp((1.-d*1.1)*1.5*pow(1.-t,P.y)+(n-.5)*.4,0.,1.);float sh=band(clamp(dens*1.6-q.y*.35,0.,1.),3.);
  col=mix(c0*(.45+.75*sh),ramp(band(heat,P.z)),smoothstep(.12,.45,heat));
 }else if(m==4){ // SMOKE puff, toon-lit from above. P: unused, fire tint from below, bands, roughness
  float d=length(uv);float n=fbm(uv*2.+vec2(sd,tm*.5));float dens=1.-d+(n-.5)*P.w-t*.9;a=smoothstep(0.,.08,dens)*.92;
  float sh=band(clamp(.55-uv.y*.55+(n-.5)*.4,0.,1.),P.z);col=mix(c0,c1,sh)+c2*P.y*clamp(uv.y,0.,1.)*(1.-t);
 }else if(m==5){ // DECAL scorch / ground burn. P: crack scale, ember amount, hot centre, char opacity
  float d=length(uv);float n=fbm(uv*3.+sd);float ch=smoothstep(1.,.45,d+(n-.5)*.55);
  float rd=1.-abs(fbm(uv*P.x+sd*1.7)*2.-1.);float fl=.75+.25*sin(tm*9.+n*12.);float em=smoothstep(.8,.96,rd)*ch*P.y*(1.-t)*fl;
  float hot=pow(clamp(1.-d*1.4,0.,1.),2.)*P.z*(1.-t);col=mix(c0,ramp(.55+.45*em),clamp(em+hot,0.,1.));a=max(ch*P.w*(1.-t*.5),clamp(em+hot,0.,1.));
 }else if(m==6){ // TAIL streaming behind a projectile, head at +x. P: scroll, wobble, bands, taper
  float v=(1.-uv.x)*.5;float n=fbm(vec2(v*3.2+tm*P.x+sd,uv.y*1.4));float w=mix(1.,.06,pow(v,P.w));
  float k=1.-abs(uv.y+(n-.5)*P.y*v)/w;float inten=k-v*.75+(n-.5)*.5;a=smoothstep(0.,.07,inten);col=ramp(band(clamp(inten*1.6,0.,1.),P.z));
 }else if(m==7){ // GLOW. P: falloff power
  float d=length(uv);float g=pow(max(0.,1.-d),P.x>0.?P.x:2.);a=g;col=ramp(g);
 }else if(m==8){ // SPARK streak along +x
  float k=pow(max(0.,1.-abs(uv.y)),2.)*smoothstep(1.,.2,abs(uv.x+.25));a=k;col=ramp(.5+.5*k);
 }else if(m==9){ // CRYSTAL ice spike, tip at top; lit/shadow facets, inner fractures, chunky shatter by t. P: taper, ridge, bands, translucency
  float v=(1.-uv.y)*.5;float hw=pow(max(0.,1.-v),P.x>0.?P.x:1.)*.92;float x=uv.x/max(hw,1e-3);float ins=1.-abs(x);
  if(ins>0.&&v<.995){float side=step(P.y,x);float st=fbm(vec2(x*2.5+sd,v*1.4));
   float lum=band(clamp(mix(.82,.42,side)+(st-.5)*.4+v*.18,0.,1.),P.z);col=ramp(lum);
   float edge=smoothstep(.14,0.,ins),rl=smoothstep(.07,0.,abs(x-P.y))*(1.-v*.4);col=mix(col,c2,max(edge*.75,rl*.65));
   a=smoothstep(0.,.05,ins)*mix(1.,.62+.38*v,P.w);
   if(t>0.){vec2 cell=floor(vec2(uv.x*2.2,uv.y*3.5)+(fbm(uv*2.5+sd)-.5)*1.3);if(h21(cell+sd)<t*1.2)a=0.;col=mix(col,vec3(1),smoothstep(0.,.15,t)*(1.-smoothstep(.15,.5,t))*.7);}}
 }else if(m==10){ // FROST ground decal: dendritic cracks, bright rim, twinkling sparkles. P: scale, cracks, sparkle, base opacity
  float d=length(uv);float n=fbm(uv*2.+sd);float mk=smoothstep(1.,.75,d+(n-.5)*.35);
  float f1=1.-abs(fbm(uv*P.x+sd)*2.-1.),f2=1.-abs(fbm(uv*P.x*2.3-sd)*2.-1.);float cr=smoothstep(.82,.96,max(f1,f2*.95))*mk*P.y;
  float rim=smoothstep(.55,.95,d+(n-.5)*.35)*mk;vec2 sc=floor(uv*38.);float sp=step(.982,h21(sc+sd))*(.5+.5*sin(tm*6.+h21(sc)*30.))*mk*P.z;
  col=mix(ramp(clamp(.25+cr*.6+rim*.35,0.,1.)),c2,clamp(sp,0.,1.));a=clamp(mk*P.w+cr*.7+rim*.3+sp,0.,1.)*(1.-t);
 }else if(m==11){ // SWIRL vortex bands rotating with time. P: twist, speed, inner radius, bands
  float d=length(uv);float sp=atan(uv.y,uv.x)+d*P.x-tm*P.y;float n=fbm(vec2(cos(sp),sin(sp))*1.5+vec2(d*3.,sd)),n2=vn(vec2(cos(sp),sin(sp))*4.+vec2(d*8.,sd));
  float mk=smoothstep(1.,.8,d)*smoothstep(P.z,P.z+.2,d);float inten=(n*.9+n2*.35-.45)*mk*1.8-t*.8;a=smoothstep(0.,.25,inten);col=ramp(band(clamp(inten,0.,1.),P.w));
 }else if(m==12){ // BOLT lightning from x=-1 to x=1, re-jagged P.y times/s, with a branch. P: jag freq, flicker rate, branch, core width
  float v=(uv.x+1.)*.5,env=sin(3.14159*clamp(v,0.,1.)),fr=floor(tm*P.y);
  float d1=((fbm(vec2(v*P.x,fr*3.1+sd))-.5)*1.5+(vn(vec2(v*P.x*4.,fr*7.3+sd))-.5)*.45)*env;float ds=abs(uv.y-d1);
  float core=smoothstep(P.w,P.w*.3,ds),glow=exp(-ds*7.)*.55;
  float bv=clamp((v-.35)/.45,0.,1.),dir=sign(h21(vec2(fr,sd))-.5);float d2=d1+((fbm(vec2(v*P.x*1.3,fr*5.7+sd+3.))-.5)*.9+.55*dir)*bv;
  float br=smoothstep(P.w*.7,P.w*.2,abs(uv.y-d2))*P.z*step(.35,v)*smoothstep(1.,.6,v);
  a=clamp(max(core,br)+glow,0.,1.)*smoothstep(1.,.92,abs(uv.x))*(1.-t);col=ramp(clamp(max(core,br*.8)+glow*.35,0.,1.));
 }else if(m==13){ // LIQUID glossy blob/pool: dark depths, wobbling edge, wet specular highlight. P: roughness, gloss, wobble speed, darkness
  float n=fbm(uv*1.8+vec2(sd,tm*P.z)),n2=fbm(uv*3.4-vec2(tm*P.z*.7,sd));float dens=1.-length(uv)+(n-.5)*P.x+(n2-.5)*P.x*.4-t*.95;
  float hgt=smoothstep(0.,.32,dens);vec3 nn=normalize(vec3(uv*(1.-hgt)*1.6+(vec2(n,n2)-.5)*.7,1.));
  float df=max(dot(nn,normalize(vec3(-.4,-.55,.75))),0.);float spc=pow(max(dot(reflect(normalize(vec3(.4,.55,-.75)),nn),vec3(0,0,1)),0.),P.y);
  col=mix(c0,c1,band(clamp(df*.75+.25*hgt,0.,1.),3.))*(1.-P.w*.4);col*=mix(.55,1.,smoothstep(0.,.18,dens));col=mix(col,c2,smoothstep(.45,.6,spc)*.9);
  a=smoothstep(0.,.03,dens);
 }else if(m==14){ // STREAM liquid tube along +x with flowing noise and a broken highlight. P: flow speed, wobble, bands, gloss
  float v=(uv.x+1.)*.5;float n=fbm(vec2(v*4.-tm*P.x+sd,uv.y*1.5));float wob=(vn(vec2(v*3.-tm*P.x*.5,sd))-.5)*P.y;
  float y=(uv.y-wob)/(.55+.25*(n-.5));float ins=1.-abs(y);vec3 nn=vec3(0.,y,sqrt(max(0.,1.-y*y)));float df=max(dot(nn,normalize(vec3(0.,-.6,.8))),0.);
  col=ramp(band(clamp(df*.8+(n-.5)*.4,0.,1.),P.z));col=mix(col,c2,smoothstep(.86,.93,df)*smoothstep(.35,.6,n)*P.w);
  a=smoothstep(0.,.08,ins)*smoothstep(0.,.05,v)*smoothstep(1.,.95,v)*(1.-t);
 }else if(m==16){ // SLASH neon crescent (Oct 16, warrior). Quad unrotated, circle in uv. P: half span (sign = sweep direction), thickness, trail fraction, centre angle. t = sweep progress.
  float S=abs(P.x),dirn=P.x<0.?-1.:1.;float r=length(uv);float ang=atan(uv.y,uv.x)-P.w;ang=atan(sin(ang),cos(ang))*dirn;
  float tt=min(1.,t*1.2);float head=-S+2.*S*(1.-pow(1.-tt,3.));float q=(head-ang)/(2.*S*P.z+.001);
  float fade=1.-smoothstep(.72,1.,t);float inq=smoothstep(-.16,.1,q)*smoothstep(1.,.55,q); /* Oct 17 (user: hard line at the crescent end): soft fade at both ends */
  float tip=smoothstep(-.06,.22,q);float taper=pow(clamp(1.-q,0.,1.),1.15)*mix(.2,1.,tip);float w=(P.y*taper+.004)*.775; /* leading tip tapers to a point instead of a blunt edge */float d=abs(r-.62+q*.04); // Oct 17: arc at .62 (was .8) of a 1.29x larger quad, so thick/glowing arcs no longer clip at the quad edge
  float n=vn(vec2(q*9.-tm*5.,r*24.+sd));float body=smoothstep(w,w*.35,d)*(.72+.28*n);float core=smoothstep(w*.4,0.,d)*smoothstep(.55,0.,q);
  float glow=exp(-d/(w*2.2+.01))*(1.-q)*.55;a=max(body,glow)*inq*fade;col=ramp(clamp(body*.55+core*.7+glow*.15,0.,1.));
 }else{ // BEAM neon tube along x: hot core, exponential falloff glow, energy pulses travelling along it. P: core width, pulse speed (+ = toward x=-1), pulse frequency, glow falloff
  float v=(uv.x+1.)*.5,y=abs(uv.y);float n=vn(vec2(v*7.+tm*P.y*.6,sd));
  float core=smoothstep(P.x,P.x*.35,y+(n-.5)*.04);float edge=1.-smoothstep(.5,1.,y);float glow=exp(-y*P.w)*(.85+.15*sin(tm*31.+sd))*edge;
  float pulse=pow(.5+.5*sin((v*P.z+tm*P.y)*6.2832),6.)*exp(-y*P.w*1.4)*edge;
  float ends=smoothstep(0.,.035,v)*smoothstep(1.,.965,v);
  a=clamp(core+glow*.75+pulse*.6,0.,1.)*ends*(1.-t);col=ramp(clamp(core*.95+glow*.3+pulse*.45,0.,1.));
 }
 a=clamp(a,0.,1.)*vC.y;vec3 pm=col*a;float mx=max(pm.r,max(pm.g,pm.b));o=vec4(pm,mix(a,mx,vC.z));
}`;

const hexCache=new Map();
export function rgb(c){let v=hexCache.get(c);if(v)return v;const h=c.replace('#','');const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h.slice(0,6),16);v=[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];hexCache.set(c,v);return v;}

function readPref(){try{return localStorage.getItem(KEY)!=='off';}catch{return true;}}

function build(){
 // OffscreenCanvas lets each flush hand its frame over as an ImageBitmap (a buffer swap) instead of the 2D canvas
 // reading a live WebGL canvas, which can stall on a GPU sync on some drivers. Falls back to a DOM canvas.
 const off=typeof OffscreenCanvas!=='undefined'&&'transferToImageBitmap' in OffscreenCanvas.prototype,canvas=off?new OffscreenCanvas(2,2):document.createElement('canvas');canvas.width=canvas.height=2;
 const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});
 if(!gl)return null;
 const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
 const prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
 if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));
 const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 const inst=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,inst);gl.bufferData(gl.ARRAY_BUFFER,MAX*F*4,gl.DYNAMIC_DRAW);
 [[1,4,0],[2,4,4],[3,4,8],[4,4,12],[5,3,16],[6,3,19],[7,3,22]].forEach(([loc,n,off])=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,F*4,off*4);gl.vertexAttribDivisor(loc,1);});
 gl.bindVertexArray(null);
 return {off,canvas,gl,prog,vao,inst,uRes:gl.getUniformLocation(prog,'uRes'),uM:gl.getUniformLocation(prog,'uM')};
}

function createVfx(){
 let g=null,failed=false,enabled=readPref(),scale=1;const stats={flushes:0,prims:0};
 const queues={ground:{d:new Float32Array(MAX*F),n:0,b:[1e9,1e9,-1e9,-1e9]},upper:{d:new Float32Array(MAX*F),n:0,b:[1e9,1e9,-1e9,-1e9]}};
 const ensure=()=>{if(g||failed)return g;try{g=build();}catch(err){console.warn('Shader VFX unavailable',err);g=null;}if(!g)failed=true;return g;};
 const api={
  get ok(){return enabled&&!!ensure();},
  get enabled(){return enabled;},
  takeStats(){const o={vfxPrims:stats.prims,vfxFlushes:stats.flushes};stats.prims=stats.flushes=0;return o;},
  setScale(s){scale=Math.max(.25,Math.min(1,+s||1));},
  setEnabled(on){enabled=!!on;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}},
  // p: {mat,x,y,w,h,rot,t,time,seed,alpha,add,params:[4],colors:[c0,c1,c2]} in world units.
  add(pass,p){const q=queues[pass]??queues.upper;if(q.n>=MAX)return;const o=q.n++*F,d=q.d,P=p.params??[],C=p.colors;
   d[o]=p.x;d[o+1]=p.y;d[o+2]=p.w;d[o+3]=p.h??p.w;d[o+4]=p.rot??0;d[o+5]=typeof p.mat==='number'?p.mat:MAT[p.mat]??7;d[o+6]=p.t??0;d[o+7]=p.time??0;
   d[o+8]=p.seed??0;d[o+9]=p.alpha??1;d[o+10]=p.add??0;d[o+11]=0;d[o+12]=P[0]??0;d[o+13]=P[1]??0;d[o+14]=P[2]??0;d[o+15]=P[3]??0;
   const a=rgb(C?.[0]??'#000'),b=rgb(C?.[1]??C?.[0]??'#fff'),c=rgb(C?.[2]??C?.[1]??'#fff');d.set(a,o+16);d.set(b,o+19);d.set(c,o+22);
   const r=Math.max(p.w,p.h??p.w)*.75,B=q.b;if(p.x-r<B[0])B[0]=p.x-r;if(p.y-r<B[1])B[1]=p.y-r;if(p.x+r>B[2])B[2]=p.x+r;if(p.y+r>B[3])B[3]=p.y+r;},
  clear(pass){const q=queues[pass];if(q){q.n=0;q.b[0]=q.b[1]=1e9;q.b[2]=q.b[3]=-1e9;}},
  // Renders the queued pass with ctx's current transform and composites it into ctx.
  flush(ctx,pass='upper'){const q=queues[pass];if(!q.n)return;if(!api.ok){api.clear(pass);return;}
   const {off,canvas,gl,prog,vao,inst,uRes,uM}=g,W=ctx.canvas.width,H=ctx.canvas.height,m=ctx.getTransform();
   const s=scale,CW=Math.max(1,Math.ceil(W*s)),CH=Math.max(1,Math.ceil(H*s));if(canvas.width!==CW||canvas.height!==CH){canvas.width=CW;canvas.height=CH;}
   const B=q.b,xs=[B[0]*m.a+B[1]*m.c+m.e,B[2]*m.a+B[3]*m.c+m.e],ys=[B[0]*m.b+B[1]*m.d+m.f,B[2]*m.b+B[3]*m.d+m.f];
   const x0=Math.max(0,Math.floor(Math.min(...xs))),y0=Math.max(0,Math.floor(Math.min(...ys))),x1=Math.min(W,Math.ceil(Math.max(...xs))),y1=Math.min(H,Math.ceil(Math.max(...ys)));
   if(x1<=x0||y1<=y0){api.clear(pass);return;}
   const sx0=Math.floor(x0*s),sy0=Math.floor(y0*s),sx1=Math.min(CW,Math.ceil(x1*s)),sy1=Math.min(CH,Math.ceil(y1*s));
   gl.viewport(0,0,CW,CH);gl.enable(gl.SCISSOR_TEST);gl.scissor(sx0,CH-sy1,sx1-sx0,sy1-sy0);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(prog);gl.uniform2f(uRes,CW,CH);gl.uniformMatrix3fv(uM,false,[m.a*s,m.b*s,0,m.c*s,m.d*s,0,m.e*s,m.f*s,1]);
   gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,inst);gl.bufferSubData(gl.ARRAY_BUFFER,0,q.d,0,q.n*F);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,q.n);gl.bindVertexArray(null);
   ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter=ctx.spellColorFilter??'none';const src=off?canvas.transferToImageBitmap():canvas;ctx.drawImage(src,sx0,sy0,sx1-sx0,sy1-sy0,sx0/s,sy0/s,(sx1-sx0)/s,(sy1-sy0)/s);if(off)src.close();ctx.restore();
   stats.flushes++;stats.prims+=q.n;
   api.clear(pass);}
 };
 return api;
}

// One shared engine for the game and the VFX Lab.
export const vfx=createVfx();
