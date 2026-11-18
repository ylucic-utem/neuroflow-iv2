import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { NoiseType } from '../types';
import type { TherapyNodeData, RampNodeData } from './FlowNodes';

interface NodeEditorPanelProps {
  nodeId: string;
  nodeType: 'therapyNode' | 'rampNode';
  data: TherapyNodeData | RampNodeData;
  onSave: (nodeId: string, newData: TherapyNodeData | RampNodeData) => void;
  onClose: () => void;
}

const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({ nodeId, nodeType, data, onSave, onClose }) => {
  const [editedData, setEditedData] = useState(data);

  const handleSave = () => {
    onSave(nodeId, editedData);
    onClose();
  };

  const noiseOptions = [
    NoiseType.None,
    NoiseType.White,
    NoiseType.Pink,
    NoiseType.Brown,
    NoiseType.Rain,
    NoiseType.Wind,
    NoiseType.Stream,
  ];

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-gray-800 border-l border-gray-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-bold">Edit Node Properties</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {nodeType === 'therapyNode' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={(editedData as TherapyNodeData).duration}
                onChange={(e) =>
                  setEditedData({ ...editedData, duration: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beat Frequency (Hz)
              </label>
              <input
                type="number"
                min="0.5"
                max="40"
                step="0.1"
                value={(editedData as TherapyNodeData).beat}
                onChange={(e) =>
                  setEditedData({ ...editedData, beat: parseFloat(e.target.value) || 0.5 })
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-sky-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Delta: 0.5-4 | Theta: 4-8 | Alpha: 8-12 | Beta: 13-30 | Gamma: 30-40
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Carrier Frequency (Hz)
              </label>
              <input
                type="number"
                min="50"
                max="600"
                value={(editedData as TherapyNodeData).carrier}
                onChange={(e) =>
                  setEditedData({ ...editedData, carrier: parseInt(e.target.value) || 50 })
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-sky-500"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 100-500 Hz</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Background Noise
              </label>
              <select
                value={(editedData as TherapyNodeData).noise}
                onChange={(e) =>
                  setEditedData({ ...editedData, noise: e.target.value as NoiseType })
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-sky-500 capitalize"
              >
                {noiseOptions.map((noise) => (
                  <option key={noise} value={noise} className="capitalize">
                    {noise}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {nodeType === 'rampNode' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={(editedData as RampNodeData).duration}
                onChange={(e) =>
                  setEditedData({ ...editedData, duration: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Frequency (Hz)
              </label>
              <input
                type="number"
                min="0.5"
                max="40"
                step="0.1"
                value={(editedData as RampNodeData).startFreq}
                onChange={(e) =>
                  setEditedData({ ...editedData, startFreq: parseFloat(e.target.value) || 0.5 })
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Frequency (Hz)
              </label>
              <input
                type="number"
                min="0.5"
                max="40"
                step="0.1"
                value={(editedData as RampNodeData).endFreq}
                onChange={(e) =>
                  setEditedData({ ...editedData, endFreq: parseFloat(e.target.value) || 0.5 })
                }
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="p-3 bg-violet-900/20 border border-violet-700/30 rounded text-xs text-violet-200">
              <strong>Ramp Mode:</strong> Gradually transitions from start to end frequency over the
              specified duration.
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Check size={18} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default NodeEditorPanel;
