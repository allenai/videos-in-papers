import * as React from 'react';
import {
  DocumentContext,
} from '@allenai/pdf-components';
import { Highlight, Clip } from '../types/clips';
import { rename } from 'fs';
import { render } from 'react-dom';

interface Props {
  duration: number;
  width: number;
  clips: {[id: number]: Clip};
  selectedClip: Array<number>;
}

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

export function AuthorTimeline({
    duration,
    width,
    clips,
    selectedClip
}: Props) {
  const [ratio, setRatio] = React.useState(0);
  const [hovered, setHovered] = React.useState(-1);
  const [clipList, setClipList] = React.useState<Array<Clip>>([]);

  React.useEffect(() => {
    setRatio(width / duration);
  }, [width, duration]);

  React.useEffect(() => {
    var tempClipList = Object.keys(clips).map((id: string) => clips[parseInt(id)]);
    tempClipList.sort((a: Clip, b: Clip) => a.start - b.start);
    setClipList(tempClipList);
  }, [clips]);

  const renderTimelineSegment = (idx: number, id: number, start: number, end: number) => {
    var left = ratio * start/1000;
    var blockWidth = ratio * (end - start)/1000;
    return (
        <div 
            key={idx}
            className="video__segmenter-timeline-block" 
            data-id={id}
            style={{
                left: left+"px",
                width: blockWidth+"px",
                backgroundColor: (idx == -1 ? "#1890ff" : colors[idx % 7])
            }}
        ></div>
    )
  }

  return (
    <div className="video__segmenter-timeline">
      {selectedClip[0] != -1 ? renderTimelineSegment(-1, -1, selectedClip[0], selectedClip[1]) : ""}
      {clipList.map((clip: Clip, i: number) => renderTimelineSegment(i, clip.id, clip.start, clip.end))}
    </div>
  );
}