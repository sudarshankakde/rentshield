# RentShield Frontend Development Guide & Restrictions

This document outlines the strict guidelines, architectural patterns, and remaining TODOs for the ongoing development of the RentShield frontend. **All future development must strictly adhere to these rules.**

---

## 🏗️ 1. Architecture Restrictions

### 1.1 Modular Structure
- The frontend must strictly mirror the backend module structure (`auth`, `dashboard`, `tenancies`, `agreements`, `finance`, etc.).
- **DO NOT** dump components into a single directory. Every module must have its own isolated folder containing:
  - `components/`
  - `services/`
  - `routes/`
  - `tests/`
  - `<module>.routes.ts`
- Shared UI components must be placed in `src/app/shared/ui/`.

### 1.2 Component Design
- **Use ShadCN patterns**: Build robust, isolated, and highly reusable components styling with Tailwind CSS.
- **Mobile-First**: Every UI element must be built mobile-first. If a component does not work perfectly on a 320px wide screen, it is considered broken.
- **Strict Typing**: No `any` types allowed. Use interfaces matching the backend DTOs.

---

## 🔒 2. Access Control & API Restrictions

### 2.1 Role-Based Access Control (RBAC)
- All navigation and module access MUST be restricted by `route-definitions.ts` and the global role guards (`roleGuard` in `app.routes.ts`).
- Never hardcode capabilities in the UI components. Always verify user permissions against `AuthService.capabilities()`.
- The following core roles exist:
  - `TENANT`
  - `SUPERADMIN` (Admin)
  - `LANDLORD`
  - `BROKER` / `EXPERT` / `SUPPORT`

### 2.2 API Management
- **One API File Per Feature**: API calls should be strictly isolated to `rentshield-api.service.ts` or separated per module.
- **TanStack Query Required**: For all read queries that require caching, background syncing, or pagination, you must use `@tanstack/angular-query-experimental`. Do not manage raw loading/error states for `GET` requests manually via signals if TanStack Query can handle it.
- **NgRx for App State**: Use NgRx to handle global application state (e.g., Theme, Current Session Context, Multi-step cross-module workflows).

---

## 🎨 3. Aesthetic Restrictions

- **Wow Factor is Mandatory**: Plain forms are unacceptable. 
- Use the established **Glassmorphism** styles (refer to `AuthLayoutComponent` and `DashboardComponent`).
- **Gradients over Solid Colors**: Use `bg-gradient-to-br from-brand-primary to-brand-primary-dark` instead of flat `bg-brand-primary`.
- **Animations**: Include micro-animations for interactions (hover states, focus rings, loading spinners).

---

## 🛠️ 4. Code Quality Restrictions

- **Husky Pre-commit Hooks**: Code will not commit if it fails `npm run lint`. Do not bypass the hook (`--no-verify` is prohibited).
- **Testing**: Write unit tests for critical UI components and core services. 100% test coverage is the target for the `auth` module and `core/services`.

---

## 📋 5. TODOs & Next Steps

### Pending Work for Next Sprints
- [ ] **TanStack Query Migration**: Refactor existing `createRequestState` usage to strictly use `injectQuery()` from TanStack Query for data fetching.
- [ ] **State Management**: Integrate `@ngrx/store` logic for the multi-step `kyc-workflow.component.ts`.
- [ ] **Forms Validation Refinement**: Add dynamic debouncing for heavy form inputs (e.g., username availability checks or search queries).
- [ ] **Test Coverage**: Write `register.component.spec.ts` and `login.component.spec.ts` ensuring all UI states (loading, error, validation) are verified.
- [ ] **Tenant Module Redesign**: Update `tenancy-timeline.component.ts` to match the new premium glassmorphism dashboard aesthetic.
