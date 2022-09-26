import { DocumentContext, TransformContext } from '@allenai/pdf-components';
import * as React from 'react';

import { Clip, Highlight, SyncWords } from '../types/clips';
import { spreadOutClips } from '../utils/positioning';
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
  lock: { clipId: number; relativePosition: number } | null;
  syncSegments: {[clipId: number]: {paperToIdx: {[id: string]: number}, captionToIdx: {[id: string]: number}}};
};

export const VideoNotes: React.FunctionComponent<Props> = ({
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
  lock,
  syncSegments
}: Props) => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const [processedClips, setProcessedClips] = React.useState<{ [index: number]: Clip }>({});

  // ID of the clip that is currently playing
  const [playingClip, setPlayingClip] = React.useState(-1);

  const [playbackRate, setPlaybackRate] = React.useState(1.0);
  const [autoplay, setAutoplay] = React.useState(false);

  // On load, find top positions of clips so that they are spread out
  React.useEffect(() => {
    if (pageDimensions.height == 0 || videoWidth == 0) return;
    setProcessedClips(
      spreadOutClips(clips, highlights, focusId, videoWidth, pageDimensions.height * scale)
    );
  }, [pageDimensions, clips, videoWidth, focusId]);

  // Navigate and change playingClip if autoplaying
  function handleNavigateWrapper(fromId: number, toId: number, isPlay: boolean) {
    handleNavigate(fromId, toId);
    if (isPlay) setPlayingClip(toId);
  }

  // Render a phantom clip to act as placeholder for clips during navigation
  function renderPhantom(timeOrderedClips: Array<Clip>): React.ReactElement {
    if (navigating == null) {
      return <></>;
    }
    const clip = processedClips[navigating.toId];
    const id = clip.id;
    const top = (clip.top + clip.page) * pageDimensions.height * scale + (24 + clip.page * 48);
    return (
      <Player
        key={'phantom-' + id}
        doi={doi}
        id={id + 100000}
        top={top}
        clip={clip}
        clips={timeOrderedClips}
        playingClip={playingClip}
        scrubPosition={-1}
        highlights={clip['highlights'].map((id: number) => highlights[id])}
        isFocus={focusId == id}
        isOverlay={false}
        isPhantom={true}
        videoWidth={videoWidth}
        playedHistory={playedHistory}
      />
    );
  }

  // Render all the clips
  function renderClips(): Array<React.ReactElement> {
    const timeOrderedClips = Object.values(clips);
    const sections: { [id: number]: string } = {};

    for (let i = 0; i < timeOrderedClips.length; i++) {
      const clip = timeOrderedClips[i];
      const highlight = highlights[clip.highlights[clip.position]];
      sections[clip.id] = highlight.section;
    }

    timeOrderedClips.sort((a, b) => a['start'] - b['start']);
    const clipsHTML = Object.keys(processedClips).map((i: string) => {
      const id = parseInt(i);
      const clip = processedClips[id];
      let top = (clip.top + clip.page) * pageDimensions.height * scale + (24 + clip.page * 48);
      let isOverlay = false;
      let isPhantom = false;
      if (navigating !== null && navigating.fromId == id) {
        isPhantom = true;
      } else if (navigating !== null && navigating.toId == id) {
        top = navigating.fromTop;
        isOverlay = true;
      } else if (lock != null && lock.clipId == id) {
        //top = lock.relativePosition;
        top = -1;
        isOverlay = true;
      }

      return (
        <Player
          key={id}
          doi={doi}
          id={id}
          top={top}
          clip={clip}
          clips={timeOrderedClips}
          highlights={clip['highlights'].map((id: number) => highlights[id])}
          playingClip={playingClip}
          setPlayingClip={setPlayingClip}
          isFocus={focusId == id}
          isOverlay={isOverlay}
          isPhantom={isPhantom}
          handleNavigate={handleNavigateWrapper}
          navigateToPosition={navigateToPosition}
          toggleCaptions={toggleCaptions}
          toggleAltHighlights={toggleAltHighlights}
          scrubPosition={
            scrubClip != null &&
            scrubClip.clip == id &&
            scrubClip.highlight == clip.highlights[clip.position]
              ? scrubClip.progress
              : -1
          }
          videoWidth={videoWidth}
          playedHistory={playedHistory}
          updatePlayedHistory={updatePlayedHistory}
          setFocusId={setFocusId}
          hoveredWord={hoveredWord}
          setHoveredWord={setHoveredWord}
          sections={sections}
          syncSegments={syncSegments[id]}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          autoplay={autoplay}
          setAutoplay={setAutoplay}
        />
      );
    });
    if (navigating != null && navigating.position == null) {
      clipsHTML.push(renderPhantom(timeOrderedClips));
    }
    return clipsHTML;
  }

  return (
    <div className="video__note-list" style={{ width: videoWidth + 40 + 'px' }}>
      {renderClips()}
    </div>
  );
};
