import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthFacadeService } from '../../../core/facades/auth-facade.service';
import { PapelUsuario } from '../../types/papel-usuario.type';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  let fixture: ComponentFixture<NavBarComponent>;

  function montar(papel: PapelUsuario | null): void {
    TestBed.configureTestingModule({
      imports: [NavBarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthFacadeService, useValue: { papel: signal(papel) } },
      ],
    });
    fixture = TestBed.createComponent(NavBarComponent);
    fixture.detectChanges();
  }

  function hrefsDosLinks(): (string | null)[] {
    return fixture.debugElement
      .queryAll(By.css('.navbar-links a'))
      .map((de) => de.nativeElement.getAttribute('href'));
  }

  it('mostra só /alunos para o Docente', () => {
    montar('Docente');

    expect(hrefsDosLinks()).toEqual(['/alunos']);
  });

  it('mostra os 5 links, na ordem do menu, para o Coordenador', () => {
    montar('Coordenador');

    expect(hrefsDosLinks()).toEqual([
      '/alunos',
      '/docentes',
      '/dashboard',
      '/turmas',
      '/tree-view',
    ]);
  });

  it('mostra os 5 links, na ordem do menu, para o Admin', () => {
    montar('Admin');

    expect(hrefsDosLinks()).toEqual([
      '/alunos',
      '/docentes',
      '/dashboard',
      '/turmas',
      '/tree-view',
    ]);
  });

  it('não mostra nenhum link quando não há papel', () => {
    montar(null);

    expect(hrefsDosLinks()).toEqual([]);
  });

  it('reage à troca de papel: mostra os links do papel novo e some de novo ao voltar a null', () => {
    const papel = signal<PapelUsuario | null>(null);
    TestBed.configureTestingModule({
      imports: [NavBarComponent],
      providers: [provideRouter([]), { provide: AuthFacadeService, useValue: { papel } }],
    });
    fixture = TestBed.createComponent(NavBarComponent);
    fixture.detectChanges();

    expect(hrefsDosLinks()).toEqual([]);

    papel.set('Docente');
    fixture.detectChanges();

    expect(hrefsDosLinks()).toEqual(['/alunos']);

    papel.set(null);
    fixture.detectChanges();

    expect(hrefsDosLinks()).toEqual([]);
  });

  it('mostra o rótulo de cada item de menu como texto do link, para o Coordenador', () => {
    montar('Coordenador');

    const textosDosLinks = fixture.debugElement
      .queryAll(By.css('.navbar-links a'))
      .map((de) => (de.nativeElement as HTMLElement).textContent?.trim());

    expect(textosDosLinks).toEqual([
      'NAVBAR.ALUNOS',
      'NAVBAR.DOCENTES',
      'NAVBAR.DASHBOARD',
      'NAVBAR.TURMAS',
      'NAVBAR.TREE_VIEW',
    ]);
  });
});
