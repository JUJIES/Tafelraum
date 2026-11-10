/** Release a local host even when React never unmounts before a document reload. */
export function releaseAgentSession(prefix:string,session:{id:string;token:string}){
  void fetch(prefix+'/sessions/'+session.id+'/poll',{
    method:'DELETE',keepalive:true,
    headers:{'X-Tafelraum-Agent':'1',Authorization:'Bearer '+session.token},
  }).catch(()=>{});
}
