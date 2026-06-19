import type { Workspace } from "../domain/types.js";

export async function loadRegistry(_workspace: Workspace): Promise<never> {
  throw new Error("Draftpine v3 uses themes/<theme>/theme.json and blocks/*.html instead of a source registry.");
}
