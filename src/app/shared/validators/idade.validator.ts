import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

export class IdadeValidator {
  static validarIdade(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valorDigitado = control.value;

      if (!valorDigitado) {
        return null;
      }

      const partesData = valorDigitado.split('-');
      const anoNascimento = Number.parseInt(partesData[0], 10);
      const mesNascimento = Number.parseInt(partesData[1], 10) - 1;
      const diaNascimento = Number.parseInt(partesData[2], 10);

      const dataNascimento = new Date(anoNascimento, mesNascimento, diaNascimento);

      const dataAtual = new Date();
      dataAtual.setHours(0, 0, 0, 0);

      if (dataNascimento >= dataAtual) {
        return { dataFuturaOuPresente: true };
      }

      const limite120Anos = new Date(dataAtual);
      limite120Anos.setFullYear(limite120Anos.getFullYear() - 120);

      if (dataNascimento < limite120Anos) {
        return { idadeMaximaExcedida: true };
      }

      return null;
    };
  }

  static ehDataValida(valor: string): boolean {
    if (!FORMATO_ISO.test(valor)) return false;

    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);

    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (data >= hoje) return false;

    const limite120Anos = new Date(hoje);
    limite120Anos.setFullYear(limite120Anos.getFullYear() - 120);
    return data >= limite120Anos;
  }
}
