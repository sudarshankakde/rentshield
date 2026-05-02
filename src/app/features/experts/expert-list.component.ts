import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User, Star, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-expert-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Local Experts</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Verified Professionals in your locality</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let e of experts" class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
          <div class="flex flex-col items-center text-center">
             <div class="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 mb-6 border-4 border-white shadow-md">
                <lucide-icon [name]="UserIcon" size="40"></lucide-icon>
             </div>
             <h3 class="text-xl font-black text-slate-900 tracking-tight">{{e.name}}</h3>
             <p class="text-indigo-600 font-bold text-sm mb-4">{{e.specialty}}</p>
             
             <div class="flex items-center gap-1 mb-6">
                <lucide-icon *ngFor="let i of [1,2,3,4,5]" 
                            [name]="StarIcon" 
                            size="14" 
                            [class]="i <= e.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'"></lucide-icon>
             </div>

             <div class="flex items-center gap-2 text-slate-400 text-xs font-bold mb-8">
                <lucide-icon [name]="MapIcon" size="14"></lucide-icon>
                {{e.distance}} away
             </div>

             <button class="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">
                Book Consultation
             </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExpertListComponent {
  readonly UserIcon = User;
  readonly StarIcon = Star;
  readonly MapIcon = MapPin;

  experts = [
    { name: 'Dr. Sameer Joshi', specialty: 'Legal Consultant', rating: 5, distance: '2.5 km' },
    { name: 'Ar. Neha Gupta', specialty: 'Interior Designer', rating: 4, distance: '1.2 km' },
    { name: 'Shyam Lal', specialty: 'Master Plumber', rating: 5, distance: '0.8 km' }
  ];
}
