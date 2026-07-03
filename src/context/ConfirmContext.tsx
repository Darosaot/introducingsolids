import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ChoiceVariant = 'primary' | 'danger' | 'ghost';

interface Choice {
  value: string;
  label: string;
  variant?: ChoiceVariant;
}

interface ConfirmOptions {
  title: string;
  body: string;
  choices?: Choice[];
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: string | null) => void;
}

interface ConfirmState {
  choose: (options: ConfirmOptions) => Promise<string | null>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmState | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const choose = useCallback((options: ConfirmOptions) => {
    return new Promise<string | null>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const confirm = useCallback(
    async (options: ConfirmOptions) => {
      const value = await choose({
        ...options,
        choices: options.choices ?? [
          { value: 'confirm', label: 'Confirmar', variant: 'danger' },
          { value: 'cancel', label: 'Cancelar', variant: 'ghost' },
        ],
      });
      return value === 'confirm';
    },
    [choose],
  );

  const close = useCallback(
    (value: string | null) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  const value = useMemo(() => ({ choose, confirm }), [choose, confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && (
        <div className="modal-backdrop confirm-backdrop" onClick={() => close(null)}>
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title">{pending.title}</h2>
            <p>{pending.body}</p>
            <div className="confirm-actions">
              {(pending.choices ?? []).map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  className={choice.variant === 'danger' ? 'danger' : choice.variant === 'primary' ? 'primary' : 'ghost'}
                  onClick={() => close(choice.value)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): ConfirmState {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}
