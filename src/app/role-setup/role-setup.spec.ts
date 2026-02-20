import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleSetup } from './role-setup';

describe('RoleSetup', () => {
  let component: RoleSetup;
  let fixture: ComponentFixture<RoleSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
