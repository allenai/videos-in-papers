import * as React from 'react';

import { Clip, Highlight } from '../types/clips';

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
  clips: { [id: number]: Clip };
  selectedClip: Array<number>;
  changeClip: (clip: Array<number>, idx: number) => void;
  selectedMapping: number | null;
  setSelectedMapping: (clipId: number | null) => void;
  modifyMode: boolean;
  scale: number;
}

const colors = ['#cb725e', '#d9a460', '#3e9d29', '#306ed3', '#07cead', '#9d58e1', '#dd59ba'];

function timeToStr(time: number) {
  const totalSec = Math.floor(time / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  return (min < 10 ? '0' + min : min) + ':' + (sec < 10 ? '0' + sec : sec);
}

export function AuthorTimeline({
  duration,
  width,
  clips,
  selectedClip,
  changeClip,
  selectedMapping,
  setSelectedMapping,
  modifyMode,
  scale,
}: Props) {
  const [ratio, setRatio] = React.useState(0);
  const [hovered, setHovered] = React.useState(-1);
  const [clipList, setClipList] = React.useState<Array<Clip>>([]);
  const [edit, setEdit] = React.useState<number | null>(null);
  const previousSelectedClip: any | undefined = usePreviousValue(selectedClip);

  const [scrubDirection, setScrubDirection] = React.useState<number>(0);

  React.useEffect(() => {
    setRatio((width * scale) / 100 / duration);
  }, [width, duration, scale]);

  React.useEffect(() => {
    const tempClipList = Object.keys(clips).map((id: string) => clips[parseInt(id)]);
    tempClipList.sort((a: Clip, b: Clip) => a.start - b.start);
    setClipList(tempClipList);
  }, [clips]);

  React.useEffect(() => {
    if (previousSelectedClip != undefined) {
      if (
        selectedClip[0] != previousSelectedClip[0] &&
        selectedClip[1] != previousSelectedClip[1]
      ) {
        setEdit(null);
      }
    }
  }, [selectedClip]);

  const handleClickSegment = (idx: number, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id == -1) {
      setEdit(id);
      setSelectedMapping(null);
    } else {
      setSelectedMapping(id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (scrubDirection == 0) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left + target.scrollLeft;
    const newTime = Math.floor((x / ratio) * 10) * 100;
    if (!modifyMode && edit != null) {
      if (scrubDirection == 1) {
        changeClip([selectedClip[0], newTime], -1);
      } else {
        changeClip([newTime, selectedClip[1]], -1);
      }
    } else if (modifyMode && selectedMapping != null) {
      const clip = clips[selectedMapping];
      if (scrubDirection == 1) {
        changeClip([clip.start, newTime], selectedMapping);
      } else {
        changeClip([newTime, clip.end], selectedMapping);
      }
    }
  };

  const renderTimelineSegment = (idx: number, id: number, start: number, end: number) => {
    const left = (ratio * start) / 1000;
    const blockWidth = (ratio * (end - start)) / 1000;

    const thumbs: Array<React.ReactElement> = [
      <div key={id + '-left'}></div>,
      <div key={id + '-middle'}>{id != -1 && blockWidth > 9 ? id : ''}</div>,
      <div key={id + '-right'}></div>,
    ];
    // Don't make other clips editable for now
    if ((edit == id && id == -1) || (modifyMode && selectedMapping == id)) {
      thumbs[0] = (
        <div
          key={id + '-left'}
          className="video__segmenter-thumb-left-container"
          onMouseDown={e => {
            e.preventDefault();
            setScrubDirection(-1);
          }}>
          <div className="video__segmenter-thumb"></div>
        </div>
      );
      thumbs[2] = (
        <div
          key={id + '-right'}
          className="video__segmenter-thumb-right-container"
          onMouseDown={e => {
            e.preventDefault();
            setScrubDirection(1);
          }}>
          <div className="video__segmenter-thumb"></div>
        </div>
      );
    }

    return (
      <div
        key={id}
        className="video__segmenter-timeline-block"
        data-id={id}
        style={{
          left: left + 'px',
          width: blockWidth + 'px',
          backgroundColor: id == -1 ? '#1890ff' : colors[id % 7],
          height: edit == id || selectedMapping == id ? '28px' : '20px',
          zIndex: edit == id || selectedMapping == id ? 5 : 1,
        }}
        onClick={(e: React.MouseEvent) => handleClickSegment(idx, id, e)}>
        {thumbs}
      </div>
    );
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (modifyMode) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left + target.scrollLeft;
    const newTime = Math.floor((x / ratio) * 10) * 100;
    changeClip([newTime - 10000, newTime + 10000], -1);
    setSelectedMapping(null);
  };

  const renderTicks = () => {
    const ticksHTML = [];
    let numTicks = Math.floor(duration / 10);
    for (var i = 1; i < numTicks; i++) {
      ticksHTML.push(
        <div
          key={'minor-' + i}
          className="video__segmenter-timeline-tick"
          style={{ left: i * 10 * ratio + 'px' }}></div>
      );
    }
    numTicks = Math.floor(duration / 30);
    for (var i = 1; i < numTicks; i++) {
      ticksHTML.push(
        <div
          key={'major-' + i}
          className="video__segmenter-timeline-tick-major"
          style={{ left: i * 30 * ratio + 'px' }}></div>
      );
      ticksHTML.push(
        <div
          key={'label-' + i}
          className="video__segmenter-timeline-tick-label"
          style={{ left: i * 30 * ratio - 11.5 + 'px' }}>
          {timeToStr(i * 30 * 1000)}
        </div>
      );
    }
    return ticksHTML;
  };

  return (
    <div
      className="video__segmenter-timeline"
      onMouseMove={handleMouseMove}
      onClick={handleTimelineClick}
      onMouseUp={() => (scrubDirection != 0 ? setScrubDirection(0) : '')}>
      <div className="video__segmenter-timeline-inner" style={{ width: scale + '%' }}>
        {selectedClip[0] != -1
          ? renderTimelineSegment(-1, -1, selectedClip[0], selectedClip[1])
          : ''}
        {clipList.map((clip: Clip, i: number) =>
          renderTimelineSegment(i, clip.id, clip.start, clip.end)
        )}
        {renderTicks()}
      </div>
    </div>
  );
}
