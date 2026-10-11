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
  const [showControls, setShowControls] = useState(true);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load PDF document from ArrayBuffer ──────────────────────────────────────
  useEffect(() => {
    if (!book?.fileData) return;

    let docRef: PDFDocumentProxy | null = null;
    setLoadError(null);

    const load = async () => {
      try {
        // Clone the buffer so pdfjs owns its own copy
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  // ── Render the current page onto <canvas> ───────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      // Cancel any in-flight render
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

        // Fit to wrapper width
        const wrapperWidth = wrapperRef.current?.clientWidth ?? window.innerWidth;
        const baseScale = Math.min((wrapperWidth - 32) / page.getViewport({ scale: 1 }).width, 1.6);
        const viewport = page.getViewport({ scale: baseScale * scale });

        const dpr = window.devicePixelRatio || 1;
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
  }, [pdfDoc, currentPage, scale]);

  // ── Persist progress ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!book || currentPage === book.currentPage) return;
    updateBookPage(book.id, currentPage);

    if (session && !session.completed && currentPage >= session.targetPage && !showCompleteScreen) {
      setShowCompleteScreen(true);
    }
  }, [currentPage]);

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
      if (!document.fullscreenElement) setShowControls(true);
    };

    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [currentPage, totalPages, isFullscreen]);

  // ── Controls auto-hide ───────────────────────────────────────────────────────
  const bumpControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (document.fullscreenElement) setShowControls(false);
    }, 3000);
  }, []);

  if (!book) return null;

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goNext = () => { if (currentPage < totalPages) { setCurrentPage(p => p + 1); window.scrollTo(0, 0); } };
  const goPrev = () => { if (currentPage > 1)          { setCurrentPage(p => p - 1); window.scrollTo(0, 0); } };

  const handleExit = () => {
    if (session && !session.completed && currentPage < session.targetPage) setShowQuitModal(true);
    else if (session && !session.completed && currentPage >= session.targetPage) handleDone();
    else navigate('/');
  };

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

  const toggleFullscreen = () =>
    document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen().catch(() => {});

  // ── Theme ────────────────────────────────────────────────────────────────────
  const bgClass =
    readingTheme === 'dark'  ? 'bg-[#0f172a]' :
    readingTheme === 'sepia' ? 'bg-[#fdf8f0]' : 'bg-[#f1f5f9]';

  const canvasClass =
    readingTheme === 'dark'  ? 'brightness-[0.87] contrast-[1.05]' :
    readingTheme === 'sepia' ? 'sepia-[0.25] brightness-[0.96]'    : '';

  return (
    <div
      className={`min-h-[100dvh] flex flex-col ${bgClass} transition-colors duration-300`}
      onClick={bumpControls}
    >
      {/* ── Top bar ── */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            key="topbar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50
                       bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md
                       border-b border-slate-200 dark:border-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExit}
                className="w-9 h-9 flex items-center justify-center rounded-full
                           hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Exit reader"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="font-semibold text-sm text-slate-900 dark:text-slate-100 hidden sm:block truncate max-w-[220px]">
                {book.title}
              </h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => setScale(s => Math.min(s + 0.2, 3))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-xs font-medium text-slate-500 mx-2 min-w-[60px] text-center tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={toggleFullscreen}
                className="hidden md:flex w-8 h-8 items-center justify-center rounded-full
                           hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Canvas area ── */}
      <div
        ref={wrapperRef}
        className="flex-1 flex flex-col items-center pt-16 pb-24 px-4 overflow-y-auto"
        onClick={bumpControls}
      >
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <p className="text-red-500 font-medium">{loadError}</p>
            <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-slate-600">
              Go back
            </button>
          </div>
        ) : (
          <div className="relative inline-block">
            {/* Loading spinner overlay */}
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/40 dark:bg-black/30 rounded-lg">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={`block rounded-lg shadow-xl ${canvasClass}`}
              style={{ maxWidth: '100%' }}
            />
          </div>
        )}
      </div>

      {/* ── Session progress chip ── */}
      <AnimatePresence>
        {session && !session.completed && (
          <motion.div
            key="session-progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <SessionProgress
              currentPage={currentPage}
              targetPage={session.targetPage}
              startingPage={session.startingPage}
              className="bg-white/85 dark:bg-slate-800/85 shadow-xl border border-slate-200 dark:border-slate-700/50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom nav ── */}
      <AnimatePresence>
        {showControls && (
          <motion.nav
            key="bottomnav"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-center gap-6 px-6 z-50
                       bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md
                       border-t border-slate-200 dark:border-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="prev-page-btn"
              onClick={goPrev}
              disabled={currentPage <= 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full
                         bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
                         text-slate-900 dark:text-slate-100
                         disabled:opacity-30 transition-colors font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              id="next-page-btn"
              onClick={goNext}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full
                         bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
                         text-slate-900 dark:text-slate-100
                         disabled:opacity-30 transition-colors font-medium text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Quit modal ── */}
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

      {/* ── Session complete ── */}
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
