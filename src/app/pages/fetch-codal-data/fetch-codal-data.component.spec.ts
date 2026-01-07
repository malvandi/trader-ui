import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchCodalDataComponent } from './fetch-codal-data.component';

describe('FetchCodalDataComponent', () => {
  let component: FetchCodalDataComponent;
  let fixture: ComponentFixture<FetchCodalDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchCodalDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FetchCodalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
