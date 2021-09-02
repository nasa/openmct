export default function SpectralAggregatePlotCompositionPolicy(openmct) {
    function hasAggregateDomainAndRange(metadata) {
        const rangeValues = metadata.valuesForHints(['range']);
        const domainValues = metadata.valuesForHints(['domain']);

        // TODO: not quire sure what aggregate data will look like yet.

        return rangeValues.length > 0
        && domainValues.length > 0;
    }

    function hasSpectralAggregateTelemetry(domainObject) {
        if (!Object.prototype.hasOwnProperty.call(domainObject, 'telemetry')) {
            return false;
        }

        let metadata = openmct.telemetry.getMetadata(domainObject);

        return metadata.values().length > 0 && hasAggregateDomainAndRange(metadata);
    }

    return {
        allow: function (parent, child) {
            if ((parent.type === 'telemetry.plot.spectral.aggregate')
                && ((child.type !== 'telemetry.plot.overlay') && (hasSpectralAggregateTelemetry(child) === false))
            ) {
                return false;
            }

            return true;
        }
    };
}
