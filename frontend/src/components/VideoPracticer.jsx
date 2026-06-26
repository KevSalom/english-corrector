import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Clock, Play, AlertCircle, BookOpen, Bookmark, Trash2, X, Plus, ArrowLeft, Columns, Rows } from 'lucide-react';


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
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedVideos, setSavedVideos] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [videoTitleToSave, setVideoTitleToSave] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParam = searchParams.get('url') || '';
  const [isSideBySide, setIsSideBySide] = useState(true);

  const playerRef = useRef(null);

  const extractYoutubeVideoId = (url) => {
    if (!url) return "";
    const patterns = [
      /(?:v=|\/embed\/|\/shorts\/|\/youtu\.be\/|\/v\/|\/e\/|watch\?v(?:%3D|=))([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    return "";
  };

  const getYoutubeThumbnail = (url) => {
    const id = extractYoutubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };
  const timerRef = useRef(null);
  const transcriptRef = useRef([]);
  const activeIndexRef = useRef(-1);
  const scrollAnimRef = useRef(null);

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

  // Load saved videos on mount
  useEffect(() => {
    fetchSavedVideos();
  }, []);

  // Sync player state with URL search param
  useEffect(() => {
    if (urlParam) {
      setVideoUrl(urlParam);
      loadVideoFromUrl(urlParam);
    } else {
      // Clear player, transcript and url input if no URL param is present
      setVideoUrl('');
      setVideoId(null);
      setTranscript([]);
    }
  }, [urlParam]);

  const fetchSavedVideos = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/videos`);
      if (response.ok) {
        const data = await response.json();
        setSavedVideos(data);
      }
    } catch (err) {
      console.error('Error fetching saved videos:', err);
    }
  };

  const handleSaveVideoSubmit = async (e) => {
    e.preventDefault();
    if (!videoTitleToSave.trim() || !videoUrl.trim()) return;

    setSaveLoading(true);
    setSaveError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoTitleToSave.trim(),
          url: videoUrl.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Error al guardar el video.');
      }

      setSavedVideos((prev) => [data, ...prev]);
      setShowSaveModal(false);
      setVideoTitleToSave('');
      setVideoUrl('');
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Error de conexión.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteVideo = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar este video guardado?')) return;

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/videos/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSavedVideos((prev) => prev.filter((v) => v.id !== id));
      } else {
        const data = await response.json();
        alert(data.detail || 'Error al eliminar el video.');
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Error de conexión.');
    }
  };


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

  // Autoscroll to active line with custom smooth ease-out animation
  useEffect(() => {
    if (activeIndex >= 0) {
      const activeElement = document.getElementById(`seg-line-${activeIndex}`);
      const container = document.getElementById('transcript-container');
      if (activeElement && container) {
        const elementRect = activeElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate absolute position inside the scroll container (scroll-independent)
        const absoluteElementTop = elementRect.top - containerRect.top + container.scrollTop;
        
        // Center the active line (using 45% of container height to keep it slightly above the middle for better readability of next lines)
        const targetScrollTop = absoluteElementTop - (container.clientHeight * 0.45) + (elementRect.height / 2);
        
        // Cancel any active animation frame
        if (scrollAnimRef.current) {
          cancelAnimationFrame(scrollAnimRef.current);
        }

        const start = container.scrollTop;
        const change = targetScrollTop - start;
        const duration = 750; // 750ms for a very gentle and soft glide transition
        let startTime = null;

        const animate = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          
          // Easing: easeOutCubic (slows down gently at the end)
          const ease = 1 - Math.pow(1 - progress, 3);
          
          container.scrollTop = start + change * ease;

          if (timeElapsed < duration) {
            scrollAnimRef.current = requestAnimationFrame(animate);
          } else {
            scrollAnimRef.current = null;
          }
        };

        scrollAnimRef.current = requestAnimationFrame(animate);
      }
    }

    return () => {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    };
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

  const loadVideoFromUrl = async (urlToLoad) => {
    if (!urlToLoad.trim()) return;

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
        body: JSON.stringify({ url: urlToLoad }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ocurrió un error al procesar el video.');
      }

      setVideoId(data.video_id);
      setTranscript(data.segments);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTranscript = async (e) => {
    if (e) e.preventDefault();
    if (!videoUrl.trim()) return;
    setSearchParams({ url: videoUrl.trim() });
  };

  const handlePlaySavedVideo = async (savedVideo) => {
    setVideoUrl(savedVideo.url);
    setSearchParams({ url: savedVideo.url });
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

  const renderWorkspace = () => {
    const workspaceContainerClass = isSideBySide
      ? "grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-stretch text-left w-full animate-in fade-in duration-200"
      : "flex flex-col gap-6 text-left w-full animate-in fade-in duration-200";

    const playerContainerClass = "w-full border border-border-custom rounded-2xl overflow-hidden shadow-md bg-surface flex flex-col justify-center h-fit self-center";

    const transcriptContainerClass = isSideBySide
      ? "w-full bg-brand border border-brand/20 rounded-2xl shadow-md flex flex-col overflow-hidden h-full min-h-[350px]"
      : "w-full bg-brand border border-brand/20 rounded-2xl shadow-md flex flex-col overflow-hidden h-fit";

    const scrollAreaClass = isSideBySide
      ? "overflow-y-auto pt-10 px-6 pb-32 flex-grow h-[320px] lg:h-0 leading-[2] text-[1.25rem] font-semibold text-left select-none"
      : "overflow-y-auto pt-10 px-6 pb-32 h-[320px] lg:h-[350px] leading-[2] text-[1.55rem] font-semibold text-left select-none";

    return (
      <div className={workspaceContainerClass}>
        {/* Left column: Player */}
        <div className={playerContainerClass}>
          <div className="relative w-full pt-[56.25%] [&>iframe]:absolute [&>iframe]:top-0 [&>iframe]:left-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0">
            <div id="youtube-player" className="absolute top-0 left-0 w-full h-full border-0"></div>
          </div>
        </div>

        {/* Right column: Transcript */}
        <div className={transcriptContainerClass}>
          <div className="flex justify-between items-center py-5 px-6 border-b border-brand/10 bg-brand-hover shrink-0">
            <h3 className="text-white font-bold flex items-center gap-2 m-0 text-sm sm:text-base">
              <Clock className="w-4.5 h-4.5" />
              <span>Transcripción Sincronizada</span>
            </h3>
            
            {/* Word search filter */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar palabra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 pl-9 pr-3 py-1.5 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
              />
            </div>
          </div>

          {/* Scrollable Concatenated Container */}
          <div 
            id="transcript-container" 
            className={scrollAreaClass}
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)'
            }}
          >
            {filteredTranscript.length > 0 ? (
              filteredTranscript.map((seg) => {
                const isActive = seg.originalIndex <= activeIndex + 1;
                return (
                  <span
                    key={seg.originalIndex}
                    id={`seg-line-${seg.originalIndex}`}
                    onClick={() => handleSeek(seg.start)}
                    className={`inline cursor-pointer transition-all duration-150 ${
                      isActive 
                        ? 'text-white font-bold' 
                        : 'text-black/60 hover:text-white hover:underline'
                    }`}
                  >
                    {seg.text}{' '}
                  </span>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-white/70 text-sm py-12">
                {searchQuery ? 'No se encontraron fragmentos con esa palabra.' : 'Cargando transcripción...'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMenu = () => {
    return (
      <div className="flex flex-col gap-8 text-left animate-in fade-in duration-200">
        {/* Simplistic URL Input Card (Original design style) */}
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
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setVideoTitleToSave('');
                  setSaveError(null);
                  setShowSaveModal(true);
                }}
                disabled={loading || !videoUrl.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border-custom bg-surface hover:bg-surface-hover text-text-primary font-semibold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                <Bookmark className="w-4 h-4 text-brand" />
                <span>Guardar</span>
              </button>

              <button
                type="submit"
                disabled={loading || !videoUrl.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
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
          </div>
        </form>

        {/* Netflix-style visual library */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-xl text-text-primary m-0 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-brand" />
            <span>Mi Biblioteca de Videos</span>
          </h3>
          
          {savedVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {savedVideos.map((video) => {
                const thumb = getYoutubeThumbnail(video.url);
                return (
                  <div 
                    key={video.id}
                    onClick={() => handlePlaySavedVideo(video)}
                    className="group relative bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-brand/40 transition-all cursor-pointer flex flex-col h-full text-left"
                  >
                    {/* Thumbnail with hover effect */}
                    <div className="relative aspect-video bg-black/10 overflow-hidden shrink-0">
                      {thumb ? (
                        <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-light text-brand">
                          <Play className="w-8 h-8" />
                        </div>
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 bg-white text-brand rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-6 h-6 fill-current" />
                        </div>
                      </div>
                      
                      {/* Delete Button on card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVideo(video.id, e);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/60 text-white hover:bg-error-custom rounded-xl transition-colors cursor-pointer z-10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <h4 className="font-bold text-sm text-text-primary line-clamp-2 m-0 group-hover:text-brand transition-colors">{video.title}</h4>
                      <span className="text-xs text-brand font-bold bg-brand-light px-2.5 py-1 rounded-lg w-fit mt-3">Estudiar ahora</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-border-custom rounded-2xl bg-surface text-text-muted flex flex-col items-center gap-3">
              <Bookmark className="w-12 h-12 text-brand/30" />
              <div>
                <p className="font-semibold text-sm">Tu biblioteca de videos está vacía</p>
                <p className="text-xs text-text-muted mt-1">Pega un enlace de YouTube arriba y haz clic en "Guardar" para agregar tu primer video.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCine = () => {
    const isAlreadySaved = savedVideos.some(v => v.url === videoUrl);
    return (
      <div className="flex flex-col gap-6 text-left w-full animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-surface border border-border-custom p-4 rounded-2xl shadow-sm">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border-custom bg-app hover:bg-surface-hover text-text-primary font-bold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-brand" />
            <span>Volver a la Biblioteca</span>
          </button>

          <div className="flex gap-2 sm:gap-3 justify-between sm:justify-end">
            {/* Layout Toggle Button - Visible only on desktop screen size */}
            <button
              type="button"
              onClick={() => setIsSideBySide(!isSideBySide)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-border-custom bg-app hover:bg-surface-hover text-text-primary font-bold text-sm transition-colors cursor-pointer"
              title={isSideBySide ? "Ver apilado" : "Ver en paralelo"}
            >
              {isSideBySide ? (
                <>
                  <Rows className="w-4 h-4 text-brand" />
                  <span>Ver Apilado</span>
                </>
              ) : (
                <>
                  <Columns className="w-4 h-4 text-brand" />
                  <span>Ver en Paralelo</span>
                </>
              )}
            </button>
          
            {!isAlreadySaved && (
              <button
                type="button"
                onClick={() => {
                  setVideoTitleToSave('');
                  setSaveError(null);
                  setShowSaveModal(true);
                }}
                className="flex flex-grow lg:flex-grow-0 items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-light border border-brand/20 hover:bg-brand hover:text-white text-brand font-bold text-sm transition-all cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>Guardar este video</span>
              </button>
            )}
          </div>
        </div>

        {renderWorkspace()}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header Section */}
      {!videoId && (
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Práctica de Comprensión con Vídeo
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2">
            Sigue la transcripción de videos en tiempo real y haz clic para escuchar.
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-error-custom/20 bg-error-light-custom/30 text-error-custom text-sm text-left">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Render active view */}
      {loading ? (
        <div className="w-full py-24 flex flex-col items-center justify-center gap-4 text-center">
          <svg className="animate-spin h-10 w-10 text-brand" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div>
            <h3 className="font-bold text-lg text-text-primary">Obteniendo transcripción...</h3>
            <p className="text-xs text-text-muted mt-1 font-semibold">Estamos buscando y sincronizando los subtítulos en inglés del video.</p>
          </div>
        </div>
      ) : videoId ? (
        renderCine()
      ) : (
        renderMenu()
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-custom rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center py-4 px-6 border-b border-border-custom bg-surface-hover">
              <h3 className="text-text-primary font-bold flex items-center gap-2 m-0">
                <Bookmark className="w-4.5 h-4.5 text-brand" />
                <span>Guardar Enlace de Video</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-border-custom transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveVideoSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label htmlFor="video-title-input" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Nombre personalizado
                </label>
                <input
                  id="video-title-input"
                  type="text"
                  required
                  placeholder="Ej. Entrevista con Steve Jobs"
                  value={videoTitleToSave}
                  onChange={(e) => setVideoTitleToSave(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-custom bg-app text-text-primary text-sm focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Enlace a guardar</span>
                <span className="text-xs text-text-muted truncate bg-app px-3 py-2 rounded-lg border border-border-custom/50">
                  {videoUrl}
                </span>
              </div>
              
              {saveError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-error-custom/20 bg-error-light-custom/30 text-error-custom text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-2 border-t border-border-custom mt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-custom text-text-secondary hover:bg-surface-hover text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLoading || !videoTitleToSave.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {saveLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
