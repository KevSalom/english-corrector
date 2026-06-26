import { createContext, useContext, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [modal, setModal] = useState(null);

  const showAlert = (message, title = 'Atención') => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type: 'alert',
        resolve,
      });
    });
  };

  const showConfirm = (message, title = 'Confirmar') => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        resolve,
      });
    });
  };

  const handleClose = (value) => {
    if (modal) {
      modal.resolve(value);
      setModal(null);
    }
  };

  return (
    <AlertContext.Provider value={{ alert: showAlert, confirm: showConfirm }}>
      {children}
      
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-surface border border-border-custom rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between py-4 px-5 border-b border-border-custom bg-surface-hover shrink-0">
              <h3 className="text-text-primary font-bold flex items-center gap-2 m-0 text-base">
                {modal.type === 'confirm' ? (
                  <AlertTriangle className="w-5 h-5 text-brand" />
                ) : (
                  <Info className="w-5 h-5 text-brand" />
                )}
                <span>{modal.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-border-custom transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex-grow">
              <p className="text-sm text-text-secondary leading-relaxed m-0 break-words font-medium">
                {modal.message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border-custom bg-surface-hover shrink-0">
              {modal.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 rounded-xl border border-border-custom text-text-secondary hover:bg-surface text-sm font-semibold transition-all cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => handleClose(true)}
                className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-sm transition-all cursor-pointer min-h-[40px]"
                autoFocus
              >
                {modal.type === 'confirm' ? 'Confirmar' : 'Aceptar'}
              </button>
            </div>

          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
