import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

const CATEGORY_LABELS = {
  grammar: 'Gramática',
  spelling: 'Ortografía',
  punctuation: 'Puntuación',
  style: 'Estilo / Forma común',
};

export default function CorrectionCard({ correction }) {
  const { original, corrected, explanation, category } = correction;
  const label = CATEGORY_LABELS[category] || 'Corrección';

  return (
    <div 
      className="correction-card"
      style={{ borderLeft: `4px solid var(--color-${category}, var(--color-brand))` }}
    >
      <div>
        <span 
          className="badge"
          style={{ 
            backgroundColor: `var(--color-${category}-light, var(--color-brand-light))`, 
            color: `var(--color-${category}, var(--color-brand))` 
          }}
        >
          {label}
        </span>
      </div>
      
      <div className="words-row">
        <div className="word-badge original">
          <X className="w-3 h-3 text-[var(--color-error)]" />
          <span>{original}</span>
        </div>
        <span className="word-arrow">→</span>
        <div className="word-badge corrected">
          <Check className="w-3 h-3 text-[var(--color-success)]" />
          <span>{corrected}</span>
        </div>
      </div>
      
      <div className="explanation-block">
        <AlertCircle className="explanation-icon" size={16} />
        <p>{explanation}</p>
      </div>
    </div>
  );
}
