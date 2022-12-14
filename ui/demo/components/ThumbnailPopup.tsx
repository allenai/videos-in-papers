import * as React from 'react';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface Props {
  thumbnail: { clipId: number; left: number; top: number } | null;
  doi: string;
}

export function ThumbnailPopup({ thumbnail, doi }: Props) {
  if (thumbnail == null) {
    return null;
  }

  return (
    <div
      className="popup-thumbnail__container"
      style={{ top: thumbnail.top + 'px', left: thumbnail.left + 'px' }}
    >
      <div className="popup-thumbnail__wrapper">
        <ReactPlayer
          className="popup-thumbnail__thumbnail"
          url={'/api/clips/' + doi + '/' + thumbnail.clipId + '.mp4'}
          controls={false}
          playing={false}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}
