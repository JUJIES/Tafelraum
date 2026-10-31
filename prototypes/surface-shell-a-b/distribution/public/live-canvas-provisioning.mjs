// Public local core has no Remote provisioning or credential reader.
export function createLiveCanvasMiddleware(){return async(_request,_response,next)=>next();}
