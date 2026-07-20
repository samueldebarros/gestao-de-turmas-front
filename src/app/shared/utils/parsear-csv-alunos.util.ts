import { SexoEnum } from '../enums/sexo.enum';
import { AlunoAdicionarDTO } from '../interfaces/dto/aluno-adicionar-dto.interface';

export interface LinhaImportacao {
  dados: AlunoAdicionarDTO;
  valida: boolean;
}

export function parsearCsvAlunos(texto: string): LinhaImportacao[] {
  const linhas = texto.split(/\r?\n/).filter((linha) => linha.trim().length > 0);
  return linhas.slice(1).map((linha) => {
    const [nome, cpf, email, sexo, dataNascimento] = linha.split(';').map((c) => c.trim());
    const dados: AlunoAdicionarDTO = {
      nome,
      cpf,
      email,
      sexo: Number(sexo) as SexoEnum,
      dataNascimento,
    };
    const valida = !!nome && !!email && !!dataNascimento;
    return { dados, valida };
  });
}
