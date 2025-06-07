
import React from 'react';
import { SandboxConfig, ItemLockConfig, EnemyArchetypeId } from '../../types'; 
import Button from '../common/Button';
import SliderInput from '../common/SliderInput';
import ToggleSwitch from '../common/ToggleSwitch'; 
import { ENEMY_ARCHETYPE_DEFINITIONS } from '../../constants/difficultyConstants';

const LockIcon: React.FC<{ locked: boolean }> = ({ locked }) => (
  <span className={`ml-2 text-xs ${locked ? 'text-sky-400' : 'text-slate-500'}`}>
    {locked ? '🔒' : '🔓'}
  </span>
);

interface SandboxConfigPanelProps {
  config: SandboxConfig;
  onConfigChange: (newConfig: SandboxConfig) => void;
  onStartSimulation: () => void;
  isSimulationRunning: boolean;
}

const LabelInputText: React.FC<{label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = 
  ({ label, id, value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}:</label>
    <input
      type="text"
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
    />
  </div>
);

type BoardItemKey = 'attacks' | 'gold' | 'clues'; // Changed from bombs/swords

const SandboxConfigPanel: React.FC<SandboxConfigPanelProps> = ({ config, onConfigChange, onStartSimulation, isSimulationRunning }) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const [category, field] = name.split('.');
    
    let processedValue: string | number | EnemyArchetypeId = value;
    if (type === 'range' || type === 'number') {
        processedValue = parseInt(value,10);
        if (isNaN(processedValue as number)) processedValue = 0;
    }
    if (name === 'enemy.archetypeId') { 
        processedValue = value as EnemyArchetypeId;
    }


    const newConfig = { ...config };
    (newConfig as any)[category] = { ...(config as any)[category], [field]: processedValue };

    if (category === 'board' && ['rows', 'cols', 'attacks', 'gold', 'clues'].includes(field)) { // attacks instead of bombs/swords
      adjustBoardItems(newConfig, field as BoardItemKey, processedValue as number);
    } else {
      onConfigChange(newConfig);
    }
  };

  const adjustBoardItems = (currentConfig: SandboxConfig, changedItemKey: BoardItemKey, newValue: number) => {
    let newBoardConfig = { ...currentConfig.board };
    const { itemLocks, lockItemRatios } = currentConfig;
    const totalCells = newBoardConfig.rows * newBoardConfig.cols;

    newBoardConfig[changedItemKey] = Math.max(0, Math.min(newValue, totalCells));

    const items: BoardItemKey[] = ['attacks', 'gold', 'clues']; // attacks instead of bombs/swords
    
    if (lockItemRatios) {
      const initialValues = { ...currentConfig.board }; 
      const delta = newBoardConfig[changedItemKey] - initialValues[changedItemKey];

      if (delta !== 0) {
        const unlockedItems = items.filter(key => key !== changedItemKey && !(itemLocks as any)[`${key}Locked`]);
        let totalInitialUnlockedValue = unlockedItems.reduce((sum, key) => sum + initialValues[key], 0);

        if (totalInitialUnlockedValue > 0) {
          for (const itemKey of unlockedItems) {
            const proportion = initialValues[itemKey] / totalInitialUnlockedValue;
            let changeAmount = Math.round(delta * proportion * -1); 
            newBoardConfig[itemKey] = Math.max(0, newBoardConfig[itemKey] + changeAmount);
          }
        }
      }
    }

    let currentSum = items.reduce((sum, key) => sum + newBoardConfig[key], 0);
    let difference = totalCells - currentSum;
    
    const adjustableItemsOrder: BoardItemKey[] = ['clues', 'gold', 'attacks']; // Adjusted order
    for (const itemKey of adjustableItemsOrder) {
        if (!(itemLocks as any)[`${itemKey}Locked`]) {
            newBoardConfig[itemKey] = Math.max(0, newBoardConfig[itemKey] + difference);
            currentSum = items.reduce((sum, key) => sum + newBoardConfig[key], 0);
            difference = totalCells - currentSum;
            if (difference === 0) break;
        }
    }
    
    items.forEach(key => {
        newBoardConfig[key] = Math.max(0, Math.min(newBoardConfig[key], totalCells));
    });
    currentSum = items.reduce((sum, key) => sum + newBoardConfig[key], 0);
    if (currentSum !== totalCells) {
        for (const itemKey of adjustableItemsOrder) {
            if (!(itemLocks as any)[`${itemKey}Locked`]) {
                newBoardConfig[itemKey] = Math.max(0, newBoardConfig[itemKey] + (totalCells - currentSum));
                break;
            }
        }
    }

    onConfigChange({ ...currentConfig, board: newBoardConfig });
  };


  const handleItemLockToggle = (itemKey: BoardItemKey) => {
    const lockKey = `${itemKey}Locked` as keyof ItemLockConfig;
    onConfigChange({
      ...config,
      itemLocks: {
        ...config.itemLocks,
        [lockKey]: !config.itemLocks[lockKey],
      },
    });
  };

  const handleMasterRatioLockToggle = (checked: boolean) => {
    onConfigChange({ ...config, lockItemRatios: checked });
  };

  const totalCells = config.board.rows * config.board.cols;
  const currentTotalItems = config.board.attacks + config.board.gold + config.board.clues; // Updated sum

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-sky-300">Configuration</h2>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200">Player</h3>
        <SliderInput label="Max HP" id="player.maxHp" value={config.player.maxHp} onChange={handleInputChange} min={1} max={100} />
        <SliderInput label="Current HP" id="player.hp" value={config.player.hp} onChange={handleInputChange} min={1} max={config.player.maxHp} />
        <SliderInput label="Gold" id="player.gold" value={config.player.gold} onChange={handleInputChange} min={0} max={999} />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200">Enemy</h3>
        <LabelInputText label="Name" id="enemy.name" value={config.enemy.name} onChange={handleInputChange} />
        <div>
          <label htmlFor="enemy.archetypeId" className="block text-sm font-medium text-slate-300 mb-1">Archetype:</label>
          <select
            id="enemy.archetypeId"
            name="enemy.archetypeId"
            value={config.enemy.archetypeId || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
          >
            <option value="" disabled>Select Archetype</option>
            {Object.values(EnemyArchetypeId).map(archId => (
              <option key={archId} value={archId}>
                {ENEMY_ARCHETYPE_DEFINITIONS[archId]?.name || archId}
              </option>
            ))}
          </select>
        </div>
        <SliderInput label="Max HP" id="enemy.maxHp" value={config.enemy.maxHp} onChange={handleInputChange} min={1} max={500} />
        <SliderInput label="Current HP" id="enemy.hp" value={config.enemy.hp} onChange={handleInputChange} min={0} max={config.enemy.maxHp} />
        <SliderInput label="Armor" id="enemy.armor" value={config.enemy.armor} onChange={handleInputChange} min={0} max={100} />
        <SliderInput label="Max Fury" id="enemy.maxFury" value={config.enemy.maxFury} onChange={handleInputChange} min={1} max={100} />
        <SliderInput label="Current Fury" id="enemy.fury" value={config.enemy.fury} onChange={handleInputChange} min={0} max={config.enemy.maxFury} />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200">Board</h3>
        <SliderInput label="Rows" id="board.rows" value={config.board.rows} onChange={handleInputChange} min={4} max={20} />
        <SliderInput label="Columns" id="board.cols" value={config.board.cols} onChange={handleInputChange} min={4} max={20} />
        
        <div className="p-3 bg-slate-700/50 rounded-md space-y-3">
            <ToggleSwitch
                id="board.masterRatioLock"
                label="Lock Item Ratios"
                checked={config.lockItemRatios}
                onChange={handleMasterRatioLockToggle}
            />
            {config.lockItemRatios && <p className="text-xs text-sky-300 italic">Unlocked items will adjust proportionally.</p>}
            
            {(['attacks', 'gold', 'clues'] as BoardItemKey[]).map(itemKey => { // 'attacks' instead of 'bombs', 'swords'
              const itemValue = config.board[itemKey];
              const itemLocked = config.itemLocks[`${itemKey}Locked` as keyof ItemLockConfig];
              return (
                <div key={itemKey} className="flex items-center space-x-2">
                  <div className="flex-grow">
                    <SliderInput 
                        label={itemKey.charAt(0).toUpperCase() + itemKey.slice(1)}
                        id={`board.${itemKey}`}
                        value={itemValue}
                        onChange={handleInputChange}
                        min={0}
                        max={totalCells} 
                        disabled={itemLocked && config.lockItemRatios} 
                    />
                  </div>
                  <button 
                    onClick={() => handleItemLockToggle(itemKey)} 
                    className="p-1.5 rounded hover:bg-slate-600"
                    title={itemLocked ? `Unlock ${itemKey}` : `Lock ${itemKey}`}
                    aria-pressed={itemLocked}
                  >
                    <LockIcon locked={itemLocked} />
                  </button>
                </div>
              );
            })}

            <div className="text-xs text-slate-400 pt-1">
                <p>Total Items on Board: <span className="font-bold">{currentTotalItems}</span> / {totalCells}</p>
                {currentTotalItems !== totalCells && <p className="text-red-400">Warning: Item sum ({currentTotalItems}) doesn't match total cells ({totalCells}). Adjusting...</p>}
            </div>
        </div>
      </section>
      
      <Button onClick={onStartSimulation} variant="primary" className="w-full mt-6">
        {isSimulationRunning ? "Apply Config & Restart" : "Start Simulation"}
      </Button>
    </div>
  );
};

export default SandboxConfigPanel;
