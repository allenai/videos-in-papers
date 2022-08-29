import * as React from 'react';

import {
    DocumentContext,
    TransformContext,
  } from '@allenai/pdf-components';

import { Player } from './Player';
import { Highlight, Clip, Caption } from '../types/clips';

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
  captions: Array<Caption>;
};

export const VideoNotes: React.FunctionComponent<Props> = ({
    url,
    clips,
    highlights,
    navigating,
    handleNavigate,
    navigateToPosition,
    captions
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const [ processedClips, setProcessedClips ] = React.useState({});

  React.useEffect(() => {
    setProcessedClips(spreadOutClips(clips));
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

  function getCaptions(start: number, end: number): Array<Caption> {
    var clipCaptions = [];

    for(var i = 0; i < captions.length; i++) {
      var caption = captions[i];
      if(caption['start'] <= start && start < caption['end']) {
        clipCaptions.push(caption);
      } else if(start < caption['start'] && caption['end'] < end) {
        clipCaptions.push(caption);
      } else if(caption['start'] < end && end <= caption['end']) {
        clipCaptions.push(caption);
      }
    }

    return clipCaptions;
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
                captions={getCaptions(clip['start']*1000, clip['end']*1000)}
            />
        )
    })
  }

  return (
    <div className="video__note-list">
        {renderClips()}
        {navigating != null && navigating.position == null && renderPhantom()}
    </div>
  )
};
