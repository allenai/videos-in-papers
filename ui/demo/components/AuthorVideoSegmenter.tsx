import { DocumentContext, TransformContext } from '@allenai/pdf-components';
import * as React from 'react';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';

import { Caption, Clip, Highlight, SyncWords } from '../types/clips';
import { AuthorTimeline } from './AuthorTimeline';

const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

function usePreviousValue(value: any) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

interface Props {
  url: string;
  videoWidth: number;
  clips: { [id: number]: Clip };
  changeClip: (id: number, start: number, end: number) => void;
  highlights: { [id: number]: Highlight };
  captions: Array<Caption>;
  selectedClip: Array<number>;
  setSelectedClip: (data: Array<number>) => void;
  selectedMapping: number | null;
  setSelectedMapping: (clipId: number | null) => void;
  modifyMode: boolean;
  highlightMode: boolean;
  selectedWords: SyncWords;
  setSelectedWords: (words: SyncWords) => void;
  syncSegments: { [id: number]: Array<SyncWords> };
  hoveredSegment: { clipId: number; index: number } | null;
  setHoveredSegment: (segment: { clipId: number; index: number } | null) => void;
  removeSegment: (clipId: number, index: number) => void;
  shiftDown: boolean;
}

function timeToStr(time: number) {
  const dec = Math.floor(time / 10) % 100;
  const totalSec = Math.floor(time / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  return (
    (min < 10 ? '0' + min : min) +
    ':' +
    (sec < 10 ? '0' + sec : sec) +
    ';' +
    (dec < 10 ? '0' + dec : dec)
  );
}

const colors = ['#cb725e', '#d9a460', '#3e9d29', '#306ed3', '#07cead', '#9d58e1', '#dd59ba'];

export function AuthorVideoSegmenter({
  url,
  videoWidth,
  clips,
  changeClip,
  highlights,
  captions,
  selectedClip,
  setSelectedClip,
  selectedMapping,
  setSelectedMapping,
  modifyMode,
  highlightMode,
  selectedWords,
  setSelectedWords,
  syncSegments,
  hoveredSegment,
  setHoveredSegment,
  removeSegment,
  shiftDown,
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { scale } = React.useContext(TransformContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [timelineScale, setTimelineScale] = React.useState(100);

  const [currentCaption, setCurrentCaption] = React.useState<number>(0);
  const [hoverCaption, setHoverCaption] = React.useState<number>(-1);

  const [suggestions, setSuggestions] = React.useState<Array<Array<number>>>([
    [0, 16000],
    [16010, 32000],
    [32010, 48000]
  ]);

  const previousSelectedClip: any | undefined = usePreviousValue(selectedClip);
  const previousMappingClip: any | undefined = usePreviousValue(
    selectedMapping == null ? [-1, -1] : [clips[selectedMapping].start, clips[selectedMapping].end]
  );

  const videoRef = React.useRef<ReactPlayerProps>(null);
  const captionRef = React.useRef<HTMLDivElement>(null);

  const [scrubDirection, setScrubDirection] = React.useState<number>(0);

  const removeSuggestions = (start: number, end: number) => {
    var tempSuggestions = suggestions.map((suggestion) => {
      if((start <= suggestion[0] && suggestion[0] < end) ||
        (start < suggestion[1] && suggestion[1] <= end) ||
        (suggestion[0] <= start && end <= suggestion[1])) {
        return [-1, -1];
      } else {
        return suggestion;
      }
    })
    setSuggestions(tempSuggestions);
  }

  React.useEffect(() => {
    if (previousSelectedClip != undefined && videoRef.current) {
      if (
        selectedClip[0] != previousSelectedClip[0] &&
        selectedClip[1] == previousSelectedClip[1]
      ) {
        videoRef.current.seekTo(selectedClip[0] / 1000);
        setIsPlaying(scrubDirection != 0);
        removeSuggestions(selectedClip[0], selectedClip[1]);
      } else if (
        selectedClip[0] == previousSelectedClip[0] &&
        selectedClip[1] != previousSelectedClip[1]
      ) {
        videoRef.current.seekTo(selectedClip[1] / 1000 - scrubDirection != 0 ? 0.5 : 0);
        setIsPlaying(scrubDirection != 0);
        removeSuggestions(selectedClip[0], selectedClip[1]);
      } else if (
        selectedClip[0] != previousSelectedClip[0] &&
        selectedClip[1] != previousSelectedClip[1]
      ) {
        videoRef.current.seekTo(selectedClip[0] / 1000);
        removeSuggestions(selectedClip[0], selectedClip[1]);
      }
    }
  }, [selectedClip]);

  React.useEffect(() => {
    if (selectedMapping != null && previousMappingClip != undefined && videoRef.current) {
      if (
        clips[selectedMapping].start != previousMappingClip[0] &&
        clips[selectedMapping].end == previousMappingClip[1]
      ) {
        videoRef.current.seekTo(clips[selectedMapping].start / 1000);
        setIsPlaying(scrubDirection != 0);
        removeSuggestions(clips[selectedMapping].start, clips[selectedMapping].end);
      } else if (
        clips[selectedMapping].start == previousMappingClip[0] &&
        clips[selectedMapping].end != previousMappingClip[1]
      ) {
        videoRef.current.seekTo(clips[selectedMapping].end / 1000 - scrubDirection != 0 ? 0.5 : 0);
        setIsPlaying(scrubDirection != 0);
        removeSuggestions(clips[selectedMapping].start, clips[selectedMapping].end);
      }
    }
  }, [clips]);

  React.useEffect(() => {
    if (selectedMapping == null) return;
    setSelectedClip([-1, -1]);
    if (videoRef.current) {
      videoRef.current.seekTo(clips[selectedMapping].start / 1000);
    }
  }, [selectedMapping]);

  // Update progress (current time) as video plays
  const updateProgress = (e: any) => {
    if (videoRef.current) {
      let currentTime = e.playedSeconds;
      if (selectedClip[0] != -1 && e.playedSeconds * 1000 > selectedClip[1]) {
        videoRef.current.seekTo(selectedClip[1] / 1000);
        currentTime = selectedClip[1] / 1000;
        setIsPlaying(false);
      } else if (selectedClip[0] != -1 && e.playedSeconds * 1000 < selectedClip[0]) {
        videoRef.current.seekTo(selectedClip[0] / 1000);
        currentTime = selectedClip[0] / 1000;
      } else if (selectedMapping != null && e.playedSeconds * 1000 > clips[selectedMapping].end) {
        videoRef.current.seekTo(clips[selectedMapping].end / 1000);
        currentTime = clips[selectedMapping].end / 1000;
        setIsPlaying(false);
      } else if (selectedMapping != null && e.playedSeconds * 1000 < clips[selectedMapping].start) {
        videoRef.current.seekTo(clips[selectedMapping].start / 1000);
        currentTime = clips[selectedMapping].start / 1000;
      }
      setProgress(currentTime);
      if (
        captions[currentCaption].start <= currentTime * 1000 &&
        captions[currentCaption].end > currentTime * 1000
      )
        return;
      const captionIdx = captions.findIndex(
        c => c.start <= currentTime * 1000 && c.end > currentTime * 1000
      );
      if (captionIdx != -1) {
        const captionTop = document.getElementById('caption-' + captionIdx)?.offsetTop;
        const divScrollTop = captionRef.current?.scrollTop;
        const divTop = captionRef.current?.offsetTop;
        const divHeight = captionRef.current?.offsetHeight;
        if (
          captionTop != undefined &&
          divTop != undefined &&
          divScrollTop != undefined &&
          divHeight != undefined
        ) {
          if (
            captionTop - divTop < divScrollTop - 10 ||
            captionTop - divTop > divScrollTop + divHeight + 10
          ) {
            captionRef.current!.scrollTo(0, captionTop - divTop - 20);
          }
        }
        setCurrentCaption(captionIdx);
      }
    }
  };

  const handleSelectCaption = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (highlightMode) return;
    var newClip = [...selectedClip];

    if (modifyMode && selectedMapping != null) {
      newClip = [clips[selectedMapping].start, clips[selectedMapping].end];
    }

    var caption = captions[idx];

    var startCaptionIdx = captions.findIndex(c => c.start <= newClip[0] && newClip[0] < c.end);
    var endCaptionIdx = captions.findIndex(c => c.start < newClip[1] && newClip[1] <= c.end);
  
    if(caption.start == newClip[0]) {
      newClip[0] = startCaptionIdx + 1 < captions.length ? captions[startCaptionIdx + 1].start : -1;
    } else if(caption.end == newClip[1]) {
      newClip[1] = endCaptionIdx - 1 >= 0 ? captions[endCaptionIdx - 1].end : -1;
    } else if(idx == startCaptionIdx) {
      newClip[0] = caption.start;
    } else if(idx == endCaptionIdx) {
      newClip[1] = caption.end;
    } else if(idx == startCaptionIdx - 1) {
      newClip[0] = caption.start;
    } else if(idx == endCaptionIdx + 1) {
      newClip[1] = caption.end;
    } else if(!modifyMode) {
      newClip = [caption.start, caption.end];
    }

    if (!modifyMode) {
      changeClipWrapper(newClip, -1);
      setSelectedMapping(null);
    } else if (modifyMode && selectedMapping != null) {
      changeClipWrapper(newClip, selectedMapping);
    }
  };

  const handleSelectSuggestion = (suggestion: Array<number>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (highlightMode) return;
    var newClip = [...selectedClip];
    
    if (modifyMode && selectedMapping != null) {
      newClip = [clips[selectedMapping].start, clips[selectedMapping].end];
    }

    var suggestionStartIdx = captions.findIndex(c => c.start <= suggestion[0] && suggestion[0] < c.end);
    var suggestionEndIdx = captions.findIndex(c => c.start < suggestion[1] && suggestion[1] <= c.end);

    var startCaptionIdx = captions.findIndex(c => c.start <= newClip[0] && newClip[0] < c.end);
    var endCaptionIdx = captions.findIndex(c => c.start < newClip[1] && newClip[1] <= c.end);

    if(suggestionEndIdx == startCaptionIdx) {
      newClip[0] = suggestion[0];
    } else if(suggestionStartIdx == endCaptionIdx) {
      newClip[1] = suggestion[1];
    } else if(suggestionEndIdx == startCaptionIdx - 1) {
      newClip[0] = suggestion[0];
    } else if(suggestionStartIdx == endCaptionIdx + 1) {
      newClip[1] = suggestion[1];
    } else {
      newClip[0] = suggestion[0];
      newClip[1] = suggestion[1];
    }

    if(!modifyMode) {
      changeClipWrapper(newClip, -1);
      setSelectedMapping(null);
    } else if(modifyMode && selectedMapping != null) {
      changeClipWrapper(newClip, selectedMapping);
    }
  }

  const changeClipWrapper = (clip: Array<number>, id: number) => {
    if (highlightMode) return;
    if (clip[0] < 0) clip[0] = 0;
    if (clip[1] > duration * 1000) clip[1] = duration * 1000;
    const clipValues = Object.values(clips);
    for (let i = 0; i < clipValues.length; i++) {
      const temp = clipValues[i];
      if (temp.id == id) continue;
      if (temp.start <= clip[0] && clip[0] < temp.end) {
        clip[0] = temp.end;
      } else if (temp.start < clip[1] && clip[1] <= temp.end) {
        clip[1] = temp.start;
      } else if (clip[0] <= temp.start && temp.end <= clip[1]) {
        return;
      }
    }
    if (clip[1] <= clip[0]) return;
    if (id == -1) {
      setSelectedClip(clip);
    } else {
      changeClip(id, clip[0], clip[1]);
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLElement>) => {
    setSelectedClip([-1, -1]);
    // setSelectedCaptions([]);
    setSelectedMapping(null);
  };

  const changeScale = (e: React.MouseEvent, direction: number) => {
    e.stopPropagation();
    if (direction == 1 && timelineScale < 400) {
      setTimelineScale(timelineScale + 50);
    } else if (direction == -1 && timelineScale > 100) {
      setTimelineScale(timelineScale - 50);
    }
  };

  const handleClickTranscript = (e: React.MouseEvent) => {
    if (e.detail != 2) return;
  };

  const handleClickWord = (e: React.MouseEvent, captionIdx: number, wordIdx: number) => {
    e.stopPropagation();
    const captionIds = [...selectedWords.captionIds];
    const selected = captionIds.findIndex(
      value => value.captionIdx == captionIdx && value.wordIdx == wordIdx
    );
    if (selected != -1) {
      captionIds.splice(selected, 1);
      setSelectedWords({
        ...selectedWords,
        captionIds: captionIds,
      });
    } else {
      if (shiftDown) {
        let closest = null;
        let closestDist = null;
        for (var i = 0; i < captionIds.length; i++) {
          const caption = captionIds[i];
          if (caption.captionIdx != captionIdx) continue;
          const dist = Math.abs(caption.wordIdx - wordIdx);
          if (closest == null || closestDist == null || dist < closestDist) {
            closestDist = dist;
            closest = caption;
          }
        }
        if (closest != null) {
          const start = Math.min(closest.wordIdx, wordIdx);
          const end = Math.max(closest.wordIdx, wordIdx);
          for (var i = start; i <= end; i++) {
            captionIds.push({
              captionIdx: captionIdx,
              wordIdx: i,
            });
          }
        } else {
          captionIds.push({
            captionIdx: captionIdx,
            wordIdx: wordIdx,
          });
        }
        setSelectedWords({
          ...selectedWords,
          captionIds: captionIds,
        });
      } else {
        setSelectedWords({
          ...selectedWords,
          captionIds: [...selectedWords.captionIds, { captionIdx, wordIdx }],
        });
      }
    }
  };

  const renderCaptions = () => {
    var suggestedCaptions = suggestions.map(suggestion => {
      return captions.filter(c => (suggestion[0] <= c.start && c.start <= suggestion[1]) || (suggestion[0] <= c.end && c.end <= suggestion[1])).map(c => c.id);
    })
    return captions.map((c, i) => {
      let selected = selectedClip[0] <= c.start && c.start < selectedClip[1];
      selected = selected || (selectedClip[0] < c.end && c.end <= selectedClip[1]);
      let usedClipId = -1;
      const clipList = Object.values(clips);
      for (let j = 0; j < clipList.length; j++) {
        const found = clipList[j].captions.find(temp => temp.id == c.id);
        if (found != null) {
          usedClipId = clipList[j].id;
          break;
        }
      }

      var suggestedIdx = suggestedCaptions.findIndex(s => s.includes(c.id));
      var suggestedInfo = suggestedCaptions[suggestedIdx];

      var style = {};
      if(selectedMapping == usedClipId) {
        style = { backgroundColor: colors[usedClipId % 7] + (hoverCaption == i ? '33' : '1A') };
      } else if(usedClipId != -1) {
        style = { opacity: 0.5 };
      } else if(selected) {
        style = { backgroundColor: "#1890ff" + (hoverCaption == i ? '33' : '1A') };
      } else if(suggestedInfo != null) {
        style = { borderLeft: '2px solid #1890ff33', borderRight: '2px solid #1890ff33'};
        if(suggestedInfo[0] == i) {
          style = { ...style, borderTop: '2px solid #1890ff33', borderRadius: '4px 4px 0 0' };
        } else if(suggestedInfo[suggestedInfo.length - 1] == i) {
          style = { ...style, borderBottom: '2px solid #1890ff33', borderRadius: '0 0 4px 4px' };
        }
        if(hoverCaption != -1 && suggestedInfo.includes(hoverCaption)) {
          style = { ...style, backgroundColor: '#1890ff33' };
        }
      } else {
        style = { backgroundColor: hoverCaption == i ? "#ddd" : "#f6f6f6" }
      }

      return (
        <div
          key={i}
          id={'caption-' + i}
          className={'video__segmenter-transcript-container'}
          style={style}
          onClick={e => suggestedInfo != null ? handleSelectSuggestion(suggestions[suggestedIdx], e) : handleSelectCaption(i, e)}
          onMouseEnter={() => setHoverCaption(i)}
          onMouseLeave={() => setHoverCaption(-1)}>
          <div
            className="video__segmenter-transcript-timestamp"
            style={currentCaption == i ? { color: '#1075ff' } : {}}>
            {timeToStr(c['start'])}
          </div>
          <div className="video__segmenter-transcript-text" onClick={handleClickTranscript}>
            {c['caption'].split(/\n| /).map((text: string, j) => {
              let className = '';
              const selectable = selectedMapping == usedClipId && highlightMode;
              let isUsed = false;
              let index = -1;

              if (selectable) {
                className = 'video__segmenter-transcript-token';
                const selected = selectedWords.captionIds.find(
                  value => value.captionIdx == c.id && value.wordIdx == j
                );
                if (selected) {
                  className += '-sel';
                }
              }
              if (usedClipId != -1 && syncSegments[usedClipId]) {
                const segments = syncSegments[usedClipId];
                index = segments.findIndex(
                  value =>
                    value.captionIds.find(value => value.captionIdx == i && value.wordIdx == j) !=
                    null
                );
                isUsed = index != -1;
                if (
                  hoveredSegment != null &&
                  usedClipId == hoveredSegment.clipId &&
                  index == hoveredSegment.index
                ) {
                  className += ' video__segmenter-transcript-token-hovered';
                } else if (index != -1) {
                  className += ' video__segmenter-transcript-token-used';
                }
              }
              return [
                <span
                  key={i + '-' + j}
                  className={className}
                  onClick={(e: React.MouseEvent) => {
                    if (isUsed) {
                      e.stopPropagation();
                      removeSegment(usedClipId, index);
                    } else if (selectable) {
                      e.stopPropagation();
                      handleClickWord(e, c.id, j);
                    }
                  }}
                  onMouseEnter={(e: React.MouseEvent) =>
                    isUsed ? setHoveredSegment({ clipId: usedClipId, index }) : ''
                  }
                  onMouseLeave={(e: React.MouseEvent) => (isUsed ? setHoveredSegment(null) : '')}>
                  {text}
                </span>,
                <span key={'space-' + i + '-' + j}>&nbsp;</span>,
              ];
            })}
          </div>
        </div>
      );
    });
  };

  const adjustedVideoWidth = videoWidth;
  const videoHeight = (adjustedVideoWidth / 16) * 9;

  const realWidth = (window.innerWidth - pageDimensions.width * scale - 48 - 24);

  return (
    <div className="video__segmenter-container" onClick={handleClickOutside}>
      <div className="video__segmenter-container-inner">
        <div
          style={{ width: adjustedVideoWidth + 'px', height: videoHeight + 'px' }}
          onClick={e => e.stopPropagation()}>
          <ReactPlayer
            ref={videoRef}
            url={url}
            playing={isPlaying}
            controls={true}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReady={e => {
              videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration());
            }}
            onProgress={e => {
              updateProgress(e);
            }}
            progressInterval={100}
            width="100%"
            height="100%"
            light={false}
          />
        </div>
        <div className="video__segmenter-timeline-label">
          <div className="video__segmenter-timeline-zoom">
            <div style={{ cursor: 'pointer' }} onClick={e => changeScale(e, -1)}>
              -
            </div>
            <div style={{ fontSize: '14px' }}>{timelineScale + '%'}</div>
            <div style={{ cursor: 'pointer' }} onClick={e => changeScale(e, 1)}>
              +
            </div>
          </div>
          <div>
            <span>
              Current Time: <b>{`${timeToStr(progress * 1000)}`}</b>
            </span>
          </div>
          <div>
            {modifyMode && selectedMapping != null ? (
              <span>
                Current Clip:{' '}
                <b>{`${timeToStr(clips[selectedMapping].start)} - ${timeToStr(
                  clips[selectedMapping].end
                )}`}</b>
              </span>
            ) : selectedClip[0] != -1 ? (
              <span>
                Current Clip:{' '}
                <b>{`${timeToStr(selectedClip[0])} - ${timeToStr(selectedClip[1])}`}</b>
              </span>
            ) : (
              'No clip selected...'
            )}
          </div>
        </div>
        <AuthorTimeline
          duration={duration}
          width={realWidth}
          clips={clips}
          selectedClip={selectedClip}
          changeClip={changeClipWrapper}
          selectedMapping={selectedMapping}
          setSelectedMapping={setSelectedMapping}
          modifyMode={modifyMode}
          scale={timelineScale}
          scrubDirection={scrubDirection}
          setScrubDirection={setScrubDirection}
        />
        <div className="video__segmenter-transcript" ref={captionRef} style={{width: realWidth + 'px'}}>
          {renderCaptions()}
        </div>
      </div>
      <div className="video__segmenter-placeholder" style={{ width: realWidth + 'px' }}></div>
    </div>
  );
}
