import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { TurmaFacadeService } from '../../core/facades/turma-facade.service';
import { TurnoEnum } from '../../shared/enums/turno.enum';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { EstadoLista } from '../../shared/interfaces/ui/estado-lista.interface';
import { TurmaIndexComponent } from './turma-index.component';

const TURMA_ATIVA: TurmaInterface = {
  id: 7,
  ativo: true,
  identificador: 'A',
  serie: 1,
  anoLetivo: 2026,
  turno: TurnoEnum.MATUTINO,
  capacidade: 30,
  totalAlunos: 10,
  totalDisciplinas: 3,
};

const TURMA_INATIVA: TurmaInterface = {
  id: 9,
  ativo: false,
  identificador: 'B',
  serie: 2,
  anoLetivo: 2025,
  turno: TurnoEnum.VESPERTINO,
  capacidade: 25,
  totalAlunos: 0,
  totalDisciplinas: 2,
};

const ESTADO_OK: EstadoLista<TurmaInterface> = {
  status: 'ok',
  resultado: {
    itens: [TURMA_ATIVA, TURMA_INATIVA],
    paginaAtual: 1,
    totalPaginas: 1,
    totalResultados: 2,
    tamanhoPagina: 12,
  },
};

describe('TurmaIndexComponent: integração no DOM', () => {
  let fixture: ComponentFixture<TurmaIndexComponent>;
  let facade: {
    estado$: Observable<EstadoLista<TurmaInterface>>;
    aplicarFiltros: Mock;
    mudarPagina: Mock;
    editar: Mock;
    inativar: Mock;
    reativar: Mock;
    alunosDaTurma: Mock;
    docentesDaTurma: Mock;
    alunosDisponiveis: Mock;
  };

  const dom = () => fixture.nativeElement as HTMLElement;

  const cartoes = () =>
    Array.from(dom().querySelectorAll('.grade-cards app-turma-card')) as HTMLElement[];

  const botaoEditar = (cartao: HTMLElement) =>
    cartao.querySelectorAll('.card__rodape button')[0] as HTMLButtonElement;

  const botaoStatus = (cartao: HTMLElement) =>
    cartao.querySelectorAll('.card__rodape button')[1] as HTMLButtonElement;

  const modal = () => dom().querySelector('app-modal') as HTMLElement;

  const botaoConfirmar = () =>
    Array.from(dom().querySelectorAll('app-confirmacao button')).find(
      (botao) => botao.textContent?.trim() === 'CONFIRMACAO.CONFIRMAR',
    ) as HTMLButtonElement;

  const campoModal = (placeholder: string) =>
    modal().querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement;

  const selectsModal = () => Array.from(modal().querySelectorAll('select')) as HTMLSelectElement[];

  const montar = () => {
    TestBed.configureTestingModule({
      imports: [TurmaIndexComponent],
      providers: [provideRouter([]), { provide: TurmaFacadeService, useValue: facade }],
    });
    fixture = TestBed.createComponent(TurmaIndexComponent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    facade = {
      estado$: of(ESTADO_OK),
      aplicarFiltros: vi.fn(),
      mudarPagina: vi.fn(),
      editar: vi.fn(() => of(undefined)),
      inativar: vi.fn(() => of(undefined)),
      reativar: vi.fn(() => of(undefined)),
      alunosDaTurma: vi.fn(() => of({ status: 'ok', itens: [] })),
      docentesDaTurma: vi.fn(() => of({ status: 'ok', itens: [] })),
      alunosDisponiveis: vi.fn(() => of([])),
    };
  });

  it('clicar no corpo do card abre o painel de detalhe, não o formulário de edição', () => {
    montar();

    (cartoes()[0].querySelector('.card__abrir') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(modal().querySelector('app-turma-detalhe')).not.toBeNull();
    expect(modal().querySelector('form.form-turma')).toBeNull();
    expect(facade.alunosDaTurma).toHaveBeenCalledWith(TURMA_ATIVA.id);
  });

  it('reabrir o painel em outra turma carrega a turma nova, não a anterior', () => {
    montar();
    const abrir = (indice: number) =>
      (cartoes()[indice].querySelector('.card__abrir') as HTMLButtonElement).click();

    abrir(0);
    fixture.detectChanges();
    expect(facade.alunosDaTurma).toHaveBeenLastCalledWith(TURMA_ATIVA.id);

    dom().querySelector('app-modal .botao-fechar')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    abrir(1);
    fixture.detectChanges();

    expect(facade.alunosDaTurma).toHaveBeenLastCalledWith(TURMA_INATIVA.id);
    expect(facade.docentesDaTurma).toHaveBeenLastCalledWith(TURMA_INATIVA.id);
  });

  it('editar um card abre de fato o dialog nativo por trás do modal', () => {
    montar();

    botaoEditar(cartoes()[0]).click();
    fixture.detectChanges();

    expect(modal().querySelector('dialog')?.open).toBe(true);
  });

  it('editar o segundo card abre o modal com os cinco campos preenchidos com os dados daquela turma', () => {
    montar();

    botaoEditar(cartoes()[1]).click();
    fixture.detectChanges();

    expect(campoModal('TURMA.FORMULARIO.IDENTIFICADOR_PLACEHOLDER').value).toBe(
      TURMA_INATIVA.identificador,
    );
    expect(selectsModal()[0].value).toBe(String(TURMA_INATIVA.serie));
    expect(campoModal('TURMA.FORMULARIO.ANO_LETIVO_PLACEHOLDER').value).toBe(
      String(TURMA_INATIVA.anoLetivo),
    );
    expect(selectsModal()[1].value).toBe(String(TURMA_INATIVA.turno));
    expect(campoModal('TURMA.FORMULARIO.CAPACIDADE_PLACEHOLDER').value).toBe(
      String(TURMA_INATIVA.capacidade),
    );
  });

  it('o rótulo do botão de status reflete o campo ativo de cada card', () => {
    montar();

    expect(botaoStatus(cartoes()[0]).textContent?.trim()).toBe('TURMA.BOTOES.INATIVAR');
    expect(botaoStatus(cartoes()[1]).textContent?.trim()).toBe('TURMA.BOTOES.REATIVAR');
  });

  it('inativação recusada com 422 exibe a frase do servidor no alerta de página', () => {
    facade.inativar = vi.fn(() =>
      throwError(() => ({
        status: 422,
        error: {
          error: new SyntaxError('...'),
          text: 'A turma possui 12 alunos matriculados.',
        },
      })),
    );
    montar();

    botaoStatus(cartoes()[0]).click();
    fixture.detectChanges();

    botaoConfirmar().click();
    fixture.detectChanges();

    expect(dom().querySelector('.alerta-pagina .caixa-mensagem')?.textContent).toContain(
      'A turma possui 12 alunos matriculados.',
    );
  });
});
