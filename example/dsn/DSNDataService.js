/**
 * DSN Data Service
 * Polls the NASA Deep Space Network real-time XML feed and provides
 * parsed telemetry data for all stations, dishes, signals, and targets.
 *
 * Data source: https://eyes.nasa.gov/dsn/data/dsn.xml
 */

const DSN_DATA_URL = '/dsn-api/dsn.xml';
const DSN_CONFIG_URL = '/dsn-config/config.xml';
const POLL_INTERVAL_MS = 5000;

export default class DSNDataService {
  constructor() {
    this._listeners = new Map();
    this._latestData = null;
    this._spacecraftNames = {};
    this._pollTimer = null;
    this._subscriberCount = 0;
    this._configLoaded = false;
  }

  async _loadConfig() {
    if (this._configLoaded) {
      return;
    }

    try {
      const response = await fetch(`${DSN_CONFIG_URL}?r=${Date.now()}`);
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      const spacecraftElements = xml.querySelectorAll('spacecraft');
      spacecraftElements.forEach((sc) => {
        const name = sc.getAttribute('name');
        const friendlyName = sc.getAttribute('friendlyName');

        if (name && friendlyName) {
          this._spacecraftNames[name.toUpperCase()] = friendlyName;
        }
      });

      this._configLoaded = true;
    } catch (error) {
      console.warn('DSN: Failed to load config.xml, using short codes:', error);
    }
  }

  getSpacecraftName(code) {
    if (!code) {
      return '';
    }

    return this._spacecraftNames[code.toUpperCase()] || code;
  }

  async fetchData() {
    const response = await fetch(`${DSN_DATA_URL}?r=${Date.now()}`);
    const text = await response.text();

    return this._parseXML(text);
  }

  _parseXML(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const data = {
      timestamp: 0,
      stations: {},
      dishes: {}
    };

    const timestampEl = xml.querySelector('timestamp');

    if (timestampEl) {
      data.timestamp = parseInt(timestampEl.textContent, 10);
    }

    let currentStation = null;
    const children = xml.documentElement.children;

    for (let i = 0; i < children.length; i++) {
      const el = children[i];

      if (el.tagName === 'station') {
        currentStation = {
          name: el.getAttribute('name'),
          friendlyName: el.getAttribute('friendlyName'),
          timeUTC: parseInt(el.getAttribute('timeUTC'), 10),
          timeZoneOffset: parseFloat(el.getAttribute('timeZoneOffset'))
        };
        data.stations[currentStation.name] = currentStation;
      } else if (el.tagName === 'dish') {
        const dish = this._parseDish(el, data.timestamp);

        if (currentStation) {
          dish.station = currentStation.name;
          dish.stationFriendlyName = currentStation.friendlyName;
        }

        data.dishes[dish.name] = dish;
      }
    }

    return data;
  }

  _parseDish(el, timestamp) {
    const dish = {
      name: el.getAttribute('name'),
      azimuthAngle: parseFloat(el.getAttribute('azimuthAngle')) || 0,
      elevationAngle: parseFloat(el.getAttribute('elevationAngle')) || 0,
      windSpeed: parseFloat(el.getAttribute('windSpeed')) || 0,
      isMSPA: el.getAttribute('isMSPA') === 'true',
      isArray: el.getAttribute('isArray') === 'true',
      isDDOR: el.getAttribute('isDDOR') === 'true',
      activity: el.getAttribute('activity') || '',
      upSignals: [],
      downSignals: [],
      targets: [],
      timestamp: timestamp
    };

    el.querySelectorAll('upSignal').forEach((sig) => {
      dish.upSignals.push({
        active: sig.getAttribute('active') === 'true',
        signalType: sig.getAttribute('signalType') || 'none',
        dataRate: parseFloat(sig.getAttribute('dataRate')) || 0,
        frequency: parseFloat(sig.getAttribute('frequency')) || 0,
        band: sig.getAttribute('band') || '',
        power: parseFloat(sig.getAttribute('power')) || 0,
        spacecraft: sig.getAttribute('spacecraft') || '',
        spacecraftId: parseInt(sig.getAttribute('spacecraftID'), 10) || 0
      });
    });

    el.querySelectorAll('downSignal').forEach((sig) => {
      dish.downSignals.push({
        active: sig.getAttribute('active') === 'true',
        signalType: sig.getAttribute('signalType') || 'none',
        dataRate: parseFloat(sig.getAttribute('dataRate')) || 0,
        frequency: parseFloat(sig.getAttribute('frequency')) || 0,
        band: sig.getAttribute('band') || '',
        power: parseFloat(sig.getAttribute('power')) || 0,
        spacecraft: sig.getAttribute('spacecraft') || '',
        spacecraftId: parseInt(sig.getAttribute('spacecraftID'), 10) || 0
      });
    });

    el.querySelectorAll('target').forEach((t) => {
      dish.targets.push({
        name: t.getAttribute('name') || '',
        id: parseInt(t.getAttribute('id'), 10) || 0,
        uplegRange: parseFloat(t.getAttribute('uplegRange')) || -1,
        downlegRange: parseFloat(t.getAttribute('downlegRange')) || -1,
        rtlt: parseFloat(t.getAttribute('rtlt')) || -1
      });
    });

    return dish;
  }

  getDishTelemetry(dishName) {
    if (!this._latestData || !this._latestData.dishes[dishName]) {
      return null;
    }

    const dish = this._latestData.dishes[dishName];

    const activeDown = dish.downSignals.find((s) => s.active) || dish.downSignals[0] || {};
    const activeUp = dish.upSignals.find((s) => s.active) || dish.upSignals[0] || {};
    const primaryTarget =
      dish.targets.find((t) => t.name !== 'DSN' && t.id !== 99) || dish.targets[0] || {};

    return {
      timestamp: dish.timestamp,
      name: dish.name,
      station: dish.stationFriendlyName || dish.station || '',
      azimuthAngle: dish.azimuthAngle,
      elevationAngle: dish.elevationAngle,
      windSpeed: dish.windSpeed,
      activity: dish.activity,
      isMSPA: dish.isMSPA,
      isArray: dish.isArray,
      isDDOR: dish.isDDOR,
      downSignalActive: activeDown.active || false,
      downSignalDataRate: activeDown.dataRate || 0,
      downSignalBand: activeDown.band || '',
      downSignalPower: activeDown.power || 0,
      upSignalActive: activeUp.active || false,
      upSignalDataRate: activeUp.dataRate || 0,
      upSignalBand: activeUp.band || '',
      upSignalPower: activeUp.power || 0,
      targetName: this.getSpacecraftName(primaryTarget.name) || '',
      targetId: primaryTarget.id || 0,
      targetUplegRange: primaryTarget.uplegRange || -1,
      targetDownlegRange: primaryTarget.downlegRange || -1,
      targetRTLT: primaryTarget.rtlt || -1
    };
  }

  getLatestData() {
    return this._latestData;
  }

  getStations() {
    if (!this._latestData) {
      return {};
    }

    return this._latestData.stations;
  }

  getDishesForStation(stationName) {
    if (!this._latestData) {
      return [];
    }

    return Object.values(this._latestData.dishes).filter((d) => d.station === stationName);
  }

  subscribe(dishName, callback) {
    if (!this._listeners.has(dishName)) {
      this._listeners.set(dishName, new Set());
    }

    this._listeners.get(dishName).add(callback);
    this._subscriberCount++;
    this._startPolling();

    return () => {
      const listeners = this._listeners.get(dishName);

      if (listeners) {
        listeners.delete(callback);

        if (listeners.size === 0) {
          this._listeners.delete(dishName);
        }
      }

      this._subscriberCount--;

      if (this._subscriberCount <= 0) {
        this._stopPolling();
        this._subscriberCount = 0;
      }
    };
  }

  async _startPolling() {
    if (this._pollTimer) {
      return;
    }

    await this._loadConfig();
    await this._poll();

    this._pollTimer = setInterval(() => this._poll(), POLL_INTERVAL_MS);
  }

  _stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  async _poll() {
    try {
      this._latestData = await this.fetchData();
      this._notifyListeners();
    } catch (error) {
      console.warn('DSN: Poll failed:', error);
    }
  }

  _notifyListeners() {
    for (const [dishName, callbacks] of this._listeners) {
      const telemetry = this.getDishTelemetry(dishName);

      if (telemetry) {
        for (const callback of callbacks) {
          callback(telemetry);
        }
      }
    }
  }
}
