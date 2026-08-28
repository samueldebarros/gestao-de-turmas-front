const TAMANHO_MAXIMO = 300;

function textoUtilizavel(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;

  const limpo = valor.trim();
  if (limpo.length === 0 || limpo.length > TAMANHO_MAXIMO) return null;
  if (limpo.startsWith('<')) return null;

  return limpo;
}

export function extrairMensagemDeRegra(erro: unknown): string | null {
  if (typeof erro !== 'object' || erro === null) return null;

  const corpo = (erro as { error?: unknown }).error;

  const direto = textoUtilizavel(corpo);
  if (direto) return direto;

  if (typeof corpo === 'object' && corpo !== null) {
    return textoUtilizavel((corpo as { text?: unknown }).text);
  }

  return null;
}
