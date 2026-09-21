import { AlertaState } from '../interfaces/ui/alerta-state.interface';
import { extrairMensagemDeRegra } from './mensagem-regra-negocio.util';

export function alertaDeErroHttp(
  erro: unknown,
  chaveFallback: string,
  chaveRegraNegocio: string,
): AlertaState {
  const status = (erro as { status?: number } | null)?.status;

  if (status !== 422) {
    return { visivel: true, tipo: 'erro', texto: chaveFallback };
  }

  const mensagem = extrairMensagemDeRegra(erro);
  if (mensagem) {
    return { visivel: true, tipo: 'erro', texto: mensagem, literal: true };
  }

  return { visivel: true, tipo: 'erro', texto: chaveRegraNegocio };
}
