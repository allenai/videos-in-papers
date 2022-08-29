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
  };
  handleNavigate: (id: number, direction: number) => void;
  navigateToPosition: (clipId: number, highlightIdx: number) => void;
};

type ProcessedClip = Clip & {
  page: number;
  top: number;
}

export const VideoNotes: React.FunctionComponent<Props> = ({
    url,
    clips,
    highlights,
    navigating,
    handleNavigate,
    navigateToPosition
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const [ processedClips, setProcessedClips ] = React.useState({});

  React.useEffect(() => {
    var processedClips: {[index: number]: ProcessedClip} = {};
    var clipIds = Object.keys(clips);
    for(var i = 0; i < clipIds.length; i++) {
      var id = clipIds[i];
      var clip = clips[id];
      var highlightId = clip['highlights'][clip.position];
      var highlight = highlights[highlightId];
      var page = highlight['rects'][0]['page'];
      var top = highlight['rects'][0]['top'];
      processedClips[id] = {...clip, page, top};
    }
    setProcessedClips(spreadOutClips(processedClips));
  }, [clips]);

  function renderPhantom(): React.ReactElement {
    var clip = processedClips[navigating.toId];
    var id = clip.id
    var top = (clip.top + clip.page) * pageDimensions.height * scale + (24 + clip.page * 48);
    return (
      <Player key={"phantom-" + id}id={id+7000} top={top}
        clip={clip} highlights={clip['highlights'].map((id) => highlights[id])}
        url={url} numClips={Object.keys(clips).length}
        handleNavigate={handleNavigate}
        isOverlay={false} isPhantom={true}
        navigateToPosition={navigateToPosition}
      />      
    )
  }

  function renderClips(): Array<React.ReactElement> {
    return Object.keys(processedClips).map((i) => {
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
                key={id} id={id} top={top}
                clip={clip} highlights={clip['highlights'].map((id) => highlights[id])}
                url={url} numClips={Object.keys(clips).length}
                handleNavigate={handleNavigate}
                isOverlay={isOverlay} isPhantom={isPhantom}
                navigateToPosition={navigateToPosition}
            />
        )
    })
  }

  return (
    <div className="video__note-list">
        {renderClips()}
        {navigating != null && renderPhantom()}
    </div>
  )
};
