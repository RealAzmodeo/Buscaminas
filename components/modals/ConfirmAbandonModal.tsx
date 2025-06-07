
import React from 'react';
import Button from '../common/Button';

/**
 * @interface ConfirmAbandonModalProps
 * @description Props for the ConfirmAbandonModal component.
 * @property {boolean} isOpen - Whether the modal is currently open.
 * @property {() => void} onConfirm - Callback function when the abandon action is confirmed.
 * @property {() => void} onCancel - Callback function when the abandon action is canceled.
 */
interface ConfirmAbandonModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * @component ConfirmAbandonModal
 * @description A modal dialog that asks the user to confirm if they want to abandon their current run.
 * It is designed to be accessible, using ARIA attributes to define its role as a dialog and provide
 * descriptive labels for assistive technologies.
 *
 * @param {ConfirmAbandonModalProps} props - The props for the ConfirmAbandonModal component.
 * @returns {React.ReactElement | null} The rendered modal dialog or null if not open.
 */
const ConfirmAbandonModal: React.FC<ConfirmAbandonModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  // Unique IDs for ARIA labelling
  const titleId = "confirmAbandonTitle";
  const descriptionId = "confirmAbandonDescription";

  return (
    <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" // z-index ensures it's on top
        role="dialog" // ARIA role for dialog
        aria-modal="true" // Indicates it's a modal dialog, trapping focus (browser usually handles this for native dialogs, ensure focus is managed if not)
        aria-labelledby={titleId} // Associates the dialog with its title
        aria-describedby={descriptionId} // Associates the dialog with its descriptive text
    >
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-red-700">
        <h2 id={titleId} className="text-2xl font-bold text-red-400 mb-4">Abandonar Partida</h2>
        <p id={descriptionId} className="text-slate-300 mb-6">
          ¿Estás seguro de que quieres abandonar la partida actual? Todo el progreso de esta partida (excepto los Fragmentos de Alma recolectados) se perderá. Serás devuelto al Menú Principal después del resumen de la partida.
        </p>
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel} variant="secondary" size="md" aria-label="Cancelar abandono y continuar jugando">
            No, Continuar Jugando
          </Button>
          <Button onClick={onConfirm} variant="danger" size="md" aria-label="Confirmar abandono de partida">
            Sí, Abandonar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAbandonModal;
