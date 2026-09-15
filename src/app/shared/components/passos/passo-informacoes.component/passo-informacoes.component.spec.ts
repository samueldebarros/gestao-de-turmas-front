import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PassoInformacoesComponent } from './passo-informacoes.component';
import { TurnoEnum } from '../../../enums/turno.enum';
import {
  validadoresAnoLetivoTurma,
  validadoresCapacidadeTurma,
  validadoresIdentificadorTurma,
} from '../../../constants/limites-turma.const';

function criarFormGroup(): FormGroup {
  return new FormGroup({
    identificador: new FormControl('', {
      nonNullable: true,
      validators: validadoresIdentificadorTurma,
    }),
    serie: new FormControl<number | null>(null, Validators.required),
    anoLetivo: new FormControl<number | null>(null, validadoresAnoLetivoTurma),
    capacidade: new FormControl<number | null>(null, validadoresCapacidadeTurma),
    turno: new FormControl<TurnoEnum | null>(null, Validators.required),
  });
}

@Component({
  imports: [ReactiveFormsModule, PassoInformacoesComponent],
  template: `<app-passo-informacoes [formGroup]="formGroup()" />`,
})
class Hospede {
  readonly formGroup = signal<FormGroup>(criarFormGroup());
}

describe('PassoInformacoesComponent: a mensagem de erro segue o validador que falhou', () => {
  let fixture: ComponentFixture<Hospede>;
  let hospede: Hospede;

  const camposTexto = () => fixture.debugElement.queryAll(By.css('app-form-field-text'));

  const mensagemDeErro = (indice: number): string =>
    camposTexto()[indice].query(By.css('.error-message'))?.nativeElement.textContent?.trim() ?? '';

  const marcarTocadoEAtualizar = (nomeControle: string, valor: unknown) => {
    const controle = hospede.formGroup().get(nomeControle)!;
    controle.setValue(valor);
    controle.markAsTouched();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Hospede] });
    fixture = TestBed.createComponent(Hospede);
    hospede = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('capacidade zero tocada mostra o valor mínimo, não obrigatório', () => {
    marcarTocadoEAtualizar('capacidade', 0);

    const mensagem = mensagemDeErro(2);
    expect(mensagem).toContain('VALIDACAO.VALOR_MINIMO');
    expect(mensagem).not.toContain('VALIDACAO.OBRIGATORIO');
  });

  it('capacidade acima do máximo tocada mostra o valor máximo', () => {
    marcarTocadoEAtualizar('capacidade', 300);

    expect(mensagemDeErro(2)).toContain('VALIDACAO.VALOR_MAXIMO');
  });

  it('identificador só com espaços tocado mostra em branco', () => {
    marcarTocadoEAtualizar('identificador', '   ');

    expect(mensagemDeErro(0)).toContain('VALIDACAO.EM_BRANCO');
  });

  it('identificador acima do tamanho máximo tocado mostra tamanho máximo', () => {
    marcarTocadoEAtualizar('identificador', 'AB');

    expect(mensagemDeErro(0)).toContain('VALIDACAO.TAMANHO_MAXIMO');
  });

  it('campo vazio e tocado mostra obrigatório', () => {
    hospede.formGroup().get('identificador')!.markAsTouched();
    fixture.detectChanges();

    expect(mensagemDeErro(0)).toContain('VALIDACAO.OBRIGATORIO');
  });
});
