import { TransformContext, ZoomInButton, ZoomOutButton } from '@allenai/pdf-components';
import * as React from 'react';

import { PercentFormatter } from '../utils/format';

type Props = {
  lockable?: boolean;
  setLockable?: (lockable: boolean) => void;
  saveAnnotations?: () => void;
  saving?: boolean;
  openModal?: () => void;
};

export const Header: React.FunctionComponent<Props> = ({
  lockable,
  setLockable,
  saveAnnotations,
  saving,
  openModal
}: Props) => {
  const { scale } = React.useContext(TransformContext);

  const renderLabel = React.useCallback(() => {
    return <span>{PercentFormatter.format(scale)}</span>;
  }, [scale]);

  return (
    <div className="reader__header">
      <div>
        <a href="https://papeo.app" target="_blank">
          <i 
            className="fa-solid fa-house" 
            aria-hidden="true"
            style={{fontSize: "20px", cursor: "pointer", marginLeft: "4px"}}
          ></i>
        </a>
      </div>
      <div>
        <ZoomOutButton />
        {renderLabel()}
        <ZoomInButton />
      </div>
      {saveAnnotations ? (
        <div>
          <button
            className="reader__header-save-button"
            onClick={saveAnnotations}
            style={saving ? { backgroundColor: '#ccc', cursor: 'auto' } : {}}
          >
            {saving ? 'Saving...' : 'Save Mappings'}
          </button>
        </div>
      ) : (
        <div>
          <div onClick={openModal}>
            <i 
              className="fa fa-info-circle" 
              aria-hidden="true"
              style={{fontSize: "24px", cursor: "pointer", marginRight: "4px"}}
            ></i>
          </div>
        </div>
      )}
    </div>
  );
};
