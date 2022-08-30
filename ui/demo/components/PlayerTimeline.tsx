import * as React from 'react';
import {
  DocumentContext,
} from '@allenai/pdf-components';
import { Highlight, Clip, Caption } from '../types/annotations';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  id: number;
  clip: Clip;
  clips: Array<Clip>;
  width: number;
  handleNavigate: (fromId: number, toId: number) => void;
}

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

export function PlayerTimeline({
  id,
  clip,
  clips,
  width,
  handleNavigate,
}: Props) {
  const [ratio, setRatio] = React.useState(0);

  React.useEffect(() => {
    setRatio(width / clips[clips.length - 1].end);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    handleNavigate(id, parseInt(e.currentTarget.getAttribute('data-id')));
  }

  return (
    <div className="video__note-timeline">
        {clips.map((clip, i) => {
            var isCurrentClip = clip.id == id;
            var isStart = i == 0;
            var isEnd = i == clips.length - 1;
            var left = ratio * clip.start + (!isStart ? 2 : 0);
            var width = ratio * (clip.end - clip.start) + (!isEnd ? -2 : -1);
            var color = isCurrentClip ? colors[id % 7] : "#eee";
            var borderRadius = isStart ? "4px 0 0 4px" : (isEnd ? "0 4px 4px 0" : "");
            return (
                <div 
                    key={i}
                    className="video__note-timeline-block" 
                    data-id={clip.id}
                    style={{
                        left: left+"px",
                        width: width+"px", 
                        borderRadius: borderRadius,
                        backgroundColor: color,
                        borderColor: color,
                    }}
                    onClick={handleClick}
                >{isCurrentClip ? (id+1) : ""}</div>
            )
        })}
    </div>
  );
}