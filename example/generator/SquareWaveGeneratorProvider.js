define([
    './WorkerInterface'
], function (
    WorkerInterface
) {
    var REQUEST_DEFAULTS = {
        amplitude: 1,
        period: 10,
        offset: 0,
        dataRateInHz: 1,
        phase: 0
    };

    function SquareWaveGeneratorProvider() {
        this.workerInterface = new WorkerInterface();
    }

    SquareWaveGeneratorProvider.prototype.canProvideTelemetry = function (domainObject) {
        return domainObject.type === 'squareWaveGenerator';
    };

    SquareWaveGeneratorProvider.prototype.supportsRequest =
        SquareWaveGeneratorProvider.prototype.supportsSubscribe =
            SquareWaveGeneratorProvider.prototype.canProvideTelemetry;

    SquareWaveGeneratorProvider.prototype.makeWorkerRequest = function (domainObject, request) {
        var props = [
            'amplitude',
            'period',
            'offset',
            'dataRateInHz',
            'phase',
        ];

        request = request || {};

        var workerRequest = {};

        props.forEach(function (prop) {
            if (domainObject.telemetry && domainObject.telemetry.hasOwnProperty(prop)) {
                workerRequest[prop] = domainObject.telemetry[prop];
            }
            if (request && request.hasOwnProperty(prop)) {
                workerRequest[prop] = request[prop];
            }
            if (!workerRequest.hasOwnProperty(prop)) {
                workerRequest[prop] = REQUEST_DEFAULTS[prop];
            }
            workerRequest[prop] = Number(workerRequest[prop]);
        });
        workerRequest.name = domainObject.name;
        return workerRequest;
    };

    SquareWaveGeneratorProvider.prototype.request = function (domainObject, request) {
        var workerRequest = this.makeWorkerRequest(domainObject, request);
        workerRequest.start = request.start;
        workerRequest.end = request.end;
        return this.workerInterface.request(workerRequest);
    };

    SquareWaveGeneratorProvider.prototype.subscribe = function (domainObject, callback) {
        var workerRequest = this.makeWorkerRequest(domainObject, {});
        return this.workerInterface.subscribe(workerRequest, callback);
    };

    return SquareWaveGeneratorProvider;
});
