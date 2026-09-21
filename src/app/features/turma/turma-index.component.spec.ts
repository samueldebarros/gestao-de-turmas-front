import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { TurmaFacadeService } from '../../core/facades/turma-facade.service';
import { TurmaCardComponent } from '../../shared/components/turma-card.component/turma-card.component';
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

describe('TurmaIndexComponent', () => {
  let fixture: ComponentFixture<TurmaIndexComponent>;
  let componente: TurmaIndexComponent;
  let facade: {
    estado$: Observable<EstadoLista<TurmaInterface>>;
    aplicarFiltros: Mock;
    mudarPagina: Mock;
    editar: Mock;
    inativar: Mock;
    reativar: Mock;
  };

  const montar = () => {
    TestBed.configureTestingModule({
      imports: [TurmaIndexComponent],
      providers: [provideRouter([]), { provide: TurmaFacadeService, useValue: facade }],
    });
    fixture = TestBed.createComponent(TurmaIndexComponent);
    componente = fixture.componentInstance;
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
    };
  });

  describe('modal', () => {
    it('nasce fechado', () => {
      montar();

      expect(componente.modalAberto()).toBe(false);
    });

    it('abrir detalhe guarda a turma no estado e troca o título do modal', () => {
      montar();

      componente.abrirDetalhe(TURMA_ATIVA);

      expect(componente.estadoModal()).toEqual({ modo: 'detalhe', turma: TURMA_ATIVA });
      expect(componente.modalAberto()).toBe(true);
      expect(componente.tituloModal()).toBe('TURMA.DETALHE.TITULO');
    });

    it('abrir edição usa o título de edição, não o de detalhe', () => {
      montar();

      componente.abrirModalEdicao(TURMA_ATIVA);

      expect(componente.tituloModal()).toBe('TURMA.MODAL.EDICAO_TITULO');
    });

    it('abrir edição preenche o form com os dados da turma e abre o modal', () => {
      montar();

      componente.abrirModalEdicao(TURMA_ATIVA);

      expect(componente.modalAberto()).toBe(true);
      expect(componente.turmaForm.value).toEqual({
        identificador: 'A',
        serie: 1,
        anoLetivo: 2026,
        turno: TurnoEnum.MATUTINO,
        capacidade: 30,
      });
    });

    it('fechar fecha o modal', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);

      componente.fecharModal();

      expect(componente.modalAberto()).toBe(false);
    });

    it('CA-11: turma com anoLetivo fora da janela do filtro abre o modal com o campo numérico preenchido', () => {
      montar();
      const turmaAnoAtipico: TurmaInterface = { ...TURMA_ATIVA, anoLetivo: 2019 };

      componente.abrirModalEdicao(turmaAnoAtipico);
      fixture.detectChanges();

      const camposNumericos = fixture.debugElement.queryAll(By.css('input[type="number"]'));

      expect(camposNumericos.length).toBe(2);
      expect(camposNumericos[0].nativeElement.value).toBe('2019');
      expect(componente.turmaForm.get('anoLetivo')?.valid).toBe(true);
    });
  });

  describe('validação do formulário', () => {
    it('formulário inválido não chama o Facade', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);
      componente.turmaForm.patchValue({ identificador: '' });

      componente.salvarTurma();

      expect(facade.editar).not.toHaveBeenCalled();
      expect(componente.alertaModal().visivel).toBe(true);
      expect(componente.alertaModal().tipo).toBe('erro');
      expect(componente.alertaModal().texto).toBe('MENSAGEM.FORMULARIO_INVALIDO');
    });

    it('identificador com 2 caracteres invalida o form', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);

      componente.turmaForm.patchValue({ identificador: 'AB' });
      componente.salvarTurma();

      expect(componente.turmaForm.invalid).toBe(true);
      expect(facade.editar).not.toHaveBeenCalled();
    });

    it('capacidade acima de 255 invalida o form', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);

      componente.turmaForm.patchValue({ capacidade: 256 });
      componente.salvarTurma();

      expect(componente.turmaForm.invalid).toBe(true);
      expect(facade.editar).not.toHaveBeenCalled();
    });

    it('anoLetivo fora da faixa 2000-2100 invalida o form, e 2026 é válido', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);

      componente.turmaForm.patchValue({ anoLetivo: 1999 });
      expect(componente.turmaForm.invalid).toBe(true);

      componente.turmaForm.patchValue({ anoLetivo: 2101 });
      expect(componente.turmaForm.invalid).toBe(true);

      componente.turmaForm.patchValue({ anoLetivo: 2026 });
      expect(componente.turmaForm.valid).toBe(true);
    });

    it('formulário inválido marca todos os campos como touched para revelar as mensagens de erro', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);
      componente.turmaForm.patchValue({ capacidade: 0 });

      componente.salvarTurma();

      expect(componente.turmaForm.get('identificador')?.touched).toBe(true);
      expect(componente.turmaForm.get('capacidade')?.touched).toBe(true);
    });
  });

  describe('alternarStatus roteia pelo campo ativo', () => {
    it('turma ativa chama inativar, não reativar, depois de confirmado', () => {
      montar();

      componente.alternarStatus(TURMA_ATIVA);
      componente.confirmar();

      expect(facade.inativar).toHaveBeenCalledWith(TURMA_ATIVA.id);
      expect(facade.reativar).not.toHaveBeenCalled();
    });

    it('turma inativa chama reativar, não inativar', () => {
      montar();

      componente.alternarStatus(TURMA_INATIVA);

      expect(facade.reativar).toHaveBeenCalledWith(TURMA_INATIVA.id);
      expect(facade.inativar).not.toHaveBeenCalled();
    });
  });

  describe('confirmação ao inativar', () => {
    it('inativar não chama o Facade sem confirmação', () => {
      montar();

      componente.alternarStatus(TURMA_ATIVA);

      expect(facade.inativar).not.toHaveBeenCalled();
    });

    it('confirmar chama o Facade uma única vez, com o id da turma pendente', () => {
      montar();

      componente.alternarStatus(TURMA_ATIVA);
      componente.confirmar();

      expect(facade.inativar).toHaveBeenCalledTimes(1);
      expect(facade.inativar).toHaveBeenCalledWith(TURMA_ATIVA.id);
    });

    it('reativar continua chamando o Facade diretamente, sem confirmação', () => {
      montar();

      componente.alternarStatus(TURMA_INATIVA);

      expect(facade.reativar).toHaveBeenCalledWith(TURMA_INATIVA.id);
      expect(facade.inativar).not.toHaveBeenCalled();
    });
  });

  describe('CA-1: o DTO de edição só leva os campos editáveis', () => {
    it('monta exatamente os seis campos esperados, com o identificador aparado', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);
      componente.turmaForm.patchValue({ identificador: 'C' });

      componente.salvarTurma();

      const dto = facade.editar.mock.calls[0][0];
      expect(Object.keys(dto).sort()).toEqual([
        'anoLetivo',
        'capacidade',
        'id',
        'identificador',
        'serie',
        'turno',
      ]);
      expect(dto.id).toBe(TURMA_ATIVA.id);
      expect(dto.identificador).toBe('C');
    });
  });

  describe('alertas: comando da lista reporta na página, comando do modal reporta no modal', () => {
    it('sucesso ao inativar alerta de sucesso na página', () => {
      montar();

      componente.alternarStatus(TURMA_ATIVA);
      componente.confirmar();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'MENSAGEM.SUCESSO_INATIVAR_TURMA',
      });
    });

    it('sucesso ao reativar alerta de sucesso na página com a chave de reativação', () => {
      montar();

      componente.alternarStatus(TURMA_INATIVA);

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'MENSAGEM.SUCESSO_REATIVAR_TURMA',
      });
    });

    it('erro 500 ao inativar cai na chave genérica, na página', () => {
      facade.inativar = vi.fn(() => throwError(() => ({ status: 500 })));
      montar();

      componente.alternarStatus(TURMA_ATIVA);
      expect(() => componente.confirmar()).not.toThrow();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.ERRO_INATIVAR_TURMA',
      });
    });

    it('422 ao inativar exibe a frase do servidor na PÁGINA, não a chave genérica', () => {
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

      componente.alternarStatus(TURMA_ATIVA);
      componente.confirmar();

      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'A turma possui 12 alunos matriculados.',
        literal: true,
      });
    });

    it('erro na edição mantém o modal aberto com o form preenchido', () => {
      facade.editar = vi.fn(() => throwError(() => ({ status: 500 })));
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);

      expect(() => componente.salvarTurma()).not.toThrow();

      expect(componente.modalAberto()).toBe(true);
      expect(componente.alertaModal()).toEqual({
        visivel: true,
        tipo: 'erro',
        texto: 'MENSAGEM.ERRO_EDICAO_TURMA',
      });
      expect(componente.turmaForm.value.identificador).toBe('A');
    });

    it('422 na edição exibe a frase do servidor DENTRO do modal', () => {
      facade.editar = vi.fn(() =>
        throwError(() => ({
          status: 422,
          error: {
            error: new SyntaxError('...'),
            text: 'A turma possui 12 alunos matriculados.',
          },
        })),
      );
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);

      componente.salvarTurma();

      expect(componente.alertaModal().texto).toBe('A turma possui 12 alunos matriculados.');
      expect(componente.modalAberto()).toBe(true);
    });

    it('sucesso na edição fecha o modal e alerta de sucesso na página', () => {
      montar();
      componente.abrirModalEdicao(TURMA_ATIVA);

      componente.salvarTurma();

      expect(componente.modalAberto()).toBe(false);
      expect(componente.alertaPagina()).toEqual({
        visivel: true,
        tipo: 'sucesso',
        texto: 'MENSAGEM.SUCESSO_EDICAO_TURMA',
      });
    });
  });

  describe('comando de status em voo evita o segundo clique virar erro', () => {
    it('duas chamadas seguidas antes da resposta disparam apenas um PATCH', () => {
      const controlador = new Subject<void>();
      facade.reativar = vi.fn(() => controlador.asObservable());
      montar();

      componente.alternarStatus(TURMA_INATIVA);
      componente.alternarStatus(TURMA_INATIVA);

      expect(facade.reativar).toHaveBeenCalledTimes(1);

      controlador.next();
      controlador.complete();
    });

    it('desabilita o botão de status do card correspondente enquanto o comando está em voo', () => {
      const controlador = new Subject<void>();
      facade.reativar = vi.fn(() => controlador.asObservable());
      montar();

      componente.alternarStatus(TURMA_INATIVA);
      fixture.detectChanges();

      const cardInativa = fixture.debugElement
        .queryAll(By.directive(TurmaCardComponent))
        .find((el) => (el.componentInstance as TurmaCardComponent).turma.id === TURMA_INATIVA.id);
      const botaoStatus = cardInativa!.queryAll(By.css('.card__rodape button'))[1];

      expect(botaoStatus.nativeElement.disabled).toBe(true);

      controlador.next();
      controlador.complete();
      fixture.detectChanges();

      expect(botaoStatus.nativeElement.disabled).toBe(false);
    });
  });
});
