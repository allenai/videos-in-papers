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
  playingClip: number;
  setPlayingClip?: (id: number) => void;
  isFocus: boolean;
  isOverlay: boolean;
  isPhantom: boolean;
  handleNavigate?: (fromId: number, toId: number, isPlay: boolean) => void;
  navigateToPosition?: (clipId: number, highlightIdx: number) => void;
  toggleCaptions?: (clipId: number, isExpand: boolean) => void;
  toggleAltHighlights?: (clipId: number, isShow: boolean) => void;
  scrubPosition: number;
  videoWidth: number;
  playedHistory: Array<number>;
  updatePlayedHistory?: (clipId: number) => void;
  setFocusId?: (clipId: number) => void;
  setHoveredWord?: (data: { clipId: number; text: string } | null) => void;
  sections?: { [id: number]: string };
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
  playingClip,
  setPlayingClip,
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
  setHoveredWord,
  sections,
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [pushable, setPushable] = React.useState(false);

  const [hoveredWordId, setHoveredWordId] = React.useState('');

  const videoRef = React.useRef<ReactPlayerProps>(null);

  // Update progress (current time) as video plays
  const updateProgress = (e: any) => {
    if (videoRef.current && isPlaying) {
      const currentTime = e.playedSeconds;
      setProgress(currentTime);

      const clipStart = clip.start;
      const actualTime = currentTime + clipStart;

      for (let i = 0; i < clip.captions.length; i++) {
        const caption = clip.captions[i];
        if (
          caption.start / 1000 <= actualTime &&
          actualTime <= caption.end / 1000 &&
          updatePlayedHistory
        ) {
          updatePlayedHistory(id);
        }
      }
    }
  };

  // If not navigating, let the clip be "pushable" (change top)
  React.useEffect(() => {
    if (!isOverlay) setPushable(true);
    else setPushable(false);
  }, [top]);

  // Pause or play depending on if it is the currently playing clip
  React.useEffect(() => {
    if (playingClip == id) setIsPlaying(true);
    else setIsPlaying(false);
  }, [playingClip]);

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
    if (handleNavigate) {
      handleNavigate(fromId, toId, false);
      if (isPlaying && setPlayingClip) {
        setPlayingClip(-1);
      }
    }
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
    } else if (toggleCaptions) {
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
    return;
    // var fromIdx = clips.findIndex((c) => c.id == id);
    // if(fromIdx == clips.length - 1) return;
    // var toId = clips[fromIdx + 1].id;
    // if(handleNavigate)
    //   handleNavigate(id, toId, true);
  }

  function handlePlay() {
    if (setPlayingClip) {
      setPlayingClip(id);
    }
  }
  function handlePause() {
    if (setPlayingClip) {
      setPlayingClip(-1);
    }
  }

  const testSummaries = [
    'This is a presentation of OVRlap.',
    'The OVRlap technique allows users to see multiple viewpoints from a first-person perspective.',
    'The idea for OVRlap came from considering why people can only be in one place at a time, and how virtual reality could allow people to be in multiple places at once.',
    'The OVRlap technique allows users to see and interact with multiple distinct and distant locations from a first-person perspective.',
  ];

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
            style={{ opacity: i == clip.position ? '1' : '0.6' }}>
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
          onClick={handleAltClick}>
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

  function handleWordEnter(wordId: string, text: string) {
    if (setHoveredWord) {
      setHoveredWord({ clipId: id, text: text });
      setHoveredWordId(wordId);
    }
  }
  function handleWordLeave() {
    if (setHoveredWord) {
      setHoveredWord(null);
      setHoveredWordId('');
    }
  }

  function renderCaptions() {
    const highlight = highlights[clip['position']];

    const tokens = highlight['tokens'].map(t => t['text']);

    let summary = (
      <div>
        <b>Summary</b>&nbsp;&nbsp;{clip.captions[0].caption}
      </div>
    );
    if ((scrubPosition != -1 || isPlaying) && !clip.expanded) {
      let captionTime = (clip.start + progress) * 1000;
      if (scrubPosition != -1) {
        captionTime = (scrubPosition * duration + clip.start) * 1000;
      }
      const caption = clip['captions'].find(
        (c: Caption) => c.start <= captionTime && captionTime < c.end
      );
      if (caption) {
        summary = (
          <div style={{ color: color + 'cc' }}>
            <b style={{ color: '#333' }}>Transcript</b>&nbsp;&nbsp;{caption.caption}
          </div>
        );
      }
    }

    let transcript = <></>;
    if (isFocus && !!clip.expanded) {
      transcript = (
        <div>
          <b>Transcript</b>&nbsp;&nbsp;
          {clip['captions'].map((caption: Caption, i: number) => {
            const words = caption.caption.split(' ');
            const passed = caption.start < clip.start + progress*1000;
            return words.map((text, j) => {
              const style = {
                backgroundColor: hoveredWordId == i + '-' + j ? color + '77' : (passed ? color + '33' : 'transparent'),
                fontWeight: tokens.includes(text) ? 700 : 400,
                textDecoration: hoveredWordId == i + '-' + j ? 'underline' : 'none',
                display: 'inline-block',
              };
              return (
                <span
                  key={j}
                  style={style}
                  onMouseEnter={() => handleWordEnter(i + '-' + j, text)}
                  onMouseLeave={handleWordLeave}>
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
        {summary}
        {transcript}
        {isFocus ? (
          <div style={{ textAlign: 'center', color: '#999' }}>
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

  function handleMove(e: React.MouseEvent, direction: number) {
    e.stopPropagation();
    const fromIdx = clips.findIndex(c => c.id == id);
    const toId = clips[fromIdx + direction].id;
    if (handleNavigate) handleNavigate(id, toId, true);
  }

  var adjustedVideoWidth = videoWidth * (isFocus ? 1 : 0.8);
  var videoHeight = (adjustedVideoWidth / 16) * 9;

  // If clip is navigating, adjust the positions to be relative
  const container = document
    .getElementsByClassName('video__note-list');
  var color = colors[id % 7];
  var isLocked = top == -1;
  if(container.length > 0) {
    var rect = container[0].getBoundingClientRect();  
    if(isLocked) {
      // TODO: decide where to lock the video to
      // adjustedVideoWidth = pageDimensions.width * scale * 0.3;
      // videoHeight = (adjustedVideoWidth/16) * 9;
      // left = rect.left - 28 - adjustedVideoWidth;
      top = 64;
      isLocked = false;
    }
    // } else {
    //   left = 0;
    // }
  }
  return (
    <div
      id={'video__note-' + id}
      className="video__note"
      data-index={id}
      style={{
        zIndex: isOverlay ? 3 : 1,
        position: isOverlay ? 'fixed' : 'absolute',
        top: top + 'px',
        left: left + 'px',
        opacity: isPhantom ? 0.2 : 1,
        pointerEvents: isPhantom ? 'none' : 'auto',
        transition: pushable ? 'top 0.5s' : 'none',
      }}>
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
            style={{ width: adjustedVideoWidth + 'px', borderColor: color }}>
            <div style={{ height: videoHeight + 'px' }} onClick={handleClickNote}>
              {!isFocus ? (
                <div className="video__note-timestamp" style={{ backgroundColor: color }}>
                  {timeToStr(duration)}
                </div>
              ) : (
                ''
              )}
              {isFocus && id != 0 ? (
                <i
                  key={0}
                  className="fa fa-chevron-left video__note-chevron-left"
                  style={{ top: videoHeight / 2 + 6 + 'px' }}
                  onClick={e => handleMove(e, -1)}></i>
              ) : (
                ''
              )}
              {isFocus && id != clips.length - 1 ? (
                <i
                  key={1}
                  className="fa fa-chevron-right video__note-chevron-right"
                  style={{ top: videoHeight / 2 + 6 + 'px' }}
                  onClick={e => handleMove(e, 1)}></i>
              ) : (
                ''
              )}
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
                onEnded={handleEnd}
                width="100%"
                height="100%"
                light={false}
              />
            </div>
            {!isLocked ? renderCaptions() : ""}
          </div>
          {!isLocked ? renderHighlightNavigator() : ""}
        </div>
      </div>
    </div>
  );
}
