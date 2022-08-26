import * as React from 'react';

import {
    DocumentContext,
    TransformContext,
  } from '@allenai/pdf-components';

import { Player } from './Player';
import { Clip } from '../types/clips';

import { spreadOutClips } from '../utils/positioning';

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
  const [ processedClips, setProcessedClips ] = React.useState([]);

  React.useEffect(() => {
    setProcessedClips(spreadOutClips(clips));
  }, []);

  function renderClips(): Array<React.ReactElement> {
    return processedClips.map((clip) => {
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
