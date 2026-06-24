import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Play, AlertCircle, BookOpen } from 'lucide-react';


const YoutubeIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }}
    {...props}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function VideoPracticer() {
  const [videoUrl, setVideoUrl] = useState(() => {
    return localStorage.getItem('lastVideoUrl') || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef([]);
  const activeIndexRef = useRef(-1);

  // Keep transcript ref updated so the interval callback always sees the newest data
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load YouTube IFrame Player API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize/Destroy Player when videoId changes
  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player', e);
        }
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event) => {
            // window.YT.PlayerState.PLAYING is 1
            if (event.data === 1) {
              startTimer();
            } else {
              stopTimer();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // In case the API is loading, wait for the global callback
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopTimer();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {
          console.error('Error destroying YT player in cleanup', e);
        }
      }
    };
  }, [videoId]);

  // Autoscroll to active line
  useEffect(() => {
    if (activeIndex >= 0) {
      const activeElement = document.getElementById(`seg-line-${activeIndex}`);
      const container = document.getElementById('transcript-container');
      if (activeElement && container) {
        const containerTop = container.getBoundingClientRect().top;
        const elementTop = activeElement.getBoundingClientRect().top;
        const scrollOffset = elementTop - containerTop - (container.clientHeight / 2) + (activeElement.clientHeight / 2);

        container.scrollBy({
          top: scrollOffset,
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex]);


  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        // Compensación de latencia (300ms). La API del reproductor en iframe reporta
        // el tiempo con retraso y los subtítulos autogenerados suelen venir un poco desfasados.
        const latencyCompensation = 0.3;
        const time = playerRef.current.getCurrentTime() + latencyCompensation;
        updateActiveIndex(time);
      }
    }, 200); // Check every 200ms
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const updateActiveIndex = (time) => {
    const list = transcriptRef.current;
    if (!list || list.length === 0) return;

    let foundIdx = -1;

    // 1. Try to find strict match
    for (let i = 0; i < list.length; i++) {
      const seg = list[i];
      if (time >= seg.start && time < seg.start + seg.duration) {
        foundIdx = i;
        break;
      }
    }

    // 2. Fallback: Find the last segment whose start time is <= current time
    if (foundIdx === -1) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (time >= list[i].start) {
          foundIdx = i;
          break;
        }
      }
    }

    if (foundIdx !== -1 && foundIdx !== activeIndexRef.current) {
      activeIndexRef.current = foundIdx;
      setActiveIndex(foundIdx);
    }
  };

  const handleFetchTranscript = async (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setLoading(true);
    setError(null);
    setTranscript([]);
    setActiveIndex(-1);
    activeIndexRef.current = -1;

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/video/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ocurrió un error al procesar el video.');
      }

      setVideoId(data.video_id);
      setTranscript(data.segments);
      localStorage.setItem('lastVideoUrl', videoUrl);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = (time) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(time, true);
      // Force instant update of active index
      updateActiveIndex(time);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter transcript segments based on search input
  const filteredTranscript = transcript.map((seg, idx) => ({ ...seg, originalIndex: idx }))
    .filter(seg => seg.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Header Section */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
          Práctica de Comprensión con Vídeo
        </h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">
          Sigue la transcripción de videos en tiempo real y haz clic para escuchar.
        </p>
      </div>

      {/* URL Input Card */}
      <form onSubmit={handleFetchTranscript} className="p-5 sm:p-6 rounded-2xl bg-surface border border-border-custom shadow-sm flex flex-col gap-4">
        <div className="text-xs font-semibold text-text-secondary tracking-wider uppercase">
          <label htmlFor="youtube-url-input">
            Enlace de video de YouTube
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-grow">
            <YoutubeIcon 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px'
              }}
              className="text-text-muted"
            />
            <input
              id="youtube-url-input"
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Pega la URL de YouTube aquí (ej. https://www.youtube.com/watch?v=...)"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border-custom bg-app text-text-primary text-sm sm:text-base focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !videoUrl.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Cargando...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Iniciar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-error-custom/20 bg-error-light-custom/30 text-error-custom text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Main Workspace (Full Width Vertical View) */}
      {transcript.length > 0 && (
        <div className="flex flex-col gap-6">
          
          {/* Top panel: Player */}
          <div className="video-player-card">
            <div className="video-ratio-box">
              <div id="youtube-player"></div>
            </div>
          </div>


          {/* Bottom panel: Transcript */}
          <div className="transcript-card full-width">
            <div className="transcript-header-bar">
              <h3 className="card-title corrected" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} />
                <span>Transcripción Sincronizada</span>
              </h3>
              
              {/* Word search filter */}
              <div style={{ position: 'relative', width: '200px' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    width: '14px',
                    height: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar palabra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 8px 4px 28px',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>
            </div>

            {/* Scrollable Concatenated Container */}
            <div id="transcript-container" className="concatenated-transcript">
              {filteredTranscript.length > 0 ? (
                filteredTranscript.map((seg) => {
                  const isActive = seg.originalIndex <= activeIndex + 1;
                  return (
                    <span
                      key={seg.originalIndex}
                      id={`seg-line-${seg.originalIndex}`}
                      onClick={() => handleSeek(seg.start)}
                      className={`transcript-word-span ${isActive ? 'active' : ''}`}
                    >
                      {seg.text}{' '}
                    </span>
                  );
                })
              ) : (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {searchQuery ? 'No se encontraron fragmentos con esa palabra.' : 'Cargando transcripción...'}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
