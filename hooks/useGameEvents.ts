import { useRef, useCallback } from 'react';
import { GameEvent, FloatingTextEventPayload, GameStateCore } from '../types';

export interface UseGameEventsReturn {
  addGameEvent: (payload: FloatingTextEventPayload | any, type?: GameEvent['type']) => void;
  popEvent: () => GameEvent | undefined;
  // eventIdCounter is internal to this hook now
}

interface GameEventsProps {
  // More specific setter focusing only on the event queue part of GameStateCore
  setGameStateForEventQueue: React.Dispatch<React.SetStateAction<GameStateCore>>;
}

export const useGameEvents = ({ setGameStateForEventQueue }: GameEventsProps): UseGameEventsReturn => {
  const eventIdCounterRef = useRef(0);

  const addGameEvent = useCallback((payload: FloatingTextEventPayload | any, type: GameEvent['type'] = 'FLOATING_TEXT') => {
    const newEvent: GameEvent = { id: `event-${eventIdCounterRef.current++}`, type, payload };
    setGameStateForEventQueue(prev => ({ ...prev, eventQueue: [...prev.eventQueue, newEvent] }));
  }, [setGameStateForEventQueue]);

  const popEvent = useCallback((): GameEvent | undefined => {
    let eventToReturn: GameEvent | undefined = undefined;
    setGameStateForEventQueue(prev => {
      if (prev.eventQueue.length === 0) {
        eventToReturn = undefined;
        return prev;
      }
      eventToReturn = prev.eventQueue[0];
      return { ...prev, eventQueue: prev.eventQueue.slice(1) };
    });
    return eventToReturn;
  }, [setGameStateForEventQueue]);

  return {
    addGameEvent,
    popEvent,
  };
};
