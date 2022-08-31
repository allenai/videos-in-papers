import { Clip } from '../types/clips';

const VIDEO_HEIGHT = 0.25;
const CHAR_WIDTH = 6;

// Approximate the height of the caption text
function getTextHeight(text: string, pageHeight: number, scale: number) {
    var VIDEO_WIDTH = pageHeight * VIDEO_HEIGHT / 9 * 16;
    var num_lines = Math.ceil((text.length * CHAR_WIDTH) / (VIDEO_WIDTH - 44));
    if(num_lines > 3)
        return num_lines*19 / pageHeight;
    else
        return 3*19 / pageHeight;
}

// Find all clips that are overlapping
export function checkOverlap(clips: Array<Clip>, captionHeights: {[id: number]: number}) {
    var overlapping_groups: Array<Array<number>> = [];
    var curr_group: Array<number> = [];

    for(var i = 0; i < clips.length - 1; i++) {
        var curr_clip = clips[i];
    
        var next_clip = clips[i + 1]
        var curr_top = curr_clip.top+curr_clip.page;
        var curr_bot = curr_top + captionHeights[curr_clip.id];
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
export function spreadOutClips(clips: {[index: number]: Clip}, pageHeight: number, scale: number) {
    var sortedClips = Object.values(clips);
    sortedClips.sort((a, b) => (a.page + a.top) - (b.page + b.top));

    // Approximate the height of each video clip
    var base_spacing = VIDEO_HEIGHT + (36 + 8 + 16) / pageHeight;  // timeline + border width + caption padding
    var captionHeights: {[id: number]: number} = {};
    for(var i = 0; i < sortedClips.length; i++) {
        var clip = sortedClips[i];
        var caption_text = clip['captions'].map((c) => c['caption'].trim()).join(' ');
        if(!clip.expanded)
            caption_text = caption_text.split(".")[0];
        var curr_spacing = base_spacing + getTextHeight(caption_text, pageHeight, scale);
        captionHeights[clip.id] = curr_spacing;
    }

    var overlaps = checkOverlap(sortedClips, captionHeights);
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
        overlaps = checkOverlap(sortedClips, captionHeights);
    }
    return clips;
}