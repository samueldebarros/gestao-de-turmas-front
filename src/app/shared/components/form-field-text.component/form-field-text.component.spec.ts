import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ValorCampoTexto } from '../../types/valor-campo.type';
import { FormFieldTextComponent } from './form-field-text.component';

@Component({
  imports: [ReactiveFormsModule, FormFieldTextComponent],
  template: `<app-form-field-text
    [formControl]="controle"
    [control]="controle"
    [type]="tipo()"
    [label]="label()"
    [errorMessage]="mensagem()"
  />`,
})
class Hospede {
  readonly controle = new FormControl<ValorCampoTexto>('', Validators.required);
  readonly tipo = signal<'text' | 'number'>('text');
  readonly label = signal('');
  readonly mensagem = signal('');
}

describe('FormFieldTextComponent: o contrato do CVA', () => {
  let fixture: ComponentFixture<Hospede>;
  let hospede: Hospede;

  const input = () => fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;

  const digitar = (texto: string) => {
    input().value = texto;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Hospede);
    hospede = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('o form escreve no componente pelo writeValue', () => {
    it('setValue no controle aparece no input', () => {
      hospede.controle.setValue('Maria');
      fixture.detectChanges();

      expect(input().value).toBe('Maria');
    });

    it('null e undefined viram string vazia, não o texto "null"', () => {
      hospede.controle.setValue('Maria');
      fixture.detectChanges();

      hospede.controle.setValue(null);
      fixture.detectChanges();

      expect(input().value).toBe('');
    });

    it('número entra no input convertido para texto', () => {
      hospede.controle.setValue(42);
      fixture.detectChanges();

      expect(input().value).toBe('42');
    });
  });

  describe('o componente escreve no form pelo registerOnChange', () => {
    it('digitar atualiza o controle', () => {
      digitar('Maria');

      expect(hospede.controle.value).toBe('Maria');
    });

    it('o controle sai de pristine para dirty ao digitar', () => {
      expect(hospede.controle.dirty).toBe(false);

      digitar('Maria');

      expect(hospede.controle.dirty).toBe(true);
    });
  });

  describe('type number converte, em vez de entregar string', () => {
    beforeEach(() => {
      hospede.tipo.set('number');
      fixture.detectChanges();
    });

    it('dígitos viram number, não string', () => {
      digitar('42');

      expect(hospede.controle.value).toBe(42);
      expect(typeof hospede.controle.value).toBe('number');
    });

    it('campo apagado vira null, não zero nem string vazia', () => {
      digitar('42');

      digitar('');

      expect(hospede.controle.value).toBeNull();
    });

    it('texto não numérico vira null, não NaN', () => {
      digitar('abc');

      expect(hospede.controle.value).toBeNull();
    });

    it('em type text os mesmos dígitos permanecem string', () => {
      hospede.tipo.set('text');
      fixture.detectChanges();

      digitar('42');

      expect(hospede.controle.value).toBe('42');
    });
  });

  describe('setDisabledState', () => {
    it('disable no controle desabilita o input', () => {
      hospede.controle.disable();
      fixture.detectChanges();

      expect(input().disabled).toBe(true);
    });

    it('enable devolve o input', () => {
      hospede.controle.disable();
      fixture.detectChanges();

      hospede.controle.enable();
      fixture.detectChanges();

      expect(input().disabled).toBe(false);
    });
  });

  describe('registerOnTouched', () => {
    it('o blur marca o controle como touched', () => {
      expect(hospede.controle.touched).toBe(false);

      input().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(hospede.controle.touched).toBe(true);
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

    it('inválido e tocado mostra o erro com role alert', () => {
      input().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(erro()).not.toBeNull();
      expect((erro().nativeElement as HTMLElement).textContent?.trim()).toBe(
        'VALIDACAO.OBRIGATORIO',
      );
      expect(input().className).toContain('input-error');
    });

    it('válido e tocado não mostra erro', () => {
      digitar('Maria');
      input().dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(erro()).toBeNull();
    });
  });

  describe('acessibilidade do rótulo', () => {
    it('sem label, nenhum elemento label é renderizado', () => {
      expect(fixture.debugElement.query(By.css('label'))).toBeNull();
    });

    it('com label, o for do label aponta para o id do input', () => {
      hospede.label.set('Nome');
      fixture.detectChanges();

      const label = fixture.debugElement.query(By.css('label')).nativeElement as HTMLLabelElement;

      expect(label.getAttribute('for')).toBe(input().id);
      expect(input().id).not.toBe('');
    });
  });
});
