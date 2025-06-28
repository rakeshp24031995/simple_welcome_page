import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services',
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.css'
})
export class Services {
  services = [
    {
      name: 'Classic Haircut',
      description: 'Traditional cuts with modern flair, tailored to your face shape and style preference.',
      price: '₹150',
      image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      features: ['Hair Wash', 'Styling', '15 min service']
    },
    {
      name: 'Beard Trim & Shape',
      description: 'Professional beard shaping and styling for a distinguished look.',
      price: '₹100',
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      features: ['Precision trim', 'Beard oil', '10 min service']
    },
    {
      name: 'Hot Towel Shave',
      description: 'Luxurious traditional shaving experience with hot towel treatment.',
      price: '₹200',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      features: ['Hot towel', 'Premium cream', '20 min service']
    },
    {
      name: 'Champi (Head Massage)',
      description: 'Relaxing traditional Indian head massage with aromatic oils.',
      price: '₹120',
      image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      features: ['Herbal oils', 'Stress relief', '15 min service']
    }
  ];
}
