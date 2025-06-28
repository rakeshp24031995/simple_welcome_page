import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit {
  newsletterForm!: FormGroup;
  isSubscribing = false;
  currentYear = new Date().getFullYear();

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onNewsletterSubmit() {
    if (this.newsletterForm.valid) {
      this.isSubscribing = true;
      
      // Simulate newsletter subscription
      console.log('Newsletter Subscription:', this.newsletterForm.value);
      
      setTimeout(() => {
        this.isSubscribing = false;
        alert('Thank you for subscribing! You will receive updates on new services and offers.');
        this.newsletterForm.reset();
      }, 1500);
    }
  }
}