
import React from 'react';

interface SandboxEventLogProps {
  events: string[];
}

const SandboxEventLog: React.FC<SandboxEventLogProps> = ({ events }) => {
  return (
    <div className="p-3 bg-slate-700/50 rounded-md shadow h-64 overflow-y-auto">
      <h3 className="text-lg font-medium text-slate-200 mb-2 sticky top-0 bg-slate-700/50 py-1">Event Log</h3>
      {events.length === 0 && <p className="text-sm text-slate-400">No events yet.</p>}
      <ul className="space-y-1 text-xs">
        {events.map((event, index) => (
          <li key={index} className="text-slate-300 border-b border-slate-600/50 pb-0.5">
            {event}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SandboxEventLog;
