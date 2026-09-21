export async function requestPersistentStorage(): Promise<boolean | undefined> {
  if (!navigator.storage?.persist) {
    return undefined;
  }

  try {
    const alreadyPersisted = await navigator.storage.persisted?.();
    if (alreadyPersisted) {
      return true;
    }

    return await navigator.storage.persist();
  } catch {
    return undefined;
  }
}
