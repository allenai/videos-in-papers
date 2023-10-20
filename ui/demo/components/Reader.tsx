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
  BoundingBoxType,
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
import { Modal } from './Modal';

const URL_DOI = window.location.pathname.split('/').pop();

const identifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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

  const [openModal, setOpenModal] = React.useState(true);

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
  const [syncSegments, setSyncSegments] = React.useState<{
    [clipId: number]: {
      paperToIdx: { [id: string]: number };
      captionToIdx: { [id: string]: number };
    };
  }>({});
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

  const [scrollPosition, setScrollPosition] = React.useState<number>(0);

  React.useEffect(() => {
    // var identifier = localStorage.getItem('s2-paper-video-identifier');
    // if (!identifier) {
    //   // generate random 16 character string
    //   const randomString =
    //     Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    //   localStorage.setItem('s2-paper-video-identifier', randomString);
    //   identifier = randomString;
    // }

    const data = { doi: DOI, userId: identifier };
    fetch('/api/get_annotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(data => {
        logAction('enter', { condition: 'reader' });
        var highlights = data['highlights'];
        var highlightIds = Object.keys(highlights);
        for (var i = 0; i < highlightIds.length; i++) {
          var highlightId = highlightIds[i];
          highlights[highlightId].rects.sort((a: BoundingBoxType, b: BoundingBoxType) => {
            var aIsRight = !(a.left < 0.5 && a.left + a.width > 0.5) && a.left + a.width / 2 > 0.5;
            var bIsRight = !(b.left < 0.5 && b.left + b.width > 0.5) && b.left + b.width / 2 > 0.5;
            if (a.page != b.page) {
              return a.page - b.page;
            } else {
              if (!aIsRight && bIsRight) {
                return -1;
              } else if (aIsRight && !bIsRight) {
                return 1;
              } else {
                return a.top - b.top;
              }
            }
          });
        }
        var clips = data['clips'];
        var clipIds = Object.keys(clips);
        for (var i = 0; i < clipIds.length; i++) {
          var clipId = clipIds[i];
          var clip = clips[clipId];
          if(parseInt(clipId) > -10) {
            highlightId = clip['highlights'][clip['position']];
            var highlight = data['highlights'][highlightId];
            clips[clipId].top = highlight['rects'][0].top;
            clips[clipId].page = highlight['rects'][0].page;
          } else {
            var subId = parseInt(clipId) * -1 - 10 + '';
            var subClip = clips[subId];
            highlightId = subClip['highlights'][subClip['position']];
            var highlight = data['highlights'][highlightId];
            clips[clipId].top = highlight['rects'][0].top + 0.1;
            clips[clipId].page = highlight['rects'][0].page;
          }
        }
        setClips(clips);
        setHighlights(highlights);

        var newSyncSegments: {
          [clipId: number]: {
            paperToIdx: { [id: string]: number };
            captionToIdx: { [id: string]: number };
          };
        } = {};
        Object.keys(data['syncSegments']).forEach(clipId => {
          var segments: Array<SyncWords> = data['syncSegments'][clipId];
          var paperToIdx: { [id: string]: number } = {};
          var captionToIdx: { [id: string]: number } = {};
          for (var i = 0; i < segments.length; i++) {
            segments[i].captionIds.forEach(({ captionIdx, wordIdx }) => {
              captionToIdx[captionIdx + '-' + wordIdx] = i;
            });
            segments[i].tokenIds.forEach(({ blockIdx, tokenIdx }) => {
              paperToIdx[blockIdx + '-' + tokenIdx] = i;
            });
          }
          newSyncSegments[parseInt(clipId)] = { paperToIdx, captionToIdx };
        });
        setSyncSegments(newSyncSegments);
      });
  }, []);

  React.useEffect(() => {
    if (Object.keys(highlights).length == 0 || Object.keys(syncSegments).length == 0) return;
    fetch('/api/blocks/' + DOI + '.json')
      .then(res => res.json())
      .then(data => {
        var tokens: Token[] = [];
        Object.keys(syncSegments).forEach(clipId => {
          var paperToIdx = syncSegments[parseInt(clipId)].paperToIdx;
          Object.keys(paperToIdx).forEach(id => {
            var blockIdx = parseInt(id.split('-')[0]);
            var tokenIdx = parseInt(id.split('-')[1]);
            var block = data.find((blk: Block) => blk.id == blockIdx);
            var token = block.tokens.find((tok: Token) => tok.id == tokenIdx);
            if(token == undefined) return;
            token.syncIdx = paperToIdx[id];
            token.clip = parseInt(clipId);
            tokens.push(token);
          });
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
    setLock(null);
    // if (lockable) {
    //   if (focusId == -1) {
    //     setLock(null);
    //   } else if (lock == null) {
    //     setLock({ clipId: focusId, relativePosition: 64 });
    //     // const container = document.getElementsByClassName('reader__container')[0];
    //     // let top = container.scrollTop;
    //     // const clipTop =
    //     //   (spreadClips[focusId].top + spreadClips[focusId].page) * pageDimensions.height * scale +
    //     //   (24 + spreadClips[focusId].page * 48) +
    //     //   38;
    //     // top = Math.floor(clipTop - top);
    //     // setLock({ clipId: focusId, relativePosition: top });
    //   } else if (lock.clipId != focusId) {
    //     setLock({ clipId: focusId, relativePosition: lock.relativePosition });
    //   }
    // }
    if (!playedHistory.includes(focusId)) {
      setPlayedHistory([...playedHistory, focusId]);
    }
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
      if (Math.abs(scrollPosition - e.target.scrollTop) > 16) {
        logAction('scroll', { scrollTop: e.target.scrollTop });
      }

      // Remove the padding spaces added to handle overflow
      if (scrollOverflow == -1 && e.target.scrollTop > 1000) {
        setScrollOverflow(0);
      } else if (
        scrollOverflow == 1 &&
        e.target.scrollTop + window.innerHeight < e.target.scrollHeight - 2000
      ) {
        setScrollOverflow(0);
      }

      // if(!(pageDimensions.width > 0 && videoWidth > 150)) return;

      // var sidebars = Array.from(document.getElementsByClassName('reader_sidebars')).filter(element => element.getBoundingClientRect().top >= 0 && element.getBoundingClientRect().top < window.innerHeight);
      // if(sidebars.length == 0) return;

      // for(var i = 0; i < sidebars.length; i++) {
      //   var sidebar = sidebars[i];
      //   var highlightId = parseInt(sidebar.id.split('-')[0]);
      //   var rectIdx = parseInt(sidebar.id.split('-')[1]);
      //   if(!highlightId) continue;

      //   var highlight = highlights[highlightId];

      //   var clipId = highlight.clip;

      //   var clipElement = document.getElementById('video__note-' + clipId);
      //   if(!clipElement) continue;
      //   var clipPosition = clipElement.getBoundingClientRect();

      //   if(clipPosition.bottom < 0 || clipPosition.top > window.innerHeight) {
      //     changeClipPosition(highlightId, rectIdx, false);
      //   }
      // }

      // // TODO: Make video lock on scroll out
      // if(focusId != -1) {
      //   let videoHeight = (videoWidth / 16) * 9;
      //   var clipTop = (clips[focusId].top + clips[focusId].page) * pageDimensions.height * scale
      //   if(clipTop + videoHeight < e.target.scrollTop || clipTop > e.target.scrollTop + window.innerHeight - 64) {
      //     setLock({ clipId: focusId, relativePosition: -1 });
      //   } else if(lock != null && e.target.scrollTop <= clipTop && clipTop <= e.target.scrollTop + window.innerHeight - 64) {
      //     setLock(null);
      //   }
      // }
    } else if (navigating.scrollTo == e.target.scrollTop) {
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
    }
    setScrollPosition(e.target.scrollTop);
  };

  // Scroll from video clip to video clip
  const handleNavigate = (fromId: number, toId: number, type: string) => {
    logAction('navigate', { fromId, toId, type });

    if (fromId == toId) return;

    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    if(toId > -10) {
      const highlightId = newClips[toId].highlights[newClips[toId].position];
      newClips[toId].top = highlights[highlightId].rects[0].top;
      newClips[toId].page = highlights[highlightId].rects[0].page;
    }

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
    var newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    if(toId > -10) {
      const highlightId = newClips[toId].highlights[newClips[toId].position];
      newClips[toId].top = highlights[highlightId].rects[0].top;
      newClips[toId].page = highlights[highlightId].rects[0].page;
    }
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
    setFocusId(toId);
    setClips(spreadClips);
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
  const changeClipPosition = (highlightId: number, rectIdx: number, isFocus: boolean) => {
    const clipId: number = highlights[highlightId]['clip'];

    if(isFocus) {
      if (focusId == clipId) {
        logAction('changeClipPosition', { highlightId, rectIdx });
      } else {
        logAction('focusClip', { clipId, location: 'paper' });
      }
    }
    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    const newPosition = newClips[clipId].highlights.findIndex(ele => ele == highlightId);
    newClips[clipId].position = newPosition;
    if (rectIdx > highlights[highlightId].rects.length - 1) {
      rectIdx = highlights[highlightId].rects.length - 1;
    }
    newClips[clipId].top = highlights[highlightId].rects[rectIdx].top;
    newClips[clipId].page = highlights[highlightId].rects[rectIdx].page;
    if(isFocus) {
      const spreadClips = spreadOutClips(
        newClips,
        highlights,
        clipId,
        videoWidth,
        pageDimensions.height * scale
      );
      setClips(spreadClips);
      setFocusId(clipId);
    } else {
      const spreadClips = spreadOutClips(
        newClips,
        highlights,
        -1,
        videoWidth,
        pageDimensions.height * scale
      );
      setClips(spreadClips);
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

  const activateClip = (clipId: number) => {
    if (clipId == focusId) return;

    logAction('focusClip', { clipId, location: 'video' });

    const newClips: { [index: number]: Clip } = JSON.parse(JSON.stringify(clips));
    if (clipId != -1) {
      const highlightId = newClips[clipId].highlights[newClips[clipId].position];
      newClips[clipId].top = highlights[highlightId].rects[0].top;
      newClips[clipId].page = highlights[highlightId].rects[0].page;
    }
    const spreadClips = spreadOutClips(
      newClips,
      highlights,
      focusId,
      videoWidth,
      pageDimensions.height * scale
    );
    setClips(spreadClips);
    setFocusId(clipId);
  };

  const logAction = (action: string, data: any) => {
    var timestamp = new Date().getTime();
    const formdata = {
      doi: DOI,
      userId: identifier, // localStorage.getItem('s2-paper-video-identifier'),
      timestamp: timestamp,
      action: action,
      data: data,
    };
    fetch('/api/log_action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formdata),
    })
      .then(response => response.json())
      .then(data => {
        if (data['message'] != 200) console.log('Error:', data);
      });
  };

  const clickOutside = () => {
    logAction('defocusClip', { clipId: focusId });
    setFocusId(-1);
  };

  const handleSidebarScrub = (
    data: { highlight: number; clip: number; progress: number } | null
  ) => {
    if (
      data != null &&
      (scrubClip == null || Math.abs(data['progress'] - scrubClip['progress']) > 0.05)
    ) {
      var clip = clips[data['clip']];
      var seconds = data['progress'] * (clip['end'] - clip['start']);
      logAction('scrub', {
        highlight: data['highlight'],
        clip: data['clip'],
        seconds: seconds,
        location: 'paper',
      });
      var currentClipHighlight = clip['highlights'][clip['position']];
      if (currentClipHighlight != data['highlight']) {
        changeClipPosition(data['highlight'], 0, false);
      }
    }
    setScrubClip(data);
  };

  const handleHoveredSync = (
    data: { clipId: number; syncIdx: number } | null,
    location: string
  ) => {
    if (data != null && data['syncIdx'] != -1) {
      logAction('hoverSync', {
        clipId: data['clipId'],
        syncIdx: data['syncIdx'],
        location: location,
      });
    }
    setHoveredWord(data);
  };


  if (Object.keys(clips).length == 0) {
    return <div>Loading...</div>;
  } else if (pageDimensions.width > 0 && videoWidth > 150) {
    return (
      <BrowserRouter>
        <Route path="/">
          <Header lockable={lockable} setLockable={setLockable} openModal={() => setOpenModal(true)}/>
          <div className="reader__container" onScroll={handleScroll} onClick={clickOutside}>
            <DocumentWrapper
              className="reader__main"
              file={'/api/pdf/' + DOI + '.pdf'}
              inputRef={pdfContentRef}
            >
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
                          setHoveredWord={(data: { clipId: number; syncIdx: number } | null) =>
                            handleHoveredSync(data, 'paper')
                          }
                          syncSegments={syncSegments}
                          tokens={tokens}
                        />
                        <SidebarOverlay
                          pageIndex={i}
                          highlights={highlights}
                          clips={clips}
                          changeClipPosition={(id: number, rectIdx: number) => changeClipPosition(id, rectIdx, true)}
                          scrubClip={scrubClip}
                          setScrubClip={handleSidebarScrub}
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
                  setFocusId={activateClip}
                  hoveredWord={hoveredWord}
                  setHoveredWord={(data: { clipId: number; syncIdx: number } | null) =>
                    handleHoveredSync(data, 'video')
                  }
                  lock={lock}
                  syncSegments={syncSegments}
                  logAction={logAction}
                />
              </div>
              {scrollOverflow == 1 ? <div style={{ height: '2000px' }}></div> : ''}
            </DocumentWrapper>
            <ThumbnailPopup thumbnail={thumbnail} doi={DOI} />
          </div>
          {openModal ? 
            <Modal setOpenModal={setOpenModal}/> : 
            ""
          }
        </Route>
      </BrowserRouter>
    );
  } else {
    return (
      <BrowserRouter>
        <Route path="/">
          <Header lockable={lockable} setLockable={setLockable} />
          <div className="reader__container" onScroll={handleScroll} onClick={clickOutside}>
            <DocumentWrapper
              className="reader__main"
              file={'/api/pdf/' + DOI + '.pdf'}
              inputRef={pdfContentRef}
            >
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
                          setHoveredWord={(data: { clipId: number; syncIdx: number } | null) =>
                            handleHoveredSync(data, 'paper')
                          }
                          syncSegments={syncSegments}
                          tokens={tokens}
                        />
                        <SidebarOverlay
                          pageIndex={i}
                          highlights={highlights}
                          clips={clips}
                          changeClipPosition={(id: number, rectIdx: number) => changeClipPosition(id, rectIdx, true)}
                          scrubClip={scrubClip}
                          setScrubClip={handleSidebarScrub}
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
                  setFocusId={activateClip}
                  hoveredWord={hoveredWord}
                  setHoveredWord={(data: { clipId: number; syncIdx: number } | null) =>
                    handleHoveredSync(data, 'video')
                  }
                  syncSegments={syncSegments}
                  logAction={logAction}
                />
              </div>
              {scrollOverflow == 1 ? <div style={{ height: '2000px' }}></div> : ''}
            </DocumentWrapper>
          </div>
          {openModal ? 
            <Modal setOpenModal={setOpenModal}/> : 
            ""
          }
        </Route>
      </BrowserRouter>
    );
  }
};
