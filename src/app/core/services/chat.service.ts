import { Injectable, computed, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { RentShieldApiService } from '../api/rentshield-api.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { assertObject, readArray, readString } from '../api/request-validation';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Contact {
  id: string;
  sessionId: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage?: string;
  online: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = inject(RentShieldApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private socket: Socket | null = null;
  
  private _messages = signal<ChatMessage[]>([]);
  messages = this._messages.asReadonly();
  
  private _contacts = signal<Contact[]>([]);
  contacts = this._contacts.asReadonly();
  
  activeContactId = signal<string | null>(null);
  
  activeConversation = computed(() => {
    return this._messages();
  });

  private contactBySessionId = new Map<string, Contact>();

  constructor() {
    this.connectSocket();
  }

  loadSessions() {
    this.api.chat.listSessions().subscribe({
      next: (response) => {
        const contacts = this.mapContacts(response);
        this._contacts.set(contacts);
        this.contactBySessionId.clear();
        for (const contact of contacts) {
          this.contactBySessionId.set(contact.sessionId, contact);
        }

        if (!this.activeContactId() && contacts.length > 0) {
          this.selectContact(contacts[0].id);
        }
      },
      error: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to load chat sessions.';
        this.toast.error(message);
      },
    });
  }

  selectContact(contactId: string) {
    this.activeContactId.set(contactId);
    const contact = this._contacts().find((entry) => entry.id === contactId);
    if (!contact) {
      this._messages.set([]);
      return;
    }

    this.socket?.emit('joinRoom', contact.sessionId);
    this.api.chat.messages(contact.sessionId).subscribe({
      next: (response) => {
        this._messages.set(this.mapMessages(response));
      },
      error: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to load chat messages.';
        this.toast.error(message);
      },
    });
  }

  sendMessage(text: string) {
    if (!text.trim() || !this.activeContactId()) {
      return;
    }

    const contact = this._contacts().find((entry) => entry.id === this.activeContactId());
    if (!contact) {
      return;
    }

    const message: Partial<ChatMessage> = {
      senderId: this.auth.user()?.id ?? 'current-user',
      senderName: 'You',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      text,
      timestamp: new Date().toISOString(),
    };

    this.socket?.emit('sendMessage', {
      chatSessionId: contact.sessionId,
      content: text,
    });

    const fullMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substring(7),
      isMe: true
    } as ChatMessage;

    this._messages.update(msgs => [...msgs, fullMessage]);
    this.updateContactLastMessage(contact.id, text);
  }

  private connectSocket() {
    const token = this.auth.token();
    if (!token) {
      return;
    }

    const baseUrl = this.resolveApiOrigin();
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('newMessage', (raw: unknown) => {
      const message = this.mapSocketMessage(raw);
      if (!message) {
        return;
      }

      this._messages.update((messages) => [...messages, message]);
      const activeContact = this._contacts().find((entry) => entry.id === this.activeContactId());
      if (activeContact) {
        this.updateContactLastMessage(activeContact.id, message.text);
      }
    });

    this.socket.on('error', (error: unknown) => {
      const message = typeof error === 'string' ? error : 'Chat connection error.';
      this.toast.warning(message);
    });
  }

  private resolveApiOrigin(): string {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
    const configured = env['VITE_API_BASE_URL'] ?? 'http://localhost:4000/api';
    try {
      return new URL(configured).origin;
    } catch {
      return 'http://localhost:4000';
    }
  }

  private mapContacts(payload: unknown): Contact[] {
    assertObject(payload, 'chat sessions response');
    const sessions = readArray(payload['sessions']);
    const myUserId = this.auth.user()?.id ?? '';

    return sessions.map((session, index) => {
      const record = session && typeof session === 'object' ? (session as Record<string, unknown>) : {};
      const participants = readArray(record['participants']);
      const otherParticipant = participants
        .map((entry) => (entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {}))
        .find((entry) => {
          const user = entry['user'];
          if (!user || typeof user !== 'object') {
            return false;
          }
          const userRecord = user as Record<string, unknown>;
          return readString(userRecord['id']) !== myUserId;
        });

      const user = otherParticipant && typeof otherParticipant['user'] === 'object'
        ? (otherParticipant['user'] as Record<string, unknown>)
        : {};

      const firstName = readString(user['firstName'], 'User');
      const lastName = readString(user['lastName'], '');
      const fullName = `${firstName} ${lastName}`.trim();
      const sessionId = readString(record['id'], `session-${index + 1}`);
      const lastMessage = readString(readArray(record['messages'])[0] && typeof readArray(record['messages'])[0] === 'object'
        ? (readArray(record['messages'])[0] as Record<string, unknown>)['content']
        : undefined);

      return {
        id: readString(user['id'], `contact-${index + 1}`),
        sessionId,
        name: fullName || 'Chat Contact',
        role: readString(user['role'], 'Member'),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName || sessionId)}`,
        online: false,
        lastMessage: lastMessage || 'No messages yet',
      };
    });
  }

  private mapMessages(payload: unknown): ChatMessage[] {
    assertObject(payload, 'chat messages response');
    const messages = readArray(payload['messages']);
    const myUserId = this.auth.user()?.id ?? '';

    return messages.map((entry, index) => {
      const record = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
      const sender = record['sender'] && typeof record['sender'] === 'object'
        ? (record['sender'] as Record<string, unknown>)
        : {};
      const senderId = readString(record['senderId'], readString(sender['id'], 'unknown'));
      const senderName = `${readString(sender['firstName'], 'User')} ${readString(sender['lastName'], '')}`.trim();
      const isMe = senderId === myUserId;

      return {
        id: readString(record['id'], `msg-${index + 1}`),
        senderId,
        senderName: senderName || 'User',
        senderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName || senderId)}`,
        text: readString(record['content'], ''),
        timestamp: readString(record['createdAt'], new Date().toISOString()),
        isMe,
      };
    });
  }

  private mapSocketMessage(raw: unknown): ChatMessage | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const record = raw as Record<string, unknown>;
    const sender = record['sender'] && typeof record['sender'] === 'object'
      ? (record['sender'] as Record<string, unknown>)
      : {};
    const senderId = readString(record['senderId'], readString(sender['id']));
    if (!senderId) {
      return null;
    }

    const senderName = `${readString(sender['firstName'], 'User')} ${readString(sender['lastName'], '')}`.trim();
    const myUserId = this.auth.user()?.id ?? '';

    return {
      id: readString(record['id'], crypto.randomUUID()),
      senderId,
      senderName: senderName || 'User',
      senderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName || senderId)}`,
      text: readString(record['content'], ''),
      timestamp: readString(record['createdAt'], new Date().toISOString()),
      isMe: senderId === myUserId,
    };
  }

  private updateContactLastMessage(contactId: string, text: string) {
    this._contacts.update(contacts => contacts.map(c => 
      c.id === contactId ? { ...c, lastMessage: text } : c
    ));
  }
}
