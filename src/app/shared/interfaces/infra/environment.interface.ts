import { FeatureFlagsInterface } from './feature-flags.interface';

export interface EnvironmentInterface {
  production: boolean;
  apiUrl: string;
  brasilApiUrl: string;
  flags: FeatureFlagsInterface;
}
