import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DiaCalendario } from '../../interfaces/ui/dia-calendario.interface';

@Component({
  selector: 'app-date-picker',
  imports: [TranslatePipe],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePickerComponent), multi: true },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  private readonly translate = inject(TranslateService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly aberto = signal(false);
  private readonly hoje = new Date();
  protected readonly mesVisivel = signal(this.hoje.getMonth());
  protected readonly anoVisivel = signal(this.hoje.getFullYear());
  private readonly locale = signal(this.localeAtual());

  @Input() label = '';
  @Input() placeholder = '';
  @Input() errorMessage = '';
  @Input() control?: AbstractControl | null;
  @Input() min?: string;
  @Input() max?: string;

  protected readonly valor = signal('');
  protected readonly disabled = signal(false);

  constructor() {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.locale.set(this.localeAtual()));
  }

  protected readonly valorExibicao = computed(() => {
    const partes = this.partesIso(this.valor());
    if (!partes) return '';
    return `${this.pad(partes.dia)}/${this.pad(partes.mes + 1)}/${partes.ano}`;
  });

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};

  private localeAtual(): string {
    const lang = this.translate.getCurrentLang() || this.translate.getFallbackLang() || 'pt-BR';
    return lang.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
  }

  private partesIso(iso: string): { ano: number; mes: number; dia: number } | null {
    if (!iso) return null;
    const partes = iso.split('-');
    if (partes.length !== 3) return null;
    return { ano: Number(partes[0]), mes: Number(partes[1]) - 1, dia: Number(partes[2]) };
  }

  private formatarIso(ano: number, mes: number, dia: number): string {
    return `${ano}-${this.pad(mes + 1)}-${this.pad(dia)}`;
  }

  protected readonly rotuloMesAno = computed(() => {
    const data = new Date(this.anoVisivel(), this.mesVisivel(), 1);
    const rotulo = new Intl.DateTimeFormat(this.locale(), {
      month: 'long',
      year: 'numeric',
    }).format(data);
    return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
  });

  protected readonly nomesDiasSemana = computed(() => {
    const formatador = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const domingoReferencia = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, indice) => {
      const dia = new Date(domingoReferencia);
      dia.setDate(domingoReferencia.getDate() + indice);
      return formatador.format(dia);
    });
  });

  protected readonly dias = computed<DiaCalendario[]>(() => {
    const ano = this.anoVisivel();
    const mes = this.mesVisivel();
    const selecionado = this.valor();
    const hojeIso = this.formatarIso(
      this.hoje.getFullYear(),
      this.hoje.getMonth(),
      this.hoje.getDate(),
    );

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const inicioGrade = new Date(ano, mes, 1 - primeiroDiaSemana);

    return Array.from({ length: 42 }, (_, indice) => {
      const data = new Date(inicioGrade);
      data.setDate(inicioGrade.getDate() + indice);
      const iso = this.formatarIso(data.getFullYear(), data.getMonth(), data.getDate());
      return {
        dia: data.getDate(),
        iso,
        doMesAtual: data.getMonth() === mes,
        selecionado: iso === selecionado,
        hoje: iso === hojeIso,
        desabilitado: this.foraDoIntervalo(iso),
      };
    });
  });

  private foraDoIntervalo(iso: string): boolean {
    if (this.min && iso < this.min) return true;
    if (this.max && iso > this.max) return true;
    return false;
  }

  protected alternarCalendario(): void {
    if (this.disabled()) return;
    this.aberto.update((aberto) => !aberto);
    if (this.aberto()) this.sincronizarMesVisivel(this.valor());
  }

  protected selecionarDia(dia: DiaCalendario): void {
    if (dia.desabilitado) return;
    this.valor.set(dia.iso);
    this.onChange(dia.iso);
    this.onTouched();
    this.aberto.set(false);
  }

  protected mesAnterior(): void {
    if (this.mesVisivel() === 0) {
      this.mesVisivel.set(11);
      this.anoVisivel.update((ano) => ano - 1);
    } else {
      this.mesVisivel.update((mes) => mes - 1);
    }
  }

  protected proximoMes(): void {
    if (this.mesVisivel() === 11) {
      this.mesVisivel.set(0);
      this.anoVisivel.update((ano) => ano + 1);
    } else {
      this.mesVisivel.update((mes) => mes + 1);
    }
  }

  protected irParaHoje(): void {
    this.mesVisivel.set(this.hoje.getMonth());
    this.anoVisivel.set(this.hoje.getFullYear());
  }

  protected limpar(): void {
    this.valor.set('');
    this.onChange('');
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(evento: MouseEvent): void {
    if (!this.aberto()) return;
    if (!this.elementRef.nativeElement.contains(evento.target as Node)) {
      this.aberto.set(false);
      this.onTouched();
    }
  }

  @HostListener('document:keydown.escape')
  protected aoPressionarEsc(): void {
    if (this.aberto()) this.aberto.set(false);
  }

  private sincronizarMesVisivel(iso: string): void {
    const partes = this.partesIso(iso);
    this.mesVisivel.set(partes ? partes.mes : this.hoje.getMonth());
    this.anoVisivel.set(partes ? partes.ano : this.hoje.getFullYear());
  }

  private pad(valor: number): string {
    return valor.toString().padStart(2, '0');
  }

  writeValue(value: string | null): void {
    this.valor.set(value ?? '');
    this.sincronizarMesVisivel(value ?? '');
  }
  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  get exibirErro(): boolean {
    if (this.control) return this.control.invalid && this.control.touched;
    return !!this.errorMessage;
  }
}
