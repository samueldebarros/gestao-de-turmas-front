import { AlertaState } from '../interfaces/ui/alerta-state.interface';
import { extrairErroDeNegocio } from './mensagem-regra-negocio.util';

export function alertaDeErroHttp(
  erro: unknown,
  chaveFallback: string,
  chaveRegraNegocio: string,
): AlertaState {
  const status = (erro as { status?: number } | null)?.status;

  if (status !== 422) {
    return { visivel: true, tipo: 'erro', texto: chaveFallback };
  }

  const erroNegocio = extrairErroDeNegocio(erro);
  if (erroNegocio) {
    return {
      visivel: true,
      tipo: 'erro',
      texto: `ERRO_NEGOCIO.${erroNegocio.codigo}`,
      params: erroNegocio.params ?? undefined,
    };
  }

  return { visivel: true, tipo: 'erro', texto: chaveRegraNegocio };
}
