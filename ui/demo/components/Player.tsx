import * as React from 'react';
import {
  DocumentContext,
  TransformContext,
} from '@allenai/pdf-components';
import { Highlight, Clip, Caption } from '../types/clips';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

import { PlayerTimeline } from './PlayerTimeline';

interface Props {
  id: number;
  top: number;
  left?: number;
  clip: Clip;
  clips: Array<Clip>;
  highlights: Array<Highlight>;
  playingClip: number;
  setPlayingClip?: (id: number) => void;
  isFocus: boolean;
  isOverlay: boolean;
  isPhantom: boolean;
  handleNavigate?: (fromId: number, toId: number, isPlay: boolean) => void;
  navigateToPosition?: (clipId: number, highlightIdx: number) => void;
  toggleCaptions?: (clipId: number, isExpand: boolean) => void;
  toggleAltHighlights?: (clipId: number, isShow: boolean) => void;
  scrubPosition: number;
  videoWidth: number;
  playedHistory: Array<number>;
  updatePlayedHistory?: (clipId: number) => void;
  setFocusId?: (clipId: number) => void;
  setHoveredWord?: (data: {clipId: number, text: string} | null) => void;
}

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

function timeToStr(time: number) {
  var min = Math.floor(time / 60);
  var sec = Math.floor(time % 60);
  return (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
}

export function Player({
  id,
  top,
  left,
  clip,
  clips,
  highlights,
  playingClip, 
  setPlayingClip,
  isFocus,
  isOverlay,
  isPhantom,
  handleNavigate,
  navigateToPosition,
  toggleCaptions,
  toggleAltHighlights,
  scrubPosition,
  videoWidth,
  playedHistory,
  updatePlayedHistory,
  setFocusId,
  setHoveredWord,
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [pushable, setPushable] = React.useState(false);

  const [hoveredWordId, setHoveredWordId] = React.useState("");

  const videoRef = React.useRef<ReactPlayerProps>(null);

  // Update progress (current time) as video plays
  const updateProgress = (e : any) => {
    if(videoRef.current && isPlaying) {
      var currentTime = e.playedSeconds;
      setProgress(currentTime);

      var clipStart = clip.start;
      var actualTime = currentTime + clipStart;

      for(var i = 0; i < clip.captions.length; i++) {
        var caption = clip.captions[i];
        if(caption.start/1000 <= actualTime && actualTime <= caption.end/1000 && updatePlayedHistory) { 
          updatePlayedHistory(id);
        }
      }
    }
  }

  // If not navigating, let the clip be "pushable" (change top)
  React.useEffect(() => {
    if(!isOverlay)
      setPushable(true);
    else
      setPushable(false)
  }, [top]);

  // Pause or play depending on if it is the currently playing clip
  React.useEffect(() => {
    if(playingClip == id)
      setIsPlaying(true);
    else
      setIsPlaying(false);
  }, [playingClip]);

  React.useEffect(() => {
    if(isFocus && videoRef.current) {
      videoRef.current.seekTo(0, 'fraction')
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isFocus]);

  React.useEffect(() => {
    if(scrubPosition != -1 && !isPlaying && videoRef.current) {
      videoRef.current.seekTo(scrubPosition, 'fraction')
      setProgress(scrubPosition * duration);
    }
  }, [scrubPosition]);

  function handleNavigateWrapper(fromId: number, toId: number) {
    if(handleNavigate) {
      handleNavigate(fromId, toId, false);
      if(isPlaying && setPlayingClip) {
        setPlayingClip(-1);
      }
    }
  }

  // Navigate to another highlight in the paper
  function handleSideClick(e: React.MouseEvent) {
    e.stopPropagation();
    var temp = e.currentTarget.getAttribute("data-idx");
    var idx = temp == null ? -1: parseInt(temp);
    if(navigateToPosition)
      navigateToPosition(clip.id, idx);
  }

  // Expand or contract the captions
  function handleCaptionClick(e: React.MouseEvent) {
    e.stopPropagation();
    if(!isFocus) {
      if(setFocusId) {
        setFocusId(id);
      }
    } else if(toggleCaptions) {
      toggleCaptions(id,  !clip['expanded']);
    }
  }

  // Show or hide the alternative highlights
  function handleAltClick(e: React.MouseEvent) {
    e.stopPropagation();
    if(toggleAltHighlights)
    toggleAltHighlights(id,  !clip['alternatives']);
  }

  // When clip finishes, autoplay the next one
  function handleEnd() {
    return;
    // var fromIdx = clips.findIndex((c) => c.id == id);
    // if(fromIdx == clips.length - 1) return;
    // var toId = clips[fromIdx + 1].id;
    // if(handleNavigate)
    //   handleNavigate(id, toId, true);
  }

  function handlePlay() {
    if(setPlayingClip) {
      setPlayingClip(id);
    }
  }
  function handlePause() {
    if(setPlayingClip) {
      setPlayingClip(-1);
    }
  }

  var testSummaries = [
    "This is a presentation of OVRlap.",
    "The OVRlap technique allows users to see multiple viewpoints from a first-person perspective.",
    "The idea for OVRlap came from considering why people can only be in one place at a time, and how virtual reality could allow people to be in multiple places at once.",
    "The OVRlap technique allows users to see and interact with multiple distinct and distant locations from a first-person perspective."
  ]

  function renderHighlightNavigator() {
    if(!isFocus || highlights.length <= 1) return "";

    var otherHighlights: Array<Array<React.ReactElement>> = [];
    if(clip['alternatives']) {
      for(var i = 0; i < highlights.length; i++) {
        var highlight = highlights[i];
        if(i%2 == 0) {
          otherHighlights.push([]);
        } 
        otherHighlights[Math.floor(i/2)].push(
          <div 
            key={i}
            className="video__note-navigator-link"
            data-idx={i} onClick={handleSideClick}
            style={{opacity: i == clip.position ? "1" : "0.6"}}
          >
            <b>{highlight.id}</b> Example Test
          </div>
        );
      }
    }

    return (
      <div className="video__note-navigator">
        <div 
          className="video__note-navigator-row" 
          style={{fontSize: "14px", color: "rgba(0, 0, 0, 0.3)", cursor: "pointer", textDecoration: "underline"}}
          onClick={handleAltClick}
        >
          {clip.alternatives ? "Hide Other Highlights" : "Show Other Highlights"}
        </div>
        {otherHighlights.map((row, i) => {
          return (
            <div key={"row-" + i} className="video__note-navigator-row">
              {row}
            </div>
          )
        })}
      </div>
    )
  }

  function handleWordEnter(wordId: string, text: string) {
    if(setHoveredWord) {
      setHoveredWord({clipId: id, text: text});
      setHoveredWordId(wordId);
    }
  }
  function handleWordLeave() {
    if(setHoveredWord) {
      setHoveredWord(null);
      setHoveredWordId("");
    }
  }

  function renderCaptions() {
    var highlight = highlights[clip['position']];

    var tokens = highlight['tokens'].map((t) => t['text']);

    var summary = <div><b>Summary</b>&nbsp;&nbsp;{id < 4 ? testSummaries[id] : clip.captions[0].caption}</div>;
    if(scrubPosition != -1) {
      var scrubTime = (scrubPosition*duration + clip.start)*1000;
      var caption = clip['captions'].find((c: Caption) => c.start <= scrubTime && scrubTime < c.end);
      if(caption) {
        summary = (
          <div style={{color: color+"cc"}}>
            <b>Transcript</b>&nbsp;&nbsp;{caption.caption}
          </div>
        )
      }
    }

    var transcript = <></>;
    if(isFocus && !!clip.expanded) {
      transcript = (
        <div style={{lineBreak: "anywhere"}}>
          <b>Transcript</b>&nbsp;&nbsp;
          {clip['captions'].map((caption: Caption, i: number) => {
            var words = caption.caption.split(" ");
            var passed = caption.start/1000 < (clip.start + progress);
            return (
              words.map((text, j) => {
                var style = {
                  backgroundColor: color + (hoveredWordId == i+'-'+j ? "99" : (passed ? "33" : "00")),
                  fontWeight: tokens.includes(text) ? 700 : 400
                }
                return (
                  <span 
                    key={j} style={style}
                    onMouseEnter={() => handleWordEnter(i+'-'+j, text)} onMouseLeave={handleWordLeave}
                  >
                    {text}&nbsp;
                  </span>
                )
              })
            )
          })}
        </div>
      );
    }

    return (
      <div className="video__note-captions" onClick={handleCaptionClick}>
        {summary}
        {transcript}
        {isFocus ? 
          <div style={{textAlign: "center", color: "#999"}}>
            <i className={"fa fa-" + (clip.expanded ? "minus" : "plus")}></i>
          </div> : ""
        }
      </div>
    )
  }

  function handleClickNote(e: React.MouseEvent) {
    e.stopPropagation();
    if(setFocusId) {
      setFocusId(id);
    }
  }

  function handleMove(e: React.MouseEvent, direction: number) {
    e.stopPropagation();
    var fromIdx = clips.findIndex((c) => c.id == id);
    var toId = clips[fromIdx + direction].id;
    if(handleNavigate)
      handleNavigate(id, toId, true);
  }

  var newLeft = left ? left: 20;
  var adjustedVideoWidth = videoWidth * (isFocus ? 1 : 0.8)
  var videoHeight = adjustedVideoWidth / 16 * 9;

  // If clip is navigating, adjust the positions to be relative
  if(isOverlay && !left) {
      var container = document.getElementsByClassName('video__note-list')[0].getBoundingClientRect();
      newLeft = container.left + 20;
  }

  var color = colors[id % 7];
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
        transition: pushable ? "top 0.5s" : "none",
      }}
    >
      <div className="video__note-supercontainer">
        <div>
          {isFocus ? <PlayerTimeline id={id} clips={clips} width={videoWidth} handleNavigate={handleNavigateWrapper} playedHistory={playedHistory}/> : ""}
          <div className="video__note-container" style={{width: adjustedVideoWidth+"px", borderColor: color}}>
            <div style={{height: videoHeight+"px"}} onClick={handleClickNote}>
              {!isFocus ? <div className="video__note-timestamp" style={{backgroundColor: color}}>{timeToStr(duration)}</div> : ""}
              {isFocus && id != 0 ?
                <i key={0}
                  className="fa fa-chevron-left video__note-chevron-left"
                  style={{top: videoHeight/2 + 6 + "px"}}
                  onClick={(e) => handleMove(e, -1)}
                ></i> 
                : ""
              }
              {isFocus && id != clips.length - 1 ?
                <i key={1}
                  className="fa fa-chevron-right video__note-chevron-right"
                  style={{top: videoHeight/2 + 6 + "px"}}
                  onClick={(e) => handleMove(e, 1)}
                ></i>
                : ""
              }
              <ReactPlayer 
                  ref={videoRef}
                  url={'public/clips/'+id+'.mp4'} 
                  playing={isPlaying}
                  controls={isFocus}
                  onReady={(e) => {videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration())}}
                  onProgress={(e) => {updateProgress(e)}}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnd}
                  width="100%" height="100%"
                  light={false}
              />
            </div>
            {renderCaptions()}
          </div>
          {renderHighlightNavigator()}
        </div>
      </div>
    </div>
  );
}