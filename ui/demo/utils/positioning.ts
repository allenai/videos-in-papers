import { Clip } from '../types/clips';

export function checkOverlap(clips: Array<Clip>) {
    var overlapping_groups: Array<Array<number>> = []
    var curr_group: Array<number> = []
    for(var i = 0; i < clips.length - 1; i++) {
        var curr_clip = clips[i];
        var next_clip = clips[i + 1]
        if(curr_clip.top+curr_clip.pageIndex + 0.3 > next_clip.top+next_clip.pageIndex &&
        curr_clip.top+curr_clip.pageIndex < next_clip.top+next_clip.pageIndex) {
        curr_group.push(i+1);
        if(!curr_group.includes(i)) {
            curr_group.unshift(i);
        }
        } else if (curr_group.length > 0) {
        overlapping_groups.push(curr_group);
        curr_group = []
        }
    }
    return overlapping_groups;
}

// spread out clips in page so they don't overlap
export function spreadOutClips(clips) {
    var sortedClips = JSON.parse(JSON.stringify(clips));
    sortedClips.sort((a, b) => a.pageIndex == b.pageIndex ? a.top - b.top : a.pageIndex - b.pageIndex);
    var overlaps = checkOverlap(sortedClips);
    while(overlaps.length > 0) {
        for(var i = 0; i < overlaps.length; i++) {
        var overlap_group = overlaps[i];
        var vectors = Array(overlap_group.length).fill(0);
        for(var j = 0; j < vectors.length; j++) {
            var clip = sortedClips[overlap_group[j]];
            var clip_pos = clip.top + clip.pageIndex;
            vectors[j] += (clip_pos) * vectors.length;
            for(var k = 0; k < vectors.length; k++) {
            vectors[k] -= clip_pos;
            }
        }
        for(var j = 0; j < vectors.length; j++) {
            sortedClips[overlap_group[j]].top += vectors[j] * 0.1;
            if(sortedClips[overlap_group[j]].top < 0 && sortedClips[overlap_group[j]].pageIndex == 0) {
            sortedClips[overlap_group[j]].top = 0;
            }
        }
        }
        overlaps = checkOverlap(sortedClips);
    }
    return sortedClips;
}