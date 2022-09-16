import {
  BoundingBoxType,
  DocumentContext,
  DocumentWrapper,
  Overlay,
  PageWrapper,
  ScrollContext,
  TransformContext,
} from '@allenai/pdf-components';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';

import { Block, Caption, Clip, Highlight, SyncWords } from '../types/clips';
import { AuthorBlockOverlay } from './AuthorBlockOverlay';
import { AuthorMappingControls } from './AuthorMappingControls';
import { AuthorVideoSegmenter } from './AuthorVideoSegmenter';
import { Header } from './Header';
import { Outline } from './Outline';

const DOI = window.location.pathname.split('/').pop();

export const Author: React.FunctionComponent<RouteComponentProps> = () => {
  const { pageDimensions, numPages } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const { setScrollRoot } = React.useContext(ScrollContext);

  // ref for the div in which the Document component renders
  const pdfContentRef = React.createRef<HTMLDivElement>();

  // ref for the scrollable region where the pages are rendered
  const pdfScrollableRef = React.createRef<HTMLDivElement>();

  // Load data
  const [doi] = React.useState<string>(DOI ? DOI : '');
  const [videoUrl] = React.useState<string>('/api/clips/' + DOI + '/full.mp4');
  const [highlights, setHighlights] = React.useState<{ [index: number]: Highlight }>({});
  const [clips, setClips] = React.useState<{ [index: number]: Clip }>({});
  const [blocks, setBlocks] = React.useState<Array<Block>>([]);
  const [captions, setCaptions] = React.useState<Array<Caption>>([]);

  const [videoWidth, setVideoWidth] = React.useState(0);
  const [selectedBlocks, setSelectedBlocks] = React.useState<Array<number>>([]);
  const [selectedClip, setSelectedClip] = React.useState<Array<number>>([-1, -1]);

  const [selectedMapping, setSelectedMapping] = React.useState<number | null>(null);
  const [modifyMode, setModifyMode] = React.useState<boolean>(false);

  const [highlightMode, setHighlightMode] = React.useState<boolean>(false);
  const [selectedWords, setSelectedWords] = React.useState<SyncWords>({
    tokenIds: [],
    captionIds: [],
    clipId: -1,
  });
  const [syncSegments, setSyncSegments] = React.useState<{ [id: number]: Array<SyncWords> }>({});
  const [hoveredSegment, setHoveredSegment] = React.useState<{
    clipId: number;
    index: number;
  } | null>(null);

  const [shiftDown, setShiftDown] = React.useState(false);

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/blocks/' + doi + '.json')
      .then(res => res.json())
      .then((data: Array<Block>) => {
        setBlocks(data);
      });
    fetch('/api/captions/' + doi + '.json')
      .then(res => res.json())
      .then(data => {
        setCaptions(
          data.map((c: { caption: string; start: number; end: number }, i: number) => {
            return { ...c, id: i };
          })
        );
      });
  }, []);

  React.useEffect(() => {
    // If data has been loaded then return directly to prevent sending multiple requests
    const videoWidth = window.innerWidth - pageDimensions.width * scale - 48 - 48;

    setVideoWidth(videoWidth);
  }, [pageDimensions, scale]);

  React.useEffect(() => {
    setScrollRoot(pdfScrollableRef.current || null);
  }, [pdfScrollableRef]);

  React.useEffect(() => {
    if (selectedMapping == null && modifyMode) {
      setModifyMode(false);
    } else if (selectedMapping != null && !modifyMode) {
      setModifyMode(true);
    }
  }, [selectedMapping]);

  const handleClickOutside = (e: React.MouseEvent<HTMLElement>) => {
    const targetClasses = (e.target as HTMLElement).className;
    if (
      targetClasses.includes('reader_highlight_color') ||
      targetClasses.includes('reader_highlight_token')
    ) {
      return;
    }
    setSelectedBlocks([]);
    setSelectedMapping(null);
    setHighlightMode(false);
    setSelectedWords({ tokenIds: [], captionIds: [], clipId: -1 });
  };

  const checkContinuousBlocks = (blockIdOne: number, blockIdTwo: number) => {
    console.log(blockIdOne, blockIdTwo);
    const smallerBlockId = Math.min(blockIdOne, blockIdTwo);
    const largerBlockId = Math.max(blockIdOne, blockIdTwo);
    const blockOne = blocks[smallerBlockId];
    const blockTwo = blocks[largerBlockId];
    if (blockOne.page == blockTwo.page) return true;
    if (smallerBlockId + 1 == largerBlockId) return true;
    for (let i = smallerBlockId + 1; i < largerBlockId; i++) {
      if (blocks[i].type == 'Paragraph' || blocks[i].type == 'Margin') return false;
    }
    return true;
  };

  const splitBlocks = (blockIds: Array<number>) => {
    const listOfList: Array<Array<number>> = [];
    let currentList: Array<number> = [];
    let lastBlock = null;
    for (let i = 0; i < blockIds.length; i++) {
      const block = blocks[blockIds[i]];
      if (lastBlock == null || checkContinuousBlocks(lastBlock.id, block.id)) {
        currentList.push(blockIds[i]);
      } else {
        listOfList.push(currentList);
        currentList = [blockIds[i]];
      }
      lastBlock = block;
    }
    listOfList.push(currentList);
    return listOfList;
  };

  const createMapping = () => {
    let topTop = 0;
    let topPage = 0;
    const copyBlocks = [...selectedBlocks];
    copyBlocks.sort();
    let clipId = Math.max(...Object.values(clips).map(c => c.id)) + 1;
    if (Object.values(clips).length == 0) {
      clipId = 0;
    }

    const copyHighlights = { ...highlights };
    const newHighlightIds = [];
    const splitBlocksList = splitBlocks(copyBlocks);
    for (var i = 0; i < splitBlocksList.length; i++) {
      let highlightId = Math.max(...Object.values(copyHighlights).map(hl => hl.id)) + 1;
      if (Object.values(copyHighlights).length == 0) {
        highlightId = 0;
      }
      const rects: Array<BoundingBoxType> = splitBlocksList[i].map((id: number) => {
        const blk = blocks[id];
        if (i == 0) {
          if (blk.page < topPage) {
            topPage = blk.page;
            topTop = blk.top;
          } else if (blk.page == topPage && blk.top < topTop) {
            topTop = blk.top;
          }
        }
        return {
          page: blk.page,
          top: blk.top,
          left: blk.left,
          height: blk.height,
          width: blk.width,
        };
      });
      const highlight: Highlight = {
        id: highlightId,
        type: 'text',
        rects: rects,
        clip: clipId,
        tokens: [],
        section: blocks[splitBlocksList[i][0]]['section'],
        blocks: splitBlocksList[i],
      };
      copyHighlights[highlightId] = highlight;
      newHighlightIds.push(highlightId);
    }

    const filteredCaptions = captions.filter((c: Caption) => {
      return (
        (selectedClip[0] <= c.start && c.start < selectedClip[1]) ||
        (selectedClip[0] < c.end && c.end <= selectedClip[1])
      );
    });
    const clip: Clip = {
      id: clipId,
      start: selectedClip[0],
      end: selectedClip[1],
      highlights: newHighlightIds,
      position: 0,
      top: topTop,
      page: topPage,
      captions: filteredCaptions,
    };

    setHighlights(copyHighlights);

    const copyClips = { ...clips };
    copyClips[clipId] = clip;
    setClips(copyClips);

    const newSyncSegments = { ...syncSegments };
    newSyncSegments[clipId] = [];
    setSyncSegments(newSyncSegments);

    setSelectedBlocks([]);
    setSelectedClip([-1, -1]);
  };

  const removeMapping = () => {
    if (selectedMapping == null) return;
    const clipId = selectedMapping;
    const highlightIds = clips[clipId].highlights;
    const newClips = { ...clips };
    const newHighlights = { ...highlights };
    const newSyncSegments = { ...syncSegments };
    delete newClips[clipId];
    delete newSyncSegments[clipId];
    for (let i = 0; i < highlightIds.length; i++) {
      delete newHighlights[highlightIds[i]];
    }
    setClips(newClips);
    setHighlights(newHighlights);
    setSelectedMapping(null);
    setHighlightMode(false);
  };

  const changeClip = (clipId: number, start: number, end: number) => {
    const newClips = { ...clips };
    newClips[clipId].start = start;
    newClips[clipId].end = end;
    const filteredCaptions = captions.filter((c: Caption) => {
      return (start <= c.start && c.start < end) || (start < c.end && c.end <= end);
    });
    newClips[clipId].captions = filteredCaptions;
    setClips(newClips);

    const captionIds = filteredCaptions.map(c => c.id);
    const segments = syncSegments[clipId];
    const newSegments = [];
    for (let i = 0; i < segments.length; i++) {
      const filteredCaptionIds = segments[i].captionIds.filter(word =>
        captionIds.includes(word.captionIdx)
      );
      if (filteredCaptionIds.length > 0) {
        newSegments.push({ ...segments[i], captionIds: filteredCaptionIds });
      }
    }
    const newSyncSegments = { ...syncSegments };
    newSyncSegments[clipId] = newSegments;
    setSyncSegments(newSyncSegments);
  };

  const changeHighlight = (clipId: number, blockId: number, operation: number) => {
    const newHighlights = { ...highlights };

    if (operation == 1) {
      var highlightId: any = null;
      for (var i = 0; i < clips[clipId].highlights.length; i++) {
        const highlight = newHighlights[clips[clipId].highlights[i]];
        if (highlight.blocks == null) continue;

        for (let j = 0; j < highlight.blocks.length; j++) {
          const hlBlockId = highlight.blocks[j];
          if (checkContinuousBlocks(hlBlockId, blockId)) {
            highlightId = highlight.id;
            break;
          }
        }

        if (highlightId != null) break;
      }

      if (highlightId == null) {
        highlightId = Math.max(...Object.values(newHighlights).map(hl => hl.id)) + 1;
        if (Object.values(newHighlights).length == 0) highlightId = 0;

        const newHighlight: Highlight = {
          id: highlightId,
          type: 'text',
          rects: [
            {
              page: blocks[blockId].page,
              top: blocks[blockId].top,
              left: blocks[blockId].left,
              height: blocks[blockId].height,
              width: blocks[blockId].width,
            },
          ],
          clip: clipId,
          tokens: [],
          section: blocks[blockId]['section'],
          blocks: [blockId],
        };

        newHighlights[highlightId] = newHighlight;
        var newClips = { ...clips };
        newClips[clipId].highlights.push(highlightId);
        setHighlights(newHighlights);
        setClips(newClips);
      } else {
        if (newHighlights[highlightId].blocks) {
          newHighlights[highlightId].blocks?.push(blockId);
        } else {
          newHighlights[highlightId].blocks = [blockId];
        }
        newHighlights[highlightId].rects.push({
          page: blocks[blockId].page,
          top: blocks[blockId].top,
          left: blocks[blockId].left,
          height: blocks[blockId].height,
          width: blocks[blockId].width,
        });
        newHighlights[highlightId].blocks?.sort((a: number, b: number) => a - b);
        setHighlights(newHighlights);
      }
    } else if (operation == -1) {
      var highlightId: any = clips[clipId].highlights.find(hId =>
        highlights[hId].blocks?.includes(blockId)
      );
      if (highlightId == undefined) return;

      const blockIdx = newHighlights[highlightId].blocks?.indexOf(blockId);
      let newBlocks = newHighlights[highlightId].blocks;

      if (blockIdx == null || blockIdx == -1 || newBlocks == undefined) return;

      newBlocks = [...newBlocks];
      newBlocks.splice(blockIdx, 1);
      newBlocks.sort((a, b) => a - b);

      if (newBlocks.length == 0) {
        delete newHighlights[highlightId];
        var newClips = { ...clips };
        const highlightIdx = newClips[clipId].highlights.indexOf(highlightId);
        newClips[clipId].highlights.splice(highlightIdx, 1);
        if (newClips[clipId].highlights.length == 0) {
          delete newClips[clipId];
          var newSyncSegments = { ...syncSegments };
          delete newSyncSegments[clipId];
          setSyncSegments(newSyncSegments);
          setSelectedMapping(null);
        } else if (newClips[clipId].position == highlightIdx) {
          newClips[clipId].position = 0;
        }
        setClips(newClips);
        setHighlights(newHighlights);
      } else {
        const rects: Array<BoundingBoxType> = newBlocks.map((id: number) => {
          const blk = blocks[id];
          return {
            page: blk.page,
            top: blk.top,
            left: blk.left,
            height: blk.height,
            width: blk.width,
          };
        });
        newHighlights[highlightId].blocks = newBlocks;
        newHighlights[highlightId].rects = rects;
        newHighlights[highlightId].section = blocks[newBlocks[0]]['section'];

        const segments = syncSegments[clipId];
        const newSegments = [];
        for (var i = 0; i < segments.length; i++) {
          const filteredTokenIds = segments[i].tokenIds.filter(word =>
            newBlocks?.includes(word.blockIdx)
          );
          if (filteredTokenIds.length > 0) {
            newSegments.push({ ...segments[i], tokenIds: filteredTokenIds });
          }
        }

        var newSyncSegments = { ...syncSegments };
        newSyncSegments[newHighlights[highlightId].clip] = newSegments;
        setSyncSegments(newSyncSegments);
      }
    }
  };

  const saveAnnotations = () => {
    if (saving) return;
    const data = { doi: doi, highlights: highlights, clips: clips, syncSegments: syncSegments };
    setSaving(true);
    fetch('/api/save_annotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => {
        return response.json();
      })
      .then(result => {
        if (result.message == 200) {
          setSaving(false);
        } else {
          alert('Error saving annotations');
          console.log(result.error);
          setSaving(false);
        }
      });
  };

  const removeSegment = (clipId: number, index: number) => {
    const newSyncSegments = { ...syncSegments };
    newSyncSegments[clipId].splice(index, 1);
    setSyncSegments(newSyncSegments);
  };

  const changeClipPosition = (clipId: number, highlightId: number) => {
    const newClips = { ...clips };
    newClips[clipId].position = newClips[clipId].highlights.indexOf(highlightId);
    setClips(newClips);
  };

  React.useEffect(() => {
    if (highlightMode || selectedMapping == null) return;
    if (selectedWords.tokenIds.length == 0 || selectedWords.captionIds.length == 0) {
      setSelectedWords({ tokenIds: [], captionIds: [], clipId: -1 });
      return;
    }
    const newSyncSegments = { ...syncSegments };
    newSyncSegments[selectedMapping].push({ ...selectedWords, clipId: selectedMapping });
    setSyncSegments(newSyncSegments);
    setSelectedWords({ tokenIds: [], captionIds: [], clipId: -1 });
  }, [highlightMode]);

  const changeClipNote = (note: string) => {
    if (selectedMapping == null) return;
    const newClips = { ...clips };
    newClips[selectedMapping].note = note;
    setClips(newClips);
  };

  const changeClipSupp = (supp: boolean) => {
    if (selectedMapping == null) return;
    const newClips = { ...clips };
    newClips[selectedMapping].supplementary = supp;
    setClips(newClips);
  };

  if (videoWidth == 0) {
    return <div>Loading...</div>;
  } else {
    return (
      <BrowserRouter>
        <Route path="/">
          <Header saveAnnotations={saveAnnotations} saving={saving} />
          <div
            className="reader__container"
            onKeyDown={(e: React.KeyboardEvent) => (e.key == 'Shift' ? setShiftDown(true) : null)}
            onKeyUp={(e: React.KeyboardEvent) => (e.key == 'Shift' ? setShiftDown(false) : null)}
            tabIndex={0}>
            <AuthorMappingControls
              clips={clips}
              selectedBlocks={selectedBlocks}
              selectedClip={selectedClip}
              selectedMapping={selectedMapping}
              createMapping={createMapping}
              removeMapping={removeMapping}
              modifyMode={modifyMode}
              setModifyMode={setModifyMode}
              highlightMode={highlightMode}
              setHighlightMode={setHighlightMode}
              changeClipNote={changeClipNote}
              changeClipSupp={changeClipSupp}
            />
            <DocumentWrapper
              className="reader__main"
              file={'/api/pdf/' + doi + '.pdf'}
              inputRef={pdfContentRef}>
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
                          highlightMode={highlightMode}
                          selectedWords={selectedWords}
                          setSelectedWords={setSelectedWords}
                          syncSegments={syncSegments}
                          hoveredSegment={hoveredSegment}
                          setHoveredSegment={setHoveredSegment}
                          removeSegment={removeSegment}
                          shiftDown={shiftDown}
                          changeClipPosition={changeClipPosition}
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
              highlightMode={highlightMode}
              selectedWords={selectedWords}
              setSelectedWords={setSelectedWords}
              syncSegments={syncSegments}
              hoveredSegment={hoveredSegment}
              setHoveredSegment={setHoveredSegment}
              removeSegment={removeSegment}
              shiftDown={shiftDown}
            />
          </div>
        </Route>
      </BrowserRouter>
    );
  }
};
