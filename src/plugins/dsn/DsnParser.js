
define([], function () {
    'use strict';

    /**
     * Construct a new Deep Space Network parser.
     *
     * @memberof plugins/dsn
     * @constructor
     */
    function DsnParser() {

    }

    function parseStationTag(stationElement) {
        var key = stationElement.getAttribute('name'),
            station = {};

        station[key + '.name'] = stationElement.getAttribute('name');
        station[key + '.friendly.name'] = stationElement.getAttribute('friendlyName');
        station[key + '.utc.time'] = parseInt(stationElement.getAttribute('timeUTC'), 10);
        station[key + '.time.zone.offset'] = parseInt(stationElement.getAttribute('timeZoneOffset'), 10);

        return station;
    }

    function parseDishTag(dishElement) {
        var children = dishElement.children,
            key,
            dish = {};

        key = dishElement.getAttribute('name').toLowerCase();

        dish[key + '.name'] = dishElement.getAttribute('name');
        dish[key + '.azimuth.angle'] = dishElement.getAttribute('azimuthAngle');
        dish[key + '.elevation.angle'] = dishElement.getAttribute('elevationAngle');
        dish[key + '.wind.speed'] = dishElement.getAttribute('windSpeed');
        dish[key + '.mspa'] = dishElement.getAttribute('isMSPA');
        dish[key + '.array'] = dishElement.getAttribute('isArray');
        dish[key + '.ddor'] = dishElement.getAttribute('isDDOR');
        dish[key + '.created'] = dishElement.getAttribute('created');
        dish[key + '.updated'] = dishElement.getAttribute('updated');
        dish[key + '.downSignals'] = [];
        dish[key + '.upSignals'] = [];
        dish[key + '.targets'] = [];

        for (var i = 0; i < children.length; i++) {
            var child = children[i];

            switch (child.tagName) {
                case 'downSignal':
                    dish[key + '.downSignals'].push({
                        'signal.type':       child.getAttribute('signalType'),
                        'signal.type.debug': child.getAttribute('signalTypeDebug'),
                        'data.rate':         child.getAttribute('dataRate'),
                        'frequency':         child.getAttribute('frequency'),
                        'power':             child.getAttribute('power'),
                        'spacecraft':        child.getAttribute('spacecraft'),
                        'spacecraft.id':     child.getAttribute('spacecraftId')
                    });
                    break;
                case 'upSignal':
                    dish[key + '.upSignals'].push({
                        'signal.type':       child.getAttribute('signalType'),
                        'signal.type.debug': child.getAttribute('signalTypeDebug'),
                        'data.rate':         child.getAttribute('dataRate'),
                        'frequency':         child.getAttribute('frequency'),
                        'power':             child.getAttribute('power'),
                        'spacecraft':        child.getAttribute('spacecraft'),
                        'spacecraft.id':     child.getAttribute('spacecraftId')
                    });
                    break;
                case 'target':
                    dish[key + '.targets'].push({
                        'name':          child.getAttribute('name'),
                        'id':            child.getAttribute('id'),
                        'upleg.range':   child.getAttribute('uplegRange'),
                        'downleg.range': child.getAttribute('downlegRange'),
                        'rtlt':          child.getAttribute('rtlt')
                    });
                    break;
            }
        }

        return dish;
    }

    function parseTimestampTag(element) {
        return element.textContent;
    }

    /**
     * Parses the station, dish and timestamp tags contained in the
     * Deep Space Network's XML.
     *
     * @param {Document} xmlDocument - The XML document representing the Deep Space Network's data.
     * @returns {Object} The parsed XML as an object with properties that match the
     * values of domain object identifier keys.
     */
    DsnParser.prototype.parseXml = function (xmlDocument) {
        var dsn = {},
            dsnElements = xmlDocument.documentElement.children;

        for (var i = 0; i < dsnElements.length; i++) {
            var element = dsnElements[i];

            switch (element.tagName) {
                case 'station':
                    Object.assign(dsn, parseStationTag(element));
                    break;
                case 'dish':
                    Object.assign(dsn, parseDishTag(element));
                    break;
                case 'timestamp':
                    dsn.timestamp = parseTimestampTag(element);
            }
        }

        return dsn;
    };

    return DsnParser;
});
