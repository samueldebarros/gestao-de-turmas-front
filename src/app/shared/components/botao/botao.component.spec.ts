import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Botao } from './botao.component';

describe('Botao', () => {
  let fixture: ComponentFixture<Botao>;

  const botao = () =>
    fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(Botao);
    fixture.detectChanges();
  });

  describe('a entrada vira DOM', () => {
    it('nasce primário, tamanho padrão e type button', () => {
      expect(botao().className).toContain('botao-primario');
      expect(botao().className).toContain('botao-tamanho-padrao');
      expect(botao().type).toBe('button');
    });

    it.each(['primario', 'perigo', 'sucesso'])('a variante %s entra na classe', (variante) => {
      fixture.componentRef.setInput('variante', variante);
      fixture.detectChanges();

      expect(botao().className).toContain(`botao-${variante}`);
    });

    it.each(['padrao', 'grande'] as const)('o tamanho %s entra na classe', (tamanho) => {
      fixture.componentRef.setInput('tamanho', tamanho);
      fixture.detectChanges();

      expect(botao().className).toContain(`botao-tamanho-${tamanho}`);
    });

    it.each(['button', 'submit', 'reset'] as const)('o tipo %s chega no button', (tipo) => {
      fixture.componentRef.setInput('tipo', tipo);
      fixture.detectChanges();

      expect(botao().type).toBe(tipo);
    });

    it('carregando desabilita o button e mostra o spinner', () => {
      fixture.componentRef.setInput('carregando', true);
      fixture.detectChanges();

      expect(botao().disabled).toBe(true);
      expect(botao().className).toContain('botao--carregando');
      expect(fixture.debugElement.query(By.css('.botao__spinner'))).not.toBeNull();
    });

    it('desabilitado desabilita o button sem mostrar spinner', () => {
      fixture.componentRef.setInput('desabilitado', true);
      fixture.detectChanges();

      expect(botao().disabled).toBe(true);
      expect(fixture.debugElement.query(By.css('.botao__spinner'))).toBeNull();
    });

    it('o spinner é escondido de leitor de tela', () => {
      fixture.componentRef.setInput('carregando', true);
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('.botao__spinner'))
        .nativeElement as HTMLElement;

      expect(spinner.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('o que o componente emite', () => {
    it('clique real no button emite acaoBotao', () => {
      let emissoes = 0;
      fixture.componentInstance.acaoBotao.subscribe(() => emissoes++);

      botao().click();

      expect(emissoes).toBe(1);
    });

    it.each([{ entrada: 'carregando' }, { entrada: 'desabilitado' }] as const)(
      'com $entrada o clique não emite, porque o button está desabilitado',
      ({ entrada }) => {
        fixture.componentRef.setInput(entrada, true);
        fixture.detectChanges();
        let emissoes = 0;
        fixture.componentInstance.acaoBotao.subscribe(() => emissoes++);

        botao().click();

        expect(emissoes).toBe(0);
      },
    );

    it.each([{ entrada: 'carregando' }, { entrada: 'desabilitado' }] as const)(
      'a guarda de onClick é uma segunda barreira: com $entrada nem a chamada direta emite',
      ({ entrada }) => {
        fixture.componentRef.setInput(entrada, true);
        fixture.detectChanges();
        let emissoes = 0;
        fixture.componentInstance.acaoBotao.subscribe(() => emissoes++);

        fixture.componentInstance.onClick();

        expect(emissoes).toBe(0);
      },
    );
  });

  describe('convivência com formulário', () => {
    const dentroDeFormulario = () => {
      const formulario = document.createElement('form');
      const submissoes: Event[] = [];
      formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        submissoes.push(evento);
      });
      formulario.appendChild(fixture.nativeElement);
      document.body.appendChild(formulario);
      return { formulario, submissoes };
    };

    it('tipo submit não intercepta o submit do formulário', () => {
      fixture.componentRef.setInput('tipo', 'submit');
      fixture.detectChanges();
      const { formulario, submissoes } = dentroDeFormulario();
      let emissoes = 0;
      fixture.componentInstance.acaoBotao.subscribe(() => emissoes++);

      botao().click();

      expect(submissoes).toHaveLength(1);
      expect(emissoes).toBe(1);
      formulario.remove();
    });

    it('tipo button não submete o formulário', () => {
      const { formulario, submissoes } = dentroDeFormulario();

      botao().click();

      expect(submissoes).toHaveLength(0);
      formulario.remove();
    });
  });
});
