import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import all home page components
import { Hero } from '../components/hero/hero';
import { About } from '../components/about/about';
import { Services } from '../components/services/services';
import { Gallery } from '../components/gallery/gallery';
import { Testimonials } from '../components/testimonials/testimonials';
import { Contact } from '../components/contact/contact';
import { Footer } from '../components/footer/footer';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    Hero,
    About,
    Services,
    Gallery,
    Testimonials,
    Contact,
    Footer
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {}