import * as React from 'react';

import {
    DocumentContext,
    TransformContext,
  } from '@allenai/pdf-components';

import { Player } from './Player';
import { Highlight, Clip } from '../types/clips';

import { spreadOutClips } from '../utils/positioning';

type Props = {
  url: string;
  clips: {[index: number]: Clip};
  highlights: {[index: number]: Highlight};
  navigating: {
    fromId: number;
    toId: number;
    fromTop: number;
    toTop: number;
    scrollTo: number;
    position: number;
  };
  handleNavigate: (fromId: number, toId: number) => void;
  navigateToPosition: (clipId: number, highlightIdx: number) => void;
  toggleCaptions: (clipId: number, isExpand: boolean) => void;
  toggleAltHighlights: (clipId: number, isShow: boolean) => void;
  scrubClip: {highlight: number, clip: number, progress: number};
  videoWidth: number;
  playedHistory: {[id: number]: {isPlayed: boolean, captions: Array<number>}};
  updatePlayedHistory: (clipId: number, captionIdx: number) => void;
};

export const VideoNotes: React.FunctionComponent<Props> = ({
    url,
    clips,
    highlights,
    navigating,
    handleNavigate,
    navigateToPosition,
    toggleCaptions,
    toggleAltHighlights,
    scrubClip,
    videoWidth,
    playedHistory,
    updatePlayedHistory,
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const [ processedClips, setProcessedClips ] = React.useState<{[index: number]: Clip}>({});

  // ID of the clip that is currently playing
  const [ playingClip, setPlayingClip ] = React.useState(-1);

  // On load, find top positions of clips so that they are spread out
  React.useEffect(() => {
    if(pageDimensions.height == 0 || videoWidth == 0) return;
    setProcessedClips(spreadOutClips(clips, videoWidth, pageDimensions.height * scale));
  }, [pageDimensions, clips, videoWidth]);

  // Navigate and change playingClip if autoplaying
  function handleNavigateWrapper(fromId: number, toId: number, isPlay: boolean) {
    handleNavigate(fromId, toId);
    if(isPlay)
      setPlayingClip(toId);
  }

  // Render a phantom clip to act as placeholder for clips during navigation
  function renderPhantom(timeOrderedClips: Array<Clip>): React.ReactElement {
    var clip = processedClips[navigating.toId];
    var id = clip.id
    var top = (clip.top + clip.page) * pageDimensions.height * scale + (24 + clip.page * 48);
    return (
      <Player 
        key={"phantom-" + id}
        id={id+100000} 
        top={top}
        clip={clip} 
        clips={timeOrderedClips}
        highlights={clip['highlights'].map((id: number) => highlights[id])}
        url={url} 
        numClips={Object.keys(clips).length}
        isOverlay={false} 
        isPhantom={true}
        videoWidth={videoWidth}
        playedHistory={playedHistory}
      />      
    )
  }

  // Render all the clips
  function renderClips(): Array<React.ReactElement> {
    var timeOrderedClips = Object.values(clips);
    timeOrderedClips.sort((a, b) => a['start'] - b['start']);
    var clipsHTML = Object.keys(processedClips).map((i: string) => {
      var id = parseInt(i);
      var clip = processedClips[id];
      var top = (clip.top + clip.page) * pageDimensions.height * scale + (24 + clip.page * 48);
      var isOverlay = false;
      var isPhantom = false;
      if(navigating !== null && navigating.fromId == id) {
          isPhantom = true;
      } else if(navigating !== null && navigating.toId == id) {
          top = navigating.fromTop;
          isOverlay = true;
      }
      return (
          <Player 
              key={id} 
              id={id} 
              top={top}
              clip={clip} 
              clips={timeOrderedClips}
              highlights={clip['highlights'].map((id: number) => highlights[id])}
              playingClip={playingClip}
              setPlayingClip={setPlayingClip}
              isOverlay={isOverlay} 
              isPhantom={isPhantom}
              handleNavigate={handleNavigateWrapper}
              navigateToPosition={navigateToPosition}
              toggleCaptions={toggleCaptions}
              toggleAltHighlights={toggleAltHighlights}
              scrubPosition={(scrubClip != null && scrubClip.clip == id && scrubClip.highlight == clip.highlights[clip.position]) ? scrubClip.progress : -1}
              videoWidth={videoWidth}
              playedHistory={playedHistory}
              updatePlayedHistory={updatePlayedHistory}
          />
      )
    });
    if(navigating != null && navigating.position == null) {
      clipsHTML.push(renderPhantom(timeOrderedClips));
    }
    return clipsHTML;
  }

  return (
    <div className="video__note-list" style={{width: videoWidth + 40 + "px"}}>
        {renderClips()}
    </div>
  )
};
