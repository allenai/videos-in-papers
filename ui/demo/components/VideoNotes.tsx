import * as React from 'react';

import {
    DocumentContext,
    TransformContext,
  } from '@allenai/pdf-components';

import { Player } from './Player';

type Clip  = {
    id: number;
    pageIndex: number;
    top: number;
}

type Props = {
  url: string;
  clips: Array<Clip>;
  navigating: {
    fromId: number;
    toId: number;
    fromTop: number;
    toTop: number;
    scrollTo: number;
  };
  handleNavigate: (fromId: number, toId: number) => void;
};

export const VideoNotes: React.FunctionComponent<Props> = ({
    url,
    clips,
    navigating,
    handleNavigate
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  // spread out clips in page so they don't overlap
  function spreadOutClips() {
    var sortedClips = JSON.parse(JSON.stringify(clips));
    sortedClips.sort((a, b) => a.pageIndex == b.pageIndex ? a.top - b.top : a.pageIndex - b.pageIndex);
    for(var i = 0; i < numPages; i++) {
      var pageClips = sortedClips.filter((c) => c.pageIndex == i);
      for(var j = 0; j < pageClips.length; j++) {
        "hey"
      }
    }
  }

  function renderClips(): Array<React.ReactElement> {
    var spreadClips = spreadOutClips();
    return clips.map((clip) => {
        var id = clip.id
        var top = (clip.top + clip.pageIndex) * pageDimensions.height * scale + (24 + clip.pageIndex * 48);
        var isOverlay = false;
        var isReplacement = false;
        if(navigating !== null && navigating.fromId == id) {
            top = navigating.toTop;
            id = navigating.toId;
            isReplacement = true;
        } else if(navigating !== null && navigating.toId == id) {
            top = navigating.fromTop;
            isOverlay = true;
        }
        return (
            <Player 
                top={top} id={id} url={url} numClips={clips.length}
                handleNavigate={handleNavigate}
                isOverlay={isOverlay} isReplacement={isReplacement}
            />
        )
    })
  }

  return (
    <div className="video__note-list">
        {renderClips()}
    </div>
  )
};
