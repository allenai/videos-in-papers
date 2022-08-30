import * as React from 'react';
import {
  DocumentContext,
} from '@allenai/pdf-components';
import { Highlight, Clip, Caption } from '../types/annotations';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  id: number;
  top: number;
  clip: Clip;
  highlights: Array<Highlight>;
  url: string;
  numClips: number;
  isOverlay: boolean;
  isPhantom: boolean;
  handleNavigate?: (fromId: number, toId: number) => void;
  navigateToPosition?: (clipId: number, highlightIdx: number) => void;
  toggleCaptions?: (clipId: number, isExpand: boolean) => void;
}

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

function parseStrToTime(str: string) {
  const [minutes, seconds] = str.split(':').map(Number);
  return minutes * 60 + seconds;
}

function timeToStr(time: number) {
  var min = Math.floor(time / 60);
  var sec = Math.floor(time % 60);
  return (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
}

export function Player({
  id,
  top,
  clip,
  highlights,
  url, 
  numClips,
  isOverlay,
  isPhantom,
  handleNavigate,
  navigateToPosition,
  toggleCaptions
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isShove, setIsShove] = React.useState(false);

  const videoRef = React.useRef<ReactPlayerProps>(null);

  const updateProgress = (e : any) => {
    if(videoRef.current && isPlaying) {
      var currentTime = e.playedSeconds;
      setProgress(currentTime);
    }
  }

  React.useEffect(() => {
    if(!isOverlay) {
      setIsShove(true);
    } else {
      setIsShove(false)
    }
  }, [top]);

  const handleNavigateClick = (id: number, direction: number) => {
    var fromId = id;
    var toId = fromId + direction;
    if(toId < 0) {
      toId = numClips -1;
    } else if(toId >= numClips) {
      toId = 0;
    }
    if(handleNavigate)
      handleNavigate(fromId, toId);
    setIsPlaying(false);
  }

  const handleSideClick = (e: any) => {
    var idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    if(navigateToPosition)
      navigateToPosition(clip.id, idx);
  }

  const handleCaptionClick =  (e: any) => {
    console.log('hey')
    if(toggleCaptions)
      toggleCaptions(id,  !clip['expanded']);
  }


  var left = 40;
  var videoHeight = pageDimensions.height * 0.25;
  var videoWidth = videoHeight/9*16

  // if it is overlaid, position is relative so adjust
  if(isOverlay) {
      var container = document.getElementsByClassName('video__note-list')[0].getBoundingClientRect();
      left = container.left + 40;
  }

  var caption_text = clip['captions'].map((c: Caption) => c['caption'].trim()).join(" ");

  return (
    <div 
      id={"video__note-" + id}
      className="video__note" data-index={id}
      style={{
        zIndex: isOverlay ? 3 : 1, 
        position: isOverlay ? "fixed" : "absolute",
        top: top+"px", left: left + "px", 
        opacity: isPhantom ? 0.2 : 1,
        pointerEvents: isPhantom ? "none" : "auto",
        transition: isShove ? "top 0.5s" : "none",
      }}
    >
      <div className="video__note-supercontainer">
        <div>
          <div className="video__note-timeline">
            <div style={{color: "#999"}} onClick={() => handleNavigateClick(id, -1)}>
              {"<"}
            </div>
            <div> {(id+1) % 100000}/{numClips} </div>
            <div style={{color: "#999"}} onClick={() => handleNavigateClick(id, 1)}>
              {">"}
            </div>
          </div>
          <div className="video__note-container" style={{width: videoWidth+"px", borderColor: colors[id % 7]}}>
            <div style={{height: videoHeight+"px"}}>
                <ReactPlayer 
                    ref={videoRef}
                    url={'public/clips/'+id+'.mp4'} 
                    playing={isPlaying}
                    controls={true}
                    onReady={(e) => {videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration())}}
                    onProgress={(e) => {updateProgress(e)}}
                    onPlay={() => {setIsPlaying(true)}}
                    onPause={() => {setIsPlaying(false)}}
                    width="100%" height="100%"
                />
            </div>
            <div className="video__note-captions" onClick={handleCaptionClick}>
              <div className="video__note-timestamp">
                <div style={{textAlign: "center"}}>
                  <div style={{fontWeight: "bold"}}>{timeToStr(progress)}</div> 
                  <div style={{color: "#999"}}>{timeToStr(duration)}</div>
                </div>
                <div>
                  <i className={"fa fa-chevron-" + (clip.expanded ? "up" : "down")}></i>
                </div>
              </div>
              <div style={{flex: 1}}>
                {!!clip.expanded ? caption_text : caption_text.split(".")[0]}
              </div>
            </div>
          </div>
        </div>
        <div className="video__note-navigator">
          {highlights.map((highlight, i) => {
            return (
              <div 
                key={i}
                data-idx={i} onClick={handleSideClick}
                style={{opacity: i == clip.position ? "1" : "0.6"}}
              >
                <div className="video__note-navigator-link">
                  <b>{highlight.id}</b> Example Test
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}