import {
  DocumentContext,
  DocumentWrapper,
  Overlay,
  PageWrapper,
  ScrollContext,
  UiContext,
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

import data from '../data/annotations/aichains.json';
import { TextHighlight } from './TextHighlight';

export const Reader: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { setScrollRoot } = React.useContext(ScrollContext);
  const [annotations, setAnnotations] = React.useState<PageToAnnotationsMap>(
    new Map<number, Annotations>()
  );
  const [rawCitations, setRawCitations] = React.useState<RawCitation[]>();

  // ref for the div in which the Document component renders
  const pdfContentRef = React.createRef<HTMLDivElement>();

  // ref for the scrollable region where the pages are rendered
  const pdfScrollableRef = React.createRef<HTMLDivElement>();

  const [ highlights, setHighlights ] = React.useState<Array<Highlight>>(data['highlights']);
  for(var i = 0; i < data['clips'].length; i++) {
    data['clips'][i]['position'] = 0;
  }
  const [ clips, setClips ] = React.useState<Array<Clip>>(data['clips']);

  // navigating mode = auto-scrolling between video clips 
  const [navigating, setNavigating] = React.useState(null);
  // check if scrolling before or beyond available space
  const [scrollOverflow, setScrollOverflow] = React.useState(0);

  const samplePdfUrl = 'https://arxiv.org/pdf/2110.01691.pdf';
  const sampleS2airsUrl =
    'http://s2airs.prod.s2.allenai.org/v1/pdf_data?pdf_sha=9b79eb8d21c8a832daedbfc6d8c31bebe0da3ed5';
  const videoUrl = 'https://www.youtube.com/watch?v=brCo42DoMu0';

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

    // fetch(sampleS2airsUrl, { referrer: '' })
    //   .then(response => response.json())
    //   .then(data => {
    //     setRawCitations(data[0].citations);
    //   });
  }, [pageDimensions]);

  React.useEffect(() => {
    setScrollRoot(pdfScrollableRef.current || null);
  }, [pdfScrollableRef]);

  // Attaches annotation data to paper
  React.useEffect(() => {
    // Don't execute until paper data and PDF document have loaded
    if (!rawCitations || !pageDimensions.height || !pageDimensions.width) {
      return;
    }

    setAnnotations(generateCitations(rawCitations, pageDimensions));
  }, [rawCitations, pageDimensions]);

  React.useEffect(() => {
    // In navigation mode, scroll to the next video clip
    if(navigating == null) return;
    var container = document.getElementsByClassName("reader__main")[0];
    container.scrollTo({top: navigating.scrollTo, left: 0, behavior: "smooth"})
  }, [navigating]);

  // scroll from video clip to video clip
  const handleNavigate = (fromId: number, toId: number) => {
    var container = document.getElementsByClassName("reader__main")[0];

    var fromVideo = document.getElementById("video__note-" + fromId);
    var fromTop = 0;
    if(fromVideo != null)
      fromTop = fromVideo.getBoundingClientRect().top;
    
    var toVideo = document.getElementById("video__note-" + toId);
    var toTop = 0;
    if(toVideo != null)
      toTop = toVideo.getBoundingClientRect().top + container.scrollTop;

    // scrollTo location = location of toId but adjusted to match relative screen location of fromId
    var scrollTo = Math.floor(toTop - fromTop);

    // fix scroll if overflowing (beyond page)
    if(scrollTo < 0) {
      setScrollOverflow(-1);
      var container = document.getElementsByClassName("reader__main")[0];
      scrollTo += 1000
    } else if (scrollTo + window.innerHeight > container.scrollHeight) {
      setScrollOverflow(1);
      if(scrollOverflow == -1)
        scrollTo -= 1000
    }

    setNavigating({ fromId, toId, fromTop, toTop, scrollTo });
  }

  const handleScroll = (e: any) => {
    if(navigating == null) {
      // added spaces for scrolling not needed anymore
      if(scrollOverflow == -1 && e.target.scrollTop > 1000){
        setScrollOverflow(0);
      } else if(scrollOverflow == 1 && e.target.scrollTop + window.innerHeight < e.target.scrollHeight - 2000) {
        setScrollOverflow(0);
      };
      return;
    }
    if(navigating.scrollTo != e.target.scrollTop) return;
    // reached desired scorll position --> navigation mode finished
    setNavigating(null);
  };

  const changeClipPosition = (highlightId: string) => {
    var clipId = highlights[highlightId]['clip'];
    var newClips: Array<Clip> = [];
    for(var i = 0; i < clips.length; i++) {
      if(clips[i]['id'] != clipId) {
        newClips.push(clips[i]);
      } else {
        var position = clips[i]['highlights'].findIndex((ele) => ele == highlightId);
        newClips.push({
          ...clips[i],
          position: position
        })
      }
    }
    setClips(newClips);
  }

  return (
    <BrowserRouter>
      <Route path="/">
        <div className="reader__container">
          <DocumentWrapper 
            className="reader__main"
            file={samplePdfUrl} inputRef={pdfContentRef} 
            onScroll={handleScroll}
          >
            {scrollOverflow == -1 ? <div style={{height: "1000px"}}></div> : ""}
            <div className="reader__main-inner">
              <Outline parentRef={pdfContentRef} />
              <div className="reader__page-list" ref={pdfScrollableRef}>
                {Array.from({ length: numPages }).map((_, i) => (
                  <PageWrapper key={i} pageIndex={i}>
                    <Overlay>
                      <HighlightOverlayDemo pageIndex={i} />
                      <SidebarOverlay 
                        pageIndex={i} 
                        highlights={highlights} 
                        changeClipPosition={changeClipPosition}
                      />
                      <ScrollToDemo pageIndex={i} />
                      <CitationsDemo
                        annotations={annotations}
                        pageIndex={i}
                        parentRef={pdfScrollableRef}
                      />
                    </Overlay>
                  </PageWrapper>
                ))}
              </div>
              <div style={{position: "relative"}}>
                <VideoNotes 
                  url={videoUrl} clips={clips} highlights={highlights}
                  navigating={navigating} handleNavigate={handleNavigate}
                />
              </div>
            </div>
            {scrollOverflow == 1 ? <div style={{height: "2000px"}}></div> : ""}
          </DocumentWrapper>
        </div>
      </Route>
    </BrowserRouter>
  );
};
