import {
  DocumentContext,
  DocumentWrapper,
  Overlay,
  PageWrapper,
  ScrollContext,
  TransformContext,
  UiContext,
  ZoomInButton,
  ZoomOutButton,
  BoundingBoxType
} from '@allenai/pdf-components';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';
import { isRegExp } from 'util';

import { Annotations, generateCitations, PageToAnnotationsMap } from '../types/annotations';
import { RawCitation } from '../types/citations';
import { Clip, Highlight, SyncWords, Token, Block } from '../types/clips';
import { spreadOutClips } from '../utils/positioning';
import { CitationsDemo } from './CitationsDemo';
import { Header } from './Header';
import { HighlightOverlayDemo } from './HighlightOverlayDemo';
import { Outline } from './Outline';
import { ScrollToDemo } from './ScrollToDemo';
import { SidebarOverlay } from './SidebarOverlay';
import { ThumbnailPopup } from './ThumbnailPopup';
import { VideoNotes } from './VideoNotes';
import { VideoPopup } from './VideoPopup';
import { WordOverlay } from './WordOverlay';

const URL_DOI = window.location.pathname.split('/').pop();

export const Reader: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const { setScrollRoot } = React.useContext(ScrollContext);
  const [annotations, setAnnotations] = React.useState<PageToAnnotationsMap>(
    new Map<number, Annotations>()
  );
  const [rawCitations, setRawCitations] = React.useState<RawCitation[]>();

  // ref for the div in which the Document component renders
  const pdfContentRef = React.createRef<HTMLDivElement>();

  // ref for the scrollable region where the pages are rendered
  const pdfScrollableRef = React.createRef<HTMLDivElement>();

  const [DOI, setDOI] = React.useState(URL_DOI ? URL_DOI : '');

  // Navigation mode = auto-scrolling between video clips
  // Scroll overflow checks if padding needs to be added to the page
  const [navigating, setNavigating] = React.useState<{
    fromId: number;
    toId: number;
    fromTop: number;
    toTop: number;
    scrollTo: number;
    position: number | null;
  } | null>(null);
  const [scrollOverflow, setScrollOverflow] = React.useState(0);

  // Load data
  const [highlights, setHighlights] = React.useState<{ [index: number]: Highlight }>({});
  const [clips, setClips] = React.useState<{ [index: number]: Clip }>({});
  const [syncSegments, setSyncSegments] = React.useState<{[clipId: number]: {paperToIdx: {[id: string]: number}, captionToIdx: {[id: string]: number}}}>({});
  const [tokens, setTokens] = React.useState<Token[]>([]);

  const [videoWidth, setVideoWidth] = React.useState(((pageDimensions.height * 0.25) / 9) * 16);
  const [focusId, setFocusId] = React.useState(-1);
  const [playedHistory, setPlayedHistory] = React.useState<Array<number>>([]);

  const [scrubClip, setScrubClip] = React.useState<{
    highlight: number;
    clip: number;
    progress: number;
  } | null>(null);
  const [hoveredWord, setHoveredWord] = React.useState<{ clipId: number; syncIdx: number } | null>(
    null
  );
  const [thumbnail, setThumbnail] = React.useState<{
    clipId: number;
    left: number;
    top: number;
  } | null>(null);

  const [lockable, setLockable] = React.useState<boolean>(false);
  const [lock, setLock] = React.useState<{ clipId: number; relativePosition: number } | null>(null);

  const data = new FormData();
  data.append('json', JSON.stringify({ doi: DOI }));
  React.useEffect(() => {
    fetch('/api/annotation/' + DOI + '.json')
      .then(res => res.json())
      .then(data => {
        var highlights = data['highlights'];
        var highlightIds = Object.keys(highlights);
        for(var i = 0; i < highlightIds.length; i++) {
          var highlightId = highlightIds[i];
          highlights[highlightId].rects.sort((a: BoundingBoxType, b: BoundingBoxType) => (a.page + a.top) - (b.page + b.top));
        }
        var clips = data['clips'];
        var clipIds = Object.keys(clips);
        for(var i = 0; i < clipIds.length; i++) {
          var clipId = clipIds[i];
          var clip = clips[clipId];
          highlightId = clip['highlights'][clip['position']];
          var highlight = data['highlights'][highlightId];
          clips[i].top = highlight['rects'][0].top;
          clips[i].page = highlight['rects'][0].page;
        }
        setClips(clips);
        setHighlights(highlights);

        var newSyncSegments: {[clipId: number]: {paperToIdx: {[id: string]: number}, captionToIdx: {[id: string]: number}}} = {};
        Object.keys(data['syncSegments']).forEach(clipId => {
          var segments: Array<SyncWords> = data['syncSegments'][clipId];
          var paperToIdx: {[id: string]: number} = {};
          var captionToIdx: {[id: string]: number} = {};
          for(var i = 0; i < segments.length; i++) {
            segments[i].captionIds.forEach(({captionIdx, wordIdx}) => {
              captionToIdx[captionIdx + '-' + wordIdx] = i;
            })
            segments[i].tokenIds.forEach(({blockIdx, tokenIdx}) => {
              paperToIdx[blockIdx + '-' + tokenIdx] = i;
            })
          }
          newSyncSegments[parseInt(clipId)] = {paperToIdx, captionToIdx};
        });
        setSyncSegments(newSyncSegments);
      });
  }, []);

  React.useEffect(() => {
    if(Object.keys(highlights).length == 0 || Object.keys(syncSegments).length == 0) return;
    fetch('/api/blocks/' + DOI + '.json')
      .then(res => res.json())
      .then(data => {
        var tokens: Token[] = [];
        Object.values(syncSegments).forEach(({paperToIdx}) => {
          Object.keys(paperToIdx).forEach(id => {
            var blockIdx = parseInt(id.split('-')[0]);
            var tokenIdx = parseInt(id.split('-')[1]);
            var block = data.find((blk: Block) => blk.id == blockIdx);
            var token = block.tokens.find((tok: Token) => tok.id == tokenIdx);
            token.syncIdx = paperToIdx[id];
            tokens.push(token);
          })
        });
        setTokens(tokens);
      });
  }, [highlights, syncSegments]);

  React.useEffect(() => {
    // If data has been loaded then return directly to prevent sending multiple requests
    if (rawCitations) {
      return;
    }
    const videoHeight = pageDimensions.height * scale * 0.25;
    let videoWidth = (videoHeight / 9) * 16;

    const pageWidth = pageDimensions.width * scale + 48;
    if (videoWidth + pageWidth > window.innerWidth) {
      videoWidth = window.innerWidth - pageWidth - 40;
    }

    setVideoWidth(videoWidth);
  }, [pageDimensions]);

  React.useEffect(() => {
    const videoHeight = pageDimensions.height * scale * 0.25;
    let videoWidth = (videoHeight / 9) * 16;

    const pageWidth = pageDimensions.width * scale + 48;
    if (videoWidth + pageWidth > window.innerWidth) {
      videoWidth = window.innerWidth - pageWidth - 40;
    }

    setVideoWidth(videoWidth);
  }, [scale]);

  React.useEffect(() => {
    setScrollRoot(pdfScrollableRef.current || null);
  }, [pdfScrollableRef]);

  // In navigation mode, scroll to the video clip
  React.useEffect(() => {
    if (navigating == null) return;
    const container = document.getElementsByClassName('reader__container')[0];
    container.scrollTo({ top: navigating.scrollTo, left: 0, behavior: 'smooth' });
  }, [navigating]);

  React.useEffect(() => {
    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    if (focusId == -1) {
      setLock(null);
    } else if (focusId != -1) {
      const highlightId = newClips[focusId].highlights[newClips[focusId].position];
      newClips[focusId].top = highlights[highlightId].rects[0].top;
      newClips[focusId].page = highlights[highlightId].rects[0].page;
    }
    const spreadClips = spreadOutClips(
      newClips,
      highlights,
      focusId,
      videoWidth,
      pageDimensions.height * scale
    );
    if (lockable) {
      if (focusId == -1) {
        setLock(null);
      } else if (lock == null) {
        setLock({ clipId: focusId, relativePosition: 64 });
        // const container = document.getElementsByClassName('reader__container')[0];
        // let top = container.scrollTop;
        // const clipTop =
        //   (spreadClips[focusId].top + spreadClips[focusId].page) * pageDimensions.height * scale +
        //   (24 + spreadClips[focusId].page * 48) +
        //   38;
        // top = Math.floor(clipTop - top);
        // setLock({ clipId: focusId, relativePosition: top });
      } else if (lock.clipId != focusId) {
        setLock({ clipId: focusId, relativePosition: lock.relativePosition });
      }
    }
    setClips(spreadClips);
  }, [focusId]);

  React.useEffect(() => {
    if (!lockable) {
      setLock(null);
    } else if (focusId != -1) {
      const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
      if (focusId != -1) {
        const highlightId = newClips[focusId].highlights[newClips[focusId].position];
        newClips[focusId].top = highlights[highlightId].rects[0].top;
        newClips[focusId].page = highlights[highlightId].rects[0].page;
      }
      const spreadClips = spreadOutClips(
        newClips,
        highlights,
        focusId,
        videoWidth,
        pageDimensions.height * scale
      );
      const container = document.getElementsByClassName('reader__container')[0];
      let top = container.scrollTop;
      const clipTop =
        (spreadClips[focusId].top + spreadClips[focusId].page) * pageDimensions.height * scale +
        (24 + spreadClips[focusId].page * 48) +
        38;
      top = Math.floor(clipTop - top);
      setLock({ clipId: focusId, relativePosition: 64 });
    }
  }, [lockable]);

  const handleScroll = (e: any) => {
    if (navigating == null) {
      // Remove the padding spaces added to handle overflow
      if (scrollOverflow == -1 && e.target.scrollTop > 1000) {
        setScrollOverflow(0);
      } else if (
        scrollOverflow == 1 &&
        e.target.scrollTop + window.innerHeight < e.target.scrollHeight - 2000
      ) {
        setScrollOverflow(0);
      }

      // TODO: Make video lock on scroll out
      // if(focusId != -1) {
      //   var player = document.getElementById('video__note-' + focusId) as HTMLDivElement; 
      //   if(player && player.getBoundingClientRect().top < 0) {
      //     setLock({ clipId: focusId, relativePosition: -1 });
      //   }
      // }
      return;
    }
    if (navigating.scrollTo != e.target.scrollTop) return;
    // Reached desired scroll position so finish navigation mode
    if (navigating.position == null) {
      setNavigating(null);
    } else {
      const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
      newClips[navigating.toId].position = navigating.position;
      const highlightId = newClips[navigating.toId].highlights[navigating.position];
      newClips[navigating.toId].position = navigating.position;
      newClips[navigating.toId].top = highlights[highlightId].rects[0].top;
      newClips[navigating.toId].page = highlights[highlightId].rects[0].page;
      setNavigating(null);
    }
  };

  // Scroll from video clip to video clip
  const handleNavigate = (fromId: number, toId: number) => {
    if (fromId == toId) return;

    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    const highlightId = newClips[toId].highlights[newClips[toId].position];
    newClips[toId].top = highlights[highlightId].rects[0].top;
    newClips[toId].page = highlights[highlightId].rects[0].page;

    if (lock != null) {
      setLock({ clipId: toId, relativePosition: lock.relativePosition });
    }
    arrangeAndNavigate(newClips, fromId, toId, null);
  };

  // Navigate with clip to the position of another paper highlight
  const navigateToPosition = (clipId: number, highlightIdx: number) => {
    if (clips[clipId].position == highlightIdx) return;

    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    newClips[clipId].position = highlightIdx;
    const highlightId = newClips[clipId].highlights[highlightIdx];
    newClips[clipId].top = highlights[highlightId].rects[0].top;
    newClips[clipId].page = highlights[highlightId].rects[0].page;

    arrangeAndNavigate(newClips, clipId, clipId, highlightIdx);
  };

  const arrangeAndNavigate = (
    newClips: { [index: number]: Clip },
    fromId: number,
    toId: number,
    highlightIdx: number | null
  ) => {
    // Find what the clip's top will be in the new position;
    const spreadClips = spreadOutClips(
      newClips,
      highlights,
      toId,
      videoWidth,
      pageDimensions.height * scale
    );
    var container = document.getElementsByClassName('reader__container')[0];
    const fromVideo = document.getElementById('video__note-' + fromId);
    let fromTop = 0;
    if (fromVideo != null) fromTop = fromVideo.getBoundingClientRect().top;

    let toTop =
      (spreadClips[toId].top + spreadClips[toId].page) * pageDimensions.height * scale +
      (24 + spreadClips[toId].page * 48) +
      38;
    if (scrollOverflow == -1) toTop += 1000;

    let scrollTo = Math.floor(toTop - fromTop);

    if (scrollTo < 0) {
      setScrollOverflow(-1);
      var container = document.getElementsByClassName('reader__container')[0];
      scrollTo += 1000;
    } else if (scrollTo + window.innerHeight > container.scrollHeight) {
      setScrollOverflow(1);
      if (scrollOverflow == -1) scrollTo -= 1000;
    }
    setClips(newClips);

    if (!playedHistory.includes(toId)) {
      setPlayedHistory([...playedHistory, toId]);
    }
    setFocusId(toId);

    setNavigating({
      fromId: fromId != toId ? fromId : -1,
      toId: toId,
      fromTop,
      toTop,
      scrollTo,
      position: highlightIdx,
    });
  };

  // Move clip to the position of another paper highlight
  const changeClipPosition = (highlightId: number) => {
    const clipId: number = highlights[highlightId]['clip'];
    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    const newPosition = newClips[clipId].highlights.findIndex(ele => ele == highlightId);
    newClips[clipId].position = newPosition;
    newClips[clipId].top = highlights[highlightId].rects[0].top;
    newClips[clipId].page = highlights[highlightId].rects[0].page;
    const spreadClips = spreadOutClips(
      newClips,
      highlights,
      clipId,
      videoWidth,
      pageDimensions.height * scale
    );
    setClips(spreadClips);
    setFocusId(clipId);

    if (!playedHistory.includes(clipId)) {
      setPlayedHistory([...playedHistory, clipId]);
    }
  };

  // Expand or contract captions
  // This needs to be saved in the clips because it affects their size and how they are spread out
  const toggleCaptions = (clipId: number, isExpand: boolean) => {
    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    newClips[clipId]['expanded'] = isExpand;
    setClips(newClips);
  };

  // Show or hide other highlights
  const toggleAltHighlights = (clipId: number, isShow: boolean) => {
    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    newClips[clipId]['alternatives'] = isShow;
    setClips(newClips);
  };

  const updatePlayedHistory = (clipId: number) => {
    if (!playedHistory.includes(clipId)) {
      setPlayedHistory([...playedHistory, clipId]);
    }
  };

  if (Object.keys(clips).length == 0) {
    return <div>Loading...</div>;
  } else if (pageDimensions.width > 0 && videoWidth > 150) {
    return (
      <BrowserRouter>
        <Route path="/">
          <Header lockable={lockable} setLockable={setLockable} />
          <div className="reader__container" onScroll={handleScroll} onClick={() => setFocusId(-1)}>
            <DocumentWrapper
              className="reader__main"
              file={'/api/pdf/' + DOI + '.pdf'}
              inputRef={pdfContentRef}>
              {scrollOverflow == -1 ? <div style={{ height: '1000px' }}></div> : ''}
              <div className="reader__main-inner">
                <Outline parentRef={pdfContentRef} />
                <div className="reader__page-list" ref={pdfScrollableRef}>
                  {Array.from({ length: numPages }).map((_, i) => (
                    <PageWrapper key={i} pageIndex={i}>
                      <Overlay>
                        <WordOverlay
                          pageIndex={i}
                          hoveredWord={hoveredWord}
                          syncSegments={syncSegments}
                          tokens={tokens}
                        />
                        <SidebarOverlay
                          pageIndex={i}
                          highlights={highlights}
                          clips={clips}
                          changeClipPosition={changeClipPosition}
                          scrubClip={scrubClip}
                          setScrubClip={setScrubClip}
                          focusId={focusId}
                          playedHistory={playedHistory}
                          setThumbnail={setThumbnail}
                        />
                      </Overlay>
                    </PageWrapper>
                  ))}
                </div>
                <VideoNotes
                  doi={DOI}
                  clips={clips}
                  highlights={highlights}
                  focusId={focusId}
                  navigating={navigating}
                  handleNavigate={handleNavigate}
                  navigateToPosition={navigateToPosition}
                  toggleCaptions={toggleCaptions}
                  toggleAltHighlights={toggleAltHighlights}
                  scrubClip={scrubClip}
                  videoWidth={videoWidth}
                  playedHistory={playedHistory}
                  updatePlayedHistory={updatePlayedHistory}
                  setFocusId={setFocusId}
                  setHoveredWord={setHoveredWord}
                  lock={lock}
                  syncSegments={syncSegments}
                />
              </div>
              {scrollOverflow == 1 ? <div style={{ height: '2000px' }}></div> : ''}
            </DocumentWrapper>
            <ThumbnailPopup thumbnail={thumbnail} doi={DOI} />
          </div>
        </Route>
      </BrowserRouter>
    );
  } else {
    return (
      <BrowserRouter>
        <Route path="/">
          <Header lockable={lockable} setLockable={setLockable} />
          <div className="reader__container" onScroll={handleScroll} onClick={() => setFocusId(-1)}>
            <DocumentWrapper
              className="reader__main"
              file={'/api/pdf/' + DOI + '.pdf'}
              inputRef={pdfContentRef}>
              {scrollOverflow == -1 ? <div style={{ height: '1000px' }}></div> : ''}
              <div className="reader__main-inner">
                <Outline parentRef={pdfContentRef} />
                <div className="reader__page-list" ref={pdfScrollableRef}>
                  {Array.from({ length: numPages }).map((_, i) => (
                    <PageWrapper key={i} pageIndex={i}>
                      <Overlay>
                        <WordOverlay
                          pageIndex={i}
                          hoveredWord={hoveredWord}
                          syncSegments={syncSegments}
                          tokens={tokens}
                        />
                        <SidebarOverlay
                          pageIndex={i}
                          highlights={highlights}
                          clips={clips}
                          changeClipPosition={changeClipPosition}
                          scrubClip={scrubClip}
                          setScrubClip={setScrubClip}
                          focusId={focusId}
                          playedHistory={playedHistory}
                          setThumbnail={setThumbnail}
                        />
                      </Overlay>
                    </PageWrapper>
                  ))}
                </div>
                <VideoPopup
                  doi={DOI}
                  clips={clips}
                  highlights={highlights}
                  focusId={focusId}
                  navigating={navigating}
                  handleNavigate={handleNavigate}
                  navigateToPosition={navigateToPosition}
                  toggleCaptions={toggleCaptions}
                  toggleAltHighlights={toggleAltHighlights}
                  scrubClip={scrubClip}
                  videoWidth={videoWidth}
                  playedHistory={playedHistory}
                  updatePlayedHistory={updatePlayedHistory}
                  setFocusId={setFocusId}
                  setHoveredWord={setHoveredWord}
                  syncSegments={syncSegments}
                />
              </div>
              {scrollOverflow == 1 ? <div style={{ height: '2000px' }}></div> : ''}
            </DocumentWrapper>
          </div>
        </Route>
      </BrowserRouter>
    );
  }
};
