export async function removedMigrationCommand(): Promise<never> {
  throw new Error("Draftpine v3 does not include source migration commands. Re-author projects as pages and theme blocks.");
}
