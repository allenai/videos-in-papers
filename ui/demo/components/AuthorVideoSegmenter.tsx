import * as React from 'react';
import {
  DocumentContext,
  TransformContext,
} from '@allenai/pdf-components';
import { Highlight, Clip, Caption } from '../types/clips';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';

import { AuthorTimeline } from './AuthorTimeline';

const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

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

  const videoRef = React.useRef<ReactPlayerProps>(null);

  React.useEffect(() => {
    if(selectedClip[0] == -1) setSelectedCaptions([]);
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
    var clipValues = Object.values(clips);
    for(var i = 0; i < clipValues.length; i++) {
        var temp = clipValues[i];
        if(temp.start <= captions[idx].start && captions[idx].end <= temp.end) {
            return
        }
    }
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
    setSelectedClip(clip);
    setSelectedCaptions(newSelectedCaptions);
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
            <AuthorTimeline duration={duration} width={adjustedVideoWidth} clips={clips} selectedClip={selectedClip}/>
            <div className="video__segmenter-transcript">
                {captions.map((c, i) => {
                    var selected = selectedClip[0] <= c.start && c.start < selectedClip[1]
                    selected = selected || (selectedClip[0] < c.end && c.end <= selectedClip[1]);
                    return (
                        <div 
                            key={i}
                            className={"video__segmenter-transcript-container" + (selected ? " video__segmenter-transcript-container-selected" : "")}
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