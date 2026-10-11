import { motion } from 'framer-motion';
import { BookOpen, MoreVertical, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../types';
import ProgressBar from './ProgressBar';

interface BookCardProps {
  book: Book;
  onRemove: (id: string) => void;
  index?: number;
}

const COVER_COLORS = [
  'from-indigo-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-sky-500 to-indigo-600',
];

function getCoverColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}

export default function BookCard({ book, onRemove, index = 0 }: BookCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
  const coverColor = getCoverColor(book.id);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
    >
      <button
        onClick={() => navigate(`/reader/${book.id}`)}
        className="w-full text-left"
        aria-label={`Open ${book.title}`}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-800 shadow-soft hover:shadow-soft-lg transition-all duration-300 border border-surface-100 dark:border-surface-700/50">
          {/* Book cover */}
          <div className={`aspect-[3/4] bg-gradient-to-br ${coverColor} relative overflow-hidden`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <BookOpen className="w-8 h-8 text-white/40 mb-3" />
              <p className="text-white font-semibold text-sm leading-tight line-clamp-3 px-2">
                {book.title}
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-[40px]" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/5 rounded-tr-[40px]" />
          </div>

          {/* Book info */}
          <div className="p-3">
            <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">
              {book.title}
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">
              Page {book.currentPage} of {book.totalPages}
            </p>
            <div className="mt-2">
              <ProgressBar progress={progress} size="sm" />
            </div>
          </div>
        </div>
      </button>

      {/* Menu button */}
      <div className="absolute top-2 right-2 z-10" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Book options"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
        
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-10 bg-white dark:bg-surface-800 rounded-xl shadow-soft-lg border border-surface-200 dark:border-surface-700 overflow-hidden min-w-[140px]"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(book.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
