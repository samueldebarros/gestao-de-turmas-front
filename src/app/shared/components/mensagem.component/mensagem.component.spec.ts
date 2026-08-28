import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalheAlerta } from '../../interfaces/ui/detalhe-alerta.interface';
import { MensagemComponent } from './mensagem.component';

const DETALHES: DetalheAlerta[] = [
  { campo: 'DOCENTE.FORMULARIO.NOME_LABEL', erro: 'VALIDACAO.OBRIGATORIO' },
  { campo: 'DOCENTE.FORMULARIO.CPF_LABEL', erro: 'VALIDACAO.CPF_INVALIDO' },
];

describe('MensagemComponent', () => {
  let fixture: ComponentFixture<MensagemComponent>;
  let componente: MensagemComponent;

  const itens = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.detalhes-mensagem li'));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MensagemComponent] });
    fixture = TestBed.createComponent(MensagemComponent);
    componente = fixture.componentInstance;
  });

  describe('visibilidade', () => {
    it('invisível não renderiza a caixa', () => {
      componente.visivel = false;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.caixa-mensagem')).toBeNull();
    });

    it('fechar emite false e não decide sozinho ficar aberto', () => {
      const emitidos: boolean[] = [];
      componente.visivel = true;
      componente.visivelChange.subscribe((v) => emitidos.push(v));
      fixture.detectChanges();

      componente.fecharMensagem();

      expect(emitidos).toEqual([false]);
    });
  });

  describe('detalhes — a lista de causas', () => {
    it('sem detalhes, nenhuma lista é renderizada', () => {
      componente.visivel = true;
      componente.texto = 'MENSAGEM.CORRIJA_OS_CAMPOS';
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.detalhes-mensagem')).toBeNull();
    });

    // ⚠️ Este e o teste que a Fatia A nao tinha: ele confere o TEXTO RENDERIZADO,
    // nao a configuracao. O defeito que escapou lá era exatamente uma chave i18n
    // chegando crua à tela porque nenhum gate olhava o que o template desenha.
    it('cada detalhe renderiza uma linha, com campo e erro traduzidos', () => {
      componente.visivel = true;
      componente.texto = 'MENSAGEM.CORRIJA_OS_CAMPOS';
      componente.detalhes = DETALHES;
      fixture.detectChanges();

      const linhas = itens().map((li) => li.textContent?.trim());

      expect(linhas).toHaveLength(2);
      expect(linhas[0]).toContain('DOCENTE.FORMULARIO.NOME_LABEL');
      expect(linhas[0]).toContain('VALIDACAO.OBRIGATORIO');
      expect(linhas[1]).toContain('VALIDACAO.CPF_INVALIDO');
    });

    it('duas causas iguais em campos diferentes rendem duas linhas', () => {
      componente.visivel = true;
      componente.detalhes = [
        { campo: 'DOCENTE.FORMULARIO.NOME_LABEL', erro: 'VALIDACAO.OBRIGATORIO' },
        { campo: 'DOCENTE.FORMULARIO.CPF_LABEL', erro: 'VALIDACAO.OBRIGATORIO' },
      ];
      fixture.detectChanges();

      expect(itens()).toHaveLength(2);
    });

    it('o texto principal continua aparecendo junto da lista', () => {
      componente.visivel = true;
      componente.texto = 'MENSAGEM.CORRIJA_OS_CAMPOS';
      componente.detalhes = DETALHES;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('MENSAGEM.CORRIJA_OS_CAMPOS');
    });
  });
});
