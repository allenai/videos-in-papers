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
};

export const VideoNotes: React.FunctionComponent<Props> = ({
    url,
    clips,
    highlights,
    navigating,
    handleNavigate,
    navigateToPosition,
    toggleCaptions
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const [ processedClips, setProcessedClips ] = React.useState({});

  const [ playingClip, setPlayingClip ] = React.useState(-1);

  React.useEffect(() => {
    if(pageDimensions.height == 0) return;
    setProcessedClips(spreadOutClips(clips, pageDimensions.height));
  }, [pageDimensions.height, clips]);

  function handleNavigateWrapper(fromId: number, toId: number, isPlay: boolean) {
    handleNavigate(fromId, toId);
    if(isPlay)
      setPlayingClip(toId);
  }

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
        highlights={clip['highlights'].map((id) => highlights[id])}
        url={url} 
        numClips={Object.keys(clips).length}
        isOverlay={false} 
        isPhantom={true}
      />      
    )
  }

  function renderClips(): Array<React.ReactElement> {
    var timeOrderedClips = Object.values(clips);
    timeOrderedClips.sort((a, b) => a['start'] - b['start']);
    return [Object.keys(processedClips).map((i) => {
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
                highlights={clip['highlights'].map((id) => highlights[id])}
                playingClip={playingClip}
                setPlayingClip={setPlayingClip}
                isOverlay={isOverlay} 
                isPhantom={isPhantom}
                handleNavigate={handleNavigateWrapper}
                navigateToPosition={navigateToPosition}
                toggleCaptions={toggleCaptions}
            />
        )
    }), navigating != null && navigating.position == null && renderPhantom(timeOrderedClips)];
  }

  return (
    <div className="video__note-list">
        {renderClips()}
    </div>
  )
};
