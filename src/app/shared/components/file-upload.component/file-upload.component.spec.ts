import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FileUploadComponent } from './file-upload.component';

@Component({
  imports: [ReactiveFormsModule, FileUploadComponent],
  template: `<app-file-upload
    [formControl]="controle"
    [accept]="accept()"
    [tamanhoMaximoMb]="tamanhoMaximoMb()"
    [label]="label()"
  />`,
})
class Hospede {
  readonly controle = new FormControl<File | null>(null);
  readonly accept = signal('.csv');
  readonly tamanhoMaximoMb = signal(5);
  readonly label = signal('');
}

const csv = (nome = 'alunos.csv') => new File(['nome;cpf'], nome, { type: 'text/csv' });

describe('FileUploadComponent: o contrato File | null', () => {
  let fixture: ComponentFixture<Hospede>;
  let hospede: Hospede;

  const input = () =>
    fixture.debugElement.query(By.css('input[type="file"]')).nativeElement as HTMLInputElement;

  const zona = () => fixture.debugElement.query(By.css('.zona')).nativeElement as HTMLElement;

  const erro = () => fixture.debugElement.query(By.css('.erro'));

  const selecionar = (arquivo: File) => {
    Object.defineProperty(input(), 'files', { value: [arquivo], configurable: true });
    input().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Hospede);
    hospede = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('o componente escreve no form', () => {
    it('selecionar um arquivo válido escreve o próprio File no controle', () => {
      const arquivo = csv();

      selecionar(arquivo);

      expect(hospede.controle.value).toBe(arquivo);
    });

    it('o nome do arquivo aparece na zona', () => {
      selecionar(csv('turma-3A.csv'));

      expect(zona().textContent).toContain('turma-3A.csv');
    });

    it('selecionar marca o controle como touched', () => {
      expect(hospede.controle.touched).toBe(false);

      selecionar(csv());

      expect(hospede.controle.touched).toBe(true);
    });

    it('remover devolve null ao form e apaga o nome da zona', () => {
      selecionar(csv());

      (fixture.debugElement.query(By.css('.remover')).nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(hospede.controle.value).toBeNull();
      expect(zona().textContent).not.toContain('alunos.csv');
    });
  });

  describe('validação de tipo', () => {
    it('extensão fora do accept é rejeitada e o form recebe null', () => {
      selecionar(new File(['x'], 'relatorio.pdf', { type: 'application/pdf' }));

      expect(hospede.controle.value).toBeNull();
      expect(erro()).not.toBeNull();
      expect((erro().nativeElement as HTMLElement).textContent).toContain(
        'FILE_UPLOAD.ERRO.TIPO_INVALIDO',
      );
    });

    it('a validação é por nome do arquivo, não pelo MIME type', () => {
      selecionar(new File(['x'], 'planilha.csv', { type: 'application/octet-stream' }));

      expect(hospede.controle.value).not.toBeNull();
    });

    it('accept vazio aceita qualquer extensão', () => {
      hospede.accept.set('');
      fixture.detectChanges();

      selecionar(new File(['x'], 'relatorio.pdf', { type: 'application/pdf' }));

      expect(hospede.controle.value).not.toBeNull();
    });

    it('o accept aceita lista de extensões e ignora espaços e caixa', () => {
      hospede.accept.set('.CSV, .TXT');
      fixture.detectChanges();

      selecionar(new File(['x'], 'notas.txt', { type: 'text/plain' }));

      expect(hospede.controle.value).not.toBeNull();
    });

    it('o accept chega ao atributo do input, para o seletor do sistema filtrar', () => {
      expect(input().getAttribute('accept')).toBe('.csv');
    });
  });

  describe('validação de tamanho', () => {
    it('acima do limite é rejeitado e o form recebe null', () => {
      hospede.tamanhoMaximoMb.set(1);
      fixture.detectChanges();

      selecionar(new File([new Uint8Array(1024 * 1024 + 1)], 'grande.csv', { type: 'text/csv' }));

      expect(hospede.controle.value).toBeNull();
      expect((erro().nativeElement as HTMLElement).textContent).toContain(
        'FILE_UPLOAD.ERRO.TAMANHO_EXCEDIDO',
      );
    });

    it('exatamente no limite é aceito, porque a comparação é >', () => {
      hospede.tamanhoMaximoMb.set(1);
      fixture.detectChanges();

      selecionar(new File([new Uint8Array(1024 * 1024)], 'no-limite.csv', { type: 'text/csv' }));

      expect(hospede.controle.value).not.toBeNull();
    });

    it('um arquivo válido depois de um rejeitado limpa a mensagem de erro', () => {
      selecionar(new File(['x'], 'relatorio.pdf', { type: 'application/pdf' }));
      expect(erro()).not.toBeNull();

      selecionar(csv());

      expect(erro()).toBeNull();
    });
  });

  describe('o form escreve no componente pelo writeValue', () => {
    it('setValue mostra o nome do arquivo sem passar pelo input', () => {
      hospede.controle.setValue(csv('vindo-do-form.csv'));
      fixture.detectChanges();

      expect(zona().textContent).toContain('vindo-do-form.csv');
    });

    it('reset volta para a instrução inicial', () => {
      selecionar(csv());

      hospede.controle.reset();
      fixture.detectChanges();

      expect(zona().textContent).toContain('FILE_UPLOAD.INSTRUCAO');
    });
  });

  describe('setDisabledState', () => {
    it('disable no controle desabilita o input e marca a zona', () => {
      hospede.controle.disable();
      fixture.detectChanges();

      expect(input().disabled).toBe(true);
      expect(zona().className).toContain('desabilitada');
    });
  });

  describe('arraste, até onde o jsdom alcança', () => {
    it('dragover marca a zona como alvo', () => {
      zona().dispatchEvent(new Event('dragover', { bubbles: true }));
      fixture.detectChanges();

      expect(zona().className).toContain('sobre');
    });

    it('dragleave desmarca a zona', () => {
      zona().dispatchEvent(new Event('dragover', { bubbles: true }));
      fixture.detectChanges();

      zona().dispatchEvent(new Event('dragleave', { bubbles: true }));
      fixture.detectChanges();

      expect(zona().className).not.toContain('sobre');
    });

    it('dragover com o controle desabilitado não marca a zona', () => {
      hospede.controle.disable();
      fixture.detectChanges();

      zona().dispatchEvent(new Event('dragover', { bubbles: true }));
      fixture.detectChanges();

      expect(zona().className).not.toContain('sobre');
    });

    it('drop desmarca a zona, e o arquivo em si o jsdom não entrega', () => {
      zona().dispatchEvent(new Event('dragover', { bubbles: true }));
      fixture.detectChanges();

      zona().dispatchEvent(new Event('drop', { bubbles: true }));
      fixture.detectChanges();

      expect(zona().className).not.toContain('sobre');
      expect(hospede.controle.value).toBeNull();
    });
  });
});
