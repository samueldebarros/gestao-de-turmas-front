import { FormControl } from '@angular/forms';
import { ErrorMessagePipe } from './error-message.pipe';

const NAMESPACES_DE_DOMINIO = ['ALUNO.', 'DOCENTE.', 'TURMA.', 'DASHBOARD.', 'LOGIN.'];

const TODOS_OS_ERROS = [
  { erro: 'required', chave: 'VALIDACAO.OBRIGATORIO' },
  { erro: 'email', chave: 'VALIDACAO.EMAIL_INVALIDO' },
  { erro: 'documentoInvalido', chave: 'VALIDACAO.DOCUMENTO_INVALIDO' },
  { erro: 'cpfInvalido', chave: 'VALIDACAO.CPF_INVALIDO' },
  { erro: 'cnpjInvalido', chave: 'VALIDACAO.CNPJ_INVALIDO' },
  { erro: 'dataFuturaOuPresente', chave: 'VALIDACAO.DATA_FUTURA' },
  { erro: 'idadeMaximaExcedida', chave: 'VALIDACAO.IDADE_MAXIMA' },
  { erro: 'emBranco', chave: 'VALIDACAO.EM_BRANCO' },
] as const;

const comErros = (erros: Record<string, boolean>): FormControl => {
  const controle = new FormControl('');
  controle.setErrors(erros);
  return controle;
};

describe('ErrorMessagePipe', () => {
  let pipe: ErrorMessagePipe;

  beforeEach(() => {
    pipe = new ErrorMessagePipe();
  });

  describe('a decisão que este arquivo protege', () => {
    it.each(TODOS_OS_ERROS)(
      'a chave de "$erro" não pertence a nenhum namespace de domínio',
      ({ erro }) => {
        const chave = pipe.transform(comErros({ [erro]: true }));

        for (const namespace of NAMESPACES_DE_DOMINIO) {
          expect(chave.startsWith(namespace)).toBe(false);
        }
      },
    );

    it('o pipe é compartilhado, então nenhuma chave que ele devolve é de um domínio', () => {
      const chaves = TODOS_OS_ERROS.map(({ erro }) => pipe.transform(comErros({ [erro]: true })));

      expect(chaves.every((chave) => chave.startsWith('VALIDACAO.'))).toBe(true);
    });
  });

  describe('tradução de erro em chave i18n', () => {
    it.each(TODOS_OS_ERROS)('mapeia "$erro" para $chave', ({ erro, chave }) => {
      expect(pipe.transform(comErros({ [erro]: true }))).toBe(chave);
    });

    it('devolve a chave do primeiro erro quando há mais de um', () => {
      expect(pipe.transform(comErros({ required: true, email: true }))).toBe(
        'VALIDACAO.OBRIGATORIO',
      );
    });
  });

  describe('ausência de erro é string vazia, nunca uma chave', () => {
    it.each([
      { rotulo: 'controle nulo', controle: null },
      { rotulo: 'controle indefinido', controle: undefined },
    ])('$rotulo devolve string vazia', ({ controle }) => {
      expect(pipe.transform(controle)).toBe('');
    });

    it('controle válido devolve string vazia', () => {
      expect(pipe.transform(new FormControl(''))).toBe('');
    });

    it('erro desconhecido devolve string vazia, não a chave crua do erro', () => {
      const chave = pipe.transform(comErros({ erroQueNinguemMapeou: true }));

      expect(chave).toBe('');
      expect(chave).not.toContain('erroQueNinguemMapeou');
    });
  });
});
