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

import { LAYER_CODES, SEVERITY_CODES, STATUS_CODES } from './constants.js';

const MAX_TEXT_LENGTH = 4096;

export function sanitizeText(value, limit = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/[&<>]/g, (character) => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
      }[character];
    })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function statusToCode(status) {
  return STATUS_CODES[status] ?? STATUS_CODES.unknown;
}

export function layerToCode(layer) {
  return LAYER_CODES[layer] ?? LAYER_CODES.external;
}

export function severityToCode(severity) {
  return SEVERITY_CODES[severity] ?? SEVERITY_CODES.info;
}

export function toOpenMctDatum(event) {
  const timestamp = Number(event.timestamp);
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : 0;

  return {
    utc: safeTimestamp,
    timestamp: safeTimestamp,
    status_code: statusToCode(event.status),
    layer_code: layerToCode(event.layer),
    severity_code: severityToCode(event.severity),
    event_id: sanitizeText(event.event_id, 256),
    event_type: sanitizeText(event.event_type, 256),
    layer: sanitizeText(event.layer, 128),
    status: sanitizeText(event.status, 128),
    severity: sanitizeText(event.severity, 128),
    artifact: sanitizeText(event.artifact, 512),
    artifact_digest: sanitizeText(event.artifact_digest, 256),
    capsule_id: sanitizeText(event.capsule_id, 256),
    branch_id: sanitizeText(event.branch_id, 256),
    replay_fingerprint: sanitizeText(event.replay_fingerprint, 256),
    packet_digest: sanitizeText(event.packet_digest, 256),
    witness_id: sanitizeText(event.witness_id, 256),
    mutation_id: sanitizeText(event.mutation_id, 256),
    summary: sanitizeText(event.summary),
    raw: event
  };
}

export function normalizeEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map(toOpenMctDatum)
    .sort((left, right) => left.utc - right.utc || left.event_id.localeCompare(right.event_id));
}
