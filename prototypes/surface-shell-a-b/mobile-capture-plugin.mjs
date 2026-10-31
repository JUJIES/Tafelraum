import { createMobileCaptureReceiver } from './mobile-capture-receiver.mjs';

export function mobileCapturePlugin({configPath}) {
  const install = server => {
    const receiver = createMobileCaptureReceiver({configPath,getArchiveUrl:() => {
      const address = server.httpServer.address();
      if (!address || typeof address === 'string') throw new Error('Desktop server unavailable.');
      return `http://127.0.0.1:${address.port}`;
    }});
    server.middlewares.use(receiver.middleware);
    server.httpServer.once('close',() => void receiver.close());
  };
  return {name:'tafelraum-mobile-capture',apply:'serve',configureServer:install,configurePreviewServer:install};
}
