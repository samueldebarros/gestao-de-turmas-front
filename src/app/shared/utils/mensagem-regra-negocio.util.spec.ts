import { extrairErroDeNegocio } from './mensagem-regra-negocio.util';

describe('extrairErroDeNegocio', () => {
  describe('formatos que o back novo produz', () => {
    it('extrai codigo, params e mensagem quando o corpo tem codigo utilizável', () => {
      const erro = {
        status: 422,
        error: {
          codigo: 'TURMA_CAPACIDADE_ATINGIDA',
          params: { capacidade: 20, alunosAtivos: 20 },
          mensagem: 'A turma atingiu a capacidade máxima. Capacidade: 20; alunos ativos: 20.',
        },
      };

      expect(extrairErroDeNegocio(erro)).toEqual({
        codigo: 'TURMA_CAPACIDADE_ATINGIDA',
        params: { capacidade: 20, alunosAtivos: 20 },
        mensagem: 'A turma atingiu a capacidade máxima. Capacidade: 20; alunos ativos: 20.',
      });
    });

    it('extrai codigo com params nulo', () => {
      const erro = {
        status: 422,
        error: {
          codigo: 'TURMA_COMBINACAO_DUPLICADA',
          params: null,
          mensagem: 'Já existe uma turma com essa combinação de Identificador, Série e Ano letivo',
        },
      };

      expect(extrairErroDeNegocio(erro)).toEqual({
        codigo: 'TURMA_COMBINACAO_DUPLICADA',
        params: null,
        mensagem: 'Já existe uma turma com essa combinação de Identificador, Série e Ano letivo',
      });
    });
  });

  describe('recusa o que não traz codigo utilizável', () => {
    it.each([
      {
        caso: 'string crua (formato antigo)',
        erro: { status: 422, error: 'A turma atingiu a capacidade.' },
      },
      {
        caso: 'codigo nulo',
        erro: { status: 422, error: { codigo: null, params: null, mensagem: 'x' } },
      },
      {
        caso: 'objeto sem codigo',
        erro: { status: 422, error: { params: null, mensagem: 'x' } },
      },
      { caso: 'corpo vazio', erro: { status: 422, error: '' } },
      {
        caso: 'HTML',
        erro: { status: 422, error: '<!DOCTYPE html><html><body>Erro</body></html>' },
      },
      { caso: 'corpo ausente', erro: { status: 500 } },
      { caso: 'erro que não é objeto', erro: 'falhou' },
      { caso: 'nulo', erro: null },
    ])('devolve nulo para $caso', ({ erro }) => {
      expect(extrairErroDeNegocio(erro)).toBeNull();
    });
  });
});
