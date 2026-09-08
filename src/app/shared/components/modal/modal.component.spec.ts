import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Modal } from './modal.component';

describe('Modal', () => {
  let fixture: ComponentFixture<Modal>;

  const dialog = () =>
    fixture.debugElement.query(By.css('dialog')).nativeElement as HTMLDialogElement;

  const botaoFechar = () =>
    fixture.debugElement.query(By.css('button[aria-label="Fechar"]'))
      .nativeElement as HTMLButtonElement;

  const abrir = () => {
    fixture.componentRef.setInput('visivel', true);
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Modal);
    fixture.detectChanges();
  });

  describe('a entrada controla o dialog nativo', () => {
    it('nasce fechado', () => {
      expect(dialog().open).toBe(false);
    });

    it('visivel true abre o dialog', () => {
      abrir();

      expect(dialog().open).toBe(true);
    });

    it('voltar visivel para false fecha o dialog', () => {
      abrir();

      fixture.componentRef.setInput('visivel', false);
      fixture.detectChanges();

      expect(dialog().open).toBe(false);
    });

    it('o título entra no cabeçalho', () => {
      fixture.componentRef.setInput('titulo', 'Cadastrar aluno');
      fixture.detectChanges();

      const titulo = fixture.debugElement.query(By.css('h3')).nativeElement as HTMLElement;

      expect(titulo.textContent?.trim()).toBe('Cadastrar aluno');
    });
  });

  describe('o que o componente emite', () => {
    it('o botão fechar emite false', () => {
      abrir();
      const emitidos: boolean[] = [];
      fixture.componentInstance.visivelChange.subscribe((valor) => emitidos.push(valor));

      botaoFechar().click();

      expect(emitidos).toEqual([false]);
    });

    it('o cancel do dialog, disparado pelo Esc, também emite false', () => {
      abrir();
      const emitidos: boolean[] = [];
      fixture.componentInstance.visivelChange.subscribe((valor) => emitidos.push(valor));

      dialog().dispatchEvent(new Event('cancel'));

      expect(emitidos).toEqual([false]);
    });
  });

  describe('o ciclo do two-way manual', () => {
    it('sozinho o componente não se fecha, quem decide é o pai', () => {
      abrir();

      botaoFechar().click();
      fixture.detectChanges();

      expect(fixture.componentInstance.visivel).toBe(true);
      expect(dialog().open).toBe(true);
    });

    it('quando o pai devolve a entrada, o ciclo fecha e o dialog fecha com ele', () => {
      abrir();
      fixture.componentInstance.visivelChange.subscribe((valor) => {
        fixture.componentRef.setInput('visivel', valor);
        fixture.detectChanges();
      });

      botaoFechar().click();

      expect(fixture.componentInstance.visivel).toBe(false);
      expect(dialog().open).toBe(false);
    });
  });
});
