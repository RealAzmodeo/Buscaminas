
import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * @interface ButtonProps
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 * @description Props for the Button component.
 * @property {ReactNode} children - The content to be displayed inside the button.
 * @property {'primary' | 'secondary' | 'danger'} [variant='primary'] - The visual style of the button, affecting its color scheme.
 * @property {'sm' | 'md' | 'lg'} [size='md'] - The size of the button, affecting padding and text size.
 * @property {string} [className] - Optional additional CSS classes to apply to the button.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string; // Added className to props interface
}

/**
 * @component Button
 * @description A general-purpose, reusable button component with styling variants (primary, secondary, danger)
 * and sizes (sm, md, lg). It forwards refs to the underlying HTML button element and supports all
 * standard button attributes. Includes accessibility considerations like focus visibility and disabled states.
 *
 * @param {ButtonProps} props - The props for the Button component.
 * @param {React.Ref<HTMLButtonElement>} ref - Ref forwarded to the underlying button element.
 * @returns {React.ReactElement} The rendered button element.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', className, ...props }, ref) => {
    // Base styling applicable to all buttons
    const baseStyle = "font-semibold rounded-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

    // Variant-specific styling
    let variantStyle = "";
    switch (variant) {
      case 'primary':
        variantStyle = "bg-sky-600 hover:bg-sky-700 text-white focus-visible:ring-sky-500 disabled:bg-sky-700/50";
        break;
      case 'secondary':
        variantStyle = "bg-slate-600 hover:bg-slate-700 text-slate-100 focus-visible:ring-slate-500 disabled:bg-slate-700/50";
        break;
      case 'danger':
        variantStyle = "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500 disabled:bg-red-700/50";
        break;
      default: // Should not happen with TypeScript, but good for safety
        variantStyle = "bg-sky-600 hover:bg-sky-700 text-white focus-visible:ring-sky-500";
    }

    // Size-specific styling
    let sizeStyle = "";
    switch (size) {
      case 'sm':
        sizeStyle = "px-3 py-1.5 text-sm";
        break;
      case 'md':
        sizeStyle = "px-4 py-2 text-base";
        break;
      case 'lg':
        sizeStyle = "px-6 py-3 text-lg";
        break;
      default: // Should not happen
        sizeStyle = "px-4 py-2 text-base";
    }

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`}
        {...props} // Spread remaining props (like onClick, disabled, type, etc.)
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button'; // For better debugging in React DevTools

export default Button;
