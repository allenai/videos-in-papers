import {
  BoundingBoxType,
  computeBoundingBoxStyle,
  DocumentContext,
  TransformContext,
} from '@allenai/pdf-components';
import classNames from 'classnames';
import * as React from 'react';

export type Props = BoundingBoxType & {
  position: number;
  className?: string;
  id?: string;
  isCurrent: boolean;
  isFocus?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseOut?: () => void;
  rects: Array<BoundingBoxType>;
};

const DEFAULT_POS = 36;

/*
 * Adapting BoundingBox elements from the library to be used as Sidebars
 */
export const Sidebar: React.FunctionComponent<Props> = ({
  top,
  left,
  height,
  width,
  page,
  position,
  className,
  id,
  isCurrent,
  isFocus,
  onClick,
  onMouseMove,
  onMouseOut,
  rects,
  ...extraProps
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const boxSize = { top, left, height, width };
  const componentClassName = classNames(
    'reader__page-overlay__sidebar',
    className,
    isCurrent == true ? '' : 'reader__page-overlay__sidebar-notcurrent',
    isFocus === true ? 'reader__page-overlay__sidebar-highlighted' : ''
  );
  const sidebarRef = React.createRef<HTMLDivElement>();
  const [scaledPosition, setScaledPosition] = React.useState<number>(-1);

  React.useEffect(() => {
    if (!sidebarRef.current) {
      return;
    } else if (position == -1) {
      setScaledPosition(-1);
    } else {
      const rect = sidebarRef.current.getBoundingClientRect();
      setScaledPosition(position * rect.height);
    }
  }, [position]);

  const getBoundingBoxStyle = React.useCallback(
    boxSize => {
      return computeBoundingBoxStyle(boxSize, pageDimensions, rotation, scale);
    },
    [pageDimensions, rotation, scale]
  );

  const rotationClassName = React.useCallback(() => {
    return `rotate${rotation}`;
  }, [rotation]);

  var pageCenter = pageDimensions.width / 2;

  var sidebarBox = {
    ...boxSize,
    left:
      boxSize.left + boxSize.width / 2 <= pageCenter ||
      (boxSize.left < pageCenter && boxSize.left + boxSize.width > pageCenter)
        ? DEFAULT_POS
        : pageDimensions.width - DEFAULT_POS - 12,
  };
  if (scaledPosition != -1) {
    sidebarBox.left -= 26;
  }

  return (
    <React.Fragment>
      <div
        id={id}
        ref={sidebarRef}
        className={`reader_sidebars reader__page-overlay__sidebar-holder ${rotationClassName()}`}
        style={{ ...getBoundingBoxStyle({ ...sidebarBox }), width: scaledPosition != -1 ? 64 : 12 }}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseOut}
        {...extraProps}
      >
        <div
          className={`${componentClassName} ${rotationClassName()}`}
          style={getBoundingBoxStyle({
            ...sidebarBox,
            top: 0,
            left: scaledPosition != -1 ? 26 : 0,
            width: 12,
          })}
        >
          {scaledPosition != -1 ? (
            <div
              className="reader__page-overlay__sidebar-tick"
              style={{ top: scaledPosition + 'px' }}
            />
          ) : (
            ''
          )}
        </div>
      </div>
      {isFocus
        ? rects.map((rect, i) => {
            if (rect.page != page) return null;
            return (
              <div
                key={i}
                className={`reader__page-overlay__sidebar-focus ${componentClassName} ${rotationClassName()}`}
                style={{ ...getBoundingBoxStyle(rect) }}
              ></div>
            );
          })
        : ''}
    </React.Fragment>
  );
};
