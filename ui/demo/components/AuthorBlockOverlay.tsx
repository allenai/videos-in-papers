import { BoundingBox, BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Block, Clip, Token, SyncWords } from '../types/clips';
import { AuthorBlockLabel } from './AuthorBlockLabel';
import * as React from 'react';

type Props = {
  pageIndex: number;
  blocks: Array<Block>;
  selectedBlocks: Array<number>;
  setSelectedBlocks: (blocks: Array<number>) => void;
  highlights: {[id: number]: Highlight};
  changeHighlight: (id: number, blocks: Array<number>) => void;
  clips: {[id: number]: Clip};
  selectedMapping: number | null;
  setSelectedMapping: (clipId: number | null) => void;
  modifyMode: boolean;
  highlightMode: boolean;
  selectedWords: SyncWords;
  setSelectedWords: (words: SyncWords) => void;
  syncSegments: {[id: number]: Array<SyncWords>};
  hoveredSegment: {clipId: number, index: number} | null;
  setHoveredSegment: (segment: {clipId: number, index: number} | null) => void;
  removeSegment: (clipId: number, index: number) => void;
  shiftDown: boolean;
};

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
];

/*
 * Example of BoundingBoxes used as text highlights
 */
export const AuthorBlockOverlay: React.FunctionComponent<Props> = ({ 
    pageIndex, 
    blocks, 
    selectedBlocks,
    setSelectedBlocks,
    highlights,
    changeHighlight,
    clips,
    selectedMapping,
    setSelectedMapping,
    modifyMode,
    highlightMode,
    selectedWords,
    setSelectedWords,
    syncSegments,
    hoveredSegment,
    setHoveredSegment,
    removeSegment,
    shiftDown,
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);

  React.useEffect(() => {
    if(selectedMapping == null) return;
    setSelectedBlocks([]);
  }, [selectedMapping]);

  function getBoundingBoxProps() {
    var bboxes: Array<Block> = [];
    var tokens: Array<Token & {clipId: number, segmentIndex: number}> = [];
    for(var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if(block.page !== pageIndex) continue;
      var rect = {page: block.page, top: block.top, left: block.left, height: block.height, width: block.width};
      var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
      bboxes.push({...block, ...bbox});

      var clipId = Object.values(highlights).find(highlight => highlight.blocks?.includes(block.id))?.clip;

      if(clipId == null) continue; 

      for(var j = 0; j < block.tokens.length; j++) {
        var token = block.tokens[j];
        if(token.page !== pageIndex) continue;
        var segments = syncSegments[clipId];
        var index = segments.findIndex((segment) => segment.tokenIds.find((value) => value.blockIdx == block.id && value.tokenIdx == token.id) != null);
        if(index != -1) {
          var rect = {page: token.page, top: token.top, left: token.left, height: token.height, width: token.width};
          var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
          tokens.push({...token, ...bbox, segmentIndex: index, clipId: clipId});
        }
      }
    }

    return {bboxes: bboxes, tokens: tokens};
  }

  function handleClick(blockId: number) {
    if(highlightMode) return;
    if(!modifyMode) {
        if(selectedBlocks.includes(blockId)) {
            var copySelBlocks = [...selectedBlocks];
            var index = selectedBlocks.indexOf(blockId);
            copySelBlocks.splice(index, 1);
            setSelectedBlocks(copySelBlocks);
        } else {
            setSelectedBlocks([...selectedBlocks, blockId]);
        }
        setSelectedMapping(null);
    } else if(modifyMode && selectedMapping != null) {
        var highlightId = clips[selectedMapping].highlights[0];
        var blocks = highlights[highlightId].blocks;
        if(blocks)
            changeHighlight(highlightId, blocks.concat([blockId]));
    }
  }

  function findInHighlights(id: number) {
    var filteredHighlights = Object.values(highlights).filter((hl: Highlight) => hl.blocks?.includes(id));
    if(filteredHighlights.length == 0) {
        return {clipId: -1, highlightId: -1};
    } else {
        return {clipId: filteredHighlights[0].clip, highlightId: filteredHighlights[0].id};
    }
  }

  function handleClickMapped(clipId: number, blockId: number) {
    if(highlightMode) return;
    if(!modifyMode) {
        setSelectedMapping(clipId == selectedMapping ? null : clipId);
    } else if(modifyMode && selectedMapping != null) {
        var highlightId = clips[selectedMapping].highlights[0];
        var blocks = highlights[highlightId].blocks;
        if(blocks) {
            changeHighlight(highlightId, blocks.filter(id => id != blockId));
        }
    }
  }

  function handleClickToken(blockId: number, tokenId: number) {
    var tokenIds = [...selectedWords.tokenIds];
    var selected = tokenIds.findIndex((value) => value.blockIdx == blockId && value.tokenIdx == tokenId);
    if(selected != -1) {
      tokenIds.splice(selected, 1);
      setSelectedWords({
        ...selectedWords,
        tokenIds: tokenIds,
      });
    } else {
      if(shiftDown) {
        var closest = null;
        var closestDist = null;
        for(var i = 0; i < tokenIds.length; i++) {
          var token = tokenIds[i];
          if(token.blockIdx != blockId) continue;
          var dist = Math.abs(token.tokenIdx - tokenId);
          if(closest == null || closestDist == null || dist < closestDist) {
            closest = token;
            closestDist = dist;
          }
        }
        if(closest != null) {
          var start = Math.min(closest.tokenIdx, tokenId);
          var end = Math.max(closest.tokenIdx, tokenId);
          for(var i = start; i <= end; i++) {
            if(!tokenIds.find((value) => value.blockIdx == blockId && value.tokenIdx == i)) {
              tokenIds.push({blockIdx: blockId, tokenIdx: i});
            }
          }
        } else {
          tokenIds.push({blockIdx: blockId, tokenIdx: tokenId});
        }
        setSelectedWords({
          ...selectedWords,
          tokenIds: tokenIds,
        });
      } else {
        setSelectedWords({
          ...selectedWords,
          tokenIds: [...selectedWords.tokenIds, {blockIdx: blockId, tokenIdx: tokenId}],
        });
      }
    }
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    var {bboxes, tokens} = getBoundingBoxProps();
    bboxes.map((prop, i) => {
      // Only render this BoundingBox if it belongs on the current page
        var found = findInHighlights(prop.id);
        var clipId = found.clipId;
        var highlightId = found.highlightId;
        
        var props = {
            top: prop.top,
            left: prop.left,
            height: prop.height,
            width: prop.width,
            page: prop.page,
            id: "" + prop.id,
            className: 'reader_highlight_color-' + (selectedBlocks.includes(prop.id) ? "sel" : "unsel"),
            // Set isHighlighted to true for highlighted styling
            isHighlighted: true,
            key: i,
            onClick: () => handleClick(prop.id)
        };
        if(clipId != -1) {
            props = {
                top: prop.top,
                left: prop.left,
                height: prop.height,
                width: prop.width,
                page: prop.page,
                id: "" + prop.id,
                className: 'reader_highlight_color-mapped-' + clipId % 7 + (clipId == selectedMapping ? " reader_highlight_color-mapped-sel" : ""),
                // Set isHighlighted to true for highlighted styling
                isHighlighted: true,
                key: i,
                onClick: () => handleClickMapped(clipId, prop.id),
            };

            var inHighlightIdx = highlights[highlightId].blocks?.indexOf(prop.id);
            if(inHighlightIdx == 0) {
              var labelProp = {
                top: prop.top, 
                left: prop.left, 
                height: prop.height, 
                width: prop.width, 
                page: prop.page,
                id: ""+clipId,
                color: colors[clipId % 7],
              }
              boxes.push(<AuthorBlockLabel {...labelProp} />);
            }
        }

        boxes.push(<BoundingBox {...props} />);
    });
    tokens.map((tok: Token & {clipId: number, segmentIndex: number}, i: number) => {
      var isHovered = hoveredSegment != null && hoveredSegment.clipId == tok.clipId && hoveredSegment.index == tok.segmentIndex;
      var props = {
          top: tok.top,
          left: tok.left,
          height: tok.height,
          width: tok.width,
          page: tok.page,
          id: "" + tok.id,
          className: 'reader_highlight_color_token-used ' + (isHovered ? "reader_highlight_color_token-used-hovered" : ""),
          // Set isHighlighted to true for highlighted styling
          isHighlighted: false,
          key: 'used-' + tok.id,
          onMouseEnter: () => setHoveredSegment({clipId: tok.clipId, index: tok.segmentIndex}),
          onMouseLeave: () => setHoveredSegment(null),
          onClick: () => removeSegment(tok.clipId, tok.segmentIndex)
      };

      boxes.push(<BoundingBox {...props} />);
    })
    if(selectedMapping != null && highlightMode) {
      var selectedClip = clips[selectedMapping];
      var selectedHighlight = selectedClip['highlights'][selectedClip['position']];
      highlights[selectedHighlight].blocks?.map((blockId: number) => {
        var blk = blocks[blockId];
        if(blk.page !== pageIndex ) return;
        return blk.tokens.map((tok: Token, i: number) => {
          if (tok.page === pageIndex) {
            var rect = {top: tok.top, left: tok.left, height: tok.height, width: tok.width, page: tok.page};
            rect = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
            var selected = selectedWords.tokenIds.find((value) => value.blockIdx == blk.id && value.tokenIdx == tok.id);
            var props = {
                ...rect,
                id: "" + tok.id,
                className: 'reader_highlight_color_token' + (selected ? '-sel' : ''),
                // Set isHighlighted to true for highlighted styling
                isHighlighted: false,
                key: tok.id,
                onClick: () => handleClickToken(blk.id, tok.id)
            };

            boxes.push(<BoundingBox {...props} />);
          }
        });
      })
    }
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
