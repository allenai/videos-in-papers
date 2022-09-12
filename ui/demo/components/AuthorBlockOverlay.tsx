import { BoundingBox, BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Block, Clip } from '../types/clips';
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
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);

  React.useEffect(() => {
    if(selectedMapping == null) return;
    setSelectedBlocks([]);
  }, [selectedMapping]);

  function getBoundingBoxProps() {
    var results: Array<Block> = [];
    for(var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var rect = {page: block.page, top: block.top, left: block.left, height: block.height, width: block.width};
      var bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
      results.push({...bbox, id: block.id, index: block.index, type: block.type, section: block.section});
    }

    return results;
  }

  function handleClick(blockId: number) {
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
    if(!modifyMode) {
        setSelectedMapping(clipId == selectedMapping ? null : clipId);
    } else if(modifyMode && selectedMapping != null) {
        var highlightId = clips[selectedMapping].highlights[0];
        var blocks = highlights[highlightId].blocks;
        if(blocks)
            changeHighlight(highlightId, blocks.filter(id => id != blockId));
    }
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getBoundingBoxProps().map((prop, i) => {
      // Only render this BoundingBox if it belongs on the current page
        if (prop.page === pageIndex) {
            var clipId = findInHighlights(prop.id);
            
            var props = {
                ...prop,
                id: "" + prop.id,
                className: 'reader_highlight_color-' + (selectedBlocks.includes(prop.id) ? "sel" : "unsel"),
                // Set isHighlighted to true for highlighted styling
                isHighlighted: true,
                key: i,
                onClick: () => handleClick(prop.id)
            };
            if(clipId != -1) {
                props = {
                    ...prop,
                    id: "" + prop.id,
                    className: 'reader_highlight_color-mapped-' + clipId % 7 + (clipId == selectedMapping ? " reader_highlight_color-mapped-sel" : ""),
                    // Set isHighlighted to true for highlighted styling
                    isHighlighted: true,
                    key: i,
                    onClick: () => handleClickMapped(clipId, prop.id)
                };
            }

            boxes.push(<BoundingBox {...props} />);
        }
    });
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
