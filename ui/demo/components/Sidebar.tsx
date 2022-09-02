import classNames from 'classnames';
import * as React from 'react';

import { BoundingBoxType, TransformContext, DocumentContext, computeBoundingBoxStyle } from '@allenai/pdf-components';

export type Props = BoundingBoxType & {
  className?: string;
  id?: string;
  isCurrent: boolean;
  isHighlighted?: boolean;
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
  className,
  id,
  isCurrent,
  isHighlighted,
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
    isHighlighted === true ? 'reader__page-overlay__sidebar-highlighted' : '',
    className
  );

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
        className={`${componentClassName} ${rotationClassName()}`}
        style={getBoundingBoxStyle()}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseOut={onMouseOut}
        {...extraProps}
      />
      <div>

      </div>
    </React.Fragment>
  );
};
