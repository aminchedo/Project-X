import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = ''
}) => {
  const getStyles = () => {
    const base = 'bg-slate-800 animate-pulse';

    switch (variant) {
      case 'circular':
        return `${base} rounded-full ${className}`;
      case 'rectangular':
        return `${base} rounded-lg ${className}`;
      default:
        return `${base} rounded ${className}`;
    }
  };

  const getSize = () => {
    if (variant === 'text') {
      return { width: width || '100%', height: height || '1rem' };
    }
    if (variant === 'circular') {
      const size = width || height || '3rem';
      return { width: size, height: size };
    }
    return { width: width || '100%', height: height || '3rem' };
  };

  return (
    <motion.div
      className={getStyles()}
      style={getSize()}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
    />
  );
};

export const SkeletonGroup: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className 
}) => {
  return (
    <div className={`space-y-3 ${className || ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
