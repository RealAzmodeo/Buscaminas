
import React from 'react';
import Button from '../../common/Button'; // Assuming a common Button component is used

/**
 * @interface GuidingTextProps
 * @description Props for the GuidingText component.
 * @property {string} message - The HTML string message to display. It's rendered using `dangerouslySetInnerHTML`.
 * @property {() => void} [onContinue] - Optional callback function for when the "Continue" button is clicked. If provided, a button is rendered.
 */
interface GuidingTextProps {
  message: string;
  onContinue?: () => void;
}

/**
 * @component GuidingText
 * @description Displays guiding text or FTUE (First Time User Experience) messages to the player.
 * These messages appear as an overlay, typically at the bottom of the screen.
 * If an `onContinue` callback is provided, a "Continue" button is rendered, and the component
 * behaves more like a modal dialog for accessibility purposes. Otherwise, it acts as a status announcement.
 *
 * @param {GuidingTextProps} props - The props for the GuidingText component.
 * @returns {React.ReactElement | null} The rendered guiding text overlay, or null if no message is provided.
 */
const GuidingText: React.FC<GuidingTextProps> = ({ message, onContinue }) => {
  if (!message) {
    return null; // Don't render if there's no message
  }

  // Unique IDs for ARIA labelling, if needed more specifically
  const messageId = `guiding-text-message-${React.useId()}`;
  const containerId = `guiding-text-container-${React.useId()}`;

  return (
    <div
      id={containerId}
      className="ftue-guiding-text-overlay" // Styling defined in index.html
      // ARIA roles and properties for accessibility:
      // If onContinue is present, it's an interactive dialog.
      // Otherwise, it's a status announcement.
      role={onContinue ? "dialog" : "status"}
      aria-modal={onContinue ? "true" : undefined} // Modal only if interactive
      aria-live={!onContinue ? "polite" : undefined} // Announce politely if not interactive
      aria-atomic="true" // Ensure the entire content is announced on change
      aria-labelledby={onContinue ? containerId : undefined} // Title the dialog by itself if it's a dialog
      aria-describedby={messageId} // The message content describes the dialog/status
    >
      <p
        id={messageId}
        dangerouslySetInnerHTML={{ __html: message }}
        className="text-sm leading-relaxed"
      />
      {onContinue && (
        <Button
          onClick={onContinue}
          variant="primary"
          size="sm"
          className="mt-3 px-5 py-1.5" // Adjusted padding for better look
          aria-label="Continuar con el tutorial o mensaje"
        >
          Continuar
        </Button>
      )}
    </div>
  );
};

export default GuidingText;
