import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials',
  imports: [CommonModule],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.css'
})
export class Testimonials {
  testimonials = [
    {
      name: 'Arjun Patel',
      text: 'Amazing experience! The barbers really know their craft. My haircut was perfect and the hot towel shave was incredibly relaxing. Will definitely be coming back.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      service: 'Complete Grooming Package'
    },
    {
      name: 'Vikram Singh',
      text: 'Clean Cut Lounge is the best barbershop in Tumakuru! Professional service, great atmosphere, and reasonable prices. The champi was absolutely divine.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      service: 'Champi & Haircut'
    },
    {
      name: 'Rohit Kumar',
      text: 'I have been a regular customer for 2 years now. The consistency in quality and the friendly staff make this place special. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      service: 'Regular Customer'
    },
    {
      name: 'Suresh Reddy',
      text: 'Excellent beard trimming service! They really understand how to shape a beard properly. The barbers are skilled and pay attention to detail.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      service: 'Beard Trim & Shape'
    },
    {
      name: 'Karthik Nair',
      text: 'The hot towel shave here is unmatched! Traditional techniques with modern comfort. The whole experience was premium and worth every rupee.',
      avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      service: 'Hot Towel Shave'
    },
    {
      name: 'Deepak Sharma',
      text: 'Clean environment, professional staff, and excellent results. My go-to place for all grooming needs. The booking system is also very convenient.',
      avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      service: 'Classic Haircut'
    }
  ];
}