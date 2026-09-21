import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TurnoEnum } from '../../enums/turno.enum';
import { TurmaInterface } from '../../interfaces/entities/turma.interface';
import { TurmaCardComponent } from './turma-card.component';

const TURMA_MOCK: TurmaInterface = {
  id: 1,
  ativo: true,
  identificador: 'A',
  serie: 1,
  anoLetivo: 2026,
  turno: TurnoEnum.MATUTINO,
  capacidade: 30,
  totalAlunos: 10,
  totalDisciplinas: 5,
};

describe('TurmaCardComponent', () => {
  let fixture: ComponentFixture<TurmaCardComponent>;
  let componente: TurmaCardComponent;

  const artigo = () => fixture.debugElement.query(By.css('article'));
  const botoes = () => fixture.debugElement.queryAll(By.css('.card__rodape button'));
  const botaoAbrir = () => fixture.debugElement.query(By.css('.card__abrir'));

  const montar = (turma: TurmaInterface) => {
    componente.turma = turma;
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TurmaCardComponent] });
    fixture = TestBed.createComponent(TurmaCardComponent);
    componente = fixture.componentInstance;
  });

  it('o article não tem role nem tabindex', () => {
    montar(TURMA_MOCK);

    expect(artigo().nativeElement.hasAttribute('role')).toBe(false);
    expect(artigo().nativeElement.hasAttribute('tabindex')).toBe(false);
  });

  it('renderiza exatamente dois botões de ação no rodapé', () => {
    montar(TURMA_MOCK);

    expect(botoes().length).toBe(2);
  });

  it('o corpo do card é um botão nativo, alcançável por teclado', () => {
    montar(TURMA_MOCK);

    expect(botaoAbrir().nativeElement.tagName).toBe('BUTTON');
  });

  it('clicar no corpo do card emite a turma em @Output verDetalhes', () => {
    montar(TURMA_MOCK);
    const emitidas: TurmaInterface[] = [];
    componente.verDetalhes.subscribe((turma) => emitidas.push(turma));

    botaoAbrir().nativeElement.click();

    expect(emitidas).toEqual([TURMA_MOCK]);
  });

  it('clicar em editar não dispara verDetalhes', () => {
    montar(TURMA_MOCK);
    const detalhes: TurmaInterface[] = [];
    componente.verDetalhes.subscribe((turma) => detalhes.push(turma));

    botoes()[0].nativeElement.click();

    expect(detalhes).toEqual([]);
  });

  it('clicar em editar emite a turma em @Output editar', () => {
    montar(TURMA_MOCK);
    const emitidas: TurmaInterface[] = [];
    componente.editar.subscribe((turma) => emitidas.push(turma));

    botoes()[0].nativeElement.click();

    expect(emitidas).toEqual([TURMA_MOCK]);
  });

  it('clicar no botão de status emite a turma em @Output alternarStatus', () => {
    montar(TURMA_MOCK);
    const emitidas: TurmaInterface[] = [];
    componente.alternarStatus.subscribe((turma) => emitidas.push(turma));

    botoes()[1].nativeElement.click();

    expect(emitidas).toEqual([TURMA_MOCK]);
  });

  it('turma ativa mostra o texto de inativar', () => {
    montar({ ...TURMA_MOCK, ativo: true });

    expect(botoes()[1].nativeElement.textContent).toContain('TURMA.BOTOES.INATIVAR');
  });

  it('turma inativa mostra o texto de reativar', () => {
    montar({ ...TURMA_MOCK, ativo: false });

    expect(botoes()[1].nativeElement.textContent).toContain('TURMA.BOTOES.REATIVAR');
  });
});
