import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GainComponent } from './gain.component';

describe('GainComponent', () => {
  let component: GainComponent;
  let fixture: ComponentFixture<GainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
