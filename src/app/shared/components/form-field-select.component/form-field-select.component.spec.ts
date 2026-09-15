import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { SelectOptionInterface } from '../../interfaces/ui/select-option.interface';
import { ValorCampoSelect } from '../../types/valor-campo.type';
import { FormFieldSelectComponent } from './form-field-select.component';

const OPCOES_NUMERICAS: SelectOptionInterface[] = [
  { value: 1, label: 'SEXO.MASCULINO' },
  { value: 2, label: 'SEXO.FEMININO' },
];

const OPCOES_BOOLEANAS: SelectOptionInterface[] = [
  { value: true, label: 'STATUS.ATIVO' },
  { value: false, label: 'STATUS.INATIVO' },
];

@Component({
  imports: [ReactiveFormsModule, FormFieldSelectComponent],
  template: `<app-form-field-select
    [formControl]="controle"
    [control]="controle"
    [options]="opcoes()"
    [label]="label()"
    [errorMessage]="mensagem()"
  />`,
})
class Hospede {
  readonly controle = new FormControl<ValorCampoSelect>(null, Validators.required);
  readonly opcoes = signal<SelectOptionInterface[]>(OPCOES_NUMERICAS);
  readonly label = signal('');
  readonly mensagem = signal('');
}

describe('FormFieldSelectComponent: o contrato do CVA', () => {
  let fixture: ComponentFixture<Hospede>;
  let hospede: Hospede;

  const select = () =>
    fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;

  const escolher = (valorNoHtml: string) => {
    select().value = valorNoHtml;
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Hospede);
    hospede = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('as opções renderizadas', () => {
    it('o placeholder é a primeira opção e não é selecionável', () => {
      const opcoes = fixture.debugElement.queryAll(By.css('option'));

      expect((opcoes[0].nativeElement as HTMLOptionElement).disabled).toBe(true);
      expect((opcoes[0].nativeElement as HTMLOptionElement).value).toBe('');
    });

    it('uma opção por item, depois do placeholder', () => {
      const opcoes = fixture.debugElement.queryAll(By.css('option'));

      expect(opcoes).toHaveLength(3);
      expect((opcoes[1].nativeElement as HTMLOptionElement).value).toBe('1');
      expect((opcoes[2].nativeElement as HTMLOptionElement).value).toBe('2');
    });
  });

  describe('o componente escreve no form preservando o tipo do valor', () => {
    it('opção numérica devolve number, não a string do HTML', () => {
      escolher('2');

      expect(hospede.controle.value).toBe(2);
      expect(typeof hospede.controle.value).toBe('number');
    });

    it('opção booleana devolve boolean, não a string "true"', () => {
      hospede.opcoes.set(OPCOES_BOOLEANAS);
      fixture.detectChanges();

      escolher('false');

      expect(hospede.controle.value).toBe(false);
      expect(typeof hospede.controle.value).toBe('boolean');
    });

    it('valor sem opção correspondente devolve null, não a string crua', () => {
      escolher('999');

      expect(hospede.controle.value).toBeNull();
    });

    it('escolher já marca o controle como touched, sem esperar o blur', () => {
      expect(hospede.controle.touched).toBe(false);

      escolher('1');

      expect(hospede.controle.touched).toBe(true);
    });
  });

  describe('o form escreve no componente pelo writeValue', () => {
    it('setValue seleciona a opção correspondente', () => {
      hospede.controle.setValue(2);
      fixture.detectChanges();

      expect(select().value).toBe('2');
    });

    it('null volta para o placeholder', () => {
      hospede.controle.setValue(2);
      fixture.detectChanges();

      hospede.controle.setValue(null);
      fixture.detectChanges();

      expect(select().value).toBe('');
    });
  });

  describe('setDisabledState', () => {
    it('disable no controle desabilita o select', () => {
      hospede.controle.disable();
      fixture.detectChanges();

      expect(select().disabled).toBe(true);
    });
  });

  describe('a mensagem de erro só aparece depois do toque', () => {
    const erro = () => fixture.debugElement.query(By.css('.error-message'));

    beforeEach(() => {
      hospede.mensagem.set('VALIDACAO.OBRIGATORIO');
      fixture.detectChanges();
    });

    it('inválido e intocado não mostra erro', () => {
      expect(hospede.controle.invalid).toBe(true);
      expect(erro()).toBeNull();
    });

    it('o blur marca touched e acende o erro', () => {
      select().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(hospede.controle.touched).toBe(true);
      expect(erro()).not.toBeNull();
      expect(select().className).toContain('select-error');
    });

    it('a mensagem de erro é anunciada por leitor de tela', () => {
      select().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(erro().nativeElement.getAttribute('role')).toBe('alert');
    });
  });
});
