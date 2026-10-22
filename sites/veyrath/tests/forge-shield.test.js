import assert from 'node:assert/strict';
import {createForgeShield,tickForgeShield,shieldCollider,shieldContains} from '../dist/forge-shield.js';
import {createCombat} from '../dist/combat.js';
import {createSurvival,receiveHit,tickSurvival} from '../dist/survival.js';
import {FORGE} from '../dist/weapons.js';
const c=createCombat(),s=createSurvival(c),shield=createForgeShield(FORGE),p={x:FORGE.x+50,y:FORGE.y};
s.forgeShield=shield;s.spawnTimer=100;
const e=c.targets[0];e.x=FORGE.x;e.y=FORGE.y;e.hurt=0;
assert(tickForgeShield(shield,p,c.targets,[],0));assert.equal(shield.remaining,20);assert(!shieldContains(shield,e,e.radius));
assert.equal(receiveHit(s,c,p,e,[]).length,0);assert.equal(s.hp,250);
for(let i=0;i<200;i++){tickForgeShield(shield,p,c.targets,[],.02);tickSurvival(s,c,p,shieldCollider(shield),{width:1200,height:720,zoom:.9},.02);}
assert(!shieldContains(shield,e,e.radius));assert.equal(s.hp,250);assert(shield.remaining<17);
tickForgeShield(shield,p,c.targets,[],20);assert.equal(shield.remaining,0);assert(!tickForgeShield(shield,p,c.targets,[],0));
assert.equal(receiveHit(s,c,p,e,[])[0].damage,28);
p.x=FORGE.x+400;tickForgeShield(shield,p,c.targets,[],0);p.x=FORGE.x+50;assert(tickForgeShield(shield,p,c.targets,[],0));assert.equal(shield.remaining,20);
console.log('Forge shield smoke passed: entry activation, enemy ejection/exclusion, damage protection, finite duration and re-entry after leaving.');
