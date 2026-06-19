export async function removedExtensionTestCommand(): Promise<never> {
  throw new Error("Draftpine v3 validates editable theme blocks through draftpine check and draftpine eval.");
}
