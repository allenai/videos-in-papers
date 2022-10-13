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
  rectIdx: number;
  position: number;
  isCurrent: boolean;
  isFocus: boolean;
  rects: Array<BoundingBoxType>;
};

type Props = {
  pageIndex: number;
  highlights: { [index: number]: Highlight };
  clips: { [index: number]: Clip };
  changeClipPosition: (id: number, rectIdx: number) => void;
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
      const bboxes = rects.map(rect => {
        const bbox = scaleRawBoundingBox(rect, pageDimensions.height, pageDimensions.width);
        return {
          ...bbox,
          page: rect.page,
        };
      });

      for (var j = 0; j < pages.length; j++) {
        const page = pages[j];
        let top = 1000000;
        let bottom = 0;
        let width = 0;
        let left = 1000000;
        let isLeft = null;
        let num_rects = 0;
        let rectIdx = 0;
        let skipped = 0;
        for (let k = 0; k < rects.length; k++) {
          if (rects[k].page !== page) {
            skipped++;
            continue;
          } else if (skipped > 0) {
            rectIdx = k;
            skipped = 0;
          }
          const bbox = bboxes[k];
          const currCenter = bbox.left + bbox.width / 2;
          const currIsLeft =
            currCenter <= pageDimensions.width / 2 ||
            (bbox.left < pageDimensions.width / 2 &&
              bbox.left + bbox.width > pageDimensions.width / 2);
          if (currIsLeft != isLeft || bbox.top > bottom + pageDimensions.height / 20) {
            var position = -1;
            if (scrubClip != null && scrubClip['highlight'] == id) {
              position = scrubClip['progress'];
            }
            sidebars.push({
              id: id,
              rectIdx: rectIdx,
              top,
              height: bottom - top,
              width,
              left,
              page,
              isCurrent: true, // clips[clipId].highlights[clips[clipId].position] == id,
              isFocus: focusId == clipId,
              position: position,
              rects: bboxes.slice(rectIdx, k),
            });
            rectIdx = k;
            top = bbox.top;
            bottom = bbox.height + bbox.top;
            left = bbox.left;
            width = bbox.width;
            isLeft = currIsLeft;
            num_rects = 1;
          } else {
            if (bbox.top < top) top = bbox.top;
            if (bbox.height + bbox.top > bottom) bottom = bbox.height + bbox.top;
            if (bbox.width > width) width = bbox.width;
            if (bbox.left < left) left = bbox.left;
            isLeft = currIsLeft;
            num_rects += 1;
          }
        }

        var position = -1;
        if (scrubClip != null && scrubClip['highlight'] == id) {
          position = scrubClip['progress'];
        }

        sidebars.push({
          id: id,
          rectIdx: rectIdx,
          top,
          height: bottom - top,
          width,
          left,
          page,
          isCurrent: true, //clips[clipId].highlights[clips[clipId].position] == id,
          isFocus: focusId == clipId,
          position: position,
          rects: bboxes.slice(rectIdx, rects.length),
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
    if (id != null) {
      var clipId = parseInt(id.split('-')[0]);
      var rectIdx = parseInt(id.split('-')[1]);
      changeClipPosition(clipId, rectIdx);
    }
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
          var props = {
            id: prop.id + '-' + prop.rectIdx,
            className: 'reader_sidebar_color-' + (highlights[prop.id].clip % 7),
            // Set isHighlighted to true for highlighted styling
            key: prop.id + '-' + j,
            onClick: onClickSidebar,
            onMouseMove: (e: React.MouseEvent) => onMoveInSidebar(e, prop.id, prop.isCurrent),
            onMouseOut: onMouseOutSidebar,
            top: prop.top,
            left: prop.left,
            width: prop.width,
            height: prop.height,
            page: prop.page,
            position: prop.position,
            isCurrent: prop.isCurrent,
            isFocus: prop.isFocus,
            rects: prop.rects,
          };

          boxes.push(<Sidebar {...props} />);
        }
      });
    });
    return boxes;
  }

  return <React.Fragment>{renderSidebars()}</React.Fragment>;
};
