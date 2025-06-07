
import React from 'react';

/**
 * @interface SliderInputProps
 * @description Props for the SliderInput component.
 * @property {string} label - The label text to display for the slider.
 * @property {string} id - The unique ID for the input element, used for label association.
 * @property {number} value - The current value of the slider.
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange - Callback function when the slider value changes.
 * @property {number} [min=0] - The minimum value of the slider.
 * @property {number} [max=100] - The maximum value of the slider.
 * @property {number} [step=1] - The step increment of the slider.
 * @property {string} [unit=''] - Optional unit to display next to the value (e.g., "%", "px").
 * @property {boolean} [disabled=false] - If true, the slider is disabled.
 */
interface SliderInputProps {
  label: string;
  id: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

/**
 * @component SliderInput
 * @description A reusable range slider input component with a label displaying the current value.
 * It is designed for accessibility, with proper label association and ARIA attributes.
 *
 * @param {SliderInputProps} props - The props for the SliderInput component.
 * @returns {React.ReactElement} The rendered slider input element.
 */
const SliderInput: React.FC<SliderInputProps> = ({
  label,
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  disabled = false,
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}: <span className="font-semibold text-sky-400">{value}{unit}</span>
      </label>
      <input
        type="range"
        id={id}
        name={id} // Good practice to include name, often same as id
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        aria-valuetext={`${value}${unit}`} // Provides textual representation of the value for screen readers
      />
    </div>
  );
};

export default SliderInput;
