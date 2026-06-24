import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, RotateCcw, AlertTriangle, Info, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import CorrectionCard from './CorrectionCard';

export default function MainCorrector() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // SpeechSynthesis voice controller
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(result.corrected_text);
      utterance.lang = 'en-US';
      
      // Try to load voices
      const voices = window.speechSynthesis.getVoices();
      const usVoice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')) 
                   || voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('natural'))
                   || voices.find(v => v.lang === 'en-US');
      
      if (usVoice) {
        utterance.voice = usVoice;
      }

      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Tu navegador no soporta la síntesis de voz nativa.');
    }
  };

  // Cancel speaking if result changes or component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [result]);

  // Load last session on mount
  useEffect(() => {
    const savedInputText = localStorage.getItem('lastInputText');
    const savedResult = localStorage.getItem('lastResult');
    
    if (savedInputText) setInputText(savedInputText);
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Error parsing saved result", e);
      }
    }
  }, []);

  const handleCorrect = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Ocurrió un error al procesar el texto.');
      }

      setResult(data);
      localStorage.setItem('lastInputText', inputText);
      localStorage.setItem('lastResult', JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setError(null);
    localStorage.removeItem('lastInputText');
    localStorage.removeItem('lastResult');
  };

  const copyToClipboard = async () => {
    if (!result || !result.corrected_text) return;
    try {
      await navigator.clipboard.writeText(result.corrected_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  // Helper to highlight errors in original text
  const highlightOriginal = (text, corrections) => {
    if (!corrections || corrections.length === 0) return text;
    
    const sortedCorrections = [...corrections].sort((a, b) => b.original.length - a.original.length);
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = sortedCorrections.map(c => escapeRegExp(c.original)).filter(Boolean);
    if (patterns.length === 0) return text;
    
    const regex = new RegExp(`\\b(${patterns.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isMatch = sortedCorrections.some(c => c.original.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        const corr = sortedCorrections.find(c => c.original.toLowerCase() === part.toLowerCase());
        return (
          <span 
            key={index} 
            className="px-1 py-0.5 rounded font-medium border-b-2 line-through text-[var(--color-error)] bg-[var(--color-error-light)] border-b-[var(--color-error)]"
            title={`Incorrecto. Debería ser: ${corr.corrected}`}
            style={{ textDecoration: 'line-through' }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Helper to highlight corrections in corrected text
  const highlightCorrections = (text, corrections) => {
    if (!corrections || corrections.length === 0) return text;
    
    const sortedCorrections = [...corrections].sort((a, b) => b.corrected.length - a.corrected.length);
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = sortedCorrections.map(c => escapeRegExp(c.corrected)).filter(Boolean);
    if (patterns.length === 0) return text;
    
    const regex = new RegExp(`\\b(${patterns.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isMatch = sortedCorrections.some(c => c.corrected.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        const corr = sortedCorrections.find(c => c.corrected.toLowerCase() === part.toLowerCase());
        const category = corr ? corr.category : 'brand';
        return (
          <span 
            key={index} 
            className="px-1.5 py-0.5 rounded font-semibold border-b-2"
            style={{
              backgroundColor: `var(--color-${category}-light)`,
              color: `var(--color-${category})`,
              borderBottomColor: `var(--color-${category})`
            }}
            title={corr ? `${corr.category.toUpperCase()}: ${corr.explanation}` : ''}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="corrector-container animate-fade-in">
      <div className="corrector-header">
        <h1 className="title-gradient">
          Práctica de Escritura con Feedback Inmediato
        </h1>
        <p className="subtitle">
          Escribe tu texto en inglés y obtén correcciones detalladas con explicaciones en español al instante.
        </p>
      </div>

      <form onSubmit={handleCorrect} className="corrector-card">
        <div className="input-meta">
          <label htmlFor="english-input" className="input-label">
            Tu texto en inglés
          </label>
          <span className="char-counter">
            {inputText.length} / 1000 caracteres
          </span>
        </div>
        
        <textarea
          id="english-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
          placeholder="Escribe o pega aquí tu oración, por ejemplo: 'I am agree with you, but she don't write very good...'"
          className="corrector-textarea"
          disabled={loading}
        />

        <div className="actions-row">
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary"
            disabled={loading || !inputText}
            title="Limpiar texto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpiar</span>
          </button>

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <svg className="spinner" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Revisar Oración</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-alert">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="result-area animate-fade-in">
          {/* Comparisons side-by-side or stacked */}
          <div className="comparison-grid">
            <div className="comparison-card">
              <div className="card-header-row">
                <h3 className="card-title original">
                  Texto Original
                </h3>
              </div>
              <p className="comparison-text">
                {result.has_corrections 
                  ? highlightOriginal(result.original_text, result.corrections) 
                  : result.original_text
                }
              </p>
            </div>

            <div className="comparison-card corrected">
              <div className="card-header-row">
                <h3 className="card-title corrected">
                  Texto Corregido
                </h3>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`btn-icon ${speaking ? 'speaking' : ''}`}
                    title={speaking ? "Detener pronunciación" : "Escuchar pronunciación (US)"}
                  >
                    {speaking ? <VolumeX className="w-4 h-4 text-[var(--color-brand)]" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="btn-icon"
                    title="Copiar texto corregido"
                  >
                    {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="comparison-text">
                {result.has_corrections
                  ? highlightCorrections(result.corrected_text, result.corrections)
                  : result.corrected_text
                }
              </p>
            </div>
          </div>

          {/* General Feedback */}
          <div className="feedback-box">
            <Info className="feedback-icon" size={20} />
            <div className="feedback-content">
              <h4 className="feedback-title">
                Consejo e Información
              </h4>
              <p className="feedback-text">
                {result.general_feedback}
              </p>
            </div>
          </div>

          {/* Corrections details */}
          <div>
            <h3 className="section-title">
              <span>Explicación de las Correcciones</span>
              <span className="badge-count">
                {result.corrections.length}
              </span>
            </h3>

            {result.has_corrections ? (
              <div className="corrections-list">
                {result.corrections.map((corr, idx) => (
                  <CorrectionCard key={idx} correction={corr} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CheckCircle2 className="empty-state-icon" size={48} />
                <h4 className="empty-state-title">¡Oración perfecta!</h4>
                <p className="empty-state-text">
                  No se encontraron errores gramaticales, ortográficos ni de estilo en tu texto. ¡Excelente nivel de escritura!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
