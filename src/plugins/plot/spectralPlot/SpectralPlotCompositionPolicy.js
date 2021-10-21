export default function SpectralPlotCompositionPolicy(openmct) {
    function hasSpectralDomainAndRange(metadata) {
        const rangeValues = metadata.valuesForHints(['range']);
        const domainValues = metadata.valuesForHints(['domain']);
        const containsSomeSpectralData = domainValues.some(value => {
            return ((value.key === 'wavelength') || (value.key === 'frequency'));
        });

        return rangeValues.length > 0
        && domainValues.length > 0
        && containsSomeSpectralData;
    }

    function hasSpectralTelemetry(domainObject) {
        if (!Object.prototype.hasOwnProperty.call(domainObject, 'telemetry')) {
            return false;
        }

        let metadata = openmct.telemetry.getMetadata(domainObject);

        return metadata.values().length > 0 && hasSpectralDomainAndRange(metadata);
    }

    return {
        allow: function (parent, child) {

            if ((parent.type === 'telemetry.plot.spectral')
                && ((child.type !== 'telemetry.plot.overlay') && (hasSpectralTelemetry(child) === false))
            ) {
                return false;
            }

            return true;
        }
    };
}
