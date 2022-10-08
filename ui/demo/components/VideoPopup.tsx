import { DocumentContext, TransformContext } from '@allenai/pdf-components';
import * as React from 'react';

import { Clip, Highlight, SyncWords } from '../types/clips';
import { positionSingleClip } from '../utils/positioning';
import { Player } from './Player';

type Props = {
  doi: string;
  clips: { [index: number]: Clip };
  highlights: { [index: number]: Highlight };
  focusId: number;
  navigating: {
    fromId: number;
    toId: number;
    fromTop: number;
    toTop: number;
    scrollTo: number;
    position: number | null;
  } | null;
  handleNavigate: (fromId: number, toId: number, type: string) => void;
  navigateToPosition: (clipId: number, highlightIdx: number) => void;
  toggleCaptions: (clipId: number, isExpand: boolean) => void;
  toggleAltHighlights: (clipId: number, isShow: boolean) => void;
  scrubClip: { highlight: number; clip: number; progress: number } | null;
  videoWidth: number;
  playedHistory: Array<number>;
  updatePlayedHistory: (clipId: number) => void;
  setFocusId: (clipId: number) => void;
  hoveredWord: { clipId: number; syncIdx: number } | null;
  setHoveredWord: (data: { clipId: number; syncIdx: number } | null) => void;
  syncSegments: {[clipId: number]: {paperToIdx: {[id: string]: number}, captionToIdx: {[id: string]: number}}};
  logAction: (action: string, data: any) => void;
};

export const VideoPopup: React.FunctionComponent<Props> = ({
  doi,
  clips,
  highlights,
  navigating,
  focusId,
  handleNavigate,
  navigateToPosition,
  toggleCaptions,
  toggleAltHighlights,
  scrubClip,
  videoWidth,
  playedHistory,
  updatePlayedHistory,
  setFocusId,
  hoveredWord,
  setHoveredWord,
  syncSegments,
  logAction
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  const [playbackRate, setPlaybackRate] = React.useState(1.0);

  // Render all the clips
  function renderClips(): React.ReactElement {
    if (focusId == -1) {
      return <></>;
    }

    const timeOrderedClips = Object.values(clips);
    timeOrderedClips.sort((a, b) => a['start'] - b['start']);

    const adjustedVideoWidth = pageDimensions.width * scale * 0.4;

    const clip = clips[focusId];
    const clipPosition = positionSingleClip(
      clip,
      highlights,
      adjustedVideoWidth / (pageDimensions.width * scale)
    );

    let top =
      (clipPosition.top + clipPosition.page) * pageDimensions.height * scale +
      (24 + clip.page * 48);
    const left = clipPosition.left * pageDimensions.width * scale + 20;
    let isOverlay = false;
    const isPhantom = false;
    if (navigating !== null && navigating.toId == focusId) {
      top = navigating.fromTop;
      isOverlay = true;
    }

    return (
      <Player
        key={focusId}
        doi={doi}
        id={focusId}
        top={top}
        left={left}
        clip={clip}
        clips={timeOrderedClips}
        highlights={clip['highlights'].map((id: number) => highlights[id])}
        isFocus={true}
        isOverlay={isOverlay}
        isPhantom={isPhantom}
        handleNavigate={handleNavigate}
        navigateToPosition={navigateToPosition}
        toggleCaptions={toggleCaptions}
        toggleAltHighlights={toggleAltHighlights}
        scrubPosition={
          scrubClip != null &&
          scrubClip.clip == focusId &&
          scrubClip.highlight == clip.highlights[clip.position]
            ? scrubClip.progress
            : -1
        }
        videoWidth={adjustedVideoWidth}
        playedHistory={playedHistory}
        updatePlayedHistory={updatePlayedHistory}
        setFocusId={setFocusId}
        hoveredWord={hoveredWord}
        setHoveredWord={setHoveredWord}
        syncSegments={syncSegments[focusId]}
        playbackRate={playbackRate}
        setPlaybackRate={setPlaybackRate}
        logAction={logAction}
      />
    );
  }

  return <div className="video__note-popup">{renderClips()}</div>;
};
