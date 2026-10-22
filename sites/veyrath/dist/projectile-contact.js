// Projectile contact uses the visible torso/head; terrain and melee keep feet.
export function projectileHitsBody(projectile,enemy){
 const scale=enemy.scale??1.25,half=(enemy.bodyHalfWidth??(enemy.role==='boss'?29:20))*scale,top=enemy.y-(enemy.bodyHeight??(enemy.role==='boss'?82:70))*scale,bottom=enemy.y+5*scale;
 const x=Math.max(enemy.x-half,Math.min(enemy.x+half,projectile.x)),y=Math.max(top,Math.min(bottom,projectile.y-30)),radius=projectile.contactRadius??(projectile.kind==='water'?23:projectile.kind==='fireball'?10:projectile.kind==='axe'?12:6);
 return Math.hypot(projectile.x-x,projectile.y-30-y)<=radius;
}
