import {drawWarriorGround,drawWarriorUpper,drawWarriorLights} from './warrior-fx.js?v=fx-260';
// Warrior ability visuals live in warrior-fx.js (code-native, Oct 15). Old rings/square particles retired.
export function drawWarriorEffects(ctx,w,drawFX,ground=false){
 if(!w)return;
 if(ground){drawWarriorGround(ctx,w,drawFX);drawWarriorLights(ctx,w);return;}
 drawWarriorUpper(ctx,w);
}
