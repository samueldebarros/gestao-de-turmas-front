import { ErroNegocio } from '../interfaces/dto/erro-negocio.interface';

export function extrairErroDeNegocio(erro: unknown): ErroNegocio | null {
  if (typeof erro !== 'object' || erro === null) return null;

  const corpo = (erro as { error?: unknown }).error;
  if (typeof corpo !== 'object' || corpo === null) return null;

  const { codigo } = corpo as { codigo?: unknown };
  if (typeof codigo !== 'string' || codigo.length === 0) return null;

  return corpo as ErroNegocio;
}
