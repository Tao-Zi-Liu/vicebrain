// src/hooks/useKnowledgeGraph.js - CORRECTED

import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const useKnowledgeGraph = () => {
  const { state } = useAppContext();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  // --- KEY CHANGE 1: Add averageConnections to the initial state ---
  const [graphStats, setGraphStats] = useState({
    totalNodes: 0,
    totalEdges: 0,
    isolatedNodes: 0,
    averageConnections: 0
  });

  useEffect(() => {
    if (state.shinnings.length > 0) {
      generateGraphData();
    }
  }, [state.shinnings]);

  const generateGraphData = () => {
    const nodes = state.shinnings.map(shinning => ({
      id: shinning.id,
      label: shinning.title,
      type: shinning.type || 'text',
    }));

    const edges = [];
    const connectionCount = new Map();

    state.shinnings.forEach(shinning => {
      connectionCount.set(shinning.id, 0);
      shinning.outgoingLinks?.forEach(targetId => {
        // Ensure the target node exists before creating an edge
        if (nodes.some(n => n.id === targetId)) {
            edges.push({ from: shinning.id, to: targetId });
            connectionCount.set(shinning.id, (connectionCount.get(shinning.id) || 0) + 1);
            connectionCount.set(targetId, (connectionCount.get(targetId) || 0) + 1);
        }
      });
    });

    const isolatedNodesCount = Array.from(connectionCount.values()).filter(count => count === 0).length;

    // --- KEY CHANGE 2: Calculate the average connections ---
    const averageConnections = nodes.length > 0 ? (edges.length * 2) / nodes.length : 0;

    setGraphData({ nodes, edges });
    setGraphStats({
      totalNodes: nodes.length,
      totalEdges: edges.length,
      isolatedNodes: isolatedNodesCount,
      // --- KEY CHANGE 3: Set the calculated average ---
      averageConnections: averageConnections
    });
  };

  const findShortestPath = (fromId, toId) => {
    const queue = [[fromId]];
    const visited = new Set([fromId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const currentId = path[path.length - 1];

      if (currentId === toId) return path;

      const currentShinning = state.shinnings.find(s => s.id === currentId);
      if (currentShinning) {
        const connections = [
          ...(currentShinning.outgoingLinks || []),
          ...(currentShinning.incomingLinks || [])
        ];

        for (const nextId of connections) {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push([...path, nextId]);
          }
        }
      }
    }
    return null; 
  };

  return { graphData, graphStats, findShortestPath };
};

export { useKnowledgeGraph };