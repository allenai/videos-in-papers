import {
  DocumentContext,
  DocumentWrapper,
  Overlay,
  PageWrapper,
  ScrollContext,
  UiContext,
  TransformContext,
  BoundingBoxType,
  ZoomOutButton,
  ZoomInButton,
} from '@allenai/pdf-components';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';

import { Header } from './Header';
import { Outline } from './Outline';
import { AuthorVideoSegmenter } from './AuthorVideoSegmenter';
import { AuthorBlockOverlay } from './AuthorBlockOverlay';

import { Highlight, Clip, Caption, Block } from '../types/clips';

export const Author: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const { setScrollRoot } = React.useContext(ScrollContext);

  // ref for the div in which the Document component renders
  const pdfContentRef = React.createRef<HTMLDivElement>();

  // ref for the scrollable region where the pages are rendered
  const pdfScrollableRef = React.createRef<HTMLDivElement>();

  // Load data
  const DOI = "3491102.3501967";
  const VIDEO_URL = "https://www.youtube.com/watch?v=HBcDELI9ZNE";
  const [ highlights, setHighlights ] = React.useState<{[index: number]: Highlight}>({});
  const [ clips, setClips ] = React.useState<{[index: number]: Clip}>({});
  const [ blocks, setBlocks ] = React.useState<Array<Block>>([]);
  const [ captions, setCaptions ] = React.useState<Array<Caption>>([]);

  const [ videoWidth, setVideoWidth ] = React.useState(0);
  const [ selectedBlocks, setSelectedBlocks ] = React.useState<Array<number>>([]);
  const [ selectedClip, setSelectedClip ] = React.useState<Array<number>>([-1, -1]);

  var data = new FormData();
  data.append("json", JSON.stringify({doi: DOI}));
  React.useEffect(() => {
    fetch('/api/blocks/'+DOI+'.json')
      .then((res) => res.json())
      .then((data) => {
        setBlocks(
          data.map((block: {id: string, index: string, page: string, type: string, y1: string, x1: string, y2: string, x2: string}) => {
            return {
              id: parseInt(block.id),
              index: parseInt(block.index),
              page: parseInt(block.page),
              type: block.type,
              top: parseFloat(block.y1),
              left: parseFloat(block.x1),
              height: parseFloat(block.y2) - parseFloat(block.y1),
              width: parseFloat(block.x2) - parseFloat(block.x1),
            }
          })
        );
      });
    fetch('/api/captions/'+DOI+'.json')
      .then((res) => res.json())
      .then((data) => {
        setCaptions(data);
      });
  }, []);

  React.useEffect(() => {
    // If data has been loaded then return directly to prevent sending multiple requests
    var videoWidth = window.innerWidth - pageDimensions.width * scale - 48 - 48;

    setVideoWidth(videoWidth);
  }, [pageDimensions, scale]);

  React.useEffect(() => {
    setScrollRoot(pdfScrollableRef.current || null);
  }, [pdfScrollableRef]);

  const handleClickOutside = (e: React.MouseEvent<HTMLElement>) => {
    if((e.target as HTMLElement).className.includes('reader_highlight_color')) {
        return;
    }
    setSelectedBlocks([]);
  }

  const createMapping = () => {
    var topTop = 0;
    var topPage = 0;
    var rects: Array<BoundingBoxType> = selectedBlocks.map((id: number) => {
        var blk = blocks[id];
        if(blk.page < topPage) {
            topPage = blk.page;
            topTop = blk.top;
        } else if (blk.page == topPage && blk.top < topTop) {
            topTop = blk.top;
        }
        return {
            page: blk.page,
            top: blk.top,
            left: blk.left,
            height: blk.height,
            width: blk.width
        }
    })
    var highlightId = Object.keys(highlights).length;
    var clipId = Object.keys(clips).length;
    var highlight: Highlight = {
        id: highlightId,
        type: "text",
        rects: rects,
        clip: clipId,
        tokens: [],
        section: blocks[selectedBlocks[0]]['section'],
        blocks: selectedBlocks
    };
    var filteredCaptions = captions.filter((c: Caption) => {
        return selectedClip[0] <= c.start && c.start < selectedClip[1] || selectedClip[0] < c.end && c.end <= selectedClip[1];
    });
    
    var clip: Clip = {
        id: clipId, 
        start: selectedClip[0],
        end: selectedClip[1],
        highlights: [highlightId],
        position: 0,
        top: topTop,
        page: topPage,
        captions: filteredCaptions,
    }
    
    var copyHighlights = {...highlights};
    copyHighlights[highlightId] = highlight;
    setHighlights(copyHighlights);

    var copyClips = {...clips};
    copyClips[clipId] = clip;
    setClips(copyClips); 

    setSelectedBlocks([]);
    setSelectedClip([-1, -1]);
  }

  if(videoWidth == 0) {
    return (
      <div>
        Loading...
      </div>
    )
  } else {
    return (
      <BrowserRouter>
        <Route path="/">
          <Header/>
          <div className="reader__container">
            <div className="mapping-controls__container">
                {
                    selectedBlocks.length > 0 && selectedClip[0] != -1 ? 
                    <button onClick={createMapping} style={{backgroundColor: "#1890ff"}}>Create Mapping</button> :
                    ""
                }
            </div>
            <DocumentWrapper 
              className="reader__main"
              file={'/api/pdf/'+DOI+'.pdf'} 
              inputRef={pdfContentRef} 
            >
              <div className="reader__main-inner" onClick={handleClickOutside}>
                <Outline parentRef={pdfContentRef} />
                <div className="reader__page-list" ref={pdfScrollableRef}>
                  {Array.from({ length: numPages }).map((_, i) => (
                    <PageWrapper key={i} pageIndex={i}>
                      <Overlay>
                        <AuthorBlockOverlay 
                          pageIndex={i} 
                          blocks={blocks}
                          selectedBlocks={selectedBlocks}
                          setSelectedBlocks={setSelectedBlocks}
                          highlights={highlights} 
                        />
                      </Overlay>
                    </PageWrapper>
                  ))}
                </div>
              </div>
            </DocumentWrapper>
            <AuthorVideoSegmenter  
              url={VIDEO_URL}
              videoWidth={videoWidth}
              clips={clips} 
              highlights={highlights}
              captions={captions}
              selectedClip={selectedClip}
              setSelectedClip={setSelectedClip}
            />
          </div>
        </Route>
      </BrowserRouter>
    );
  }
};
