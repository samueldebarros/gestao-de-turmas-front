import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AlunoFacadeService } from '../../../core/facades/aluno-facade.service';
import { DocenteFacadeService } from '../../../core/facades/docente-facade.service';
import { TurmaFacadeService } from '../../../core/facades/turma-facade.service';
import { FeatureFlagsService } from '../../../core/services/feature-flags.service';
import { TurmaCadastroComponent } from './turma-cadastro.component';

const PAGINA_VAZIA = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

const PASSO_ALUNOS = 2;

describe('TurmaCadastro: flag importarCsv', () => {
  let fixture: ComponentFixture<TurmaCadastroComponent>;

  const alunoFacadeFake = () => ({
    resultado$: of(PAGINA_VAZIA),
    mudarPagina: vi.fn(),
  });

  const montarNoPassoDeAlunos = (importarCsv: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DocenteFacadeService,
          useValue: { docentes$: of({ status: 'ok', itens: [] }) },
        },
        { provide: TurmaFacadeService, useValue: { adicionar: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: FeatureFlagsService, useValue: { importarCsv: signal(importarCsv) } },
      ],
    });

    TestBed.overrideComponent(TurmaCadastroComponent, {
      add: { providers: [{ provide: AlunoFacadeService, useValue: alunoFacadeFake() }] },
    });

    fixture = TestBed.createComponent(TurmaCadastroComponent);
    fixture.componentInstance.passoAtual = PASSO_ALUNOS;
    fixture.detectChanges();
  };

  const importador = () => fixture.debugElement.queryAll(By.css('app-importar-alunos'));

  const passoManual = () => fixture.debugElement.queryAll(By.css('app-passo-alunos'));

  it('ligada, oferece o importador no passo de alunos', () => {
    montarNoPassoDeAlunos(true);

    expect(importador()).toHaveLength(1);
  });

  it('desligada, remove o importador do DOM', () => {
    montarNoPassoDeAlunos(false);

    expect(importador()).toHaveLength(0);
  });

  it('desligada, mantem a selecao manual de alunos no mesmo passo', () => {
    montarNoPassoDeAlunos(false);

    expect(passoManual()).toHaveLength(1);
  });
});
