import { Highlight, Clip } from '../types/clips';

const CHAR_WIDTH = 7;

// Approximate the height of the caption text
function getTextLineNum(text: string, videoWidth: number) {
    var num_lines = Math.ceil((text.length * CHAR_WIDTH) / (videoWidth - 24));
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

        if(curr_top < next_top && next_top < curr_bot) {
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

// Spread out clips in page so that they don't overlap
export function spreadOutClips(clips: {[index: number]: Clip}, focusId: number, videoWidth: number, scaledPageHeight: number) {
    var sortedClips = Object.values(clips);
    sortedClips.sort((a, b) => (a.page + a.top) - (b.page + b.top));

    // Approximate the height of each video clip
    var heights: {[id: number]: number} = {};
    for(var i = 0; i < sortedClips.length; i++) {
        var clip = sortedClips[i];
        var isFocus = clip.id == focusId;

        var adjustedVideoWidth = videoWidth * (isFocus ? 1 : 0.7);
        var videoHeight = adjustedVideoWidth / 16 * 9;
        var curr_spacing = videoHeight + 8 + 16 + (isFocus ? 36 : 0);  // timeline + border width + caption padding

        var caption_text = "Transcript   " + clip['captions'].map((c) => c['caption'].trim()).join(' ');
        var summary_text = "Summary   " + caption_text.split(".")[0];
        var num_lines = getTextLineNum(summary_text, adjustedVideoWidth) + (isFocus ? 1 : 0);
        if(isFocus && clip.expanded) {
            num_lines += getTextLineNum(caption_text, adjustedVideoWidth);
        }
        
        curr_spacing = curr_spacing + (num_lines * 22);

        if(isFocus && clip['highlights'].length > 1) {
            curr_spacing += 8 + 18;
            if(clip['alternatives']) {
                curr_spacing += Math.ceil(clip['highlights'].length / 2)*(8+33);
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
                clips[overlap_group[j]].top += vectors[j] * 0.1;
                if(clips[overlap_group[j]].top < 0 && clips[overlap_group[j]].page == 0) {
                    clips[overlap_group[j]].top = 0;
                }
            }
        }
        sortedClips = Object.values(clips);
        sortedClips.sort((a, b) => (a.page + a.top) - (b.page + b.top));
        overlaps = checkOverlap(sortedClips, heights);
    }
    return clips;
}

export function positionSingleClip(clip: Clip, clips: {[index: number]: Clip}, highlights: {[index: number]: Highlight}, videoWidth: number) {
    var highlightId = clip.highlights[clip.position];
    var highlight = highlights[highlightId];
    return {top: 0, left: 0};
}