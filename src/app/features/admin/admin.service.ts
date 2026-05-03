import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private readonly api = inject(RentShieldApiService);

  async getStats(): Promise<any> {
    const res: any = await firstValueFrom(this.api.admin.stats());
    return res?.stats ?? res;
  }

  async listModules(): Promise<any[]> {
    const res: any = await firstValueFrom(this.api.admin.listModules());
    return res?.modules ?? [];
  }

  async toggleModule(id: string, isActive: boolean): Promise<any> {
    return firstValueFrom(this.api.admin.toggleModule(id, isActive));
  }

  async createModule(name: string, label?: string): Promise<any> {
    return firstValueFrom(this.api.admin.createModule({ name, label }));
  }

  async deleteModule(id: string): Promise<any> {
    return firstValueFrom(this.api.admin.deleteModule(id));
  }

  async listFeatures(moduleId?: string): Promise<any[]> {
    const res: any = await firstValueFrom(this.api.admin.listFeatures(moduleId));
    return res?.features ?? [];
  }

  async createFeature(name: string, moduleId: string, description?: string): Promise<any> {
    return firstValueFrom(this.api.admin.createFeature({ name, moduleId, description }));
  }

  async deleteFeature(id: string): Promise<any> {
    return firstValueFrom(this.api.admin.deleteFeature(id));
  }

  async updateFeature(id: string, name?: string, description?: string): Promise<any> {
    return firstValueFrom(this.api.admin.updateFeature(id, { name, description }));
  }

  async updateModule(id: string, name?: string, label?: string): Promise<any> {
    return firstValueFrom(this.api.admin.updateModule(id, { name, label }));
  }

  async listUsers(query?: any): Promise<any[]> {
    const res: any = await firstValueFrom(this.api.admin.listUsers(query));
    return res?.users ?? [];
  }

  async updateUserRole(id: string, role: string): Promise<any> {
    return firstValueFrom(this.api.admin.updateUserRole(id, role));
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<any> {
    return firstValueFrom(this.api.admin.updateUserStatus(id, isActive));
  }

  async updateUser(id: string, data: any): Promise<any> {
    return firstValueFrom(this.api.admin.updateUser(id, data));
  }

  async deleteUser(id: string): Promise<any> {
    return firstValueFrom(this.api.admin.deleteUser(id));
  }

  async listKyc(status?: string): Promise<any[]> {
    const res: any = await firstValueFrom(this.api.admin.listKyc(status));
    return res?.submissions ?? [];
  }

  async reviewKyc(id: string, status: string, notes?: string): Promise<any> {
    return firstValueFrom(this.api.admin.reviewKyc(id, status, notes));
  }

  async listProperties(): Promise<any[]> {
    const res: any = await firstValueFrom(this.api.admin.listProperties());
    return res?.properties ?? [];
  }

  async togglePropertyPublish(id: string, isActive: boolean): Promise<any> {
    return firstValueFrom(this.api.admin.togglePropertyPublish(id, isActive));
  }

  async updateProperty(id: string, data: any): Promise<any> {
    return firstValueFrom(this.api.admin.updateProperty(id, data));
  }

  async deleteProperty(id: string): Promise<any> {
    return firstValueFrom(this.api.admin.deleteProperty(id));
  }

  async getRoleMatrix(): Promise<any> {
    return firstValueFrom(this.api.admin.getRoleMatrix());
  }

  async assignRoleFeature(role: string, featureId: string): Promise<any> {
    return firstValueFrom(this.api.admin.assignRoleFeature(role, featureId));
  }

  async revokeRoleFeature(role: string, featureId: string): Promise<any> {
    return firstValueFrom(this.api.admin.revokeRoleFeature(role, featureId));
  }

  async seedModules(): Promise<any> {
    return firstValueFrom(this.api.admin.seedModules());
  }
}
