import * as React from 'react';
import {
  DocumentContext,
} from '@allenai/pdf-components';
import { Highlight, Clip } from '../types/clips';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  id: number;
  clips: Array<Clip>;
  width: number;
  handleNavigate: (fromId: number, toId: number) => void;
  playedHistory: Array<number>;
}

const colors = [
  "#cb725e", "#d9a460", "#3e9d29", "#306ed3", "#07cead", "#9d58e1", "#dd59ba"
]

export function PlayerTimeline({
  id,
  clips,
  width,
  handleNavigate,
  playedHistory,
}: Props) {
  const [ratio, setRatio] = React.useState(0);

  React.useEffect(() => {
    setRatio(width / clips[clips.length - 1].end);
  }, [width]);

  const handleClick = (e: React.MouseEvent) => {
    if(e.currentTarget.getAttribute('data-id') == null) return;
    var toId: string = e.currentTarget.getAttribute('data-id') == null ? "-1" : e.currentTarget.getAttribute('data-id');
    handleNavigate(id, parseInt(toId));
  }

  return (
    <div className="video__note-timeline">
        {clips.map((clip: Clip, i: number) => {
            var isCurrentClip = clip.id == id;
            var isStart = i == 0;
            var isEnd = i == clips.length - 1;
            var left = ratio * clip.start + (!isStart ? 2 : 0);
            var width = ratio * (clip.end - clip.start) + (!isEnd ? -2 : -1);
            var color = isCurrentClip ? colors[id % 7] : "#f6f6f6";
            var borderRadius = isStart ? "4px 0 0 4px" : (isEnd ? "0 4px 4px 0" : "");
            var opacity = playedHistory.includes(clip.id) || isCurrentClip ? "1" : "0.5";
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
                        opacity: opacity
                    }}
                    onClick={handleClick}
                >{isCurrentClip ? (id+1) : ""}</div>
            )
        })}
    </div>
  );
}