import { EstadoBusca, NoArvore } from '../interfaces/ui/no-arvore.interface';
import { traduzirFilhos } from './traduzir-filhos.util';

const noFalso = (rotulo: string): NoArvore<string> => ({
  chave: `/${rotulo}`,
  rotulo,
  entidade: rotulo,
  filhos: { status: 'folha' },
});

const criarMontador = () => vi.fn((filhos: string[]) => filhos.map(noFalso));

describe('traduzirFilhos', () => {
  it('ausência no índice significa nunca pedido, não vazio', () => {
    const montar = criarMontador();

    expect(traduzirFilhos(undefined, montar)).toEqual({ status: 'ocioso' });
    expect(montar).not.toHaveBeenCalled();
  });

  it.each([{ status: 'carregando' }, { status: 'erro' }] as const)(
    'estado $status atravessa sem montar nó algum',
    (estado) => {
      const montar = criarMontador();

      expect(traduzirFilhos(estado, montar)).toBe(estado);
      expect(montar).not.toHaveBeenCalled();
    },
  );

  it('estado pronto entrega as entidades ao montador e embrulha o resultado', () => {
    const estado: EstadoBusca<string> = { status: 'pronto', filhos: ['a', 'b'] };
    const montar = criarMontador();

    const resultado = traduzirFilhos(estado, montar);

    expect(montar).toHaveBeenCalledWith(['a', 'b']);
    expect(resultado).toEqual({ status: 'pronto', filhos: [noFalso('a'), noFalso('b')] });
  });

  it('pronto sem entidade alguma continua pronto, com lista vazia', () => {
    const montar = criarMontador();

    expect(traduzirFilhos({ status: 'pronto', filhos: [] }, montar)).toEqual({
      status: 'pronto',
      filhos: [],
    });
    expect(montar).toHaveBeenCalledWith([]);
  });
});
