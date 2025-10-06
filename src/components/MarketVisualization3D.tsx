import React, { useState } from 'react';
// Simplified version without 3D dependencies to avoid conflicts
// import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import { OrbitControls, Text, Box, Sphere, Line } from '@react-three/drei';
// import * as THREE from 'three';

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  volatility: number;
}

interface Market3DVisualizationProps {
  marketData: MarketData[];
  selectedSymbol?: string;
  onSymbolSelect?: (symbol: string) => void;
}

const MarketSphere: React.FC<{
  data: MarketData;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
}> = ({ data, position, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Animate the sphere
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  // Calculate sphere properties based on data
  const radius = Math.max(0.2, Math.min(2, data.volume / 10000));
  const color = data.change24h >= 0 ? '#10b981' : '#ef4444';
  const intensity = Math.abs(data.change24h) / 10;
  
  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[radius, 32, 32]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity * 0.3}
          transparent
          opacity={isSelected ? 1 : 0.8}
          wireframe={hovered}
        />
      </Sphere>
      
      {/* Price label */}
      <Text
        position={[0, radius + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {data.symbol}
      </Text>
      
      <Text
        position={[0, radius + 0.2, 0]}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        ${data.price.toFixed(2)}
      </Text>
      
      {/* Volatility indicator */}
      <Box
        position={[0, -radius - 0.3, 0]}
        args={[data.volatility * 2, 0.1, 0.1]}
      >
        <meshStandardMaterial color="#fbbf24" />
      </Box>
    </group>
  );
};

const ConnectionLines: React.FC<{ marketData: MarketData[] }> = ({ marketData }) => {
  const lines = useMemo(() => {
    const connections = [];
    for (let i = 0; i < marketData.length; i++) {
      for (let j = i + 1; j < marketData.length; j++) {
        // Create correlation-based connections
        const correlation = Math.random() * 0.8 + 0.2; // Mock correlation
        if (correlation > 0.6) {
          const angle1 = (i / marketData.length) * Math.PI * 2;
          const angle2 = (j / marketData.length) * Math.PI * 2;
          const radius = 5;
          
          const pos1: [number, number, number] = [
            Math.cos(angle1) * radius,
            0,
            Math.sin(angle1) * radius
          ];
          const pos2: [number, number, number] = [
            Math.cos(angle2) * radius,
            0,
            Math.sin(angle2) * radius
          ];
          
          connections.push({
            points: [pos1, pos2],
            color: correlation > 0 ? '#10b981' : '#ef4444',
            opacity: correlation * 0.5
          });
        }
      }
    }
    return connections;
  }, [marketData]);
  
  return (
    <>
      {lines.map((line, index) => (
        <Line
          key={index}
          points={line.points}
          color={line.color}
          lineWidth={2}
          transparent
          opacity={line.opacity}
        />
      ))}
    </>
  );
};

const PriceGrid: React.FC = () => {
  const gridRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (gridRef.current) {
      gridRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={gridRef}>
      {/* Create a grid of price levels */}
      {Array.from({ length: 10 }, (_, i) => (
        <React.Fragment key={i}>
          <Line
            points={[[-8, i - 5, -8], [8, i - 5, -8]]}
            color="#374151"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
          <Line
            points={[[-8, i - 5, 8], [8, i - 5, 8]]}
            color="#374151"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
          <Line
            points={[[-8, i - 5, -8], [-8, i - 5, 8]]}
            color="#374151"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
          <Line
            points={[[8, i - 5, -8], [8, i - 5, 8]]}
            color="#374151"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        </React.Fragment>
      ))}
    </group>
  );
};

const CameraController: React.FC = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(10, 5, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
};

const Market3DVisualization: React.FC<Market3DVisualizationProps> = ({
  marketData,
  selectedSymbol,
  onSymbolSelect
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          {viewMode === 'grid' ? 'List View' : 'Grid View'}
        </button>
      </div>
      
      {/* Simplified 2D visualization instead of 3D */}
      <div className="p-8 pt-16 h-full overflow-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {marketData.map((data) => (
              <div
                key={data.symbol}
                onClick={() => onSymbolSelect?.(data.symbol)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedSymbol === data.symbol
                    ? 'bg-blue-600 shadow-lg scale-105'
                    : data.change24h >= 0
                    ? 'bg-green-600/20 hover:bg-green-600/30'
                    : 'bg-red-600/20 hover:bg-red-600/30'
                } border ${
                  selectedSymbol === data.symbol
                    ? 'border-blue-400'
                    : data.change24h >= 0
                    ? 'border-green-500/30'
                    : 'border-red-500/30'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-white mb-2">{data.symbol}</div>
                  <div className="text-2xl font-mono text-white mb-1">
                    ${data.price.toFixed(2)}
                  </div>
                  <div className={`text-sm font-semibold ${
                    data.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Vol: {(data.volume / 1000000).toFixed(1)}M
                  </div>
                  
                  {/* Volatility bar */}
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Volatility</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(data.volatility * 200, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {marketData.map((data) => (
              <div
                key={data.symbol}
                onClick={() => onSymbolSelect?.(data.symbol)}
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedSymbol === data.symbol
                    ? 'bg-blue-600 shadow-lg'
                    : data.change24h >= 0
                    ? 'bg-green-600/20 hover:bg-green-600/30'
                    : 'bg-red-600/20 hover:bg-red-600/30'
                } border ${
                  selectedSymbol === data.symbol
                    ? 'border-blue-400'
                    : data.change24h >= 0
                    ? 'border-green-500/30'
                    : 'border-red-500/30'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-bold text-white">{data.symbol}</div>
                  <div className="text-xl font-mono text-white">
                    ${data.price.toFixed(2)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`text-sm font-semibold ${
                    data.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Vol: {(data.volume / 1000000).toFixed(1)}M
                  </div>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(data.volatility * 200, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white p-3 rounded text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Positive Change</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Negative Change</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-1 bg-yellow-500"></div>
            <span>Volatility</span>
          </div>
          <div className="text-gray-400">
            Click to select symbol
          </div>
        </div>
      </div>
    </div>
  );
};

export default Market3DVisualization;