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
  clips: Array<Clip>;
  highlights: Array<Highlight>;
  navigating: {
    fromId: number;
    toId: number;
    fromTop: number;
    toTop: number;
    scrollTo: number;
  };
  handleNavigate: (fromId: number, toId: number) => void;
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
    handleNavigate
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const [ processedClips, setProcessedClips ] = React.useState([]);

  React.useEffect(() => {
    var processedClips: Array<ProcessedClip> = [];
    for(var i = 0; i < clips.length; i++) {
      var clip = clips[i];
      var highlightIdx = clip['highlights'][clip.position]
      var highlight = highlights[highlightIdx];
      var page = highlight['rects'][0]['page'];
      var top = highlight['rects'][0]['top'];
      processedClips.push({...clip, page, top})
    }
    setProcessedClips(spreadOutClips(processedClips));
  }, [clips]);

  function renderPhantom(): React.ReactElement {
    var clip = processedClips.find((ele) => ele.id == navigating.toId);
    var id = clip.id
    var top = (clip.top + clip.page) * pageDimensions.height * scale + (24 + clip.page * 48);
    return (
      <Player key={"phantom-" + id}
        top={top} id={id} url={url} numClips={clips.length}
        handleNavigate={handleNavigate}
        isOverlay={false} isPhantom={true}
      />      
    )
  }

  function renderClips(): Array<React.ReactElement> {
    return processedClips.map((clip) => {
        var id = clip.id
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
            <Player key={id}
                top={top} id={id} url={url} numClips={clips.length}
                handleNavigate={handleNavigate}
                isOverlay={isOverlay} isPhantom={isPhantom}
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
