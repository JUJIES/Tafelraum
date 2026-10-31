// Public builds neither access credentials nor register a settings endpoint.
export function createDesktopAiServices(){return {settings:null,gateway:undefined};}
export function aiSettingsPlugins(){return [];}
