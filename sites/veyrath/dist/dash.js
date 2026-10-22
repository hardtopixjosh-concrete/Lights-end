import {blocked,directionRow} from './simulation.js?v=fx-260';
import {attackDefinition,clearAttackInput} from './combat.js?v=fx-260';

export const DASH={distance:160,duration:.24,invulnerability:.18,cooldown:3};
export function createDash(){return {remaining:0,elapsed:0,cooldown:0,x:0,y:0,row:2,blocked:false};}
export function startDash(dash,player,vector,combat){
  if(dash.remaining>0||dash.cooldown>0||combat.hitstop>0)return false;
  // Cancel only recovery, after the contact window; retain strike commitment.
  const a=combat.attack;
  if(a&&a.elapsed<attackDefinition(a).duration*attackDefinition(a).hitEnd)return false;
  const length=Math.hypot(vector.x,vector.y);
  const angle=length?Math.atan2(vector.y,vector.x):player.row*Math.PI/4;
  dash.x=Math.cos(angle);dash.y=Math.sin(angle);dash.row=directionRow(dash.x,dash.y);
  dash.remaining=DASH.duration;dash.elapsed=0;dash.cooldown=DASH.cooldown;dash.blocked=false;
  player.row=dash.row;combat.attack=null;combat.chainTimer=0;combat.nextCombo=0;clearAttackInput(combat);
  return true;
}
export function tickDash(dash,player,props,dt){
  dash.cooldown=Math.max(0,dash.cooldown-dt*(dash.recovery??1));
  if(dash.remaining<=0)return;
  const activeTime=Math.min(dt,dash.remaining),distance=DASH.distance*(dash.reach??1)/DASH.duration*activeTime;
  if(!dash.blocked){
    const steps=Math.max(1,Math.ceil(distance/4));
    for(let i=0;i<steps;i++){
      const x=player.x+dash.x*distance/steps,y=player.y+dash.y*distance/steps;
      if(blocked(x,y,props)){dash.blocked=true;break;}
      player.x=x;player.y=y;
    }
  }
  dash.elapsed+=activeTime;dash.remaining=Math.max(0,dash.remaining-activeTime);
}
export function dashFrame(dash){return Math.min(14,Math.floor(dash.elapsed/DASH.duration*15));}
export function dashInvulnerable(dash){return dash.remaining>0&&dash.elapsed<DASH.invulnerability;}
