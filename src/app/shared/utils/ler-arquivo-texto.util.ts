import { Observable } from 'rxjs';

export function lerArquivoTexto(arquivo: File): Observable<string> {
  return new Observable<string>((observador) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      observador.next(leitor.result as string);
      observador.complete();
    };
    leitor.onerror = () => observador.error(leitor.error);
    leitor.readAsText(arquivo);
    return () => leitor.abort();
  });
}
