export default function OverlayPlotCompositionPolicy(openmct) {
  function hasNumericTelemetry(domainObject) {
    const hasTelemetry = openmct.telemetry.isTelemetryObject(domainObject);
    if (!hasTelemetry) {
      return false;
    }

    let metadata = openmct.telemetry.getMetadata(domainObject);

    return metadata.values().length > 0 && hasDomainAndRange(metadata);
  }

  function hasDomainAndRange(metadata) {
    return (
      metadata.valuesForHints(['range']).length > 0 &&
      metadata.valuesForHints(['domain']).length > 0
    );
  }

  return {
    allow: function (parent, child) {
      if (parent.type === 'telemetry.plot.overlay' && hasNumericTelemetry(child) === false) {
        return false;
      }

      return true;
    }
  };
}
