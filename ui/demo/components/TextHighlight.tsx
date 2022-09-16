import {
  BoundingBox,
  BoundingBoxType,
  DocumentContext,
  scaleRawBoundingBox,
  UiContext,
} from '@allenai/pdf-components';
import * as React from 'react';

import { Highlight } from '../types/clips';

type Props = {
  pageIndex: number;
  highlights: Array<Highlight>;
};

/*
 * Example of BoundingBoxes used as text highlights
 */
export const TextHighlight: React.FunctionComponent<Props> = ({ pageIndex, highlights }: Props) => {
  const { isShowingTextHighlight } = React.useContext(UiContext);
  const { pageDimensions } = React.useContext(DocumentContext);

  if (!isShowingTextHighlight) {
    return null;
  }

  function getBoundingBoxProps() {
    const results: Array<Array<BoundingBoxType>> = [];
    for (let i = 0; i < highlights.length; i++) {
      const rects = highlights[i].rects;
      const boundingBoxes: Array<BoundingBoxType> = [];
      for (let j = 0; j < rects.length; j++) {
        const bbox = scaleRawBoundingBox(rects[j], pageDimensions.height, pageDimensions.width);
        boundingBoxes.push(bbox);
      }
      results.push(boundingBoxes);
    }

    return results;
  }

  function renderHighlightedBoundingBoxes(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getBoundingBoxProps().map((rect, i) => {
      // Only render this BoundingBox if it belongs on the current page
      rect.map((prop, j) => {
        if (prop.page === pageIndex) {
          const props = {
            ...prop,
            id: '' + highlights[i].id,
            className: 'reader_highlight_color-' + (highlights[i].clip % 7),
            // Set isHighlighted to true for highlighted styling
            isHighlighted: true,
            key: i + '-' + j,
          };

          boxes.push(<BoundingBox {...props} />);
        }
      });
    });
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
