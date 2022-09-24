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
  handleNavigate: (fromId: number, toId: number) => void;
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
  syncSegments
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);

  // ID of the clip that is currently playing
  const [playingClip, setPlayingClip] = React.useState(-1);

  const [playbackRate, setPlaybackRate] = React.useState(1.0);

  // Navigate and change playingClip if autoplaying
  function handleNavigateWrapper(fromId: number, toId: number, isPlay: boolean) {
    handleNavigate(fromId, toId);
    if (isPlay) setPlayingClip(toId);
  }

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
      pageDimensions.height,
      pageDimensions.width
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
        playingClip={playingClip}
        setPlayingClip={setPlayingClip}
        isFocus={true}
        isOverlay={isOverlay}
        isPhantom={isPhantom}
        handleNavigate={handleNavigateWrapper}
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
      />
    );
  }

  return <div className="video__note-popup">{renderClips()}</div>;
};
