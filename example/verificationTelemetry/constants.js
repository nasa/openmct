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

export const VERIFICATION_NAMESPACE = 'example.verificationTelemetry';
export const ROOT_KEY = 'root';
export const CAPSULE_KEY = 'sample-verification-capsule';
export const STREAM_KEY = 'sample-verification-events';

export const CAPSULE_TYPE = `${VERIFICATION_NAMESPACE}.capsule`;
export const STREAM_TYPE = `${VERIFICATION_NAMESPACE}.stream`;

export const ROOT_IDENTIFIER = {
  namespace: VERIFICATION_NAMESPACE,
  key: ROOT_KEY
};

export const CAPSULE_IDENTIFIER = {
  namespace: VERIFICATION_NAMESPACE,
  key: CAPSULE_KEY
};

export const STREAM_IDENTIFIER = {
  namespace: VERIFICATION_NAMESPACE,
  key: STREAM_KEY
};

export const LAYER_CODES = {
  capsule: 0,
  core: 1,
  lineage: 2,
  replay: 3,
  sidecar: 4,
  semantic: 5,
  witness: 6,
  challenge: 7,
  display: 8,
  external: 9
};

export const STATUS_CODES = {
  valid: 1,
  warning: 0,
  invalid: -1,
  rejected: -2,
  expected_failure: -3,
  unexpected_failure: -4,
  unknown: -9,
  not_applicable: -10
};

export const SEVERITY_CODES = {
  nominal: 1,
  info: 0,
  caution: -1,
  warning: -2,
  critical: -3
};

export const TELEMETRY_VALUES = [
  {
    key: 'utc',
    name: 'Event Time',
    format: 'utc',
    hints: {
      domain: 1
    }
  },
  {
    key: 'status_code',
    name: 'Status Code',
    format: 'integer',
    hints: {
      range: 1
    }
  },
  {
    key: 'layer_code',
    name: 'Layer Code',
    format: 'integer'
  },
  {
    key: 'severity_code',
    name: 'Severity Code',
    format: 'integer'
  },
  {
    key: 'event_type',
    name: 'Event Type',
    format: 'string'
  },
  {
    key: 'layer',
    name: 'Layer',
    format: 'string'
  },
  {
    key: 'status',
    name: 'Status',
    format: 'string'
  },
  {
    key: 'summary',
    name: 'Summary',
    format: 'string',
    hints: {
      label: 0
    }
  }
];
