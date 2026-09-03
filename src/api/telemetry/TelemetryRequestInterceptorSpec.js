import TelemetryRequestInterceptorRegistry from './TelemetryRequestInterceptor.js';

describe('TelemetryRequestInterceptorRegistry', () => {
  let registry;
  let identifier;
  let request;

  beforeEach(() => {
    registry = new TelemetryRequestInterceptorRegistry();
    identifier = {
      namespace: 'test',
      key: 'object'
    };
    request = {};
  });

  it('returns applicable interceptors in descending numeric priority order', () => {
    const lowPriorityInterceptor = {
      appliesTo: () => true,
      priority: -1000
    };

    const defaultPriorityInterceptor = {
      appliesTo: () => true
    };

    const highPriorityInterceptor = {
      appliesTo: () => true,
      priority: 1000
    };

    registry.addInterceptor(lowPriorityInterceptor);
    registry.addInterceptor(defaultPriorityInterceptor);
    registry.addInterceptor(highPriorityInterceptor);

    const interceptors = registry.getInterceptors(identifier, request);

    expect(interceptors).toEqual([
      highPriorityInterceptor,
      defaultPriorityInterceptor,
      lowPriorityInterceptor
    ]);
  });

  it('evaluates function-valued priorities before sorting', () => {
    const lowPriorityInterceptor = {
      appliesTo: () => true,
      priority: () => -1000
    };

    const defaultPriorityInterceptor = {
      appliesTo: () => true
    };

    const highPriorityInterceptor = {
      appliesTo: () => true,
      priority: () => 1000
    };

    registry.addInterceptor(lowPriorityInterceptor);
    registry.addInterceptor(defaultPriorityInterceptor);
    registry.addInterceptor(highPriorityInterceptor);

    const interceptors = registry.getInterceptors(identifier, request);

    expect(interceptors).toEqual([
      highPriorityInterceptor,
      defaultPriorityInterceptor,
      lowPriorityInterceptor
    ]);
  });
});
