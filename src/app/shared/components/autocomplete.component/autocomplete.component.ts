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
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { EntidadeBaseInterface } from '../../interfaces/entities/entidade-base.interface';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { gerarIdUnico } from '../../utils/gerar-id-unico.util';

@Component({
  selector: 'app-autocomplete',
  imports: [TranslatePipe],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss',
})
export class AutocompleteComponent<T extends EntidadeBaseInterface> implements OnInit {
  protected readonly campoId = gerarIdUnico('autocomplete');
  protected readonly listaId = gerarIdUnico('autocomplete-lista');

  @Input({ required: true }) buscar!: (termo: string) => Observable<T[]>;
  @Input({ required: true }) rotulo!: (item: T) => string;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() minCaracteres = 3;
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
        map((valor) => valor.trim()),
        distinctUntilChanged(),
        filter((valor) => valor.length >= this.minCaracteres),
        tap(() => {
          this.carregando.set(true);
          this.aberto.set(true);
        }),
        switchMap((valor) => this.buscar(valor).pipe(catchError(() => of([])))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.sugestoes.set(resultado);
        this.carregando.set(false);
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
    this.reiniciarBusca();
  }

  private reiniciarBusca(): void {
    this.termoBusca$.next('');
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
