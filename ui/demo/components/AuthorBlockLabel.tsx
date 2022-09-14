import classNames from 'classnames';
import * as React from 'react';

import { BoundingBoxType, TransformContext, DocumentContext, computeBoundingBoxStyle } from '@allenai/pdf-components';

export type Props = BoundingBoxType & {
  className?: string;
  id?: string;
  color?: string;
};

/*
 * Adapting BoundingBox elements from the library to be used as Sidebars
 */
export const AuthorBlockLabel: React.FunctionComponent<Props> = ({
  top,
  left,
  height,
  width,
  className,
  id,
  color,
  ...extraProps
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  var boxSize = { top, left: left-40 - 4, height: 40, width: 40 };
  if(pageDimensions.width/2 < left) {
    boxSize = { top, left: left+width + 4, height: 40, width: 40 };
  }
  const componentClassName = classNames(
    'reader__page-overlay__block-label',
  );
  const sidebarRef = React.createRef<HTMLDivElement>();

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
        style={{...getBoundingBoxStyle(), backgroundColor: color}}
        {...extraProps}
      >
        {id}
      </div>
    </React.Fragment>
  );
};
