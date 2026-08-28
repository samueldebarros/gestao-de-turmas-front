import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { EntidadeBaseInterface } from '../../interfaces/entities/entidade-base.interface';
import { TabelaColuna } from '../../interfaces/ui/tabela-coluna.interface';
import { TabelaGenerica } from './tabela-generica.component';

interface LinhaTeste extends EntidadeBaseInterface {
  nome: string;
  ativo: boolean;
}

const LINHA: LinhaTeste = { id: 1, nome: 'Ana', ativo: true };

const TRADUCOES = {
  STATUS: { ATIVO: 'Ativo' },
  COLUNA: { STATUS: 'Situação', NOME: 'Nome' },
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

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TabelaGenerica] });
    fixture = TestBed.createComponent<TabelaGenerica<LinhaTeste>>(TabelaGenerica);
    componente = fixture.componentInstance;

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', TRADUCOES);
    translate.use('pt-BR');
  });

  describe('o valor da célula passa pelo i18n', () => {
    it('traduz o retorno do formatador quando a coluna NÃO tem cssClassCelula', () => {
      const texto = renderizar([
        { chave: 'ativo', titulo: 'COLUNA.STATUS', formatador: () => 'STATUS.ATIVO' },
      ]);

      expect(texto).toContain('Ativo');
      expect(texto).not.toContain('STATUS.ATIVO');
    });

    it('traduz o retorno do formatador quando a coluna TEM cssClassCelula', () => {
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
});
