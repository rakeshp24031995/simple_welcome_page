import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.css'
})
export class OtpInput implements OnInit, AfterViewInit, OnDestroy {
  @Input() length: number = 6;
  @Input() disabled: boolean = false;
  @Input() autoFocus: boolean = true;
  @Output() otpChange = new EventEmitter<string>();
  @Output() otpComplete = new EventEmitter<string>();

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  otpValues: string[] = [];
  private timer: any;
  countdown: number = 0;
  showResend: boolean = true;

  ngOnInit(): void {
    this.otpValues = new Array(this.length).fill('');
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      setTimeout(() => {
        this.focus();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  onInputChange(event: any, index: number): void {
    if (this.disabled) return;

    let value = event.target.value;
    console.log(`🔢 OTP Input [${index}]: "${value}"`);
    
    // Only allow numeric values
    value = value.replace(/\D/g, '');
    
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Update the model and the input
    this.otpValues[index] = value;
    event.target.value = value;
    
    console.log(`✅ OTP Updated [${index}]: "${value}", Array: [${this.otpValues.join(', ')}]`);
    
    // Move to next input if current is filled
    if (value && index < this.length - 1) {
      setTimeout(() => {
        const nextInput = this.otpInputs.toArray()[index + 1];
        if (nextInput) {
          nextInput.nativeElement.focus();
          nextInput.nativeElement.select();
        }
      }, 10);
    }

    this.emitOtpChange();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (this.disabled) return;

    // Handle backspace
    if (event.key === 'Backspace') {
      if (!this.otpValues[index] && index > 0) {
        const prevInput = this.otpInputs.toArray()[index - 1];
        if (prevInput) {
          prevInput.nativeElement.focus();
          this.otpValues[index - 1] = '';
          this.emitOtpChange();
        }
      } else {
        this.otpValues[index] = '';
        this.emitOtpChange();
      }
    }
    
    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = this.otpInputs.toArray()[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
      }
    }
    
    if (event.key === 'ArrowRight' && index < this.length - 1) {
      const nextInput = this.otpInputs.toArray()[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    if (this.disabled) return;

    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const pasteArray = paste.replace(/\D/g, '').split('').slice(0, this.length);
    
    for (let i = 0; i < this.length; i++) {
      this.otpValues[i] = pasteArray[i] || '';
    }
    
    // Focus on the last filled input or next empty input
    const lastIndex = Math.min(pasteArray.length - 1, this.length - 1);
    const targetInput = this.otpInputs.toArray()[lastIndex];
    if (targetInput) {
      targetInput.nativeElement.focus();
    }
    
    this.emitOtpChange();
  }

  private emitOtpChange(): void {
    const otp = this.otpValues.join('');
    console.log(`📡 OTP Change - Current: "${otp}", Length: ${otp.length}, Target: ${this.length}`);
    this.otpChange.emit(otp);
    
    if (otp.length === this.length && !otp.includes('')) {
      console.log(`🎯 OTP Complete! Emitting: "${otp}"`);
      this.otpComplete.emit(otp);
    } else {
      console.log(`⏳ OTP Incomplete - Length: ${otp.length}/${this.length}, Has Empty: ${otp.includes('')}`);
    }
  }

  clear(): void {
    console.log('🧹 Clearing OTP inputs');
    this.otpValues = new Array(this.length).fill('');
    
    // Clear all input values manually
    this.otpInputs.forEach((input, index) => {
      input.nativeElement.value = '';
    });
    
    const firstInput = this.otpInputs.toArray()[0];
    if (firstInput) {
      firstInput.nativeElement.focus();
    }
    this.emitOtpChange();
  }

  focus(): void {
    const firstEmptyIndex = this.otpValues.findIndex(value => !value);
    const targetIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0;
    const targetInput = this.otpInputs.toArray()[targetIndex];
    if (targetInput) {
      targetInput.nativeElement.focus();
    }
  }

  private startCountdown(): void {
    this.countdown = 60; // 60 seconds countdown
    this.showResend = false;
    
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.showResend = true;
        clearInterval(this.timer);
      }
    }, 1000);
  }

  resendOtp(): void {
    this.startCountdown();
    this.clear();
  }

  get otpValue(): string {
    return this.otpValues.join('');
  }

  get isComplete(): boolean {
    return this.otpValues.every(value => value !== '') && this.otpValues.length === this.length;
  }
}