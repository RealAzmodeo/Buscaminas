
import React, { useEffect, useRef } from 'react';
import { FloatingTextType } from '../../types';

/**
 * @interface FloatingTextItemProps
 * @description Props for the FloatingTextItem component.
 * @property {number} id - Unique identifier for the floating text item.
 * @property {string} text - The text content to display.
 * @property {FloatingTextType} type - The visual type/style of the text.
 * @property {number} [initialX] - Optional initial X coordinate for positioning relative to a target.
 * @property {number} [initialY] - Optional initial Y coordinate for positioning relative to a target.
 * @property {(id: number) => void} onRemove - Callback function to remove the item after its animation.
 */
interface FloatingTextItemProps {
  id: number;
  text: string;
  type: FloatingTextType;
  initialX?: number;
  initialY?: number;
  onRemove: (id: number) => void;
}

/**
 * @component FloatingTextItem
 * @description Renders a single piece of floating text that animates upwards and fades out.
 * Used for visual feedback like damage numbers, gold gains, etc.
 * It handles its own removal after the animation completes via the `onRemove` callback.
 * ARIA attributes are included to make these announcements available to assistive technologies.
 */
const FloatingTextItem: React.FC<FloatingTextItemProps> = ({
  id,
  text,
  type,
  initialX,
  initialY,
  onRemove
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  /**
   * Effect to handle the removal of the item after its CSS animation completes.
   * The animation ('float-up-fade') is defined in index.html.
   */
  useEffect(() => {
    const currentItem = itemRef.current; // Capture ref value
    if (!currentItem) return;

    const handleAnimationEnd = () => {
      onRemove(id);
    };

    currentItem.addEventListener('animationend', handleAnimationEnd);

    // Cleanup function to remove the event listener when the component unmounts
    // or before the effect re-runs if dependencies were to change.
    return () => {
      if (currentItem) { // Check if currentItem still exists on cleanup
        currentItem.removeEventListener('animationend', handleAnimationEnd);
      }
    };
  }, [id, onRemove]); // Dependencies for the effect

  // Mapping of FloatingTextType to corresponding CSS classes for styling
  const typeClasses: Record<FloatingTextType, string> = {
    'damage-player': 'ft-damage-player',
    'damage-enemy': 'ft-damage-enemy',
    'heal-player': 'ft-heal-player',
    'gold-player': 'ft-gold-player',
    'info': 'ft-info',
    'armor-gain': 'ft-armor-gain',
    'armor-break': 'ft-armor-break',
  };

  // Determine initial style for positioning
  const style: React.CSSProperties = {};
  if (initialX !== undefined && initialY !== undefined) {
    // Position based on provided coordinates (e.g., from a target element)
    style.left = `${initialX}px`;
    style.top = `${initialY}px`;
    // The 'float-up-fade' animation includes `translateX(-50%)` for horizontal centering relative to `initialX`.
  } else {
    // Fallback positioning if no coordinates provided (centers on screen)
    style.left = '50%';
    style.top = '50%';
    style.transform = 'translate(-50%, -50%)'; // Center horizontally and vertically
  }

  return (
    <div
      ref={itemRef}
      className={`floating-text-item ${typeClasses[type]}`}
      style={style}
      // ARIA attributes for accessibility:
      // aria-live="polite" indicates that screen readers should announce changes politely, without interrupting the user.
      // aria-atomic="true" ensures that the entire content of the live region is presented when it changes.
      aria-live="polite"
      aria-atomic="true"
    >
      {text}
    </div>
  );
};

export default FloatingTextItem;
