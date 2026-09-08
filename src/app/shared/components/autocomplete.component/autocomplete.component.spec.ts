import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of, Subject, throwError } from 'rxjs';
import { EntidadeBaseInterface } from '../../interfaces/entities/entidade-base.interface';
import { AutocompleteComponent } from './autocomplete.component';

interface Aluno extends EntidadeBaseInterface {
  matricula: string;
  nome: string;
}

const ANA: Aluno = { id: 1, matricula: '2026001', nome: 'Ana Souza' };
const ANDRE: Aluno = { id: 2, matricula: '2026002', nome: 'André Lima' };

@Component({
  imports: [AutocompleteComponent],
  template: `<app-autocomplete
    [buscar]="buscar"
    [rotulo]="rotulo"
    [minCaracteres]="minCaracteres()"
    [debounceMs]="debounceMs()"
    (selecionado)="aoSelecionar($event)"
  />`,
})
class Hospede {
  readonly minCaracteres = signal(3);
  readonly debounceMs = signal(300);
  readonly termosBuscados: string[] = [];
  readonly selecionados: Aluno[] = [];
  resposta: (termo: string) => Observable<Aluno[]> = () => of([ANA, ANDRE]);

  readonly buscar = (termo: string): Observable<Aluno[]> => {
    this.termosBuscados.push(termo);
    return this.resposta(termo);
  };

  readonly rotulo = (aluno: Aluno): string => `${aluno.matricula} — ${aluno.nome}`;

  aoSelecionar(aluno: Aluno): void {
    this.selecionados.push(aluno);
  }
}

describe('AutocompleteComponent', () => {
  let fixture: ComponentFixture<Hospede>;
  let hospede: Hospede;

  const input = () =>
    fixture.debugElement.query(By.css('input[role="combobox"]')).nativeElement as HTMLInputElement;

  const lista = () => fixture.debugElement.query(By.css('ul.sugestoes'));

  const opcoes = () => fixture.debugElement.queryAll(By.css('li.sugestao'));

  const digitar = (texto: string) => {
    input().value = texto;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const passarDebounce = () => {
    vi.advanceTimersByTime(hospede.debounceMs());
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Hospede);
    hospede = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('minCaracteres barra a busca', () => {
    it('abaixo do mínimo não busca nem abre a lista', () => {
      digitar('an');
      passarDebounce();

      expect(hospede.termosBuscados).toEqual([]);
      expect(lista()).toBeNull();
    });

    it('no mínimo, busca', () => {
      digitar('ana');
      passarDebounce();

      expect(hospede.termosBuscados).toEqual(['ana']);
    });

    it('descer abaixo do mínimo fecha a lista já aberta', () => {
      digitar('ana');
      passarDebounce();
      expect(lista()).not.toBeNull();

      digitar('an');

      expect(lista()).toBeNull();
    });
  });

  describe('o debounce agrupa a digitação', () => {
    it('três teclas rápidas produzem uma busca só, com o último termo', () => {
      digitar('ana');
      digitar('anas');
      digitar('anasta');

      passarDebounce();

      expect(hospede.termosBuscados).toEqual(['anasta']);
    });

    it('antes do debounce vencer, nenhuma busca saiu', () => {
      digitar('ana');

      vi.advanceTimersByTime(hospede.debounceMs() - 1);
      fixture.detectChanges();

      expect(hospede.termosBuscados).toEqual([]);
    });

    it('o termo é aparado antes de ir para a busca', () => {
      digitar('  ana  ');
      passarDebounce();

      expect(hospede.termosBuscados).toEqual(['ana']);
    });

    it('digitar o mesmo termo de novo não busca duas vezes', () => {
      digitar('ana');
      passarDebounce();

      digitar('ana ');
      passarDebounce();

      expect(hospede.termosBuscados).toEqual(['ana']);
    });
  });

  describe('as sugestões renderizadas', () => {
    it('uma opção por item, com o rótulo que o pai definiu', () => {
      digitar('ana');
      passarDebounce();

      expect(opcoes()).toHaveLength(2);
      expect((opcoes()[0].nativeElement as HTMLElement).textContent?.trim()).toBe(
        '2026001 — Ana Souza',
      );
    });

    it('enquanto a resposta não chega, mostra o estado de carregando', () => {
      const resposta$ = new Subject<Aluno[]>();
      hospede.resposta = () => resposta$.asObservable();

      digitar('ana');
      passarDebounce();

      expect((lista().nativeElement as HTMLElement).textContent).toContain('AUTOCOMPLETE.BUSCANDO');

      resposta$.next([ANA]);
      fixture.detectChanges();

      expect((lista().nativeElement as HTMLElement).textContent).not.toContain(
        'AUTOCOMPLETE.BUSCANDO',
      );
      expect(opcoes()).toHaveLength(1);
    });

    it('resposta vazia mostra a mensagem de nenhum resultado', () => {
      hospede.resposta = () => of([]);

      digitar('ana');
      passarDebounce();

      expect(opcoes()).toHaveLength(0);
      expect((lista().nativeElement as HTMLElement).textContent).toContain(
        'AUTOCOMPLETE.NENHUM_RESULTADO',
      );
    });

    it('erro na busca não derruba o componente: a lista fica vazia', () => {
      hospede.resposta = () => throwError(() => new Error('500'));

      digitar('ana');

      expect(() => passarDebounce()).not.toThrow();
      expect(opcoes()).toHaveLength(0);
    });

    it('depois de um erro, uma nova busca continua funcionando', () => {
      hospede.resposta = () => throwError(() => new Error('500'));
      digitar('ana');
      passarDebounce();

      hospede.resposta = () => of([ANA]);
      digitar('andre');
      passarDebounce();

      expect(opcoes()).toHaveLength(1);
    });

    it('aria-expanded acompanha a abertura da lista', () => {
      expect(input().getAttribute('aria-expanded')).toBe('false');

      digitar('ana');
      passarDebounce();

      expect(input().getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('seleção', () => {
    beforeEach(() => {
      digitar('ana');
      passarDebounce();
    });

    it('clicar numa sugestão emite o item ao pai', () => {
      (opcoes()[1].nativeElement as HTMLElement).click();
      fixture.detectChanges();

      expect(hospede.selecionados).toEqual([ANDRE]);
    });

    it('a seleção preenche o campo com o rótulo e fecha a lista', () => {
      (opcoes()[0].nativeElement as HTMLElement).click();
      fixture.detectChanges();

      expect(input().value).toBe('2026001 — Ana Souza');
      expect(lista()).toBeNull();
    });

    it('a seleção não dispara nova busca com o rótulo preenchido', () => {
      (opcoes()[0].nativeElement as HTMLElement).click();
      fixture.detectChanges();

      passarDebounce();

      expect(hospede.termosBuscados).toEqual(['ana']);
    });
  });

  describe('teclado', () => {
    beforeEach(() => {
      digitar('ana');
      passarDebounce();
    });

    const teclar = (key: string) => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      fixture.detectChanges();
    };

    it('seta para baixo ativa a primeira sugestão', () => {
      teclar('ArrowDown');

      expect((opcoes()[0].nativeElement as HTMLElement).className).toContain('ativa');
    });

    it('Enter na sugestão ativa seleciona', () => {
      teclar('ArrowDown');
      teclar('ArrowDown');
      teclar('Enter');

      expect(hospede.selecionados).toEqual([ANDRE]);
    });

    it('seta para cima volta na lista, sem passar do primeiro', () => {
      teclar('ArrowDown');
      teclar('ArrowDown');
      expect((opcoes()[1].nativeElement as HTMLElement).className).toContain('ativa');

      teclar('ArrowUp');
      expect((opcoes()[0].nativeElement as HTMLElement).className).toContain('ativa');

      teclar('ArrowUp');
      expect((opcoes()[0].nativeElement as HTMLElement).className).toContain('ativa');
    });

    it('seta para baixo não passa do último', () => {
      teclar('ArrowDown');
      teclar('ArrowDown');
      teclar('ArrowDown');

      expect((opcoes()[1].nativeElement as HTMLElement).className).toContain('ativa');
    });

    it('Enter sem sugestão ativa não seleciona nada', () => {
      teclar('Enter');

      expect(hospede.selecionados).toEqual([]);
    });

    it('Escape fecha a lista', () => {
      teclar('Escape');

      expect(lista()).toBeNull();
    });
  });

  describe('clique fora', () => {
    it('fecha a lista aberta', () => {
      digitar('ana');
      passarDebounce();

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(lista()).toBeNull();
    });
  });
});
