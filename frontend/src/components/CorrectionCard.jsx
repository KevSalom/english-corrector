import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

const CATEGORY_LABELS = {
  grammar: 'Gramática',
  spelling: 'Ortografía',
  punctuation: 'Puntuación',
  style: 'Estilo / Forma común',
};

// Dynamic styling maps using Tailwind CSS classes for high contrast
const CATEGORY_STYLES = {
  grammar: {
    border: 'border-l-4 border-l-grammar',
    badge: 'bg-grammar-light text-grammar',
  },
  spelling: {
    border: 'border-l-4 border-l-spelling',
    badge: 'bg-spelling-light text-spelling',
  },
  punctuation: {
    border: 'border-l-4 border-l-punctuation',
    badge: 'bg-punctuation-light text-punctuation',
  },
  style: {
    border: 'border-l-4 border-l-style',
    badge: 'bg-style-light text-style',
  },
};

export default function CorrectionCard({ correction }) {
  const { original, corrected, explanation, category } = correction;
  const label = CATEGORY_LABELS[category] || 'Corrección';
  const styles = CATEGORY_STYLES[category] || {
    border: 'border-l-4 border-l-brand',
    badge: 'bg-brand-light text-brand',
  };

  return (
    <div className={`p-4 rounded-r-xl border border-border-custom bg-surface shadow-sm ${styles.border} flex flex-col gap-3 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${styles.badge}`}>
          {label}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-error-light-custom/40 border border-error-custom/10 text-error-custom font-medium line-through decoration-error-custom decoration-2">
          <X className="w-3.5 h-3.5" />
          <span>{original}</span>
        </div>
        
        <span className="text-text-muted font-bold text-lg leading-none">→</span>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-success-light-custom/40 border border-success-custom/10 text-success-custom font-semibold">
          <Check className="w-3.5 h-3.5" />
          <span>{corrected}</span>
        </div>
      </div>
      
      <div className="flex items-start gap-2.5 p-3 rounded bg-app border border-border-custom/50 text-text-secondary text-xs sm:text-sm">
        <AlertCircle className="w-4.5 h-4.5 text-text-muted shrink-0 mt-0.5" />
        <p className="leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
}
