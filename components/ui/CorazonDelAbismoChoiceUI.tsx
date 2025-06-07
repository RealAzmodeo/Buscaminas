
import React from 'react';
import { Echo, Rarity } from '../../types';
import Button from '../common/Button';
import { playMidiSoundPlaceholder } from '../../utils/soundUtils';

/**
 * @interface EchoDisplayCardProps
 * @description Props for the EchoDisplayCard component used within CorazonDelAbismoChoiceUI.
 * @property {Echo} echo - The Echo to display.
 * @property {() => void} onSelect - Callback function when this card is selected.
 * @property {'epic' | 'duplicate'} type - The type of choice this card represents (new epic or duplicate).
 */
interface EchoDisplayCardProps {
  echo: Echo;
  onSelect: () => void;
  type: 'epic' | 'duplicate';
}

/**
 * @component EchoDisplayCard
 * @description Renders a card for a single Echo choice in the Corazón del Abismo UI.
 * Each card is made accessible with ARIA roles and labels.
 */
const EchoDisplayCard: React.FC<EchoDisplayCardProps> = ({ echo, onSelect, type }) => {
  const rarityStylesMap: Record<Rarity, string> = {
    [Rarity.Common]: 'border-slate-500 text-slate-300',
    [Rarity.Rare]: 'border-sky-500 text-sky-400',
    [Rarity.Epic]: 'border-purple-500 text-purple-400',
    [Rarity.Legendary]: 'border-amber-500 text-amber-400',
  };
  const rarityStyles = rarityStylesMap[echo.rarity] || rarityStylesMap[Rarity.Common];
  const descriptionHtml = { __html: echo.description };
  const actionText = type === 'epic' ? "Obtener Eco Épico" : `Potenciar Eco (x${(echo.effectivenessMultiplier || 1) + 1})`;
  const ariaLabel = `Elegir opción: ${actionText}. Detalles del Eco: ${echo.name}${echo.level > 1 ? ` (Nivel ${echo.level})` : ''}. ${echo.description.replace(/<strong>|<\/strong>/g, '')}`;

  return (
    <div
      className={`p-3 border-2 rounded-lg shadow-lg flex flex-col justify-between min-h-[200px] bg-slate-700 hover:bg-slate-600 transition-colors cursor-pointer ${rarityStyles}`}
      role="button" // Makes it keyboard accessible and understandable as interactive
      tabIndex={0} // Allows focus
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()} // Keyboard activation
      aria-label={ariaLabel}
    >
      <div>
        <div className="flex justify-between items-start mb-1">
          <h5 className={`text-md font-bold ${rarityStyles}`}>
            {echo.name}
            {echo.level > 1 && <span className="text-xs font-normal text-slate-400"> (Nv. {echo.level})</span>}
          </h5>
          <span className="text-2xl ml-2" aria-hidden="true">{echo.icon}</span>
        </div>
        <p className="text-xs text-slate-300 my-1 leading-tight" dangerouslySetInnerHTML={descriptionHtml} />
      </div>
      <Button onClick={onSelect} variant="primary" size="sm" className="w-full mt-2 text-xs" tabIndex={-1}> {/* Button is secondary to div's role */}
        {actionText}
      </Button>
    </div>
  );
};


/**
 * @interface CorazonDelAbismoChoiceUIProps
 * @description Props for the CorazonDelAbismoChoiceUI component.
 * @property {Echo | null} randomEpicEcho - A randomly selected Epic Echo option.
 * @property {Echo[]} duplicableActiveEcos - List of active Common/Rare Echos that can be duplicated.
 * @property {(type: 'epic' | 'duplicate', chosenEchoId?: string) => void} onChoice - Callback when a choice is made.
 * @property {number} playerGold - Current player gold (for display, though not used for cost here).
 */
interface CorazonDelAbismoChoiceUIProps {
  randomEpicEcho: Echo | null;
  duplicableActiveEcos: Echo[];
  onChoice: (type: 'epic' | 'duplicate', chosenEchoId?: string) => void;
  playerGold: number;
}

/**
 * @component CorazonDelAbismoChoiceUI
 * @description UI for the "Corazón del Abismo" Echo, allowing the player to choose between
 * obtaining a random Epic Echo or duplicating an existing Common/Rare Echo.
 * Presented as a modal dialog for accessibility.
 */
const CorazonDelAbismoChoiceUI: React.FC<CorazonDelAbismoChoiceUIProps> = ({
  randomEpicEcho,
  duplicableActiveEcos,
  onChoice,
  playerGold,
}) => {

  const handleEpicChoice = () => {
    if (randomEpicEcho) {
      playMidiSoundPlaceholder('corazon_choice_epic');
      onChoice('epic', randomEpicEcho.id);
    }
  };

  const handleDuplicateChoice = (echoId: string) => {
    playMidiSoundPlaceholder('corazon_choice_duplicate');
    onChoice('duplicate', echoId);
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl fixed inset-0 m-auto h-fit max-h-[90vh] overflow-y-auto z-[60]" // Ensure z-index is high enough
      role="dialog" // ARIA role for dialog
      aria-modal="true" // Indicates it's a modal dialog, trapping focus
      aria-labelledby="corazon-title" // Title for the dialog
      aria-describedby="corazon-description" // Description for the dialog
    >
      <h2 id="corazon-title" className="text-2xl sm:text-3xl font-bold text-center text-amber-400 mb-2">Corazón del Abismo</h2>
      <p id="corazon-description" className="text-center text-slate-300 mb-4 text-sm">Has sacrificado parte de tu esencia. Elige tu recompensa:</p>
      <p className="text-center text-yellow-400 mb-4 text-md">Oro Actual: <span className="text-xl" aria-hidden="true">💰</span>{playerGold}</p>

      <div className="space-y-6">
        {randomEpicEcho && (
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2 text-center">Opción 1: Abrazar lo Desconocido</h3>
            <EchoDisplayCard echo={randomEpicEcho} onSelect={handleEpicChoice} type="epic" />
          </div>
        )}
        {!randomEpicEcho && randomEpicEcho !== undefined && (
            <p className="text-center text-slate-400 py-4">No hay Ecos Épicos nuevos disponibles para esta opción.</p>
        )}

        {duplicableActiveEcos.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-sky-400 mb-3 text-center">Opción 2: Amplificar lo Conocido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {duplicableActiveEcos.map(echo => (
                <EchoDisplayCard
                  key={echo.id}
                  echo={echo}
                  onSelect={() => handleDuplicateChoice(echo.id)}
                  type="duplicate"
                />
              ))}
            </div>
          </div>
        )}
         {duplicableActiveEcos.length === 0 && (
            <p className="text-center text-slate-400 py-4">No tienes Ecos Comunes o Raros activos que puedan ser potenciados.</p>
        )}
      </div>
       <p className="text-xs text-slate-500 mt-6 text-center">La elección es irrevocable. El Abismo espera.</p>
    </div>
  );
};

export default CorazonDelAbismoChoiceUI;
