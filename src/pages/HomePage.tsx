import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Clock, BookOpen, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import PageTransition from '../components/PageTransition';
import ProgressBar from '../components/ProgressBar';
import { getGreeting, formatDuration } from '../utils/helpers';

export default function HomePage() {
  const { books, stats, loading } = useApp();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  const lastBook = books.length > 0 ? books[0] : null;
  const lastBookProgress = lastBook && lastBook.totalPages > 0
    ? (lastBook.currentPage / lastBook.totalPages) * 100
    : 0;

  if (loading) return null;

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
            {greeting}
          </h1>
          <p className="text-surface-400 dark:text-surface-500 mt-1 text-sm">
            Don't read more. Just don't quit.
          </p>
        </motion.div>

        {/* Streak card */}
        {stats.currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">
                {stats.currentStreak} day streak
              </p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Keep it going.
              </p>
            </div>
          </motion.div>
        )}

        {/* Continue reading card */}
        {lastBook && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-3">
              Continue Reading
            </h2>
            <button
              onClick={() => navigate(`/reader/${lastBook.id}`)}
              className="w-full text-left"
              aria-label={`Continue reading ${lastBook.title}`}
            >
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
                <div className="flex gap-4 p-4 sm:p-5">
                  {/* Mini cover */}
                  <div className="w-16 sm:w-20 aspect-[3/4] rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <BookOpen className="w-6 h-6 text-white/40" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate text-base">
                      {lastBook.title}
                    </h3>
                    <p className="text-sm text-surface-400 mt-0.5">
                      Page {lastBook.currentPage} of {lastBook.totalPages}
                    </p>
                    <div className="mt-3">
                      <ProgressBar progress={lastBookProgress} size="sm" showLabel />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20 transition-colors">
                      <ArrowRight className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* Start session card */}
        {lastBook && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-3">
              Today's Reading
            </h2>
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-lg">
                    15–20 min
                  </h3>
                  <p className="text-sm text-surface-400 dark:text-surface-500 mt-1 leading-relaxed">
                    Your stopping point will be chosen for you.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/session-setup/${lastBook.id}`)}
                className="w-full mt-5 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors text-base"
              >
                Start Session
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Quick stats */}
        {(stats.totalSessions > 0 || stats.totalReadingTime > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-3">
              Your Progress
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft p-4 text-center">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {stats.totalSessions}
                </p>
                <p className="text-[11px] text-surface-400 mt-0.5">Sessions</p>
              </div>
              <div className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft p-4 text-center">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {formatDuration(stats.totalReadingTime)}
                </p>
                <p className="text-[11px] text-surface-400 mt-0.5">Read</p>
              </div>
              <div className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft p-4 text-center">
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  {stats.totalPagesRead}
                </p>
                <p className="text-[11px] text-surface-400 mt-0.5">Pages</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {books.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-surface-300 dark:text-surface-600" />
            </div>
            <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
              Your library is empty
            </h3>
            <p className="text-surface-400 dark:text-surface-500 mb-6 max-w-xs mx-auto">
              Your next chapter starts here.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/library')}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors"
            >
              Add your first book
            </motion.button>
          </motion.div>
        )}

        {/* Recently added */}
        {books.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                Recently Added
              </h2>
              <button
                onClick={() => navigate('/library')}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {books.slice(1, 5).map((book) => {
                const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
                return (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/reader/${book.id}`)}
                    className="text-left group"
                  >
                    <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-2 overflow-hidden shadow-soft group-hover:shadow-soft-lg transition-all">
                      <BookOpen className="w-5 h-5 text-white/30" />
                    </div>
                    <p className="text-xs font-medium text-surface-700 dark:text-surface-300 truncate">
                      {book.title}
                    </p>
                    <div className="mt-1">
                      <ProgressBar progress={progress} size="sm" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
