export type DesktopUpdatePhase = "idle" | "checking" | "awaitingConfirmation" | "installing";

export function shouldOpenAutomaticUpdatePrompt(
  availableVersion: string | null,
  promptedVersions: ReadonlySet<string>,
  phase: DesktopUpdatePhase,
  presenting: boolean,
): boolean {
  return Boolean(availableVersion && !promptedVersions.has(availableVersion) && phase === "idle" && !presenting);
}
