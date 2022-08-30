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
  setScrubClip: (data: {clip: number, progress: number} | null) => void;
};

/*
 * Overlaying sidebars on the margin of the paper
 */
export const SidebarOverlay: React.FunctionComponent<Props> = ({ 
    pageIndex, 
    highlights,
    changeClipPosition,
    setScrubClip
}: Props) => {
  const { isShowingTextHighlight } = React.useContext(UiContext);
  const { pageDimensions } = React.useContext(DocumentContext);

  if (!isShowingTextHighlight) {
    return null;
  }

  // Transform BoundingBoxes for highlights into Sidebar dimensions
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

  // Click sidebar to move clip to this position
  function onClickSidebar (e: React.MouseEvent) {
    e.stopPropagation();
    var id = parseInt(e.currentTarget.getAttribute('id'));
    changeClipPosition(id);
  }

  // Move in sidebar to scrub through video
  function onMoveInSidebar (e: React.MouseEvent) {
    var id = e.currentTarget.getAttribute('id');
    var rect = e.currentTarget.getBoundingClientRect();
    var position = e.pageY - rect.top;
    if(position < 0) position = 0;
    var progress = position / rect.height;
    setScrubClip({clip: parseInt(highlights[id].clip), progress: progress});
  }

  function onMouseOutSidebar () {
    setScrubClip(null);
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
            onClick: onClickSidebar,
            onMouseMove: onMoveInSidebar,
            onMouseOut: onMouseOutSidebar
          };

          boxes.push(<Sidebar {...props} />);
        }
      });
    });
    return boxes;
  }

  return <React.Fragment>{renderSidebars()}</React.Fragment>;
};
