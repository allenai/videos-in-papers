import * as React from 'react';
import {
  DocumentContext,
} from '@allenai/pdf-components';
import { Mappings, Snippet } from '../types/annotations';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  index: number;
  top: number;
  url: string;
  data: Array<Mappings>;
  current: number;
  changeCurrent: (index: number) => void;
  handleNavigate: (e: any) => void;
  isOverlay?: boolean;
}

type Caption = {
  text: string;
  start_time: number;
  duration: number;
}

const colors = [
  "#ffe28f",
  "#f7bcbb", "#f8bbd0", "#eebff8", "#bbdefb", "#b2dfdb", 
  "#c8e6c9", "#aed581", "#ffe082", "#ffe0b2", "#ffccbc",
]

function parseStrToTime(str: string) {
  const [minutes, seconds] = str.split(':').map(Number);
  return minutes * 60 + seconds;
}

export function Player({
  index,
  top,
  url, 
  data,
  current,
  changeCurrent,
  handleNavigate,
  isOverlay
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentHighlight, setCurrentHighlight] = React.useState<number>(current);
  const [captions, setCaptions] = React.useState<Array<Caption>>([]);
  const [duration, setDuration] = React.useState(0);
  const [currentCaption, setCurrentCaption] = React.useState<number>(0);

  const ref = React.useRef<ReactPlayerProps>(null);
  const snippetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const captions = fetch('/data/textData/conddel_video.json')
      .then((response) => response.json())
      .then((data) => setCaptions(data));
  }, []);

  React.useEffect(() => {
    if (currentHighlight == current) return;
    setCurrentHighlight(current);
    if (ref.current && currentHighlight != -1) {
      setIsPlaying(true);
      var currentData = data.find(d => parseInt(d.id) == currentHighlight);
      if(currentData) {
        ref.current.seekTo(currentData.timestamp.start);
      }
    }
  }, [current]);

  const checkCurrHighlight = (currentTime: number) => {
    var currentData = data.find(d => parseInt(d.id) == currentHighlight);
    for(var i = 0; i < data.length; i++) {
      var highlight = data[i];
      var startTime = highlight.timestamp.start;
      var endTime = highlight.timestamp.end;
      if ((currentTime >= startTime && currentTime <= endTime)) {
        if(currentHighlight != -1 && currentData && currentData.id === highlight.id) return;
        setCurrentHighlight(parseInt(highlight.id));
        changeCurrent(parseInt(highlight.id));
        return;
      }
    }
    setCurrentHighlight(-1);
    changeCurrent(-1);
  }


  const onProgressChange = (e : any) => {
    if(ref.current) {
      setProgress(e.target.value);
      ref.current.seekTo(e.target.value);
    }
  }

  const checkCurrCaption = (currentTime: number) => {
    for(var i = 0; i < captions.length; i++) {
      var caption = captions[i];
      var startTime = caption.start_time;
      var endTime = caption.start_time + caption.duration;
      if ((currentTime >= startTime/1000 && currentTime <= endTime/1000)) {
        if(currentCaption != i) {
          setCurrentCaption(i);
        }
        return;
      }
    }
  }


  const updateProgress = (e : any) => {
    if(ref.current && isPlaying) {
      var currentTime = e.playedSeconds;
      checkCurrHighlight(currentTime);
      checkCurrCaption(currentTime)
      setProgress(currentTime);
    }
  }

  const colorWheel = ["#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"];
  const makeSnippet = (snippet: Snippet, id: string) => {
    if(!snippetRef.current || !ref.current || snippet == null) return;

    var totalWidth = snippetRef.current.offsetWidth;
    var totalDuration = duration;

    var snippetDuration = snippet.end - snippet.start;
    var width = totalWidth * snippetDuration / totalDuration;
    var left = totalWidth * snippet.start / totalDuration;

    return (
      <div 
        id={"snippet-" + id}
        key={id}
        style={{
          position: "absolute",
          height: "16px", 
          width: width+"px", 
          left: left+"px", 
          backgroundColor: colorWheel[parseInt(id) % colorWheel.length],
          cursor: "pointer",
        }}
        onClick={() => {
          changeCurrent(parseInt(id));
        }}
      ></div>
    )
  }

  const handleCaptionClick = (e: any) => {
    e.stopPropagation();
    var idx = parseInt(e.target.getAttribute('data-idx'));
    if(ref && ref.current) {
      ref.current.seekTo(captions[idx].start_time/1000);
      setIsPlaying(true);
      setCurrentCaption(idx);
    }
  }

  var unduplicated : Array<Mappings> = [];
  for(var i = 0; i < data.length; i++) {
    var highlight = data[i];
    if(unduplicated.findIndex(h => h.id === highlight.id) === -1) {
      unduplicated.push(highlight);
    }
  }

  var pageWidth = pageDimensions.width;
  var left = pageWidth + 48*2;
  var videoWidth = window.innerWidth - left - 48 - 240;
  var videoHeight = videoWidth/16*9;

  return (
    <div className="video__note" style={{top: top+"px", left: left+"px", zIndex: isOverlay ? 3 : 1}} onClick={handleNavigate}>
      <div className="video__note-container" style={{width: videoWidth+"px", borderColor: colors[index]}}>
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
            />
        </div>
        <div className="video__note-captions">
          {captions.map((caption, idx) => {
            if(idx > 2) return;
            return (
              <div 
                key={idx} data-idx={idx} 
                className="player__caption" onClick={handleCaptionClick}
                style={currentCaption == idx ? {backgroundColor: "rgba(0,0,0,0.1)"} : {}}
              >
                {caption.text}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}


{/* <input className="slider" 
type="range" value={progress} style={{width: "100%", margin: "0px"}}
min="0" max={duration}
onMouseDown={() => setIsPlaying(false)} onMouseUp={() => setIsPlaying(true)} onChange={onProgressChange}
/>
<div ref={snippetRef} style={{width: "100%", height: "20px", position: "relative"}}>
{unduplicated.map((highlight, idx) => {
  // var currIdx = -1;
  // if(currHighlight !== null)
  //   currIdx = parseInt(currHighlight.comment.text.split("-")[2]);
  // var idx = parseInt(highlight.comment.text.split("-")[2]);
  var color = colors[idx % colors.length] //+ (currIdx == idx ? "ff" : "40");
  return makeSnippet(highlight.timestamp, highlight.id);
})}
</div> */}