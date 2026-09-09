import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { AlunoFacadeService } from '../../core/facades/aluno-facade.service';
import { FeriadoFacadeService } from '../../core/facades/feriado-facade.service';
import { FeatureFlagsService } from '../../core/services/feature-flags.service';
import { AlunoIndex } from './aluno-index.component';

const PAGINA_VAZIA = { itens: [], paginaAtual: 1, totalPaginas: 0, totalResultados: 0 };

describe('AlunoIndex: flag importarCsv', () => {
  let fixture: ComponentFixture<AlunoIndex>;

  const montar = (importarCsv: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AlunoFacadeService,
          useValue: {
            resultado$: of(PAGINA_VAZIA),
            ordenacaoAtual$: of(null),
            aplicarFiltros: vi.fn(),
            mudarPagina: vi.fn(),
            ordenarPor: vi.fn(),
            buscarSugestoes: vi.fn(() => of([])),
          },
        },
        { provide: FeriadoFacadeService, useValue: { feriadosAnoAtual$: of([]) } },
        { provide: FeatureFlagsService, useValue: { importarCsv: signal(importarCsv) } },
      ],
    });

    fixture = TestBed.createComponent(AlunoIndex);
    fixture.detectChanges();
  };

  const botaoImportar = () =>
    fixture.debugElement
      .queryAll(By.css('.acoes-topo app-botao'))
      .filter((botao) => (botao.nativeElement as HTMLElement).textContent?.includes('IMPORTAR'));

  const importador = () => fixture.debugElement.queryAll(By.css('app-importar-alunos'));

  it('ligada, oferece o botao e o importador', () => {
    montar(true);

    expect(botaoImportar()).toHaveLength(1);
    expect(importador()).toHaveLength(1);
  });

  it('desligada, remove o botao do DOM', () => {
    montar(false);

    expect(botaoImportar()).toHaveLength(0);
  });

  it('desligada, remove o importador do DOM', () => {
    montar(false);

    expect(importador()).toHaveLength(0);
  });
});
