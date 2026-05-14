import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class IdadeValidator {
    
    static validarIdade(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const valorDigitado = control.value;

            if(!valorDigitado){
                return null;
            }

            const partesData = valorDigitado.split('-');
            const anoNascimento = parseInt(partesData[0], 10);
            const mesNascimento = parseInt(partesData[1], 10) - 1;
            const diaNascimento = parseInt(partesData[2], 10);

            const dataNascimento = new Date(anoNascimento, mesNascimento, diaNascimento);

            const dataAtual = new Date();
            dataAtual.setHours(0, 0, 0, 0); 

            if(dataNascimento >= dataAtual){
                return {dataFuturaOuPresente: true};
            }

            const limite120Anos = new Date(dataAtual);
            limite120Anos.setFullYear(limite120Anos.getFullYear() - 120);

            if(dataNascimento < limite120Anos){
                return {idadeMaximaExcedida: true};
            }

            return null;
        }
    }
}