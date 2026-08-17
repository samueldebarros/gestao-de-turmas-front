export function limparNamespaceStorage(storage: Storage, namespace: string): void {
  const prefixo = `${namespace}:`;
  try {
    const chaves: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const chave = storage.key(i);
      if (chave?.startsWith(prefixo)) chaves.push(chave);
    }
    for (const chave of chaves) storage.removeItem(chave);
  } catch {
    return;
  }
}
