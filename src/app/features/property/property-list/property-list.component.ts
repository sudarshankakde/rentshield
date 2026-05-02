import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, MapPin, IndianRupee, Filter, Circle, Wifi, Car, Waves, Dumbbell } from 'lucide-angular';
import { RentShieldApiService } from '../../../core/api/rentshield-api.service';

import { readArray, readNumber, readString } from '../../../core/api/request-validation';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

interface Property {
  id: string;
  name: string;
  address: string;
  rent: number;
  status: 'Occupied' | 'Vacant';
  image: string;
  amenities: string[];
  location: string;
}

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8 pb-20">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 class="text-4xl font-black text-slate-900 tracking-tight">Property Discovery</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Explore elite real estate in our verification network</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative group">
            <lucide-icon [name]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size="18"></lucide-icon>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by name or street..." 
              class="pl-12 pr-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl w-full md:w-80 font-semibold text-slate-900 transition-all shadow-sm outline-none">
          </div>
          <button (click)="showFilters.set(!showFilters())" 
                  class="p-4 rounded-3xl border border-slate-200 hover:bg-slate-50 transition-all relative"
                  [class.bg-indigo-50]="showFilters()"
                  [class.border-indigo-200]="showFilters()">
            <lucide-icon [name]="FilterIcon" size="18" [class.text-indigo-600]="showFilters()"></lucide-icon>
            <span *ngIf="activeFiltersCount() > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
              {{activeFiltersCount()}}
            </span>
          </button>
        </div>
      </div>

      <!-- Advanced Filters Panel -->
      <div *ngIf="showFilters()" class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Location Filter -->
        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <lucide-icon [name]="MapIcon" size="12"></lucide-icon>
            City / Location
          </label>
          <select 
            [ngModel]="selectedLocation()" 
            (ngModelChange)="selectedLocation.set($event)"
            class="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors">
            <option value="">All Locations</option>
            <option *ngFor="let loc of uniqueLocations()" [value]="loc">{{loc}}</option>
          </select>
        </div>

        <!-- Rent Range Filter -->
        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <lucide-icon [name]="RupeeIcon" size="12"></lucide-icon>
            Max Monthly Rent (₹{{maxRent() | number}})
          </label>
          <input 
            type="range" 
            min="10000" 
            max="100000" 
            step="5000"
            [ngModel]="maxRent()" 
            (ngModelChange)="maxRent.set($event)"
            class="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none">
          <div class="flex justify-between text-[10px] font-bold text-slate-400">
            <span>₹10K</span>
            <span>₹100K</span>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             Status
          </label>
          <div class="flex gap-2">
            <button 
              *ngFor="let s of ['All', 'Vacant', 'Occupied']"
              (click)="selectedStatus.set(s)"
              class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border"
              [class.bg-slate-900]="selectedStatus() === s"
              [class.text-white]="selectedStatus() === s"
              [class.border-slate-900]="selectedStatus() === s"
              [class.bg-white]="selectedStatus() !== s"
              [class.text-slate-400]="selectedStatus() !== s"
              [class.border-slate-100]="selectedStatus() !== s">
              {{s}}
            </button>
          </div>
        </div>

        <!-- Amenities Filter -->
        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Amenities
          </label>
          <div class="flex flex-wrap gap-2">
            <button 
              *ngFor="let am of allAmenities"
              (click)="toggleAmenity(am)"
              class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5"
              [class.bg-indigo-50]="selectedAmenities().includes(am)"
              [class.text-indigo-600]="selectedAmenities().includes(am)"
              [class.border-indigo-200]="selectedAmenities().includes(am)"
              [class.bg-white]="!selectedAmenities().includes(am)"
              [class.text-slate-400]="!selectedAmenities().includes(am)"
              [class.border-slate-100]="!selectedAmenities().includes(am)">
              <lucide-icon [name]="getAmenityIcon(am)" size="10"></lucide-icon>
              {{am}}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="error()" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-500">
        Loading properties from backend...
      </div>

      <!-- Results Grid -->
      <div *ngIf="filteredProperties().length > 0; else noResults" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let p of filteredProperties()" class="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
          <div class="h-64 bg-slate-200 relative overflow-hidden">
            <img [src]="p.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
            <div class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div class="absolute top-6 right-6">
              <span class="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20"
                    [ngClass]="{
                      'bg-emerald-500/90 text-white': p.status === 'Vacant',
                      'bg-white/90 text-slate-900': p.status === 'Occupied'
                    }">
                {{p.status}}
              </span>
            </div>

            <div class="absolute bottom-6 left-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform">
               <div class="flex gap-2">
                 <span *ngFor="let am of p.amenities" class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center" [title]="am">
                   <lucide-icon [name]="getAmenityIcon(am)" size="14"></lucide-icon>
                 </span>
               </div>
            </div>
          </div>
          
          <div class="p-8">
            <div class="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">
              <lucide-icon [name]="MapIcon" size="12"></lucide-icon>
              {{p.location}}
            </div>
            <h3 class="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{{p.name}}</h3>
            <p class="text-slate-400 text-sm font-bold mb-6">{{p.address}}</p>
            
            <div class="flex items-center justify-between pt-6 border-t border-slate-100">
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Rent</span>
                <span class="text-xl font-black text-slate-900">₹{{p.rent | number}}</span>
              </div>
              <button class="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noResults>
        <div class="flex flex-col items-center justify-center py-32 text-center">
          <div class="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mb-6">
            <lucide-icon [name]="SearchIcon" size="48"></lucide-icon>
          </div>
          <h3 class="text-2xl font-black text-slate-900 tracking-tight">No properties match your hunt</h3>
          <p class="text-slate-400 font-bold max-w-sm mt-2">Adjust your filters or search terms to discover more verified premium spaces.</p>
          <button (click)="resetFilters()" class="mt-8 text-indigo-600 font-black text-xs uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all pb-1">
            Clear all filters
          </button>
        </div>
      </ng-template>
    </div>
  `
})
export class PropertyListComponent {
  private api = inject(RentShieldApiService);

  readonly SearchIcon = Search;
  readonly MapIcon = MapPin;
  readonly RupeeIcon = IndianRupee;
  readonly FilterIcon = Filter;

  showFilters = signal(false);
  searchQuery = signal('');
  selectedLocation = signal('');
  maxRent = signal(100000);
  selectedStatus = signal('All');
  selectedAmenities = signal<string[]>([]);

  propertiesQuery = injectQuery(() => ({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.properties.list() as any);
      return this.extractProperties(response);
    }
  }));

  loading = this.propertiesQuery.isLoading;
  error = computed(() => this.propertiesQuery.error()?.message);
  
  properties = computed(() => this.propertiesQuery.data() || []);

  uniqueLocations = computed(() => Array.from(new Set(this.properties().map(p => p.location))).sort());
  allAmenities = ['Gym', 'Pool', 'Parking', 'Wifi'];

  filteredProperties = computed(() => {
    return this.properties().filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
                            p.address.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesLocation = !this.selectedLocation() || p.location === this.selectedLocation();
      const matchesRent = p.rent <= this.maxRent();
      const matchesStatus = this.selectedStatus() === 'All' || p.status === this.selectedStatus();
      const matchesAmenities = this.selectedAmenities().every(am => p.amenities.includes(am));

      return matchesSearch && matchesLocation && matchesRent && matchesStatus && matchesAmenities;
    });
  });

  private extractProperties(payload: unknown): Property[] {
    const source: unknown[] = Array.isArray(payload)
      ? payload
      : (payload && typeof payload === 'object'
          ? (readArray((payload as Record<string,unknown>)['results']) ||
             readArray((payload as Record<string,unknown>)['properties']) ||
             readArray((payload as Record<string,unknown>)['data']))
          : []);

    return source
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const record = entry as Record<string, unknown>;
        const statusRaw = readString(record['status'], 'AVAILABLE').toUpperCase();
        const status: Property['status'] = statusRaw === 'RENTED' || statusRaw === 'OCCUPIED' ? 'Occupied' : 'Vacant';

        return {
          id: readString(record['id'], crypto.randomUUID()),
          name: readString(record['title']) || readString(record['name'], 'Property'),
          address: readString(record['address'], 'Address unavailable'),
          location: readString(record['city'], 'Unknown city'),
          rent: readNumber(record['price'], readNumber(record['rent'], 0)),
          status,
          amenities: readArray(record['amenities']).map((a) => readString(a)).filter(Boolean),
          image: readString(record['image']) || readString(readArray(record['photoUrls'])[0], 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'),
        } as Property;
      })
      .filter((item): item is Property => item !== null);
  }

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedLocation()) count++;
    if (this.maxRent() < 100000) count++;
    if (this.selectedStatus() !== 'All') count++;
    if (this.selectedAmenities().length > 0) count++;
    return count;
  });

  toggleAmenity(am: string) {
    const current = this.selectedAmenities();
    if (current.includes(am)) {
      this.selectedAmenities.set(current.filter(a => a !== am));
    } else {
      this.selectedAmenities.set([...current, am]);
    }
  }

  getAmenityIcon(am: string) {
    switch (am) {
      case 'Gym': return Dumbbell;
      case 'Pool': return Waves;
      case 'Parking': return Car;
      case 'Wifi': return Wifi;
      default: return Circle;
    }
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedLocation.set('');
    this.maxRent.set(100000);
    this.selectedStatus.set('All');
    this.selectedAmenities.set([]);
  }
}
