import { DocumentContext } from '@allenai/pdf-components';
import * as React from 'react';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';

import { Clip, Highlight } from '../types/clips';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  id: number;
  clips: Array<Clip>;
  width: number;
  handleNavigate: (fromId: number, toId: number) => void;
  playedHistory: Array<number>;
  sections?: { [id: number]: string };
}

const colors = ['#cb725e', '#d9a460', '#3e9d29', '#306ed3', '#07cead', '#9d58e1', '#dd59ba'];

export function PlayerTimeline({
  id,
  clips,
  width,
  handleNavigate,
  playedHistory,
  sections,
}: Props) {
  const [ratio, setRatio] = React.useState(0);
  const [hovered, setHovered] = React.useState(-1);

  React.useEffect(() => {
    setRatio((width) / clips[clips.length - 1].end);
  }, [width]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const temp = e.currentTarget.getAttribute('data-id');
    const id = temp != null ? parseInt(temp) : -1;
    setHovered(id);
  };
  const handleMouseLeave = (e: React.MouseEvent) => {
    setHovered(-1);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const temp = e.currentTarget.getAttribute('data-id');
    const toId: string = temp == null ? '-1' : temp;
    handleNavigate(id, parseInt(toId));
  };

  return (
    <div className="video__note-timeline">
      {hovered != -1 && sections ? (
        <div style={{ position: 'absolute', top: '-24px', color: '#333' }}>{sections[hovered]}</div>
      ) : (
        ''
      )}
      {clips.map((clip: Clip, i: number) => {
        const isCurrentClip = clip.id == id;
        const isStart = i == 0;
        const isEnd = i == clips.length - 1;
        const left = ratio * clip.start + (!isStart ? 3 : 2);
        const blockWidth = ratio * (clip.end - clip.start) + (!isEnd ? -2 : 1);
        const color = isCurrentClip ? colors[id % 7] : '#f6f6f6';
        const borderRadius = isStart ? '4px 0 0 4px' : isEnd ? '0 4px 4px 0' : '';
        const opacity = playedHistory.includes(
          typeof clip.id == 'string' ? parseInt(clip.id) : clip.id
        )
          ? '1'
          : '0.7';
        const height = isCurrentClip ? '20px' : '';
        return (
          <div
            key={i}
            className="video__note-timeline-block"
            data-id={clip.id}
            style={{
              left: left + 'px',
              width: blockWidth + 'px',
              borderRadius: borderRadius,
              backgroundColor: color,
              borderColor: color,
              opacity: opacity,
              height: height,
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}>
            {isCurrentClip ? id + 1 : ''}
          </div>
        );
      })}
    </div>
  );
}
