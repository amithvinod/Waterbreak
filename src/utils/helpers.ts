import { SessionDifficulty, SessionConfig } from '../types';

export const SESSION_CONFIGS: Record<SessionDifficulty, SessionConfig> = {
  easy: {
    difficulty: 'easy',
    label: 'Easy',
    description: '10–15 minutes',
    minMinutes: 10,
    maxMinutes: 15,
  },
  normal: {
    difficulty: 'normal',
    label: 'Normal',
    description: '15–25 minutes',
    minMinutes: 15,
    maxMinutes: 25,
  },
  push: {
    difficulty: 'push',
    label: 'Push Me',
    description: '25–40 minutes',
    minMinutes: 25,
    maxMinutes: 40,
  },
};

// Average reading speed: ~1.5 minutes per page (conservative estimate)
const AVG_MINUTES_PER_PAGE = 1.5;

export function calculateTargetPage(
  currentPage: number,
  totalPages: number,
  difficulty: SessionDifficulty
): number {
  const config = SESSION_CONFIGS[difficulty];
  const avgMinutes = (config.minMinutes + config.maxMinutes) / 2;
  const estimatedPages = Math.round(avgMinutes / AVG_MINUTES_PER_PAGE);
  
  // Add some randomness: ±2 pages
  const randomOffset = Math.floor(Math.random() * 5) - 2;
  let targetPage = currentPage + estimatedPages + randomOffset;
  
  // Ensure target is reasonable
  targetPage = Math.max(currentPage + 3, targetPage); // At least 3 pages
  targetPage = Math.min(totalPages, targetPage); // Don't exceed total
  
  return targetPage;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function getDateString(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toISOString().split('T')[0];
}

export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getQuitMessage(currentPage: number, targetPage: number): {
  title: string;
  message: string;
  subMessage: string;
} {
  const pagesLeft = targetPage - currentPage;
  
  if (pagesLeft <= 0) {
    return {
      title: 'Target complete.',
      message: 'You can stop here.',
      subMessage: "You've earned it.",
    };
  }
  
  if (pagesLeft === 1) {
    return {
      title: "You're one page away.",
      message: `Just 1 more page to go.`,
      subMessage: "You don't have to finish the book. Just finish this part.",
    };
  }
  
  if (pagesLeft <= 3) {
    return {
      title: "Almost there.",
      message: `Just ${pagesLeft} more pages.`,
      subMessage: "You don't have to finish the book. Just finish this part.",
    };
  }
  
  if (pagesLeft <= 5) {
    return {
      title: "You're close.",
      message: `${pagesLeft} pages to your target.`,
      subMessage: 'Finish this section, then you\'re done.',
    };
  }
  
  return {
    title: "You've made progress.",
    message: `${pagesLeft} pages to your target.`,
    subMessage: "Give it a little longer. You're doing well.",
  };
}

export function calculateStreak(readingDays: string[]): { current: number; longest: number } {
  if (readingDays.length === 0) return { current: 0, longest: 0 };
  
  const sorted = [...new Set(readingDays)].sort().reverse();
  const today = getDateString();
  const yesterday = getDateString(Date.now() - 86400000);
  
  // Check if streak includes today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) {
    // Calculate longest streak from history but current is 0
    return { current: 0, longest: calculateLongestStreak(sorted) };
  }
  
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1]);
    const currDate = new Date(sorted[i]);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
    if (diffDays === 1) {
      current++;
    } else {
      break;
    }
  }
  
  return { current, longest: Math.max(current, calculateLongestStreak(sorted)) };
}

function calculateLongestStreak(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;
  
  let longest = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]);
    const currDate = new Date(sortedDays[i]);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
    if (diffDays === 1) {
      currentStreak++;
      longest = Math.max(longest, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return longest;
}
