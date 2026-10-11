import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, BookOpen } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import PageTransition from '../components/PageTransition';
import { SessionDifficulty } from '../types';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useApp();

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const difficultyOptions: { value: SessionDifficulty; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'normal', label: 'Normal' },
    { value: 'push', label: 'Push Me' },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
            Settings
          </h1>
        </div>

        {/* Appearance */}
        <section>
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
            Appearance
          </h2>
          <div className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft overflow-hidden">
            <div className="p-4">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-3">
                Theme
              </p>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      theme === option.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                    }`}
                    aria-label={`Set ${option.label} theme`}
                    aria-pressed={theme === option.value}
                  >
                    <option.icon className={`w-5 h-5 ${
                      theme === option.value
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-surface-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      theme === option.value
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-surface-500'
                    }`}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reading */}
        <section>
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
            Reading
          </h2>
          <div className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft overflow-hidden">
            <div className="p-4">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-3">
                Default Session Difficulty
              </p>
              <div className="grid grid-cols-3 gap-2">
                {difficultyOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => updateSettings({ defaultDifficulty: option.value })}
                    className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      settings.defaultDifficulty === option.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300'
                    }`}
                    aria-label={`Set default difficulty to ${option.label}`}
                    aria-pressed={settings.defaultDifficulty === option.value}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
            About
          </h2>
          <div className="rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/50 shadow-soft overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-surface-100">
                  WaterBreak
                </p>
                <p className="text-xs text-surface-400 mt-0.5">
                  Version 1.0 · Don't read more. Just don't quit.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center pb-8">
          <p className="text-xs text-surface-300 dark:text-surface-600">
            All data is stored locally on your device.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
