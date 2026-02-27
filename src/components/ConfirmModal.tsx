type Props = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ open, title, message, onConfirm, onCancel }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ui-card w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} className="ui-btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="ui-btn-danger">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
