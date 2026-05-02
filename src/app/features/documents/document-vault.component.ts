import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Download, FileArchive, FileCheck, FileText, LockKeyhole, Upload } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { readArray, readString } from '../../core/api/request-validation';
import { createRequestState } from '../../core/services/request-state.service';

@Component({
  selector: 'app-document-vault',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-8 pb-20">
      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
        Loading documents...
      </div>

      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p class="text-xs font-black text-indigo-600 uppercase tracking-widest">S3 signed URLs · access logging · virus scan</p>
          <h1 class="text-4xl font-black text-slate-950 tracking-tight mt-2">Document Vault</h1>
          <p class="text-slate-500 font-semibold mt-2">KYC docs, agreements, receipts, notices, move-in reports, and maintenance proofs.</p>
        </div>
        <button class="bg-slate-950 text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <lucide-icon [name]="UploadIcon" size="16"></lucide-icon>
          Upload
        </button>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <article *ngFor="let doc of documents()" class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div class="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <lucide-icon [name]="doc.icon" size="23"></lucide-icon>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{{doc.category}}</span>
          </div>
          <h3 class="text-lg font-black text-slate-900 mt-5">{{doc.name}}</h3>
          <p class="text-sm text-slate-500 font-medium mt-1">{{doc.meta}}</p>
          <div class="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
            <span class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              <lucide-icon [name]="LockIcon" size="13"></lucide-icon>
              Secured
            </span>
            <button class="text-slate-500 hover:text-indigo-600">
              <lucide-icon [name]="DownloadIcon" size="18"></lucide-icon>
            </button>
          </div>
        </article>
      </section>
    </div>
  `
})
export class DocumentVaultComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  readonly UploadIcon = Upload;
  readonly DownloadIcon = Download;
  readonly LockIcon = LockKeyhole;

  documents = signal<Array<{ id: string; name: string; category: string; meta: string; icon: unknown }>>([]);
  loading = this.state.loading;
  error = this.state.error;

  async ngOnInit(): Promise<void> {
    const response = await this.state.runObservable(this.api.documents.list(), {
      errorMessage: 'Failed to fetch documents.',
    });

    if (!response) {
      this.toast.error(this.error() ?? 'Failed to fetch documents.');
      return;
    }

    this.documents.set(this.mapDocuments(response));
  }

  private mapDocuments(payload: unknown): Array<{ id: string; name: string; category: string; meta: string; icon: unknown }> {
    // Backend GET /documents returns a raw array directly
    const rows: unknown[] = Array.isArray(payload)
      ? payload
      : (payload && typeof payload === 'object'
          ? readArray((payload as Record<string, unknown>)['documents'] ?? (payload as Record<string, unknown>)['data'])
          : []);

    return rows.map((row, index) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      const category = readString(item['category'], 'OTHER');
      const id = readString(item['id'], String(index + 1));
      const name = readString(item['name'], 'Untitled document');
      const fileType = readString(item['fileType'], 'Unknown type');
      const permission = readString(item['permission'], 'Restricted');

      return {
        id,
        name,
        category,
        meta: `${fileType} · ${permission}`,
        icon: this.iconForCategory(category),
      };
    });
  }

  private iconForCategory(category: string): unknown {
    switch (category) {
      case 'AGREEMENTS':
        return FileCheck;
      case 'KYC':
      case 'PAYMENTS':
        return FileText;
      default:
        return FileArchive;
    }
  }
}
