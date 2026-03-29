/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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

export const SIGNAL_CREATE_MENU_GROUP = 'signals';
export const SIGNAL_DUST_HAZE_TYPE = 'signal.dust-haze';
export const SIGNAL_EARTHQUAKES_TYPE = 'signal.earthquakes';
export const SIGNAL_DROUGHT_TYPE = 'signal.drought';
export const SIGNAL_FLOODS_TYPE = 'signal.floods';
export const SIGNAL_LANDSLIDES_TYPE = 'signal.landslides';
export const SIGNAL_MANMADE_TYPE = 'signal.manmade';
export const SIGNAL_SEA_LAKE_ICE_TYPE = 'signal.sea-lake-ice';
export const SIGNAL_SEVERE_STORMS_TYPE = 'signal.severe-storms';
export const SIGNAL_SNOW_TYPE = 'signal.snow';
export const SIGNAL_TEMPERATURE_EXTREMES_TYPE = 'signal.temperature-extremes';
export const SIGNAL_VOLCANOES_TYPE = 'signal.volcanoes';
export const SIGNAL_WATER_COLOR_TYPE = 'signal.water-color';
export const SIGNAL_WILDFIRES_TYPE = 'signal.wildfires';
export const SIGNAL_GPS_JAMMING_TYPE = 'signal.gps-jamming';
export const SIGNAL_MILITARY_FLIGHTS_TYPE = 'signal.military-flights';
export const SIGNAL_AIS_VESSELS_TYPE = 'signal.ais-vessels';

const SIGNAL_MODULE_DEFINITIONS = {
  [SIGNAL_DUST_HAZE_TYPE]: {
    name: 'Dust and Haze',
    description: 'Active dust and haze monitoring and signals intelligence module',
    module: 'dustHaze',
    source: 'eonet',
    eonetCategory: 'dustHaze',
    cssClass: 'icon-image',
    subtitle: 'Active dust and haze monitoring (NASA EONET)',
    loadingMessage: 'Loading dust and haze data...',
    emptyMessage: 'No active dust and haze events were returned.'
  },
  [SIGNAL_EARTHQUAKES_TYPE]: {
    name: 'Earthquakes',
    description: 'Real-time earthquake monitoring and signals intelligence module',
    module: 'earthquakes',
    source: 'usgs',
    cssClass: 'icon-event',
    subtitle: 'Real-time earthquake monitoring (USGS)',
    loadingMessage: 'Loading earthquake data...',
    emptyMessage: 'No earthquake events in the past hour.'
  },
  [SIGNAL_DROUGHT_TYPE]: {
    name: 'Drought',
    description: 'Active drought monitoring and signals intelligence module',
    module: 'drought',
    source: 'eonet',
    eonetCategory: 'drought',
    cssClass: 'icon-tabs-view',
    subtitle: 'Active drought monitoring (NASA EONET)',
    loadingMessage: 'Loading drought data...',
    emptyMessage: 'No active drought events were returned.'
  },
  [SIGNAL_FLOODS_TYPE]: {
    name: 'Floods',
    description: 'Active flood monitoring and signals intelligence module',
    module: 'floods',
    source: 'eonet',
    eonetCategory: 'floods',
    cssClass: 'icon-plan',
    subtitle: 'Active flood monitoring (NASA EONET)',
    loadingMessage: 'Loading flood data...',
    emptyMessage: 'No active flood events were returned.'
  },
  [SIGNAL_LANDSLIDES_TYPE]: {
    name: 'Landslides',
    description: 'Active landslide monitoring and signals intelligence module',
    module: 'landslides',
    source: 'eonet',
    eonetCategory: 'landslides',
    cssClass: 'icon-object',
    subtitle: 'Active landslide monitoring (NASA EONET)',
    loadingMessage: 'Loading landslide data...',
    emptyMessage: 'No active landslide events were returned.'
  },
  [SIGNAL_MANMADE_TYPE]: {
    name: 'Manmade',
    description: 'Active manmade event monitoring and signals intelligence module',
    module: 'manmade',
    source: 'eonet',
    eonetCategory: 'manmade',
    cssClass: 'icon-object-unknown',
    subtitle: 'Active manmade event monitoring (NASA EONET)',
    loadingMessage: 'Loading manmade event data...',
    emptyMessage: 'No active manmade events were returned.'
  },
  [SIGNAL_SEA_LAKE_ICE_TYPE]: {
    name: 'Sea and Lake Ice',
    description: 'Active sea and lake ice monitoring and signals intelligence module',
    module: 'seaLakeIce',
    source: 'eonet',
    eonetCategory: 'seaLakeIce',
    cssClass: 'icon-clock',
    subtitle: 'Active sea and lake ice monitoring (NASA EONET)',
    loadingMessage: 'Loading sea and lake ice data...',
    emptyMessage: 'No active sea and lake ice events were returned.'
  },
  [SIGNAL_SEVERE_STORMS_TYPE]: {
    name: 'Severe Storms',
    description: 'Active severe storm monitoring and signals intelligence module',
    module: 'severeStorms',
    source: 'eonet',
    eonetCategory: 'severeStorms',
    cssClass: 'icon-timer',
    subtitle: 'Active severe storm monitoring (NASA EONET)',
    loadingMessage: 'Loading severe storm data...',
    emptyMessage: 'No active severe storm events were returned.'
  },
  [SIGNAL_SNOW_TYPE]: {
    name: 'Snow',
    description: 'Active snow monitoring and signals intelligence module',
    module: 'snow',
    source: 'eonet',
    eonetCategory: 'snow',
    cssClass: 'icon-layout',
    subtitle: 'Active snow monitoring (NASA EONET)',
    loadingMessage: 'Loading snow data...',
    emptyMessage: 'No active snow events were returned.'
  },
  [SIGNAL_TEMPERATURE_EXTREMES_TYPE]: {
    name: 'Temperature Extremes',
    description: 'Active temperature extremes monitoring and signals intelligence module',
    module: 'tempExtremes',
    source: 'eonet',
    eonetCategory: 'tempExtremes',
    cssClass: 'icon-conditional',
    subtitle: 'Active temperature extremes monitoring (NASA EONET)',
    loadingMessage: 'Loading temperature extremes data...',
    emptyMessage: 'No active temperature extremes events were returned.'
  },
  [SIGNAL_VOLCANOES_TYPE]: {
    name: 'Volcanoes',
    description: 'Active volcano monitoring and signals intelligence module',
    module: 'volcanoes',
    source: 'eonet',
    eonetCategory: 'volcanoes',
    cssClass: 'icon-circle',
    subtitle: 'Active volcano monitoring (NASA EONET)',
    loadingMessage: 'Loading volcano data...',
    emptyMessage: 'No active volcano events were returned.'
  },
  [SIGNAL_WATER_COLOR_TYPE]: {
    name: 'Water Color',
    description: 'Active water color monitoring and signals intelligence module',
    module: 'waterColor',
    source: 'eonet',
    eonetCategory: 'waterColor',
    cssClass: 'icon-page',
    subtitle: 'Active water color monitoring (NASA EONET)',
    loadingMessage: 'Loading water color data...',
    emptyMessage: 'No active water color events were returned.'
  },
  [SIGNAL_WILDFIRES_TYPE]: {
    name: 'Wildfires',
    description: 'Active wildfire monitoring and signals intelligence module',
    module: 'wildfires',
    source: 'eonet',
    eonetCategory: 'wildfires',
    cssClass: 'icon-bell',
    subtitle: 'Active wildfire monitoring (NASA EONET)',
    loadingMessage: 'Loading wildfire data...',
    emptyMessage: 'No active wildfire events were returned.'
  },
  [SIGNAL_GPS_JAMMING_TYPE]: {
    name: 'GPS Jamming',
    description: 'Global GPS interference and spoofing detection Signal module',
    module: 'gpsJamming',
    source: 'gpsjam',
    cssClass: 'icon-crosshair',
    subtitle: 'Global GPS interference monitoring (GPSJam)',
    loadingMessage: 'Loading GPS jamming data...',
    emptyMessage: 'No GPS jamming above threshold detected.'
  },
  [SIGNAL_MILITARY_FLIGHTS_TYPE]: {
    name: 'Military Flights',
    description: 'Military aircraft tracking Signal module via OpenSky Network',
    module: 'militaryFlights',
    source: 'opensky',
    cssClass: 'icon-arrow-tall-up',
    subtitle: 'Military aircraft tracking (OpenSky Network via relay)',
    loadingMessage: 'Loading military flight data...',
    emptyMessage: 'No flight data available. Relay server may not be running.'
  },
  [SIGNAL_AIS_VESSELS_TYPE]: {
    name: 'AIS Vessels',
    description: 'Maritime vessel tracking Signal module via AISStream',
    module: 'aisVessels',
    source: 'ais',
    cssClass: 'icon-sine',
    subtitle: 'Maritime vessel tracking (AISStream via relay)',
    loadingMessage: 'Loading vessel data...',
    emptyMessage: 'No vessel data available. Relay server may not be running.'
  }
};

function buildSignalTypeDefinition(typeKey) {
  const moduleDefinition = SIGNAL_MODULE_DEFINITIONS[typeKey];

  return {
    name: moduleDefinition.name,
    description: moduleDefinition.description,
    creatable: true,
    cssClass: moduleDefinition.cssClass,
    createMenuGroup: SIGNAL_CREATE_MENU_GROUP,
    initialize(domainObject) {
      domainObject.composition = [];
      domainObject.configuration = {
        module: moduleDefinition.module,
        mapMode: 'flat'
      };
    }
  };
}

export function getSignalModuleTypeDefinitions() {
  return Object.entries(SIGNAL_MODULE_DEFINITIONS).map(([typeKey]) => {
    return [typeKey, buildSignalTypeDefinition(typeKey)];
  });
}

export function getSignalModuleDefinition(typeKey) {
  return SIGNAL_MODULE_DEFINITIONS[typeKey];
}

export function isSignalModuleType(typeKey) {
  return Object.prototype.hasOwnProperty.call(SIGNAL_MODULE_DEFINITIONS, typeKey);
}
