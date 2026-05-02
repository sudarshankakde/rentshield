import { Injectable } from '@angular/core';
import loginResponse from '../mock/auth-login.response.json';
import capabilitiesResponse from '../mock/auth-capabilities.response.json';
import uiConfigResponse from '../mock/auth-ui-config.response.json';
import tenantDashboardResponse from '../mock/tenant-dashboard.response.json';
import propertiesResponse from '../mock/properties.response.json';
import phase1ModulesResponse from '../mock/phase1-modules.response.json';

export type ApiMethod = 'GET' | 'POST' | 'PATCH';

export interface TenantModuleResponse {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: ApiMethod;
  status: string;
  path: string;
}

export interface TenantDashboardResponse {
  tenant: {
    id: string;
    name: string;
    role: 'TENANT';
    kycStatus: string;
    trustScore: number;
  };
  currentTenancy: {
    tenancyId: string;
    propertyName: string;
    unit: string;
    city: string;
    moveInDate: string;
    leaseEndDate: string;
    monthlyRent: number;
    societyId: string;
  };
  modules: TenantModuleResponse[];
  paymentsDue: Array<{
    paymentId: string;
    label: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    status: string;
  }>;
  verification: {
    tenancyId: string;
    aadhaarMasked: string;
    status: string;
    reportUrl: string | null;
  };
}

export interface Phase1ModuleResponse {
  id: string;
  name: string;
  route: string;
  status: string;
  summary: string;
  capabilities: string[];
}

@Injectable({ providedIn: 'root' })
export class MockApiService {
  readonly baseUrl = 'http://localhost:4000/api';

  login() {
    return loginResponse;
  }

  capabilities() {
    return capabilitiesResponse;
  }

  uiConfig() {
    return uiConfigResponse;
  }

  tenantDashboard(): TenantDashboardResponse {
    return tenantDashboardResponse as TenantDashboardResponse;
  }

  properties() {
    return propertiesResponse;
  }

  phase1Modules(): Phase1ModuleResponse[] {
    return phase1ModulesResponse.modules;
  }
}
