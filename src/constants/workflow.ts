export const WORKFLOW_VERSION = '1.0.0';

export const HISTORY_LIMIT = 50;

export const DEFAULT_PROJECT_NAME = 'untitled';

export const DEFAULT_ACTIVE_TAB = 'history';

export const INTERACTION_MODES = {
  SELECT: 'select',
  PAN: 'pan',
} as const;

export type InteractionMode = typeof INTERACTION_MODES[keyof typeof INTERACTION_MODES];

export const VIEW_MODES = {
  SINGLE: 'single',
  ALL: 'all',
} as const;

export type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];
