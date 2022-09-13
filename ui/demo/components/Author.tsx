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
import { AuthorMappingControls } from './AuthorMappingControls';

import { Highlight, Clip, Caption, Block } from '../types/clips';

const DOI = window.location.pathname.split("/").pop();

export const Author: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const { setScrollRoot } = React.useContext(ScrollContext);

  // ref for the div in which the Document component renders
  const pdfContentRef = React.createRef<HTMLDivElement>();

  // ref for the scrollable region where the pages are rendered
  const pdfScrollableRef = React.createRef<HTMLDivElement>();

  // Load data
  const [ doi, setDoi ] = React.useState<string>(DOI ? DOI : "");
  const [ videoUrl, setVideoUrl ] = React.useState<string>('/api/clips/' + DOI + '/full.mp4');
  const [ highlights, setHighlights ] = React.useState<{[index: number]: Highlight}>({});
  const [ clips, setClips ] = React.useState<{[index: number]: Clip}>({});
  const [ blocks, setBlocks ] = React.useState<Array<Block>>([]);
  const [ captions, setCaptions ] = React.useState<Array<Caption>>([]);

  const [ videoWidth, setVideoWidth ] = React.useState(0);
  const [ selectedBlocks, setSelectedBlocks ] = React.useState<Array<number>>([]);
  const [ selectedClip, setSelectedClip ] = React.useState<Array<number>>([-1, -1]);

  const [ selectedMapping, setSelectedMapping ] = React.useState<number | null>(null);
  const [ modifyMode, setModifyMode ] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetch('/api/blocks/'+doi+'.json')
      .then((res) => res.json())
      .then((data: Array<Block>) => {
        setBlocks(data);
      });
    fetch('/api/captions/'+doi+'.json')
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

  React.useEffect(() => {
    if(selectedMapping == null && modifyMode) { 
        setModifyMode(false);
    } else if(selectedMapping != null && !modifyMode) {
        setModifyMode(true);
    }
  }, [selectedMapping]);

  const handleClickOutside = (e: React.MouseEvent<HTMLElement>) => {
    if((e.target as HTMLElement).className.includes('reader_highlight_color')) {
        return;
    }
    setSelectedBlocks([]);
    setSelectedMapping(null);
  }

  const createMapping = () => {
    var topTop = 0;
    var topPage = 0;
    var copyBlocks = [...selectedBlocks];
    copyBlocks.sort();
    var rects: Array<BoundingBoxType> = copyBlocks.map((id: number) => {
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
        section: blocks[copyBlocks[0]]['section'],
        blocks: copyBlocks
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

  const removeMapping = () => {
    if(selectedMapping == null) return;
    var clipId = selectedMapping;
    var highlightIds = clips[clipId].highlights;
    var newClips = {...clips};
    var newHighlights = {...highlights};
    delete newClips[clipId];
    for(var i = 0; i < highlightIds.length; i++) {
        delete newHighlights[highlightIds[i]];
    }
    setClips(newClips);
    setHighlights(newHighlights);
  }

  const changeClip = (clipId: number, start: number, end: number) => {
    var newClips = {...clips};
    newClips[clipId].start = start;
    newClips[clipId].end = end;
    var filteredCaptions = captions.filter((c: Caption) => {
        return start <= c.start && c.start < end || start < c.end && c.end <= end;
    });
    newClips[clipId].captions = filteredCaptions;
    setClips(newClips);
  }

  const changeHighlight = (highlightId: number, changedBlocks: Array<number>) => {
    var newHighlights = {...highlights};
    var copyBlocks = [...changedBlocks];
    copyBlocks.sort();
    var rects: Array<BoundingBoxType> = copyBlocks.map((id: number) => {
        var blk = blocks[id];
        return {
            page: blk.page,
            top: blk.top,
            left: blk.left,
            height: blk.height,
            width: blk.width
        }
    });
    newHighlights[highlightId].rects = rects;
    newHighlights[highlightId].blocks = changedBlocks;
    newHighlights[highlightId].section = blocks[copyBlocks[0]]['section'];
    setHighlights(newHighlights);
  }

  const saveAnnotations = () => {
    var data = {doi: doi, highlights: highlights, clips: clips};
    fetch('/api/save_annotations', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((response) => {
      return response.json();
    }).then((result) => {
      console.log("SAVED!");
    });
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
          <Header saveAnnotations={saveAnnotations}/>
          <div className="reader__container">
            <AuthorMappingControls 
                selectedBlocks={selectedBlocks} 
                selectedClip={selectedClip}
                selectedMapping={selectedMapping}
                createMapping={createMapping}
                removeMapping={removeMapping}
                modifyMode={modifyMode}
                setModifyMode={setModifyMode}
            />
            <DocumentWrapper 
              className="reader__main"
              file={'/api/pdf/'+doi+'.pdf'} 
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
                          changeHighlight={changeHighlight}
                          clips={clips}
                          selectedMapping={selectedMapping}
                          setSelectedMapping={setSelectedMapping}
                          modifyMode={modifyMode}
                        />
                      </Overlay>
                    </PageWrapper>
                  ))}
                </div>
              </div>
            </DocumentWrapper>
            <AuthorVideoSegmenter  
              url={videoUrl}
              videoWidth={videoWidth}
              clips={clips} 
              changeClip={changeClip}
              highlights={highlights}
              captions={captions}
              selectedClip={selectedClip}
              setSelectedClip={setSelectedClip}
              selectedMapping={selectedMapping}
              setSelectedMapping={setSelectedMapping}
              modifyMode={modifyMode}
            />
          </div>
        </Route>
      </BrowserRouter>
    );
  }
};
