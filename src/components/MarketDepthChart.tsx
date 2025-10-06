import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface OrderBookLevel {
  price: number;
  size: number;
}

interface MarketDepthData {
  symbol: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  mid_price: number;
}

interface MarketDepthChartProps {
  data: MarketDepthData;
  width?: number;
  height?: number;
  maxLevels?: number;
}

const MarketDepthChart: React.FC<MarketDepthChartProps> = ({
  data,
  width = 800,
  height = 400,
  maxLevels = 20
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLevel, setHoveredLevel] = useState<{
    price: number;
    size: number;
    side: 'bid' | 'ask';
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.bids.length || !data.asks.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data
    const bids = data.bids.slice(0, maxLevels).sort((a, b) => b.price - a.price);
    const asks = data.asks.slice(0, maxLevels).sort((a, b) => a.price - b.price);

    // Calculate cumulative sizes
    let cumulativeBidSize = 0;
    const bidsWithCumulative = bids.map(bid => {
      cumulativeBidSize += bid.size;
      return { ...bid, cumulative: cumulativeBidSize };
    });

    let cumulativeAskSize = 0;
    const asksWithCumulative = asks.map(ask => {
      cumulativeAskSize += ask.size;
      return { ...ask, cumulative: cumulativeAskSize };
    });

    // Create scales
    const allPrices = [...bids.map(d => d.price), ...asks.map(d => d.price)];
    const priceExtent = d3.extent(allPrices) as [number, number];
    const priceRange = priceExtent[1] - priceExtent[0];
    
    const xScale = d3
      .scaleLinear()
      .domain([priceExtent[0] - priceRange * 0.1, priceExtent[1] + priceRange * 0.1])
      .range([0, innerWidth]);

    const maxCumulative = Math.max(
      d3.max(bidsWithCumulative, d => d.cumulative) || 0,
      d3.max(asksWithCumulative, d => d.cumulative) || 0
    );

    const yScale = d3
      .scaleLinear()
      .domain([0, maxCumulative * 1.1])
      .range([innerHeight, 0]);

    // Create area generators
    const bidArea = d3
      .area<typeof bidsWithCumulative[0]>()
      .x(d => xScale(d.price))
      .y0(innerHeight)
      .y1(d => yScale(d.cumulative))
      .curve(d3.curveStepAfter);

    const askArea = d3
      .area<typeof asksWithCumulative[0]>()
      .x(d => xScale(d.price))
      .y0(innerHeight)
      .y1(d => yScale(d.cumulative))
      .curve(d3.curveStepBefore);

    // Add gradient definitions
    const defs = svg.append('defs');

    const bidGradient = defs
      .append('linearGradient')
      .attr('id', 'bid-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', innerHeight)
      .attr('x2', 0).attr('y2', 0);

    bidGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.8);

    bidGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.2);

    const askGradient = defs
      .append('linearGradient')
      .attr('id', 'ask-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', innerHeight)
      .attr('x2', 0).attr('y2', 0);

    askGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.8);

    askGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.2);

    // Draw bid area
    g.append('path')
      .datum(bidsWithCumulative)
      .attr('fill', 'url(#bid-gradient)')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('d', bidArea);

    // Draw ask area
    g.append('path')
      .datum(asksWithCumulative)
      .attr('fill', 'url(#ask-gradient)')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', askArea);

    // Add price levels as interactive rectangles
    const bidLevels = g
      .selectAll('.bid-level')
      .data(bidsWithCumulative)
      .enter()
      .append('rect')
      .attr('class', 'bid-level')
      .attr('x', d => xScale(d.price) - 2)
      .attr('y', d => yScale(d.cumulative))
      .attr('width', 4)
      .attr('height', d => innerHeight - yScale(d.cumulative))
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        setHoveredLevel({
          price: d.price,
          size: d.size,
          side: 'bid',
          x: event.pageX,
          y: event.pageY
        });
        d3.select(this).attr('fill', '#10b981').attr('fill-opacity', 0.3);
      })
      .on('mouseout', function() {
        setHoveredLevel(null);
        d3.select(this).attr('fill', 'transparent');
      });

    const askLevels = g
      .selectAll('.ask-level')
      .data(asksWithCumulative)
      .enter()
      .append('rect')
      .attr('class', 'ask-level')
      .attr('x', d => xScale(d.price) - 2)
      .attr('y', d => yScale(d.cumulative))
      .attr('width', 4)
      .attr('height', d => innerHeight - yScale(d.cumulative))
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        setHoveredLevel({
          price: d.price,
          size: d.size,
          side: 'ask',
          x: event.pageX,
          y: event.pageY
        });
        d3.select(this).attr('fill', '#ef4444').attr('fill-opacity', 0.3);
      })
      .on('mouseout', function() {
        setHoveredLevel(null);
        d3.select(this).attr('fill', 'transparent');
      });

    // Add mid price line
    const midPriceLine = g
      .append('line')
      .attr('x1', xScale(data.mid_price))
      .attr('x2', xScale(data.mid_price))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Add mid price label
    g.append('text')
      .attr('x', xScale(data.mid_price) + 5)
      .attr('y', 15)
      .attr('fill', '#fbbf24')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`Mid: $${data.mid_price.toFixed(4)}`);

    // Add spread indicator
    const spreadWidth = xScale(data.mid_price + data.spread / 2) - xScale(data.mid_price - data.spread / 2);
    g.append('rect')
      .attr('x', xScale(data.mid_price - data.spread / 2))
      .attr('y', -5)
      .attr('width', spreadWidth)
      .attr('height', 10)
      .attr('fill', '#fbbf24')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 1);

    // Add axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat(d3.format('$.4f'))
      .ticks(8);

    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat(d3.format('.2s'))
      .ticks(6);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px');

    // Add axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - innerHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .text('Cumulative Size');

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .text('Price ($)');

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(`${data.symbol} Order Book Depth`);

  }, [data, width, height, maxLevels]);

  return (
    <div className="relative bg-gray-900 rounded-lg p-4">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: 'transparent' }}
      />
      
      {hoveredLevel && (
        <div
          className="fixed z-50 bg-black bg-opacity-90 text-white p-3 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: hoveredLevel.x + 10,
            top: hoveredLevel.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <div className={`text-sm font-semibold ${
            hoveredLevel.side === 'bid' ? 'text-green-400' : 'text-red-400'
          }`}>
            {hoveredLevel.side.toUpperCase()} Level
          </div>
          <div className="text-lg font-bold">
            ${hoveredLevel.price.toFixed(4)}
          </div>
          <div className="text-sm">
            Size: {hoveredLevel.size.toFixed(2)}
          </div>
        </div>
      )}
      
      {/* Statistics panel */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Spread:</span>
            <span className="text-yellow-400">${data.spread.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span>Spread %:</span>
            <span className="text-yellow-400">
              {((data.spread / data.mid_price) * 100).toFixed(3)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Best Bid:</span>
            <span className="text-green-400">${data.bids[0]?.price.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span>Best Ask:</span>
            <span className="text-red-400">${data.asks[0]?.price.toFixed(4)}</span>
          </div>
          <div className="text-gray-400 mt-2">
            Updated: {new Date(data.timestamp * 1000).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white p-3 rounded text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-green-500 opacity-60"></div>
            <span>Bids</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-red-500 opacity-60"></div>
            <span>Asks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-yellow-500 border-dashed border border-yellow-500"></div>
            <span>Mid Price</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDepthChart;