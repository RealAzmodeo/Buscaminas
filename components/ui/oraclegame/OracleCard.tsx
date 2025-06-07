
import React, { useEffect, useState, useRef } from 'react';
import { FuryAbility, Rarity } from '../../../types';
import { playMidiSoundPlaceholder } from '../../../utils/soundUtils';

/**
 * @interface OracleCardProps
 * @description Props for the OracleCard component.
 * @property {FuryAbility | null} ability - The Fury ability to display on the card. Null if no ability (e.g., placeholder).
 * @property {boolean} isFaceUp - Whether the card is currently face up (showing ability) or face down (showing '?').
 * @property {() => void} [onClick] - Callback function when the card is clicked (only if `isSelectable` is true).
 * @property {boolean} [isSelectable=false] - If true, the card is interactive and can be clicked/selected by the player.
 * @property {number} [appearanceDelay=0] - Delay in milliseconds before the card starts its appearance animation.
 *                                         A negative value means the card appears immediately without animation delay.
 * @property {boolean} [isSelectedForAnimation=false] - If true, applies a special animation for when the card is selected by the player.
 * @property {React.CSSProperties} [inlineCardStyle] - Optional inline styles for the card's outer div, primarily used for positioning within the `OracleGameUI`.
 */
interface OracleCardProps {
  ability: FuryAbility | null;
  isFaceUp: boolean;
  onClick?: () => void;
  isSelectable?: boolean;
  appearanceDelay?: number;
  isSelectedForAnimation?: boolean;
  inlineCardStyle?: React.CSSProperties;
}

/**
 * Helper function to get Tailwind CSS classes based on Fury ability rarity.
 * @param {Rarity} [rarity] - The rarity of the Fury ability.
 * @returns Object containing CSS classes for border, name color, background, and focus ring.
 */
const getRarityStyles = (rarity?: Rarity): { borderClass: string; nameColorClass: string; backgroundClass?: string; focusRingClass?: string; } => {
  if (!rarity) return { borderClass: 'border-slate-600', nameColorClass: 'text-sky-300', focusRingClass: 'focus-visible:ring-slate-500' };
  switch (rarity) {
    case Rarity.Common:
      return { borderClass: 'border-slate-500', nameColorClass: 'text-slate-300', backgroundClass: 'bg-slate-700', focusRingClass: 'focus-visible:ring-slate-500' };
    case Rarity.Rare:
      return { borderClass: 'border-sky-500', nameColorClass: 'text-sky-400', backgroundClass: 'bg-sky-900/50', focusRingClass: 'focus-visible:ring-sky-500' };
    case Rarity.Epic:
      return { borderClass: 'border-purple-500', nameColorClass: 'text-purple-400', backgroundClass: 'bg-purple-900/50', focusRingClass: 'focus-visible:ring-purple-500' };
    case Rarity.Legendary:
      return { borderClass: 'border-amber-500', nameColorClass: 'text-amber-400', backgroundClass: 'bg-amber-900/50', focusRingClass: 'focus-visible:ring-amber-500' };
    default: // Should not be reached with TypeScript if Rarity enum is exhaustive
      return { borderClass: 'border-slate-600', nameColorClass: 'text-sky-300', focusRingClass: 'focus-visible:ring-slate-500' };
  }
};

/**
 * @component OracleCard
 * @description Represents a single card in the Oracle Minigame, displaying a Fury ability.
 * Handles its appearance animation, flipping between face-up and face-down states,
 * and interaction when selectable. Provides ARIA attributes for accessibility.
 */
const OracleCard: React.FC<OracleCardProps> = ({
  ability,
  isFaceUp,
  onClick,
  isSelectable = false,
  appearanceDelay = 0, // Default to 0ms delay
  isSelectedForAnimation = false,
  inlineCardStyle,
}) => {
  // State to track if the initial appearance delay has passed and animation should start/has started
  const [hasCardPassedInitialDelay, setHasCardPassedInitialDelay] = useState(appearanceDelay < 0);
  // State to control the 'is-appearing' class for the CSS animation
  const [isAnimatingAppearVisuals, setIsAnimatingAppearVisuals] = useState(false);

  const rarityStyles = getRarityStyles(ability?.rarity);
  const appearanceTimerRef = useRef<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  /**
   * Effect to handle the appearance delay and triggering of the appearance animation.
   * Also plays a sound for rare, epic, or legendary cards when they appear.
   */
  useEffect(() => {
    const triggerAppearance = () => {
      setHasCardPassedInitialDelay(true); // Mark that delay has passed
      setIsAnimatingAppearVisuals(true);  // Trigger the CSS animation class

      // Set a timer to remove the animation class after its duration
      animationTimerRef.current = window.setTimeout(() => {
        setIsAnimatingAppearVisuals(false);
      }, 500); // Duration should match 'oracle-card-appear-effect' in CSS

      // Play sound for higher rarity cards on appearance
      if (ability && (ability.rarity === Rarity.Epic || ability.rarity === Rarity.Legendary || ability.rarity === Rarity.Rare)) {
        playMidiSoundPlaceholder(`fury_reveal_${ability.rarity.toLowerCase()}_${ability.id}`);
      }
    };

    if (!hasCardPassedInitialDelay && appearanceDelay >= 0) {
      // If delay is non-negative and hasn't passed, set a timer
      appearanceTimerRef.current = window.setTimeout(triggerAppearance, appearanceDelay);
    } else if (!hasCardPassedInitialDelay && appearanceDelay < 0) {
      // If delay is negative, trigger appearance immediately
      triggerAppearance();
    }

    // Cleanup function to clear timeouts if the component unmounts or dependencies change
    return () => {
      if (appearanceTimerRef.current) clearTimeout(appearanceTimerRef.current);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, [appearanceDelay, hasCardPassedInitialDelay, ability]); // Re-run if these change

  // Construct CSS classes for the card
  const cardBaseClasses = [
    'oracle-card', // Base class for styling
    rarityStyles.borderClass, // Rarity-specific border
    isAnimatingAppearVisuals ? 'is-appearing' : '', // For appearance animation
    isSelectable ? `is-selectable ${rarityStyles.focusRingClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900` : '', // Styles for selectable cards
    isSelectedForAnimation ? 'is-selected-animation' : '', // Animation when player selects this card
  ].filter(Boolean).join(' '); // Filter out empty strings and join

  // Base inline styles for card transformation (flip) and opacity (initial appearance)
  const baseStyle: React.CSSProperties = {
    transform: isFaceUp ? 'rotateY(0deg)' : 'rotateY(-180deg)', // Flip animation
    opacity: hasCardPassedInitialDelay ? 1 : 0, // Card is invisible until delay passes
  };

  // Combine base styles with any passed inline styles (e.g., for positioning)
  const finalCardStyle: React.CSSProperties = {
      ...baseStyle,
      ...inlineCardStyle, // For absolute positioning from parent
  };

  const handleCardClick = () => {
    if (isSelectable && onClick) {
      onClick(); // Call provided onClick handler if card is selectable
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isSelectable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); // Prevent default spacebar scroll
      handleCardClick(); // Allow selection with Enter or Space
    }
  };

  const descriptionHtml = ability ? { __html: ability.description } : { __html: '' };
  // ARIA label for accessibility
  const ariaLabel = isSelectable && ability
    ? `Elegir habilidad de Furia: ${ability.name}. Rareza: ${ability.rarity}. Efecto: ${ability.description.replace(/<strong>|<\/strong>/g, '')}`
    : (ability ? `Habilidad de Furia: ${ability.name}. Rareza: ${ability.rarity}. Efecto: ${ability.description.replace(/<strong>|<\/strong>/g, '')}` : "Carta de Oráculo (oculta)");

  return (
    <div
      className={cardBaseClasses}
      style={finalCardStyle}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={isSelectable ? "button" : "img"} // ARIA role: button if interactive, img if just display
      tabIndex={isSelectable ? 0 : -1} // Makes it focusable only if selectable
      aria-label={ariaLabel}
      aria-pressed={isSelectable ? isSelectedForAnimation : undefined} // Indicates if a selectable card is "pressed" (chosen)
      onMouseEnter={() => { if(isSelectable && ability) { playMidiSoundPlaceholder(`fury_card_hover_${ability.id}`); } }}
    >
      {/* Card faces: Front shows ability details, Back shows '?' */}
      <>
        <div className={`oracle-card-face oracle-card-front ${rarityStyles.backgroundClass || 'bg-slate-700/80'}`}>
          {ability ? (
            <>
              <div className="text-3xl sm:text-4xl mb-2 mt-1" aria-hidden="true">{ability.icon}</div>
              <h4 className={`text-sm sm:text-md font-bold mb-1 ${rarityStyles.nameColorClass} leading-tight`}>{ability.name}</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-snug px-1" dangerouslySetInnerHTML={descriptionHtml}></p>
              <div className={`text-[10px] absolute bottom-1 right-1 ${rarityStyles.nameColorClass} opacity-80`}>{ability.rarity}</div>
            </>
          ) : (
            // Placeholder if no ability (should not happen if card is meant to display something)
            <span className="oracle-card-back-content text-5xl opacity-50" aria-hidden="true">?</span>
          )}
        </div>
        <div className="oracle-card-face oracle-card-back">
          <span className="oracle-card-back-content text-5xl" aria-hidden="true">?</span>
        </div>
      </>
    </div>
  );
};

export default React.memo(OracleCard); // Memoize for performance if props don't change often
