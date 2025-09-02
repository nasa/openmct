/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import WorkerInterface from './WorkerInterface.js';

const REQUEST_DEFAULTS = {
  amplitude: 1,
  period: 10,
  offset: 0,
  dataRateInHz: 1,
  randomness: 0,
  phase: 0,
  loadDelay: 0,
  infinityValues: false,
  exceedFloat32: false
};

export default function GeneratorProvider(openmct, StalenessProvider) {
  this.openmct = openmct;
  this.workerInterface = new WorkerInterface(openmct, StalenessProvider);
}

GeneratorProvider.prototype.canProvideTelemetry = function (domainObject) {
  return domainObject.type === 'generator';
};

GeneratorProvider.prototype.supportsRequest = GeneratorProvider.prototype.supportsSubscribe =
  GeneratorProvider.prototype.canProvideTelemetry;

GeneratorProvider.prototype.makeWorkerRequest = function (domainObject, request) {
  var props = [
    'amplitude',
    'period',
    'offset',
    'dataRateInHz',
    'randomness',
    'phase',
    'loadDelay',
    'infinityValues',
    'exceedFloat32'
  ];

  request = request || {};

  var workerRequest = {};

  props.forEach(function (prop) {
    if (
      domainObject.telemetry &&
      Object.prototype.hasOwnProperty.call(domainObject.telemetry, prop)
    ) {
      workerRequest[prop] = domainObject.telemetry[prop];
    }

    if (request && Object.prototype.hasOwnProperty.call(request, prop)) {
      workerRequest[prop] = request[prop];
    }

    if (!Object.prototype.hasOwnProperty.call(workerRequest, prop)) {
      workerRequest[prop] = REQUEST_DEFAULTS[prop];
    }

    workerRequest[prop] = Number(workerRequest[prop]);
  });

  workerRequest.id = this.openmct.objects.makeKeyString(domainObject.identifier);
  workerRequest.name = domainObject.name;

  return workerRequest;
};

GeneratorProvider.prototype.request = function (domainObject, request) {
  var workerRequest = this.makeWorkerRequest(domainObject, request);
  workerRequest.start = request.start;
  workerRequest.end = request.end;
  workerRequest.size = request.size;
  workerRequest.strategy = request.strategy;

  return this.workerInterface.request(workerRequest);
};

GeneratorProvider.prototype.subscribe = function (domainObject, callback) {
  var workerRequest = this.makeWorkerRequest(domainObject, {});

  return this.workerInterface.subscribe(workerRequest, callback);
};
