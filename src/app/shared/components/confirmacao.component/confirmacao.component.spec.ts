import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmacaoAcao } from '../../interfaces/ui/confirmacao-acao.interface';
import { ConfirmacaoComponent } from './confirmacao.component';

const CONFIRMACAO_PERIGO: ConfirmacaoAcao = {
  titulo: 'TURMA.CONFIRMACAO.INATIVAR_TITULO',
  mensagem: 'TURMA.CONFIRMACAO.INATIVAR_MENSAGEM',
  params: { nome: 'Turma A' },
  rotuloConfirmar: 'TURMA.CONFIRMACAO.INATIVAR_BOTAO',
  variante: 'perigo',
};

describe('ConfirmacaoComponent', () => {
  let fixture: ComponentFixture<ConfirmacaoComponent>;
  let componente: ConfirmacaoComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmacaoComponent] });
    fixture = TestBed.createComponent(ConfirmacaoComponent);
    componente = fixture.componentInstance;

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', {
      TURMA: {
        CONFIRMACAO: {
          INATIVAR_TITULO: 'Inativar turma',
          INATIVAR_MENSAGEM: 'Deseja inativar a turma {{nome}}?',
          INATIVAR_BOTAO: 'Inativar',
        },
      },
      CONFIRMACAO: {
        CANCELAR: 'Cancelar',
      },
    });
    translate.use('pt-BR');
  });

  describe('visibilidade', () => {
    it('confirmacao nula não renderiza nada', () => {
      componente.confirmacao = null;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-modal')).toBeNull();
    });

    it('confirmacao presente renderiza o modal com a mensagem traduzida e os params interpolados', () => {
      componente.confirmacao = CONFIRMACAO_PERIGO;
      fixture.detectChanges();

      const texto = fixture.nativeElement.textContent as string;

      expect(texto).toContain('Deseja inativar a turma Turma A?');
      expect(texto).not.toContain('{{nome}}');
    });
  });

  describe('emissões', () => {
    it('confirmar emite confirmado uma única vez', () => {
      componente.confirmacao = CONFIRMACAO_PERIGO;
      fixture.detectChanges();
      let emissoes = 0;
      componente.confirmado.subscribe(() => emissoes++);

      componente.confirmar();

      expect(emissoes).toBe(1);
    });

    it('cancelar emite cancelado', () => {
      componente.confirmacao = CONFIRMACAO_PERIGO;
      fixture.detectChanges();
      let emissoes = 0;
      componente.cancelado.subscribe(() => emissoes++);

      componente.cancelar();

      expect(emissoes).toBe(1);
    });

    it('fechar o modal (evento visivelChange) emite cancelado', () => {
      componente.confirmacao = CONFIRMACAO_PERIGO;
      fixture.detectChanges();
      let emissoes = 0;
      componente.cancelado.subscribe(() => emissoes++);

      const modal = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      modal.dispatchEvent(new Event('cancel'));
      fixture.detectChanges();

      expect(emissoes).toBe(1);
    });
  });
});
