define(['lodash'], function (_) {
  var METADATA_BY_TYPE = {
    generator: {
      values: [
        {
          key: 'name',
          name: 'Name',
          format: 'string'
        },
        {
          key: 'utc',
          name: 'Time',
          format: 'utc',
          hints: {
            domain: 1
          }
        },
        {
          key: 'yesterday',
          name: 'Yesterday',
          format: 'utc',
          hints: {
            domain: 2
          }
        },
        {
          key: 'wavelengths',
          name: 'Wavelength',
          unit: 'nm',
          format: 'string[]',
          hints: {
            range: 4
          }
        },
        // Need to enable "LocalTimeSystem" plugin to make use of this
        // {
        //     key: "local",
        //     name: "Time",
        //     format: "local-format",
        //     source: "utc",
        //     hints: {
        //         domain: 3
        //     }
        // },
        {
          key: 'sin',
          name: 'Sine',
          unit: 'Hz',
          formatString: '%0.2f',
          hints: {
            range: 1
          }
        },
        {
          key: 'cos',
          name: 'Cosine',
          unit: 'deg',
          formatString: '%0.2f',
          hints: {
            range: 2
          }
        },
        {
          key: 'intensities',
          name: 'Intensities',
          format: 'number[]',
          hints: {
            range: 3
          }
        }
      ]
    },
    'example.state-generator': {
      values: [
        {
          key: 'name',
          name: 'Name',
          format: 'string'
        },
        {
          key: 'utc',
          name: 'Time',
          format: 'utc',
          hints: {
            domain: 1
          }
        },
        {
          key: 'local',
          name: 'Time',
          format: 'utc',
          source: 'utc',
          hints: {
            domain: 2
          }
        },
        {
          key: 'state',
          source: 'value',
          name: 'State',
          format: 'enum',
          enumerations: [
            {
              value: 0,
              string: 'OFF'
            },
            {
              value: 1,
              string: 'ON'
            }
          ],
          hints: {
            range: 1
          }
        },
        {
          key: 'value',
          name: 'Value',
          hints: {
            range: 2
          }
        }
      ]
    }
  };

  function GeneratorMetadataProvider() {}

  GeneratorMetadataProvider.prototype.supportsMetadata = function (domainObject) {
    return Object.prototype.hasOwnProperty.call(METADATA_BY_TYPE, domainObject.type);
  };

  GeneratorMetadataProvider.prototype.getMetadata = function (domainObject) {
    return Object.assign({}, domainObject.telemetry, METADATA_BY_TYPE[domainObject.type]);
  };

  return GeneratorMetadataProvider;
});
