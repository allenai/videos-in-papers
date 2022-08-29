import { Clip } from '../types/clips';

export function checkOverlap(clips: Array<Clip>) {
    var overlapping_groups: Array<Array<number>> = []
    var curr_group: Array<number> = []
    for(var i = 0; i < clips.length - 1; i++) {
        var curr_clip = clips[i];
        var next_clip = clips[i + 1]
        if(curr_clip.top+curr_clip.page + 0.3 > next_clip.top+next_clip.page &&
            curr_clip.top+curr_clip.page < next_clip.top+next_clip.page) {
            curr_group.push(clips[i+1].id);
            if(!curr_group.includes(i)) {
                curr_group.unshift(clips[i].id);
            }
        } else if (curr_group.length > 0) {
            overlapping_groups.push(curr_group);
            curr_group = []
        }
    }
    return overlapping_groups;
}

// spread out clips in page so they don't overlap
export function spreadOutClips(clips: {[index: number]: ProcessedClip}) {
    var sortedClips = Object.values(clips);
    sortedClips.sort((a, b) => a.page == b.page ? a.top - b.top : a.page - b.page);
    var overlaps = checkOverlap(sortedClips);
    while(overlaps.length > 0) {
        for(var i = 0; i < overlaps.length; i++) {
            var overlap_group = overlaps[i];
            var vectors = Array(overlap_group.length).fill(0);
            for(var j = 0; j < vectors.length; j++) {
                var clip = clips[overlap_group[j]];
                var clip_pos = clip.top + clip.page;
                vectors[j] += (clip_pos) * vectors.length;
                for(var k = 0; k < vectors.length; k++) {
                    vectors[k] -= clip_pos;
                }
            }
            for(var j = 0; j < vectors.length; j++) {
                clips[overlap_group[j]].top += vectors[j] * 0.1;
                if(clips[overlap_group[j]].top < 0 && clips[overlap_group[j]].page == 0) {
                    clips[overlap_group[j]].top = 0;
                }
            }
        }
        sortedClips = Object.values(clips);
        sortedClips.sort((a, b) => a.page == b.page ? a.top - b.top : a.page - b.page);
        overlaps = checkOverlap(sortedClips);
    }
    return clips;
}