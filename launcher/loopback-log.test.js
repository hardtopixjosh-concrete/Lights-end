const assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),makeLog=require('./loopback-log');
for(const sync of [true,false]){const stream=new EventEmitter();let quit=0,writes=0;
 stream.write=()=>{writes++;if(sync)throw Object.assign(new Error('closed pipe'),{code:'EPIPE'});};
 const log=makeLog(stream,()=>quit++);log('hello');if(!sync)stream.emit('error',Object.assign(new Error('closed pipe'),{code:'EPIPE'}));log('after close');
 assert.equal(quit,1);assert.equal(writes,1);
}
const stream=new EventEmitter();stream.write=()=>{throw new Error('unrelated failure');};assert.throws(()=>makeLog(stream,()=>{})('test'),/unrelated failure/);
console.log('Loopback log checks passed: sync/async EPIPE exits once; unrelated errors retained.');
