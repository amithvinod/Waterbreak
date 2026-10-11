export interface Book {
  id: string;
  title: string;
  fileName: string;
  totalPages: number;
  currentPage: number;
  dateAdded: number;
  lastOpened: number;
  totalReadingTime: number; // in seconds
  fileData: ArrayBuffer;
  coverImageUrl?: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  startTime: number;
  endTime: number | null;
  startingPage: number;
  targetPage: number;
  endingPage: number | null;
  duration: number; // in seconds
  completed: boolean;
  difficulty: SessionDifficulty;
}

export type SessionDifficulty = 'easy' | 'normal' | 'push';

export interface SessionConfig {
  difficulty: SessionDifficulty;
  label: string;
  description: string;
  minMinutes: number;
  maxMinutes: number;
}

export interface ReadingStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalReadingTime: number; // in seconds
  totalPagesRead: number;
  readingDays: string[]; // ISO date strings
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  readingTheme: 'light' | 'dark' | 'sepia';
  defaultDifficulty: SessionDifficulty;
}

export type ThemeMode = 'light' | 'dark' | 'sepia';
