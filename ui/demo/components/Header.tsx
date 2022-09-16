import { TransformContext, ZoomInButton, ZoomOutButton } from '@allenai/pdf-components';
import * as React from 'react';

import { PercentFormatter } from '../utils/format';

type Props = {
  lockable?: boolean;
  setLockable?: (lockable: boolean) => void;
  saveAnnotations?: () => void;
  saving?: boolean;
};

export const Header: React.FunctionComponent<Props> = ({
  lockable,
  setLockable,
  saveAnnotations,
  saving,
}: Props) => {
  const { scale } = React.useContext(TransformContext);

  const renderLabel = React.useCallback(() => {
    return <span>{PercentFormatter.format(scale)}</span>;
  }, [scale]);

  return (
    <div className="reader__header">
      <div></div>
      <div>
        <ZoomOutButton />
        {renderLabel()}
        <ZoomInButton />
      </div>
      {lockable != null ? (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', paddingRight: '16px' }}>
          Lock Video
          <input
            type="checkbox"
            className="toggle-switch-checkbox"
            name="toggleSwitch"
            id="toggleSwitch"
            checked={lockable}
            onChange={() => (setLockable ? setLockable(!lockable) : null)}
          />
        </div>
      ) : (
        ''
      )}
      {saveAnnotations ? (
        <div>
          <button
            className="reader__header-save-button"
            onClick={saveAnnotations}
            style={saving ? { backgroundColor: '#ccc', cursor: 'auto' } : {}}>
            {saving ? 'Saving...' : 'Save Mappings'}
          </button>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
