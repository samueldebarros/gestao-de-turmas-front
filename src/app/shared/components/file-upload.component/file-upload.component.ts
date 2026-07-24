import { Component, forwardRef, HostListener, Input, signal } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export type ErroUpload = 'TIPO_INVALIDO' | 'TAMANHO_EXCEDIDO';

@Component({
  selector: 'app-file-upload',
  imports: [TranslatePipe],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FileUploadComponent), multi: true },
  ],
})
export class FileUploadComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() accept = '';
  @Input() tamanhoMaximoMb = 5;
  @Input() control?: AbstractControl | null;

  protected readonly arquivo = signal<File | null>(null);
  protected readonly arrastando = signal(false);
  protected readonly erroValidacao = signal<ErroUpload | null>(null);
  protected readonly desabilitado = signal(false);

  private onChange: (valor: File | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(valor: File | null): void {
    this.arquivo.set(valor);
  }

  registerOnChange(fn: (valor: File | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  protected aoSelecionar(evento: Event): void {
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (arquivo) this.processar(arquivo);
  }

  @HostListener('dragover', ['$event'])
  protected aoArrastarSobre(evento: DragEvent): void {
    if (this.desabilitado()) return;
    evento.preventDefault();
    this.arrastando.set(true);
  }

  @HostListener('dragleave', ['$event'])
  protected aoSairDoArrasto(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastando.set(false);
  }

  @HostListener('drop', ['$event'])
  protected aoSoltar(evento: DragEvent): void {
    if (this.desabilitado()) return;
    evento.preventDefault();
    this.arrastando.set(false);
    const arquivo = evento.dataTransfer?.files?.[0];
    if (arquivo) this.processar(arquivo);
  }

  protected remover(): void {
    this.arquivo.set(null);
    this.erroValidacao.set(null);
    this.onChange(null);
    this.onTouched();
  }

  private processar(arquivo: File): void {
    const erro = this.validar(arquivo);
    if (erro) {
      this.erroValidacao.set(erro);
      this.arquivo.set(null);
      this.onChange(null);
      this.onTouched();
      return;
    }
    this.erroValidacao.set(null);
    this.arquivo.set(arquivo);
    this.onChange(arquivo);
    this.onTouched();
  }

  private validar(arquivo: File): ErroUpload | null {
    if (!this.tipoPermitido(arquivo)) return 'TIPO_INVALIDO';
    if (arquivo.size > this.tamanhoMaximoMb * 1024 * 1024) return 'TAMANHO_EXCEDIDO';
    return null;
  }

  private tipoPermitido(arquivo: File): boolean {
    if (!this.accept) return true;
    const extensoes = this.accept.split(',').map((ext) => ext.trim().toLocaleLowerCase());
    const nome = arquivo.name.toLowerCase();
    return extensoes.some((ext) => nome.endsWith(ext));
  }
}
