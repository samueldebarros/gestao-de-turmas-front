import { SexoEnum } from '../enums/sexo.enum';
import { SexoFormatPipe } from './sexo-format.pipe';

const TODOS_OS_SEXOS = [
  { valor: SexoEnum.MASCULINO, chave: 'ALUNO.FORMULARIO.SEXO_MASCULINO' },
  { valor: SexoEnum.FEMININO, chave: 'ALUNO.FORMULARIO.SEXO_FEMININO' },
  { valor: SexoEnum.OUTRO, chave: 'ALUNO.FORMULARIO.SEXO_OUTRO' },
] as const;

describe('SexoFormatPipe', () => {
  let pipe: SexoFormatPipe;

  beforeEach(() => {
    pipe = new SexoFormatPipe();
  });

  describe('tradução do enum em chave i18n', () => {
    it.each(TODOS_OS_SEXOS)('mapeia $valor para $chave', ({ valor, chave }) => {
      expect(pipe.transform(valor)).toBe(chave);
    });
  });

  describe('valor fora do enum é string vazia, nunca uma chave', () => {
    it.each([
      { rotulo: 'zero, que nenhum membro do enum usa', valor: 0 },
      { rotulo: 'acima do último membro', valor: 4 },
      { rotulo: 'negativo', valor: -1 },
    ])('$rotulo devolve string vazia', ({ valor }) => {
      expect(pipe.transform(valor)).toBe('');
    });
  });

  describe('caracterização do pipe compartilhado devolvendo chave de domínio', () => {
    it('as três chaves são do namespace ALUNO, embora o arquivo more em shared/pipes', () => {
      const chaves = TODOS_OS_SEXOS.map(({ valor }) => pipe.transform(valor));

      expect(chaves.every((chave) => chave.startsWith('ALUNO.'))).toBe(true);
    });
  });
});
