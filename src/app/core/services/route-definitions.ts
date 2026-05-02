import type { UserRole } from './auth.service';
import type { Type } from '@angular/core';
import { Search, Shield, FileText, User, Hammer, Wallet, MessageSquare, AlertTriangle, HelpCircle, LayoutGrid, Users, Bell } from 'lucide-angular';

// ─── Backend-compatible modules only ────────────────────────────────────────
// ALL entries below now have live backend endpoints.
// profile → /api/profile   |   notifications → /api/notifications

export interface RouteModuleDefinition {
  path: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  roles: UserRole[];
  loadComponent: () => Promise<Type<unknown>>;
}

export const routeModules: RouteModuleDefinition[] = [
  {
    path: 'property',
    name: 'Properties',
    description: 'Browse and manage listings',
    icon: Search,
    color: 'bg-[#00a38d]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'ADMIN'],
    loadComponent: () => import('../../features/property/property-list/property-list.component').then(m => m.PropertyListComponent)
  },
  {
    path: 'tenancies',
    name: 'Tenancies',
    description: 'Track move-in and lease status',
    icon: Shield,
    color: 'bg-[#a355ff]',
    roles: ['TENANT', 'LANDLORD'],
    loadComponent: () => import('../../features/tenancies/tenancy-timeline.component').then(m => m.SlassTimelineComponent)
  },
  {
    path: 'agreements',
    name: 'Agreements',
    description: 'Draft, review, and sign contracts',
    icon: FileText,
    color: 'bg-[#ff6d00]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'ADMIN'],
    loadComponent: () => import('../../features/agreements/agreement-list.component').then(m => m.AgreementListComponent)
  },
  {
    path: 'experts',
    name: 'Experts',
    description: 'Connect with service specialists',
    icon: User,
    color: 'bg-[#4361ee]',
    roles: ['BROKER', 'EXPERT', 'TENANT', 'ADMIN'],
    loadComponent: () => import('../../features/experts/expert-list.component').then(m => m.ExpertListComponent)
  },
  {
    path: 'maintenance',
    name: 'Maintenance',
    description: 'Raise and review repair requests',
    icon: Hammer,
    color: 'bg-[#3a86ff]',
    roles: ['TENANT', 'LANDLORD', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/maintenance/maintenance-list.component').then(m => m.MaintenanceListComponent)
  },
  {
    path: 'finance',
    name: 'Payments',
    description: 'Manage bills and invoices',
    icon: Wallet,
    color: 'bg-[#06d6a0]',
    roles: ['TENANT', 'LANDLORD', 'ADMIN'],
    loadComponent: () => import('../../features/finance/ledger/ledger.component').then(m => m.LedgerComponent)
  },
  {
    path: 'chat',
    name: 'Chat',
    description: 'Collaborate with your support team',
    icon: MessageSquare,
    color: 'bg-[#ff006e]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'dispute',
    name: 'Disputes',
    description: 'Resolve issues and claims',
    icon: AlertTriangle,
    color: 'bg-[#ef4444]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/disputes/dispute-list.component').then(m => m.DisputeListComponent)
  },
  {
    path: 'support',
    name: 'Support',
    description: 'Help center and live assistance',
    icon: HelpCircle,
    color: 'bg-[#6366f1]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/support/support-hub.component').then(m => m.SupportHubComponent)
  },
  {
    path: 'notices',
    name: 'Notices',
    description: 'Community updates and bulletins',
    icon: LayoutGrid,
    color: 'bg-[#f59e0b]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/notices/notice-board.component').then(m => m.NoticeBoardComponent)
  },
  {
    path: 'notifications',
    name: 'Notifications',
    description: 'Alerts and notification preferences',
    icon: Bell,
    color: 'bg-[#64748b]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/notifications/notification-settings.component').then(m => m.NotificationSettingsComponent)
  },

  {
    path: 'kyc',
    name: 'KYC',
    description: 'Verify identity and access secure features',
    icon: Shield,
    color: 'bg-[#0f766e]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/kyc/kyc-workflow.component').then(m => m.KycWorkflowComponent)
  },
  {
    path: 'exit',
    name: 'Exit',
    description: 'Manage move-out workflows',
    icon: FileText,
    color: 'bg-[#f97316]',
    roles: ['TENANT'],
    loadComponent: () => import('../../features/exit/exit-management.component').then(m => m.ExitManagementComponent)
  },
  {
    path: 'society',
    name: 'Society',
    description: 'Society dashboard and contacts',
    icon: Users,
    color: 'bg-[#ec4899]',
    roles: ['ADMIN'],
    loadComponent: () => import('../../features/society/society-dashboard.component').then(m => m.SocietyDashboardComponent)
  },
  {
    path: 'admin',
    name: 'Admin Panel',
    description: 'Platform management and configuration',
    icon: LayoutGrid,
    color: 'bg-[#111827]',
    roles: ['ADMIN'],
    loadComponent: () => import('../../features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'profile',
    name: 'Profile',
    description: 'Update your account details and settings',
    icon: User,
    color: 'bg-[#64748b]',
    roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'],
    loadComponent: () => import('../../features/profile/user-profile.component').then(m => m.UserProfileComponent)
  }
];
