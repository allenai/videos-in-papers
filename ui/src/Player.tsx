import React, { useState, useEffect } from "react";
import type { IHighlight } from "./react-pdf-highlighter";
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  highlights: Array<IHighlight>;
  currHighlight: IHighlight | null;
  updateCurrHighlight: (highlight: IHighlight | null) => void;
  videoUrl: string;
}

// const updateHash = (highlight: IHighlight) => {
//   document.location.hash = `highlight-${highlight.id}`;
// };

function highlightToTime(highlight: IHighlight) {
  var startTimeStr = highlight.comment.text.split("-")[0];
  var [minutes, seconds] = startTimeStr.split(":");
  var startTime = parseInt(minutes) * 60 + parseInt(seconds);
  var endTimeStr = highlight.comment.text.split("-")[1];
  var [minutes, seconds] = endTimeStr.split(":");
  var endTime = parseInt(minutes) * 60 + parseInt(seconds);
  return [startTime, endTime];
}

function secondsToTimeStr(seconds: number) {
  seconds = Math.floor(seconds)
  var minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  var minutesStr = minutes.toString();
  var secondsStr = seconds.toString();
  if(seconds < 10) {
    secondsStr = "0" + seconds;
  }
  if(minutes < 10) {
    minutesStr = "0" + minutes;
  }
  return `${minutesStr}:${secondsStr}`;
}

const colors = [
  "#ffe28f",
  "#f7bcbb", "#f8bbd0", "#eebff8", "#bbdefb", "#b2dfdb", 
  "#c8e6c9", "#aed581", "#ffe082", "#ffe0b2", "#ffccbc",
]


export function Player({
  highlights,
  currHighlight,
  updateCurrHighlight,
  videoUrl
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(currHighlight);

  const ref = React.useRef<ReactPlayerProps>(null);
  const highlightRef = React.useRef<HTMLDivElement>(null);

  const clickBtn = () => {
    if (ref.current) {
      ref.current.seekTo(0);
    }
    console.log(highlights);
  };

  useEffect(() => {
    if (ref.current && currHighlight != null && (current == null || currHighlight.id !== current.id)) {
      setIsPlaying(true);
      ref.current.seekTo(highlightToTime(currHighlight)[0]);
    }
  }, [currHighlight]);

  const checkCurrHighlight = (currentTime: number) => {
    for(var i = 0; i < highlights.length; i++) {
      var highlight = highlights[i];
      var [startTime, endTime] = highlightToTime(highlight);
      if ((currentTime >= startTime && currentTime <= endTime)) {
        if(current != null && current.comment.text.split("-")[2] === highlight.comment.text.split("-")[2]) return;
        setCurrent(highlight);
        updateCurrHighlight(highlight);
        return;
      }
    }
    setCurrent(null);
    updateCurrHighlight(null);
  }

  const onProgressChange = (e : any) => {
    if(ref.current) {
      var duration = ref.current.getDuration()
      setProgress(e.target.value);
      ref.current.seekTo(duration * e.target.value / 100);
    }
  }

  const updateProgress = (e : any) => {
    if(ref.current && isPlaying) {
      var duration = ref.current.getDuration();
      var currentTime = e.playedSeconds;
      checkCurrHighlight(currentTime);
      setProgress(currentTime / duration * 100);
    }
  }

  const makeHighlight = (highlight: IHighlight, color: string) => {
    if(!highlightRef.current || !ref.current || highlight == null) return;
    var totalWidth = highlightRef.current.offsetWidth;
    var totalDuration = ref.current.getDuration();

    var highlightTime = highlightToTime(highlight);

    var highlightDuration = highlightTime[1] - highlightTime[0];
    var highlightWidth = totalWidth * highlightDuration / totalDuration;
    var highlightLeft = totalWidth * highlightTime[0] / totalDuration;

    return (
      <div style={{position: "absolute", height: "16px", width: highlightWidth+"px", left: highlightLeft+"px", backgroundColor: color}}>
      </div>
    )
  }

  return (
    <div className="sidebar" style={{ width: "46vw", padding: "0 2vw", display: "flex", justifyContent: "center", flexDirection: "column"}}>
      <div>
        <button onClick={clickBtn}>Save</button>
        <div>
          <span>
            {ref.current ? secondsToTimeStr(ref.current.getDuration()*progress/100) : ""} / {ref.current ? secondsToTimeStr(ref.current.getDuration()) : ""}
          </span>
        </div>
        <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <ReactPlayer 
                ref={ref}
                url={videoUrl} 
                playing={isPlaying}
                controls={true}
                onProgress={(e) => {updateProgress(e)}}
                onPlay={() => {setIsPlaying(true)}}
                onPause={() => {setIsPlaying(false)}}
                width="100%" height="100%"
                style={{ position: "absolute", top: "0", left: "0" }}
            />
        </div>
        <input className="slider" 
          type="range" value={progress} style={{width: "100%", margin: "0px"}}
          onMouseDown={() => setIsPlaying(false)} onMouseUp={() => setIsPlaying(true)} onChange={onProgressChange}
        />
        <div ref={highlightRef} style={{width: "100%", height: "20px", position: "relative"}}>
          {highlights.map((highlight) => {
            var currIdx = -1;
            if(currHighlight !== null)
              currIdx = parseInt(currHighlight.comment.text.split("-")[2]);
            var idx = parseInt(highlight.comment.text.split("-")[2]);
            var color = colors[idx % colors.length] + (currIdx == idx ? "ff" : "40");
            return makeHighlight(highlight, color);
          })}
        </div>
      </div>
    </div>
  );
}
