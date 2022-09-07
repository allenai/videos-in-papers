import classNames from 'classnames';
import * as React from 'react';

import { BoundingBoxType, TransformContext, DocumentContext, computeBoundingBoxStyle } from '@allenai/pdf-components';

export type Props = BoundingBoxType & {
  position: number;
  className?: string;
  id?: string;
  isCurrent: boolean;
  isFocus?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseOut?: () => void;
};

/*
 * Adapting BoundingBox elements from the library to be used as Sidebars
 */
export const Sidebar: React.FunctionComponent<Props> = ({
  top,
  left,
  height,
  width,
  position,
  className,
  id,
  isCurrent,
  isFocus,
  onClick,
  onMouseMove,
  onMouseOut,
  ...extraProps
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const boxSize = { top, left, height, width: 12 };
  const componentClassName = classNames(
    'reader__page-overlay__sidebar',
    isCurrent == true ? '' : 'reader__page-overlay__sidebar-notcurrent',
    isFocus === true ? 'reader__page-overlay__sidebar-highlighted' : '',
    className
  );
  const sidebarRef = React.createRef<HTMLDivElement>();
  const [scaledPosition, setScaledPosition] = React.useState<number>(-1);

  React.useEffect(() => {
    if(!sidebarRef.current) {
      return;
    } else if(position == -1) {
      setScaledPosition(-1);
    } else {
      var rect = sidebarRef.current.getBoundingClientRect();
      setScaledPosition(position * rect.height);
    }
  }, [position]);

  const getBoundingBoxStyle = React.useCallback(() => {
    return computeBoundingBoxStyle(boxSize, pageDimensions, rotation, scale);
  }, [pageDimensions, rotation, scale]);

  const rotationClassName = React.useCallback(() => {
    return `rotate${rotation}`;
  }, [rotation]);

  return (
    <React.Fragment>
      <div
        id={id}
        ref={sidebarRef}
        className={`${componentClassName} ${rotationClassName()}`}
        style={getBoundingBoxStyle()}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseOut={onMouseOut}
        {...extraProps}
      >
        {scaledPosition != -1 ?
          <div 
            className='reader__page-overlay__sidebar-tick'
            style={{top: scaledPosition+"px"}}
          />
        : ""}
      </div>
    </React.Fragment>
  );
};
