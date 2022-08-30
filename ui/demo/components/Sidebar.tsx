import classNames from 'classnames';
import * as React from 'react';

import { BoundingBox as BoundingBoxType, TransformContext, DocumentContext, computeBoundingBoxStyle } from '@allenai/pdf-components';

export type Props = {
  className?: string;
  id?: string;
  isHighlighted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
} & BoundingBoxType;

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
  isHighlighted,
  onClick,
  onMouseMove,
  ...extraProps
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  const boxSize = { top, left, height, width };
  const componentClassName = classNames(
    'reader__page-overlay__sidebar',
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
        {...extraProps}
      />
    </React.Fragment>
  );
};
