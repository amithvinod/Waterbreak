import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand' | 'success' | 'amber';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorClasses = {
  brand: 'bg-gradient-to-r from-brand-500 to-brand-400',
  success: 'bg-gradient-to-r from-success-600 to-success-400',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
};

export default function ProgressBar({
  progress,
  size = 'md',
  color = 'brand',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full ${sizeClasses[size]} bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(clampedProgress)}% complete`}
      >
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-surface-400 mt-1 text-right font-medium">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  );
}
