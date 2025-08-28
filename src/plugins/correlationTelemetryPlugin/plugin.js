const CORRELATOR_TYPE = 'telemetry.correlator';

export default function CorrelationTelemetryPlugin(openmct) {
  // eslint-disable-next-line no-shadow
  return function install(openmct) {
    function getTelemetryObject(idString) {
      return openmct.objects.get(idString);
    }

    function getTelemetry(object, options) {
      return openmct.telemetry.request(object, options);
    }

    openmct.types.addType(CORRELATOR_TYPE, {
      name: 'Correlation Telemetry',
      description: `Combines telemetry from multiple sources to produce telemetry correlated by timestamp with a given time tolerance.`,
      cssClass: 'icon-object',
      creatable: true,
      initialize: function (obj) {
        obj.telemetry = {};
      },
      form: [
        {
          key: 'xSource',
          name: 'X Axis Source',
          control: 'locator',
          required: true,
          cssClass: 'grows'
        },
        {
          key: 'ySource',
          name: 'Y Axis Source',
          control: 'locator',
          required: true,
          cssClass: 'grows'
        }
      ]
    });

    openmct.telemetry.addProvider({
      supportsMetadata: function (domainObject) {
        return domainObject.type === CORRELATOR_TYPE;
      },
      getMetadata: function (domainObject) {
        let metadata = {};
        metadata.values = openmct.time.getAllTimeSystems().map(function (timeSystem, i) {
          return {
            name: timeSystem.name,
            key: timeSystem.key,
            source: timeSystem.source,
            format: timeSystem.timeFormat,
            hints: { domain: i }
          };
        });
        metadata.values.push({
          name: 'X',
          key: 'x',
          source: 'x',
          hints: { xSource: 1, range: 1 }
        });
        metadata.values.push({
          name: 'Y',
          key: 'y',
          source: 'y',
          hints: { ySource: 1, range: 2 }
        });
        return metadata;
      },
      supportsRequest: function (domainObject) {
        return domainObject.type === CORRELATOR_TYPE;
      },
      request: function (domainObject, options) {
        let telemResults = {};
        let telemObject;

        const xSourceIdentifier = openmct.objects.makeKeyString(domainObject.xSource[0].identifier);
        let xPromise = getTelemetryObject(xSourceIdentifier)
          .then((object) => {
            telemObject = object;
            return getTelemetry(object, options);
          })
          .then((data) => {
            let source = 'x';
            telemResults[source] = {
              object: telemObject
            };
            let metadata = openmct.telemetry.getMetadata(telemObject);
            let valueMeta = metadata.valuesForHints(['range'])[0];
            telemResults[source].coorelatorFormat = openmct.telemetry.getValueFormatter(valueMeta);
            telemResults[source].coorelatorFormat = openmct.telemetry.getValueFormatter(valueMeta);
            telemResults[source].timestampFormat = openmct.telemetry.getValueFormatter(
              metadata.value(options.domain)
            );
            telemResults[source].data = data;
          });

        const ySourceIdentifier = openmct.objects.makeKeyString(domainObject.ySource[0].identifier);
        let yPromise = getTelemetryObject(ySourceIdentifier)
          .then((object) => {
            telemObject = object;
            return getTelemetry(object, options);
          })
          .then((data) => {
            let source = 'y';
            telemResults[source] = {
              object: telemObject
            };
            let metadata = openmct.telemetry.getMetadata(telemObject);
            let valueMeta = metadata.valuesForHints(['range'])[0];
            telemResults[source].coorelatorFormat = openmct.telemetry.getValueFormatter(valueMeta);
            telemResults[source].coorelatorFormat = openmct.telemetry.getValueFormatter(valueMeta);
            telemResults[source].timestampFormat = openmct.telemetry.getValueFormatter(
              metadata.value(options.domain)
            );
            telemResults[source].data = data;
          });

        return Promise.all([xPromise, yPromise]).then(function () {
          let results = [];
          let xByTime = telemResults.x.data.reduce(function (m, datum) {
            m[telemResults.x.timestampFormat.parse(datum)] =
              telemResults.x.coorelatorFormat.parse(datum);
            return m;
          }, {});
          telemResults.y.data.forEach(function (datum) {
            let timestamp = telemResults.y.timestampFormat.parse(datum);
            if (xByTime[timestamp] !== undefined) {
              let resultDatum = {
                x: xByTime[timestamp],
                y: telemResults.y.coorelatorFormat.parse(datum)
              };
              resultDatum[options.domain] = timestamp;
              results.push(resultDatum);
            }
          });
          return results;
        });
      },
      supportsSubscribe: function (domainObject) {
        return domainObject.type === CORRELATOR_TYPE;
      },
      subscribe: function (domainObject, callback) {
        let telem = {};
        let done = false;
        let unsubscribes = [];

        function sendUpdate() {
          if (done) {
            return;
          }
          if (!telem.y.latest || !telem.x.latest) {
            return;
          }
          if (telem.y.latestTimestamp !== telem.x.latestTimestamp) {
            return;
          }
          let datum = {
            x: telem.x.coorelatorFormat.parse(telem.x.latest),
            y: telem.y.coorelatorFormat.parse(telem.y.latest)
          };
          datum[openmct.time.timeSystem().key] = Math.max(
            telem.x.latestTimestamp,
            telem.y.latestTimestamp
          );
          delete telem.x.latest;
          delete telem.y.latest;
          delete telem.x.latestTimestamp;
          delete telem.y.latestTimestamp;
          callback(datum);
        }

        const xSourceIdentifier = openmct.objects.makeKeyString(domainObject.xSource[0].identifier);
        getTelemetryObject(xSourceIdentifier).then(function (xObject) {
          if (done) {
            return;
          }
          telem.x = {
            object: xObject
          };
          let metadata = openmct.telemetry.getMetadata(xObject);
          let valueMeta = metadata.valuesForHints(['range'])[0];
          telem.x.coorelatorFormat = openmct.telemetry.getValueFormatter(valueMeta);
          telem.x.timestampFormat = openmct.telemetry.getValueFormatter(
            metadata.value(openmct.time.timeSystem().key)
          );
          unsubscribes.push(
            openmct.telemetry.subscribe(xObject, function (datum) {
              telem.x.latest = datum;
              telem.x.latestTimestamp = telem.x.timestampFormat.parse(datum);
              requestAnimationFrame(sendUpdate);
            })
          );
        });

        const ySourceIdentifier = openmct.objects.makeKeyString(domainObject.ySource[0].identifier);
        getTelemetryObject(ySourceIdentifier).then(function (yObject) {
          if (done) {
            return;
          }
          telem.y = {
            object: yObject
          };
          let metadata = openmct.telemetry.getMetadata(yObject);
          let valueMeta = metadata.valuesForHints(['range'])[0];
          telem.y.coorelatorFormat = openmct.telemetry.getValueFormatter(valueMeta);
          telem.y.timestampFormat = openmct.telemetry.getValueFormatter(
            metadata.value(openmct.time.timeSystem().key)
          );
          unsubscribes.push(
            openmct.telemetry.subscribe(yObject, function (datum) {
              telem.y.latest = datum;
              telem.y.latestTimestamp = telem.y.timestampFormat.parse(datum);
              requestAnimationFrame(sendUpdate);
            })
          );
        });

        return function unsubscribe() {
          done = true;
          unsubscribes.forEach(function (u) {
            u();
          });
          unsubscribes = undefined;
        };
      }
    });
  };
}
