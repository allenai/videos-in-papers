import * as React from 'react';
import {
  DocumentContext,
  TransformContext,
} from '@allenai/pdf-components';
import { Highlight, Clip, Caption } from '../types/annotations';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

import { PlayerTimeline } from './PlayerTimeline';

interface Props {
  id: number;
  top: number;
  clip: Clip;
  clips: Array<Clip>;
  highlights: Array<Highlight>;
  playingClip: number;
  setPlayingClip: (id: number) => void;
  isOverlay: boolean;
  isPhantom: boolean;
  handleNavigate?: (fromId: number, toId: number, isPlay: boolean) => void;
  navigateToPosition?: (clipId: number, highlightIdx: number) => void;
  toggleCaptions?: (clipId: number, isExpand: boolean) => void;
  toggleAltHighlights?: (clipId: number, isShow: boolean) => void;
  scrubClip: {clip: number, progress: number};
  videoWidth: number;
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
  clip,
  clips,
  highlights,
  playingClip, 
  setPlayingClip,
  isOverlay,
  isPhantom,
  handleNavigate,
  navigateToPosition,
  toggleCaptions,
  toggleAltHighlights,
  scrubClip,
  videoWidth,
}: Props) {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [pushable, setPushable] = React.useState(false);

  const videoRef = React.useRef<ReactPlayerProps>(null);

  // Update progress (current time) as video plays
  const updateProgress = (e : any) => {
    if(videoRef.current && isPlaying) {
      var currentTime = e.playedSeconds;
      setProgress(currentTime);
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
    if(scrubClip && scrubClip.clip == id) {
      videoRef.current.seekTo(scrubClip.progress, 'fraction')
    }
  }, [scrubClip]);

  function handleNavigateWrapper(fromId: number, toId: number) {
    if(handleNavigate) {
      handleNavigate(fromId, toId, false);
      if(isPlaying)
        setPlayingClip(-1);
    }
  }

  // Navigate to another highlight in the paper
  function handleSideClick(e: React.MouseEvent) {
    var idx = parseInt(e.currentTarget.getAttribute("data-idx"));
    if(navigateToPosition)
      navigateToPosition(clip.id, idx);
  }

  // Expand or contract the captions
  function handleCaptionClick(e: React.MouseEvent) {
    if(toggleCaptions)
      toggleCaptions(id,  !clip['expanded']);
  }

  // Show or hide the alternative highlights
  function handleAltClick(e: React.MouseEvent) {
    if(toggleAltHighlights)
    toggleAltHighlights(id,  !clip['alternatives']);
  }

  // When clip finishes, autoplay the next one
  function handleEnd() {
    var fromIdx = clips.findIndex((c) => c.id == id);
    if(fromIdx == clips.length - 1) return;
    var toId = clips[fromIdx + 1].id;
    if(handleNavigate)
      handleNavigate(id, toId, true);
  }

  function handlePlay() {
    setPlayingClip(id);
  }
  function handlePause() {
    setPlayingClip(-1);
  }

  var left = 20;
  var videoHeight = videoWidth / 16 * 9;
  
  // If clip is navigating, adjust the positions to be relative
  if(isOverlay) {
      var container = document.getElementsByClassName('video__note-list')[0].getBoundingClientRect();
      left = container.left + 20;
  }

  var testSummaries = [
    "This is a presentation of OVRlap.",
    "The OVRlap technique allows users to see multiple viewpoints from a first-person perspective.",
    "The idea for OVRlap came from considering why people can only be in one place at a time, and how virtual reality could allow people to be in multiple places at once.",
    "The OVRlap technique allows users to see and interact with multiple distinct and distant locations from a first-person perspective."
  ]
  var caption_text = clip['captions'].map((c: Caption) => c['caption'].trim()).join(" ");

  var otherHighlights = [];
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
          <PlayerTimeline id={id} clip={clip} clips={clips} width={videoWidth} handleNavigate={handleNavigateWrapper}/>
          <div className="video__note-container" style={{width: videoWidth+"px", borderColor: colors[id % 7]}}>
            <div style={{height: videoHeight+"px"}}>
                <ReactPlayer 
                    ref={videoRef}
                    url={'public/clips/'+id+'.mp4'} 
                    playing={isPlaying}
                    controls={true}
                    onReady={(e) => {videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration())}}
                    onProgress={(e) => {updateProgress(e)}}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={handleEnd}
                    width="100%" height="100%"
                />
            </div>
            <div className="video__note-captions" onClick={handleCaptionClick}>
              <b>Summary</b>&nbsp;&nbsp;{id < 4 ? testSummaries[id] : caption_text.split(".")[0]}
              {!!clip.expanded ? [<br/>, <span><b>Transcript</b>&nbsp;&nbsp;{caption_text}</span>] : ""}
              <div style={{textAlign: "center", color: "#999"}}>
                <i className={"fa fa-" + (clip.expanded ? "minus" : "plus")}></i>
              </div>
            </div>
          </div>
          {highlights.length > 1 ?
            <div className="video__note-navigator">
              <div 
                className="video__note-navigator-row" 
                style={{fontSize: "18px", color: "rgba(0, 0, 0, 0.3)", cursor: "pointer"}}
                onClick={handleAltClick}
              >
                <i className={"fa fa-chevron-" + (clip.alternatives ? "up" : "down")}></i>
              </div>
              {otherHighlights.map((row, i) => {
                return (
                  <div key={"row-" + i} className="video__note-navigator-row">
                    {row}
                  </div>
                )
              })}
            </div> :
            ""
          }
        </div>
      </div>
    </div>
  );
}