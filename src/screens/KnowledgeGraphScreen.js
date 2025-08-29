import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useAppContext } from '../context/AppContext';
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph';
import { useGestureContext } from '../context/GestureContext';
import useGestureManager from '../hooks/useGestureManager';
import { FlingGestureHandler, Directions, State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const GRAPH_WIDTH = width - 40;
const GRAPH_HEIGHT = height - 200;

const KnowledgeGraphScreen = ({ onBack, onSelectShinning }) => {
  const { gestureState } = useGestureContext();
  const { createBackGestureHandler } = useGestureManager();
  const { state, actions } = useAppContext();
  const { userProfile } = state;
  const { graphData, graphStats, findShortestPath } = useKnowledgeGraph();

  const backGestureHandler = createBackGestureHandler(onBack);
  
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showPathModal, setShowPathModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('full'); // full, isolated, hubs
  
  // Graph transformation state
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Node position calculation
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    calculateNodePositions();
  }, [graphData, viewMode, searchQuery]); // Recalculate when data or filters change

  // Calculate node positions (simple force-directed layout)
  const calculateNodePositions = () => {
    const positions = {};
    const nodes = getFilteredNodes();
    
    if (nodes.length === 0) {
        setNodePositions({});
        return;
    };

    // Simple circular layout
    if (nodes.length === 1) {
      positions[nodes[0].id] = {
        x: GRAPH_WIDTH / 2,
        y: GRAPH_HEIGHT / 2
      };
    } else {
      const centerX = GRAPH_WIDTH / 2;
      const centerY = GRAPH_HEIGHT / 2;
      const radius = Math.min(GRAPH_WIDTH, GRAPH_HEIGHT) / 3;

      nodes.forEach((node, index) => {
        const angle = (index / nodes.length) * 2 * Math.PI;
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    }

    setNodePositions(positions);
  };

  // Get filtered nodes
  const getFilteredNodes = () => {
    let filteredNodes = graphData.nodes;

    // Filter by search query
    if (searchQuery.trim()) {
      filteredNodes = filteredNodes.filter(node =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by view mode
    switch (viewMode) {
      case 'isolated':
        filteredNodes = filteredNodes.filter(node => node.connections === 0);
        break;
      case 'hubs':
        // Assuming hubs are nodes with more than average connections, or a fixed number like >= 2
        filteredNodes = filteredNodes.filter(node => node.connections >= 2);
        break;
      default:
        break;
    }

    return filteredNodes;
  };

  // Get filtered edges
  const getFilteredEdges = () => {
    const filteredNodes = getFilteredNodes();
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    return graphData.edges.filter(edge =>
      nodeIds.has(edge.from) && nodeIds.has(edge.to)
    );
  };

  // Handle node press
  const handleNodePress = (node) => {
    if (selectedNodes.length === 0) {
      setSelectedNodes([node.id]);
    } else if (selectedNodes.length === 1) {
      if (selectedNodes[0] === node.id) {
        // Double-tap node to navigate to details
        const shinning = state.shinnings.find(s => s.id === node.id);
        if (shinning) {
          onSelectShinning(shinning);
        }
      } else {
        setSelectedNodes([selectedNodes[0], node.id]);
      }
    } else {
      setSelectedNodes([node.id]);
    }
  };

  // Find path
  const handleFindPath = () => {
    if (selectedNodes.length === 2) {
      const path = findShortestPath(selectedNodes[0], selectedNodes[1]);
      if (path) {
        // Highlight path
        actions.showToast(`Path found, length: ${path.length - 1}`);
      } else {
        actions.showToast('No connecting path found', 'ERROR');
      }
    }
  };

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Knowledge Graph</Text>
      <TouchableOpacity onPress={() => setShowStatsModal(true)} style={styles.statsButton}>
        <Text style={styles.statsIcon}>📊</Text>
      </TouchableOpacity>
    </View>
  );

  // Control Panel
  const ControlPanel = () => (
    <View style={styles.controlPanel}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search nodes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'full' && styles.activeModeButton]}
          onPress={() => setViewMode('full')}
        >
          <Text style={[styles.modeButtonText, viewMode === 'full' && styles.activeModeButtonText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'isolated' && styles.activeModeButton]}
          onPress={() => setViewMode('isolated')}
        >
          <Text style={[styles.modeButtonText, viewMode === 'isolated' && styles.activeModeButtonText]}>
            Isolated Nodes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'hubs' && styles.activeModeButton]}
          onPress={() => setViewMode('hubs')}
        >
          <Text style={[styles.modeButtonText, viewMode === 'hubs' && styles.activeModeButtonText]}>
            Hub Nodes
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {userProfile?.accountType === 'pro' && selectedNodes.length === 2 && (
        <TouchableOpacity style={styles.pathButton} onPress={handleFindPath}>
          <Text style={styles.pathButtonText}>Find Path</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const GraphView = () => {
    const filteredNodes = getFilteredNodes();
    const filteredEdges = getFilteredEdges();

    return (
      <View style={styles.graphContainer}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          {/* Render edges */}
          {filteredEdges.map((edge, index) => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];
            
            if (!fromPos || !toPos) return null;
            
            return (
              <Line
                key={`edge-${index}`}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#ADB5BD"
                strokeWidth="1"
              />
            );
          })}

          {/* Render nodes */}
          {filteredNodes.map(node => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            
            const isSelected = selectedNodes.includes(node.id);
            
            return (
              <G key={`node-${node.id}`} x={pos.x} y={pos.y} onPress={() => handleNodePress(node)}>
                <Circle
                  r="15"
                  fill={isSelected ? '#007AFF' : '#FFFFFF'}
                  stroke={isSelected ? '#0056B3' : '#DEE2E6'}
                  strokeWidth="2"
                />
                <SvgText
                  fontSize="10"
                  x="0"
                  y="25"
                  fill="#495057"
                  textAnchor="middle"
                >
                  {node.label.length > 10 ? `${node.label.substring(0, 9)}...` : node.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  // Graph Stats Modal
  const StatsModal = () => (
    <Modal
      visible={showStatsModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowStatsModal(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStatsModal(false)} activeOpacity={1}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Graph Statistics</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Nodes:</Text>
            <Text style={styles.statsValue}>{graphStats.totalNodes}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Connections:</Text>
            <Text style={styles.statsValue}>{graphStats.totalEdges}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Isolated Nodes:</Text>
            <Text style={styles.statsValue}>{graphStats.isolatedNodes}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Average Connections:</Text>
            <Text style={styles.statsValue}>{graphStats.averageConnections.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowStatsModal(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
      <FlingGestureHandler
      direction={Directions.RIGHT}
      enabled={!gestureState.isMenuOpen}
      onHandlerStateChange={backGestureHandler.onHandlerStateChange}
      >

    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />
      <ControlPanel />
      <GraphView />
      <StatsModal />
    </SafeAreaView>
    </FlingGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
    color: '#212529',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  statsButton: {
    padding: 4,
  },
  statsIcon: {
    fontSize: 24,
  },
  controlPanel: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchInput: {
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  modeSelector: {
    flexDirection: 'row',
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    marginRight: 8,
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: 'white',
  },
  pathButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  pathButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  graphContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  statsLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default KnowledgeGraphScreen;