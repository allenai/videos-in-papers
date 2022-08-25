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
import { Player } from './Player';

import data from '../data/annotations/conditionaldelegation.json';

export const Reader: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { setScrollRoot } = React.useContext(ScrollContext);
  const [annotations, setAnnotations] = React.useState<PageToAnnotationsMap>(
    new Map<number, Annotations>()
  );
  const [rawCitations, setRawCitations] = React.useState<RawCitation[]>();
  const [current, setCurrent] = React.useState(-1);

  const [navigating, setNavigating] = React.useState(null);

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

  const changeCurrent = (index: number) => {
    setCurrent(index);
  }

  React.useEffect(() => {
    if(navigating == null) return;
    var container = document.getElementsByClassName("reader__main")[0];
    container.scrollTo({top: navigating.scrollTo, left: 0, behavior: "smooth"})
  }, [navigating]);

  const handleNavigate = (e: any) => {
    var fromTop = e.currentTarget.getBoundingClientRect().top;
    var fromIndex = parseInt(e.currentTarget.getAttribute('data-index'));
    var toIndex = (fromIndex + 1) % 4;
    console.log(toIndex);
    var toVideo = document.getElementsByClassName("video__note-container")[toIndex];
    var container = document.getElementsByClassName("reader__main")[0];
    var toTop = toVideo.getBoundingClientRect().top + container.scrollTop;

    setNavigating({
      fromIndex: fromIndex,
      toIndex: toIndex,
      fromTop: fromTop,
      toTop: toTop,
      scrollTo: Math.floor(toTop - fromTop),
    });
  }

  const handleScroll = (e: any) => {
    if(navigating == null) return;
    console.log(e.target.scrollTop, navigating)
    if(navigating.scrollTo == e.target.scrollTop) {
      setNavigating(null);
    }
  };

  return (
    <BrowserRouter>
      <Route path="/">
        <div className="reader__container">
          <DocumentWrapper 
            className="reader__main" 
            file={samplePdfUrl} inputRef={pdfContentRef} 
            style={{overflowY: navigating == null ? "scroll" : "hidden"}}
            onScroll={handleScroll}
          >
            <Outline parentRef={pdfContentRef} />
            <div className="reader__page-list" ref={pdfScrollableRef}>
              {Array.from({ length: numPages }).map((_, i) => (
                <PageWrapper key={i} pageIndex={i}>
                  <Overlay>
                    <HighlightOverlayDemo pageIndex={i} />
                    <TextHighlight pageIndex={i} data={data} current={current} changeCurrent={changeCurrent} />
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
            <div className="video__note-list">
              {[0, 1, 2, 3].map((idx) => {
                var top = 800*(idx+1);
                var isOverlay = false;
                var isReplacement = false;
                if(navigating !== null && navigating.fromIndex == idx) {
                  top = navigating.toTop;
                  idx = navigating.toIndex;
                  isReplacement = true;
                } else if(navigating !== null && navigating.toIndex == idx) {
                  top = navigating.fromTop;
                  isOverlay = true;
                }
                return (
                  <Player 
                    top={top} index={idx}
                    url={videoUrl} data={data} 
                    current={current} changeCurrent={changeCurrent}
                    handleNavigate={handleNavigate}
                    isOverlay={isOverlay} isReplacement={isReplacement}
                  />
                )
              })}
            </div>
          </DocumentWrapper>
        </div>
      </Route>
    </BrowserRouter>
  );
};
