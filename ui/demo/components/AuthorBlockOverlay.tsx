import {
  BoundingBox,
  BoundingBoxType,
  DocumentContext,
  scaleRawBoundingBox,
  UiContext,
} from '@allenai/pdf-components';
import * as React from 'react';

import { Block, Clip, Highlight, SyncWords, Token } from '../types/clips';
import { AuthorBlockLabel } from './AuthorBlockLabel';

type Props = {
  pageIndex: number;
  blocks: Array<Block>;
  selectedBlocks: Array<number>;
  setSelectedBlocks: (blocks: Array<number>) => void;
  highlights: { [id: number]: Highlight };
  changeHighlight: (clipId: number, block: Block, operation: number) => void;
  clips: { [id: number]: Clip };
  selectedMapping: number | null;
  setSelectedMapping: (clipId: number | null) => void;
  modifyMode: boolean;
  highlightMode: boolean;
  selectedWords: SyncWords;
  setSelectedWords: (words: SyncWords) => void;
  syncSegments: { [id: number]: Array<SyncWords> };
  hoveredSegment: { clipId: number; index: number } | null;
  setHoveredSegment: (segment: { clipId: number; index: number } | null) => void;
  removeSegment: (clipId: number, index: number) => void;
  shiftDown: boolean;
  changeClipPosition: (clipId: number, highlightId: number) => void;
  removeCreatedBlocks: (blockIds: Array<number>) => void;
};

const colors = ['#cb725e', '#d9a460', '#3e9d29', '#306ed3', '#07cead', '#9d58e1', '#dd59ba'];

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
  changeClipPosition,
  removeCreatedBlocks
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);

  React.useEffect(() => {
    if (selectedMapping == null) return;
    removeCreatedBlocks(selectedBlocks);
    setSelectedBlocks([]);
  }, [selectedMapping]);

  function getBoundingBoxProps() {
    const bboxes: Array<Block> = [];
    const tokens: Array<Token & { clipId: number; segmentIndex: number }> = [];
    for (let i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (block.page !== pageIndex) continue;
      var rect = {
        page: block.page,
        top: block.top,
        left: block.left,
        height: block.height,
        width: block.width,
      };
      var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
      bboxes.push({ ...block, ...bbox });

      const clipId = Object.values(highlights).find(highlight =>
        highlight.blocks?.includes(block.id)
      )?.clip;

      if (clipId == null) continue;

      for (let j = 0; j < block.tokens.length; j++) {
        var token = block.tokens[j];
        if (token.page !== pageIndex) continue;
        const segments = syncSegments[clipId];
        const index = segments.findIndex(
          segment =>
            segment.tokenIds.find(
              value => value.blockIdx == block.id && value.tokenIdx == token.id
            ) != null
        );
        if (index != -1) {
          var rect = {
            page: token.page,
            top: token.top,
            left: token.left,
            height: token.height,
            width: token.width,
          };
          var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
          tokens.push({ ...token, ...bbox, segmentIndex: index, clipId: clipId });
        }
      }
    }

    return { bboxes: bboxes, tokens: tokens };
  }

  function handleClick(blockId: number) {
    if (highlightMode) return;
    if (!modifyMode) {
      if (selectedBlocks.includes(blockId)) {
        const copySelBlocks = [...selectedBlocks];
        const index = selectedBlocks.indexOf(blockId);
        console.log(selectedBlocks, blockId, index);
        copySelBlocks.splice(index, 1);
        setSelectedBlocks(copySelBlocks);
        if(blocks[blockId].created)
          removeCreatedBlocks([blockId]);
      } else {
        setSelectedBlocks([...selectedBlocks, blockId]);
      }
      setSelectedMapping(null);
    } else if (modifyMode && selectedMapping != null) {
      changeHighlight(selectedMapping, blocks[blockId], 1);
    }
  }

  function findInHighlights(id: number) {
    const filteredHighlights = Object.values(highlights).filter((hl: Highlight) =>
      hl.blocks?.includes(id)
    );
    if (filteredHighlights.length == 0) {
      return { clipId: -1, highlightId: -1 };
    } else {
      return { clipId: filteredHighlights[0].clip, highlightId: filteredHighlights[0].id };
    }
  }

  function handleClickMapped(clipId: number, blockId: number) {
    if (highlightMode) return;
    if (!modifyMode) {
      setSelectedMapping(clipId == selectedMapping ? null : clipId);
    } else if (modifyMode && selectedMapping != null) {
      changeHighlight(selectedMapping, blocks[blockId], -1);
    }
  }

  function handleClickToken(blockId: number, tokenId: number) {
    const tokenIds = [...selectedWords.tokenIds];
    const selected = tokenIds.findIndex(
      value => value.blockIdx == blockId && value.tokenIdx == tokenId
    );
    if (selected != -1) {
      tokenIds.splice(selected, 1);
      setSelectedWords({
        ...selectedWords,
        tokenIds: tokenIds,
      });
    } else {
      if (shiftDown) {
        let closest = null;
        let closestDist = null;
        for (var i = 0; i < tokenIds.length; i++) {
          const token = tokenIds[i];
          if (token.blockIdx != blockId) continue;
          const dist = Math.abs(token.tokenIdx - tokenId);
          if (closest == null || closestDist == null || dist < closestDist) {
            closest = token;
            closestDist = dist;
          }
        }
        if (closest != null) {
          const start = Math.min(closest.tokenIdx, tokenId);
          const end = Math.max(closest.tokenIdx, tokenId);
          for (var i = start; i <= end; i++) {
            if (!tokenIds.find(value => value.blockIdx == blockId && value.tokenIdx == i)) {
              tokenIds.push({ blockIdx: blockId, tokenIdx: i });
            }
          }
        } else {
          tokenIds.push({ blockIdx: blockId, tokenIdx: tokenId });
        }
        setSelectedWords({
          ...selectedWords,
          tokenIds: tokenIds,
        });
      } else {
        setSelectedWords({
          ...selectedWords,
          tokenIds: [...selectedWords.tokenIds, { blockIdx: blockId, tokenIdx: tokenId }],
        });
      }
    }
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    const { bboxes, tokens } = getBoundingBoxProps();
    bboxes.map((prop, i) => {
      // Only render this BoundingBox if it belongs on the current page
      const found = findInHighlights(prop.id);
      const clipId = found.clipId;
      const highlightId = found.highlightId;

      let props = {
        top: prop.top,
        left: prop.left,
        height: prop.height,
        width: prop.width,
        page: prop.page,
        id: '' + prop.id,
        className: 'reader_highlight_color-' + (selectedBlocks.includes(prop.id) ? 'sel' : 'unsel'),
        // Set isHighlighted to true for highlighted styling
        isHighlighted: true,
        key: i,
        onClick: () => handleClick(prop.id),
      };
      if (clipId != -1) {
        props = {
          top: prop.top,
          left: prop.left,
          height: prop.height,
          width: prop.width,
          page: prop.page,
          id: '' + prop.id,
          className:
            'reader_highlight_color-mapped-' +
            (clipId % 7) +
            (clipId == selectedMapping ? ' reader_highlight_color-mapped-sel' : ''),
          // Set isHighlighted to true for highlighted styling
          isHighlighted: true,
          key: i,
          onClick: () => handleClickMapped(clipId, prop.id),
        };

        const inHighlightIdx = highlights[highlightId].blocks?.indexOf(prop.id);
        if (inHighlightIdx == 0) {
          const labelProp = {
            top: prop.top,
            left: prop.left,
            height: prop.height,
            width: prop.width,
            page: prop.page,
            key: clipId + '-' + prop.id,
            id: '' + clipId,
            isHighlighted: clips[clipId].highlights[clips[clipId].position] == highlightId,
            color: colors[clipId % 7],
            onClick: () => changeClipPosition(clipId, highlightId),
          };
          boxes.push(<AuthorBlockLabel {...labelProp} />);
        }
      }

      boxes.push(<BoundingBox {...props} />);
    });
    tokens.map((tok: Token & { clipId: number; segmentIndex: number }, i: number) => {
      const isHovered =
        hoveredSegment != null &&
        hoveredSegment.clipId == tok.clipId &&
        hoveredSegment.index == tok.segmentIndex;
      const props = {
        top: tok.top,
        left: tok.left,
        height: tok.height,
        width: tok.width,
        page: tok.page,
        id: '' + tok.id,
        className:
          'reader_highlight_color_token-used ' +
          (isHovered ? 'reader_highlight_color_token-used-hovered' : ''),
        // Set isHighlighted to true for highlighted styling
        isHighlighted: false,
        key: 'used-' + tok.id,
        onMouseEnter: () => setHoveredSegment({ clipId: tok.clipId, index: tok.segmentIndex }),
        onMouseLeave: () => setHoveredSegment(null),
        onClick: () => removeSegment(tok.clipId, tok.segmentIndex),
      };

      boxes.push(<BoundingBox {...props} />);
    });
    if (selectedMapping != null && highlightMode) {
      const selectedClip = clips[selectedMapping];
      const selectedHighlight = selectedClip['highlights'][selectedClip['position']];
      highlights[selectedHighlight].blocks?.map((blockId: number) => {
        const blk = blocks[blockId];
        if (blk.page !== pageIndex) return;
        return blk.tokens.map((tok: Token, i: number) => {
          if (tok.page === pageIndex) {
            let rect = {
              top: tok.top,
              left: tok.left,
              height: tok.height,
              width: tok.width,
              page: tok.page,
            };
            rect = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
            const selected = selectedWords.tokenIds.find(
              value => value.blockIdx == blk.id && value.tokenIdx == tok.id
            );
            const props = {
              ...rect,
              id: '' + tok.id,
              className: 'reader_highlight_color_token' + (selected ? '-sel' : ''),
              // Set isHighlighted to true for highlighted styling
              isHighlighted: false,
              key: tok.id,
              onClick: () => handleClickToken(blk.id, tok.id),
            };

            boxes.push(<BoundingBox {...props} />);
          }
        });
      });
    }
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
