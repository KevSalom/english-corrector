import { StickyNote } from 'lucide-react';

export default function NotesButton({ onClick, noteCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-surface hover:bg-surface-hover text-brand border border-border-custom sm:bg-brand sm:hover:bg-brand-hover sm:text-white sm:border-transparent shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 min-h-[48px]"
      title="Abrir mis notas"
    >
      <StickyNote className="w-5 h-5" />
      <span className="text-sm hidden sm:inline">Mis Notas</span>
      {noteCount > 0 && (
        <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold rounded-full bg-brand sm:bg-white text-white sm:text-brand">
          {noteCount > 99 ? '99+' : noteCount}
        </span>
      )}
    </button>
  );
}
