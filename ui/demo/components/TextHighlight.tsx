import { BoundingBox, BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight } from '../types/clips';
import * as React from 'react';

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
    var results : Array<Array<BoundingBoxType>> = [];
    for(var i = 0; i < highlights.length; i++) {
      var rects = highlights[i].rects;
      var boundingBoxes : Array<BoundingBoxType> = [];
      for(var j = 0; j < rects.length; j++) {
        var bbox = scaleRawBoundingBox(rects[j], pageDimensions.height, pageDimensions.width);
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
            id: "" + highlights[i].id,
            className: 'reader_highlight_color-' + highlights[i].clip % 7,
            // Set isHighlighted to true for highlighted styling
            isHighlighted: true,
            key: i+"-"+j,
          };

          boxes.push(<BoundingBox {...props} />);
        }
      });
    });
    return boxes;
  }

  return <React.Fragment>{renderHighlightedBoundingBoxes()}</React.Fragment>;
};
