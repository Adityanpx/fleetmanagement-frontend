'use client';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete' }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </>}>
      <p className="text-sm text-zinc-600">{message}</p>
    </Modal>
  );
}
