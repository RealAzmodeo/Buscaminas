// hooks/useGameEvents.ts
import { useState, useRef, useCallback } from 'react';
import { GameEvent } from '../types'; // Assuming types.ts is in ../

export const useGameEvents = () => {
  const [eventQueue, setEventQueue] = useState<GameEvent[]>([]);
  const eventIdCounter = useRef<number>(0);

  const addGameEvent = useCallback((type: string, payload?: any, delayMs: number = 0) => {
    console.log(`Adding event: ${type}`, payload);
    const newEvent: GameEvent = {
      id: eventIdCounter.current++,
      type,
      payload,
      timestamp: Date.now(),
      delayMs,
      processed: false,
    };
    setEventQueue(prevQueue => [...prevQueue, newEvent]);
  }, []);

  const popEvent = useCallback((): GameEvent | undefined => {
    let eventToProcess: GameEvent | undefined = undefined;
    setEventQueue(prevQueue => {
      const readyEvents = prevQueue.filter(event => !event.processed && Date.now() >= event.timestamp + (event.delayMs || 0));
      if (readyEvents.length === 0) return prevQueue;

      // Simple FIFO for now, could be prioritized later
      eventToProcess = readyEvents[0];
      eventToProcess.processed = true; // Mark as processed conceptually, actual removal or marking happens below

      // Return new queue without the processed event (or mark as processed)
      // For simplicity, let's filter it out. A more robust system might mark and batch update.
      return prevQueue.filter(event => event.id !== eventToProcess!.id);
    });
    return eventToProcess;
  }, []);

  // Function to mark an event as processed (if not removing immediately)
  // const markEventProcessed = useCallback((eventId: number) => {
  //   setEventQueue(prevQueue =>
  //     prevQueue.map(event =>
  //       event.id === eventId ? { ...event, processed: true } : event
  //     )
  //   );
  // }, []);

  return {
    eventQueue,
    // setEventQueue, // Usually not exposed directly if add/pop are sufficient
    addGameEvent,
    popEvent,
    // markEventProcessed, // If needed
  };
};
