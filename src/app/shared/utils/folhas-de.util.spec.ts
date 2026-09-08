import { EstadoFilhos, NoArvore } from '../interfaces/ui/no-arvore.interface';
import { folhasDe } from './folhas-de.util';

const criarNo = (
  chave: string,
  filhos: EstadoFilhos<string> = { status: 'folha' },
): NoArvore<string> => ({ chave, rotulo: chave, entidade: chave, filhos });

const comFilhos = (chave: string, ...filhos: NoArvore<string>[]): NoArvore<string> =>
  criarNo(chave, { status: 'pronto', filhos });

describe('folhasDe', () => {
  it('folha devolve a própria chave', () => {
    expect(folhasDe(criarNo('/a'))).toEqual(['/a']);
  });

  it('desce a árvore e devolve só as folhas, em ordem de leitura', () => {
    const arvore = comFilhos(
      '/raiz',
      comFilhos('/raiz/x', criarNo('/raiz/x/1'), criarNo('/raiz/x/2')),
      criarNo('/raiz/y'),
    );

    expect(folhasDe(arvore)).toEqual(['/raiz/x/1', '/raiz/x/2', '/raiz/y']);
  });

  it.each([{ status: 'ocioso' }, { status: 'carregando' }, { status: 'erro' }] as const)(
    'ramo em $status não contribui folha alguma: o que não foi carregado é invisível',
    (filhos) => {
      expect(folhasDe(criarNo('/raiz', filhos))).toEqual([]);
    },
  );

  it('nó interno pronto e sem filhos não devolve a própria chave', () => {
    expect(folhasDe(comFilhos('/raiz'))).toEqual([]);
  });
});
