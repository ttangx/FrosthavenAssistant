import { useCallback, type CSSProperties } from 'react';

import { usePullToRefresh } from '../hooks/usePullToRefresh';

type PullIndicatorStyle = CSSProperties & {
  '--pull-offset': string;
  '--pull-progress': number;
};

function PullToRefresh() {
  const refresh = useCallback(() => window.location.reload(), []);
  const { active, offset, progress, ready, refreshing } = usePullToRefresh(refresh);
  const visible = active || refreshing;
  const label = refreshing
    ? 'Refreshing'
    : ready
      ? 'Release to refresh'
      : 'Pull to refresh';
  const icon = refreshing ? '\u21bb' : '\u2193';
  const style: PullIndicatorStyle = {
    '--pull-offset': `${offset}px`,
    '--pull-progress': progress,
  };

  return (
    <div
      aria-label={label}
      aria-live="polite"
      className={`pull-refresh${visible ? ' pull-refresh--visible' : ''}${ready ? ' pull-refresh--ready' : ''}${refreshing ? ' pull-refresh--refreshing' : ''}`}
      role="status"
      style={style}
    >
      <span aria-hidden="true" className="pull-refresh__sigil">{icon}</span>
      <span className="pull-refresh__label">{label}</span>
    </div>
  );
}

export default PullToRefresh;
