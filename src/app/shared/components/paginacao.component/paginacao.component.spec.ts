import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginacaoComponent } from './paginacao.component';

describe('PaginacaoComponent', () => {
  let fixture: ComponentFixture<PaginacaoComponent>;
  let componente: PaginacaoComponent;
  let paginasEmitidas: number[];

  const montar = (paginaAtual: number, totalPaginas: number) => {
    componente.paginaAtual = paginaAtual;
    componente.totalPaginas = totalPaginas;
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PaginacaoComponent] });
    fixture = TestBed.createComponent(PaginacaoComponent);
    componente = fixture.componentInstance;

    paginasEmitidas = [];
    componente.mudarPagina.subscribe((pagina) => paginasEmitidas.push(pagina));
  });

  describe('estado derivado das entradas', () => {
    it.each([
      { paginaAtual: 1, totalPaginas: 5, anterior: false, proxima: true },
      { paginaAtual: 3, totalPaginas: 5, anterior: true, proxima: true },
      { paginaAtual: 5, totalPaginas: 5, anterior: true, proxima: false },
      { paginaAtual: 1, totalPaginas: 1, anterior: false, proxima: false },
    ])(
      'pagina $paginaAtual de $totalPaginas: anterior=$anterior, proxima=$proxima',
      ({ paginaAtual, totalPaginas, anterior, proxima }) => {
        montar(paginaAtual, totalPaginas);

        expect(componente.temPaginaAnterior).toBe(anterior);
        expect(componente.temProximaPagina).toBe(proxima);
      },
    );

    it('lista uma entrada por página', () => {
      montar(1, 3);

      expect(componente.paginas).toEqual([1, 2, 3]);
    });
  });

  describe('o que o componente emite — o contrato de saída', () => {
    it('emite a página pedida quando ela é válida e diferente da atual', () => {
      montar(2, 5);

      componente.irParaPagina(4);

      expect(paginasEmitidas).toEqual([4]);
    });

    it.each([
      { caso: 'abaixo do intervalo', pagina: 0 },
      { caso: 'acima do intervalo', pagina: 6 },
      { caso: 'igual à página atual', pagina: 2 },
    ])('não emite nada quando a página está $caso', ({ pagina }) => {
      montar(2, 5);

      componente.irParaPagina(pagina);

      expect(paginasEmitidas).toEqual([]);
    });

    it('nas bordas, os botões de navegação não emitem', () => {
      montar(1, 1);

      componente.paginaAnterior();
      componente.proximaPagina();

      expect(paginasEmitidas).toEqual([]);
    });

    it('não muda a página sozinho: quem decide é o pai', () => {
      montar(2, 5);

      componente.proximaPagina();

      expect(paginasEmitidas).toEqual([3]);
      expect(componente.paginaAtual).toBe(2);
    });
  });
});
