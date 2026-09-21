import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlunoFacadeService } from '../../../core/facades/aluno-facade.service';
import { DocenteFacadeService } from '../../../core/facades/docente-facade.service';
import { TurmaFacadeService } from '../../../core/facades/turma-facade.service';
import { TurnoEnum } from '../../../shared/enums/turno.enum';
import { TurmaCadastroComponent } from './turma-cadastro.component';

const PAGINA_VAZIA = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

const PASSO_INFORMACOES = 0;
const PASSO_DISCIPLINAS = 1;
const PASSO_ALUNOS = 2;

describe('TurmaCadastro: navegação e seleção', () => {
  let fixture: ComponentFixture<TurmaCadastroComponent>;
  let componente: TurmaCadastroComponent;
  let alunoFacadeFake: { resultado$: unknown; mudarPagina: ReturnType<typeof vi.fn> };
  let turmaFacadeFake: { adicionar: ReturnType<typeof vi.fn> };
  let routerFake: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    alunoFacadeFake = { resultado$: of(PAGINA_VAZIA), mudarPagina: vi.fn() };
    turmaFacadeFake = { adicionar: vi.fn(() => of(void 0)) };
    routerFake = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DocenteFacadeService,
          useValue: { docentes$: of({ status: 'ok', itens: [] }) },
        },
        { provide: TurmaFacadeService, useValue: turmaFacadeFake },
        { provide: Router, useValue: routerFake },
      ],
    });

    TestBed.overrideComponent(TurmaCadastroComponent, {
      add: { providers: [{ provide: AlunoFacadeService, useValue: alunoFacadeFake }] },
    });
    TestBed.overrideTemplate(TurmaCadastroComponent, '');

    fixture = TestBed.createComponent(TurmaCadastroComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('não avança enquanto as informações da turma estão inválidas', () => {
    componente.avancar();

    expect(componente.passoAtual).toBe(PASSO_INFORMACOES);
  });

  it('avança quando o passo de disciplinas passa a ter alocação', () => {
    componente.passoAtual = PASSO_DISCIPLINAS;
    expect(componente.podeAvancar).toBe(false);

    componente.setAlocacoes([3]);

    expect(componente.podeAvancar).toBe(true);
    componente.avancar();
    expect(componente.passoAtual).toBe(PASSO_ALUNOS);
  });

  it('não passa do último passo', () => {
    componente.passoAtual = PASSO_ALUNOS;

    componente.avancar();

    expect(componente.passoAtual).toBe(PASSO_ALUNOS);
  });

  it('não volta antes do primeiro passo', () => {
    componente.voltar();

    expect(componente.passoAtual).toBe(PASSO_INFORMACOES);
  });

  it('volta um passo por vez', () => {
    componente.passoAtual = PASSO_ALUNOS;

    componente.voltar();

    expect(componente.passoAtual).toBe(PASSO_DISCIPLINAS);
  });

  it('alterna o mesmo aluno adicionando e removendo', () => {
    componente.alternarAluno(9);
    expect(componente.alunosIds.value).toEqual([9]);

    componente.alternarAluno(9);
    expect(componente.alunosIds.value).toEqual([]);
  });

  it('pré-seleciona importados sem duplicar quem já estava selecionado', () => {
    componente.alternarAluno(4);

    componente.preSelecionarImportados({
      totalCriados: 2,
      criados: [
        { id: 4, matricula: '1', cpf: '52998224725' },
        { id: 5, matricula: '2', cpf: '11144477735' },
      ],
    });

    expect(componente.alunosIds.value).toEqual([4, 5]);
    expect(componente.alerta().tipo).toBe('sucesso');
  });

  it('delega a troca de página ao facade de alunos', () => {
    componente.mudarPaginaAlunos(3);

    expect(alunoFacadeFake.mudarPagina).toHaveBeenCalledWith(3);
  });

  it('não envia o cadastro com o formulário inválido', () => {
    componente.concluir();

    expect(turmaFacadeFake.adicionar).not.toHaveBeenCalled();
    expect(componente.cadastroForm.touched).toBe(true);
  });

  it('não aceita capacidade acima do limite máximo', () => {
    const controle = componente.informacoesGroup.get('capacidade');
    controle?.setValue(300);

    expect(controle?.valid).toBe(false);
  });

  it('não aceita identificador com mais de um caractere', () => {
    const controle = componente.informacoesGroup.get('identificador');
    controle?.setValue('AB');

    expect(controle?.valid).toBe(false);
  });

  it('não aceita ano letivo abaixo do mínimo permitido', () => {
    const controle = componente.informacoesGroup.get('anoLetivo');
    controle?.setValue(1999);

    expect(controle?.valid).toBe(false);
  });

  it('marca os controles do passo e informa as causas quando as informações estão inválidas', () => {
    componente.avancar();

    expect(componente.passoAtual).toBe(PASSO_INFORMACOES);
    expect(componente.informacoesGroup.touched).toBe(true);
    expect(componente.alerta().detalhes?.length).toBeGreaterThan(0);
  });

  it('avança quando as informações da turma são válidas', () => {
    componente.informacoesGroup.setValue({
      identificador: 'A',
      serie: 1,
      anoLetivo: 2026,
      capacidade: 30,
      turno: TurnoEnum.MATUTINO,
    });

    componente.avancar();

    expect(componente.passoAtual).toBe(PASSO_DISCIPLINAS);
  });

  it('exibe a chave genérica de regra de negócio quando o cadastro falha com 422 sem codigo', () => {
    turmaFacadeFake.adicionar = vi.fn(() =>
      throwError(() => ({
        status: 422,
        error: {
          error: new SyntaxError('...'),
          text: 'Já existe uma turma com essa combinação de Identificador, Série e Ano letivo',
        },
      })),
    );
    componente.informacoesGroup.setValue({
      identificador: 'A',
      serie: 1,
      anoLetivo: 2026,
      capacidade: 30,
      turno: TurnoEnum.MATUTINO,
    });
    componente.setAlocacoes([3]);

    componente.concluir();

    expect(componente.alerta()).toEqual({
      visivel: true,
      tipo: 'erro',
      texto: 'MENSAGEM.ERRO_REGRA_NEGOCIO_TURMA',
    });
    expect(routerFake.navigate).not.toHaveBeenCalled();
  });

  it('disciplinas$ repassa o estado de erro quando a fonte de docentes falha, exibindo o aviso e escondendo o passo', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DocenteFacadeService, useValue: { docentes$: of({ status: 'erro' }) } },
        { provide: TurmaFacadeService, useValue: turmaFacadeFake },
        { provide: Router, useValue: routerFake },
      ],
    });
    TestBed.overrideComponent(TurmaCadastroComponent, {
      add: { providers: [{ provide: AlunoFacadeService, useValue: alunoFacadeFake }] },
    });

    const novaFixture = TestBed.createComponent(TurmaCadastroComponent);
    novaFixture.componentInstance.passoAtual = PASSO_DISCIPLINAS;
    novaFixture.detectChanges();

    expect((novaFixture.nativeElement as HTMLElement).textContent).toContain(
      'TURMA.CADASTRO.ERRO_DISCIPLINAS',
    );
    expect(novaFixture.debugElement.queryAll(By.css('app-passo-disciplinas'))).toHaveLength(0);
  });

  it('cadastro recusado com codigo e params interpola os dois valores distintos no alerta do wizard', () => {
    turmaFacadeFake.adicionar = vi.fn(() =>
      throwError(() => ({
        status: 422,
        error: {
          codigo: 'TURMA_CAPACIDADE_ATINGIDA',
          params: { capacidade: 50, alunosAtivos: 45 },
          mensagem: 'A turma atingiu a capacidade máxima.',
        },
      })),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DocenteFacadeService,
          useValue: { docentes$: of({ status: 'ok', itens: [] }) },
        },
        { provide: TurmaFacadeService, useValue: turmaFacadeFake },
        { provide: Router, useValue: routerFake },
      ],
    });
    TestBed.overrideComponent(TurmaCadastroComponent, {
      add: { providers: [{ provide: AlunoFacadeService, useValue: alunoFacadeFake }] },
    });
    const traducao = TestBed.inject(TranslateService);
    traducao.setTranslation('pt-BR', {
      ERRO_NEGOCIO: {
        TURMA_CAPACIDADE_ATINGIDA:
          'A turma atingiu a capacidade máxima. Capacidade: {{capacidade}}; alunos ativos: {{alunosAtivos}}.',
      },
    });
    traducao.use('pt-BR');

    const novaFixture = TestBed.createComponent(TurmaCadastroComponent);
    const novoComponente = novaFixture.componentInstance;
    novoComponente.informacoesGroup.setValue({
      identificador: 'A',
      serie: 1,
      anoLetivo: 2026,
      capacidade: 30,
      turno: TurnoEnum.MATUTINO,
    });
    novoComponente.setAlocacoes([3]);
    novaFixture.detectChanges();

    novoComponente.concluir();
    novaFixture.detectChanges();

    const texto = (novaFixture.nativeElement as HTMLElement).querySelector(
      '.caixa-mensagem',
    )?.textContent;
    expect(texto).toContain('Capacidade: 50');
    expect(texto).toContain('alunos ativos: 45');
  });
});
