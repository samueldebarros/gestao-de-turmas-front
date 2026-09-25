export interface ConfirmacaoAcao {
  titulo: string;
  mensagem: string;
  params?: Record<string, unknown>;
  rotuloConfirmar: string;
  variante: 'perigo' | 'primario';
}
