export const EXPORTABLE_VIEW_KEYS = [
  'plot-single',
  'plot-overlay',
  'plot-stacked',
  'scatter-plot.view',
  'event.time-line.view',
  'time-strip.view',
  'plan.view',
  'layout.view',
  'flexible-layout',
  'gauge',
  'conditionWidget',
  'summary-widget-viewer'
];

export function isExportableView(view = {}) {
  return EXPORTABLE_VIEW_KEYS.includes(view.key);
}
