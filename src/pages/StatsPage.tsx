import { motion } from 'framer-motion';
import { Flame, Clock, BookOpen, Target, TrendingUp, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import PageTransition from '../components/PageTransition';
import { formatDuration } from '../utils/helpers';

export default function StatsPage() {
  const { stats } = useApp();

  const statCards = [
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${stats.currentStreak}`,
      unit: stats.currentStreak === 1 ? 'day' : 'days',
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: TrendingUp,
      label: 'Longest Streak',
      value: `${stats.longestStreak}`,
      unit: stats.longestStreak === 1 ? 'day' : 'days',
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Target,
      label: 'Sessions Completed',
      value: `${stats.totalSessions}`,
      unit: '',
      color: 'from-brand-400 to-brand-600',
    },
    {
      icon: Clock,
      label: 'Total Reading Time',
      value: formatDuration(stats.totalReadingTime),
      unit: '',
      color: 'from-violet-400 to-purple-600',
    },
    {
      icon: BookOpen,
      label: 'Pages Read',
      value: `${stats.totalPagesRead}`,
      unit: '',
      color: 'from-rose-400 to-pink-600',
    },
    {
      icon: Calendar,
      label: 'Reading Days',
      value: `${stats.readingDays.length}`,
      unit: '',
      color: 'from-cyan-400 to-blue-500',
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
            Your Stats
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Every page counts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {statCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft p-4 sm:p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
                {card.value}
              </p>
              {card.unit && (
                <span className="text-sm text-surface-400 ml-1">{card.unit}</span>
              )}
              <p className="text-xs text-surface-400 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {stats.totalSessions === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-surface-400 dark:text-surface-500">
              Complete your first session to see your stats.
            </p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
