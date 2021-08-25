import { ElementRef, ViewChild } from '@angular/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-email-modal',
  templateUrl: './email-modal.component.html',
  styleUrls: ['./email-modal.component.less']
})
export class EmailModalComponent implements OnInit {

  @Input() open = true;
  @Output() closed = new EventEmitter<boolean>();

  @ViewChild('input') input: ElementRef;
  emailAddress: string = null;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

  close(result) {
    if (result === false) {
      this.closed.next(result);
    } else {
      this.api.sendEmail(this.emailAddress).subscribe(() => {
        this.closed.next(result);
      }
    }
  }

  get hasEmail() {
    const el = this.input ? this.input.nativeElement as HTMLInputElement : null;
    const valid = !el || el.checkValidity();
    return !!this.emailAddress && valid; 
  }

}
