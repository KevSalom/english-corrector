import { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, RotateCcw, AlertTriangle, Info, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import CorrectionCard from './CorrectionCard';

export default function MainCorrector({ isMini = false }) {
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

  // Load last session on mount (only for normal app view to prevent state collision in compare view)
  useEffect(() => {
    if (isMini) return;
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
  }, [isMini]);

  const handleCorrect = async (e) => {
    if (e) e.preventDefault();
    if (loading || !inputText.trim()) return;

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
      if (!isMini) {
        localStorage.setItem('lastInputText', inputText);
        localStorage.setItem('lastResult', JSON.stringify(data));
      }
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
    if (!isMini) {
      localStorage.removeItem('lastInputText');
      localStorage.removeItem('lastResult');
    }
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
            className="px-1 py-0.5 rounded font-medium border-b-2 line-through text-error-custom bg-error-light-custom/40 border-b-error-custom select-none"
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
        
        let bgStyle = 'bg-brand-light text-brand border-b-brand';
        if (category === 'grammar') bgStyle = 'bg-grammar-light text-grammar border-b-grammar';
        else if (category === 'spelling') bgStyle = 'bg-spelling-light text-spelling border-b-spelling';
        else if (category === 'punctuation') bgStyle = 'bg-punctuation-light text-punctuation border-b-punctuation';
        else if (category === 'style') bgStyle = 'bg-style-light text-style border-b-style';

        return (
          <span 
            key={index} 
            className={`px-1.5 py-0.5 rounded font-semibold border-b-2 ${bgStyle}`}
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
    <div className={`w-full flex flex-col gap-6 ${isMini ? '' : 'max-w-4xl mx-auto'}`}>
      
      {/* Header section (only for main page) */}
      {!isMini && (
        <div className="text-center sm:text-left mb-2">
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-text-primary">
            Práctica de Escritura
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2 text-pretty">
            Escribe en inglés y mejora tu <strong>writing</strong> con correcciones detalladas al instante.
          </p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleCorrect} className="p-5 sm:p-6 rounded-2xl bg-surface border border-border-custom shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary tracking-wider uppercase">
          <label htmlFor={`english-input-${isMini ? 'mini' : 'normal'}`}>
            Tu texto en inglés
          </label>
          <span className="text-text-muted">
            {inputText.length} / 1000
          </span>
        </div>
        
        <textarea
          id={`english-input-${isMini ? 'mini' : 'normal'}`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleCorrect(e);
            }
          }}
          placeholder="Escribe o pega aquí tu oración, por ejemplo: 'I am agree with you, but she don't write very good...'"
          className={`w-full p-4 rounded-xl border border-border-custom bg-app text-text-primary text-sm sm:text-base focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none resize-none placeholder:text-text-muted ${
            isMini ? 'h-24' : 'h-36'
          }`}
          disabled={loading}
        />

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-xl border border-border-custom bg-surface hover:bg-surface-hover text-text-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            disabled={loading || !inputText}
            title="Limpiar texto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpiar</span>
          </button>

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
            title="Revisar Oración (Ctrl + Enter)"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-error-custom/20 bg-error-light-custom/30 text-error-custom text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="flex flex-col gap-6">
          
          {/* Comparison grids */}
          <div className={`grid gap-6 ${isMini ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Original Card */}
            <div className="p-5 rounded-xl border border-border-custom bg-surface flex flex-col gap-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-error-custom border-b border-border-custom pb-2">
                Texto Original
              </h3>
              <p className="text-sm sm:text-base text-text-primary leading-relaxed whitespace-pre-wrap">
                {result.has_corrections 
                  ? highlightOriginal(result.original_text, result.corrections) 
                  : result.original_text
                }
              </p>
            </div>

            {/* Corrected Card */}
            <div className="p-5 rounded-xl border border-border-custom bg-surface flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-custom pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-success-custom">
                  Texto Corregido
                </h3>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`p-1.5 rounded-xl border border-border-custom hover:bg-surface-hover transition-all text-text-secondary cursor-pointer ${
                      speaking ? 'bg-brand-light text-brand border-brand/20' : ''
                    }`}
                    title={speaking ? "Detener pronunciación" : "Escuchar pronunciación (US)"}
                  >
                    {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-xl border border-border-custom hover:bg-surface-hover transition-all text-text-secondary cursor-pointer"
                    title="Copiar texto corregido"
                  >
                    {copied ? <Check className="w-4 h-4 text-success-custom" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-sm sm:text-base text-text-primary leading-relaxed whitespace-pre-wrap">
                {result.has_corrections
                  ? highlightCorrections(result.corrected_text, result.corrections)
                  : result.corrected_text
                }
              </p>
            </div>
          </div>

          {/* Feedback Info Box */}
          <div className="flex items-start gap-3 p-4 rounded-xl border border-brand/10 bg-brand-light text-text-secondary text-sm leading-relaxed">
            <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-text-primary mb-1 text-xs uppercase tracking-wider">
                Consejo e Información
              </h4>
              <p className="text-xs sm:text-sm">{result.general_feedback}</p>
            </div>
          </div>

          {/* Detailed corrections list */}
          <div className="mt-2">
            <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
              <span>Explicación de las Correcciones</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-light text-brand">
                {result.corrections.length}
              </span>
            </h3>

            {result.has_corrections ? (
              <div className="flex flex-col gap-4">
                {result.corrections.map((corr, idx) => (
                  <CorrectionCard key={idx} correction={corr} />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-border-custom bg-surface text-center flex flex-col items-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-success-custom" />
                <h4 className="font-bold text-text-primary">¡Oración perfecta!</h4>
                <p className="text-text-secondary text-sm max-w-md">
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
