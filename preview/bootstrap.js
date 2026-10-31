// Only loaded by the static preview. No lesson, preference or answer survives a reload.
{
  const entries = new Map([['tafelraum-ui-language-v1','en']]);
  const requested = new URL(location.href).searchParams.get('lesson');
  entries.set('surface-lab-active-lesson',['eclipse','map-room','dispatch'].includes(requested)?requested:'eclipse');
  const memory = {get length(){return entries.size},getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(String(k),String(v)),removeItem:k=>entries.delete(k),clear:()=>entries.clear(),key:i=>[...entries.keys()][i]??null};
  Object.defineProperty(window,'localStorage',{value:memory});
  Object.defineProperty(window,'sessionStorage',{value:memory});
}
// Catalogue reconciliation runs on startup. Acknowledge it in this tab only.
// Other non-read requests never leave the browser, including attempted uploads.
{
  const read=window.fetch.bind(window);
  let catalog;
  window.fetch=async (input,options)=>{
    const address=new URL(typeof input==='string'|| input instanceof URL ? input : input.url,location.href);
    const method=(options?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if(address.origin!==location.origin && !['blob:','data:'].includes(address.protocol))return Response.error();
    if(address.pathname==='/api/archive'){
      if(method==='PUT'){
        const original=await (await read('/api/archive')).json();
        catalog={...original,catalog:JSON.parse(options.body).catalog};
        return Response.json(catalog);
      }
      if(method==='GET'&&catalog)return Response.json(catalog);
    }
    if(method!=='GET'&&method!=='HEAD')return Response.json({error:'This action is unavailable in the preview.'},{status:405});
    return read(input,options);
  };
}
