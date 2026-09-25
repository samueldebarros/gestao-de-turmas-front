import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { DirecaoOrdenacaoEnum } from '../../enums/direcao-ordenacao.enum';
import { EntidadeBaseInterface } from '../../interfaces/entities/entidade-base.interface';
import { AcaoTabela } from '../../interfaces/ui/acao-tabela.interface';
import { EventoAcaoTabela } from '../../interfaces/ui/evento-acao-tabela.interface';
import { TabelaColuna } from '../../interfaces/ui/tabela-coluna.interface';
import { TabelaGenerica } from './tabela-generica.component';

interface LinhaTeste extends EntidadeBaseInterface {
  nome: string;
  ativo: boolean;
}

const LINHA: LinhaTeste = { id: 1, nome: 'Ana', ativo: true };

const criarLinha = (parcial: Partial<LinhaTeste> = {}): LinhaTeste => ({
  id: 1,
  nome: 'Ana',
  ativo: true,
  ...parcial,
});

const TRADUCOES = {
  STATUS: { ATIVO: 'Ativo' },
  COLUNA: { STATUS: 'Situação', NOME: 'Nome' },
  ACAO: { EDITAR: 'Editar', INATIVAR: 'Inativar' },
  TABELA: { COLUNAS: { ACOES: 'Ações' } },
};

describe('TabelaGenerica', () => {
  let fixture: ComponentFixture<TabelaGenerica<LinhaTeste>>;
  let componente: TabelaGenerica<LinhaTeste>;

  const renderizar = (colunas: TabelaColuna[]) => {
    componente.colunas = colunas;
    componente.dados = [LINHA];
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('tbody')!.textContent!;
  };

  const dom = () => fixture.nativeElement as HTMLElement;

  const montar = (colunas: TabelaColuna[], dados: LinhaTeste[], acoes: AcaoTabela[] = []) => {
    componente.colunas = colunas;
    componente.dados = dados;
    componente.acoes = acoes;
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TabelaGenerica] });
    fixture = TestBed.createComponent<TabelaGenerica<LinhaTeste>>(TabelaGenerica);
    componente = fixture.componentInstance;

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRADUCOES);
    translate.use('pt-BR');
  });

  describe('o valor da célula passa pelo i18n', () => {
    it('traduz o retorno do formatador quando a coluna não tem cssClassCelula', () => {
      const texto = renderizar([
        { chave: 'ativo', titulo: 'COLUNA.STATUS', formatador: () => 'STATUS.ATIVO' },
      ]);

      expect(texto).toContain('Ativo');
      expect(texto).not.toContain('STATUS.ATIVO');
    });

    it('traduz o retorno do formatador quando a coluna tem cssClassCelula', () => {
      const texto = renderizar([
        {
          chave: 'ativo',
          titulo: 'COLUNA.STATUS',
          formatador: () => 'STATUS.ATIVO',
          cssClassCelula: () => 'badge',
        },
      ]);

      expect(texto).toContain('Ativo');
      expect(texto).not.toContain('STATUS.ATIVO');
    });

    it('valor sem chave correspondente é exibido como veio', () => {
      const texto = renderizar([{ chave: 'nome', titulo: 'COLUNA.NOME' }]);

      expect(texto).toContain('Ana');
    });
  });

  describe('cabeçalho', () => {
    it('só é clicável a coluna que declara chaveOrdenacao', () => {
      componente.colunas = [
        { chave: 'nome', titulo: 'COLUNA.NOME', chaveOrdenacao: 1 },
        { chave: 'ativo', titulo: 'COLUNA.STATUS' },
      ];
      componente.dados = [LINHA];
      fixture.detectChanges();

      const botoes = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'th .cabecalho-ordenavel',
      );

      expect(botoes.length).toBe(1);
      expect(botoes[0]?.textContent).toContain('Nome');
    });

    it('clicar num cabeçalho ordenável emite a chave da coluna', () => {
      const emitidas: number[] = [];
      componente.ordenarPor.subscribe((chave) => emitidas.push(chave));
      componente.colunas = [{ chave: 'nome', titulo: 'COLUNA.NOME', chaveOrdenacao: 7 }];
      componente.dados = [LINHA];
      fixture.detectChanges();

      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('th .cabecalho-ordenavel')
        ?.click();

      expect(emitidas).toEqual([7]);
    });

    it('coluna sem chaveOrdenacao não emite nada ao ser clicada', () => {
      const emitidas: number[] = [];
      componente.ordenarPor.subscribe((chave) => emitidas.push(chave));

      componente.aoClicarCabecalho({ chave: 'ativo', titulo: 'COLUNA.STATUS' });

      expect(emitidas).toEqual([]);
    });
  });

  describe('renderização de linhas e colunas', () => {
    it('uma linha por item e uma célula por coluna', () => {
      montar(
        [
          { chave: 'nome', titulo: 'COLUNA.NOME' },
          { chave: 'ativo', titulo: 'COLUNA.STATUS' },
        ],
        [criarLinha(), criarLinha({ id: 2, nome: 'Bruno', ativo: false })],
      );

      expect(dom().querySelectorAll('tbody tr')).toHaveLength(2);
      expect(dom().querySelectorAll('tbody tr')[0].querySelectorAll('td')).toHaveLength(2);
    });

    it('sem dados o corpo fica vazio, porque a mensagem de lista vazia é do pai', () => {
      montar([{ chave: 'nome', titulo: 'COLUNA.NOME' }], []);

      expect(dom().querySelectorAll('tbody tr')).toHaveLength(0);
      expect(dom().querySelectorAll('thead th')).toHaveLength(1);
    });

    it('o cssClassCelula recebe o valor da célula e vira classe da span', () => {
      montar(
        [
          {
            chave: 'ativo',
            titulo: 'COLUNA.STATUS',
            cssClassCelula: (valor) => (valor ? 'badge-ativo' : 'badge-inativo'),
          },
        ],
        [criarLinha({ ativo: true }), criarLinha({ id: 2, ativo: false })],
      );

      const spans = dom().querySelectorAll('tbody td span');
      expect(spans[0].className).toBe('badge-ativo');
      expect(spans[1].className).toBe('badge-inativo');
    });

    it('sem cssClassCelula a célula não embrulha o valor numa span', () => {
      montar([{ chave: 'nome', titulo: 'COLUNA.NOME' }], [criarLinha()]);

      expect(dom().querySelector('tbody td span')).toBeNull();
    });

    it('o cssClassCabecalho entra no th', () => {
      montar(
        [{ chave: 'nome', titulo: 'COLUNA.NOME', cssClassCabecalho: 'coluna-centralizada' }],
        [criarLinha()],
      );

      expect(dom().querySelector('thead th')!.className).toBe('coluna-centralizada');
    });
  });

  describe('coluna de ações', () => {
    const EDITAR: AcaoTabela = { id: 'editar', rotulo: 'ACAO.EDITAR', varianteBotao: 'primario' };
    const INATIVAR: AcaoTabela = {
      id: 'inativar',
      rotulo: 'ACAO.INATIVAR',
      varianteBotao: 'perigo',
      condicaoVisibilidade: (item) => item.ativo === true,
    };

    it('sem ações, nenhuma coluna de ações é renderizada', () => {
      montar([{ chave: 'nome', titulo: 'COLUNA.NOME' }], [criarLinha()]);

      expect(dom().querySelector('.cabecalho-acoes')).toBeNull();
      expect(dom().querySelector('.celula-acoes')).toBeNull();
    });

    it('com ações, aparece o cabeçalho de ações e um botão por ação', () => {
      montar([{ chave: 'nome', titulo: 'COLUNA.NOME' }], [criarLinha()], [EDITAR, INATIVAR]);

      expect(dom().querySelector('.cabecalho-acoes')).not.toBeNull();
      expect(dom().querySelectorAll('.celula-acoes app-botao')).toHaveLength(2);
    });

    it('a condicaoVisibilidade decide por linha, não pela tabela', () => {
      montar(
        [{ chave: 'nome', titulo: 'COLUNA.NOME' }],
        [criarLinha({ ativo: true }), criarLinha({ id: 2, ativo: false })],
        [EDITAR, INATIVAR],
      );

      const celulas = dom().querySelectorAll('.celula-acoes');
      expect(celulas[0].querySelectorAll('app-botao')).toHaveLength(2);
      expect(celulas[1].querySelectorAll('app-botao')).toHaveLength(1);
    });

    it('clicar na ação emite acaoClicada com o id e o item daquela linha', () => {
      const eventos: EventoAcaoTabela<LinhaTeste>[] = [];
      componente.acaoClicada.subscribe((evento) => eventos.push(evento));
      const segunda = criarLinha({ id: 2, nome: 'Bruno' });
      montar([{ chave: 'nome', titulo: 'COLUNA.NOME' }], [criarLinha(), segunda], [EDITAR]);

      dom().querySelectorAll<HTMLButtonElement>('.celula-acoes app-botao button')[1].click();

      expect(eventos).toEqual([{ acaoId: 'editar', item: segunda }]);
    });

    it('caracterização: desabilitada bloqueia o clique no host e no botão interno; falsa deixa emitir', () => {
      const eventos: EventoAcaoTabela<LinhaTeste>[] = [];
      componente.acaoClicada.subscribe((evento) => eventos.push(evento));
      const bloqueada: AcaoTabela = { ...EDITAR, id: 'bloqueada', desabilitada: () => true };
      const liberada: AcaoTabela = { ...EDITAR, id: 'liberada', desabilitada: () => false };
      montar([{ chave: 'nome', titulo: 'COLUNA.NOME' }], [criarLinha()], [bloqueada, liberada]);

      const botoes = dom().querySelectorAll('.celula-acoes app-botao');
      botoes[0].querySelector<HTMLElement>('div')!.click();
      botoes[0].querySelector<HTMLButtonElement>('button')!.click();
      botoes[1].querySelector<HTMLButtonElement>('button')!.click();

      expect(eventos).toEqual([{ acaoId: 'liberada', item: LINHA }]);
    });

    it('a desabilitada decide por linha, não pela tabela', () => {
      const acaoComCondicao: AcaoTabela = {
        ...EDITAR,
        desabilitada: (item) => item.ativo === false,
      };
      montar(
        [{ chave: 'nome', titulo: 'COLUNA.NOME' }],
        [criarLinha({ ativo: true }), criarLinha({ id: 2, ativo: false })],
        [acaoComCondicao],
      );

      const botoes = dom().querySelectorAll<HTMLButtonElement>('.celula-acoes button');
      expect(botoes[0].disabled).toBe(false);
      expect(botoes[1].disabled).toBe(true);
    });
  });

  describe('indicador de ordenação', () => {
    const COLUNA_ORDENAVEL: TabelaColuna = {
      chave: 'nome',
      titulo: 'COLUNA.NOME',
      chaveOrdenacao: 7,
    };

    it.each([
      { direcao: DirecaoOrdenacaoEnum.ASC, ariaSort: 'ascending', seta: '▲' },
      { direcao: DirecaoOrdenacaoEnum.DESC, ariaSort: 'descending', seta: '▼' },
    ])('ordenação $ariaSort marca o th e a seta', ({ direcao, ariaSort, seta }) => {
      componente.ordenacaoAtual = { campo: 7, direcao };
      montar([COLUNA_ORDENAVEL], [criarLinha()]);

      expect(dom().querySelector('thead th')!.getAttribute('aria-sort')).toBe(ariaSort);
      expect(dom().querySelector('.indicador-ordenacao')!.textContent).toContain(seta);
    });

    it('ordenável sem ordenação vigente marca none e a seta neutra', () => {
      montar([COLUNA_ORDENAVEL], [criarLinha()]);

      expect(dom().querySelector('thead th')!.getAttribute('aria-sort')).toBe('none');
      expect(dom().querySelector('.indicador-ordenacao')!.textContent).toContain('⇅');
    });

    it('a ordenação de outra coluna não marca esta', () => {
      componente.ordenacaoAtual = { campo: 99, direcao: DirecaoOrdenacaoEnum.ASC };
      montar([COLUNA_ORDENAVEL], [criarLinha()]);

      expect(dom().querySelector('thead th')!.getAttribute('aria-sort')).toBe('none');
    });

    it('coluna não ordenável não recebe aria-sort algum', () => {
      componente.ordenacaoAtual = { campo: 7, direcao: DirecaoOrdenacaoEnum.ASC };
      montar([{ chave: 'nome', titulo: 'COLUNA.NOME' }], [criarLinha()]);

      expect(dom().querySelector('thead th')!.hasAttribute('aria-sort')).toBe(false);
    });
  });
});
