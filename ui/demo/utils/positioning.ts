import { scaleRawBoundingBox } from '@allenai/pdf-components';
import { Highlight, Clip } from '../types/clips';

const CHAR_WIDTH = 7;
const UNFOCUSED_SCALE = 0.8;
const BORDER_HEIGHT = 8;
const HIGHLIGHT_CHEVRON_SPACE = 18 + 8;
const CAPTION_VERTICAL_PADDING = 18;
const TIMELINE_SPACE = 36;
const CAPTION_HORIZONTAl_PADDING = 24;
const CAPTION_LINE_HEIGHT = 22;
const HIGHLIGHT_CONTAINER_SPACE = 8+33;

// Approximate the height of the caption text
function getTextLineNum(text: string, videoWidth: number) {
    var num_lines = Math.ceil((text.length * CHAR_WIDTH) / (videoWidth - CAPTION_HORIZONTAl_PADDING));
    return num_lines;
}

// Find all clips that are overlapping
export function checkOverlap(clips: Array<Clip>, heights: {[id: number]: number}) {
    var overlapping_groups: Array<Array<number>> = [];
    var curr_group: Array<number> = [];

    for(var i = 0; i < clips.length - 1; i++) {
        var curr_clip = clips[i];
    
        var next_clip = clips[i + 1]
        var curr_top = curr_clip.top+curr_clip.page;
        var curr_bot = curr_top + heights[curr_clip.id];
        var next_top = next_clip.top + next_clip.page;
        var next_bot = next_top + heights[next_clip.id];
        
        if(curr_top <= next_top && next_top <= curr_bot) {
            if(!curr_group.includes(curr_clip.id)) {
                curr_group.push(curr_clip.id);
            }
            curr_group.push(next_clip.id);
        } else if (next_top <= curr_top && curr_top <= next_bot) {
            if(!curr_group.includes(curr_clip.id)) {
                curr_group.push(curr_clip.id);
            }
            curr_group.push(next_clip.id);
        } else if (curr_group.length > 0) {
            overlapping_groups.push(curr_group);
            curr_group = []
        }
    }

    if(curr_group.length > 0) {
        overlapping_groups.push(curr_group);
    }

    return overlapping_groups;
}

function getOriginalPosition(clip: Clip, highlights: {[index: number]: Highlight}) {
    var highlightId = clip.highlights[clip.position];
    return highlights[highlightId].rects[0].page + highlights[highlightId].rects[0].top;
}

// Spread out clips in page so that they don't overlap
export function spreadOutClips(clips: {[index: number]: Clip}, highlights: {[index: number]: Highlight}, focusId: number, videoWidth: number, scaledPageHeight: number) {
    var sortedClips = Object.values(clips);
    sortedClips.sort((a, b) => getOriginalPosition(a, highlights) - getOriginalPosition(b, highlights));
    var originalOrder = sortedClips.map((c) => c.id);

    // Approximate the height of each video clip
    var heights: {[id: number]: number} = {};
    for(var i = 0; i < sortedClips.length; i++) {
        var clip = sortedClips[i];
        var isFocus = clip.id == focusId;

        var adjustedVideoWidth = videoWidth * (isFocus ? 1 : UNFOCUSED_SCALE);
        var videoHeight = adjustedVideoWidth / 16 * 9;
        var curr_spacing = videoHeight + BORDER_HEIGHT + CAPTION_VERTICAL_PADDING + (isFocus ? TIMELINE_SPACE : 0);  // timeline + border width + caption padding

        var caption_text = "Transcript   " + clip['captions'].map((c) => c['caption'].trim()).join(' ');
        var summary_text = "Summary   " + caption_text.split(".")[0];
        var num_lines = getTextLineNum(summary_text, adjustedVideoWidth) + (isFocus ? 1 : 0);
        if(isFocus && clip.expanded) {
            num_lines += getTextLineNum(caption_text, adjustedVideoWidth);
        }
        
        curr_spacing = curr_spacing + (num_lines * CAPTION_LINE_HEIGHT);

        if(isFocus && clip['highlights'].length > 1) {
            curr_spacing += HIGHLIGHT_CHEVRON_SPACE;
            if(clip['alternatives']) {
                curr_spacing += Math.ceil(clip['highlights'].length / 2) * (HIGHLIGHT_CONTAINER_SPACE);
            }
        }

        heights[clip.id] = curr_spacing / scaledPageHeight;
    }

    var overlaps = checkOverlap(sortedClips, heights);
    while(overlaps.length > 0) {
        for(var i = 0; i < overlaps.length; i++) {
            var overlap_group = overlaps[i];
            var positions = overlap_group.map((id) => clips[id].top + clips[id].page);

            // Adjust the position of overlapping clips by repeling from each other
            var repel_vector = positions.reduce((a, b) => a + b, 0);
            var vectors = positions.map((v) => v*positions.length - repel_vector);
            for(var j = 0; j < vectors.length; j++) {
                var clipId = overlap_group[j];
                if(clipId == focusId) {
                    continue;
                }
                var newTop = clips[clipId].top + vectors[j] * 0.05;
                var index = originalOrder.findIndex((id) => id == clipId);
                var prevClipPos = -1000000;
                var nextClipPos = 1000000;
                if(index != 0) {
                    var prevClip = originalOrder[index - 1];
                    prevClipPos = clips[prevClip].top + clips[prevClip].page;
                }
                if(index != sortedClips.length - 1) {
                    var nextClip = originalOrder[index + 1];
                    nextClipPos = clips[nextClip].top + clips[nextClip].page;
                }
                if(clips[clipId].page + newTop > prevClipPos && clips[clipId].page + newTop < nextClipPos) {
                    clips[clipId].top = newTop;
                } else if(clips[clipId].page + newTop <= prevClipPos) {
                    clips[clipId].top = prevClipPos - clips[clipId].page + 0.01;
                } else if(clips[clipId].page + newTop >= nextClipPos) {
                    clips[clipId].top = nextClipPos - clips[clipId].page - 0.01;
                }
                if(clips[clipId].top < 0 && clips[clipId].page == 0) {
                    clips[clipId].top = 0;
                }
            }
        }
        sortedClips = originalOrder.map((id) => clips[id]);
        overlaps = checkOverlap(sortedClips, heights);
    }
    return clips;
}

export function positionSingleClip(clip: Clip, highlights: {[index: number]: Highlight}, pageHeight: number, pageWidth: number) {
    var highlightId = clip.highlights[clip.position];
    var highlight = highlights[highlightId];
    var rects = highlight.rects;

    var finalBbox = rects[0];
    var page = finalBbox.page;
    var top = finalBbox.top;
    for(var k = 1; k < rects.length; k++) {
        var bbox = rects[k];
        
        if(page > bbox.page) {
            page = bbox.page;
            top = bbox.top;
            finalBbox = bbox;
        } else if(page == bbox.page && top > bbox.top) {
            top = bbox.top;
            finalBbox = bbox;
        }
    }

    if(finalBbox == null) {
        return {top: 0, left: 0, page: 0};
    }

    if(finalBbox.width < 0.5) {
        var left = finalBbox.left - 0.4 - 0.02
        if(finalBbox.left < 0.5) {
            left = finalBbox.left + finalBbox.width + 0.01;
        }
        return {top: top, left: left, page: finalBbox.page};
    } else {
        return {top: finalBbox.top + finalBbox.height, left: finalBbox.left + finalBbox.width / 2, page: finalBbox.page};
    }
}