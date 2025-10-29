import React, { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useOverviewSync } from '../hooks/useOverviewSync';

export function OverviewEntry() {
  // start polling backend (pnl/risk/portfolio/signal)
  useOverviewSync(true);

  const {
    currentSymbol,
    timeframe,
    connectionStatus,
    ticker,
    orderBook,
    lastSignal,
    pnlSummary,
    portfolioSummary,
    riskSnapshot,
  } = useAppStore();

  // optional: scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-6 px-6 py-4 bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <div className="text-xl font-semibold text-gray-800 tracking-tight flex items-center gap-2">
            <span>{currentSymbol}</span>
            <span className="text-gray-400 text-base font-normal">/ {timeframe}</span>
          </div>
          <div className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">
            Live Trading Dashboard
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={
              'text-[11px] font-semibold px-2 py-1 rounded ' +
              (connectionStatus === 'connected'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : connectionStatus === 'reconnecting'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'bg-red-100 text-red-700 border border-red-300')
            }
          >
            WS: {connectionStatus}
          </span>

          {lastSignal && (
            <span
              className={
                'text-[11px] font-semibold px-2 py-1 rounded border ' +
                (lastSignal.direction === 'LONG'
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : 'bg-red-50 text-red-700 border-red-300')
              }
            >
              {lastSignal.direction} {lastSignal.confidence}%
            </span>
          )}
        </div>
      </header>

      {/* Top row: PnL / Risk / Exposure */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-1">
            PnL
          </div>
          {pnlSummary ? (
            <div className="text-sm text-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Realized</span>
                <span className="font-semibold">
                  {pnlSummary.realized.toFixed(2)} $
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Unrealized</span>
                <span className="font-semibold">
                  {pnlSummary.unrealized.toFixed(2)} $
                </span>
              </div>
              <div className="flex justify-between text-[13px] font-bold">
                <span className="text-gray-700">Total</span>
                <span>
                  {pnlSummary.total.toFixed(2)} $
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">No PnL data.</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-1">
            Exposure
          </div>
          {portfolioSummary ? (
            <div className="text-sm text-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Exposure USD</span>
                <span className="font-semibold">
                  {portfolioSummary.exposureUsd.toFixed(2)} $
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Positions: {portfolioSummary.positions.length}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">No exposure data.</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-800 mb-1">
            Risk
          </div>
          {riskSnapshot ? (
            <div className="text-sm text-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Liq Risk</span>
                <span className="font-semibold">
                  {riskSnapshot.liquidationRisk.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Margin Used</span>
                <span className="font-semibold">
                  {riskSnapshot.marginUsage.toFixed(1)}%
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                {riskSnapshot.notes || '—'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">No risk data.</div>
          )}
        </div>
      </section>

      {/* Middle row: ticker & orderbook */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticker */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-800">
              Ticker ({currentSymbol})
            </div>
            <div className="text-[11px] font-medium text-gray-500">
              live bid / ask / last
            </div>
          </div>

          {ticker ? (
            <div className="grid grid-cols-3 text-sm text-gray-800">
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500">Bid</span>
                <span className="font-semibold text-green-600">
                  {ticker.bid}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500">Ask</span>
                <span className="font-semibold text-red-600">
                  {ticker.ask}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-500">Last</span>
                <span className="font-semibold text-gray-800">
                  {ticker.last}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-4">
              Waiting for live ticker…
            </div>
          )}
        </div>

        {/* OrderBook */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-800">
              Order Book ({currentSymbol})
            </div>
            <div className="text-[11px] font-medium text-gray-500">
              top of book
            </div>
          </div>

          {orderBook ? (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">
                  Bids
                </div>
                <ul className="space-y-1 max-h-32 overflow-auto">
                  {orderBook.bids.slice(0, 8).map(([price, size], i) => (
                    <li
                      key={'bid-' + i}
                      className="flex justify-between text-green-600"
                    >
                      <span className="font-semibold">{price}</span>
                      <span>{size}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1">
                  Asks
                </div>
                <ul className="space-y-1 max-h-32 overflow-auto">
                  {orderBook.asks.slice(0, 8).map(([price, size], i) => (
                    <li
                      key={'ask-' + i}
                      className="flex justify-between text-red-600"
                    >
                      <span className="font-semibold">{price}</span>
                      <span>{size}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-4">
              Waiting for order book…
            </div>
          )}
        </div>
      </section>

      {/* Bottom row: chart placeholder */}
      <section className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-800">
            {currentSymbol} / {timeframe} Chart
          </div>
          <div className="text-[11px] font-medium text-gray-500">
            OHLCV (candles)
          </div>
        </div>

        <div className="text-xs text-gray-400 py-10 text-center">
          TODO: hook up chart component using getCandles(currentSymbol, timeframe)
          and render candlesticks here.
        </div>
      </section>
    </div>
  );
}

export default OverviewEntry;

