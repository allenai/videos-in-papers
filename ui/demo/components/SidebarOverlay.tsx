import { BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Sidebar } from './Sidebar';
import { Highlight } from '../types/clips';
import * as React from 'react';

type Bar = BoundingBoxType & {
  id: number;
}

type Props = {
  pageIndex: number;
  highlights: {[index: number]: Highlight};
  changeClipPosition: (id: number) => void;
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
    var results : Array<Array<Bar>> = [];
    for(var i = 0; i < Object.keys(highlights).length; i++) {
      var id = Object.keys(highlights)[i];
      var sidebars: Array<Bar> = [];
      var rects = highlights[id].rects;
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
        var num_rects = 0
        for(var k = 0; k < rects.length; k++) {
            if(rects[k].page !== page) continue;
            var bbox = scaleRawBoundingBox(rects[k], pageDimensions.height, pageDimensions.width);
            if(bbox.top < top) top = bbox.top;
            if(bbox.height+bbox.top > bottom) bottom = bbox.height + bbox.top;
            totalCenters += bbox.left + bbox.width/2;
            num_rects += 1
        }
        var avgCenter = totalCenters / num_rects;
        if(avgCenter > pageDimensions.width/2) {
            left = pageDimensions.width - left - width;
        }
        sidebars.push({id: id, top, height: bottom - top, width, left, page});
      }

      results.push(sidebars);
    }

    return results;
  }

  function onClickHighlight (e: React.MouseEvent) {
    e.stopPropagation();
    var id = parseInt(e.currentTarget.getAttribute('id'));
    changeClipPosition(id);
  }

  function renderSidebars(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getSidebarProps().map((bars) => {
      // Only render this BoundingBox if it belongs on the current page
      bars.map((prop, j) => {
        if (prop.page === pageIndex) {
          const props = {
            ...prop,
            id: prop.id,
            className: 'reader_highlight_color-' + parseInt(highlights[prop.id].clip) % 7,
            // Set isHighlighted to true for highlighted styling
            isHighlighted: true,
            key: prop.id+"-"+j,
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
