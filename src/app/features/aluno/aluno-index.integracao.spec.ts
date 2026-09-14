import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environments';
import { SexoEnum } from '../../shared/enums/sexo.enum';
import { AlunoIndex } from './aluno-index.component';

const URL_ALUNOS = `${environment.apiUrl}/alunos`;
const URL_BUSCA = `${URL_ALUNOS}/buscar`;

const PAGINA_VAZIA = {
  itens: [],
  paginaAtual: 1,
  totalPaginas: 0,
  totalResultados: 0,
  tamanhoPagina: 10,
};

const CPF_VALIDO = '52998224725';
const CPF_INVALIDO = '11111111111';

describe('AlunoIndex: cadastro ponta a ponta', () => {
  let fixture: ComponentFixture<AlunoIndex>;
  let http: HttpTestingController;

  const dom = () => fixture.nativeElement as HTMLElement;

  const campoTexto = (chavePlaceholder: string) =>
    fixture.debugElement.query(By.css(`input[placeholder="${chavePlaceholder}"]`))
      .nativeElement as HTMLInputElement;

  const dialogCadastro = () =>
    fixture.debugElement.queryAll(By.css('app-modal dialog'))[0].nativeElement as HTMLDialogElement;

  const preencher = (elemento: HTMLInputElement | HTMLSelectElement, valor: string) => {
    elemento.value = valor;
    elemento.dispatchEvent(new Event('input'));
    elemento.dispatchEvent(new Event('change'));
    elemento.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  const abrirModalDeCadastro = () => {
    (dom().querySelector('.acoes-topo app-botao button') as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  const preencherFormulario = (cpf: string) => {
    preencher(campoTexto('ALUNO.FORMULARIO.NOME_PLACEHOLDER'), 'Maria Souza');
    preencher(campoTexto('ALUNO.FORMULARIO.CPF_PLACEHOLDER'), cpf);
    preencher(campoTexto('ALUNO.FORMULARIO.EMAIL_PLACEHOLDER'), 'maria.souza@escola.com');
    preencher(
      fixture.debugElement.query(By.css('form.formAluno app-date-picker input.gatilho'))
        .nativeElement as HTMLInputElement,
      '12/03/2008',
    );
    preencher(
      fixture.debugElement.query(By.css('form.formAluno app-form-field-select select'))
        .nativeElement as HTMLSelectElement,
      String(SexoEnum.FEMININO),
    );
  };

  const submeter = () => {
    (
      dom().querySelector('form.formAluno app-botao button[type="submit"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AlunoIndex);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.match((r) => r.url.includes('/feriados/v1')).forEach((r) => r.flush([]));
    vi.advanceTimersByTime(0);
    http.expectOne(URL_BUSCA).flush(PAGINA_VAZIA);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('formulário preenchido pelo DOM vira POST, recarga e alerta de sucesso', () => {
    abrirModalDeCadastro();
    expect(dialogCadastro().open).toBe(true);

    preencherFormulario(CPF_VALIDO);
    submeter();

    const criacao = http.expectOne(URL_ALUNOS);
    expect(criacao.request.method).toBe('POST');
    expect(criacao.request.body).toEqual({
      nome: 'Maria Souza',
      cpf: CPF_VALIDO,
      email: 'maria.souza@escola.com',
      dataNascimento: '2008-03-12',
      sexo: SexoEnum.FEMININO,
    });
    criacao.flush(null);
    fixture.detectChanges();

    vi.advanceTimersByTime(0);
    http.expectOne(URL_BUSCA).flush(PAGINA_VAZIA);
    fixture.detectChanges();

    expect(dom().querySelector('.alerta-pagina .caixa-mensagem')?.textContent).toContain(
      'MENSAGEM.SUCESSO_CADASTRO_ALUNO',
    );
    expect(dialogCadastro().open).toBe(false);
  });

  it('CPF inválido não sai da tela e acende o erro do campo', () => {
    abrirModalDeCadastro();

    preencherFormulario(CPF_INVALIDO);
    submeter();

    http.expectNone(URL_ALUNOS);
    http.expectNone(URL_BUSCA);

    const erroDoCampo = fixture.debugElement
      .queryAll(By.css('form.formAluno app-form-field-text .error-message'))
      .map((e) => (e.nativeElement as HTMLElement).textContent?.trim());
    expect(erroDoCampo).toContain('VALIDACAO.CPF_INVALIDO');

    expect(dom().querySelector('app-modal .caixa-mensagem')?.textContent).toContain(
      'MENSAGEM.FORMULARIO_INVALIDO',
    );
    expect(dialogCadastro().open).toBe(true);
  });

  it('nome com menos de 3 caracteres mostra a mensagem de tamanho mínimo, não a de campo obrigatório', () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('pt-BR', {
      VALIDACAO: { TAMANHO_MINIMO: 'Use ao menos {{requiredLength}} caracteres.' },
    });
    translate.use('pt-BR');

    abrirModalDeCadastro();
    preencher(campoTexto('ALUNO.FORMULARIO.NOME_PLACEHOLDER'), 'ab');

    const erroNome = fixture.debugElement
      .queryAll(By.css('form.formAluno app-form-field-text .error-message'))
      .map((e) => (e.nativeElement as HTMLElement).textContent?.trim())[0];

    expect(erroNome).toContain('3');
    expect(erroNome).not.toContain('{{requiredLength}}');
    expect(erroNome).not.toMatch(/obrigat/i);
  });

  it('email vazio tocado mostra a mensagem de campo obrigatório, não a de email inválido', () => {
    abrirModalDeCadastro();
    campoTexto('ALUNO.FORMULARIO.EMAIL_PLACEHOLDER').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const erroEmail = fixture.debugElement
      .queryAll(By.css('form.formAluno app-form-field-text .error-message'))
      .map((e) => (e.nativeElement as HTMLElement).textContent?.trim())[0];

    expect(erroEmail).toBe('VALIDACAO.OBRIGATORIO');
  });
});
