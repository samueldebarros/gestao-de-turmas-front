import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CpfCnpjValidator {
  static validarCpfCnpj(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;

      // SRP: se não houver valor, deixar a obrigatoriedade para Validators.required
      if (valor === null || valor === undefined || valor === '') {
        return null;
      }

      const documentoLimpo = String(valor).replaceAll(/\D/g, '');

      // Rotear para o validador apropriado pelo tamanho
      switch (documentoLimpo.length) {
        case 11:
          return CpfCnpjValidator.validarCpfLogica(documentoLimpo) ? null : { cpfInvalido: true };

        case 14:
          return CpfCnpjValidator.validarCnpjLogica(documentoLimpo) ? null : { cnpjInvalido: true };

        default:
          return { documentoInvalido: true };
      }
    };
  }

  // Valida CPF através do Módulo 11 de duas fases
  private static validarCpfLogica(cpf: string): boolean {
    if (CpfCnpjValidator.ehSequenciaRepetida(cpf)) {
      return false;
    }

    const cpfNumeros = cpf.split('').map(Number);
    const [dezDigitos, digito1, digito2] = [cpfNumeros.slice(0, 9), cpfNumeros[9], cpfNumeros[10]];

    const calculaVerificador = (numeros: number[], multiplicadorInicial: number): number => {
      const soma = numeros.reduce(
        (acc, numero, indice) => acc + numero * (multiplicadorInicial - indice),
        0,
      );
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroVerificador = calculaVerificador(dezDigitos, 10);
    if (primeiroVerificador !== digito1) {
      return false;
    }

    const segundoVerificador = calculaVerificador([...dezDigitos, primeiroVerificador], 11);
    return segundoVerificador === digito2;
  }

  // Valida CNPJ através do Módulo 11 com multiplicadores específicos
  private static validarCnpjLogica(cnpj: string): boolean {
    if (CpfCnpjValidator.ehSequenciaRepetida(cnpj)) {
      return false;
    }

    const cnpjNumeros = cnpj.split('').map(Number);
    const [dozeDigitos, digito1, digito2] = [
      cnpjNumeros.slice(0, 12),
      cnpjNumeros[12],
      cnpjNumeros[13],
    ];

    const multiplicadores1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const multiplicadores2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const calculaVerificador = (numeros: number[], multiplicadores: number[]): number => {
      const soma = numeros.reduce(
        (acc, numero, indice) => acc + numero * multiplicadores[indice],
        0,
      );
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroVerificador = calculaVerificador(dozeDigitos, multiplicadores1);
    if (primeiroVerificador !== digito1) {
      return false;
    }

    const segundoVerificador = calculaVerificador(
      [...dozeDigitos, primeiroVerificador],
      multiplicadores2,
    );
    return segundoVerificador === digito2;
  }

  // Detecta sequências numéricas repetidas
  private static ehSequenciaRepetida(documento: string): boolean {
    return /^([0-9])\1+$/.test(documento);
  }
}
