import { Component, OnInit } from '@angular/core';
import { TabelaGenerica } from '../tabela-generica/tabela-generica.component.js';
import { TabelaColuna } from '../../models/tabela-coluna.interface.js';
import { Botao } from '../botao/botao.component.js';
import { Modal } from '../modal/modal.component.js';
import { AlunoInterface } from '../../models/aluno.interface.js';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SexoEnum } from '../../models/sexo.enum.js';
import { FormFieldTextComponent } from '../form-field-text.component/form-field-text.component.js';

@Component({
  selector: 'app-aluno-index',
  standalone: true,
  imports: [TabelaGenerica, Botao, Modal, ReactiveFormsModule, FormFieldTextComponent],
  templateUrl: './aluno-index.component.html',
  styleUrl: './aluno-index.component.scss',
})
export class AlunoIndex implements OnInit {
  listaAlunos: AlunoInterface[] = [
    {
      id: 1,
      matricula: '2026001',
      nome: 'Samuel Silva',
      cpf: '111.222.333-44',
      email: 'samuel@email.com',
      dataNascimento: new Date('2000-05-15T00:00:00'),
      sexo: SexoEnum.MASCULINO,
      ativo: true,
    },
    {
      id: 2,
      matricula: '2026002',
      nome: 'Mariane Reis',
      cpf: '555.666.777-88',
      email: 'mariane@email.com',
      dataNascimento: new Date('1998-08-20T00:00:00'),
      sexo: SexoEnum.FEMININO,
      ativo: true,
    },
    {
      id: 3,
      matricula: '2026003',
      nome: 'Carlos Souza',
      cpf: '999.000.111-22',
      email: 'carlos@email.com',
      dataNascimento: new Date('2001-11-10T00:00:00'),
      sexo: SexoEnum.MASCULINO,
      ativo: true,
    },
    {
      id: 4,
      matricula: '2026004',
      nome: 'Ana Paula',
      cpf: '333.444.555-66',
      email: 'ana@email.com',
      dataNascimento: new Date('1999-12-25T00:00:00'),
      sexo: SexoEnum.FEMININO,
      ativo: false,
    },
    {
      id: 5,
      matricula: '2026005',
      nome: 'Mariane Reis',
      cpf: '555.666.777-88',
      email: 'mariane@email.com',
      dataNascimento: new Date('1998-08-20T00:00:00'),
      sexo: SexoEnum.FEMININO,
      ativo: true,
    },
    {
      id: 6,
      matricula: '2026006',
      nome: 'Carlos Souza',
      cpf: '999.000.111-22',
      email: 'carlos@email.com',
      dataNascimento: new Date('2001-11-10T00:00:00'),
      sexo: SexoEnum.MASCULINO,
      ativo: true,
    },
  ];

  colunas: TabelaColuna[] = [
    { chave: 'id', titulo: 'Cód.' },
    { chave: 'matricula', titulo: 'Matrícula' },
    { chave: 'nome', titulo: 'Nome Completo' },
    { chave: 'cpf', titulo: 'CPF' },
    { chave: 'email', titulo: 'E-mail' },
    { chave: 'sexo', titulo: 'Gênero' },
    { chave: 'ativo', titulo: 'Ativo' },
  ];

  isModalAberto: boolean = false;

  alunoForm!: FormGroup<{
    nome: FormControl<string | null>;
    cpf: FormControl<string | null>;
    email: FormControl<string | null>;
    dataNascimento: FormControl<string | null>;
    sexo: FormControl<string | null>;
  }>;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.alunoForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      dataNascimento: ['', Validators.required],
      sexo: ['', Validators.required],
    });
  }

  AdicionarAluno() {
    if (this.alunoForm.invalid) {
      console.log('Formulário inválido');
      return;
    }

    const dadosAluno = this.alunoForm.value;

    const proximoId =
      this.listaAlunos.length > 0 ? Math.max(...this.listaAlunos.map((a) => a.id)) + 1 : 1;

    const novoAluno: AlunoInterface = {
      id: proximoId,
      matricula: (proximoId + 2026000).toString(),
      nome: dadosAluno.nome!,
      cpf: dadosAluno.cpf!,
      email: dadosAluno.email!,
      sexo: dadosAluno.sexo! as SexoEnum,
      dataNascimento: new Date(dadosAluno.dataNascimento!),
      ativo: true,
    };

    this.listaAlunos.push(novoAluno);

    this.isModalAberto = false;
    this.alunoForm.reset();
  }

  abrirModal() {
    this.isModalAberto = true;
  }
}
