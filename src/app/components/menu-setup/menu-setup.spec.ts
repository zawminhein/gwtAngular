import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuSetup } from './menu-setup';

describe('MenuSetup', () => {
  let component: MenuSetup;
  let fixture: ComponentFixture<MenuSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
