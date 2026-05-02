export const AUTH_FORM_STYLES = `
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.input-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-soft);
  pointer-events: none;
  display: inline-flex;
  align-items: center;
}

.input-field {
  width: 100%;
  min-height: 2.85rem;
  border: 1.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.75rem 0.85rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input-field:focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(11, 69, 200, 0.08);
}

.password-toggle {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-soft);
  padding: 0.25rem;
  transition: color 0.15s ease;
}

.password-toggle:hover { color: var(--brand-primary); }

.input-error {
  color: var(--danger);
  font-size: 0.72rem;
  font-weight: 600;
}

.submit-btn {
  margin-top: 0.35rem;
  min-height: 2.9rem;
  background: var(--brand-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 900;
  transition: opacity 0.15s ease;
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}

.link-inline {
  display: inline-flex;
  width: fit-content;
  color: var(--brand-primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: opacity 0.15s ease;
}

.link-inline:hover { opacity: 0.7; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;
