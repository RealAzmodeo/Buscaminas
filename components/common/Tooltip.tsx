
import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * @interface TooltipProps
 * @description Props for the Tooltip component.
 * @property {React.ReactNode} content - The content to display inside the tooltip.
 * @property {React.ReactElement} children - The trigger element that the tooltip is associated with. Must accept a ref.
 * @property {'top' | 'bottom'} [position='top'] - Preferred position of the tooltip relative to the trigger.
 * @property {string} [className] - Optional additional CSS classes for the tooltip container.
 * @property {number} [delay=150] - Delay in milliseconds before the tooltip appears on hover/focus.
 */
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement; // Ensure children can accept a ref
  position?: 'top' | 'bottom';
  className?: string;
  delay?: number;
}

/**
 * @component Tooltip
 * @description A reusable tooltip component that appears on hover or focus of its child trigger element.
 * It handles dynamic positioning and provides accessibility features.
 *
 * @param {TooltipProps} props - The props for the Tooltip component.
 * @returns {React.ReactElement} The trigger element enhanced with tooltip functionality and the tooltip itself (when visible).
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  delay = 150 // Default show delay
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null); // Ref for the trigger element
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  /**
   * Calculates the optimal position for the tooltip based on the trigger element's
   * dimensions and the preferred position. Adjusts if the tooltip would go off-screen.
   */
  const calculatePosition = useCallback(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let top, left;

      // Calculate initial position based on preferred 'position' prop
      switch (position) {
        case 'bottom':
          top = triggerRect.bottom + window.scrollY + 8; // 8px gap
          left = triggerRect.left + window.scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'top':
        default:
          top = triggerRect.top + window.scrollY - tooltipRect.height - 8; // 8px gap
          left = triggerRect.left + window.scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
      }

      // Adjust if tooltip goes off-screen horizontally
      if (left < 5) left = 5; // Minimum 5px from left edge
      if (left + tooltipRect.width > window.innerWidth - 5) {
        left = window.innerWidth - tooltipRect.width - 5; // Minimum 5px from right edge
      }

      // Adjust if tooltip goes off-screen vertically (e.g., if 'top' position makes it go above viewport)
      if (top < 5 && position === 'top') { // If trying to position on top but not enough space
        top = triggerRect.bottom + window.scrollY + 8; // Switch to bottom
      } else if (top + tooltipRect.height > window.innerHeight - 5 && position === 'bottom') { // If bottom goes below
        top = triggerRect.top + window.scrollY - tooltipRect.height - 8; // Switch to top
      }


      setCoords({ top, left });
    }
  }, [position]); // Dependency: position prop

  /**
   * Shows the tooltip after a specified delay. Clears any pending hide action.
   */
  const showTooltip = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = null;

    showTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(true); // This will trigger the useEffect for calculatePosition
    }, delay);
  }, [delay]);

  /**
   * Hides the tooltip after a short delay (to allow mouse travel to tooltip if interactive).
   * Clears any pending show action.
   */
  const hideTooltip = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = null;

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 100); // Short delay before hiding
  }, []);

  /**
   * Effect to calculate tooltip position when it becomes visible and to handle
   * scroll/resize events to reposition the tooltip if needed.
   */
  useEffect(() => {
    if (isVisible) {
      // Calculate position as soon as isVisible is true and tooltipRef is available
      // (which happens because the tooltip div is now rendered)
      calculatePosition();

      const handleScrollResize = () => {
        if (isVisible) { // Recalculate only if currently visible
          calculatePosition();
        }
      };
      window.addEventListener('scroll', handleScrollResize, true); // Capture phase for immediate reaction
      window.addEventListener('resize', handleScrollResize);
      return () => {
        window.removeEventListener('scroll', handleScrollResize, true);
        window.removeEventListener('resize', handleScrollResize);
      };
    }
  }, [isVisible, calculatePosition]); // Rerun if isVisible or calculatePosition changes

  /**
   * Effect for cleaning up timeouts on component unmount.
   */
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);


  // Compose refs: combine internal triggerRef with any ref passed to the child
  const composedRef = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
    // If the child element (children) has its own ref, we need to honor it.
    const childRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
    if (typeof childRef === 'function') {
      childRef(node);
    } else if (childRef && typeof childRef === 'object' && 'current' in childRef) {
      (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, [children]);

  // Clone the child element to attach event handlers and the composed ref.
  const enhancedChild = React.cloneElement(children, {
    ...((typeof children.props === 'object' && children.props !== null) ? children.props : {}), // Spread existing props
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
    'aria-describedby': isVisible && coords ? 'custom-tooltip-id' : undefined, // Link tooltip via ARIA
    ref: composedRef, // Attach the composed ref
  } as any); // Using 'as any' to bypass complex type checking for cloneElement with generic children.
             // Assumes the child component can accept/forward these DOM event handlers.


  const tooltipId = 'custom-tooltip-id'; // Static ID is fine if only one tooltip can be described at a time for an element.

  return (
    <>
      {enhancedChild}
      {isVisible && ( // Render tooltip div only when isVisible is true
        <div
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip" // ARIA role for tooltip
          className={`custom-tooltip ${coords ? 'visible' : ''} ${className}`}
          style={
            coords
            ? { top: `${coords.top}px`, left: `${coords.left}px`, position: 'absolute' }
            // Position off-screen initially before coords are calculated to allow measurement
            : { position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }
          }
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip;
