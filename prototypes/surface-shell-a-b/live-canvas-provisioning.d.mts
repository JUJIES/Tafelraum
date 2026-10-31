import type { IncomingMessage, ServerResponse } from "node:http";
export function createLiveCanvasMiddleware(options: { configPath: string | URL; env?: Record<string,string>; request?: typeof fetch }): (req: IncomingMessage,res: ServerResponse,next: () => void) => Promise<void>;
