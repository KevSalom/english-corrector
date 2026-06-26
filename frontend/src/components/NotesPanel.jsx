import { useState, useEffect, useRef } from 'react';
import { X, Trash2, StickyNote, AlertCircle, Edit2 } from 'lucide-react';
import { useAlert } from './AlertProvider';

export default function NotesPanel({ isOpen, onClose }) {
  const { confirm } = useAlert();
  const [notes, setNotes] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const textareaRef = useRef(null);

  // Fetch notes on open
  useEffect(() => {
    if (isOpen) {
      fetchNotes();
      // Focus textarea when panel opens
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const fetchNotes = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Error al guardar la nota.');
      }

      setNotes((prev) => [data, ...prev]);
      setNewContent('');
      showToast('¡Nota guardada!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('¿Eliminar esta nota?');
    if (!ok) return;
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        showToast('Nota eliminada');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleUpdateNote = async (id) => {
    if (!editingContent.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Error al actualizar la nota.');
      }

      setNotes((prev) => prev.map((n) => (n.id === id ? data : n)));
      setEditingId(null);
      setEditingContent('');
      showToast('Nota actualizada');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  // Relative time helper
  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr + 'Z'); // Treat as UTC
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHr < 24) return `Hace ${diffHr}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-150 hidden sm:block ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-surface border-l border-border-custom shadow-2xl z-50 flex flex-col transition-transform duration-150 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-5 border-b border-border-custom bg-surface shrink-0">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2.5 m-0">
            <StickyNote className="w-5 h-5 text-brand" />
            <span>Mis Notas</span>
            {notes.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-brand-light text-brand">
                {notes.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New note form */}
        <form onSubmit={handleSave} className="p-4 border-b border-border-custom bg-app shrink-0">
          <label htmlFor="note-input" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Nueva nota
          </label>
          <textarea
            id="note-input"
            ref={textareaRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value.slice(0, 2000))}
            placeholder="Escribe una frase, palabra, o lo que quieras recordar..."
            className="w-full p-3 rounded-xl border border-border-custom bg-surface text-text-primary text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none resize-none h-24 placeholder:text-text-muted"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs text-text-muted">{newContent.length} / 2000</span>
            <button
              type="submit"
              disabled={loading || !newContent.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Nota</span>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl border border-error-custom/20 bg-error-light-custom/30 text-error-custom text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Notes list */}
        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl border border-border-custom bg-surface shadow-sm flex flex-col gap-3"
              >
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2.5">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value.slice(0, 2000))}
                      className="w-full p-2.5 rounded-xl border border-border-custom bg-app text-text-primary text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none resize-none h-24"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent('');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-border-custom text-text-secondary hover:bg-surface-hover text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editingContent.trim() || loading}
                        className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words m-0">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between border-t border-border-custom/30 pt-2 shrink-0">
                      <span className="text-[11px] text-text-muted">{timeAgo(note.created_at)}</span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditingContent(note.content);
                          }}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-brand transition-colors cursor-pointer"
                          title="Editar nota"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="font-semibold">Editar</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDelete(note.id)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-error-custom transition-colors cursor-pointer"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="font-semibold">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-12 gap-3">
              <StickyNote className="w-12 h-12 text-brand/25" />
              <div>
                <p className="text-sm font-semibold text-text-muted">No tienes notas guardadas</p>
                <p className="text-xs text-text-muted mt-1">
                  Escribe arriba cualquier frase o palabra que quieras recordar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Toast notification */}
        {toast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold shadow-lg animate-in fade-in zoom-in duration-200">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
