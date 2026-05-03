import { Component, inject, effect, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Send, Paperclip, MoreVertical, Phone, Video, Search } from 'lucide-angular';
import { ChatService } from '../../core/services/chat.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex h-[calc(100vh-120px)] bg-surface/80 backdrop-blur-xl rounded-[3rem] border border-border shadow-2xl shadow-slate-200/50 overflow-hidden relative">
      <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>
      
      <!-- Sidebar: Contacts -->
      <div class="w-80 border-r border-border flex flex-col bg-surface-soft/50 z-10">
        <div class="p-8 pb-4">
          <div class="flex items-center gap-3 mb-6">
             <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
               <lucide-icon [name]="SearchIcon" size="20"></lucide-icon>
             </div>
             <h2 class="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Messages</h2>
          </div>
          <div class="relative group">
            <lucide-icon [name]="SearchIcon" class="absolute left-5 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-brand-primary transition-colors" size="18"></lucide-icon>
            <input type="text" placeholder="Search chats..." class="w-full pl-14 pr-4 py-3.5 bg-surface border border-border rounded-[1.25rem] text-sm font-bold text-text shadow-inner outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-text-soft">
          </div>
        </div>

        <div class="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
          @for (contact of chat.contacts(); track contact.id) {
            <button 
              (click)="chat.selectContact(contact.id)"
              class="w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all duration-300 group relative border border-transparent"
              [ngClass]="{
                'bg-surface shadow-md border-border translate-x-1': chat.activeContactId() === contact.id,
                'hover:bg-surface-soft hover:border-border': chat.activeContactId() !== contact.id
              }"
            >
              <div class="relative">
                <img [src]="contact.avatar" class="w-14 h-14 rounded-[1.25rem] object-cover bg-surface-muted shadow-sm group-hover:scale-105 transition-transform">
                <div *ngIf="contact.online" class="absolute -right-1 -bottom-1 w-4 h-4 text-emerald-500 border-2 border-surface bg-emerald-500 rounded-full shadow-sm"></div>
              </div>
              <div class="flex-grow text-left overflow-hidden">
                <div class="flex justify-between items-center mb-1">
                  <h4 class="font-black text-sm text-text truncate group-hover:text-brand-primary transition-colors">{{ contact.name }}</h4>
                </div>
                <p class="text-[10px] font-bold text-text-muted truncate tracking-tight">{{ contact.lastMessage || contact.role }}</p>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-grow flex flex-col bg-surface/50 z-10 relative">
        @if (activeContact(); as contact) {
          <!-- Chat Header -->
          <div class="px-8 py-6 border-b border-border flex items-center justify-between bg-surface-soft/80 backdrop-blur-md">
              <div class="flex items-center gap-5">
              <div class="relative">
                 <img [src]="contact.avatar" class="w-14 h-14 rounded-[1.25rem] object-cover bg-surface-muted shadow-sm">
                 <div *ngIf="contact.online" class="absolute -right-1 -bottom-1 w-4 h-4 text-emerald-500 border-2 border-surface bg-emerald-500 rounded-full shadow-sm"></div>
              </div>
              <div>
                <h3 class="text-xl font-black text-text leading-none">{{ contact.name }}</h3>
                <div class="flex items-center gap-1.5 mt-2">
                   <div class="w-1.5 h-1.5 rounded-full" [ngClass]="contact.online ? 'bg-emerald-500' : 'bg-slate-400'"></div>
                   <p class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                     {{ contact.online ? 'Online now' : 'Offline' }}
                   </p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button class="w-12 h-12 flex items-center justify-center text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-2xl transition-all shadow-sm border border-transparent hover:border-brand-primary/20"><lucide-icon [name]="PhoneIcon" size="20"></lucide-icon></button>
              <button class="w-12 h-12 flex items-center justify-center text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-2xl transition-all shadow-sm border border-transparent hover:border-brand-primary/20"><lucide-icon [name]="VideoIcon" size="20"></lucide-icon></button>
              <div class="w-px h-8 bg-border mx-1"></div>
              <button class="w-12 h-12 flex items-center justify-center text-text-muted hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-2xl transition-all"><lucide-icon [name]="MoreIcon" size="20"></lucide-icon></button>
            </div>
          </div>

          <!-- Messages List -->
          <div #scrollContainer class="flex-grow overflow-y-auto p-8 space-y-6 bg-surface/30">
            @for (msg of chat.messages(); track msg.id) {
              <div class="flex items-end gap-3 max-w-3xl" [ngClass]="msg.isMe ? 'ml-auto flex-row-reverse' : ''">
                <img [src]="msg.senderAvatar" class="w-8 h-8 rounded-[0.75rem] bg-surface shadow-sm border border-border object-cover">
                
                <div class="group flex flex-col" [ngClass]="msg.isMe ? 'items-end' : 'items-start'">
                  <div class="flex items-end gap-2">
                    <div 
                      class="px-5 py-3.5 rounded-[1.5rem] text-sm font-bold shadow-sm"
                      [ngClass]="msg.isMe ? 'bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white rounded-br-sm' : 'bg-surface-soft border border-border text-text rounded-bl-sm'">
                      {{ msg.text }}
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span class="text-[9px] font-black uppercase text-text-muted tracking-widest">
                       {{ msg.timestamp | date:'shortTime' }}
                     </span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Message Input -->
          <div class="p-6 border-t border-border bg-surface-soft/50 backdrop-blur-md">
            <div class="flex items-end gap-3 bg-surface p-2 rounded-[2rem] border border-border focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all shadow-sm max-w-4xl mx-auto">
              <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)">
              <button 
                (click)="fileInput.click()"
                class="w-12 h-12 flex items-center justify-center rounded-[1.25rem] text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors mb-0.5">
                <lucide-icon [name]="AttachIcon" size="20"></lucide-icon>
              </button>
              <textarea 
                [(ngModel)]="messageText" 
                (keydown.enter)="onEnter($event)"
                rows="1"
                #messageArea
                (input)="adjustHeight(messageArea)"
                placeholder="Type your message..." 
                class="flex-grow bg-transparent border-none outline-none font-bold text-sm px-3 py-4 resize-none max-h-32 overflow-y-auto text-text placeholder:text-text-soft"></textarea>
              <button 
                (click)="send()"
                class="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-md mb-0.5">
                <lucide-icon [name]="SendIcon" size="18" class="translate-x-[-1px]"></lucide-icon>
              </button>
            </div>
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center h-full text-center p-12">
            <div class="w-32 h-32 bg-surface border border-border text-text-soft rounded-[3rem] flex items-center justify-center mb-8 shadow-inner relative overflow-hidden">
               <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>
               <lucide-icon [name]="SendIcon" size="48" class="relative z-10"></lucide-icon>
            </div>
            <h3 class="text-3xl font-black tracking-tight text-text mb-3">Select a conversation</h3>
            <p class="text-text-muted font-bold max-w-sm text-sm leading-relaxed">Connect with landlords, agents, or our AI assistant to discuss your housing needs.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class ChatComponent {
  chat = inject(ChatService);
  toast = inject(ToastService);
  messageText = '';
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('messageArea') private messageArea!: ElementRef<HTMLTextAreaElement>;

  readonly SearchIcon = Search;
  readonly SendIcon = Send;
  readonly AttachIcon = Paperclip;
  readonly MoreIcon = MoreVertical;
  readonly PhoneIcon = Phone;
  readonly VideoIcon = Video;

  activeContact = computed(() => {
    const id = this.chat.activeContactId();
    return this.chat.contacts().find(c => c.id === id);
  });

  constructor() {
    this.chat.loadSessions();

    // Scroll to bottom when messages change or contact changes
    effect(() => {
      this.chat.messages();
      this.chat.activeContactId(); // Track contact change too
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.send();
    }
  }

  send() {
    if (!this.messageText.trim()) return;
    this.chat.sendMessage(this.messageText);
    this.messageText = '';
    // Reset textarea height
    if (this.messageArea) {
      this.messageArea.nativeElement.style.height = 'auto';
    }
  }

  adjustHeight(area: HTMLTextAreaElement) {
    area.style.height = 'auto';
    area.style.height = area.scrollHeight + 'px';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.chat.sendMessage(`[Attached File]: ${file.name}`);
      this.toast.success(`Attached ${file.name} successfully`);
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
