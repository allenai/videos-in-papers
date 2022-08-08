import React, { useState, useEffect } from "react";
import type { IHighlight } from "./react-pdf-highlighter";
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  highlights: Array<IHighlight>;
  currHighlight: IHighlight | null;
  updateCurrHighlight: (highlight: IHighlight | null) => void;
  videoUrl: string;
  isTest: number;
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
  "#ff0000",
  "#ff7f00",
  "#ffff00",
  "#00ff00",
  "#0000ff",
  "#00ffff",
  "#7f00ff",
  "#ff00ff",
];

export function Player({
  highlights,
  currHighlight,
  updateCurrHighlight,
  videoUrl,
  isTest
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(currHighlight);
  const [duration, setDuration] = useState(0);

  const ref = React.useRef<ReactPlayerProps>(null);
  const highlightRef = React.useRef<HTMLDivElement>(null);

  const clickBtn = () => {
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
      setProgress(e.target.value);
      ref.current.seekTo(e.target.value);
    }
  }

  const updateProgress = (e : any) => {
    if(ref.current && isPlaying) {
      var currentTime = e.playedSeconds;
      checkCurrHighlight(currentTime);
      setProgress(currentTime);
    }
  }

  const makeHighlight = (highlight: IHighlight, color: string) => {
    if(!highlightRef.current || !ref.current || highlight == null) return;
    var totalWidth = highlightRef.current.offsetWidth;
    var totalDuration = duration;

    var highlightTime = highlightToTime(highlight);

    var highlightDuration = highlightTime[1] - highlightTime[0];
    var highlightWidth = totalWidth * highlightDuration / totalDuration;
    var highlightLeft = totalWidth * highlightTime[0] / totalDuration;

    return (
      <div 
        style={{
          position: "absolute",
          height: "16px", 
          width: highlightWidth+"px", 
          left: highlightLeft+"px", 
          backgroundColor: color,
          cursor: "pointer",
        }}
        onClick={() => updateCurrHighlight(highlight)}
      ></div>
    )
  }

  var unduplicated : Array<IHighlight> = [];
  for(var i = 0; i < highlights.length; i++) {
    var highlight = highlights[i];
    if(unduplicated.findIndex(h => h.comment.text === highlight.comment.text) === -1) {
      unduplicated.push(highlight);
    }
  }

  return (
    <div className="sidebar" style={{ width: "46vw", padding: "0 2vw", display: "flex", justifyContent: "center", flexDirection: "column"}}>
      <div>
        {isTest ? <button onClick={clickBtn}>Save</button> : ""}
        <div style={{textAlign: "center", paddingBottom: "4px", fontSize: "20px"}}>
          <span>
            <b>{secondsToTimeStr(progress)}</b> / {ref.current ? secondsToTimeStr(ref.current.getDuration()) : ""}
          </span>
        </div>
        <div style={{ position: "relative", paddingTop: "56.25%", marginBottom: "8px" }}>
            <ReactPlayer 
                ref={ref}
                url={videoUrl} 
                playing={isPlaying}
                controls={false}
                onReady={(e) => {ref.current == null ? 0 : setDuration(ref.current.getDuration())}}
                onProgress={(e) => {updateProgress(e)}}
                onPlay={() => {setIsPlaying(true)}}
                onPause={() => {setIsPlaying(false)}}
                width="100%" height="100%"
                style={{ position: "absolute", top: "0", left: "0" }}
            />
        </div>
        <input className="slider" 
          type="range" value={progress} style={{width: "100%", margin: "0px"}}
          min="0" max={duration}
          onMouseDown={() => setIsPlaying(false)} onMouseUp={() => setIsPlaying(true)} onChange={onProgressChange}
        />
        <div ref={highlightRef} style={{width: "100%", height: "20px", position: "relative"}}>
          {unduplicated.map((highlight) => {
            var currIdx = -1;
            if(currHighlight !== null)
              currIdx = parseInt(currHighlight.comment.text.split("-")[2]);
            var idx = parseInt(highlight.comment.text.split("-")[2]);
            var color = colors[idx % colors.length] + (currIdx == idx ? "60" : "20");
            return makeHighlight(highlight, color);
          })}
        </div>
      </div>
    </div>
  );
}
