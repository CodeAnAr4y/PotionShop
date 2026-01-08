import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';

beforeAll(() => {
  registerLocaleData(localeRu, 'ru');
});
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Лавка Зельевара');
  });
});
