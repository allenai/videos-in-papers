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
  highlights: {[id: number]: Highlight};
  captions: Array<Caption>;
  selectedClip: Array<number>;
  setSelectedClip: (data: Array<number>) => void;
}

function timeToStr(time: number) {
  var min = Math.floor(time / 60);
  var sec = Math.floor(time % 60);
  return (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
}

export function AuthorVideoSegmenter({
  url,
  videoWidth,
  clips,
  highlights,
  captions,
  selectedClip,
  setSelectedClip
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [pushable, setPushable] = React.useState(false);

  const [ selectedCaptions, setSelectedCaptions ] = React.useState<Array<number>>([]);
  const previousSelectedClip = usePreviousValue(selectedClip);

  const videoRef = React.useRef<ReactPlayerProps>(null);

  React.useEffect(() => {
    if(selectedClip[0] == -1) { 
        setSelectedCaptions([]);
    } else {
        var newSelectedCaptions = [];
        for(var i = 0; i < captions.length; i++) {
            var c = captions[i];
            var selected = selectedClip[0] <= c.start && c.start < selectedClip[1]
            selected = selected || (selectedClip[0] < c.end && c.end <= selectedClip[1]);
            if(selected) {
                newSelectedCaptions.push(i);
            }
        }
        setSelectedCaptions(newSelectedCaptions);

        if(previousSelectedClip && videoRef.current) {
            console.log(selectedClip, previousSelectedClip);
            if(selectedClip[0] != previousSelectedClip[0] && selectedClip[1] == previousSelectedClip[1]) {
                videoRef.current.seekTo(selectedClip[0]/1000);
            } else if(selectedClip[0] == previousSelectedClip[0] && selectedClip[1] != previousSelectedClip[1]) {
                videoRef.current.seekTo(selectedClip[1]/1000);
            }
        }
    }
  }, [selectedClip]);

  // Update progress (current time) as video plays
  const updateProgress = (e : any) => {
    if(videoRef.current && isPlaying) {
      var currentTime = e.playedSeconds;
      setProgress(currentTime);
    }
  }

  const handleSelectCaption = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    var newSelectedCaptions = [...selectedCaptions];
    if(selectedCaptions.includes(idx)) {
        var position = selectedCaptions.indexOf(idx);
        if(position != 0 || position != selectedCaptions.length - 1) {
            newSelectedCaptions = [idx];
        } else {
            newSelectedCaptions.splice(position, 1);
        }
    } else if(idx + 1 == selectedCaptions[0]) {
        newSelectedCaptions = [idx].concat(newSelectedCaptions);
    } else if (selectedCaptions[selectedCaptions.length - 1] == idx - 1) {
        newSelectedCaptions = newSelectedCaptions.concat([idx]);
    } else {
        newSelectedCaptions = [idx];
    }

    var clip = [
        captions[newSelectedCaptions[0]].start, 
        captions[newSelectedCaptions[newSelectedCaptions.length - 1]].end
    ];
    changeClip(clip, -1);
  }

  const changeClip = (clip: Array<number>, idx: number) => {
    if(clip[0] < 0) clip[0] = 0;
    if(clip[1] > duration*1000) clip[1] = duration*1000;
    var clipValues = Object.values(clips);
    for(var i = 0; i < clipValues.length; i++) {
        var temp = clipValues[i];
        if(temp.start <= clip[0] && clip[0] < temp.end) {
            clip[0] = temp.end;
        } else if(temp.start < clip[1] && clip[1] <= temp.end) {
            clip[1] = temp.start;
        } else if(clip[0] <= temp.start && temp.end <= clip[1]) {
            return;
        }
    }
    if(clip[1] <= clip[0]) return;
    setSelectedClip(clip);
  }

  const handleClickOutside = (e: React.MouseEvent<HTMLElement>) => {
    setSelectedClip([-1, -1]);
    setSelectedCaptions([]);
  }

  var adjustedVideoWidth = videoWidth;
  var videoHeight = adjustedVideoWidth / 16 * 9;

  return (
    <div className="video__segmenter-container" onClick={handleClickOutside}>
        <div className="video__segmenter-container-inner">
            <div style={{width: adjustedVideoWidth + "px", height: videoHeight + "px"}}>
                <ReactPlayer 
                    ref={videoRef}
                    url={url} 
                    playing={isPlaying}
                    controls={true}
                    onReady={(e) => {videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration())}}
                    onProgress={(e) => {updateProgress(e)}}
                    width="100%" height="100%"
                    light={false}
                />
            </div>
            <div className="video__segmenter-timeline-label">
                {selectedClip[0] == -1 ? 
                    "No clip selected..." : 
                    (<span>Current Clip: <b>{`${timeToStr(selectedClip[0]/1000)}-${timeToStr(selectedClip[1]/1000)}`}</b></span>)} 
            </div>
            <AuthorTimeline duration={duration} width={adjustedVideoWidth} clips={clips} selectedClip={selectedClip} changeClip={changeClip}/>
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
                                {timeToStr(c['start']/1000)}
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