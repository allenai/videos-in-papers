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
  url: string;
  numClips: number;
  handleNavigate: (from: number, to: number) => void;
  isOverlay: boolean;
  isReplacement: boolean;
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
  url, 
  numClips,
  handleNavigate,
  isOverlay,
  isReplacement
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const ref = React.useRef<ReactPlayerProps>(null);

  const updateProgress = (e : any) => {
    if(ref.current && isPlaying) {
      var currentTime = e.playedSeconds;
      setProgress(currentTime);
    }
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
      key={id}
      id={"video__note-" + id}
      className="video__note" data-index={id}
      style={{
        top: top+"px", left: left + "px", 
        zIndex: isOverlay ? 3 : 1, 
        position: isOverlay ? "fixed" : "absolute",
        opacity: isReplacement ? 0.5 : 1,
      }} 
    >
      <div className="video__note-navigator">
        <div style={{color: "#999"}} onClick={() => handleNavigate(id, id-1 < 0 ? numClips-1 : id-1)}>
          {"<"}
        </div>
        <div> {id+1}/{numClips} </div>
        <div style={{color: "#999"}} onClick={() => handleNavigate(id, (id+1)%numClips)}>
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
  );
}