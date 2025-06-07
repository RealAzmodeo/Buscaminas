
import React from 'react';

/**
 * @interface ToggleSwitchProps
 * @description Props for the ToggleSwitch component.
 * @property {string} id - The unique ID for the input element, used for label association.
 * @property {string} label - The label text to display next to the toggle switch.
 * @property {boolean} checked - The current state of the toggle (true for on, false for off).
 * @property {(checked: boolean) => void} onChange - Callback function when the toggle state changes.
 * @property {boolean} [disabled=false] - If true, the toggle switch is disabled.
 */
interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * @component ToggleSwitch
 * @description A reusable toggle switch input component, styled to look like a modern switch.
 * It is designed for accessibility, using ARIA attributes to convey its state and role.
 *
 * @param {ToggleSwitchProps} props - The props for the ToggleSwitch component.
 * @returns {React.ReactElement} The rendered toggle switch element.
 */
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, label, checked, onChange, disabled = false }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  // Unique ID for the label text itself, to be used by aria-labelledby
  const labelId = `${id}-label`;

  return (
    <label htmlFor={id} className={`flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only" // Hide the default checkbox; styling is done via divs
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          role="switch" // ARIA role for a toggle switch
          aria-checked={checked} // Communicates the on/off state
          aria-labelledby={labelId} // Associates the input with its visual label text
        />
        {/* Background of the switch */}
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-sky-500' : 'bg-slate-600'}`}></div>
        {/* The sliding dot/knob of the switch */}
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-full' : ''}`}></div>
      </div>
      <div id={labelId} className="ml-3 text-sm text-slate-300">{label}</div>
    </label>
  );
};

export default ToggleSwitch;
