import { SexoEnum } from '../enums/sexo.enum';
import { parsearCsvAlunos } from './parsear-csv-alunos.util';

const CABECALHO = 'nome;cpf;email;sexo;dataNascimento';

const csvComCabecalho = (...linhas: string[]) => [CABECALHO, ...linhas].join('\n');
const csvSemCabecalho = (...linhas: string[]) => linhas.join('\n');

const linhaValida = 'Ana Souza;52998224725;ana.souza@escola.com;2;2008-03-12';
const outraLinhaValida = 'Bruno Lima;11144477735;bruno.lima@escola.com;1;2007-11-05';
const linhaSemEmail = 'Carla Mendes;16899535009;;2;2009-01-23';
const linhaSemNome = ';23456789092;diego.alvares@escola.com;1;2008-07-30';

describe('parsearCsvAlunos', () => {
  describe('linha bem formada', () => {
    it('converte cada coluna para o campo correspondente do DTO', () => {
      const resultado = parsearCsvAlunos(csvComCabecalho(linhaValida));

      expect(resultado).toEqual([
        {
          dados: {
            nome: 'Ana Souza',
            cpf: '52998224725',
            email: 'ana.souza@escola.com',
            sexo: SexoEnum.FEMININO,
            dataNascimento: '2008-03-12',
          },
          valida: true,
        },
      ]);
    });
  });

  describe('normalização da entrada', () => {
    it('remove espaços em volta de cada campo', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho(
          '  Ana Souza  ;  52998224725  ;  ana.souza@escola.com  ;  2  ;  2008-03-12  ',
        ),
      );

      expect(resultado[0].dados).toEqual({
        nome: 'Ana Souza',
        cpf: '52998224725',
        email: 'ana.souza@escola.com',
        sexo: SexoEnum.FEMININO,
        dataNascimento: '2008-03-12',
      });
    });
  });

  describe('validade da linha', () => {
    it.each([
      {
        rotulo: 'nome',
        linha: ';52998224725;ana.souza@escola.com;2;2008-03-12',
        motivo: 'NOME_INVALIDO',
      },
      {
        rotulo: 'cpf',
        linha: 'Ana Souza;;ana.souza@escola.com;2;2008-03-12',
        motivo: 'CPF_INVALIDO',
      },
      {
        rotulo: 'email',
        linha: 'Ana Souza;52998224725;;2;2008-03-12',
        motivo: 'EMAIL_INVALIDO',
      },
      {
        rotulo: 'sexo',
        linha: 'Ana Souza;52998224725;ana.souza@escola.com;;2008-03-12',
        motivo: 'SEXO_INVALIDO',
      },
      {
        rotulo: 'data de nascimento',
        linha: 'Ana Souza;52998224725;ana.souza@escola.com;2;',
        motivo: 'DATA_INVALIDA',
      },
    ])('marca como inválida a linha sem $rotulo, dizendo o motivo', ({ linha, motivo }) => {
      const resultado = parsearCsvAlunos(csvComCabecalho(linha));

      expect(resultado[0]).toMatchObject({ valida: false, motivo });
    });

    it('marca como inválida a linha cujo sexo não pertence ao SexoEnum', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('Ana Souza;52998224725;ana.souza@escola.com;X;2008-03-12'),
      );

      expect(resultado[0]).toMatchObject({ valida: false, motivo: 'SEXO_INVALIDO' });
    });

    it('não derruba o lote quando uma linha é inválida', () => {
      const resultado = parsearCsvAlunos(csvComCabecalho(linhaValida, linhaSemEmail));

      expect(resultado).toHaveLength(2);
      expect(resultado.map((linha) => linha.valida)).toEqual([true, false]);
    });
  });

  describe('posição das linhas', () => {
    it('mantém a posição de cada linha com inválidas intercaladas', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho(linhaSemEmail, linhaValida, linhaSemNome, outraLinhaValida),
      );

      expect(resultado.map((linha) => linha.valida)).toEqual([false, true, false, true]);
    });
  });

  describe('entrada sem linha de dado', () => {
    it.each([
      { rotulo: 'apenas o cabeçalho', texto: CABECALHO },
      { rotulo: 'string vazia', texto: '' },
    ])('devolve lista vazia para $rotulo', ({ texto }) => {
      const resultado = parsearCsvAlunos(texto);

      expect(resultado).toEqual([]);
    });
  });

  describe('campo entre aspas', () => {
    it('preserva o delimitador dentro das aspas e não desloca as colunas', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('"Souza; Ana";52998224725;ana.souza@escola.com;2;2008-03-12'),
      );

      expect(resultado[0].dados.nome).toBe('Souza; Ana');
      expect(resultado[0].dados.cpf).toBe('52998224725');
      expect(resultado[0].valida).toBe(true);
    });

    it('remove as aspas delimitadoras do valor, em vez de gravá-las no nome', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('"Ana Souza";52998224725;ana.souza@escola.com;2;2008-03-12'),
      );

      expect(resultado[0].dados.nome).toBe('Ana Souza');
      expect(resultado[0].valida).toBe(true);
    });

    it('desescapa aspas duplicadas para uma aspa literal', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('"Ana ""Aninha"" Souza";52998224725;ana.souza@escola.com;2;2008-03-12'),
      );

      expect(resultado[0].dados.nome).toBe('Ana "Aninha" Souza');
    });
  });

  describe('estrutura da linha', () => {
    it.each([
      { rotulo: 'falta uma coluna', linha: 'Ana Souza;52998224725;ana.souza@escola.com;2' },
      {
        rotulo: 'sobra uma coluna',
        linha: 'Ana Souza;52998224725;ana.souza@escola.com;2;2008-03-12;extra',
      },
      {
        rotulo: 'delimitador solto no nome desloca tudo',
        linha: 'Souza; Ana;52998224725;ana.souza@escola.com;2;2008-03-12',
      },
    ])('acusa COLUNAS_INVALIDAS quando $rotulo, e não o campo errado', ({ linha }) => {
      const resultado = parsearCsvAlunos(csvComCabecalho(linha));

      expect(resultado[0]).toMatchObject({ valida: false, motivo: 'COLUNAS_INVALIDAS' });
    });
  });

  describe('conteúdo do campo', () => {
    it('acusa CPF_INVALIDO quando o dígito verificador não fecha', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('Ana Souza;11111111111;ana.souza@escola.com;2;2008-03-12'),
      );

      expect(resultado[0]).toMatchObject({ valida: false, motivo: 'CPF_INVALIDO' });
    });

    it('acusa DATA_INVALIDA para texto no lugar da data', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('Ana Souza;52998224725;ana.souza@escola.com;2;ana.souza@escola.com'),
      );

      expect(resultado[0]).toMatchObject({ valida: false, motivo: 'DATA_INVALIDA' });
    });

    it('acusa DATA_INVALIDA para data de calendário impossível', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('Ana Souza;52998224725;ana.souza@escola.com;2;2008-02-31'),
      );

      expect(resultado[0]).toMatchObject({ valida: false, motivo: 'DATA_INVALIDA' });
    });

    it('aceita nome com exatamente tres caracteres, a fronteira inferior', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('Ana;52998224725;ana.souza@escola.com;2;2008-03-12'),
      );

      expect(resultado[0].valida).toBe(true);
    });

    it('acusa NOME_INVALIDO com dois caracteres, um a menos que a fronteira', () => {
      const resultado = parsearCsvAlunos(
        csvComCabecalho('An;52998224725;ana.souza@escola.com;2;2008-03-12'),
      );

      expect(resultado[0]).toMatchObject({ valida: false, motivo: 'NOME_INVALIDO' });
    });
  });

  describe('precedencia do diagnostico', () => {
    it('reporta a estrutura antes do conteudo quando os dois estao errados', () => {
      const resultado = parsearCsvAlunos(csvComCabecalho('Ana Souza;11111111111;nao-e-email;2'));

      expect(resultado[0].motivo).toBe('COLUNAS_INVALIDAS');
    });
  });

  describe('cabeçalho', () => {
    it('descarta a primeira linha sempre, então sem cabeçalho o primeiro aluno desaparece', () => {
      const resultado = parsearCsvAlunos(csvSemCabecalho(linhaValida, outraLinhaValida));

      expect(resultado).toHaveLength(1);
      expect(resultado[0].dados.nome).toBe('Bruno Lima');
    });
  });
});
