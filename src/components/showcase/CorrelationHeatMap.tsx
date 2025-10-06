import React from 'react';

export interface CorrelationData {
  assets: string[];
  correlations: number[][];
  timestamps: string[];
}

interface CorrelationHeatMapProps {
  data: CorrelationData;
  onAssetSelect?: (asset: string) => void;
}

const CorrelationHeatMap: React.FC<CorrelationHeatMapProps> = ({ 
  data, 
  onAssetSelect 
}) => {
  const correlationData = data.assets.length > 0 ? data : {
    assets: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK'],
    correlations: [
      [1.000, 0.845, 0.723, 0.612, 0.589, 0.678, 0.534, 0.489],
      [0.845, 1.000, 0.789, 0.654, 0.623, 0.712, 0.589, 0.523],
      [0.723, 0.789, 1.000, 0.567, 0.534, 0.645, 0.478, 0.412],
      [0.612, 0.654, 0.567, 1.000, 0.456, 0.523, 0.389, 0.345],
      [0.589, 0.623, 0.534, 0.456, 1.000, 0.489, 0.367, 0.312],
      [0.678, 0.712, 0.645, 0.523, 0.489, 1.000, 0.423, 0.378],
      [0.534, 0.589, 0.478, 0.389, 0.367, 0.423, 1.000, 0.289],
      [0.489, 0.523, 0.412, 0.345, 0.312, 0.378, 0.289, 1.000]
    ],
    timestamps: ['2024-01-01', '2024-01-02', '2024-01-03']
  };

  const getColor = (value: number): string => {
    if (value > 0.7) return 'bg-green-500 text-white';
    if (value > 0.4) return 'bg-green-200 text-gray-800';
    if (value > 0.1) return 'bg-green-100 text-gray-800';
    if (value < -0.7) return 'bg-red-500 text-white';
    if (value < -0.4) return 'bg-red-200 text-gray-800';
    if (value < -0.1) return 'bg-red-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Asset Correlation Matrix
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                Assets
              </th>
              {correlationData.assets.map((asset) => (
                <th 
                  key={asset}
                  className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-blue-500"
                  onClick={() => onAssetSelect?.(asset)}
                >
                  {asset}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlationData.assets.map((rowAsset, rowIndex) => (
              <tr key={rowAsset}>
                <td 
                  className="p-2 text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-500"
                  onClick={() => onAssetSelect?.(rowAsset)}
                >
                  {rowAsset}
                </td>
                {correlationData.assets.map((colAsset, colIndex) => (
                  <td
                    key={colAsset}
                    className={`p-2 text-center text-sm font-mono ${getColor(
                      correlationData.correlations[rowIndex]?.[colIndex] || 0
                    )} cursor-pointer hover:opacity-80`}
                    onClick={() => onAssetSelect?.(colAsset)}
                    title={`${rowAsset} ↔ ${colAsset}: ${(correlationData.correlations[rowIndex]?.[colIndex] || 0).toFixed(3)}`}
                  >
                    {(correlationData.correlations[rowIndex]?.[colIndex] || 0).toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <span>Strong Positive</span>
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Weak Positive</span>
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span>Strong Negative</span>
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Weak Negative</span>
          <div className="w-4 h-4 bg-red-100 rounded"></div>
        </div>
        <span>Click on assets to select</span>
      </div>
    </div>
  );
};

export default CorrelationHeatMap;