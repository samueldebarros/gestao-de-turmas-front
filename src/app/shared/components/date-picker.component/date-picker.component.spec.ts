import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { DatePickerComponent } from './date-picker.component';

@Component({
  imports: [ReactiveFormsModule, DatePickerComponent],
  template: `<app-date-picker
    [formControl]="controle"
    [control]="controle"
    [feriados]="feriados()"
    [min]="min()"
    [max]="max()"
    [errorMessage]="mensagem()"
  />`,
})
class Hospede {
  readonly controle = new FormControl<string | null>('', Validators.required);
  readonly feriados = signal<string[]>([]);
  readonly min = signal<string | undefined>(undefined);
  readonly max = signal<string | undefined>(undefined);
  readonly mensagem = signal('');
}

describe('DatePickerComponent: o contrato yyyy-MM-dd', () => {
  let fixture: ComponentFixture<Hospede>;
  let hospede: Hospede;

  const entrada = () =>
    fixture.debugElement.query(By.css('input.gatilho')).nativeElement as HTMLInputElement;

  const iconeCalendario = () =>
    fixture.debugElement.query(By.css('.icone-calendario')).nativeElement as HTMLButtonElement;

  const calendario = () => fixture.debugElement.query(By.css('.calendario'));

  const cabecalho = () =>
    fixture.debugElement.query(By.css('.cabecalho .titulo')).nativeElement as HTMLButtonElement;

  const abrir = () => {
    iconeCalendario().click();
    fixture.detectChanges();
  };

  const diasDoMes = () => fixture.debugElement.queryAll(By.css('.grade .dia:not(.fora-do-mes)'));

  const dia = (numero: number) =>
    diasDoMes().find(
      (d) => (d.nativeElement as HTMLElement).textContent?.trim() === String(numero),
    )!.nativeElement as HTMLButtonElement;

  const anterior = () =>
    fixture.debugElement.query(By.css('.cabecalho button[aria-label="Anterior"]'))
      .nativeElement as HTMLButtonElement;

  const proximo = () =>
    fixture.debugElement.query(By.css('.cabecalho button[aria-label="Próximo"]'))
      .nativeElement as HTMLButtonElement;

  const indiceDoMesSelecionado = (): number => {
    cabecalho().click();
    fixture.detectChanges();
    const blocos = fixture.debugElement.queryAll(By.css('.grade--blocos .dia'));
    const indice = blocos.findIndex((b) =>
      (b.nativeElement as HTMLElement).className.includes('selecionado'),
    );
    blocos[indice].nativeElement.click();
    fixture.detectChanges();
    return indice;
  };

  const digitarEConfirmar = (texto: string) => {
    entrada().value = texto;
    entrada().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Hospede);
    hospede = fixture.componentInstance;
    const translate = TestBed.inject(TranslateService);
    translate.use('pt-BR');
    fixture.detectChanges();
  });

  describe('o form escreve no componente pelo writeValue', () => {
    it('o valor ISO é exibido em dd/MM/yyyy', () => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();

      expect(entrada().value).toBe('10/08/2026');
    });

    it('valor vazio deixa o campo vazio, sem exibir traços', () => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();

      hospede.controle.setValue('');
      fixture.detectChanges();

      expect(entrada().value).toBe('');
    });

    it('o calendário abre no mês do valor, não no mês corrente', () => {
      hospede.controle.setValue('2019-03-15');
      fixture.detectChanges();

      abrir();

      expect(cabecalho().textContent).toContain('2019');
      expect(fixture.debugElement.query(By.css('.dia.selecionado'))).not.toBeNull();
    });
  });

  describe('o componente escreve no form no formato do contrato', () => {
    it('escolher um dia escreve ISO no controle, não o texto exibido', () => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();
      abrir();

      dia(21).click();
      fixture.detectChanges();

      expect(hospede.controle.value).toBe('2026-08-21');
    });

    it('escolher um dia fecha o calendário', () => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();
      abrir();

      dia(21).click();
      fixture.detectChanges();

      expect(calendario()).toBeNull();
    });

    it('limpar zera o controle', () => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();
      abrir();

      fixture.debugElement
        .queryAll(By.css('.rodape button'))[1]
        .nativeElement.dispatchEvent(new Event('click'));
      fixture.detectChanges();

      expect(hospede.controle.value).toBe('');
    });
  });

  describe('entrada manual pelo teclado', () => {
    it('dd/MM/yyyy válido vira ISO no controle', () => {
      digitarEConfirmar('21/08/2026');

      expect(hospede.controle.value).toBe('2026-08-21');
    });

    it('formato irreconhecível não muda o controle e restaura a exibição', () => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();

      digitarEConfirmar('nao e data');

      expect(hospede.controle.value).toBe('2026-08-10');
      expect(entrada().value).toBe('10/08/2026');
    });

    it('data impossível é recusada, mesmo com o formato certo', () => {
      digitarEConfirmar('31/02/2026');

      expect(hospede.controle.value).toBe('');
    });

    it('entrada inválida marca o controle como touched, para o erro acender', () => {
      digitarEConfirmar('nao e data');

      expect(hospede.controle.touched).toBe(true);
    });

    it('apagar o campo limpa o controle', () => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();

      digitarEConfirmar('   ');

      expect(hospede.controle.value).toBe('');
    });
  });

  describe('feriado e intervalo bloqueiam a data', () => {
    it('dia marcado como feriado fica desabilitado', () => {
      hospede.controle.setValue('2026-08-10');
      hospede.feriados.set(['2026-08-21']);
      fixture.detectChanges();
      abrir();

      expect(dia(21).disabled).toBe(true);
    });

    it('clicar num feriado não escreve no controle', () => {
      hospede.controle.setValue('2026-08-10');
      hospede.feriados.set(['2026-08-21']);
      fixture.detectChanges();
      abrir();

      dia(21).click();
      fixture.detectChanges();

      expect(hospede.controle.value).toBe('2026-08-10');
    });

    it('dia antes do min fica desabilitado', () => {
      hospede.controle.setValue('2026-08-10');
      hospede.min.set('2026-08-15');
      fixture.detectChanges();
      abrir();

      expect(dia(14).disabled).toBe(true);
      expect(dia(15).disabled).toBe(false);
    });

    it('dia depois do max fica desabilitado', () => {
      hospede.controle.setValue('2026-08-10');
      hospede.max.set('2026-08-15');
      fixture.detectChanges();
      abrir();

      expect(dia(16).disabled).toBe(true);
      expect(dia(15).disabled).toBe(false);
    });

    it('a entrada manual respeita o mesmo intervalo do calendário', () => {
      hospede.max.set('2026-08-15');
      fixture.detectChanges();

      digitarEConfirmar('21/08/2026');

      expect(hospede.controle.value).toBe('');
    });
  });

  describe('navegação entre visões', () => {
    beforeEach(() => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();
      abrir();
    });

    it('o título sobe de dias para meses, e de meses para anos', () => {
      cabecalho().click();
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.grade--blocos .dia'))).toHaveLength(12);

      cabecalho().click();
      fixture.detectChanges();
      expect(cabecalho().textContent).toContain('2020 – 2029');
    });

    it('escolher um mês volta para a visão de dias', () => {
      cabecalho().click();
      fixture.detectChanges();

      fixture.debugElement.queryAll(By.css('.grade--blocos .dia'))[2].nativeElement.click();
      fixture.detectChanges();

      expect(cabecalho().textContent).toContain('2026');
      expect(diasDoMes().length).toBeGreaterThan(27);
    });

    it('avançar e voltar um mês dentro do mesmo ano', () => {
      expect(indiceDoMesSelecionado()).toBe(7);

      anterior().click();
      fixture.detectChanges();
      expect(indiceDoMesSelecionado()).toBe(6);

      proximo().click();
      proximo().click();
      fixture.detectChanges();
      expect(indiceDoMesSelecionado()).toBe(8);
    });

    it('na visão de meses, as setas andam de ano em ano', () => {
      cabecalho().click();
      fixture.detectChanges();

      anterior().click();
      fixture.detectChanges();

      expect(cabecalho().textContent?.trim()).toBe('2025');
    });

    it('na visão de anos, as setas andam de década em década', () => {
      cabecalho().click();
      cabecalho().click();
      fixture.detectChanges();
      expect(cabecalho().textContent).toContain('2020 – 2029');

      proximo().click();
      fixture.detectChanges();

      expect(cabecalho().textContent).toContain('2030 – 2039');
    });

    it('escolher um ano desce para a visão de meses daquele ano', () => {
      cabecalho().click();
      cabecalho().click();
      fixture.detectChanges();

      const blocos = fixture.debugElement.queryAll(By.css('.grade--blocos .dia'));
      const bloco2022 = blocos.find(
        (b) => (b.nativeElement as HTMLElement).textContent?.trim() === '2022',
      )!;
      bloco2022.nativeElement.click();
      fixture.detectChanges();

      expect(cabecalho().textContent?.trim()).toBe('2022');
      expect(fixture.debugElement.queryAll(By.css('.grade--blocos .dia'))).toHaveLength(12);
    });

    it('o botão Hoje devolve o calendário ao mês corrente, na visão de dias', () => {
      hospede.controle.setValue('2019-03-15');
      fixture.detectChanges();
      cabecalho().click();
      fixture.detectChanges();

      fixture.debugElement.queryAll(By.css('.rodape button'))[0].nativeElement.click();
      fixture.detectChanges();

      const agora = new Date();
      expect(indiceDoMesSelecionado()).toBe(agora.getMonth());
      expect(diasDoMes().length).toBeGreaterThan(27);
    });

    it('avançar de dezembro vira o ano', () => {
      hospede.controle.setValue('2026-12-10');
      fixture.detectChanges();

      fixture.debugElement
        .query(By.css('.cabecalho button[aria-label="Próximo"]'))
        .nativeElement.click();
      fixture.detectChanges();

      expect(cabecalho().textContent).toContain('2027');
    });

    it('voltar de janeiro vira o ano', () => {
      hospede.controle.setValue('2026-01-10');
      fixture.detectChanges();

      fixture.debugElement
        .query(By.css('.cabecalho button[aria-label="Anterior"]'))
        .nativeElement.click();
      fixture.detectChanges();

      expect(cabecalho().textContent).toContain('2025');
    });
  });

  describe('fechamento do calendário', () => {
    beforeEach(() => {
      hospede.controle.setValue('2026-08-10');
      fixture.detectChanges();
      abrir();
    });

    it('Esc fecha', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(calendario()).toBeNull();
    });

    it('clique fora fecha e marca touched', () => {
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(calendario()).toBeNull();
      expect(hospede.controle.touched).toBe(true);
    });

    it('clique dentro do calendário não fecha', () => {
      cabecalho().dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(calendario()).not.toBeNull();
    });
  });

  describe('setDisabledState', () => {
    it('disable desabilita a entrada e o ícone', () => {
      hospede.controle.disable();
      fixture.detectChanges();

      expect(entrada().disabled).toBe(true);
      expect(iconeCalendario().disabled).toBe(true);
    });

    it('desabilitado o calendário não abre nem por chamada direta do gatilho', () => {
      hospede.controle.disable();
      fixture.detectChanges();

      iconeCalendario().click();
      fixture.detectChanges();

      expect(calendario()).toBeNull();
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

    it('depois de uma entrada inválida o erro acende', () => {
      digitarEConfirmar('nao e data');

      expect(erro()).not.toBeNull();
      expect(entrada().className).toContain('input-error');
    });
  });
});
