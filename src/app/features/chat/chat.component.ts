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
    <div class="flex h-[calc(100vh-120px)] bg-surface rounded-[3rem] border border-muted overflow-hidden shadow-2xl shadow-slate-200/50">
      <!-- Sidebar: Contacts -->
      <div class="w-80 border-r border-muted flex flex-col bg-surface-soft">
        <div class="p-8 pb-4">
          <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-6">Messages</h2>
          <div class="relative group">
            <lucide-icon [name]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-var group-focus-within:text-brand transition-colors" size="16"></lucide-icon>
            <input type="text" placeholder="Search chats..." class="w-full pl-11 pr-4 py-3 bg-surface border border-muted rounded-2xl text-sm font-bold shadow-sm outline-none focus-border-brand transition-all">
          </div>
        </div>

        <div class="flex-grow overflow-y-auto p-4 space-y-2">
          @for (contact of chat.contacts(); track contact.id) {
            <button 
              (click)="chat.selectContact(contact.id)"
              class="w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all group relative hover:bg-slate-100"
              [ngClass]="{
                'bg-white shadow-xl': chat.activeContactId() === contact.id,
                'shadow-slate-200/50': chat.activeContactId() === contact.id
              }"
            >
              <div class="relative">
                <img [src]="contact.avatar" class="w-12 h-12 rounded-2xl object-cover bg-surface-soft">
                <div *ngIf="contact.online" class="absolute -right-1 -bottom-1 w-4 h-4 text-success border-2 border-white rounded-full" [ngClass]="{'bg-success': contact.online}"></div>
              </div>
              <div class="flex-grow text-left overflow-hidden">
                <div class="flex justify-between items-center mb-0.5">
                  <h4 class="font-black text-sm truncate">{{ contact.name }}</h4>
                </div>
                <p class="text-[10px] font-bold text-muted-var truncate tracking-tight">{{ contact.lastMessage || contact.role }}</p>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-grow flex flex-col bg-surface">
        @if (activeContact(); as contact) {
          <!-- Chat Header -->
          <div class="p-6 border-b border-muted flex items-center justify-between">
              <div class="flex items-center gap-4">
              <img [src]="contact.avatar" class="w-12 h-12 rounded-2xl object-cover bg-surface-soft">
              <div>
                <h3 class="text-lg font-black leading-none">{{ contact.name }}</h3>
                <p class="text-[10px] font-black text-muted-var uppercase tracking-widest mt-1">
                  {{ contact.online ? 'Online now' : 'Offline' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><lucide-icon [name]="PhoneIcon" size="20"></lucide-icon></button>
              <button class="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><lucide-icon [name]="VideoIcon" size="20"></lucide-icon></button>
              <button class="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><lucide-icon [name]="MoreIcon" size="20"></lucide-icon></button>
            </div>
          </div>

          <!-- Messages List -->
          <div #scrollContainer class="flex-grow overflow-y-auto p-8 space-y-6 bg-surface-soft">
            @for (msg of chat.messages(); track msg.id) {
              <div class="flex items-end gap-3" [class.flex-row-reverse]="msg.isMe">
                <img [src]="msg.senderAvatar" class="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 object-cover">
                
                <div class="max-w-[70%] group">
                  <div class="flex items-end gap-2" [class.flex-row-reverse]="msg.isMe">
                    <div 
                      class="px-5 py-3 rounded-[1.5rem] text-sm font-bold shadow-sm"
                      [ngClass]="msg.isMe ? 'btn-primary rounded-br-none text-on-brand' : 'bg-surface rounded-bl-none border border-muted text-muted-var'">
                      {{ msg.text }}
                    </div>
                  </div>
                  <p class="text-[9px] font-black uppercase text-slate-300 mt-1.5 tracking-widest" [class.text-right]="msg.isMe">
                    {{ msg.timestamp | date:'shortTime' }}
                  </p>
                </div>
              </div>
            }
          </div>

          <!-- Message Input -->
          <div class="p-6 border-t border-muted">
            <div class="flex items-end gap-4 bg-surface-soft p-2 rounded-[2rem] border border-muted focus-within:focus-border-brand transition-all shadow-inner">
              <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)">
              <button 
                (click)="fileInput.click()"
                class="p-3 text-muted-var hover-text-brand transition-colors mb-1">
                <lucide-icon [name]="AttachIcon" size="20"></lucide-icon>
              </button>
              <textarea 
                [(ngModel)]="messageText" 
                (keydown.enter)="$event.preventDefault(); send()"
                rows="1"
                #messageArea
                (input)="adjustHeight(messageArea)"
                placeholder="Type your message..." 
                class="flex-grow bg-transparent border-none outline-none font-bold text-sm px-2 py-3 resize-none max-h-32 overflow-y-auto text-muted-var"></textarea>
              <button 
                (click)="send()"
                class="btn-primary p-4 rounded-2xl hover:bg-brand-dark transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 mb-1">
                <lucide-icon [name]="SendIcon" size="20"></lucide-icon>
              </button>
            </div>
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center h-full text-center p-12">
            <div class="w-24 h-24 bg-surface-soft text-muted-var rounded-[2.5rem] flex items-center justify-center mb-6">
              <lucide-icon [name]="SendIcon" size="48"></lucide-icon>
            </div>
            <h3 class="text-2xl font-black tracking-tight">Select a conversation</h3>
            <p class="text-muted-var font-bold max-w-sm mt-2">Connect with landlords, agents, or our AI assistant to discuss your housing needs.</p>
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
