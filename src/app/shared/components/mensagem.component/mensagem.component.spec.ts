import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
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

  describe('texto principal, sempre traduzido', () => {
    beforeEach(() => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('pt-BR', {
        MENSAGEM: { CORRIJA_OS_CAMPOS: 'Corrija os campos indicados abaixo:' },
        ERRO_NEGOCIO: {
          TURMA_CAPACIDADE_ATINGIDA:
            'A turma atingiu a capacidade máxima. Capacidade: {{capacidade}}; alunos ativos: {{alunosAtivos}}.',
        },
      });
      translate.use('pt-BR');
    });

    it('traduz o texto quando ele é uma chave conhecida', () => {
      componente.visivel = true;
      componente.texto = 'MENSAGEM.CORRIJA_OS_CAMPOS';
      fixture.detectChanges();

      const texto = fixture.nativeElement
        .querySelector('.conteudo-mensagem span')
        ?.textContent?.trim();

      expect(texto).toBe('Corrija os campos indicados abaixo:');
    });

    it('interpola os params no texto principal', () => {
      componente.visivel = true;
      componente.texto = 'ERRO_NEGOCIO.TURMA_CAPACIDADE_ATINGIDA';
      componente.params = { capacidade: 20, alunosAtivos: 20 };
      fixture.detectChanges();

      const texto = fixture.nativeElement
        .querySelector('.conteudo-mensagem span')
        ?.textContent?.trim();

      expect(texto).toBe('A turma atingiu a capacidade máxima. Capacidade: 20; alunos ativos: 20.');
    });
  });

  describe('detalhes, a lista de causas', () => {
    it('sem detalhes, nenhuma lista é renderizada', () => {
      componente.visivel = true;
      componente.texto = 'MENSAGEM.CORRIJA_OS_CAMPOS';
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.detalhes-mensagem')).toBeNull();
    });

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

    it('detalhe com params interpola o placeholder em vez de exibi-lo literal', () => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('pt-BR', {
        VALIDACAO: { VALOR_MAXIMO: 'O valor não pode passar de {{max}}.' },
      });
      translate.use('pt-BR');

      componente.visivel = true;
      componente.texto = 'MENSAGEM.CORRIJA_OS_CAMPOS';
      componente.detalhes = [
        {
          campo: 'DOCENTE.FORMULARIO.IDADE_LABEL',
          erro: 'VALIDACAO.VALOR_MAXIMO',
          params: { max: 255 },
        },
      ];
      fixture.detectChanges();

      const linha = itens()[0]?.textContent ?? '';

      expect(linha).not.toContain('{{max}}');
      expect(linha).toContain('255');
    });
  });
});
