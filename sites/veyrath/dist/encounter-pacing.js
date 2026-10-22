// Ordinary pressure has a finite ramp; scripted encounters share the hard cap.
export const HARD_ENEMY_CAP=260;
export const PRESSURE_TUNING={rate:1,population:1};
// Oct 16 (#8): PDF five-minute population bands 12–40, 40–70, 70–100, 100–140, 140–165, 165–180
// across the 30-minute run. Day/night pressure multiplies these (run-director.js).
export const PRESSURE_STAGES=[
 {at:0,interval:2.6,cap:12},{at:300,interval:1.3,cap:40},{at:600,interval:.85,cap:70},
 {at:900,interval:.62,cap:100},{at:1200,interval:.48,cap:140},{at:1500,interval:.4,cap:165},{at:1800,interval:.36,cap:180}
];
export function encounterPressure(seconds,{optionalActive=false,bossActive=false}={}){
 const time=Math.max(0,Number.isFinite(seconds)?seconds:0);let a=PRESSURE_STAGES[0],b=a;
 for(let i=1;i<PRESSURE_STAGES.length;i++){b=PRESSURE_STAGES[i];if(time<=b.at)break;a=b;}
 const t=a===b?0:Math.min(1,(time-a.at)/(b.at-a.at)),interval=a.interval+(b.interval-a.interval)*t,cap=Math.floor(a.cap+(b.cap-a.cap)*t);
 // Twelve softer seconds in each minute after the first; no deferred spawn debt.
 const breathing=time>=60&&time%60>=48,rate=(breathing?.5:1)*(optionalActive?.45:bossActive?.6:1);
 return {interval:interval/(rate*PRESSURE_TUNING.rate),cap:Math.min(HARD_ENEMY_CAP-5,Math.max(1,Math.floor(cap*PRESSURE_TUNING.population))),breathing,rate,atCap:time>=1800};
}
