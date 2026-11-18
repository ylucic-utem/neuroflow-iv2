import React, { useCallback, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ReactFlow, 
  addEdge, 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls, 
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type OnConnect,
  type Connection,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, PlayCircle, Activity, Plus, Trash2, Copy } from 'lucide-react';
import { NoiseType } from '../types';

import { StartNode, TherapyNode, RampNode, EndNode } from './FlowNodes';
import type { TherapyNodeData, RampNodeData, StartNodeData, EndNodeData } from './FlowNodes';

interface SessionCreatorModalProps {
  onClose: () => void;
  onSave?: (playlist: any[], flowState: { nodes: FlowNode[]; edges: Edge[] }) => void;
  savedFlow?: { nodes: FlowNode[]; edges: Edge[] } | null;
  presets?: any[];
}

// Define node types
const nodeTypes = {
  startNode: StartNode,
  therapyNode: TherapyNode,
  rampNode: RampNode,
  endNode: EndNode,
};

// Custom node type union
type FlowNode = 
  | Node<StartNodeData, 'startNode'>
  | Node<TherapyNodeData, 'therapyNode'>
  | Node<RampNodeData, 'rampNode'>
  | Node<EndNodeData, 'endNode'>;

const initialNodes: FlowNode[] = [
  {
    id: '1',
    type: 'startNode',
    position: { x: 100, y: 200 },
    data: { label: 'Start' },
  },
];

const initialEdges: Edge[] = [];

const SessionCreatorModalContent: React.FC<SessionCreatorModalProps> = ({ onClose, onSave, savedFlow, presets }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(savedFlow?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedFlow?.edges || initialEdges);
  const [nodeId, setNodeId] = useState(() => {
    if (savedFlow?.nodes) {
      const maxId = Math.max(...savedFlow.nodes.map(n => parseInt(n.id) || 0));
      return maxId + 1;
    }
    return 2;
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string; edgeId?: string } | null>(null);
  const { getNode, getEdge, deleteElements } = useReactFlow();
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Add node update handler
  const handleUpdateNode = useCallback((nodeId: string, updatedData: Partial<TherapyNodeData | RampNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updatedData } }
          : node
      )
    );
  }, [setNodes]);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Attach onUpdate callback to loaded nodes
  useEffect(() => {
    if (savedFlow?.nodes) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === 'therapyNode' || node.type === 'rampNode') {
            return {
              ...node,
              data: { ...node.data, onUpdate: handleUpdateNode },
            };
          }
          return node;
        })
      );
    }
  }, [handleUpdateNode]); // Run when handleUpdateNode changes

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as HTMLElement)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteElements({ nodes: [{ id: selectedNodeId }] });
        setSelectedNodeId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, deleteElements]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const edge = { 
        ...connection, 
        animated: true,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  // Add node functions
  const handleSaveNodeData = (nodeId: string, newData: TherapyNodeData | RampNodeData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...newData, onUpdate: handleUpdateNode } }
          : node
      )
    );
  };

  const addTherapyNode = () => {
    const newNode: FlowNode = {
      id: `${nodeId}`,
      type: 'therapyNode',
      position: { x: 400, y: 200 + (nodeId - 2) * 100 },
      data: {
        duration: 10,
        beat: 10,
        carrier: 200,
        noise: NoiseType.Pink,
        onUpdate: handleUpdateNode,
        locked: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeId(nodeId + 1);
  };

  const addRampNode = () => {
    const newNode: FlowNode = {
      id: `${nodeId}`,
      type: 'rampNode',
      position: { x: 400, y: 200 + (nodeId - 2) * 100 },
      data: {
        duration: 5,
        startFreq: 15,
        endFreq: 5,
        onUpdate: handleUpdateNode,
        locked: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeId(nodeId + 1);
  };

  const addEndNode = () => {
    const newNode: FlowNode = {
      id: `${nodeId}`,
      type: 'endNode',
      position: { x: 700, y: 200 },
      data: { label: 'End' },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeId(nodeId + 1);
  };

  const loadPreset = (preset: any) => {
    // Add preset node to existing flow (don't clear)
    const newId = `${nodeId}`;
    
    // Create therapy node from preset with amber theme
    const therapyNode: FlowNode = {
      id: newId,
      type: 'therapyNode',
      position: { x: 400 + (nodeId - 2) * 100, y: 200 + (nodeId - 2) * 50 },
      data: {
        duration: 10,
        beat: preset.beat,
        carrier: preset.carrier,
        noise: preset.noise,
        onUpdate: handleUpdateNode,
        locked: false,
        presetName: preset.name,
      },
    };
    
    setNodes((nds) => [...nds, therapyNode]);
    setNodeId(nodeId + 1);
  };

  const handleSave = () => {
    if (!onSave) return;

    // Build a playlist by traversing the graph
    const playlist: any[] = [];
    
    // Find start node
    const startNode = nodes.find((n) => n.type === 'startNode');
    if (!startNode) return;

    // Simple traversal - find edges connected to start
    let currentNodeId = startNode.id;
    const visited = new Set<string>();
    
    while (currentNodeId && visited.size < nodes.length) {
      visited.add(currentNodeId);
      
      // Find edge from current node
      const edge = edges.find((e) => e.source === currentNodeId && !visited.has(e.target));
      if (!edge) break;
      
      const nextNode = nodes.find((n) => n.id === edge.target);
      if (!nextNode) break;
      
      // Add to playlist based on type
      if (nextNode.type === 'therapyNode') {
        const data = nextNode.data as TherapyNodeData;
        const playlistItem = {
          type: 'therapy' as const,
          duration: data.duration,
          beat: data.beat,
          carrier: data.carrier,
          noise: data.noise,
        };
        console.log('[SessionCreator] Adding therapy node to playlist:', playlistItem);
        playlist.push(playlistItem);
      } else if (nextNode.type === 'rampNode') {
        const data = nextNode.data as RampNodeData;
        playlist.push({
          type: 'ramp',
          duration: data.duration,
          start: data.startFreq,
          end: data.endFreq,
        });
      }
      
      currentNodeId = nextNode.id;
    }

    onSave(playlist, { nodes, edges });
    onClose();
  };

  // Context menu handlers
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
      nodeId: node.id,
    });
  }, []);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
  }, []);

  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
      edgeId: edge.id,
    });
  }, []);

  const handleDeleteNode = () => {
    if (contextMenu?.nodeId) {
      deleteElements({ nodes: [{ id: contextMenu.nodeId }] });
    }
    setContextMenu(null);
  };

  const handleDeleteEdge = () => {
    if (contextMenu?.edgeId) {
      deleteElements({ edges: [{ id: contextMenu.edgeId }] });
    }
    setContextMenu(null);
  };

  const handleDuplicateNode = () => {
    if (contextMenu?.nodeId) {
      const node = nodes.find(n => n.id === contextMenu.nodeId);
      if (node && node.type !== 'startNode' && node.type !== 'endNode') {
        const newNode: FlowNode = {
          ...node,
          id: `${nodeId}`,
          position: { x: node.position.x + 50, y: node.position.y + 50 },
        };
        setNodes((nds) => [...nds, newNode]);
        setNodeId(nodeId + 1);
      }
    }
    setContextMenu(null);
  };

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col font-sans">
      {/* Header */}
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Session Protocol Architect</h2>
            <p className="text-gray-400 text-xs font-mono tracking-wider">VISUAL PROGRAMMING ENVIRONMENT</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center gap-2 shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <PlayCircle size={18} />
            Compile & Run
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 text-gray-300">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Add Nodes</h3>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
              Click to add nodes to your protocol.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={addTherapyNode}
                className="w-full flex items-center gap-3 p-3 rounded bg-sky-600/20 border border-sky-500/30 hover:bg-sky-600/30 transition-colors"
              >
                <Plus size={16} className="text-sky-400" />
                <div className="text-left">
                  <div className="text-sm font-bold text-sky-100">Therapy Block</div>
                  <div className="text-[10px] text-sky-300">Fixed Frequencies</div>
                </div>
              </button>

              <button
                onClick={addRampNode}
                className="w-full flex items-center gap-3 p-3 rounded bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 transition-colors"
              >
                <Plus size={16} className="text-violet-400" />
                <div className="text-left">
                  <div className="text-sm font-bold text-violet-100">Iso-Ramp</div>
                  <div className="text-[10px] text-violet-300">Dynamic Transition</div>
                </div>
              </button>

              <button
                onClick={addEndNode}
                className="w-full flex items-center gap-3 p-3 rounded bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 transition-colors"
              >
                <Plus size={16} className="text-rose-400" />
                <div className="text-left">
                  <div className="text-sm font-bold text-rose-100">End Session</div>
                  <div className="text-[10px] text-rose-300">Termination Point</div>
                </div>
              </button>
            </div>
          </div>

          {/* Load Presets Section */}
          {presets && presets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Quick Start</h3>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                Load a preset configuration
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="w-full text-left p-2 rounded bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 hover:border-gray-600 transition-colors"
                  >
                    <div className="text-xs font-bold text-gray-200">{preset.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {preset.beat}Hz • {preset.carrier}Hz
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto text-xs text-gray-500 space-y-2">
            <div className="p-3 bg-gray-800/50 rounded">
              <div className="font-bold mb-1 text-gray-400">Instructions</div>
              <ul className="space-y-1 text-[10px]">
                <li>• Drag nodes to position</li>
                <li>• Connect output to input</li>
                <li>• Right-click for menu</li>
                <li>• Del key to delete</li>
                <li>• Click edit icon to configure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 bg-gray-950 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            onPaneContextMenu={handlePaneContextMenu}
            onPaneClick={() => setContextMenu(null)}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{
              animated: true,
            }}
          >
            <Background color="#374151" variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls className="bg-gray-800 border border-gray-700" />
            <MiniMap 
              className="bg-gray-800 border border-gray-700" 
              nodeColor={(node) => {
                // Check if node has presetName to use amber color
                const nodeData = node.data as any;
                if (nodeData?.presetName) return '#f59e0b'; // amber for presets
                
                switch (node.type) {
                  case 'startNode': return '#10b981';
                  case 'therapyNode': return '#0ea5e9';
                  case 'rampNode': return '#8b5cf6';
                  case 'endNode': return '#f43f5e';
                  default: return '#6b7280';
                }
              }}
            />
            <Panel position="top-right" className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded shadow-lg">
              <div className="text-xs text-gray-300">
                <span className="font-bold">{nodes.length}</span> nodes, <span className="font-bold">{edges.length}</span> connections
              </div>
            </Panel>
          </ReactFlow>

          {/* Context Menu */}
          {contextMenu && (
            <div
              ref={contextMenuRef}
              className="absolute bg-gray-800 border border-gray-700 rounded shadow-2xl py-1 z-[200]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {contextMenu.nodeId && (
                <>
                  <button
                    onClick={handleDeleteNode}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete Node
                  </button>
                  {nodes.find(n => n.id === contextMenu.nodeId)?.type !== 'startNode' && 
                   nodes.find(n => n.id === contextMenu.nodeId)?.type !== 'endNode' && (
                    <button
                      onClick={handleDuplicateNode}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Copy size={14} />
                      Duplicate Node
                    </button>
                  )}
                </>
              )}
              {contextMenu.edgeId && (
                <button
                  onClick={handleDeleteEdge}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Connection
                </button>
              )}
              {!contextMenu.nodeId && !contextMenu.edgeId && (
                <div className="px-4 py-2 text-xs text-gray-500">
                  Right-click a node or connection
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SessionCreatorModal: React.FC<SessionCreatorModalProps> = (props) => {
  return createPortal(
    <ReactFlowProvider>
      <SessionCreatorModalContent {...props} />
    </ReactFlowProvider>,
    document.body
  );
};

export default SessionCreatorModal;
