let contador = 0;

export function gerarIdUnico(prefixo: string): string {
  contador += 1;
  return `${prefixo}-${contador}`;
}
