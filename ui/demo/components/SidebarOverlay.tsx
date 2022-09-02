import { BoundingBoxType, UiContext, DocumentContext, scaleRawBoundingBox } from '@allenai/pdf-components';
import { Sidebar } from './Sidebar';
import { Highlight, Clip } from '../types/clips';
import * as React from 'react';

type Bar = BoundingBoxType & {
  id: number;
  isHighlighter: boolean;
}

type Props = {
  pageIndex: number;
  highlights: {[index: number]: Highlight};
  clips: {[index: number]: Clip};
  changeClipPosition: (id: number) => void;
  setScrubClip: (data: {highlight: number, clip: number, progress: number} | null) => void;
  playedHistory: Array<number>;
  focusId: number;
};

/*
 * Overlaying sidebars on the margin of the paper
 */
export const SidebarOverlay: React.FunctionComponent<Props> = ({ 
    pageIndex, 
    highlights,
    clips,
    changeClipPosition,
    setScrubClip,
    focusId,
    playedHistory,
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
        var width = 0
        var left = 48;
        var totalCenters = 0;
        var num_rects = 0
        for(var k = 0; k < rects.length; k++) {
            if(rects[k].page !== page) continue;
            var bbox = scaleRawBoundingBox(rects[k], pageDimensions.height, pageDimensions.width);
            var currCenter = bbox.left + bbox.width/2;
            var avgCenter = totalCenters / num_rects;
            if(totalCenters != 0 && (currCenter < avgCenter - bbox.width || avgCenter + bbox.width < currCenter)) {
              if(avgCenter > pageDimensions.width/2) {
                left = pageDimensions.width - left - 12;
              }
              sidebars.push({id: id, top, height: bottom - top, width, left, page});
              top = bbox.top;
              bottom = bbox.height + bbox.top;
              left = 48;
              width = bbox.width;
              totalCenters = currCenter;
              num_rects = 1;
            } else {
              if(bbox.top < top) top = bbox.top;
              if(bbox.height+bbox.top > bottom) bottom = bbox.height + bbox.top;
              if(bbox.width > width) width = bbox.width;
              totalCenters += bbox.left + bbox.width/2;
              num_rects += 1
            }
        }
        var avgCenter = totalCenters / num_rects;
        if(avgCenter > pageDimensions.width/2) {
            left = pageDimensions.width - left - 12;
        }

        var clipId = highlights[id].clip;
        sidebars.push({
          id: id, top, height: bottom - top, width, left, page, 
          isCurrent: clips[clipId].highlights[clips[clipId].position] == parseInt(id),
          isHighlighted: focusId == clipId
        });
      }

      results.push(sidebars);
    }

    return results;
  }

  // Click sidebar to move clip to this position
  function onClickSidebar (e: React.MouseEvent) {
    e.stopPropagation();
    var id: string = e.currentTarget.getAttribute('id')
    changeClipPosition(parseInt(id));
  }

  // Move in sidebar to scrub through video
  function onMoveInSidebar (e: React.MouseEvent) {
    var id: number = parseInt(e.currentTarget.getAttribute('id'));
    var rect = e.currentTarget.getBoundingClientRect();
    var position = e.pageY - rect.top;
    if(position < 0) position = 0;
    var progress = position / rect.height;
    setScrubClip({highlight: id, clip: parseInt(highlights[id].clip), progress: progress});
  }

  function onMouseOutSidebar () {
    setScrubClip(null);
  }

  function renderSidebars(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getSidebarProps().map((bars: Array<Bar>) => {
      // Only render this BoundingBox if it belongs on the current page
      bars.map((prop: Bar, j: number) => {
        if (prop.page === pageIndex) {
          const props = {
            ...prop,
            id: prop.id,
            className: 'reader_sidebar_color-' + parseInt(highlights[prop.id].clip) % 7,
            // Set isHighlighted to true for highlighted styling
            isHighlighted: prop.isHighlighted,
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
