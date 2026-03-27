/**
 * Orbital Data Service
 *
 * Fetches Two-Line Element (TLE) sets from CelesTrak and uses satellite.js
 * (SGP4 propagation) to compute real-time satellite positions.
 *
 * Data source: CelesTrak NORAD GP Element Sets
 * @see https://celestrak.org/NORAD/elements/
 */

import * as satellite from 'satellite.js';

const CELESTRAK_BASE = '/celestrak-api';
const POSITION_UPDATE_INTERVAL_MS = 1000;

const SATELLITE_GROUPS = [
  { key: 'stations', name: 'Space Stations', url: 'stations' },
  { key: 'visual', name: 'Brightest Satellites', url: 'visual' },
  { key: 'active', name: 'Active Satellites', url: 'active', maxCount: 200 },
  { key: 'weather', name: 'Weather Satellites', url: 'weather' },
  { key: 'gps-ops', name: 'GPS Operational', url: 'gps-ops' },
  { key: 'galileo', name: 'Galileo', url: 'galileo' },
  { key: 'science', name: 'Science Satellites', url: 'science' },
  { key: 'starlink', name: 'Starlink', url: 'starlink', maxCount: 100 }
];

export { SATELLITE_GROUPS };

export default class OrbitalDataService {
  constructor() {
    this._satellites = new Map();
    this._groups = new Map();
    this._listeners = new Map();
    this._subscriberCount = 0;
    this._pollTimer = null;
    this._loadedGroups = new Set();
  }

  async loadGroup(groupKey) {
    if (this._loadedGroups.has(groupKey)) {
      return;
    }

    const group = SATELLITE_GROUPS.find((g) => g.key === groupKey);

    if (!group) {
      return;
    }

    try {
      const response = await fetch(`${CELESTRAK_BASE}/gp.php?GROUP=${group.url}&FORMAT=tle`);
      const tleText = await response.text();
      const satellites = this._parseTLEs(tleText, groupKey, group.maxCount);

      this._groups.set(groupKey, satellites.map((s) => s.id));

      for (const sat of satellites) {
        this._satellites.set(sat.id, sat);
      }

      this._loadedGroups.add(groupKey);
    } catch (error) {
      console.warn(`Orbital: Failed to load group ${groupKey}:`, error);
    }
  }

  _parseTLEs(tleText, groupKey, maxCount) {
    const lines = tleText.trim().split('\n');
    const satellites = [];

    for (let i = 0; i < lines.length - 2; i += 3) {
      if (maxCount && satellites.length >= maxCount) {
        break;
      }

      const name = lines[i].trim();
      const tleLine1 = lines[i + 1].trim();
      const tleLine2 = lines[i + 2].trim();

      if (!tleLine1.startsWith('1 ') || !tleLine2.startsWith('2 ')) {
        continue;
      }

      try {
        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
        const noradId = satrec.satnum;

        satellites.push({
          id: `sat-${noradId}`,
          name: name,
          noradId: noradId,
          group: groupKey,
          satrec: satrec,
          tleLine1: tleLine1,
          tleLine2: tleLine2
        });
      } catch (e) {
        // Skip invalid TLEs
      }
    }

    return satellites;
  }

  getSatellite(satId) {
    return this._satellites.get(satId);
  }

  getSatellitesInGroup(groupKey) {
    const ids = this._groups.get(groupKey);

    if (!ids) {
      return [];
    }

    return ids.map((id) => this._satellites.get(id)).filter(Boolean);
  }

  computePosition(satId, date) {
    const sat = this._satellites.get(satId);

    if (!sat) {
      return null;
    }

    return this._propagate(sat.satrec, date || new Date());
  }

  computeGroundTrack(satId, startDate, periods, pointsPerPeriod) {
    const sat = this._satellites.get(satId);

    if (!sat) {
      return [];
    }

    const periodMinutes = (2 * Math.PI) / sat.satrec.no;
    const totalMinutes = periodMinutes * (periods || 1);
    const numPoints = pointsPerPeriod ? pointsPerPeriod * (periods || 1) : 180;
    const stepMs = (totalMinutes * 60 * 1000) / numPoints;
    const start = startDate || new Date();
    const track = [];

    for (let i = 0; i <= numPoints; i++) {
      const time = new Date(start.getTime() + i * stepMs);
      const pos = this._propagate(sat.satrec, time);

      if (pos) {
        track.push({ ...pos, timestamp: time.getTime() });
      }
    }

    return track;
  }

  _propagate(satrec, date) {
    try {
      const positionAndVelocity = satellite.propagate(satrec, date);
      const positionEci = positionAndVelocity.position;

      if (!positionEci || typeof positionEci === 'boolean') {
        return null;
      }

      const gmst = satellite.gstime(date);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      const longitude = satellite.degreesLong(positionGd.longitude);
      const latitude = satellite.degreesLat(positionGd.latitude);
      const altitude = positionGd.height;

      const velocityEci = positionAndVelocity.velocity;
      let speed = 0;

      if (velocityEci && typeof velocityEci !== 'boolean') {
        speed = Math.sqrt(
          velocityEci.x * velocityEci.x + velocityEci.y * velocityEci.y + velocityEci.z * velocityEci.z
        );
      }

      return {
        latitude,
        longitude,
        altitude,
        speed,
        timestamp: date.getTime()
      };
    } catch (e) {
      return null;
    }
  }

  getTelemetry(satId) {
    const pos = this.computePosition(satId);

    if (!pos) {
      return null;
    }

    const sat = this._satellites.get(satId);

    return {
      ...pos,
      name: sat ? sat.name : satId,
      noradId: sat ? sat.noradId : ''
    };
  }

  subscribe(satId, callback) {
    if (!this._listeners.has(satId)) {
      this._listeners.set(satId, new Set());
    }

    this._listeners.get(satId).add(callback);
    this._subscriberCount++;
    this._startUpdates();

    return () => {
      const listeners = this._listeners.get(satId);

      if (listeners) {
        listeners.delete(callback);

        if (listeners.size === 0) {
          this._listeners.delete(satId);
        }
      }

      this._subscriberCount--;

      if (this._subscriberCount <= 0) {
        this._stopUpdates();
        this._subscriberCount = 0;
      }
    };
  }

  _startUpdates() {
    if (this._pollTimer) {
      return;
    }

    this._pollTimer = setInterval(() => this._notifyListeners(), POSITION_UPDATE_INTERVAL_MS);
  }

  _stopUpdates() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  _notifyListeners() {
    const now = new Date();

    for (const [satId, callbacks] of this._listeners) {
      const telemetry = this.getTelemetry(satId);

      if (telemetry) {
        for (const callback of callbacks) {
          callback(telemetry);
        }
      }
    }
  }
}
