import * as React from 'react';
import {
  DocumentContext,
  TransformContext,
} from '@allenai/pdf-components';
import { Highlight, Clip, Caption, SyncWords } from '../types/clips';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';

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
  clips: {[id: number]: Clip};
  changeClip: (id: number, start: number, end: number) => void;
  highlights: {[id: number]: Highlight};
  captions: Array<Caption>;
  selectedClip: Array<number>;
  setSelectedClip: (data: Array<number>) => void;
  selectedMapping: number | null;
  setSelectedMapping: (clipId: number | null) => void;
  modifyMode: boolean;
  highlightMode: boolean;
  selectedWords: SyncWords;
  setSelectedWords: (words: SyncWords) => void;
  syncSegments: {[id: number]: Array<SyncWords>};
  hoveredSegment: {clipId: number, index: number} | null;
  setHoveredSegment: (segment: {clipId: number, index: number} | null) => void;
  removeSegment: (clipId: number, index: number) => void;
}

function timeToStr(time: number) {
  var dec = Math.floor(time/10) % 100;
  var totalSec = Math.floor(time/1000)
  var min = Math.floor(totalSec / 60);
  var sec = Math.floor(totalSec % 60);
  return (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec) + ";" + (dec < 10 ? "0" + dec : dec);
}

const colors = [
    "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
];

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
}: Props) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [timelineScale, setTimelineScale] = React.useState(100);

  const previousSelectedClip: any | undefined = usePreviousValue(selectedClip);

  const videoRef = React.useRef<ReactPlayerProps>(null);

  React.useEffect(() => {
    if(previousSelectedClip != undefined && videoRef.current) {
        if(selectedClip[0] != previousSelectedClip[0] && selectedClip[1] == previousSelectedClip[1]) {
            videoRef.current.seekTo(selectedClip[0]/1000);
            setIsPlaying(true);
        } else if(selectedClip[0] == previousSelectedClip[0] && selectedClip[1] != previousSelectedClip[1]) {
            videoRef.current.seekTo(selectedClip[1]/1000 - 0.5);
            setIsPlaying(true);
        }
    }
  }, [selectedClip]);

  React.useEffect(() => {
    if(selectedMapping == null) return;
    setSelectedClip([-1, -1]);
    // TODO: make it replay or go to adequate section depending on selectedMapping
  }, [selectedMapping]);

  // Update progress (current time) as video plays
  const updateProgress = (e : any) => {
    if(videoRef.current && isPlaying) {
      var currentTime = e.playedSeconds;
      if(selectedClip[0] != -1 && e.playedSeconds*1000 > selectedClip[1]) {
        setIsPlaying(false);
        videoRef.current.seekTo(selectedClip[1]/1000);
        setProgress(selectedClip[1]/1000);
      } else if (selectedClip[0] != -1 && e.playedSeconds*1000 < selectedClip[0]) {
        videoRef.current.seekTo(selectedClip[0]/1000);
        setProgress(selectedClip[0]/1000);
        setIsPlaying(true);
      } else {
        setProgress(currentTime);
      }
    }
    // TODO: make it replay or go to adequate section depending on selectedMapping
  }

  const equalTimes = (timeA: number, timeB: number) => {
    return timeA - 500 <= timeB && timeB <= timeA + 500;
  }

  const handleSelectCaption = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if(highlightMode) return;
    if(!modifyMode) {
        var newClip = [...selectedClip];
        var caption = captions[idx];
        if(equalTimes(caption.end, newClip[0])) {
            newClip[0] = caption.start;
        } else if(equalTimes(caption.start, newClip[1])) {
            newClip[1] = caption.end
        } else if (equalTimes(caption.end, newClip[1])) {
            newClip[1] = caption.start;
        } else if (equalTimes(caption.start, newClip[0])) {
            newClip[0] = caption.end;
        } else {
            newClip = [caption.start, caption.end];
        }

        changeClipWrapper(newClip, -1);
        setSelectedMapping(null);
    } else if(modifyMode && selectedMapping != null) {
        var newClip = [clips[selectedMapping].start, clips[selectedMapping].end];
        var caption = captions[idx];
        if(equalTimes(caption.end, newClip[0])) {
            newClip[0] = caption.start;
        } else if(equalTimes(caption.start, newClip[1])) {
            newClip[1] = caption.end
        } else if (equalTimes(caption.end, newClip[1])) {
            newClip[1] = caption.start;
        } else if (equalTimes(caption.start, newClip[0])) {
            newClip[0] = caption.end;
        }

        changeClipWrapper(newClip, selectedMapping);
    }
  }

  const changeClipWrapper = (clip: Array<number>, id: number) => {
    if(highlightMode) return;
    if(clip[0] < 0) clip[0] = 0;
    if(clip[1] > duration*1000) clip[1] = duration*1000;
    var clipValues = Object.values(clips);
    for(var i = 0; i < clipValues.length; i++) {
        var temp = clipValues[i];
        if(temp.id == id) continue;
        if(temp.start <= clip[0] && clip[0] < temp.end) {
            clip[0] = temp.end;
        } else if(temp.start < clip[1] && clip[1] <= temp.end) {
            clip[1] = temp.start;
        } else if(clip[0] <= temp.start && temp.end <= clip[1]) {
            return;
        }
    }
    if(clip[1] <= clip[0]) return;
    if(id == -1) {
        setSelectedClip(clip);
    } else {
        changeClip(id, clip[0], clip[1]);
    }
  }

  const handleClickOutside = (e: React.MouseEvent<HTMLElement>) => {
    setSelectedClip([-1, -1]);
    // setSelectedCaptions([]);
    setSelectedMapping(null);
  }

  const changeScale = (e: React.MouseEvent, direction: number) => {
    e.stopPropagation();
    if(direction == 1 && timelineScale < 400) {
        setTimelineScale(timelineScale + 50);
    } else if(direction == -1 && timelineScale > 100) {
        setTimelineScale(timelineScale - 50);
    }
  }

  const handleClickTranscript = (e: React.MouseEvent) => {
    if(e.detail != 2) return;
  }

  const handleClickWord = (e: React.MouseEvent, captionIdx: number, wordIdx: number) => {
    e.stopPropagation();
    var captionIds = [...selectedWords.captionIds];
    var selected = captionIds.findIndex((value) => value.captionIdx == captionIdx && value.wordIdx == wordIdx);
    if(selected != -1) {
      captionIds.splice(selected, 1);
      setSelectedWords({
        ...selectedWords,
        captionIds: captionIds
      });
    } else {
      setSelectedWords({
        ...selectedWords,
        captionIds: [...selectedWords.captionIds, {captionIdx, wordIdx}]
      });
    }
  }

  const renderCaptions = () => {
    return captions.map((c, i) => {
        var selected = selectedClip[0] <= c.start && c.start < selectedClip[1]
        selected = selected || (selectedClip[0] < c.end && c.end <= selectedClip[1]);
        var usedClipId = -1;
        var clipList = Object.values(clips);
        for(var j = 0; j < clipList.length; j++) {
            var found = clipList[j].captions.find((temp) => temp.id == c.id);
            if(found != null) {
                usedClipId = clipList[j].id;
                break;
            }
        }
        return (
            <div 
                key={i}
                className={
                    "video__segmenter-transcript-container" + 
                    (selected ? " video__segmenter-transcript-container-selected" : "")
                }
                style={ selectedMapping == usedClipId ? 
                        {backgroundColor: colors[usedClipId % 7] + "33" } : 
                        (usedClipId != -1 ? {opacity: 0.5} : {})}
                onClick={(e) => handleSelectCaption(i, e)}
            >
                <div 
                    className="video__segmenter-transcript-timestamp"
                >
                    {timeToStr(c['start'])}
                </div>
                <div 
                    className="video__segmenter-transcript-text"
                    onClick={handleClickTranscript}
                >
                    {c['caption'].split(" ").map((text: string, j) => {
                        var className = "";
                        var selectable = selectedMapping == usedClipId && highlightMode;
                        var isUsed = false;
                        var index = -1;

                        if(selectable) {
                            className = "video__segmenter-transcript-token";
                            var selected = selectedWords.captionIds.find((value) => value.captionIdx == c.id && value.wordIdx == j);
                            if(selected) {
                                className += "-sel";
                            }
                        }
                        if(usedClipId != -1) {
                          var segments = syncSegments[usedClipId];
                          index = segments.findIndex((value) => value.captionIds.find((value) => value.captionIdx == i && value.wordIdx == j) != null);
                          isUsed = index != -1;
                          if(hoveredSegment != null && usedClipId == hoveredSegment.clipId && index == hoveredSegment.index) {
                            className += " video__segmenter-transcript-token-hovered"
                          }else if(index != -1) {
                            className += " video__segmenter-transcript-token-used"
                          }
                        }
                        return [
                            <span 
                                key={i+'-'+j}
                                className={className}
                                onClick={(e: React.MouseEvent) => {
                                  if(isUsed) {
                                    e.stopPropagation();
                                    removeSegment(usedClipId, index);
                                  }else if(selectable) {
                                    e.stopPropagation();
                                    handleClickWord(e, c.id, j);
                                  }
                                }}
                                onMouseEnter={(e: React.MouseEvent) => isUsed ? setHoveredSegment({clipId: usedClipId, index}) : ""}
                                onMouseLeave={(e: React.MouseEvent) => isUsed ? setHoveredSegment(null) : ""}
                            >{text}</span>,
                            <span key={'space-'+i+'-'+j}>&nbsp;</span>
                        ]
                    })}
                </div>
            </div>
        );
    })
  }

  var adjustedVideoWidth = videoWidth;
  var videoHeight = adjustedVideoWidth / 16 * 9;

  return (
    <div className="video__segmenter-container" onClick={handleClickOutside}>
        <div className="video__segmenter-container-inner">
            <div 
                style={{width: adjustedVideoWidth + "px", height: videoHeight + "px"}}
                onClick={(e) => e.stopPropagation()}
            >
                <ReactPlayer 
                    ref={videoRef}
                    url={url} 
                    playing={isPlaying}
                    controls={true}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onReady={(e) => {videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration())}}
                    onSeek={(e) => console.log(e)}
                    onProgress={(e) => {updateProgress(e)}}
                    progressInterval={100}
                    width="100%" height="100%"
                    light={false}
                />
            </div>
            <div className="video__segmenter-timeline-label">
                <div className="video__segmenter-timeline-zoom">
                    <div style={{cursor: "pointer"}} onClick={(e) => changeScale(e, -1)}>-</div>
                    <div style={{fontSize: "14px"}}>{timelineScale + "%"}</div>
                    <div style={{cursor: "pointer"}} onClick={(e) => changeScale(e, 1)}>+</div>
                </div>
                <div>
                    <span>Current Time: <b>{`${timeToStr(progress*1000)}`}</b></span>
                </div>
                <div>
                    {modifyMode && selectedMapping != null ?
                        (<span>Current Clip: <b>{`${timeToStr(clips[selectedMapping].start)} - ${timeToStr(clips[selectedMapping].end)}`}</b></span>) :
                        (selectedClip[0] != -1 ? 
                            (<span>Current Clip: <b>{`${timeToStr(selectedClip[0])} - ${timeToStr(selectedClip[1])}`}</b></span>) :
                            "No clip selected...")} 
                </div>
                <div></div>
            </div>
            <AuthorTimeline 
                duration={duration} 
                width={adjustedVideoWidth} 
                clips={clips} 
                selectedClip={selectedClip} 
                changeClip={changeClipWrapper}
                selectedMapping={selectedMapping}
                setSelectedMapping={setSelectedMapping}
                modifyMode={modifyMode}
                scale={timelineScale}
            />
            <div className="video__segmenter-transcript">
                {renderCaptions()}
            </div>
        </div>
        <div className="video__segmenter-placeholder" style={{ width: videoWidth+48+"px"}}></div>
    </div>
  );
}