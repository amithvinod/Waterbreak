import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, AlertCircle } from 'lucide-react';
import { getPdfInfo } from '../utils/pdf';
import { useApp } from '../contexts/AppContext';
import BookCard from '../components/BookCard';
import EmptyState from '../components/EmptyState';
import PageTransition from '../components/PageTransition';
import { titleFromFilename, generateId } from '../utils/helpers';

export default function LibraryPage() {
  const { books, addBook, removeBook } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { numPages, title: pdfTitle } = await getPdfInfo(arrayBuffer);
      const title = pdfTitle ?? titleFromFilename(file.name);

      const book = {
        id: generateId(),
        title,
        fileName: file.name,
        totalPages: numPages,
        currentPage: 1,
        dateAdded: Date.now(),
        lastOpened: Date.now(),
        totalReadingTime: 0,
        fileData: arrayBuffer,
      };

      await addBook(book);
    } catch (err) {
      console.error('PDF import error:', err);
      setError('Failed to import PDF. The file may be corrupted or unsupported.');
    } finally {
      setImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Remove this book from your library?')) {
      await removeBook(id);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
              Library
            </h1>

            <p className="text-sm text-surface-400 mt-1">
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors shadow-soft disabled:opacity-50"
            aria-label="Add book"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Book</span>
          </motion.button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleImport}
          className="hidden"
          aria-label="Choose PDF file"
        />

        {/* Loading state */}
        {importing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-2xl"
          >
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />

            <p className="text-sm text-brand-700 dark:text-brand-300 font-medium">
              Importing PDF...
            </p>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />

            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>

            <button
              onClick={() => setError(null)}
              className="ml-auto text-xs text-red-400 hover:text-red-600 font-medium"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Books grid */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                onRemove={handleRemove}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Your library is empty"
            description="Your next chapter starts here."
            action={{
              label: 'Add your first book',
              onClick: () => fileInputRef.current?.click(),
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}