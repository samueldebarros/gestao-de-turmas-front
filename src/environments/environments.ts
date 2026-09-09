import { EnvironmentInterface } from '../app/shared/interfaces/infra/environment.interface';

export const environment: EnvironmentInterface = {
  production: true,
  apiUrl: '/api',
  brasilApiUrl: 'https://brasilapi.com.br/api',
  flags: {
    importarCsv: true,
  },
};
