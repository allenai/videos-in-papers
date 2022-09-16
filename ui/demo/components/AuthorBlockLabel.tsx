import {
  BoundingBoxType,
  computeBoundingBoxStyle,
  DocumentContext,
  TransformContext,
} from '@allenai/pdf-components';
import classNames from 'classnames';
import * as React from 'react';

export type Props = BoundingBoxType & {
  className?: string;
  id?: string;
  color?: string;
  isHighlighted?: boolean;
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
  isHighlighted,
  ...extraProps
}: Props) => {
  const { pageDimensions } = React.useContext(DocumentContext);
  const { rotation, scale } = React.useContext(TransformContext);
  let boxSize = { top, left: left - 40 - 4, height: 40, width: 40 };
  if (pageDimensions.width / 2 < left) {
    boxSize = { top, left: left + width + 4, height: 40, width: 40 };
  }
  const componentClassName = classNames(
    isHighlighted ? 'reader__page-overlay__block-label-sel' : 'reader__page-overlay__block-label'
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
        style={{
          ...getBoundingBoxStyle(),
          backgroundColor: color,
          borderColor: color,
          color: isHighlighted ? '#fff' : color,
        }}
        {...extraProps}>
        {id}
      </div>
    </React.Fragment>
  );
};
