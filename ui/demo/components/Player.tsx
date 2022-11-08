import { DocumentContext, TransformContext } from '@allenai/pdf-components';
import * as React from 'react';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';

import { Caption, Clip, Highlight } from '../types/clips';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

import { PlayerTimeline } from './PlayerTimeline';

interface Props {
  doi: string;
  id: number;
  top: number;
  left?: number;
  clip: Clip;
  clips: Array<Clip>;
  highlights: Array<Highlight>;
  isFocus: boolean;
  isOverlay: boolean;
  isPhantom: boolean;
  handleNavigate?: (fromId: number, toId: number, type: string) => void;
  navigateToPosition?: (clipId: number, highlightIdx: number) => void;
  toggleCaptions?: (clipId: number, isExpand: boolean) => void;
  toggleAltHighlights?: (clipId: number, isShow: boolean) => void;
  scrubPosition: number;
  videoWidth: number;
  playedHistory: Array<number>;
  updatePlayedHistory?: (clipId: number) => void;
  setFocusId?: (clipId: number) => void;
  hoveredWord?: { clipId: number; syncIdx: number } | null;
  setHoveredWord?: (data: { clipId: number; syncIdx: number } | null) => void;
  sections?: { [id: number]: string };
  syncSegments?: { paperToIdx: { [id: string]: number }; captionToIdx: { [id: string]: number } };
  playbackRate?: number;
  setPlaybackRate?: (rate: number) => void;
  autoplay?: boolean;
  setAutoplay?: (autoplay: boolean) => void;
  logAction?: (action: string, data: any) => void;
  setTooltip?: (id: number, event: React.MouseEvent, type: string | null) => void;
}

const colors = ['#cb725e', '#d9a460', '#3e9d29', '#306ed3', '#07cead', '#9d58e1', '#dd59ba'];

function timeToStr(time: number) {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return (min < 10 ? '0' + min : min) + ':' + (sec < 10 ? '0' + sec : sec);
}

export function Player({
  doi,
  id,
  top,
  left,
  clip,
  clips,
  highlights,
  isFocus,
  isOverlay,
  isPhantom,
  handleNavigate,
  navigateToPosition,
  toggleCaptions,
  toggleAltHighlights,
  scrubPosition,
  videoWidth,
  playedHistory,
  updatePlayedHistory,
  setFocusId,
  hoveredWord,
  setHoveredWord,
  sections,
  syncSegments,
  playbackRate,
  setPlaybackRate,
  autoplay,
  setAutoplay,
  logAction,
  setTooltip,
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [pushable, setPushable] = React.useState(false);

  const [isHovered, setIsHovered] = React.useState(false);

  const [hoveredWordId, setHoveredWordId] = React.useState<number>(-1);
  const [ended, setEnded] = React.useState(false);

  const videoRef = React.useRef<ReactPlayerProps>(null);

  // Update progress (current time) as video plays
  const updateProgress = (e: any) => {
    if (videoRef.current && isPlaying) {
      const currentTime = e.playedSeconds;
      setProgress(currentTime);

      if (currentTime < duration) {
        setEnded(false);
      } else {
        setEnded(true);
      }
    }
  };

  // If not navigating, let the clip be "pushable" (change top)
  React.useEffect(() => {
    if (!isOverlay) setPushable(true);
    else setPushable(false);
  }, [top]);

  React.useEffect(() => {
    if (isFocus && videoRef.current) {
      videoRef.current.seekTo(0, 'fraction');
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isFocus]);

  React.useEffect(() => {
    if (scrubPosition != -1 && !isPlaying && videoRef.current) {
      videoRef.current.seekTo(scrubPosition, 'fraction');
      setProgress(scrubPosition * duration);
    }
  }, [scrubPosition]);

  function handleNavigateWrapper(fromId: number, toId: number) {
    if (handleNavigate) handleNavigate(fromId, toId, 'timeline');
  }

  // Navigate to another highlight in the paper
  function handleSideClick(e: React.MouseEvent) {
    e.stopPropagation();
    const temp = e.currentTarget.getAttribute('data-idx');
    const idx = temp == null ? -1 : parseInt(temp);
    if (navigateToPosition) navigateToPosition(clip.id, idx);
  }

  // Expand or contract the captions
  function handleCaptionClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isFocus) {
      if (setFocusId) {
        setFocusId(id);
      }
    }
  }

  function handleToggleCaption(e: React.MouseEvent) {
    e.stopPropagation();
    if (toggleCaptions) {
      toggleCaptions(id, !clip['expanded']);
    }
  }

  // Show or hide the alternative highlights
  function handleAltClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (toggleAltHighlights) toggleAltHighlights(id, !clip['alternatives']);
  }

  // When clip finishes, autoplay the next one
  function handleEnd() {
    if (!autoplay) {
      setEnded(true);
    } else {
      handleMove(null, 1, 'autoplay');
    }
  }

  function handlePlay() {
    if (logAction) logAction('play', { clipId: id });
    setIsPlaying(true);
  }
  function handlePause() {
    if (logAction) logAction('pause', { clipId: id });
    setIsPlaying(false);
  }

  function renderHighlightNavigator() {
    if (!isFocus || highlights.length <= 1) return '';

    const otherHighlights: Array<Array<React.ReactElement>> = [];
    if (clip['alternatives']) {
      for (let i = 0; i < highlights.length; i++) {
        const highlight = highlights[i];
        if (i % 2 == 0) {
          otherHighlights.push([]);
        }
        otherHighlights[Math.floor(i / 2)].push(
          <div
            key={i}
            className="video__note-navigator-link"
            data-idx={i}
            onClick={handleSideClick}
            style={{ opacity: i == clip.position ? '1' : '0.6' }}
          >
            <b>{highlight.id}</b> Example Test
          </div>
        );
      }
    }

    return (
      <div className="video__note-navigator">
        <div
          className="video__note-navigator-row"
          style={{
            fontSize: '14px',
            color: 'rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={handleAltClick}
        >
          {clip.alternatives ? 'Hide Other Mentions' : 'Show Other Mentions'}
        </div>
        {otherHighlights.map((row, i) => {
          return (
            <div key={'row-' + i} className="video__note-navigator-row">
              {row}
            </div>
          );
        })}
      </div>
    );
  }

  function handleWordEnter(syncIdx: number) {
    if (setHoveredWord) {
      setHoveredWord({ clipId: id, syncIdx: syncIdx });
      setHoveredWordId(syncIdx);
    }
  }
  function handleWordLeave() {
    if (setHoveredWord) {
      setHoveredWord(null);
      setHoveredWordId(-1);
    }
  }

  function renderCaptions() {
    const highlight = highlights[clip['position']];

    let summary = (
      <div>
        <b>Summary</b>&nbsp;&nbsp;{clip.captions[0].caption}
      </div>
    );
    let transcript = <></>;

    let captionTime = clip.start + progress * 1000;
    // if (scrubPosition != -1) {
    //   captionTime = scrubPosition * duration + clip.start;
    // }
    const caption = clip['captions'].find(
      (c: Caption) => c.start <= captionTime && captionTime < c.end
    );
    if (caption) {
      transcript = (
        <div>
          <b style={{ color: '#333' }}>Transcript</b>&nbsp;&nbsp;
          <span style={{ backgroundColor: scrubPosition == -1 ? '' : color + '11' }}>
            {caption.caption}
          </span>
        </div>
      );
    } else if (clip['captions'].length > 0) {
      transcript = (
        <div>
          <b style={{ color: '#333' }}>Transcript</b>&nbsp;&nbsp;
          {clip['captions'][0].caption}
        </div>
      );
    }

    if (isFocus) {
      // && !!clip.expanded) {
      transcript = (
        <div>
          <b>Transcript</b>&nbsp;&nbsp;
          {clip['captions'].map((caption: Caption, i: number) => {
            const words = caption.caption.split(' ');
            const passed = caption.start < clip.start + progress * 1000;
            return words.map((text, j) => {
              var syncIdx = syncSegments?.captionToIdx[caption.id + '-' + j];
              var synced =
                hoveredWord && hoveredWord.clipId == clip.id && hoveredWord.syncIdx == syncIdx;
              var syncable = syncIdx != undefined && syncIdx != null;
              const style = {
                backgroundColor: synced ? color + '77' : passed ? color + '11' : 'transparent',
                fontWeight: syncable ? 600 : 400,
                textDecoration: synced ? 'underline' : 'none',
                display: 'inline-block',
              };
              return (
                <span
                  key={j}
                  style={style}
                  onMouseEnter={(e) => {
                    handleWordEnter(syncIdx != undefined ? syncIdx : -1)
                    setTooltip && setTooltip(id, e, "sync");
                  }}
                  onMouseMove={(e) => setTooltip && setTooltip(id, e, "sync")}
                  onMouseLeave={(e) => {
                    handleWordLeave();
                    setTooltip && setTooltip(id, e, null);
                  }}
                >
                  {text}&nbsp;
                </span>
              );
            });
          })}
        </div>
      );
    }

    return (
      <div className="video__note-captions" onClick={handleCaptionClick}>
        {transcript}
        {false && isFocus ? (
          <div
            style={{ textAlign: 'center', color: '#999', cursor: 'pointer' }}
            onClick={handleToggleCaption}
          >
            <i className={'fa fa-' + (clip.expanded ? 'minus' : 'plus')}></i>
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }

  function handleClickNote(e: React.MouseEvent) {
    e.stopPropagation();
    if (setFocusId) {
      setFocusId(id);
    }
  }

  function handleMove(e: React.MouseEvent | null, direction: number, type: string) {
    if (e != null) {
      e.stopPropagation();
    }
    const fromIdx = clips.findIndex(c => c.id == id);
    const toId = clips[fromIdx + direction].id;
    if (handleNavigate) handleNavigate(id, toId, type);
  }

  function handleSeek(seconds: number) {
    if (scrubPosition == -1 && logAction) {
      logAction('scrubVideo', { clipId: id, seconds: seconds, location: 'video' });
    }
  }

  function handleAutoplay() {
    if (setAutoplay) {
      if (logAction) logAction('toggleAutoplay', { clipId: id, autoplay: !autoplay });
      setAutoplay(!autoplay);
    }
  }

  function handlePlaybackRate(rate: number) {
    if (setPlaybackRate) {
      if (logAction) logAction('playbackRate', { clipId: id, rate: rate });
      setPlaybackRate(rate);
    }
  }

  var adjustedVideoWidth = videoWidth * (isFocus ? 1 : 0.8);
  var videoHeight = (adjustedVideoWidth / 16) * 9;

  // If clip is navigating, adjust the positions to be relative
  const container = document.getElementsByClassName('video__note-list');
  var color = colors[id % 7];
  if(id <= -10) {
    color = "#aaa";
  }
  var isLocked = top == -1;
  if (container.length > 0) {
    var rect = container[0].getBoundingClientRect();
    if (isLocked) {
      adjustedVideoWidth = pageDimensions.width * scale * 0.3;
      videoHeight = (adjustedVideoWidth / 16) * 9;
      left = rect.left - 28 - adjustedVideoWidth;
      top = 64;
    }
  }
  return (
    <div
      id={'video__note-' + id}
      className="video__note"
      data-index={id}
      style={{
        zIndex: isOverlay ? 3 : isFocus ? 2 : 1,
        position: isOverlay ? 'fixed' : 'absolute',
        top: top + 'px',
        left: left ? left + 'px' : undefined,
        opacity: isPhantom ? 0.2 : 1,
        pointerEvents: isPhantom ? 'none' : 'auto',
        transition: pushable ? 'top 0.3s' : 'none',
      }}
    >
      <div className="video__note-supercontainer">
        <div>
          {isFocus && !isLocked ? (
            <PlayerTimeline
              id={id}
              clips={clips}
              sections={sections}
              width={adjustedVideoWidth}
              handleNavigate={handleNavigateWrapper}
              playedHistory={playedHistory}
            />
          ) : (
            ''
          )}
          <div
            className="video__note-container"
            style={{ width: adjustedVideoWidth + 'px', borderColor: color }}
          >
            <div style={{ height: videoHeight + 'px' }} onClick={handleClickNote}>
              {!isFocus ? (
                <div className="video__note-timestamp" style={{ backgroundColor: color }}>
                  {timeToStr(duration)}
                </div>
              ) : (
                ''
              )}
              <div
                style={{ position: 'relative' }}
                onMouseOver={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <ReactPlayer
                  ref={videoRef}
                  url={'/api/clips/' + doi + '/' + id + '.mp4'}
                  playing={isPlaying}
                  controls={isFocus}
                  onReady={e => {
                    videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration());
                  }}
                  onProgress={e => {
                    updateProgress(e);
                  }}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onEnded={handleEnd}
                  width="100%"
                  height="100%"
                  playbackRate={playbackRate}
                  light={false}
                />
                {isHovered && isFocus ? (
                  <div 
                    className="video__note-player-rate-tray" 
                    onMouseOver={(e) => setTooltip && setTooltip(id, e, "playback")} 
                    onMouseMove={(e) => setTooltip && setTooltip(id, e, "playback")}
                    onMouseLeave={(e) => setTooltip && setTooltip(id, e, null)}
                  >
                    {[1.0, 1.25, 1.5, 1.75, 2.0].map((rate, i) => {
                      return (
                        <div
                          key={i}
                          className="video__note-player-rate"
                          style={
                            rate == playbackRate
                              ? { backgroundColor: '#1890ff', fontWeight: 'bold', color: '#f6f6f6' }
                              : {}
                          }
                          onClick={() => handlePlaybackRate(rate)}
                        >
                          {rate == 1 || rate == 2 ? rate + '.00' : rate == 1.5 ? rate + '0' : rate}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  ''
                )}
                {isHovered && isFocus && autoplay != undefined && autoplay != null ? (
                  <div 
                    className="video__note-autoplay"
                    onMouseOver={(e) => setTooltip && setTooltip(id, e, "autoplay")}
                    onMouseMove={(e) => setTooltip && setTooltip(id, e, "autoplay")}
                    onMouseLeave={(e) => setTooltip && setTooltip(id, e, null)}
                  >
                    <div className="video__note-autoplay-inner">
                      <label className="video__note-autoplay-switch">
                        <input type="checkbox" onChange={handleAutoplay} checked={autoplay} />
                        <span className="video__note-autoplay-slider"></span>
                      </label>
                    </div>
                  </div>
                ) : (
                  ''
                )}
                {isFocus && ended ? (
                  <div className="video__note-player-endscreen">
                    <div
                      className="video__note-player-endscreen-inner"
                      onClick={() => {
                        videoRef.current == null ? 0 : videoRef.current.seekTo(0);
                        setEnded(false);
                        setIsPlaying(true);
                      }}
                    >
                      <i className="fa-solid fa-repeat"></i>
                      <div>Replay</div>
                    </div>
                    {clips.findIndex(c => c.id == id) != clips.length - 1 ? (
                      <div
                        className="video__note-player-endscreen-inner"
                        onClick={e => handleMove(e, 1, 'next')}
                      >
                        <i className="fa-solid fa-forward"></i>
                        <div>Next</div>
                      </div>
                    ) : (
                      ''
                    )}
                  </div>
                ) : (
                  ''
                )}
              </div>
            </div>
            {!isLocked ? renderCaptions() : ''}
          </div>
          {false && !isLocked ? renderHighlightNavigator() : ''}
        </div>
      </div>
    </div>
  );
}
