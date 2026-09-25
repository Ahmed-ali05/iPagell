// A confirmed write keeps its result even if the follow-up read fails.
export async function refreshAfterConfirmedMutation(refresh: () => Promise<void>, onFailure: () => void) {
  try { await refresh(); }
  catch { onFailure(); }
}
