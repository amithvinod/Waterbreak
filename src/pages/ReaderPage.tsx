import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfjs } from '../utils/pdf';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import SessionProgress from '../components/SessionProgress';
import QuitModal from '../components/QuitModal';
import SessionComplete from '../components/SessionComplete';

export default function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, activeSession, updateBookPage, endSession } = useApp();
  const { readingTheme } = useTheme();

  const book = books.find((b) => b.id === bookId);
  const session = activeSession?.bookId === bookId ? activeSession : null;

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(book?.currentPage ?? 1);
  const [totalPages, setTotalPages] = useState(book?.totalPages ?? 0);
  const [rendering, setRendering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Default to full-screen reading mode: only the PDF page is visible
  const [showControls, setShowControls] = useState(false);
  const [pageBadgeVisible, setPageBadgeVisible] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch gesture tracking for iOS
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchEndRef = useRef<number>(0);

  // ── Handle screen resize / orientation change ──────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // ── Load PDF document from ArrayBuffer ──────────────────────────────────────
  useEffect(() => {
    if (!book?.fileData) return;

    let docRef: PDFDocumentProxy | null = null;
    setLoadError(null);

    const load = async () => {
      try {
        const copy = book.fileData.slice(0);
        const loadingTask = pdfjs.getDocument({ data: copy });
        docRef = await loadingTask.promise;
        setPdfDoc(docRef);
        setTotalPages(docRef.numPages);
      } catch (e) {
        console.error('PDF load error:', e);
        setLoadError('Could not load this PDF. The file may be damaged.');
      }
    };

    load();

    return () => {
      docRef?.destroy();
    };
  }, [book?.id]);

  // ── Render current page onto <canvas> ───────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      setRendering(true);

      try {
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d', { alpha: false })!;

        const availableWidth = wrapperRef.current?.clientWidth || window.innerWidth;
        const availableHeight = wrapperRef.current?.clientHeight || window.innerHeight;
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Fit page comfortably to viewport (fill width or height)
        const scaleW = availableWidth / unscaledViewport.width;
        const scaleH = availableHeight / unscaledViewport.height;
        const baseScale = Math.min(scaleW, scaleH);
        const viewport = page.getViewport({ scale: baseScale * scale });

        // Cap DPR to 2.5 to prevent memory issues on iOS devices
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const task = page.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        renderTaskRef.current = task;

        await task.promise;
        page.cleanup();
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') {
          console.error('Render error:', e);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    render();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdfDoc, currentPage, scale, viewportDimensions]);

  // ── Show subtle brief page badge on page change ─────────────────────────────
  useEffect(() => {
    if (!showControls) {
      setPageBadgeVisible(true);
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      badgeTimerRef.current = setTimeout(() => {
        setPageBadgeVisible(false);
      }, 1400);
    }
    return () => {
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    };
  }, [currentPage, showControls]);

  // ── Persist progress ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!book || currentPage === book.currentPage) return;
    updateBookPage(book.id, currentPage);

    if (session && !session.completed && currentPage >= session.targetPage && !showCompleteScreen) {
      setShowCompleteScreen(true);
    }
  }, [currentPage]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      window.scrollTo(0, 0);
    }
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      window.scrollTo(0, 0);
    }
  }, [currentPage]);

  const handleExit = useCallback(() => {
    if (session && !session.completed && currentPage < session.targetPage) {
      setShowQuitModal(true);
    } else if (session && !session.completed && currentPage >= session.targetPage) {
      handleDone();
    } else {
      navigate('/');
    }
  }, [session, currentPage, navigate]);

  const handleDone = async () => {
    if (session) await endSession(session.id, currentPage, true);
    setShowCompleteScreen(false);
    navigate('/');
  };

  const handleKeepReading = () => {
    if (session && currentPage >= session.targetPage) {
      endSession(session.id, currentPage, true);
      setShowCompleteScreen(false);
    }
    setShowQuitModal(false);
  };

  const handleEndEarly = async () => {
    if (session) await endSession(session.id, currentPage, false);
    navigate('/');
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // ── Controls toggle & auto-hide ─────────────────────────────────────────────
  const hideControls = useCallback(() => {
    setShowControls(false);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
  }, []);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => {
      if (prev) {
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        return false;
      } else {
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3500);
        return true;
      }
    });
  }, []);

  // ── Touch and Gesture Handlers (iOS optimized) ──────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    lastTouchEndRef.current = Date.now();

    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStartRef.current.x;
    const deltaY = t.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // 1. SWIPE LEFT TO RIGHT -> Escapes/Exits reader (as requested)
    if (deltaX > 55 && Math.abs(deltaY) < 65 && deltaTime < 600) {
      touchStartRef.current = null;
      handleExit();
      return;
    }

    // 2. TAP (minimal movement)
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      const screenWidth = window.innerWidth;
      const tapX = t.clientX;
      const ratio = tapX / screenWidth;

      if (showControls) {
        // If notification / control bar is showing, tap dismisses it immediately (goes up)
        hideControls();
      } else {
        if (ratio < 0.35) {
          // Tap left -> Previous page
          goPrev();
        } else if (ratio > 0.65) {
          // Tap right -> Next page
          goNext();
        } else {
          // Tap center -> Toggle controls
          toggleControls();
        }
      }
    }

    touchStartRef.current = null;
  };

  // ── Desktop Click Handler (Fallback for mouse) ──────────────────────────────
  const handleClick = (e: React.MouseEvent) => {
    // Prevent synthetic click from firing after touch
    if (Date.now() - lastTouchEndRef.current < 500) return;

    const screenWidth = window.innerWidth;
    const clickX = e.clientX;
    const ratio = clickX / screenWidth;

    if (showControls) {
      hideControls();
    } else {
      if (ratio < 0.35) {
        goPrev();
      } else if (ratio > 0.65) {
        goNext();
      } else {
        toggleControls();
      }
    }
  };

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft')               { e.preventDefault(); goPrev(); }
      else if (e.key === '=' || e.key === '+')      { e.preventDefault(); setScale(s => Math.min(s + 0.2, 3)); }
      else if (e.key === '-')                       { e.preventDefault(); setScale(s => Math.max(s - 0.2, 0.5)); }
      else if (e.key === 'Escape')                  { if (isFullscreen) document.exitFullscreen(); else handleExit(); }
    };

    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [goNext, goPrev, handleExit, isFullscreen]);

  if (!book) return null;

  // ── Theme Background (Eliminate all blue outlines) ──────────────────────────
  // Light: pure white matching book page; Dark: deep black; Sepia: warm tone
  const bgClass =
    readingTheme === 'dark'  ? 'bg-black' :
    readingTheme === 'sepia' ? 'bg-[#fdf8f0]' : 'bg-white';

  const canvasClass =
    readingTheme === 'dark'  ? 'brightness-[0.87] contrast-[1.05]' :
    readingTheme === 'sepia' ? 'sepia-[0.25] brightness-[0.96]'    : '';

  return (
    <div
      className={`fixed inset-0 w-full h-[100dvh] flex flex-col ${bgClass} transition-colors duration-300 overflow-hidden select-none reader-container`}
    >
      {/* ── Top Bar (Slides up/down, styled with iOS safe-area-inset-top) ── */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            key="topbar"
            initial={{ opacity: 0, y: -70 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -70 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4
                       pt-[env(safe-area-inset-top,0px)] h-[calc(3.5rem+env(safe-area-inset-top,0px))]
                       bg-white/95 dark:bg-black/95 backdrop-blur-md
                       border-b border-slate-200/80 dark:border-white/10 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExit}
                className="w-10 h-10 flex items-center justify-center rounded-full
                           hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors"
                aria-label="Exit reader"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-sm text-slate-900 dark:text-slate-100 hidden sm:block truncate max-w-[220px]">
                {book.title}
              </h1>
            </div>

            {/* Mobile Title */}
            <div className="sm:hidden text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
              {book.title}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={() => setScale(s => Math.min(s + 0.2, 3))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mx-1 min-w-[55px] text-center tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={toggleFullscreen}
                className="hidden md:flex w-8 h-8 items-center justify-center rounded-full
                           hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── PDF Canvas Viewport (Edge-to-edge pure PDF view) ── */}
      <div
        ref={wrapperRef}
        className={`flex-1 flex items-center justify-center w-full h-[100dvh] ${scale > 1 ? 'overflow-auto' : 'overflow-hidden'} relative`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <p className="text-red-500 font-medium">{loadError}</p>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Go back
            </button>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 dark:bg-black/30 backdrop-blur-[1px]">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={`block max-w-full max-h-[100dvh] ${canvasClass}`}
            />
          </div>
        )}
      </div>

      {/* ── Minimal Page Number Toast on Page Turn (Non-intrusive) ── */}
      <AnimatePresence>
        {!showControls && pageBadgeVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none
                       px-3 py-1 rounded-full text-xs font-medium tabular-nums
                       bg-black/60 text-white/95 dark:bg-white/20 dark:text-white backdrop-blur-sm shadow-sm"
          >
            {currentPage} / {totalPages}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session Progress Chip (Visible when controls toggled) ── */}
      <AnimatePresence>
        {showControls && session && !session.completed && (
          <motion.div
            key="session-progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <SessionProgress
              currentPage={currentPage}
              targetPage={session.targetPage}
              startingPage={session.startingPage}
              className="bg-white/95 dark:bg-zinc-900/95 shadow-xl border border-slate-200 dark:border-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Nav (Slides down/up, styled with iOS safe-area-inset-bottom) ── */}
      <AnimatePresence>
        {showControls && (
          <motion.nav
            key="bottomnav"
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 70 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-6 px-6
                       pb-[env(safe-area-inset-bottom,0px)] h-[calc(4rem+env(safe-area-inset-bottom,0px))]
                       bg-white/95 dark:bg-black/95 backdrop-blur-md
                       border-t border-slate-200/80 dark:border-white/10 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="prev-page-btn"
              onClick={goPrev}
              disabled={currentPage <= 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full
                         bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20
                         text-slate-900 dark:text-slate-100
                         disabled:opacity-30 transition-colors font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {currentPage} of {totalPages}
            </span>

            <button
              id="next-page-btn"
              onClick={goNext}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full
                         bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20
                         text-slate-900 dark:text-slate-100
                         disabled:opacity-30 transition-colors font-medium text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Quit Modal ── */}
      {session && (
        <QuitModal
          isOpen={showQuitModal}
          currentPage={currentPage}
          targetPage={session.targetPage}
          bookTitle={book.title}
          onKeepReading={handleKeepReading}
          onEndSession={handleEndEarly}
        />
      )}

      {/* ── Session Complete Screen ── */}
      {session && showCompleteScreen && (
        <SessionComplete
          isOpen={showCompleteScreen}
          bookTitle={book.title}
          duration={Math.round((Date.now() - session.startTime) / 1000)}
          pagesRead={currentPage - session.startingPage}
          onDone={handleDone}
          onKeepReading={handleKeepReading}
        />
      )}
    </div>
  );
}
