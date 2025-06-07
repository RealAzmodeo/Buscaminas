
import React from 'react';
import { FloatingTextType } from '../../types';
import FloatingTextItem from './FloatingTextItem';

/**
 * @interface FloatingTextData
 * @description Data structure for managing individual floating text instances within the display.
 * This is used by the parent component (`App.tsx`) to manage the list of texts to be displayed.
 * @property {number} id - Unique identifier for the floating text.
 * @property {string} text - The content of the text.
 * @property {FloatingTextType} type - The visual type/style of the text.
 * @property {number} [initialX] - Optional initial X coordinate for positioning.
 * @property {number} [initialY] - Optional initial Y coordinate for positioning.
 */
interface FloatingTextData {
  id: number;
  text: string;
  type: FloatingTextType;
  initialX?: number;
  initialY?: number;
}

/**
 * @interface FloatingTextDisplayProps
 * @description Props for the FloatingTextDisplay component.
 * @property {FloatingTextData[]} texts - Array of floating text data objects to display.
 * @property {(id: number) => void} onRemove - Callback function to remove a text item after its animation.
 */
interface FloatingTextDisplayProps {
  texts: FloatingTextData[];
  onRemove: (id: number) => void;
}

/**
 * @component FloatingTextDisplay
 * @description A container component that manages and renders multiple `FloatingTextItem` instances.
 * It positions itself as a full-screen overlay to display floating text notifications
 * (like damage numbers, gold gains) across the game screen without interfering with user interaction.
 * The container itself is marked as decorative for accessibility, as individual items handle their announcements.
 */
const FloatingTextDisplay: React.FC<FloatingTextDisplayProps> = ({ texts, onRemove }) => {
  // If there are no texts to display, render nothing.
  if (!texts || texts.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed', // Ensures it overlays the entire viewport.
        top: 0,
        left: 0,
        width: '100vw', // Full viewport width.
        height: '100vh', // Full viewport height.
        pointerEvents: 'none', // Allows clicks and other pointer events to pass through to elements underneath.
        zIndex: 1000, // High z-index to appear on top of most UI elements.
        overflow: 'hidden', // Prevents scrollbars if text briefly goes off-screen during animation.
      }}
      // Accessibility:
      // aria-hidden="true" because the container itself is purely for layout and visual presentation.
      // Individual FloatingTextItem components handle their own ARIA announcements (e.g., aria-live).
      aria-hidden="true"
      // role="presentation" further indicates that this element is for visual presentation and has no semantic meaning.
      role="presentation"
    >
      {texts.map(textData => (
        <FloatingTextItem
          key={textData.id} // Essential for React's list rendering.
          id={textData.id}
          text={textData.text}
          type={textData.type}
          initialX={textData.initialX}
          initialY={textData.initialY}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default FloatingTextDisplay;
