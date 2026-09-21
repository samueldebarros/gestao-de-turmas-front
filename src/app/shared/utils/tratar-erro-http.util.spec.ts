import { alertaDeErroHttp } from './tratar-erro-http.util';

const CHAVE_FALLBACK = 'MENSAGEM.ERRO_INATIVAR_TURMA';
const CHAVE_REGRA_NEGOCIO = 'MENSAGEM.ERRO_REGRA_NEGOCIO_TURMA';
const MENSAGEM = 'A turma atingiu a capacidade máxima. Capacidade: 20; alunos ativos: 20.';

describe('alertaDeErroHttp', () => {
  it('422 com codigo e params vira ERRO_NEGOCIO.<codigo> com os params, sem o texto pt-BR', () => {
    const erro = {
      status: 422,
      error: {
        codigo: 'TURMA_CAPACIDADE_ATINGIDA',
        params: { capacidade: 20, alunosAtivos: 20 },
        mensagem: MENSAGEM,
      },
    };

    expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: 'ERRO_NEGOCIO.TURMA_CAPACIDADE_ATINGIDA',
      params: { capacidade: 20, alunosAtivos: 20 },
    });
  });

  it('422 com codigo sem params vira ERRO_NEGOCIO.<codigo>', () => {
    const erro = {
      status: 422,
      error: {
        codigo: 'TURMA_COMBINACAO_DUPLICADA',
        params: null,
        mensagem: 'Já existe uma turma com essa combinação de Identificador, Série e Ano letivo',
      },
    };

    expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: 'ERRO_NEGOCIO.TURMA_COMBINACAO_DUPLICADA',
    });
  });

  it.each([
    { caso: 'corpo string crua (formato antigo)', erro: { status: 422, error: MENSAGEM } },
    {
      caso: 'codigo nulo',
      erro: { status: 422, error: { codigo: null, params: null, mensagem: MENSAGEM } },
    },
    {
      caso: 'objeto sem codigo',
      erro: { status: 422, error: { params: null, mensagem: MENSAGEM } },
    },
    { caso: 'corpo vazio', erro: { status: 422, error: '' } },
    { caso: 'HTML', erro: { status: 422, error: '<!DOCTYPE html><html><body>Erro</body></html>' } },
  ])('$caso cai na chave genérica de regra de negócio, sem texto cru', ({ erro }) => {
    expect(alertaDeErroHttp(erro, CHAVE_FALLBACK, CHAVE_REGRA_NEGOCIO)).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: CHAVE_REGRA_NEGOCIO,
    });
  });

  it.each([{ status: 400 }, { status: 404 }, { status: 500 }])(
    'status $status cai na chave de fallback da tela',
    ({ status }) => {
      const erro = {
        status,
        error: { codigo: 'TURMA_CAPACIDADE_ATINGIDA', params: null, mensagem: MENSAGEM },
      };

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
