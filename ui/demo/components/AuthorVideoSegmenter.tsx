import * as React from 'react';
import {
  DocumentContext,
  TransformContext,
} from '@allenai/pdf-components';
import { Highlight, Clip, Caption } from '../types/clips';
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
}

function timeToStr(time: number) {
  var dec = Math.floor(time/10) % 100;
  var totalSec = Math.floor(time/1000)
  var min = Math.floor(totalSec / 60);
  var sec = Math.floor(totalSec % 60);
  return (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec) + ";" + (dec < 10 ? "0" + dec : dec);
}

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
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

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
      // TODO: make it so the video goes to section of selectedmapping
    }
  }

  const equalTimes = (timeA: number, timeB: number) => {
    return timeA - 500 <= timeB && timeB <= timeA + 500;
  }

  const handleSelectCaption = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
                {captions.map((c, i) => {
                    var selected = selectedClip[0] <= c.start && c.start < selectedClip[1]
                    selected = selected || (selectedClip[0] < c.end && c.end <= selectedClip[1]);
                    var used = false;
                    var clipList = Object.values(clips);
                    for(var j = 0; j < clipList.length; j++) {
                        if(clipList[j].start <= c.start && c.end <= clipList[j].end) {
                            used = true;
                            break;
                        }
                    }
                    return (
                        <div 
                            key={i}
                            className={
                                "video__segmenter-transcript-container" + 
                                (selected ? " video__segmenter-transcript-container-selected" : "") +
                                (used ? " video__segmenter-transcript-container-used": "")
                            }
                            onClick={(e) => handleSelectCaption(i, e)}
                        >
                            <div className="video__segmenter-transcript-timestamp">
                                {timeToStr(c['start'])}
                            </div>
                            <div className="video__segmenter-transcript-text">
                                {c['caption']}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        <div className="video__segmenter-placeholder" style={{ width: videoWidth+48+"px"}}></div>
    </div>
  );
}