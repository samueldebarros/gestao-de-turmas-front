import { computed, Injectable, Signal, signal } from '@angular/core';
import { environment } from '../../../environments/environments';
import { FeatureFlagsInterface } from '../../shared/interfaces/infra/feature-flags.interface';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly flags = signal<FeatureFlagsInterface>(environment.flags);

  readonly importarCsv: Signal<boolean> = computed(() => this.flags().importarCsv);
}
