// Test runner only: its parent may close the log pipe while Electron is still alive.
module.exports=function loopbackLog(stream,quit){
  let closed=false;
  const failed=err=>{if(err?.code!=='EPIPE'&&err?.code!=='ERR_STREAM_DESTROYED')throw err;
    if(!closed){closed=true;quit();}};
  stream.on('error',failed);
  return message=>{if(closed)return;try{stream.write(String(message)+'\n');}catch(err){failed(err);}};
};
