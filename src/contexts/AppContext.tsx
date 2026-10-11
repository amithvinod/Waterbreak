import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, ReadingSession, ReadingStats, AppSettings, SessionDifficulty } from '../types';
import * as db from '../storage/db';
import { calculateStreak, getDateString } from '../utils/helpers';

interface AppContextType {
  books: Book[];
  sessions: ReadingSession[];
  settings: AppSettings;
  stats: ReadingStats;
  activeSession: ReadingSession | null;
  currentBook: Book | null;
  loading: boolean;
  refreshBooks: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addBook: (book: Book) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  updateBookPage: (bookId: string, page: number) => Promise<void>;
  setCurrentBook: (book: Book | null) => void;
  startSession: (bookId: string, difficulty: SessionDifficulty, targetPage: number) => Promise<ReadingSession>;
  endSession: (sessionId: string, endingPage: number, completed: boolean) => Promise<void>;
  setActiveSession: (session: ReadingSession | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    readingTheme: 'light',
    defaultDifficulty: 'normal',
  });
  const [activeSession, setActiveSession] = useState<ReadingSession | null>(null);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReadingStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    totalReadingTime: 0,
    totalPagesRead: 0,
    readingDays: [],
  });

  const calculateStats = useCallback((allSessions: ReadingSession[]) => {
    const completedSessions = allSessions.filter(s => s.completed);
    const readingDays = completedSessions.map(s => getDateString(s.startTime));
    const { current, longest } = calculateStreak(readingDays);
    
    const totalReadingTime = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPagesRead = allSessions.reduce((sum, s) => {
      if (s.endingPage !== null) {
        return sum + Math.max(0, s.endingPage - s.startingPage);
      }
      return sum;
    }, 0);

    setStats({
      currentStreak: current,
      longestStreak: longest,
      totalSessions: completedSessions.length,
      totalReadingTime,
      totalPagesRead,
      readingDays: [...new Set(readingDays)],
    });
  }, []);

  const refreshBooks = useCallback(async () => {
    try {
      const allBooks = await db.getAllBooks();
      setBooks(allBooks);
    } catch (e) {
      console.error('Failed to load books', e);
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const allSessions = await db.getAllSessions();
      setSessions(allSessions);
      calculateStats(allSessions);
      
      const active = allSessions.find(s => s.endTime === null);
      if (active) {
        setActiveSession(active);
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  }, [calculateStats]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshBooks(), refreshSessions()]);
      const loadedSettings = await db.getSettings();
      setSettings(loadedSettings);
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  }, [refreshBooks, refreshSessions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addBook = useCallback(async (book: Book) => {
    await db.saveBook(book);
    await refreshBooks();
  }, [refreshBooks]);

  const removeBook = useCallback(async (id: string) => {
    await db.deleteBook(id);
    if (currentBook?.id === id) {
      setCurrentBook(null);
    }
    await refreshBooks();
    await refreshSessions();
  }, [currentBook, refreshBooks, refreshSessions]);

  const updateBookPage = useCallback(async (bookId: string, page: number) => {
    await db.updateBookProgress(bookId, page);
    const updatedBook = await db.getBook(bookId);
    if (updatedBook) {
      setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
      if (currentBook?.id === bookId) {
        setCurrentBook(updatedBook);
      }
    }
  }, [currentBook]);

  const startSession = useCallback(async (bookId: string, difficulty: SessionDifficulty, targetPage: number) => {
    const book = await db.getBook(bookId);
    if (!book) throw new Error('Book not found');

    const session: ReadingSession = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      bookId,
      startTime: Date.now(),
      endTime: null,
      startingPage: book.currentPage,
      targetPage,
      endingPage: null,
      duration: 0,
      completed: false,
      difficulty,
    };

    await db.saveSession(session);
    setActiveSession(session);
    await refreshSessions();
    return session;
  }, [refreshSessions]);

  const endSession = useCallback(async (sessionId: string, endingPage: number, completed: boolean) => {
    const allSessions = await db.getAllSessions();
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    const endTime = Date.now();
    const duration = Math.round((endTime - session.startTime) / 1000);

    const updatedSession: ReadingSession = {
      ...session,
      endTime,
      endingPage,
      duration,
      completed,
    };

    await db.saveSession(updatedSession);
    
    // Update book reading time
    await db.updateBookProgress(session.bookId, endingPage, duration);
    
    setActiveSession(null);
    await refreshBooks();
    await refreshSessions();
  }, [refreshBooks, refreshSessions]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await db.saveSettings(updated);
  }, [settings]);

  return (
    <AppContext.Provider
      value={{
        books,
        sessions,
        settings,
        stats,
        activeSession,
        currentBook,
        loading,
        refreshBooks,
        refreshSessions,
        refreshAll,
        addBook,
        removeBook,
        updateBookPage,
        setCurrentBook,
        startSession,
        endSession,
        setActiveSession,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
