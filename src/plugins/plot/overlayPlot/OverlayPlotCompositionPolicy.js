export default function OverlayPlotCompositionPolicy(openmct) {
  return {
    allow: function (parent, child) {
      if (
        parent.type === 'telemetry.plot.overlay' &&
        !openmct.telemetry.hasNumericTelemetry(child)
      ) {
        return false;
      }

      return true;
    }
  };
}
