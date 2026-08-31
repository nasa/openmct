<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
  <section class="c-verification-telemetry">
    <header class="c-verification-telemetry__header">
      <div>
        <span>Verification Telemetry</span>
        <h1>Provenance and Replay Event Stream</h1>
      </div>
      <div class="c-verification-telemetry__summary" aria-label="Verification summary">
        <div>
          <span>Core</span>
          <b>{{ summary.core }}</b>
        </div>
        <div>
          <span>Replay</span>
          <b>{{ summary.replay }}</b>
        </div>
        <div>
          <span>Semantic Binding</span>
          <b>{{ summary.semantic }}</b>
        </div>
        <div>
          <span>Challenges</span>
          <b>{{ summary.challenge }}</b>
        </div>
      </div>
    </header>

    <section class="c-verification-telemetry__boundary">
      <b>Truth boundary</b>
      <p>
        Displayed verification reports are telemetry. Semantic packet data can explain a verified
        core state, but it does not alter core proof identity.
      </p>
    </section>

    <div class="c-verification-telemetry__filters">
      <label>
        <span>Layer</span>
        <select v-model="layerFilter">
          <option value="all">All</option>
          <option v-for="layer in layers" :key="layer" :value="layer">{{ layer }}</option>
        </select>
      </label>
      <label>
        <span>Status</span>
        <select v-model="statusFilter">
          <option value="all">All</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
        </select>
      </label>
      <label class="c-verification-telemetry__search">
        <span>Search</span>
        <input
          v-model.trim="query"
          type="search"
          placeholder="Digest, branch, mutation, event"
          aria-label="Search verification events"
        />
      </label>
    </div>

    <div class="c-verification-telemetry__body">
      <div class="c-verification-telemetry__table-wrap">
        <table class="c-table c-verification-telemetry__table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Layer</th>
              <th>Event</th>
              <th>Status</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="event in filteredEvents"
              :key="event.event_id"
              :class="eventClass(event)"
              @click="selected = event"
            >
              <td>{{ formatTime(event.utc) }}</td>
              <td>{{ event.layer }}</td>
              <td>{{ event.event_type }}</td>
              <td>{{ event.status }}</td>
              <td>{{ event.summary }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <aside class="c-verification-telemetry__details" aria-live="polite">
        <template v-if="selected">
          <span>Event Details</span>
          <h2>{{ selected.event_type }}</h2>
          <dl>
            <div>
              <dt>Layer</dt>
              <dd>{{ selected.layer }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ selected.status }}</dd>
            </div>
            <div>
              <dt>Artifact</dt>
              <dd>{{ selected.artifact || 'Not applicable' }}</dd>
            </div>
            <div>
              <dt>Digest</dt>
              <dd>{{ selected.artifact_digest || 'Not applicable' }}</dd>
            </div>
            <div>
              <dt>Branch</dt>
              <dd>{{ selected.branch_id || 'Not applicable' }}</dd>
            </div>
            <div>
              <dt>Replay</dt>
              <dd>{{ selected.replay_fingerprint || 'Not applicable' }}</dd>
            </div>
            <div>
              <dt>Packet</dt>
              <dd>{{ selected.packet_digest || 'Not applicable' }}</dd>
            </div>
            <div>
              <dt>Mutation</dt>
              <dd>{{ selected.mutation_id || 'Not applicable' }}</dd>
            </div>
          </dl>
          <pre>{{ selectedJson }}</pre>
        </template>
        <template v-else>
          <span>Event Details</span>
          <h2>Select an event</h2>
          <p>
            Choose a telemetry row to inspect digests, branch identifiers, and rejection traces.
          </p>
        </template>
      </aside>
    </div>
  </section>
</template>

<script>
const EVENT_STATUSES = ['valid', 'warning', 'invalid', 'rejected', 'expected_failure'];

export default {
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      events: [],
      selected: null,
      unsubscribe: null,
      layerFilter: 'all',
      statusFilter: 'all',
      query: ''
    };
  },
  computed: {
    layers() {
      return [...new Set(this.events.map((event) => event.layer).filter(Boolean))].sort();
    },
    statuses() {
      return [...new Set([...EVENT_STATUSES, ...this.events.map((event) => event.status)])].filter(
        Boolean
      );
    },
    filteredEvents() {
      const query = this.query.toLowerCase();
      return this.events.filter((event) => {
        const matchesLayer = this.layerFilter === 'all' || event.layer === this.layerFilter;
        const matchesStatus = this.statusFilter === 'all' || event.status === this.statusFilter;
        const haystack = [
          event.event_type,
          event.summary,
          event.artifact_digest,
          event.branch_id,
          event.replay_fingerprint,
          event.packet_digest,
          event.mutation_id
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return matchesLayer && matchesStatus && (!query || haystack.includes(query));
      });
    },
    summary() {
      return {
        core: this.stateForLayer('core'),
        replay: this.stateForLayer('replay'),
        semantic: this.stateForLayer('semantic'),
        challenge: this.challengeSummary()
      };
    },
    selectedJson() {
      return JSON.stringify(this.selected?.raw || this.selected, null, 2);
    }
  },
  async mounted() {
    this.events = await this.openmct.telemetry.request(this.domainObject, {
      start: Number.MIN_SAFE_INTEGER,
      end: Number.MAX_SAFE_INTEGER
    });
    this.selected = this.events[0] || null;
    this.unsubscribe = this.openmct.telemetry.subscribe(this.domainObject, (event) => {
      this.events = [...this.events.filter((item) => item.event_id !== event.event_id), event].sort(
        (left, right) => left.utc - right.utc || left.event_id.localeCompare(right.event_id)
      );
    });
  },
  unmounted() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    formatTime(value) {
      return new Date(value).toISOString();
    },
    eventClass(event) {
      return {
        'is-warning': event.status === 'warning',
        'is-invalid': ['invalid', 'rejected', 'unexpected_failure'].includes(event.status),
        'is-expected-failure': event.status === 'expected_failure'
      };
    },
    stateForLayer(layer) {
      const event = [...this.events].reverse().find((item) => item.layer === layer);
      return event ? event.status.replaceAll('_', ' ').toUpperCase() : 'NO DATA';
    },
    challengeSummary() {
      const rejected = this.events.filter(
        (event) => event.layer === 'challenge' && event.status === 'expected_failure'
      ).length;
      const unexpected = this.events.filter(
        (event) => event.layer === 'challenge' && event.status === 'unexpected_failure'
      ).length;

      if (unexpected > 0) {
        return `${unexpected} UNEXPECTED`;
      }

      return `${rejected} EXPECTED REJECTIONS`;
    }
  }
};
</script>

<style scoped>
.c-verification-telemetry {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  padding: 16px;
  gap: 12px;
}

.c-verification-telemetry__header {
  display: flex;
  gap: 16px;
  align-items: end;
  justify-content: space-between;
}

.c-verification-telemetry__header span,
.c-verification-telemetry__boundary b,
.c-verification-telemetry__details > span,
.c-verification-telemetry__filters span,
.c-verification-telemetry__summary span {
  color: var(--colorItemTreeFg, #9aa);
  font-size: 0.72rem;
  text-transform: uppercase;
}

.c-verification-telemetry__header h1,
.c-verification-telemetry__details h2 {
  margin: 4px 0 0;
  font-size: 1.25rem;
}

.c-verification-telemetry__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(90px, 1fr));
  border: 1px solid var(--colorInteriorBorder, #2b3034);
}

.c-verification-telemetry__summary div {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px;
  border-right: 1px solid var(--colorInteriorBorder, #2b3034);
}

.c-verification-telemetry__summary div:last-child {
  border-right: 0;
}

.c-verification-telemetry__summary b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c-verification-telemetry__boundary {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-left: 3px solid var(--colorKey, #00bcd4);
  background: var(--colorBodyBg, rgba(255, 255, 255, 0.03));
}

.c-verification-telemetry__boundary p {
  margin: 0;
}

.c-verification-telemetry__filters {
  display: grid;
  grid-template-columns: 160px 180px minmax(220px, 1fr);
  gap: 10px;
}

.c-verification-telemetry__filters label {
  display: grid;
  gap: 4px;
}

.c-verification-telemetry__filters select,
.c-verification-telemetry__filters input {
  width: 100%;
}

.c-verification-telemetry__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.38fr);
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--colorInteriorBorder, #2b3034);
}

.c-verification-telemetry__table-wrap {
  min-width: 0;
  overflow: auto;
}

.c-verification-telemetry__table {
  min-width: 760px;
}

.c-verification-telemetry__table tbody tr {
  cursor: pointer;
}

.c-verification-telemetry__table tbody tr:hover {
  background: var(--colorItemTreeHoverBg, rgba(255, 255, 255, 0.06));
}

.c-verification-telemetry__table td {
  vertical-align: top;
}

.c-verification-telemetry__table .is-warning td {
  color: var(--colorStatusAlert, #e3b341);
}

.c-verification-telemetry__table .is-invalid td {
  color: var(--colorStatusError, #ff5f56);
}

.c-verification-telemetry__table .is-expected-failure td {
  color: var(--colorStatusAvailable, #60d394);
}

.c-verification-telemetry__details {
  min-width: 0;
  overflow: auto;
  padding: 12px;
  border-left: 1px solid var(--colorInteriorBorder, #2b3034);
}

.c-verification-telemetry__details dl {
  display: grid;
  gap: 6px;
  margin: 12px 0;
}

.c-verification-telemetry__details div {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 8px;
}

.c-verification-telemetry__details dt {
  color: var(--colorItemTreeFg, #9aa);
}

.c-verification-telemetry__details dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.c-verification-telemetry__details pre {
  max-height: 320px;
  overflow: auto;
  padding: 10px;
  white-space: pre-wrap;
  border: 1px solid var(--colorInteriorBorder, #2b3034);
}

@media (max-width: 900px) {
  .c-verification-telemetry__header,
  .c-verification-telemetry__body {
    grid-template-columns: 1fr;
  }

  .c-verification-telemetry__header {
    align-items: stretch;
  }

  .c-verification-telemetry__summary,
  .c-verification-telemetry__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .c-verification-telemetry__search {
    grid-column: 1 / -1;
  }

  .c-verification-telemetry__details {
    border-top: 1px solid var(--colorInteriorBorder, #2b3034);
    border-left: 0;
  }
}
</style>
