import { EnvironmentInterface } from '../app/shared/interfaces/infra/environment.interface';

export const environment: EnvironmentInterface = {
  production: false,
  apiUrl: 'https://localhost:7048/api',
  brasilApiUrl: 'https://brasilapi.com.br/api',
  flags: {
    importarCsv: true,
  },
};
