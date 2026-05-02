export const AUTH_FORM_STYLES = `
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 700;
  margin-left: 0.25rem;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-soft);
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s ease;
}

.input-field {
  width: 100%;
  min-height: 3.25rem;
  border: 1px solid var(--border);
  background: var(--surface-soft);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.input-field:focus {
  border-color: var(--brand-primary);
  background: var(--surface);
  box-shadow: 0 0 0 4px var(--brand-primary-light)20, inset 0 2px 4px rgba(0,0,0,0.01);
}

.input-field:focus ~ .input-icon,
.input-wrap:focus-within .input-icon {
  color: var(--brand-primary);
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-soft);
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.password-toggle:hover { 
  color: var(--brand-primary); 
  background: var(--surface-muted);
}

.input-error {
  color: var(--danger);
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.input-error::before {
  content: "•";
}

.submit-btn {
  margin-top: 0.5rem;
  min-height: 3.25rem;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark));
  color: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(11, 69, 200, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.1);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(11, 69, 200, 0.35);
  background: linear-gradient(135deg, var(--brand-primary-light), var(--brand-primary));
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(11, 69, 200, 0.2);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--surface-strong);
  color: var(--text-muted);
  box-shadow: none;
  border-color: transparent;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}

.submit-btn:disabled .spinner {
  border-color: var(--text-soft);
  border-top-color: var(--text-muted);
}

.link-inline {
  display: inline-flex;
  width: fit-content;
  color: var(--brand-primary);
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
  text-decoration: none;
}

.link-inline:hover { 
  color: var(--brand-primary-dark);
  text-decoration: underline;
  text-underline-offset: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;
