
import React from 'react';
import Button from '../common/Button';

interface ConfirmMirrorUpgradeModalProps {
  isOpen: boolean;
  upgradeName: string;
  upgradeCost: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmMirrorUpgradeModal: React.FC<ConfirmMirrorUpgradeModalProps> = ({ 
    isOpen, 
    upgradeName,
    upgradeCost,
    onConfirm, 
    onCancel 
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        aria-modal="true"
        role="dialog"
        aria-labelledby="confirmMirrorUpgradeTitle"
        aria-describedby="confirmMirrorUpgradeDescription"
    >
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-sky-700/50">
        <h2 id="confirmMirrorUpgradeTitle" className="text-2xl font-bold text-sky-300 mb-4">Confirmar Mejora</h2>
        <p id="confirmMirrorUpgradeDescription" className="text-slate-300 mb-2">
          ¿Estás seguro de que quieres mejorar <strong className="text-sky-200">{upgradeName}</strong>?
        </p>
        <p className="text-slate-300 mb-6">
          Esto costará <strong className="text-yellow-300">{upgradeCost} <span aria-label="Lúmenes de Voluntad">💡</span> Lúmenes de Voluntad</strong>. Esta acción es permanente.
        </p>
        <div className="flex justify-end space-x-3">
          <Button onClick={onCancel} variant="secondary" size="md">
            Cancelar
          </Button>
          <Button onClick={onConfirm} variant="primary" size="md">
            Confirmar Mejora
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMirrorUpgradeModal;