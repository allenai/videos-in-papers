import * as React from 'react';
import { Highlight, Clip } from '../types/clips';

function usePreviousValue(value: any) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

interface Props {
  duration: number;
  width: number;
  clips: {[id: number]: Clip};
  selectedClip: Array<number>;
  changeClip: (clip: Array<number>, idx: number) => void;
}

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

export function AuthorTimeline({
    duration,
    width,
    clips,
    selectedClip,
    changeClip,
}: Props) {
  const [ratio, setRatio] = React.useState(0);
  const [hovered, setHovered] = React.useState(-1);
  const [clipList, setClipList] = React.useState<Array<Clip>>([]);
  const [edit, setEdit] = React.useState<number | null>(null);
  const previousSelectedClip = usePreviousValue(selectedClip);

  const [scrubDirection, setScrubDirection] = React.useState<number>(0);

  React.useEffect(() => {
    setRatio(width / duration);
  }, [width, duration]);

  React.useEffect(() => {
    var tempClipList = Object.keys(clips).map((id: string) => clips[parseInt(id)]);
    tempClipList.sort((a: Clip, b: Clip) => a.start - b.start);
    setClipList(tempClipList);
  }, [clips]);

  React.useEffect(() => {
    if(previousSelectedClip) {
        if(selectedClip[0] != previousSelectedClip[0] && selectedClip[1] != previousSelectedClip[1]) {
            setEdit(null);
        }
    }
  }, [selectedClip]);

  const handleClickSegment = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if(idx == edit) {
        setEdit(null);
    } else {
        setEdit(idx);
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if(edit == null || scrubDirection == 0) return;
    var rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    var x = e.clientX - rect.left;
    var newTime = Math.floor(x / ratio * 1000);
    if(scrubDirection == 1) {
        changeClip([selectedClip[0], newTime], -1);
    } else {
        changeClip([newTime, selectedClip[1]], -1);
    }
  }

  const renderTimelineSegment = (idx: number, id: number, start: number, end: number) => {
    var left = ratio * start/1000;
    var blockWidth = ratio * (end - start)/1000;

    var thumbs: Array<React.ReactElement> = [];
    if(edit == idx) {
        thumbs = [
            <div 
                key={idx + '-left'}
                className="video__segmenter-thumb-left-container"
                onMouseDown={() => setScrubDirection(-1)}
            ><div className="video__segmenter-thumb"></div></div>,
            <div 
                key={idx + '-right'}
                className="video__segmenter-thumb-right-container"
                onMouseDown={() => setScrubDirection(1)}
            ><div className="video__segmenter-thumb"></div></div>
        ];
    }

    return (
        <div 
            key={idx}
            className="video__segmenter-timeline-block" 
            data-id={id}
            style={{
                left: left+"px",
                width: blockWidth+"px",
                backgroundColor: (idx == -1 ? "#1890ff" : colors[idx % 7]),
                height: edit == idx ? "28px" : "20px",
            }}
            onClick={(e: React.MouseEvent) => handleClickSegment(idx, e)}
        >{thumbs}</div>
    )
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  }

  return (
    <div 
        className="video__segmenter-timeline" 
        onMouseMove={handleMouseMove} 
        onClick={handleTimelineClick}
        onMouseUp={() => scrubDirection != 0 ? setScrubDirection(0) : ""}
    >
      {selectedClip[0] != -1 ? renderTimelineSegment(-1, -1, selectedClip[0], selectedClip[1]) : ""}
      {clipList.map((clip: Clip, i: number) => renderTimelineSegment(i, clip.id, clip.start, clip.end))}
      <div className="video__segmenter-timeline-strip"></div>
    </div>
  );
}