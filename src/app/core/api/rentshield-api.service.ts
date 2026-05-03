import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService, QueryParams } from './api-client.service';
import { assertEmail, assertMinLength, assertNumberInRange, assertRequiredString } from './request-validation';
import { HttpClient } from '@angular/common/http';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Verify2faRequest {
  code: string;
}

export interface PropertyFilters extends QueryParams {
  q?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  category?: string;
  furnishing?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  my?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RentShieldApiService {
  private readonly api = inject(ApiClientService);
  private httpClient = inject(HttpClient);

  /**
   * Wraps a raw-array or raw-object response into { [key]: data }.
   * If the response already has the expected key, passes it through unchanged.
   * Fixes all endpoints where the backend returns bare arrays/objects.
   */
  private wrap(key: string, obs: Observable<unknown>): Observable<unknown> {
    return new Observable(subscriber => {
      obs.subscribe({
        next: (raw) => {
          if (raw && typeof raw === 'object' && !Array.isArray(raw) && key in (raw as object)) {
            subscriber.next(raw);
          } else {
            subscriber.next({ [key]: raw });
          }
        },
        error: (e) => subscriber.error(e),
        complete: () => subscriber.complete(),
      });
    });
  }

  readonly health = {
    check: (): Observable<unknown> => this.api.get('/health'),
  };

  readonly auth = {
    register: (payload: RegisterRequest): Observable<unknown> => {
      assertEmail(payload.email, 'email');
      assertMinLength(payload.password, 'password', 6);
      assertRequiredString(payload.firstName, 'firstName');
      assertRequiredString(payload.lastName, 'lastName');
      return this.api.post('/auth/register', payload);
    },

    login: (payload: LoginRequest): Observable<unknown> => {
      assertEmail(payload.email, 'email');
      assertRequiredString(payload.password, 'password');
      return this.api.post('/auth/login', payload);
    },

    verify2fa: (payload: Verify2faRequest, preAuthToken?: string): Observable<unknown> => {
      assertRequiredString(payload.code, 'code');
      return this.api.post('/auth/verify-2fa', payload, {
        headers: preAuthToken ? { Authorization: `Bearer ${preAuthToken}` } : undefined,
      });
    },

    profile: (): Observable<unknown> => this.api.get('/auth/profile'),
    updateSettings: (payload: Record<string, unknown>): Observable<unknown> => this.api.patch('/auth/settings', payload),
    capabilities: (): Observable<unknown> => this.api.get('/auth/capabilities'),
    forgotPassword: (email: string): Observable<unknown> => {
      assertEmail(email, 'email');
      return this.api.post('/auth/forgot-password', { email });
    },
    resetPassword: (payload: { email: string; code: string; newPassword: string }): Observable<unknown> => {
      assertEmail(payload.email, 'email');
      assertRequiredString(payload.code, 'code');
      assertMinLength(payload.newPassword, 'newPassword', 6);
      return this.api.post('/auth/reset-password', payload);
    },
  };

  readonly admin = {
    listModules: (): Observable<unknown> => this.api.get('/admin/modules'),
    toggleModule: (id: string, isActive: boolean): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/admin/modules/${id}/toggle`, { isActive });
    },
    createModule: (payload: { name: string; label?: string }): Observable<unknown> => {
      assertRequiredString(payload.name, 'name');
      return this.api.post('/admin/modules', payload);
    },
    updateModule: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/admin/modules/${id}`, payload);
    },
    deleteModule: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.delete(`/admin/modules/${id}`);
    },
    listFeatures: (moduleId?: string): Observable<unknown> => this.api.get('/admin/features', { query: { moduleId } }),
    createFeature: (payload: { name: string; moduleId: string; description?: string }): Observable<unknown> => {
      assertRequiredString(payload.name, 'name');
      assertRequiredString(payload.moduleId, 'moduleId');
      return this.api.post('/admin/features', payload);
    },
    deleteFeature: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.delete(`/admin/features/${id}`);
    },
    updateFeature: (id: string, payload: { name?: string; description?: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/admin/features/${id}`, payload);
    },
    listUsers: (query?: QueryParams): Observable<unknown> => this.api.get('/admin/users', { query }),
    listRoleFeatures: (role: string): Observable<unknown> => {
      assertRequiredString(role, 'role');
      return this.api.get(`/admin/roles/${role}/features`);
    },
    assignRoleFeature: (role: string, featureId: string): Observable<unknown> => {
      assertRequiredString(role, 'role');
      assertRequiredString(featureId, 'featureId');
      return this.api.post(`/admin/roles/${role}/features`, { featureId });
    },
    revokeRoleFeature: (role: string, featureId: string): Observable<unknown> => {
      assertRequiredString(role, 'role');
      assertRequiredString(featureId, 'featureId');
      return this.api.delete(`/admin/roles/${role}/features/${featureId}`);
    },
    updateUserRole: (id: string, role: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(role, 'role');
      return this.api.patch(`/admin/users/${id}/role`, { role });
    },
    updateUserStatus: (id: string, isActive: boolean): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/admin/users/${id}/status`, { isActive });
    },
    updateUser: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/admin/users/${id}`, payload);
    },
    deleteUser: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.delete(`/admin/users/${id}`);
    },
    listKyc: (status?: string): Observable<unknown> => this.api.get('/admin/kyc', { query: { status } }),
    reviewKyc: (id: string, status: string, notes?: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(status, 'status');
      return this.api.patch(`/admin/kyc/${id}/review`, { status, notes });
    },
    listProperties: (): Observable<unknown> => this.api.get('/admin/properties'),
    togglePropertyPublish: (id: string, isActive: boolean): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/admin/properties/${id}/toggle-publish`, { isActive });
    },
    updateProperty: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/admin/properties/${id}`, payload);
    },
    deleteProperty: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.delete(`/admin/properties/${id}`);
    },
    stats: (): Observable<unknown> => this.api.get('/admin/stats'),
    getRoleMatrix: (): Observable<unknown> => this.api.get('/admin/roles/matrix'),
    seedModules: (): Observable<unknown> => this.api.post('/admin/modules/seed', {}),
  };

  readonly agreements = {
    templates: (state?: string): Observable<unknown> =>
      this.wrap('templates', this.api.get('/agreements/templates', { query: { state } })),
    generate: (payload: { tenancyId: string; templateId: string }): Observable<unknown> => {
      assertRequiredString(payload.tenancyId, 'tenancyId');
      assertRequiredString(payload.templateId, 'templateId');
      return this.wrap('agreement', this.api.post('/agreements/generate', payload));
    },
    sign: (payload: { agreementId: string; type: 'TYPE' | 'DRAW'; signatureData: string }): Observable<unknown> => {
      assertRequiredString(payload.agreementId, 'agreementId');
      assertRequiredString(payload.signatureData, 'signatureData');
      return this.wrap('signature', this.api.post('/agreements/sign', payload));
    },
    stamp: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.wrap('agreement', this.api.post(`/agreements/${id}/stamp`, {}));
    },
  };

  readonly chat = {
    createSession: (payload: { targetType: 'TENANCY' | 'MAINTENANCE'; targetId: string }): Observable<unknown> => {
      assertRequiredString(payload.targetId, 'targetId');
      return this.api.post('/chat/sessions', payload);
    },
    listSessions: (): Observable<unknown> => this.api.get('/chat/sessions'),
    messages: (sessionId: string): Observable<unknown> => {
      assertRequiredString(sessionId, 'sessionId');
      return this.api.get(`/chat/sessions/${sessionId}/messages`);
    },
  };

  readonly dashboard = {
    tenant: (): Observable<unknown> => this.api.get('/dashboard/tenant'),
  };

  readonly disputes = {
    create: (payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(payload['tenancyId'], 'tenancyId');
      assertRequiredString(payload['categoryId'], 'categoryId');
      assertRequiredString(payload['description'], 'description');
      return this.api.post('/disputes', payload);
    },
    list: (): Observable<unknown> => this.api.get('/disputes'),
    details: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/disputes/${id}`);
    },
    addEvent: (id: string, payload: { eventType: string; details: Record<string, unknown>; evidenceFile?: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(payload.eventType, 'eventType');
      return this.api.post(`/disputes/${id}/events`, payload);
    },
    updateStatus: (id: string, status: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(status, 'status');
      return this.api.patch(`/disputes/${id}/status`, { status });
    },
  };

  readonly documents = {
    list: (query?: QueryParams): Observable<unknown> =>
      this.wrap('documents', this.api.get('/documents', { query })),
    expiryAlerts: (): Observable<unknown> =>
      this.wrap('alerts', this.api.get('/documents/alerts/expiry')),
    upload: (payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(payload['category'], 'category');
      assertRequiredString(payload['name'], 'name');
      assertRequiredString(payload['fileUrl'], 'fileUrl');
      assertRequiredString(payload['fileType'], 'fileType');
      if (typeof payload['fileSize'] !== 'number') {
        throw new Error('fileSize is required.');
      }
      return this.wrap('document', this.api.post('/documents', payload));
    },
    download: (id: string): Observable<Blob> => {
      assertRequiredString(id, 'id');
      return this.api.getBlob(`/documents/${id}/download`);
    },
    delete: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.delete(`/documents/${id}`);
    },
  };

  readonly exit = {
    createRequest: (payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(payload['tenancyId'], 'tenancyId');
      assertRequiredString(payload['proposedMoveOutDate'], 'proposedMoveOutDate');
      return this.api.post('/exit', payload);
    },
    getByTenancy: (tenancyId: string): Observable<unknown> => {
      assertRequiredString(tenancyId, 'tenancyId');
      return this.api.get(`/exit/${tenancyId}`);
    },
    review: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/exit/${id}/review`, payload);
    },
    createInspection: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/exit/${id}/inspections`, payload);
    },
    createSettlement: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/exit/${id}/settlement`, payload);
    },
    acceptSettlement: (id: string, payload: { accepted: boolean; remarks?: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/exit/${id}/settlement/accept`, payload);
    },
  };

  readonly experts = {
    list: (query?: QueryParams): Observable<unknown> =>
      this.wrap('experts', this.api.get('/experts', { query })),
    categories: (): Observable<unknown> =>
      this.wrap('categories', this.api.get('/experts/categories')),
    bookings: (): Observable<unknown> =>
      this.wrap('bookings', this.api.get('/experts/bookings')),
    details: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.wrap('expert', this.api.get(`/experts/${id}`));
    },
    book: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.wrap('booking', this.api.post(`/experts/${id}/book`, payload));
    },
    updateBookingStatus: (bookingId: string, status: string): Observable<unknown> => {
      assertRequiredString(bookingId, 'bookingId');
      assertRequiredString(status, 'status');
      return this.wrap('booking', this.api.post(`/experts/bookings/${bookingId}/status`, { status }));
    },
    addReview: (id: string, payload: { rating: number; review?: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertNumberInRange(payload.rating, 'rating', 1, 5);
      return this.wrap('review', this.api.post(`/experts/${id}/reviews`, payload));
    },
  };

  readonly kyc = {
    status: (): Observable<unknown> => this.api.get('/kyc/status'),
    start: (payload: Record<string, unknown>): Observable<unknown> => this.api.post('/kyc/start', payload),
    upload: (payload: Record<string, unknown>): Observable<unknown> => this.api.post('/kyc/upload', payload),
    submit: (payload: Record<string, unknown>): Observable<unknown> => this.api.post('/kyc/submit', payload),
    adminQueue: (): Observable<unknown> => this.api.get('/kyc/admin/queue'),
    review: (id: string, payload: { status: string; notes?: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(payload.status, 'status');
      return this.api.post(`/kyc/admin/${id}/review`, payload);
    },
  };

  readonly maintenance = {
    create: (payload: { tenancyId: string; title: string; description: string; priority?: string }): Observable<unknown> => {
      assertRequiredString(payload.tenancyId, 'tenancyId');
      assertRequiredString(payload.title, 'title');
      assertRequiredString(payload.description, 'description');
      return this.api.post('/maintenance', payload);
    },
    tenantRequests: (tenancyId?: string): Observable<unknown> => this.api.get('/maintenance/tenant', { query: { tenancyId } }),
    landlordRequests: (propertyId?: string): Observable<unknown> => this.api.get('/maintenance/landlord', { query: { propertyId } }),
    updateStatus: (id: string, payload: { status: string; priority?: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(payload.status, 'status');
      return this.api.patch(`/maintenance/${id}/status`, payload);
    },
  };

  readonly moveIn = {
    create: (payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(payload['tenancyId'], 'tenancyId');
      return this.api.post('/movein', payload);
    },
    getByTenancy: (tenancyId: string): Observable<unknown> => {
      assertRequiredString(tenancyId, 'tenancyId');
      return this.api.get(`/movein/${tenancyId}`);
    },
    updateChecklist: (moveInId: string, itemId: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(moveInId, 'moveInId');
      assertRequiredString(itemId, 'itemId');
      return this.api.patch(`/movein/${moveInId}/checklist/${itemId}`, payload);
    },
    addInspection: (moveInId: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(moveInId, 'moveInId');
      return this.api.post(`/movein/${moveInId}/inspections`, payload);
    },
    updateStatus: (moveInId: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(moveInId, 'moveInId');
      return this.api.patch(`/movein/${moveInId}/status`, payload);
    },
    complete: (moveInId: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(moveInId, 'moveInId');
      return this.api.post(`/movein/${moveInId}/complete`, payload);
    },
  };

  readonly notices = {
    list: (query?: QueryParams): Observable<unknown> => this.api.get('/notices', { query }),
    create: (payload: Record<string, unknown>): Observable<unknown> => this.api.post('/notices', payload),
    details: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/notices/${id}`);
    },
    markRead: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/notices/${id}/read`, {});
    },
  };

  readonly payments = {
    triggerBilling: (): Observable<unknown> => this.api.post('/payments/trigger-billing', {}),
    due: (): Observable<unknown> =>
      this.wrap('payments', this.api.get('/payments/due')),
    ledger: (tenancyId: string): Observable<unknown> => {
      assertRequiredString(tenancyId, 'tenancyId');
      return this.wrap('payments', this.api.get(`/payments/ledger/${tenancyId}`));
    },
    pay: (id: string, amount?: number): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.wrap('payment', this.api.post(`/payments/${id}/pay`, amount ? { amount } : {}));
    },
    receipt: (id: string): Observable<Blob> => {
      assertRequiredString(id, 'id');
      return this.api.getBlob(`/payments/${id}/receipt`);
    },
    createPlan: (payload: { tenancyId: string; rentAmount: number; dueDay: number; depositAmount: number }): Observable<unknown> => {
      assertRequiredString(payload.tenancyId, 'tenancyId');
      assertNumberInRange(payload.dueDay, 'dueDay', 1, 31);
      return this.wrap('plan', this.api.post('/payments/plan', payload));
    },
  };

  readonly policeVerification = {
    status: (tenancyId: string): Observable<unknown> => {
      assertRequiredString(tenancyId, 'tenancyId');
      return this.api.get(`/police-verification/${tenancyId}`);
    },
    initiate: (payload: Record<string, unknown>): Observable<unknown> => this.api.post('/police-verification/initiate', payload),
    verifyOtp: (payload: { code: string; tenancyId?: string }): Observable<unknown> => {
      assertRequiredString(payload.code, 'code');
      return this.api.post('/police-verification/verify-otp', payload);
    },
    complete: (tenancyId: string): Observable<unknown> => {
      assertRequiredString(tenancyId, 'tenancyId');
      return this.api.patch(`/police-verification/${tenancyId}/complete`, {});
    },
  };

  readonly properties = {
    list: (filters?: PropertyFilters): Observable<unknown> =>
      this.wrap('properties', this.api.get('/properties', { query: filters })),
    interests: (): Observable<unknown> =>
      this.wrap('interests', this.api.get('/properties/interests')),
    details: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.wrap('property', this.api.get(`/properties/${id}`));
    },
    create: (payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(payload['title'], 'title');
      assertRequiredString(payload['address'], 'address');
      assertRequiredString(payload['city'], 'city');
      assertRequiredString(payload['state'], 'state');
      assertRequiredString(payload['postalCode'], 'postalCode');
      if (typeof payload['price'] !== 'number') {
        throw new Error('price is required.');
      }
      return this.wrap('property', this.api.post('/properties', payload));
    },
    update: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.wrap('property', this.api.put(`/properties/${id}`, payload));
    },
    toggleBookmark: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/properties/${id}/bookmark`, {});
    },
    expressInterest: (id: string, notes?: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.wrap('interest', this.api.post(`/properties/${id}/interest`, notes ? { notes } : {}));
    },
    delete: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.delete(`/properties/${id}`);
    },
  };

  readonly search = {
    query: (q: string): Observable<unknown> => {
      assertRequiredString(q, 'q');
      return this.wrap('results', this.api.get('/search', { query: { q } }));
    },
  };

  readonly societies = {
    list: (): Observable<unknown> => this.api.get('/societies'),
    create: (payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(payload['name'], 'name');
      assertRequiredString(payload['address'], 'address');
      assertRequiredString(payload['city'], 'city');
      assertRequiredString(payload['state'], 'state');
      assertRequiredString(payload['postalCode'], 'postalCode');
      return this.api.post('/societies', payload);
    },
    details: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/societies/${id}`);
    },
    addBuilding: (id: string, name: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(name, 'name');
      return this.api.post(`/societies/${id}/buildings`, { name });
    },
    setRules: (id: string, rules: Array<Record<string, unknown>>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/societies/${id}/rules`, rules);
    },
    addContact: (id: string, payload: { name: string; phone: string; description?: string; buildingId?: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(payload.name, 'name');
      assertRequiredString(payload.phone, 'phone');
      return this.api.post(`/societies/${id}/contacts`, payload);
    },
    residents: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/societies/${id}/residents`);
    },
    events: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/societies/${id}/events`);
    },
    createEvent: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/societies/${id}/events`, payload);
    },
    amenities: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/societies/${id}/amenities`);
    },
    bookAmenity: (id: string, payload: { amenityId: string; startTime: string; endTime: string }): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(payload.amenityId, 'amenityId');
      assertRequiredString(payload.startTime, 'startTime');
      assertRequiredString(payload.endTime, 'endTime');
      return this.api.post(`/societies/${id}/amenities/book`, payload);
    },
  };

  readonly support = {
    searchKb: (q?: string, category?: string): Observable<unknown> => this.api.get('/support/kb', { query: { q, category } }),
    kbArticle: (slug: string): Observable<unknown> => {
      assertRequiredString(slug, 'slug');
      return this.api.get(`/support/kb/${slug}`);
    },
    voteKb: (id: string, helpful: boolean): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.post(`/support/kb/${id}/vote`, { helpful });
    },
    createKb: (payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(payload['title'], 'title');
      assertRequiredString(payload['slug'], 'slug');
      assertRequiredString(payload['category'], 'category');
      assertRequiredString(payload['content'], 'content');
      return this.api.post('/support/kb', payload);
    },
    updateKb: (id: string, payload: Record<string, unknown>): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/support/kb/${id}`, payload);
    },
    createTicket: (payload: { topic: string; description: string }): Observable<unknown> => {
      assertRequiredString(payload.topic, 'topic');
      assertRequiredString(payload.description, 'description');
      return this.api.post('/support/tickets', payload);
    },
    listTickets: (): Observable<unknown> => this.api.get('/support/tickets'),
    ticketDetails: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/support/tickets/${id}`);
    },
    addTicketMessage: (id: string, content: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(content, 'content');
      return this.api.post(`/support/tickets/${id}/messages`, { content });
    },
    submitCsat: (id: string, rating: number, comment?: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertNumberInRange(rating, 'rating', 1, 5);
      return this.api.post(`/support/tickets/${id}/csat`, { rating, comment });
    },
    updateTicketStatus: (id: string, status: string, assigneeId?: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      assertRequiredString(status, 'status');
      return this.api.patch(`/support/tickets/${id}/status`, { status, assigneeId });
    },
  };

  readonly tenant = {
    dashboard: (): Observable<unknown> => this.api.get('/tenant/dashboard'),
    tenancies: (): Observable<unknown> => this.api.get('/tenant/tenancies'),
    tenancyDetails: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.get(`/tenant/tenancies/${id}`);
    },
  };

  // ─── Profile (GET/PATCH /api/profile) ─────────────────────────────────────
  readonly profile = {
    get: (): Observable<unknown> => this.api.get('/profile'),
    update: (payload: { 
      firstName?: string; 
      lastName?: string;
      avatar?: string;
      phoneNumber?: string;
      address?: string;
      dateOfBirth?: string;
    }): Observable<unknown> =>
      this.api.patch('/profile', payload),
    changePassword: (payload: { currentPassword: string; newPassword: string }): Observable<unknown> => {
      assertRequiredString(payload.currentPassword, 'currentPassword');
      assertMinLength(payload.newPassword, 'newPassword', 6);
      return this.api.post('/profile/change-password', payload);
    },
    toggle2fa: (enabled: boolean): Observable<{ is2faEnabled: boolean; message: string }> =>
      this.api.patch<{ is2faEnabled: boolean; message: string }>('/profile/2fa', { enabled }),
  };

  // ─── Notifications (GET/PATCH/DELETE /api/notifications) ─────────────────
  readonly notifications = {
    list: (options?: { unreadOnly?: boolean; limit?: number }): Observable<unknown> =>
      this.wrap('notifications', this.api.get('/notifications', {
        query: {
          unreadOnly: options?.unreadOnly ? 'true' : undefined,
          limit: options?.limit?.toString(),
        }
      })),
    unreadCount: (): Observable<unknown> => this.api.get('/notifications/unread-count'),
    markRead: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.patch(`/notifications/${id}/read`, {});
    },
    markAllRead: (): Observable<unknown> => this.api.patch('/notifications/read-all', {}),
    delete: (id: string): Observable<unknown> => {
      assertRequiredString(id, 'id');
      return this.api.delete(`/notifications/${id}`);
    },
  };

  patch<T>(url: string, body: any): Observable<T> {
    return this.httpClient.patch<T>(url, body);
  }
}

