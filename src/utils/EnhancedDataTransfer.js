import uuid from 'uuid';

const ENHANCED_DATA_TRANSFER_TYPE = "openmct/enhanced-data-transfer-id/";

const _enhancedEventData = {};
const _storedPromises = {};

const EnhancedDataTransfer = {
    start: (event) => {
        const eventId = uuid();
        event.dataTransfer.setData(ENHANCED_DATA_TRANSFER_TYPE + eventId, eventId);

        _enhancedEventData[eventId] = {};

        let eventResolve;
        let eventReject;
        const eventPromise = new Promise((resolve, reject) => {
            eventResolve = resolve;
            eventReject = reject;
        });

        _storedPromises[eventId] = eventPromise;

        return {
            setData: EnhancedDataTransfer._setData(eventId),
            finish: () => eventResolve(),
            fail: () => eventReject(),
            eventId
        };
    },
    load: async (event) => {

        const eventId = event.dataTransfer.types
            .filter(type => type.startsWith(ENHANCED_DATA_TRANSFER_TYPE))
            .map(type => type.substring(ENHANCED_DATA_TRANSFER_TYPE.length))[0];

        if (!eventId) {
            throw new Error('Event is not an enhanced data transfer event');
        }

        if (_storedPromises[eventId] !== 'complete') {
            try {
                await _storedPromises[eventId];
                _storedPromises[eventId] = 'complete';
            } catch (err) {
                delete _storedPromises[eventId];
                console.warn(err);

                return err;
            }
        }

        return {
            getData: EnhancedDataTransfer._getData(eventId),
            allData: EnhancedDataTransfer._allData(eventId),
            types: () => Object.keys(_enhancedEventData[eventId]),
            delete: EnhancedDataTransfer._delete(eventId)
        };
    },
    _setData: (eventId) => {
        return (key, value) => {
            _enhancedEventData[eventId][key] = value;
        };
    },
    _getData: (eventId) => {
        return key => _enhancedEventData[eventId][key];
    },
    _allData: (eventId) => {
        return () => _enhancedEventData[eventId];
    },
    _delete: (eventId) => {
        return () => {
            delete _enhancedEventData[eventId];
            delete _storedPromises[eventId];
        };
    },
    isEnhancedDataTransfer: (event) => {
        return event.dataTransfer.types
            .filter(type => type.startsWith(ENHANCED_DATA_TRANSFER_TYPE)).length > 0;
    }
};

Object.freeze(EnhancedDataTransfer);
export default EnhancedDataTransfer;
