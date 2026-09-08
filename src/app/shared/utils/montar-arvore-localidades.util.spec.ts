import { LocalidadeInterface } from '../interfaces/entities/localidade.interface';
import { ChaveNo, EstadoBusca, Indice } from '../interfaces/ui/no-arvore.interface';
import { montarArvoreLocalidades } from './montar-arvore-localidades.util';

const regiao = (): LocalidadeInterface => ({ id: 1, nome: 'Sudeste', nivel: 'regiao' });
const uf = (): LocalidadeInterface => ({ id: 31, nome: 'Minas Gerais', nivel: 'uf' });
const distrito = (): LocalidadeInterface => ({
  id: 310620,
  nome: 'Belo Horizonte',
  nivel: 'distrito',
});

const criarIndice = (
  entradas: [ChaveNo, EstadoBusca<LocalidadeInterface>][] = [],
): Indice<LocalidadeInterface> => new Map(entradas);

describe('montarArvoreLocalidades', () => {
  it('devolve lista vazia quando não há raiz alguma', () => {
    expect(montarArvoreLocalidades([], criarIndice())).toEqual([]);
  });

  it('raiz sem entrada no índice nasce ociosa, já com chave e rótulo', () => {
    const [no] = montarArvoreLocalidades([regiao()], criarIndice());

    expect(no.chave).toBe('/regiao:1');
    expect(no.rotulo).toBe('Sudeste');
    expect(no.filhos).toEqual({ status: 'ocioso' });
  });

  it('distrito é folha pelo nível, mesmo com filhos prontos no índice', () => {
    const indice = criarIndice([['/distrito:310620', { status: 'pronto', filhos: [regiao()] }]]);

    const [no] = montarArvoreLocalidades([distrito()], indice);

    expect(no.filhos).toEqual({ status: 'folha' });
  });

  it('desce a hierarquia inteira que está no índice, acumulando a chave do pai', () => {
    const indice = criarIndice([
      ['/regiao:1', { status: 'pronto', filhos: [uf()] }],
      ['/regiao:1/uf:31', { status: 'pronto', filhos: [distrito()] }],
    ]);

    const [no] = montarArvoreLocalidades([regiao()], indice);

    expect(no).toEqual({
      chave: '/regiao:1',
      rotulo: 'Sudeste',
      entidade: regiao(),
      filhos: {
        status: 'pronto',
        filhos: [
          {
            chave: '/regiao:1/uf:31',
            rotulo: 'Minas Gerais',
            entidade: uf(),
            filhos: {
              status: 'pronto',
              filhos: [
                {
                  chave: '/regiao:1/uf:31/distrito:310620',
                  rotulo: 'Belo Horizonte',
                  entidade: distrito(),
                  filhos: { status: 'folha' },
                },
              ],
            },
          },
        ],
      },
    });
  });

  it('preserva a ordem recebida em vez de ordenar por nome', () => {
    const raizes: LocalidadeInterface[] = [
      { id: 4, nome: 'Sul', nivel: 'regiao' },
      { id: 1, nome: 'Norte', nivel: 'regiao' },
    ];

    const resultado = montarArvoreLocalidades(raizes, criarIndice());

    expect(resultado.map((no) => no.rotulo)).toEqual(['Sul', 'Norte']);
  });
});
