import { BoundingBox, BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Block, Clip, Token, SyncWords } from '../types/clips';
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
};

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
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);

  React.useEffect(() => {
    if(selectedMapping == null) return;
    setSelectedBlocks([]);
  }, [selectedMapping]);

  function getBoundingBoxProps() {
    var segments = Object.values(syncSegments).reduce((prev, current) => prev.concat(current), []);
    var usedTokens = segments.map((seg) => seg.tokenIds.map(value => value.tokenIdx)).reduce((prev, current) => prev.concat(current), []);
    var bboxes: Array<Block> = [];
    var tokens: Array<Token> = [];
    for(var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if(block.page !== pageIndex) continue;
      var rect = {page: block.page, top: block.top, left: block.left, height: block.height, width: block.width};
      var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
      bboxes.push({...block, ...bbox});

      for(var j = 0; j < block.tokens.length; j++) {
        var token = block.tokens[j];
        if(token.page !== pageIndex) continue;
        var used = usedTokens.includes(token.id);
        if(used) {
          var rect = {page: token.page, top: token.top, left: token.left, height: token.height, width: token.width};
          var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
          tokens.push({...token, ...bbox});
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
        return -1;
    } else {
        return filteredHighlights[0].clip;
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
            // TODO: check if need to remove a sync segment?
        }
    }
  }

  function handleClickToken(blockId: number, tokenId: number) {
    var tokenIds = [...selectedWords.tokenIds];
    var selected = tokenIds.findIndex((value) => value.blockIdx == blockId && value.tokenIdx == tokenId);
    if(selected != -1) {
      tokenIds.splice(selected, 1);
      setSelectedWords({
        tokenIds: tokenIds,
        captionIds: selectedWords.captionIds
      });
    } else {
      setSelectedWords({
        tokenIds: [...selectedWords.tokenIds, {blockIdx: blockId, tokenIdx: tokenId}],
        captionIds: selectedWords.captionIds
      });
    }
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    var {bboxes, tokens} = getBoundingBoxProps();
    bboxes.map((prop, i) => {
      // Only render this BoundingBox if it belongs on the current page
        var clipId = findInHighlights(prop.id);
        
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
                onClick: () => handleClickMapped(clipId, prop.id)
            };
        }

        boxes.push(<BoundingBox {...props} />);
    });
    tokens.map((tok: Token, i: number) => {
      var props = {
          top: tok.top,
          left: tok.left,
          height: tok.height,
          width: tok.width,
          page: tok.page,
          id: "" + tok.id,
          className: 'reader_highlight_color_token-used',
          // Set isHighlighted to true for highlighted styling
          isHighlighted: false,
          key: 'used-' + tok.id
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
