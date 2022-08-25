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
import { TextHighlight } from './TextHighlight';
import { VideoNotes } from './VideoNotes';

import data from '../data/annotations/conditionaldelegation.json';

export const Reader: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { setScrollRoot } = React.useContext(ScrollContext);
  const [annotations, setAnnotations] = React.useState<PageToAnnotationsMap>(
    new Map<number, Annotations>()
  );
  const [rawCitations, setRawCitations] = React.useState<RawCitation[]>();

  const [navigating, setNavigating] = React.useState(null);

  const [scrollOverflow, setScrollOverflow] = React.useState(0);

  // ref for the div in which the Document component renders
  const pdfContentRef = React.createRef<HTMLDivElement>();

  // ref for the scrollable region where the pages are rendered
  const pdfScrollableRef = React.createRef<HTMLDivElement>();

  const samplePdfUrl = 'https://vivlai.github.io/papers/chi2022.pdf';
  const sampleS2airsUrl =
    'http://s2airs.prod.s2.allenai.org/v1/pdf_data?pdf_sha=9b79eb8d21c8a832daedbfc6d8c31bebe0da3ed5';
  const videoUrl = 'https://www.youtube.com/watch?v=4W2ed8C9LYM';

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

    fetch(sampleS2airsUrl, { referrer: '' })
      .then(response => response.json())
      .then(data => {
        setRawCitations(data[0].citations);
      });
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
    if(navigating == null) return;
    var container = document.getElementsByClassName("reader__main")[0];
    container.scrollTo({top: navigating.scrollTo, left: 0, behavior: "smooth"})
  }, [navigating]);

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

    var scrollTo = Math.floor(toTop - fromTop);
    if(scrollTo < 0) {
      setScrollOverflow(-1);
      var container = document.getElementsByClassName("reader__main")[0];
      //container.scrollTo({top: container.scrollTop + 1000});
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
      if(scrollOverflow == -1 && e.target.scrollTop > 1000){
        setScrollOverflow(0);
      } else if(scrollOverflow == 1 && e.target.scrollTop + window.innerHeight < e.target.scrollHeight - 2000) {
        setScrollOverflow(0);
      };
      return;
    }
    if(navigating.scrollTo != e.target.scrollTop) return;
    setNavigating(null);
  };

  const clips = [
    {id: 0, pageIndex: 0, top: 0},
    {id: 1, pageIndex: 1, top: 0.3},
    {id: 2, pageIndex: 1, top: 0.8},
    {id: 3, pageIndex: 17, top: 1},
  ];

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
                      <TextHighlight pageIndex={i} highlights={data['highlights']} />
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
                  url={videoUrl} clips={clips} 
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
