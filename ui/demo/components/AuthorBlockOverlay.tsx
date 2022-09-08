import { BoundingBox, BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Block } from '../types/clips';
import * as React from 'react';

type Props = {
  pageIndex: number;
  blocks: Array<Block>;
  selectedBlocks: Array<number>;
  setSelectedBlocks: (blocks: Array<number>) => void;
  highlights: {[id: number]: Highlight};
};

/*
 * Example of BoundingBoxes used as text highlights
 */
export const AuthorBlockOverlay: React.FunctionComponent<Props> = ({ 
    pageIndex, 
    blocks, 
    selectedBlocks,
    setSelectedBlocks,
    highlights 
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);

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

  function handleClick(id: number) {
    if(selectedBlocks.includes(id)) {
        var copySelBlocks = [...selectedBlocks];
        var index = selectedBlocks.indexOf(id);
        copySelBlocks.splice(index, 1);
        setSelectedBlocks(copySelBlocks);
    } else {
        setSelectedBlocks([...selectedBlocks, id]);
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
                    className: 'reader_highlight_color-' + clipId % 7,
                    // Set isHighlighted to true for highlighted styling
                    isHighlighted: true,
                    key: i,
                    onClick: () => console.log("mapped")
                };
            }

            boxes.push(<BoundingBox {...props} />);
        }
    });
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
