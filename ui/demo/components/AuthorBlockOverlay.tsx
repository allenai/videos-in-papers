import {
  BoundingBox,
  BoundingBoxType,
  DocumentContext,
  scaleRawBoundingBox,
  UiContext,
} from '@allenai/pdf-components';
import * as React from 'react';

import { Block, Clip, Highlight, SyncWords, Token, Caption } from '../types/clips';
import { AuthorBlockLabel } from './AuthorBlockLabel';

type Props = {
  pageIndex: number;
  blocks: Array<Block>;
  selectedBlocks: Array<number>;
  setSelectedBlocks: (blocks: Array<number>) => void;
  highlights: { [id: number]: Highlight };
  changeHighlight: (clipId: number, block: Block | undefined, operation: number) => void;
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
  suggestedBlocks: Array<number>;
  setSuggestedBlocks: (blockIds: Array<number>) => void;
  currentSuggestion: number;
  setCurrentSuggestion: (index: number) => void;
  captionTokens?: Array<string>;
  logAction: (action: string, data: any) => void;
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
  removeCreatedBlocks,
  suggestedBlocks,
  setSuggestedBlocks,
  currentSuggestion,
  setCurrentSuggestion,
  captionTokens,
  logAction
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

      if (suggestedBlocks.includes(block.id)) {
        for (let j = 0; j < block.tokens.length; j++) {
          var token = block.tokens[j];
          if (token.page !== pageIndex) continue;
          if (captionTokens?.includes(token.text.toLowerCase())) {
            var rect = {
              page: token.page,
              top: token.top,
              left: token.left,
              height: token.height,
              width: token.width,
            };
            var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
            tokens.push({ ...token, ...bbox, segmentIndex: -1, clipId: -1 });
          }
        }
      } else {
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
    }

    return { bboxes: bboxes, tokens: tokens };
  }

  function handleClick(blockId: number) {
    if (highlightMode) return;
    var block = blocks.find(b => b.id == blockId);
    if (!modifyMode) {
      if (suggestedBlocks.length > 0 && suggestedBlocks.includes(blockId)) {
        var index = suggestedBlocks.indexOf(blockId);
        // if(index == currentSuggestion) {
        var newSuggestedBlocks = suggestedBlocks.filter(id => id != blockId);
        setSuggestedBlocks(newSuggestedBlocks);
        if (newSuggestedBlocks.length <= currentSuggestion) {
          setCurrentSuggestion(currentSuggestion - 1);
        }
        setSelectedBlocks([...selectedBlocks, blockId]);
        logAction('click_suggestion', { blockId: blockId});
        // } else {
        //   setCurrentSuggestion(index);
        // }
      } else if (selectedBlocks.includes(blockId)) {
        const copySelBlocks = [...selectedBlocks];
        const index = selectedBlocks.indexOf(blockId);
        copySelBlocks.splice(index, 1);
        setSelectedBlocks(copySelBlocks);
        logAction('remove_block', { blockId: blockId});
        console.log(blockId);
        if (block && block.created) {
          removeCreatedBlocks([blockId]);
        }
      } else {
        setSelectedBlocks([...selectedBlocks, blockId]);
        logAction('click_block', { blockId: blockId});
      }
      setSelectedMapping(null);
    } else if (modifyMode && selectedMapping != null) {
      changeHighlight(selectedMapping, block, 1);
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
      changeHighlight(
        selectedMapping,
        blocks.find(b => b.id == blockId),
        -1
      );
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
      const isSuggested = suggestedBlocks.includes(prop.id);

      const found = findInHighlights(prop.id);
      const clipId = found.clipId;
      const highlightId = found.highlightId;
      var className = 'reader_highlight_color-';
      if (selectedBlocks.includes(prop.id)) {
        className += 'sel';
      } else if (isSuggested) {
        if (currentSuggestion == suggestedBlocks.indexOf(prop.id)) {
          className += 'suggest-curr';
        } else {
          className += 'suggest';
        }
      } else {
        className += 'unsel';
      }

      let props = {
        top: prop.top,
        left: prop.left,
        height: prop.height,
        width: prop.width,
        page: prop.page,
        id: 'block-' + prop.id,
        className,
        // Set isHighlighted to true for highlighted styling
        isHighlighted: true,
        key: prop.id,
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
          key: prop.id,
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
            isHighlighted: true, //clips[clipId].highlights[clips[clipId].position] == highlightId,
            color: colors[clipId % 7],
            onClick: () => false && changeClipPosition(clipId, highlightId),
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
        id: 'token-' + tok.id,
        className:
          'reader_highlight_color_token-used ' +
          (isHovered ? 'reader_highlight_color_token-used-hovered' : ''),
        // Set isHighlighted to true for highlighted styling
        isHighlighted: false,
        key: 'used-' + tok.id,
        onMouseEnter: () =>
          tok.segmentIndex != -1 &&
          setHoveredSegment({ clipId: tok.clipId, index: tok.segmentIndex }),
        onMouseLeave: () => tok.segmentIndex != -1 && setHoveredSegment(null),
        onClick: () => tok.segmentIndex != -1 && removeSegment(tok.clipId, tok.segmentIndex),
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
              id: 'token-' + tok.id,
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
