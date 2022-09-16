import {
  BoundingBoxType,
  DocumentContext,
  scaleRawBoundingBox,
  UiContext,
} from '@allenai/pdf-components';
import * as React from 'react';

import { Clip, Highlight } from '../types/clips';
import { Sidebar } from './Sidebar';

type Bar = BoundingBoxType & {
  id: number;
  position: number;
  isCurrent: boolean;
  isFocus: boolean;
};

type Props = {
  pageIndex: number;
  highlights: { [index: number]: Highlight };
  clips: { [index: number]: Clip };
  changeClipPosition: (id: number) => void;
  scrubClip: { highlight: number; clip: number; progress: number } | null;
  setScrubClip: (data: { highlight: number; clip: number; progress: number } | null) => void;
  playedHistory: Array<number>;
  focusId: number;
  setThumbnail: (data: { clipId: number; left: number; top: number } | null) => void;
};

/*
 * Overlaying sidebars on the margin of the paper
 */
export const SidebarOverlay: React.FunctionComponent<Props> = ({
  pageIndex,
  highlights,
  clips,
  changeClipPosition,
  scrubClip,
  setScrubClip,
  focusId,
  playedHistory,
  setThumbnail,
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);

  // Transform BoundingBoxes for highlights into Sidebar dimensions
  function getSidebarProps() {
    const results: Array<Array<Bar>> = [];
    for (let i = 0; i < Object.keys(highlights).length; i++) {
      const id = parseInt(Object.keys(highlights)[i]);
      const sidebars: Array<Bar> = [];
      const rects = highlights[id].rects;
      const pages: Array<number> = [];
      for (var j = 0; j < rects.length; j++) {
        if (pages.includes(rects[j].page)) continue;
        pages.push(rects[j].page);
      }

      const clipId = highlights[id].clip;

      for (var j = 0; j < pages.length; j++) {
        const page = pages[j];
        let top = 1000000;
        let bottom = 0;
        let width = 0;
        let left = 48;
        let totalCenters = 0;
        let num_rects = 0;
        for (let k = 0; k < rects.length; k++) {
          if (rects[k].page !== page) continue;
          const bbox = scaleRawBoundingBox(rects[k], pageDimensions.height, pageDimensions.width);
          const currCenter = bbox.left + bbox.width / 2;
          var avgCenter = totalCenters / num_rects;
          if (
            totalCenters != 0 &&
            (currCenter < avgCenter - bbox.width || avgCenter + bbox.width < currCenter)
          ) {
            if (avgCenter > pageDimensions.width / 2) {
              left = pageDimensions.width - left - 12;
            }
            var position = -1;
            if (scrubClip != null && scrubClip['highlight'] == id) {
              position = scrubClip['progress'];
            }
            sidebars.push({
              id: id,
              top,
              height: bottom - top,
              width,
              left,
              page,
              isCurrent: clips[clipId].highlights[clips[clipId].position] == id,
              isFocus: focusId == clipId,
              position: position,
            });
            top = bbox.top;
            bottom = bbox.height + bbox.top;
            left = 48;
            width = bbox.width;
            totalCenters = currCenter;
            num_rects = 1;
          } else {
            if (bbox.top < top) top = bbox.top;
            if (bbox.height + bbox.top > bottom) bottom = bbox.height + bbox.top;
            if (bbox.width > width) width = bbox.width;
            totalCenters += bbox.left + bbox.width / 2;
            num_rects += 1;
          }
        }
        var avgCenter = totalCenters / num_rects;
        if (avgCenter > pageDimensions.width / 2) {
          left = pageDimensions.width - left - 12;
        }

        var position = -1;
        if (scrubClip != null && scrubClip['highlight'] == id) {
          position = scrubClip['progress'];
        }

        sidebars.push({
          id: id,
          top,
          height: bottom - top,
          width,
          left,
          page,
          isCurrent: clips[clipId].highlights[clips[clipId].position] == id,
          isFocus: focusId == clipId,
          position: position,
        });
      }

      results.push(sidebars);
    }

    return results;
  }

  // Click sidebar to move clip to this position
  function onClickSidebar(e: React.MouseEvent) {
    e.stopPropagation();
    const id: string | null = e.currentTarget.getAttribute('id');
    changeClipPosition(id == null ? 0 : parseInt(id));
  }

  // Move in sidebar to scrub through video
  function onMoveInSidebar(e: React.MouseEvent, id: number, isCurrent: boolean) {
    const rect = e.currentTarget.getBoundingClientRect();
    let position = e.pageY - rect.top;
    if (position < 0) position = 0;
    setScrubClip({ highlight: id, clip: highlights[id].clip, progress: position / rect.height });

    if (!isCurrent) {
      setThumbnail({ clipId: highlights[id].clip, left: e.pageX, top: e.pageY });
    }
  }

  function onMouseOutSidebar() {
    setScrubClip(null);
    setThumbnail(null);
  }

  function renderSidebars(): Array<React.ReactElement> {
    const boxes: Array<React.ReactElement> = [];
    getSidebarProps().map((bars: Array<Bar>) => {
      // Only render this BoundingBox if it belongs on the current page
      bars.map((prop: Bar, j: number) => {
        if (prop.page === pageIndex) {
          const props = {
            ...prop,
            id: '' + prop.id,
            className: 'reader_sidebar_color-' + (highlights[prop.id].clip % 7),
            // Set isHighlighted to true for highlighted styling
            key: prop.id + '-' + j,
            onClick: onClickSidebar,
            onMouseMove: (e: React.MouseEvent) => onMoveInSidebar(e, prop.id, prop.isCurrent),
            onMouseOut: onMouseOutSidebar,
          };

          boxes.push(<Sidebar {...props} />);
        }
      });
    });
    return boxes;
  }

  return <React.Fragment>{renderSidebars()}</React.Fragment>;
};
