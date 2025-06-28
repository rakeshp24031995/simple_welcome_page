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
    { 
      name: 'Classic Haircut', 
      description: 'Traditional cuts with modern flair', 
      price: '$25',
      image: 'https://images.unsplash.com/photo-1622286346003-c8e7fa8b5e2e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Beard Trim', 
      description: 'Professional beard shaping and styling', 
      price: '$15',
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Hot Towel Shave', 
      description: 'Luxurious traditional shaving experience', 
      price: '$30',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    { 
      name: 'Hair Wash & Style', 
      description: 'Complete hair care and styling', 
      price: '$20',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ];
}
