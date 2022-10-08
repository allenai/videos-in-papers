import { Clip, Highlight } from '../types/clips';

const CHAR_WIDTH = 14;
const UNFOCUSED_SCALE = 0.8;
const BORDER_HEIGHT = 8;
const HIGHLIGHT_CHEVRON_SPACE = 18 + 8;
const CAPTION_VERTICAL_PADDING = 18;
const TIMELINE_SPACE = 36;
const CAPTION_HORIZONTAl_PADDING = 24;
const CAPTION_LINE_HEIGHT = 22;
const HIGHLIGHT_CONTAINER_SPACE = 8 + 33;

// Approximate the height of the caption text
function getTextLineNum(text: string, videoWidth: number) {
  const num_lines = Math.ceil(
    (text.length * CHAR_WIDTH) / (videoWidth - CAPTION_HORIZONTAl_PADDING)
  );
  return num_lines;
}

// Find all clips that are overlapping
export function checkOverlap(clips: Array<Clip>, heights: { [id: number]: number }) {
  const overlapping_groups: Array<Array<number>> = [];
  let curr_group: Array<number> = [];

  for (let i = 0; i < clips.length - 1; i++) {
    const curr_clip = clips[i];

    const next_clip = clips[i + 1];
    const curr_top = curr_clip.top + curr_clip.page;
    const curr_bot = curr_top + heights[curr_clip.id];
    const next_top = next_clip.top + next_clip.page;
    const next_bot = next_top + heights[next_clip.id];

    if (curr_top <= next_top && next_top <= curr_bot) {
      if (!curr_group.includes(curr_clip.id)) {
        curr_group.push(curr_clip.id);
      }
      curr_group.push(next_clip.id);
    } else if (curr_top >= next_top) {
      if (!curr_group.includes(curr_clip.id)) {
        curr_group.push(curr_clip.id);
      }
      curr_group.push(next_clip.id);
    } else if (curr_group.length > 0) {
      overlapping_groups.push(curr_group);
      curr_group = [];
    }
  }

  if (curr_group.length > 0) {
    overlapping_groups.push(curr_group);
  }

  return overlapping_groups;
}

function getOriginalPosition(clip: Clip, highlights: { [index: number]: Highlight }) {
  const highlightId = clip.highlights[clip.position];
  return highlights[highlightId].rects[0];
}

// Spread out clips in page so that they don't overlap
export function spreadOutClips(
  clips: { [index: number]: Clip },
  highlights: { [index: number]: Highlight },
  focusId: number,
  videoWidth: number,
  scaledPageHeight: number
) {
  let sortedClips = Object.values(clips);
  sortedClips.sort((a, b) => {
      var aRect = getOriginalPosition(a, highlights);
      var bRect = getOriginalPosition(b, highlights);
      var aIsRight = !(aRect.left < 0.5 && aRect.left + aRect.width > 0.5) && (aRect.left + aRect.width/2 > 0.5);
      var bIsRight = !(bRect.left < 0.5 && bRect.left + bRect.width > 0.5) && (bRect.left + bRect.width/2 > 0.5);
      if(aRect.page !== bRect.page) {
        return aRect.page - bRect.page;
      } else {
        if(!aIsRight && bIsRight) {
          return -1;
        } else if(aIsRight && !bIsRight) {
          return 1;
        } else {
          return aRect.top - bRect.top;
        }
      }
    }
  );
  const originalOrder = sortedClips.map(c => c.id);

  // Approximate the height of each video clip
  const heights: { [id: number]: number } = {};
  for (var i = 0; i < sortedClips.length; i++) {
    const clip = sortedClips[i];
    const isFocus = clip.id == focusId;

    const adjustedVideoWidth = videoWidth * (isFocus ? 1 : UNFOCUSED_SCALE);
    const videoHeight = (adjustedVideoWidth / 16) * 9;
    let curr_spacing =
      videoHeight + BORDER_HEIGHT + CAPTION_VERTICAL_PADDING + (isFocus ? TIMELINE_SPACE : 0); // timeline + border width + caption padding

    const caption_text = 'Transcript   ' + clip['captions'].map(c => c['caption'].trim()).join(' ');
    const summary_text = caption_text.split('.')[0];
    let num_lines = getTextLineNum(summary_text, adjustedVideoWidth);
    if (isFocus) {
      num_lines = getTextLineNum(caption_text, adjustedVideoWidth);
    }

    curr_spacing = curr_spacing + num_lines * CAPTION_LINE_HEIGHT;

    if (isFocus && clip['highlights'].length > 1) {
      curr_spacing += HIGHLIGHT_CHEVRON_SPACE;
      if (clip['alternatives']) {
        curr_spacing += Math.ceil(clip['highlights'].length / 2) * HIGHLIGHT_CONTAINER_SPACE;
      }
    }

    heights[clip.id] = curr_spacing / scaledPageHeight;
  }

  var num_loops = 0;
  let overlaps = checkOverlap(sortedClips, heights);
  while (overlaps.length > 0) {
    for (var i = 0; i < overlaps.length; i++) {
      const overlap_group = overlaps[i];
      var positions = overlap_group.map(id => clips[id].top + clips[id].page);

      // Adjust the position of overlapping clips by repeling from each other
      var repel_vector = positions.reduce((a, b) => a + b, 0);
      const vectors = positions.map(v => v * positions.length - repel_vector);
      for (let j = 0; j < vectors.length; j++) {
        var clipId = overlap_group[j];
        if (clipId == focusId && num_loops < 300) {
          continue;
        }
        const newTop = clips[clipId].top + vectors[j] * 0.05;
        const index = originalOrder.findIndex(id => id == clipId);
        let prevClipPos = -1000000;
        let nextClipPos = 1000000;
        if (index != 0) {
          const prevClip = originalOrder[index - 1];
          prevClipPos = clips[prevClip].top + clips[prevClip].page;
        }
        if (index != sortedClips.length - 1) {
          const nextClip = originalOrder[index + 1];
          nextClipPos = clips[nextClip].top + clips[nextClip].page;
        }
        if (
          clips[clipId].page + newTop > prevClipPos &&
          clips[clipId].page + newTop < nextClipPos
        ) {
          clips[clipId].top = newTop;
        } else if (clips[clipId].page + newTop <= prevClipPos) {
          clips[clipId].top = prevClipPos - clips[clipId].page + 0.02;
        } else if (clips[clipId].page + newTop >= nextClipPos) {
          clips[clipId].top = nextClipPos - clips[clipId].page - 0.02;
        }
        if (clips[clipId].top < 0 && clips[clipId].page == 0) {
          clips[clipId].top = 0;
        }
      }
      num_loops += 1;
    }
    sortedClips = originalOrder.map(id => clips[id]);
    overlaps = checkOverlap(sortedClips, heights);
  }
  return clips;
}

export function positionSingleClip(
  clip: Clip,
  highlights: { [index: number]: Highlight },
  videoWidth: number,
) {
  const highlightId = clip.highlights[clip.position];
  const highlight = highlights[highlightId];
  const rects = highlight.rects;

  let finalBbox = rects[0];
  let page = finalBbox.page;
  let top = finalBbox.top;
  let height = finalBbox.height;
  for (let k = 1; k < rects.length; k++) {
    const bbox = rects[k];

    if (page > bbox.page) {
      page = bbox.page;
      top = bbox.top;
      finalBbox = bbox;
      height = bbox.height;
    } else if (page == bbox.page && top > bbox.top) {
      top = bbox.top;
      finalBbox = bbox;
      height += bbox.height;
    }
  }

  if (finalBbox == null) {
    return { top: 0, left: 0, page: 0 };
  }

  if (finalBbox.left < 0.5 && finalBbox.left + finalBbox.width > 0.5) {
    return {
      top: finalBbox.top + height + 0.02,
      left: 0.5 - videoWidth / 2,
      page: finalBbox.page,
    };
  } else {
    let left = finalBbox.left - 0.4 - 0.02;
    if (finalBbox.left < 0.5) {
      left = 0.51;
    }
    return { top: top, left: left, page: finalBbox.page };
  }
}
