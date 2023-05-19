export function isPlotView(view) {
  return view.key === 'plot-single' || view.key === 'plot-overlay' || view.key === 'plot-stacked';
}
