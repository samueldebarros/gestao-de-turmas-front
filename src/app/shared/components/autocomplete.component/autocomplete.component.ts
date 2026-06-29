import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { EntidadeBaseInterface } from '../../interfaces/entities/entidade-base.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-autocomplete',
  imports: [TranslatePipe],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss',
})
export class AutocompleteComponent<T extends EntidadeBaseInterface> implements OnInit {
  @Input({ required: true }) buscar!: (termo: string) => Observable<T[]>;
  @Input({ required: true }) rotulo!: (item: T) => string;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() minCaracteres = 1;
  @Input() debounceMs = 300;

  @Output() selecionado = new EventEmitter<T>();

  protected readonly destroyRef = inject(DestroyRef);

  protected readonly texto = signal('');
  protected readonly sugestoes = signal<T[]>([]);
  protected readonly carregando = signal(false);
  protected readonly aberto = signal(false);
  protected readonly indiceAtivo = signal(-1);

  private readonly termoBusca$ = new Subject<string>();

  ngOnInit(): void {
    this.termoBusca$
      .pipe(
        debounceTime(this.debounceMs),
        distinctUntilChanged(),
        filter((termo) => termo.length >= this.minCaracteres),
        tap(() => this.carregando.set(true)),
        switchMap((termo) => this.buscar(termo).pipe(catchError(() => of<T[]>([])))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((itens) => {
        this.sugestoes.set(itens);
        this.carregando.set(false);
        this.aberto.set(true);
        this.indiceAtivo.set(-1);
      });
  }

  protected aoDigitar(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.texto.set(valor);
    if (valor.length < this.minCaracteres) {
      this.sugestoes.set([]);
      this.aberto.set(false);
      return;
    }
    this.termoBusca$.next(valor);
  }

  protected selecionar(item: T): void {
    this.selecionado.emit(item);
    this.texto.set(this.rotulo(item));
    this.aberto.set(false);
    this.sugestoes.set([]);
  }

  @HostListener('keydown.arrowdown', ['$event'])
  protected descer(evento: Event): void {
    if (!this.aberto()) return;
    evento.preventDefault();
    this.indiceAtivo.update((i) => Math.min(i + 1, this.sugestoes().length - 1));
  }

  @HostListener('keydown.arrowup', ['$event'])
  protected subir(evento: Event): void {
    if (!this.aberto()) return;
    evento.preventDefault();
    this.indiceAtivo.update((i) => Math.max(i - 1, 0));
  }

  @HostListener('keydown.enter', ['$event'])
  protected confirmar(evento: Event): void {
    const item = this.sugestoes()[this.indiceAtivo()];
    if (!this.aberto() || !item) return;
    evento.preventDefault();
    this.selecionar(item);
  }

  @HostListener('keydown.escape')
  protected aoEsc(): void {
    this.aberto.set(false);
  }

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @HostListener('document:click', ['$event'])
  protected aoClicarFora(evento: MouseEvent): void {
    if (this.aberto() && !this.elementRef.nativeElement.contains(evento.target)) {
      this.aberto.set(false);
    }
  }
}
