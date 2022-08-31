import {
  DocumentContext,
  DocumentWrapper,
  Overlay,
  PageWrapper,
  ScrollContext,
  UiContext,
  TransformContext,
  ZoomOutButton,
  ZoomInButton,
} from '@allenai/pdf-components';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';

import { Annotations, generateCitations, PageToAnnotationsMap } from '../types/annotations';
import { RawCitation } from '../types/citations';
import { CitationsDemo } from './CitationsDemo';
import { HighlightOverlayDemo } from './HighlightOverlayDemo';
import { Outline } from './Outline';
import { ScrollToDemo } from './ScrollToDemo';
import { SidebarOverlay } from './SidebarOverlay';
import { VideoNotes } from './VideoNotes';

import { Highlight, Clip } from '../types/clips';

import data from '../data/annotations/3491102.3501873.json';
import { spreadOutClips } from '../utils/positioning';

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

  // Navigation mode = auto-scrolling between video clips
  // Scroll overflow checks if padding needs to be added to the page
  const [navigating, setNavigating] = React.useState(null);
  const [scrollOverflow, setScrollOverflow] = React.useState(0);

  // Load data
  const samplePdfUrl = 'public/pdf/3491102.3501873.pdf';
  const videoUrl = 'https://www.youtube.com/watch?v=brCo42DoMu0';
  const [ highlights, setHighlights ] = React.useState<{[index: number]: Highlight}>(data['highlights']);
  const [ clips, setClips ] = React.useState<{[index: number]: Clip}>(data['clips']);

  const [ videoWidth, setVideoWidth ] = React.useState(pageDimensions * 0.25 / 9 * 16);

  const [ scrubClip, setScrubClip ] = React.useState(null);

  const {
    isShowingHighlightOverlay,
    isShowingTextHighlight,
    setIsShowingHighlightOverlay,
    setIsShowingOutline,
    setIsShowingTextHighlight,
  } = React.useContext(UiContext);

  React.useEffect(() => {
    setIsShowingTextHighlight(true);
  }, []);

  React.useEffect(() => {
    // If data has been loaded then return directly to prevent sending multiple requests
    if (rawCitations) {
      return;
    }
    var videoHeight = pageDimensions.height * scale * 0.25;
    var videoWidth = videoHeight/9*16
  
    var pageWidth = pageDimensions.width * scale + 48;
    if(videoWidth + pageWidth > window.innerWidth) {
      videoWidth = window.innerWidth - pageWidth - 40;
    }  

    setVideoWidth(videoWidth);
  }, [pageDimensions]);

  React.useEffect(() => {
    var videoHeight = pageDimensions.height * scale * 0.25;
    var videoWidth = videoHeight/9*16
  
    var pageWidth = pageDimensions.width * scale + 48;
    if(videoWidth + pageWidth > window.innerWidth) {
      videoWidth = window.innerWidth - pageWidth - 40;
    }

    setVideoWidth(videoWidth);
  }, [scale]);

  React.useEffect(() => {
    setScrollRoot(pdfScrollableRef.current || null);
  }, [pdfScrollableRef]);

  // In navigation mode, scroll to the video clip
  React.useEffect(() => {
    if(navigating == null) return;
    var container = document.getElementsByClassName("reader__main")[0];
    container.scrollTo({top: navigating.scrollTo, left: 0, behavior: "smooth"})
  }, [navigating]);

  // Scroll from video clip to video clip
  const handleNavigate = (fromId: number, toId: number) => {
    if(fromId == toId) return;
    var container = document.getElementsByClassName("reader__main")[0];

    var fromVideo = document.getElementById("video__note-" + fromId);
    var fromTop = 0;
    if(fromVideo != null)
      fromTop = fromVideo.getBoundingClientRect().top;
    
    var toVideo = document.getElementById("video__note-" + toId);
    var toTop = 0;
    if(toVideo != null)
      toTop = toVideo.getBoundingClientRect().top + container.scrollTop;

    // ScrollTo location = location of toId but adjusted to match relative screen location of fromId
    var scrollTo = Math.floor(toTop - fromTop);

    // Add padding to the page if scroll overflows beyond the page
    if(scrollTo < 0) {
      setScrollOverflow(-1);
      var container = document.getElementsByClassName("reader__main")[0];
      scrollTo += 1000
    } else if (scrollTo + window.innerHeight > container.scrollHeight) {
      setScrollOverflow(1);
      if(scrollOverflow == -1)
        scrollTo -= 1000
    }

    setNavigating({ fromId, toId, fromTop, toTop, scrollTo, position: null });
  }

  const handleScroll = (e: any) => {
    if(navigating == null) {
      // Remove the padding spaces added to handle overflow
      if(scrollOverflow == -1 && e.target.scrollTop > 1000){
        setScrollOverflow(0);
      } else if(scrollOverflow == 1 && e.target.scrollTop + window.innerHeight < e.target.scrollHeight - 2000) {
        setScrollOverflow(0);
      };
      return;
    }
    if(navigating.scrollTo != e.target.scrollTop) return;
    // Reached desired scroll position so finish navigation mode
    if(navigating.position == null) {
      setNavigating(null);
    } else {
      var newClips: {[index: number]: Clip} = JSON.parse(JSON.stringify(clips));
      newClips[navigating.toId].position = navigating.position;
      var highlightId = newClips[navigating.toId].highlights[navigating.position];
      newClips[navigating.toId].position = navigating.position;
      newClips[navigating.toId].top = highlights[highlightId].rects[0].top;
      newClips[navigating.toId].page = highlights[highlightId].rects[0].page;
      setNavigating(null);
    }
  };

  // Move clip to the position of another paper highlight
  const changeClipPosition = (highlightId: number) => {
    var clipId = highlights[highlightId]['clip'];
    var newClips: {[index: number]: Clip} = JSON.parse(JSON.stringify(clips));
    var newPosition = newClips[clipId].highlights.findIndex((ele) => ele == highlightId);
    newClips[clipId].position = newPosition;
    newClips[clipId].top = highlights[highlightId].rects[0].top;
    newClips[clipId].page = highlights[highlightId].rects[0].page;
    setClips(newClips);
  }

  // Navigate with clip to the position of another paper highlight
  const navigateToPosition = (clipId: number, highlightIdx: number) => {
    if(clips[clipId].position == highlightIdx) return;

    var newClips: {[index: number]: Clip} = JSON.parse(JSON.stringify(clips));
    newClips[clipId].position = highlightIdx;
    var highlightId = newClips[clipId].highlights[highlightIdx];
    newClips[clipId].top = highlights[highlightId].rects[0].top;
    newClips[clipId].page = highlights[highlightId].rects[0].page;

    // Find what the clip's top will be in the new position;
    var spreadClips = spreadOutClips(newClips, videoWidth, pageDimensions.height * scale);
    var container = document.getElementsByClassName("reader__main")[0];
    var fromVideo = document.getElementById("video__note-" + clipId);
    var fromTop = 0;
    if(fromVideo != null)
      fromTop = fromVideo.getBoundingClientRect().top;

    var toTop = (spreadClips[clipId].top + spreadClips[clipId].page) * pageDimensions.height * scale + (24 + spreadClips[clipId].page * 48) + 38;
    if(scrollOverflow == -1)
      toTop += 1000;

    var scrollTo = Math.floor(toTop - fromTop);

    if(scrollTo < 0) {
      setScrollOverflow(-1);
      var container = document.getElementsByClassName("reader__main")[0];
      scrollTo += 1000
    } else if (scrollTo + window.innerHeight > container.scrollHeight) {
      setScrollOverflow(1);
      if(scrollOverflow == -1)
        scrollTo -= 1000
    }
    setClips(newClips);
    
    setNavigating({ fromId: -1, toId: clipId, fromTop, toTop, scrollTo, position: highlightIdx });
  }

  // Expand or contract captions
  // This needs to be saved in the clips because it affects their size and how they are spread out
  const toggleCaptions = (clipId: number, isExpand: boolean) => {
    var newClips: {[index: number]: Clip} = JSON.parse(JSON.stringify(clips));
    newClips[clipId]['expanded'] = isExpand;
    setClips(newClips);
  }

  // Show or hide other highlights
  const toggleAltHighlights = (clipId: number, isShow: boolean) => {
    var newClips: {[index: number]: Clip} = JSON.parse(JSON.stringify(clips));
    newClips[clipId]['alternatives'] = isShow;
    setClips(newClips);
  }

  return (
    <BrowserRouter>
      <Route path="/">
        <div className="reader__header">
          <ZoomOutButton/>
          <ZoomInButton/>
        </div>
        <div className="reader__container">
          <DocumentWrapper 
            className="reader__main"
            file={samplePdfUrl} 
            inputRef={pdfContentRef} 
            onScroll={handleScroll}
          >
            {scrollOverflow == -1 ? <div style={{height: "1000px"}}></div> : ""}
            <div className="reader__main-inner">
              <Outline parentRef={pdfContentRef} />
              <div className="reader__page-list" ref={pdfScrollableRef}>
                {Array.from({ length: numPages }).map((_, i) => (
                  <PageWrapper key={i} pageIndex={i}>
                    <Overlay>
                      <SidebarOverlay 
                        pageIndex={i} 
                        highlights={highlights} 
                        changeClipPosition={changeClipPosition}
                        setScrubClip={setScrubClip}
                      />
                    </Overlay>
                  </PageWrapper>
                ))}
              </div>
              <VideoNotes 
                url={videoUrl} 
                clips={clips} 
                highlights={highlights}
                navigating={navigating} 
                handleNavigate={handleNavigate}
                navigateToPosition={navigateToPosition}
                toggleCaptions={toggleCaptions}
                toggleAltHighlights={toggleAltHighlights}
                scrubClip={scrubClip}
                videoWidth={videoWidth}
              />
            </div>
            {scrollOverflow == 1 ? <div style={{height: "2000px"}}></div> : ""}
          </DocumentWrapper>
        </div>
      </Route>
    </BrowserRouter>
  );
};
