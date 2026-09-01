import { SexoEnum } from '../enums/sexo.enum';
import { AlunoAdicionarDTO } from '../interfaces/dto/aluno-adicionar-dto.interface';
import { LinhaImportacao } from '../interfaces/ui/linha-importacao.interface';
import { CpfCnpjValidator } from '../validators/cpf-cnpj.validator';
import { IdadeValidator } from '../validators/idade.validator';

export const LIMITE_LINHAS_IMPORTACAO = 1000;
export const TOTAL_COLUNAS = 5;

export type MotivoInvalidez =
  | 'COLUNAS_INVALIDAS'
  | 'NOME_INVALIDO'
  | 'CPF_INVALIDO'
  | 'EMAIL_INVALIDO'
  | 'SEXO_INVALIDO'
  | 'DATA_INVALIDA';

const FORMATO_EMAIL = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

function separarCampos(linha: string): string[] {
  const campos: string[] = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const caractere = linha[i];

    if (dentroDeAspas) {
      if (caractere !== '"') atual += caractere;
      else if (linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else dentroDeAspas = false;
      continue;
    }

    if (caractere === '"') dentroDeAspas = true;
    else if (caractere === ';') {
      campos.push(atual);
      atual = '';
    } else atual += caractere;
  }

  campos.push(atual);
  return campos;
}

function diagnosticar(campos: string[], dados: AlunoAdicionarDTO): MotivoInvalidez | null {
  if (campos.length !== TOTAL_COLUNAS) return 'COLUNAS_INVALIDAS';
  if (dados.nome.length < 3 || dados.nome.length > 100) return 'NOME_INVALIDO';
  if (!CpfCnpjValidator.ehValido(dados.cpf)) return 'CPF_INVALIDO';
  if (!FORMATO_EMAIL.test(dados.email)) return 'EMAIL_INVALIDO';
  if (!(dados.sexo in SexoEnum)) return 'SEXO_INVALIDO';
  if (!IdadeValidator.ehDataValida(dados.dataNascimento)) return 'DATA_INVALIDA';
  return null;
}

export function parsearCsvAlunos(texto: string): LinhaImportacao<AlunoAdicionarDTO>[] {
  const linhas = texto.split(/\r?\n/).filter((linha) => linha.trim().length > 0);
  return linhas.slice(1).map((linha) => {
    const campos = separarCampos(linha);
    const [nome = '', cpf = '', email = '', sexo = '', dataNascimento = ''] = campos.map((campo) =>
      campo.trim(),
    );
    const dados: AlunoAdicionarDTO = {
      nome,
      cpf,
      email,
      sexo: Number(sexo) as SexoEnum,
      dataNascimento,
    };
    const motivo = diagnosticar(campos, dados);
    return motivo ? { dados, valida: false, motivo } : { dados, valida: true };
  });
}
