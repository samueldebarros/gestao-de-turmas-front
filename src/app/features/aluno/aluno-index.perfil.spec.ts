import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { AlunoFacadeService } from '../../core/facades/aluno-facade.service';
import { AuthFacadeService } from '../../core/facades/auth-facade.service';
import { FeriadoFacadeService } from '../../core/facades/feriado-facade.service';
import { FeatureFlagsService } from '../../core/services/feature-flags.service';
import { SexoEnum } from '../../shared/enums/sexo.enum';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { PapelUsuario } from '../../shared/types/papel-usuario.type';
import { AlunoIndex } from './aluno-index.component';

const PAGINA_VAZIA = { itens: [], paginaAtual: 1, totalPaginas: 0, totalResultados: 0 };

const ALUNO: AlunoInterface = {
  id: 7,
  matricula: '2026001',
  nome: 'Ana Souza',
  cpf: '52998224725',
  email: 'ana.souza@escola.com',
  sexo: SexoEnum.FEMININO,
  dataNascimento: new Date(2008, 2, 12),
  ativo: true,
};

const PAGINA_COM_ALUNO = { itens: [ALUNO], paginaAtual: 1, totalPaginas: 1, totalResultados: 1 };

describe('AlunoIndex: mutações escondidas por papel', () => {
  let fixture: ComponentFixture<AlunoIndex>;

  const montar = (papel: PapelUsuario, resultado: unknown = PAGINA_VAZIA) => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AlunoFacadeService,
          useValue: {
            resultado$: of(resultado),
            ordenacaoAtual$: of(null),
            aplicarFiltros: vi.fn(),
            mudarPagina: vi.fn(),
            ordenarPor: vi.fn(),
            buscarSugestoes: vi.fn(() => of([])),
          },
        },
        { provide: FeriadoFacadeService, useValue: { feriadosAnoAtual$: of([]) } },
        { provide: FeatureFlagsService, useValue: { importarCsv: signal(true) } },
        { provide: AuthFacadeService, useValue: { papel: signal<PapelUsuario | null>(papel) } },
      ],
    });

    fixture = TestBed.createComponent(AlunoIndex);
    fixture.detectChanges();
  };

  describe('Docente', () => {
    beforeEach(() => montar('Docente'));

    it('não vê o bloco de ações do topo', () => {
      expect(fixture.debugElement.query(By.css('.acoes-topo'))).toBeNull();
    });

    it('não vê o importador de CSV, mesmo com a flag ligada', () => {
      expect(fixture.debugElement.query(By.css('app-importar-alunos'))).toBeNull();
    });

    it('não vê o cabeçalho de ações da tabela', () => {
      expect(fixture.debugElement.query(By.css('.cabecalho-acoes'))).toBeNull();
    });

    it('não vê o autocomplete', () => {
      expect(fixture.debugElement.query(By.css('app-autocomplete'))).toBeNull();
    });
  });

  describe('Coordenador', () => {
    beforeEach(() => montar('Coordenador'));

    it('vê o bloco de ações do topo', () => {
      expect(fixture.debugElement.query(By.css('.acoes-topo'))).not.toBeNull();
    });

    it('vê o importador de CSV com a flag ligada', () => {
      expect(fixture.debugElement.query(By.css('app-importar-alunos'))).not.toBeNull();
    });

    it('vê o cabeçalho de ações da tabela', () => {
      expect(fixture.debugElement.query(By.css('.cabecalho-acoes'))).not.toBeNull();
    });

    it('selecionar no autocomplete abre o modal de edição', () => {
      const autocomplete = fixture.debugElement.query(By.css('app-autocomplete'));
      autocomplete.triggerEventHandler('selecionado', ALUNO);
      fixture.detectChanges();

      const dialogEdicao = fixture.debugElement.query(By.css('app-modal dialog'))
        .nativeElement as HTMLDialogElement;
      expect(dialogEdicao.open).toBe(true);
    });
  });

  describe('ações de linha, com um aluno ativo na página', () => {
    it('Coordenador vê Editar e Inativar na linha', () => {
      montar('Coordenador', PAGINA_COM_ALUNO);

      const rotulos = fixture.debugElement
        .queryAll(By.css('.celula-acoes app-botao button'))
        .map((botao) => (botao.nativeElement as HTMLElement).textContent?.trim());

      expect(rotulos).toEqual(
        expect.arrayContaining([
          expect.stringContaining('ALUNO.BOTOES.EDITAR'),
          expect.stringContaining('ALUNO.BOTOES.INATIVAR'),
        ]),
      );
    });

    it('Docente não vê nenhum botão na linha', () => {
      montar('Docente', PAGINA_COM_ALUNO);

      expect(fixture.debugElement.queryAll(By.css('.celula-acoes app-botao button'))).toHaveLength(
        0,
      );
    });
  });
});
