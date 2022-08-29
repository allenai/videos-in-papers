import * as React from 'react';
import {
  DocumentContext,
} from '@allenai/pdf-components';
import { Highlight, Clip } from '../types/annotations';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  id: number;
  top: number;
  clip: Clip;
  highlights: Array<Highlight>;
  url: string;
  numClips: number;
  handleNavigate: (id: number, direction: number) => void;
  isOverlay: boolean;
  isPhantom: boolean;
  navigateToPosition: (clipId: number, highlightIdx: number) => void;
}

type Caption = {
  text: string;
  start_time: number;
  duration: number;
}

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

function parseStrToTime(str: string) {
  const [minutes, seconds] = str.split(':').map(Number);
  return minutes * 60 + seconds;
}

export function Player({
  id,
  top,
  clip,
  highlights,
  url, 
  numClips,
  handleNavigate,
  isOverlay,
  isPhantom,
  navigateToPosition
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isShove, setIsShove] = React.useState(false);

  const ref = React.useRef<ReactPlayerProps>(null);

  React.useEffect(() => {
    if(!isOverlay && !isPhantom) {
      setIsShove(true);
    } else {
      setIsShove(false);
    }
  }, [top]);

  const updateProgress = (e : any) => {
    if(ref.current && isPlaying) {
      var currentTime = e.playedSeconds;
      setProgress(currentTime);
    }
  }

  const handleSideClick = (e: any) => {
    var idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    navigateToPosition(clip.id, idx);
  }

  var left = 40;
  var videoWidth = 420;
  var videoHeight = videoWidth/16*9;

  // if it is overlaid, position is relative so adjust
  if(isOverlay) {
      var container = document.getElementsByClassName('video__note-list')[0].getBoundingClientRect();
      left = container.left + 40;
  }

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
            <div style={{color: "#999"}} onClick={() => handleNavigate(id, -1)}>
              {"<"}
            </div>
            <div> {id+1}/{numClips} </div>
            <div style={{color: "#999"}} onClick={() => handleNavigate(id, 1)}>
              {">"}
            </div>
          </div>
          <div className="video__note-container" style={{width: videoWidth+"px", borderColor: colors[id % 7]}}>
            <div style={{height: videoHeight+"px"}}>
                <ReactPlayer 
                    ref={ref}
                    url={url} 
                    playing={isPlaying}
                    controls={! url.includes('youtube')}
                    onReady={(e) => {ref.current == null ? 0 : setDuration(ref.current.getDuration())}}
                    onProgress={(e) => {updateProgress(e)}}
                    onPlay={() => {setIsPlaying(true)}}
                    onPause={() => {setIsPlaying(false)}}
                    width="100%" height="100%"
                    light={true}
                />
            </div>
            <div className="video__note-captions">
              Caption summary would go here.
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