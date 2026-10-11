import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book, ReadingSession, AppSettings } from '../types';

interface WaterBreakDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: { 'by-lastOpened': number };
  };
  sessions: {
    key: string;
    value: ReadingSession;
    indexes: { 'by-bookId': string; 'by-startTime': number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'waterbreak-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<WaterBreakDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<WaterBreakDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WaterBreakDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Books store
      if (!db.objectStoreNames.contains('books')) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('by-lastOpened', 'lastOpened');
      }

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-bookId', 'bookId');
        sessionStore.createIndex('by-startTime', 'startTime');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return dbInstance;
}

// Book operations
export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  const books = await db.getAll('books');
  return books.sort((a, b) => b.lastOpened - a.lastOpened);
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await getDB();
  return db.get('books', id);
}

export async function saveBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put('books', book);
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('books', id);
  // Also delete associated sessions
  const sessions = await getSessionsByBook(id);
  const tx = db.transaction('sessions', 'readwrite');
  for (const session of sessions) {
    await tx.store.delete(session.id);
  }
  await tx.done;
}

export async function updateBookProgress(id: string, currentPage: number, readingTime?: number): Promise<void> {
  const db = await getDB();
  const book = await db.get('books', id);
  if (book) {
    book.currentPage = currentPage;
    book.lastOpened = Date.now();
    if (readingTime) {
      book.totalReadingTime += readingTime;
    }
    await db.put('books', book);
  }
}

// Session operations
export async function getAllSessions(): Promise<ReadingSession[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

export async function getSessionsByBook(bookId: string): Promise<ReadingSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-bookId', bookId);
}

export async function saveSession(session: ReadingSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getActiveSession(): Promise<ReadingSession | undefined> {
  const db = await getDB();
  const sessions = await db.getAll('sessions');
  return sessions.find(s => s.endTime === null);
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'app-settings');
  return settings || {
    theme: 'system',
    readingTheme: 'light',
    defaultDifficulty: 'normal',
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'app-settings');
}
