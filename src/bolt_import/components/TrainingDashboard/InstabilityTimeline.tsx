import React from 'react';
import { AlertTriangle, Zap, TrendingDown, X, RotateCcw } from 'lucide-react';

interface InstabilityEvent {
    timestamp: string;
    type: 'nan_loss' | 'gradient_spike' | 'loss_spike' | 'validation_collapse';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recovery_action: string;
    epoch: number;
}

interface InstabilityTimelineProps {
    events: InstabilityEvent[];
    className?: string;
}

const InstabilityTimeline: React.FC<InstabilityTimelineProps> = ({
    events,
    className = ''
}) => {
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'nan_loss':
                return <X className="w-4 h-4" />;
            case 'gradient_spike':
                return <Zap className="w-4 h-4" />;
            case 'loss_spike':
                return <TrendingDown className="w-4 h-4" />;
            case 'validation_collapse':
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'nan_loss':
                return 'NaN/Inf Loss';
            case 'gradient_spike':
                return 'Gradient Spike';
            case 'loss_spike':
                return 'Loss Spike';
            case 'validation_collapse':
                return 'Validation Collapse';
            default:
                return 'Unknown Event';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    };

    // Sort events by timestamp (most recent first)
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (events.length === 0) {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <div className="text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                        <RotateCcw className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-lg mb-1 text-green-600 font-semibold">All Clear!</div>
                    <div className="text-sm text-gray-600">No instability events detected</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {['critical', 'high', 'medium', 'low'].map(severity => {
                    const count = events.filter(e => e.severity === severity).length;
                    return (
                        <div key={severity} className={`text-center p-2 rounded border ${getSeverityColor(severity)}`}>
                            <div className="text-lg font-bold">{count}</div>
                            <div className="text-xs capitalize">{severity}</div>
                        </div>
                    );
                })}
            </div>

            {/* Timeline */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
                {sortedEvents.slice(0, 10).map((event, index) => (
                    <div
                        key={index}
                        className={`border-l-4 pl-4 py-2 rounded-r border ${getSeverityColor(event.severity)}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                                <div className={`p-1 rounded ${getSeverityColor(event.severity)}`}>
                                    {getEventIcon(event.type)}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">
                                        {getEventTypeLabel(event.type)}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Epoch {event.epoch} • {formatTimestamp(event.timestamp)}
                                    </div>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                                {event.severity.toUpperCase()}
                            </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-700">
                            <div className="mb-1">
                                <strong>Issue:</strong> {event.description}
                            </div>
                            <div>
                                <strong>Recovery:</strong> {event.recovery_action}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show more indicator */}
            {sortedEvents.length > 10 && (
                <div className="text-center mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        Showing 10 of {sortedEvents.length} events
                    </div>
                </div>
            )}

            {/* Event Type Legend */}
            <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2 font-semibold">Event Types:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                        <X className="w-3 h-3 text-red-600" />
                        <span>NaN/Inf Loss</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-yellow-600" />
                        <span>Gradient Spike</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <TrendingDown className="w-3 h-3 text-orange-600" />
                        <span>Loss Spike</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Val Collapse</span>
                    </div>
                </div>
            </div>

            {/* Recovery Actions Summary */}
            {events.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 mb-1 font-semibold">Recent Recovery Actions:</div>
                    <div className="text-xs text-gray-700">
                        {Array.from(new Set(events.slice(0, 5).map(e => e.recovery_action))).map((action, index) => (
                            <div key={index} className="flex items-center space-x-1 mb-1">
                                <RotateCcw className="w-3 h-3 text-blue-600" />
                                <span>{action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstabilityTimeline;
