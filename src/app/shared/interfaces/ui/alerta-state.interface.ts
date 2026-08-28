import { DetalheAlerta } from './detalhe-alerta.interface';

export interface AlertaState {
  visivel: boolean;
  tipo: 'sucesso' | 'erro';
  texto: string;
  detalhes?: DetalheAlerta[];
}
