import { alertaDeErroHttp } from './tratar-erro-http.util';

const CHAVE_FALLBACK = 'MENSAGEM.ERRO_INATIVAR_TURMA';
const CHAVE_REGRA_NEGOCIO = 'MENSAGEM.ERRO_REGRA_NEGOCIO_TURMA';
const MENSAGEM = 'A turma possui alunos vinculados e não pode ser inativada.';

describe('alertaDeErroHttp', () => {
  it('422 com corpo string vira alerta literal com a frase do servidor', () => {
    const erro = { status: 422, error: MENSAGEM };

    expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: MENSAGEM,
      literal: true,
    });
  });

  it('422 no formato real (HttpClient falha ao parsear JSON) vira alerta literal com o texto', () => {
    const erro = { status: 422, error: { error: new SyntaxError('...'), text: MENSAGEM } };

    expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: MENSAGEM,
      literal: true,
    });
  });

  it('422 com corpo vazio cai na chave de regra de negócio, sem literal', () => {
    const erro = { status: 422, error: '' };

    expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: CHAVE_REGRA_NEGOCIO,
    });
  });

  it('422 com corpo objeto sem text cai na chave de regra de negócio, sem literal', () => {
    const erro = { status: 422, error: { title: 'Not Found' } };

    expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: CHAVE_REGRA_NEGOCIO,
    });
  });

  it.each([{ status: 400 }, { status: 404 }, { status: 500 }])(
    'status $status cai na chave de fallback da tela, sem literal',
    ({ status }) => {
      const erro = { status, error: MENSAGEM };

      expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: CHAVE_FALLBACK,
      });
    },
  );

  it('erro que não é objeto cai na chave de fallback da tela', () => {
    expect(alertaDeErroHttp('falhou', CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: CHAVE_FALLBACK,
    });
  });

  it('erro nulo cai na chave de fallback da tela', () => {
    expect(alertaDeErroHttp(null, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: CHAVE_FALLBACK,
    });
  });
});
