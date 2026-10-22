import test from 'node:test';
import assert from 'node:assert/strict';
import {directionRow,movementVector,updateWalkFacing,movePlayer,createScene,groundFootprint,blocked,WORLD} from '../dist/simulation.js';
test('WASD diagonals have the same speed as cardinal movement',()=>{
  for(const keys of [['w'],['s'],['a'],['d'],['w','d'],['s','a']]){
    const v=movementVector(new Set(keys));assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-10);
  }
  assert.deepEqual(movementVector(new Set(['w','s'])),{x:0,y:0});
});
test('movement direction maps to all eight pack rows',()=>{
  // Expected rows taken from exact matches to the pack's direction-labeled PNGs.
  [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]].forEach(([x,y],i)=>assert.equal(directionRow(x,y),i));
});
test('WASD determines facing and stopping retains the last movement facing',()=>{
  const p={row:6};
  for(const [keys,row] of [[['d'],0],[['w','d'],7],[['w'],6],[['w','a'],5],[['a'],4],[['s','a'],3],[['s'],2],[['s','d'],1]]){
    updateWalkFacing(p,movementVector(new Set(keys)));assert.equal(p.row,row);
    updateWalkFacing(p,movementVector(new Set()));assert.equal(p.row,row);
  }
});
test('foot collision prevents tunneling during a large movement step',()=>{
  const p={x:100,y:100};movePlayer(p,300,0,[{x:180,y:100,radius:25}]);
  assert.ok(p.x<=180-25-WORLD.playerRadius);assert.equal(p.y,100);
});
test('obstacle contact still allows sliding and world boundaries stay solid',()=>{
  const p={x:140,y:100};const props=[{x:180,y:100,radius:25}];movePlayer(p,30,50,props);
  assert.ok(p.y>100);assert.equal(blocked(p.x,p.y,props),false);
  movePlayer(p,-1000,-1000,[]);assert.ok(p.x>=WORLD.playerRadius&&p.y>=WORLD.playerRadius);
});
test('starting position is open in the authored scene',()=>{
  const scene=createScene();assert.equal(blocked(1800,1400,scene.props),false);assert.ok(scene.props.length>20);
});
test('rock footprint blocks its base but allows close passage behind its upper silhouette',()=>{
  const rock={key:'Stone-A1_E',x:300,y:300,scale:.8};rock.footprint=groundFootprint(rock);
  assert.equal(blocked(300,300,[rock]),true);
  assert.equal(blocked(300,272,[rock]),false);
  assert.equal(blocked(300,325,[rock]),false);
  assert.equal(blocked(300+28+WORLD.playerRadius-1,300,[rock]),true);
  assert.equal(blocked(300+28+WORLD.playerRadius+1,300,[rock]),false);
});
test('narrow palm trunk blocks while foliage and empty space beside it remain walkable',()=>{
  const palm={key:'Tree-A1_E',x:300,y:300,scale:1};palm.footprint=groundFootprint(palm);
  assert.equal(blocked(300,300,[palm]),true);
  assert.equal(blocked(324,300,[palm]),false);
  assert.equal(blocked(300,250,[palm]),false);
});
test('ruined wall footprint follows the slanted base, including both ends',()=>{
  const wall={key:'Stone-A9_E',x:300,y:300,scale:1};wall.footprint=groundFootprint(wall);
  assert.equal(blocked(266,313,[wall]),true);assert.equal(blocked(335,281,[wall]),true);
  assert.equal(blocked(270,276,[wall]),false);
});
test('substeps cannot cross the narrower authored rock footprint',()=>{
  const rock={key:'Stone-A1_E',x:300,y:300,scale:.8};rock.footprint=groundFootprint(rock);
  const p={x:200,y:300};movePlayer(p,250,0,[rock]);
  assert.ok(p.x<300);assert.equal(blocked(p.x,p.y,[rock]),false);
});
test('low bushes remain passable ground foliage across the depth sorting boundary',()=>{
  const bushes=createScene().props.filter(p=>p.key==='Flora-B1_E');assert.ok(bushes.length>0);
  for(const p of bushes){assert.equal(p.layer,'ground');assert.equal(p.footprint,null);
    assert.equal(blocked(p.x,p.y-1,[p]),false);assert.equal(blocked(p.x,p.y+1,[p]),false);}
});
