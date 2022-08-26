import { BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Sidebar } from './Sidebar';
import { Highlight } from '../types/clips';
import * as React from 'react';

type Props = {
  pageIndex: number;
  highlights: Array<Highlight>;
  changeClipPosition: (id: string) => void;
};

/*
 * Overlaying sidebars on the margin of the paper
 */
export const SidebarOverlay: React.FunctionComponent<Props> = ({ 
    pageIndex, 
    highlights,
    changeClipPosition
}: Props) => {
  const { isShowingTextHighlight } = React.useContext(UiContext);
  const { pageDimensions } = React.useContext(DocumentContext);

  if (!isShowingTextHighlight) {
    return null;
  }

  // transform BoundingBoxes for highlights into Sidebar dimensions
  function getSidebarProps() {
    var results : Array<Array<BoundingBoxType>> = [];
    for(var i = 0; i < highlights.length; i++) {
      var sidebars: Array<BoundingBoxType> = [];
      var rects = highlights[i].rects;
      var pages: Array<number> = []
      for(var j = 0; j < rects.length; j++) {
        if(pages.includes(rects[j].page)) continue;
        pages.push(rects[j].page);
      }

      for(var j = 0; j < pages.length; j++) {
        var page = pages[j];
        var top = 1000000;
        var bottom = 0;
        var left = 48;
        var width = 12;
        var totalCenters = 0;
        for(var k = 0; k < rects.length; k++) {
            if(rects[k].page !== page) continue;
            var bbox = scaleRawBoundingBox(rects[k], pageDimensions.height, pageDimensions.width);
            if(bbox.top < top) top = bbox.top;
            if(bbox.height+bbox.top > bottom) bottom = bbox.height + bbox.top;
            totalCenters += bbox.left + bbox.width/2;
        }
        var avgCenter = totalCenters / rects.length;
        if(avgCenter > pageDimensions.width/2) {
            left = pageDimensions.width - left - width;
        }
        sidebars.push({top, height: bottom - top, width, left, page});
      }

      results.push(sidebars);
    }

    return results;
  }

  function onClickHighlight (e: React.MouseEvent) {
    e.stopPropagation();
    var id = e.currentTarget.getAttribute('id');
    changeClipPosition(id);
  }

  function renderSidebars(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getSidebarProps().map((bars, i) => {
      // Only render this BoundingBox if it belongs on the current page
      bars.map((prop, j) => {
        if (prop.page === pageIndex) {
          const props = {
            ...prop,
            id: highlights[i].id,
            className: 'reader_highlight_color-' + parseInt(highlights[i].clip) % 7,
            // Set isHighlighted to true for highlighted styling
            isHighlighted: true,
            key: i+"-"+j,
            onClick: onClickHighlight,
          };

          boxes.push(<Sidebar {...props} />);
        }
      });
    });
    return boxes;
  }

  return <React.Fragment>{renderSidebars()}</React.Fragment>;
};
