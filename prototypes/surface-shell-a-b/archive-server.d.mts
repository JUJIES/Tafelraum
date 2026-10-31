import type { Plugin } from "vite";
import type { Connect } from "vite";

export function createArchivePlugin(options: { archiveRootUrl: URL }): Plugin;
export function createArchiveMiddleware(archiveRoot: string): Connect.NextHandleFunction;
