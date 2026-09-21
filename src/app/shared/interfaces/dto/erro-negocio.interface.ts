export interface ErroNegocio {
  codigo: string | null;
  params: Record<string, unknown> | null;
  mensagem: string;
}
