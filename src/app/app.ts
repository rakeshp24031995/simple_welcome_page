import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Clean Cut';
  
  services = [
    { name: 'Classic Haircut', description: 'Traditional cuts with modern flair', price: '$25' },
    { name: 'Beard Trim', description: 'Professional beard shaping and styling', price: '$15' },
    { name: 'Hot Towel Shave', description: 'Luxurious traditional shaving experience', price: '$30' },
    { name: 'Hair Wash & Style', description: 'Complete hair care and styling', price: '$20' }
  ];
}
