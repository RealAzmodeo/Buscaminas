
import React, {useState} from 'react';
import Button from '../common/Button';

interface SandboxDebugToolsProps {
  onAdjustPlayerHp: (amount: number) => void;
  onAdjustEnemyHp: (amount: number) => void;
  onAddPlayerGold: (amount: number) => void;
  onSetEnemyFury: (amount: number) => void;
  maxEnemyFury: number;
  onAdjustEnemyArmor: (amount: number) => void; // Added for armor
}

const DebugToolRow: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex items-center justify-between py-1">
        <span className="text-sm text-slate-300 mr-2">{label}:</span>
        <div className="flex space-x-1">{children}</div>
    </div>
);

const SandboxDebugTools: React.FC<SandboxDebugToolsProps> = ({
  onAdjustPlayerHp,
  onAdjustEnemyHp,
  onAddPlayerGold,
  onSetEnemyFury,
  maxEnemyFury,
  onAdjustEnemyArmor, // Added for armor
}) => {
  const [furyValue, setFuryValue] = useState(0);

  return (
    <div className="p-3 bg-slate-700 rounded-md shadow space-y-2">
      <h3 className="text-lg font-medium text-slate-200 mb-2">Debug Tools</h3>
      
      <DebugToolRow label="Player HP">
        <Button onClick={() => onAdjustPlayerHp(-1)} size="sm" variant="secondary">-1</Button>
        <Button onClick={() => onAdjustPlayerHp(1)} size="sm" variant="secondary">+1</Button>
        <Button onClick={() => onAdjustPlayerHp(-5)} size="sm" variant="secondary">-5</Button>
        <Button onClick={() => onAdjustPlayerHp(5)} size="sm" variant="secondary">+5</Button>
      </DebugToolRow>

      <DebugToolRow label="Enemy HP">
        <Button onClick={() => onAdjustEnemyHp(-1)} size="sm" variant="secondary">-1</Button>
        <Button onClick={() => onAdjustEnemyHp(1)} size="sm" variant="secondary">+1</Button>
        <Button onClick={() => onAdjustEnemyHp(-5)} size="sm" variant="secondary">-5</Button>
        <Button onClick={() => onAdjustEnemyHp(5)} size="sm" variant="secondary">+5</Button>
      </DebugToolRow>

      <DebugToolRow label="Enemy Armor">
        <Button onClick={() => onAdjustEnemyArmor(-1)} size="sm" variant="secondary">-1</Button>
        <Button onClick={() => onAdjustEnemyArmor(1)} size="sm" variant="secondary">+1</Button>
        <Button onClick={() => onAdjustEnemyArmor(-5)} size="sm" variant="secondary">-5</Button>
        <Button onClick={() => onAdjustEnemyArmor(5)} size="sm" variant="secondary">+5</Button>
      </DebugToolRow>

      <DebugToolRow label="Player Gold">
        <Button onClick={() => onAddPlayerGold(1)} size="sm" variant="secondary">+1</Button>
        <Button onClick={() => onAddPlayerGold(5)} size="sm" variant="secondary">+5</Button>
        <Button onClick={() => onAddPlayerGold(10)} size="sm" variant="secondary">+10</Button>
      </DebugToolRow>
      
      <div className="py-1">
        <label htmlFor="enemyFurySet" className="block text-sm font-medium text-slate-300 mb-1">Set Enemy Fury:</label>
        <div className="flex items-center space-x-2">
            <input 
                type="number" 
                id="enemyFurySet"
                value={furyValue}
                onChange={(e) => setFuryValue(Math.max(0, Math.min(maxEnemyFury, parseInt(e.target.value,10))))}
                className="w-20 px-2 py-1 bg-slate-600 border border-slate-500 rounded-md text-sm"
                min="0"
                max={maxEnemyFury}
            />
            <Button onClick={() => onSetEnemyFury(furyValue)} size="sm" variant="primary">Set</Button>
            <Button onClick={() => onSetEnemyFury(0)} size="sm" variant="secondary">Min</Button>
            <Button onClick={() => onSetEnemyFury(maxEnemyFury)} size="sm" variant="secondary">Max</Button>
        </div>
      </div>

    </div>
  );
};

export default SandboxDebugTools;
