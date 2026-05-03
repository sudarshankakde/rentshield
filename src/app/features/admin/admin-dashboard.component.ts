import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShieldAlert, Cpu, Activity, Database, LayoutDashboard, RefreshCw, Users, FileText, CheckCircle, XCircle, Search, Edit2, Trash2, Plus } from 'lucide-angular';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { AuthService } from '../../core/services/auth.service';
import { AdminDataService } from './admin.service';
import { ToastService } from '../../core/services/toast.service';

type Tab = 'DASHBOARD' | 'MODULES' | 'ROLES' | 'USERS' | 'KYC' | 'PROPERTIES';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-7xl mx-auto pb-20">
      
      <!-- Header & Navigation -->
      <header class="flex flex-col xl:flex-row xl:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
         <div class="relative">
            <h1 class="text-4xl font-black text-text tracking-tighter flex items-center gap-4">
              Super Admin Control
              <span class="inline-block w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></span>
            </h1>
            <p class="text-text-muted mt-2 font-medium">Manage platform modules, roles, users, and compliance.</p>
         </div>

         <!-- Tab Navigation -->
         <div class="flex items-center gap-2 p-1.5 bg-surface-soft border border-border rounded-2xl overflow-x-auto">
            <button *ngFor="let t of tabs" 
                    (click)="activeTab.set(t.id)"
                    class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap"
                    [ngClass]="activeTab() === t.id ? 'bg-slate-900 text-white shadow-md dark:bg-brand-primary' : 'text-text-soft hover:bg-surface hover:text-text'">
              {{ t.label }}
            </button>
         </div>
      </header>

      <!-- TAB: DASHBOARD -->
      <div *ngIf="activeTab() === 'DASHBOARD'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-surface p-6 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between h-40">
            <div class="flex items-center gap-3 text-text-muted">
              <lucide-icon [name]="UsersIcon" size="20"></lucide-icon>
              <span class="text-xs font-bold uppercase tracking-wider">Total Users</span>
            </div>
            <p class="text-5xl font-black text-text">{{ statsQuery.data()?.stats?.users || 0 }}</p>
          </div>
          <div class="bg-surface p-6 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between h-40">
            <div class="flex items-center gap-3 text-text-muted">
              <lucide-icon [name]="FileTextIcon" size="20"></lucide-icon>
              <span class="text-xs font-bold uppercase tracking-wider">Properties</span>
            </div>
            <p class="text-5xl font-black text-text">{{ statsQuery.data()?.stats?.properties || 0 }}</p>
          </div>
          <div class="bg-surface p-6 rounded-[2rem] border border-border shadow-sm flex flex-col justify-between h-40">
            <div class="flex items-center gap-3 text-amber-500">
              <lucide-icon [name]="ShieldAlertIcon" size="20"></lucide-icon>
              <span class="text-xs font-bold uppercase tracking-wider">Pending KYC</span>
            </div>
            <p class="text-5xl font-black text-text">{{ statsQuery.data()?.stats?.pendingKyc || 0 }}</p>
          </div>
          <div class="bg-slate-900 dark:bg-brand-primary p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-between h-40 relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 opacity-10">
              <lucide-icon [name]="ActivityIcon" size="120"></lucide-icon>
            </div>
            <div class="flex items-center gap-3 relative z-10">
              <lucide-icon [name]="CpuIcon" size="20"></lucide-icon>
              <span class="text-xs font-bold uppercase tracking-wider text-white/70">Active Modules</span>
            </div>
            <p class="text-5xl font-black relative z-10">{{ statsQuery.data()?.stats?.activeModules || 0 }} <span class="text-2xl text-white/50">/ {{ statsQuery.data()?.stats?.modules || 0 }}</span></p>
          </div>
        </div>

        <!-- Quick Module Toggles & System Actions -->
        <div class="bg-surface p-8 lg:p-10 rounded-[3rem] border border-border shadow-sm">
           <div class="flex items-center justify-between mb-8">
              <div>
                 <h2 class="text-2xl font-black text-text">Platform Overview</h2>
                 <p class="text-text-muted text-sm mt-1">Enable or disable core system components globally.</p>
              </div>
              <div class="flex gap-3">
                <button (click)="seedDefaultModules()" class="px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-lg">
                  <lucide-icon [name]="DatabaseIcon" size="16"></lucide-icon>
                  Seed Core Data
                </button>
                <button (click)="modulesQuery.refetch()" class="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-soft border border-border text-text-muted hover:text-brand-primary transition-colors">
                  <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="modulesQuery.isFetching()"></lucide-icon>
                </button>
              </div>
           </div>

           <div *ngIf="modulesQuery.isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let i of [1,2,3,4,5,6]" class="h-24 rounded-2xl bg-surface-soft animate-pulse"></div>
           </div>

           <div *ngIf="!modulesQuery.isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let m of modules()" 
                    (click)="toggleModuleMutation.mutate(m)"
                    class="flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer"
                    [ngClass]="m.isActive ? 'border-brand-primary/20 bg-brand-primary/5' : 'border-border bg-surface hover:border-text-soft/30'">
                  
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" [ngClass]="m.isActive ? 'bg-brand-primary text-white shadow-md' : 'bg-surface-soft text-text-muted'">
                       <lucide-icon [name]="LayoutDashboardIcon" size="20"></lucide-icon>
                     </div>
                     <div>
                        <h3 class="font-bold text-text" [ngClass]="{'text-brand-primary': m.isActive}">{{m.label || m.name}}</h3>
                        <p class="text-xs font-semibold text-text-muted mt-0.5">{{m.isActive ? 'Active' : 'Disabled'}}</p>
                     </div>
                  </div>

                  <div class="w-11 h-6 rounded-full p-1 transition-all border-2" [ngClass]="m.isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-surface-soft border-border'">
                     <div class="w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform" [style.transform]="m.isActive ? 'translateX(1.25rem)' : 'none'"></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- TAB: MODULES -->
      <div *ngIf="activeTab() === 'MODULES'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div class="bg-surface p-8 rounded-[3rem] border border-border shadow-sm">
            <div class="flex items-center justify-between mb-8">
               <div>
                  <h2 class="text-2xl font-black text-text">Module Configuration</h2>
                  <p class="text-text-muted text-sm mt-1">Create, update, and delete modules and features.</p>
               </div>
               <button (click)="createModuleMode = true" class="px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-sm hover:bg-brand-primary-dark">
                  <lucide-icon [name]="PlusIcon" size="16"></lucide-icon> New Module
               </button>
            </div>

            <!-- Create Module Form -->
            <div *ngIf="createModuleMode" class="mb-8 p-6 bg-surface-soft border border-border rounded-2xl">
               <h3 class="font-bold text-lg mb-4">Create New Module</h3>
               <div class="flex gap-4">
                  <input type="text" [(ngModel)]="newModule.name" placeholder="Module Slug (e.g. 'inventory')" class="flex-1 px-4 py-2 bg-surface border border-border rounded-xl">
                  <input type="text" [(ngModel)]="newModule.label" placeholder="Display Label (e.g. 'Inventory')" class="flex-1 px-4 py-2 bg-surface border border-border rounded-xl">
                  <button (click)="submitCreateModule()" class="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition-colors">Save</button>
                  <button (click)="createModuleMode = false" class="px-6 py-2 bg-surface border border-border text-text font-bold rounded-xl hover:bg-surface-soft transition-colors">Cancel</button>
               </div>
            </div>

            <div class="space-y-4">
               <div *ngFor="let m of modules()" class="border border-border rounded-2xl bg-surface-soft overflow-hidden">
                  <div class="flex items-center justify-between p-4 bg-surface cursor-pointer hover:bg-surface-soft/50 transition-colors" (click)="selectedModuleId = selectedModuleId === m.id ? null : m.id">
                     <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                           <lucide-icon [name]="LayoutDashboardIcon" size="18"></lucide-icon>
                        </div>
                        <div>
                           <h3 class="font-bold text-text">{{m.label || m.name}}</h3>
                           <p class="text-xs text-text-muted mt-0.5">Slug: {{m.name}}</p>
                        </div>
                     </div>
                     <div class="flex items-center gap-2">
                        <button (click)="startEditModule(m); $event.stopPropagation()" class="p-2 text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors" title="Edit Module">
                           <lucide-icon [name]="Edit2Icon" size="16"></lucide-icon>
                        </button>
                        <button (click)="deleteModule(m.id); $event.stopPropagation()" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Module">
                           <lucide-icon [name]="Trash2Icon" size="16"></lucide-icon>
                        </button>
                     </div>
                  </div>

                  <!-- Edit Module Form -->
                  <div *ngIf="editingModuleId === m.id" class="p-4 border-t border-border bg-surface">
                     <div class="flex gap-4">
                        <input type="text" [(ngModel)]="editModuleForm.name" placeholder="Slug" class="flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-sm">
                        <input type="text" [(ngModel)]="editModuleForm.label" placeholder="Label" class="flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-sm">
                        <button (click)="submitUpdateModule(m.id)" class="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-primary-dark transition-colors">Update</button>
                        <button (click)="editingModuleId = null" class="px-4 py-2 bg-surface border border-border text-sm text-text font-bold rounded-xl hover:bg-surface-soft transition-colors">Cancel</button>
                     </div>
                  </div>

                  <!-- Expanded Features -->
                  <div *ngIf="selectedModuleId === m.id" class="p-6 border-t border-border bg-surface-soft">
                     <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold text-sm text-text-muted uppercase tracking-wider">Features</h4>
                        <button (click)="createFeatureMode = m.id" class="text-xs font-bold text-brand-primary hover:text-brand-primary-dark flex items-center gap-1">
                           <lucide-icon [name]="PlusIcon" size="14"></lucide-icon> Add Feature
                        </button>
                     </div>

                     <div *ngIf="createFeatureMode === m.id" class="flex flex-col sm:flex-row gap-4 mb-4">
                        <input type="text" [(ngModel)]="newFeature.name" placeholder="Feature Name" class="flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-sm">
                        <input type="text" [(ngModel)]="newFeature.description" placeholder="Description (Optional)" class="flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-sm">
                        <button (click)="submitCreateFeature(m.id)" class="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition-colors">Save</button>
                        <button (click)="createFeatureMode = null" class="px-4 py-2 bg-surface border border-border text-sm text-text font-bold rounded-xl hover:bg-surface-soft transition-colors">Cancel</button>
                     </div>

                     <ul class="space-y-2">
                        <li *ngFor="let f of m.features" class="flex flex-col gap-2 p-3 bg-surface border border-border rounded-xl">
                           <div class="flex items-center justify-between">
                              <div>
                                 <span class="font-semibold text-text text-sm">{{f.name}}</span>
                                 <span *ngIf="f.description" class="text-xs text-text-muted ml-2">- {{f.description}}</span>
                              </div>
                              <div class="flex items-center gap-2">
                                 <button (click)="startEditFeature(f)" class="text-brand-primary hover:text-brand-primary-dark transition-colors">
                                    <lucide-icon [name]="Edit2Icon" size="14"></lucide-icon>
                                 </button>
                                 <button (click)="deleteFeature(f.id)" class="text-rose-500 hover:text-rose-600 transition-colors">
                                    <lucide-icon [name]="Trash2Icon" size="14"></lucide-icon>
                                 </button>
                              </div>
                           </div>
                           
                           <!-- Edit Feature Form -->
                           <div *ngIf="editingFeatureId === f.id" class="flex flex-col sm:flex-row gap-2 mt-2 pt-2 border-t border-border">
                              <input type="text" [(ngModel)]="editFeatureForm.name" placeholder="Feature Name" class="flex-1 px-3 py-1.5 bg-surface-soft border border-border rounded-lg text-xs">
                              <input type="text" [(ngModel)]="editFeatureForm.description" placeholder="Description" class="flex-1 px-3 py-1.5 bg-surface-soft border border-border rounded-lg text-xs">
                              <div class="flex gap-2">
                                 <button (click)="submitUpdateFeature(f.id)" class="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-brand-primary-dark transition-colors">Save</button>
                                 <button (click)="editingFeatureId = null" class="px-3 py-1.5 bg-surface border border-border text-xs text-text font-bold rounded-lg hover:bg-surface-soft transition-colors">Cancel</button>
                              </div>
                           </div>
                        </li>
                     </ul>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- TAB: ROLES & PERMISSIONS -->
      <div *ngIf="activeTab() === 'ROLES'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div class="bg-surface p-8 rounded-[3rem] border border-border shadow-sm overflow-x-auto">
            <div class="flex items-center justify-between mb-8 min-w-[800px]">
               <div>
                  <h2 class="text-2xl font-black text-text">Role Permissions Matrix</h2>
                  <p class="text-text-muted text-sm mt-1">Assign fine-grained features to user roles.</p>
               </div>
               <button (click)="matrixQuery.refetch()" class="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-soft border border-border text-text-muted hover:text-brand-primary transition-colors">
                  <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="matrixQuery.isFetching()"></lucide-icon>
               </button>
            </div>

            <div *ngIf="matrixQuery.isLoading()" class="h-64 flex items-center justify-center">
              <lucide-icon [name]="RefreshIcon" size="32" class="animate-spin text-brand-primary"></lucide-icon>
            </div>

            <table *ngIf="!matrixQuery.isLoading() && matrixData()" class="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th class="p-4 border-b-2 border-border font-black text-text uppercase tracking-wider text-sm sticky left-0 bg-surface z-10">Feature</th>
                  <th *ngFor="let role of matrixData().roles" class="p-4 border-b-2 border-border font-bold text-center text-xs uppercase tracking-wider text-text-muted">
                    {{role}}
                  </th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let mod of matrixData().modules">
                  <tr class="bg-surface-soft/50">
                    <td [attr.colspan]="matrixData().roles.length + 1" class="p-4 font-black text-brand-primary text-sm uppercase tracking-widest border-b border-border/50">
                      Module: {{ mod.label || mod.name }}
                    </td>
                  </tr>
                  <tr *ngFor="let feat of mod.features" class="border-b border-border/50 hover:bg-surface-soft transition-colors">
                    <td class="p-4 pl-8 text-sm font-semibold text-text sticky left-0 bg-surface group-hover:bg-surface-soft">
                      {{feat.name}}
                      <span *ngIf="feat.description" class="block text-xs font-normal text-text-muted mt-0.5">{{feat.description}}</span>
                    </td>
                    <td *ngFor="let role of matrixData().roles" class="p-4 text-center">
                      <button (click)="toggleRoleFeature(role, feat.id)" class="w-6 h-6 inline-flex items-center justify-center rounded transition-colors"
                              [ngClass]="hasFeature(role, feat.id) ? 'bg-emerald-500 text-white shadow-sm' : 'bg-surface-soft border border-border text-transparent hover:text-text-muted'">
                        <lucide-icon [name]="CheckIcon" size="14"></lucide-icon>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="mod.features.length === 0">
                    <td [attr.colspan]="matrixData().roles.length + 1" class="p-4 pl-8 text-xs text-text-muted italic border-b border-border/50">No features in this module.</td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
         </div>
      </div>

      <!-- TAB: USERS -->
      <div *ngIf="activeTab() === 'USERS'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div class="bg-surface p-8 rounded-[3rem] border border-border shadow-sm">
            <div class="flex items-center justify-between mb-8">
               <div>
                  <h2 class="text-2xl font-black text-text">User Management</h2>
                  <p class="text-text-muted text-sm mt-1">Manage accounts, roles, and status.</p>
               </div>
               <div class="flex items-center gap-3">
                 <div class="relative">
                   <lucide-icon [name]="SearchIcon" size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"></lucide-icon>
                   <input type="text" placeholder="Search..." class="pl-10 pr-4 py-2.5 bg-surface-soft border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary w-64">
                 </div>
                 <button (click)="usersQuery.refetch()" class="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-soft border border-border text-text-muted hover:text-brand-primary transition-colors">
                    <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="usersQuery.isFetching()"></lucide-icon>
                 </button>
               </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="border-b border-border">
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">User</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">Role</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">Status</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">Joined</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of users()" class="border-b border-border hover:bg-surface-soft/50 transition-colors">
                    <td class="p-4">
                      <div class="font-bold text-text">{{user.firstName}} {{user.lastName}}</div>
                      <div class="text-xs text-text-muted">{{user.email}}</div>
                    </td>
                    <td class="p-4">
                      <select [ngModel]="user.role" (ngModelChange)="updateUserRole(user.id, $event)" class="bg-surface border border-border text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-brand-primary">
                        <option *ngFor="let r of allRoles" [value]="r">{{r}}</option>
                      </select>
                    </td>
                    <td class="p-4">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                            [ngClass]="user.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'">
                        {{user.isActive ? 'Active' : 'Suspended'}}
                      </span>
                    </td>
                    <td class="p-4 text-sm text-text-muted">{{user.createdAt | date:'mediumDate'}}</td>
                    <td class="p-4 text-right flex items-center justify-end gap-2">
                      <button (click)="toggleUserStatus(user)" class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                              [ngClass]="user.isActive ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'">
                        {{user.isActive ? 'Suspend' : 'Activate'}}
                      </button>
                      <button (click)="deleteUser(user.id)" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <lucide-icon [name]="Trash2Icon" size="16"></lucide-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
         </div>
      </div>

      <!-- TAB: KYC REVIEW -->
      <div *ngIf="activeTab() === 'KYC'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div class="bg-surface p-8 rounded-[3rem] border border-border shadow-sm">
            <div class="flex items-center justify-between mb-8">
               <div>
                  <h2 class="text-2xl font-black text-text">KYC Verification Queue</h2>
                  <p class="text-text-muted text-sm mt-1">Review pending identity verifications.</p>
               </div>
               <button (click)="kycQuery.refetch()" class="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-soft border border-border text-text-muted hover:text-brand-primary transition-colors">
                  <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="kycQuery.isFetching()"></lucide-icon>
               </button>
            </div>

            <div *ngIf="kycSubmissions().length === 0" class="text-center py-12">
               <lucide-icon [name]="CheckCircleIcon" size="48" class="mx-auto text-emerald-500/50 mb-4"></lucide-icon>
               <h3 class="text-lg font-bold text-text">All caught up!</h3>
               <p class="text-text-muted text-sm mt-1">There are no pending KYC reviews.</p>
            </div>

            <div class="space-y-4">
               <div *ngFor="let kyc of kycSubmissions()" class="flex flex-col lg:flex-row gap-6 p-6 bg-surface-soft rounded-2xl border border-border">
                  <div class="flex-1">
                     <div class="flex items-center gap-3 mb-2">
                       <h3 class="font-bold text-lg text-text">{{kyc.user?.firstName}} {{kyc.user?.lastName}}</h3>
                       <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600">Pending Review</span>
                     </div>
                     <p class="text-sm text-text-muted mb-4">{{kyc.user?.email}} • Submitted {{kyc.submittedAt | date:'medium'}}</p>
                     
                     <div class="flex gap-4">
                        <a *ngFor="let doc of kyc.documents" [href]="doc.fileUrl" target="_blank" class="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border text-sm font-semibold hover:border-brand-primary transition-colors">
                           <lucide-icon [name]="FileTextIcon" size="16" class="text-text-muted"></lucide-icon>
                           {{doc.type}}
                        </a>
                     </div>
                  </div>
                  <div class="flex flex-col sm:flex-row gap-3 lg:items-end">
                     <button (click)="reviewKyc(kyc.id, 'APPROVED')" class="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                       <lucide-icon [name]="CheckIcon" size="18"></lucide-icon> Approve
                     </button>
                     <button (click)="reviewKyc(kyc.id, 'REJECTED')" class="px-6 py-2.5 bg-rose-500 text-white font-bold rounded-xl shadow-sm hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
                       <lucide-icon [name]="XIcon" size="18"></lucide-icon> Reject
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- TAB: PROPERTIES -->
      <div *ngIf="activeTab() === 'PROPERTIES'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4">
         <div class="bg-surface p-8 rounded-[3rem] border border-border shadow-sm">
            <div class="flex items-center justify-between mb-8">
               <div>
                  <h2 class="text-2xl font-black text-text">Property Management</h2>
                  <p class="text-text-muted text-sm mt-1">Review and manage all properties on the platform.</p>
               </div>
               <button (click)="propertiesQuery.refetch()" class="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-soft border border-border text-text-muted hover:text-brand-primary transition-colors">
                  <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="propertiesQuery.isFetching()"></lucide-icon>
               </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="border-b border-border">
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">Property</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">Owner</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">Status</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted">Created</th>
                    <th class="p-4 font-bold text-xs uppercase tracking-wider text-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of properties()" class="border-b border-border hover:bg-surface-soft/50 transition-colors">
                    <td class="p-4">
                      <div class="font-bold text-text">{{p.title}}</div>
                      <div class="text-xs text-text-muted">{{p.address}}</div>
                    </td>
                    <td class="p-4">
                      <div class="text-sm font-medium text-text">{{p.owner?.firstName}} {{p.owner?.lastName}}</div>
                      <div class="text-xs text-text-muted">{{p.owner?.email}}</div>
                    </td>
                    <td class="p-4">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                            [ngClass]="p.isPublished ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'">
                        {{p.isPublished ? 'Published' : 'Unpublished'}}
                      </span>
                    </td>
                    <td class="p-4 text-sm text-text-muted">{{p.createdAt | date:'mediumDate'}}</td>
                    <td class="p-4 text-right flex items-center justify-end gap-2">
                      <button (click)="togglePropertyPublish(p)" class="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                              [ngClass]="p.isPublished ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'">
                        {{p.isPublished ? 'Unpublish' : 'Publish'}}
                      </button>
                      <button (click)="deleteProperty(p.id)" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <lucide-icon [name]="Trash2Icon" size="16"></lucide-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
         </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .bg-surface { background-color: #ffffff; }
    .bg-surface-soft { background-color: #f8fafc; }
    .border-border { border-color: #e2e8f0; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  auth = inject(AuthService);
  adminService = inject(AdminDataService);
  toast = inject(ToastService);

  // Icons
  CpuIcon = Cpu; ShieldAlertIcon = ShieldAlert; UsersIcon = Users;
  FileTextIcon = FileText; DatabaseIcon = Database; RefreshIcon = RefreshCw;
  ActivityIcon = Activity; SearchIcon = Search; CheckIcon = CheckCircle;
  XIcon = XCircle; LayoutDashboardIcon = LayoutDashboard;  CheckCircleIcon = CheckCircle;
  Trash2Icon = Trash2; PlusIcon = Plus; Edit2Icon = Edit2;

  tabs: { id: Tab, label: string }[] = [
    { id: 'DASHBOARD', label: 'Dashboard Overview' },
    { id: 'MODULES', label: 'Module Config' },
    { id: 'ROLES', label: 'Role Permissions' },
    { id: 'USERS', label: 'User Directory' },
    { id: 'KYC', label: 'KYC Approvals' },
    { id: 'PROPERTIES', label: 'Properties' },
  ];
  
  activeTab = signal<Tab>('DASHBOARD');
  allRoles = ['TENANT', 'LANDLORD', 'SERVICE_PROVIDER', 'SOCIETY_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'];

  ngOnInit() {
    this.statsQuery.refetch();
  }

  // Queries
  statsQuery = injectQuery(() => ({
    queryKey: ['admin-stats'],
    queryFn: () => this.adminService.getStats()
  }));

  modulesQuery = injectQuery(() => ({
    queryKey: ['admin-modules'],
    queryFn: () => this.adminService.listModules()
  }));
  modules = computed(() => this.modulesQuery.data() || []);

  matrixQuery = injectQuery(() => ({
    queryKey: ['admin-matrix'],
    queryFn: () => this.adminService.getRoleMatrix(),
    enabled: this.activeTab() === 'ROLES'
  }));
  matrixData = computed(() => this.matrixQuery.data());

  usersQuery = injectQuery(() => ({
    queryKey: ['admin-users'],
    queryFn: () => this.adminService.listUsers(),
    enabled: this.activeTab() === 'USERS'
  }));
  users = computed(() => this.usersQuery.data() || []);

  kycQuery = injectQuery(() => ({
    queryKey: ['admin-kyc-pending'],
    queryFn: () => this.adminService.listKyc('PENDING_REVIEW'),
    enabled: this.activeTab() === 'KYC'
  }));
  kycSubmissions = computed(() => this.kycQuery.data() || []);

  propertiesQuery = injectQuery(() => ({
    queryKey: ['admin-properties'],
    queryFn: () => this.adminService.listProperties(),
    enabled: this.activeTab() === 'PROPERTIES'
  }));
  properties = computed(() => this.propertiesQuery.data() || []);


  // Mutations
  toggleModuleMutation = injectMutation(() => ({
    mutationFn: (m: any) => this.adminService.toggleModule(m.id, !m.isActive),
    onSuccess: () => {
      this.modulesQuery.refetch();
      this.statsQuery.refetch();
      this.auth.loadCapabilities();
      this.toast.success('Module status updated');
    },
    onError: (e: Error) => this.toast.error('Toggle failed: ' + e.message)
  }));

  // Actions
  seedDefaultModules() {
    if (confirm('This will seed default modules and features, and auto-assign them to the Super Admin. Continue?')) {
      this.adminService.seedModules().then((res: any) => {
        this.toast.success(`Platform successfully seeded! Found ${res.seeded} items.`);
        this.modulesQuery.refetch();
        this.matrixQuery.refetch();
        this.statsQuery.refetch();
        this.auth.loadCapabilities();
      }).catch(() => this.toast.error('Seeding failed'));
    }
  }

  // Role Matrix helpers
  hasFeature(role: string, featureId: string): boolean {
    const data = this.matrixData();
    if (!data || !data.matrix || !data.matrix[role]) return false;
    return data.matrix[role].includes(featureId);
  }

  toggleRoleFeature(role: string, featureId: string) {
    const hasIt = this.hasFeature(role, featureId);
    const req = hasIt 
      ? this.adminService.revokeRoleFeature(role, featureId)
      : this.adminService.assignRoleFeature(role, featureId);

    req.then(() => {
      this.matrixQuery.refetch();
      this.toast.success('Permission updated');
    }).catch(() => {
      this.toast.error('Failed to update permission');
    });
  }

  // Users helpers
  updateUserRole(userId: string, newRole: string) {
    this.adminService.updateUserRole(userId, newRole).then(() => {
      this.usersQuery.refetch();
      this.toast.success('Role updated');
    }).catch(() => this.toast.error('Update failed'));
  }

  toggleUserStatus(user: any) {
    this.adminService.updateUserStatus(user.id, !user.isActive).then(() => {
      this.usersQuery.refetch();
      this.toast.success(`User ${user.isActive ? 'suspended' : 'activated'}`);
    }).catch(() => this.toast.error('Update failed'));
  }

  deleteUser(id: string) {
    if (confirm('Permanently delete this user? This action cannot be undone.')) {
      this.adminService.deleteUser(id).then(() => {
        this.toast.success('User deleted');
        this.usersQuery.refetch();
        this.statsQuery.refetch();
      }).catch(() => this.toast.error('Delete failed'));
    }
  }

  // KYC helpers
  reviewKyc(id: string, status: string) {
    this.adminService.reviewKyc(id, status).then(() => {
      this.kycQuery.refetch();
      this.statsQuery.refetch();
      this.toast.success(`KYC ${status}`);
    }).catch(() => this.toast.error('Review failed'));
  }

  // Property helpers
  togglePropertyPublish(property: any) {
    this.adminService.togglePropertyPublish(property.id, !property.isPublished).then(() => {
      this.propertiesQuery.refetch();
      this.toast.success(`Property ${property.isPublished ? 'unpublished' : 'published'}`);
    }).catch(() => this.toast.error('Update failed'));
  }

  deleteProperty(id: string) {
    if (confirm('Delete this property listing?')) {
      this.adminService.deleteProperty(id).then(() => {
        this.toast.success('Property deleted');
        this.propertiesQuery.refetch();
        this.statsQuery.refetch();
      }).catch(() => this.toast.error('Delete failed'));
    }
  }

  // Module Configuration State
  createModuleMode = false;
  newModule = { name: '', label: '' };
  selectedModuleId: string | null = null;
  
  createFeatureMode: string | null = null;
  newFeature = { name: '', description: '' };

  submitCreateModule() {
    if (!this.newModule.name) return;
    this.adminService.createModule(this.newModule.name, this.newModule.label).then(() => {
      this.toast.success('Module created');
      this.modulesQuery.refetch();
      this.matrixQuery.refetch();
      this.createModuleMode = false;
      this.newModule = { name: '', label: '' };
    }).catch(() => this.toast.error('Failed to create module'));
  }

  deleteModule(id: string) {
    if (confirm('Delete this module and ALL its features?')) {
      this.adminService.deleteModule(id).then(() => {
        this.toast.success('Module deleted');
        this.modulesQuery.refetch();
        this.matrixQuery.refetch();
      }).catch(() => this.toast.error('Failed to delete module'));
    }
  }

  submitCreateFeature(moduleId: string) {
    if (!this.newFeature.name) return;
    this.adminService.createFeature(this.newFeature.name, moduleId, this.newFeature.description).then(() => {
      this.toast.success('Feature added');
      this.modulesQuery.refetch();
      this.matrixQuery.refetch();
      this.createFeatureMode = null;
      this.newFeature = { name: '', description: '' };
    }).catch(() => this.toast.error('Failed to add feature'));
  }

  deleteFeature(id: string) {
    if (confirm('Delete this feature?')) {
      this.adminService.deleteFeature(id).then(() => {
        this.toast.success('Feature deleted');
        this.modulesQuery.refetch();
        this.matrixQuery.refetch();
      }).catch(() => this.toast.error('Failed to delete feature'));
    }
  }

  // Edit Module Logic
  editingModuleId: string | null = null;
  editModuleForm = { name: '', label: '' };

  startEditModule(m: any) {
    this.editingModuleId = m.id;
    this.editModuleForm = { name: m.name, label: m.label || '' };
  }

  submitUpdateModule(id: string) {
    this.adminService.updateModule(id, this.editModuleForm.name, this.editModuleForm.label).then(() => {
      this.toast.success('Module updated');
      this.editingModuleId = null;
      this.modulesQuery.refetch();
      this.matrixQuery.refetch();
    }).catch(() => this.toast.error('Update failed'));
  }

  // Edit Feature Logic
  editingFeatureId: string | null = null;
  editFeatureForm = { name: '', description: '' };

  startEditFeature(f: any) {
    this.editingFeatureId = f.id;
    this.editFeatureForm = { name: f.name, description: f.description || '' };
  }

  submitUpdateFeature(id: string) {
    this.adminService.updateFeature(id, this.editFeatureForm.name, this.editFeatureForm.description).then(() => {
      this.toast.success('Feature updated');
      this.editingFeatureId = null;
      this.modulesQuery.refetch();
      this.matrixQuery.refetch();
    }).catch(() => this.toast.error('Update failed'));
  }
}
