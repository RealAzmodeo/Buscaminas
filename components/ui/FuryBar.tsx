
import React from 'react';

/**
 * @interface FuryBarProps
 * @description Props for the FuryBar component.
 * @property {number} currentFury - The current Fury value of the enemy.
 * @property {number} maxFury - The maximum Fury value (threshold for activation).
 */
interface FuryBarProps {
  currentFury: number;
  maxFury: number;
}

/**
 * @component FuryBar
 * @description Displays a progress bar representing the enemy's current Fury level.
 * It includes ARIA attributes to make the progress bar accessible to screen readers.
 */
const FuryBar: React.FC<FuryBarProps> = ({ currentFury, maxFury }) => {
  // Calculate the percentage of Fury, ensuring it's between 0 and 100.
  // Handle division by zero if maxFury is 0.
  const percentage = maxFury > 0 ? Math.min(100, (currentFury / maxFury) * 100) : 0;

  // Generate a unique ID for ARIA labelling, associating the text label with the progress bar.
  // Using React.useId() for stable unique IDs (requires React 18+).
  // For older React versions, a simpler unique ID generation or a fixed ID might be used if only one FuryBar is on screen.
  const furyLabelId = `fury-label-${React.useId()}`;

  return (
    <div className="mt-1">
      <p id={furyLabelId} className="text-sm text-orange-400 mb-0.5">
        <span aria-hidden="true">🔥</span> Fury: {currentFury}/{maxFury}
      </p>
      <div
        className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600"
        role="progressbar" // ARIA role indicating it's a progress bar
        aria-valuenow={currentFury} // Current value for screen readers
        aria-valuemin={0} // Minimum value
        aria-valuemax={maxFury} // Maximum value
        aria-labelledby={furyLabelId} // Associates the visual label with the progress bar
        aria-label={`Barra de Furia del enemigo, ${currentFury} de ${maxFury}`} // A more direct label in case labelledby is not fully supported or for clarity
      >
        <div
          className="bg-orange-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          // The visual representation of progress; aria-valuenow handles the accessible value.
        />
      </div>
    </div>
  );
};

export default FuryBar;
