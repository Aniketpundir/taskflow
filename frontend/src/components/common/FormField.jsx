/**
 * Wraps a label + input/select/textarea (passed as children) with consistent
 * spacing and an inline error message.
 */
const FormField = ({ label, htmlFor, error, required, children, hint }) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
  </div>
);

export const inputClass = (hasError) =>
  `w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
    hasError ? "border-rose-300" : "border-slate-200"
  }`;

export default FormField;
