// To do:
//    use moment to format timestamp
//    seperate functions for loading history and realtime imagery
//    wait to display images until after load

define(
  ['moment'], 
  function (moment) {
     
    function ImageryTimelineController($scope, openmct) {
        $scope.images = [];
        this.$scope = $scope;
        this.openmct = openmct;
        this.date = "";
        this.time = "";
        this.zone = "";
        this.imageUrl = "";
        this.history = {};
        
        this.subscribe = this.subscribe.bind(this);
        this.updateValues = this.updateValues.bind(this);
        
        // Subscribes to telemetry when domain objec is available
        this.subscribe(this.$scope.domainObject);
        this.$scope.$on("$destroy", this.stopListening);
        
    }

    ImageryTimelineController.prototype.subscribe = function (domainObject) {
        this.date = "";
        this.imageUrl = "";
        this.openmct.objects.get(domainObject.getId())
            .then(function (object) {
                this.domainObject = object;
                var metadata = this.openmct
                    .telemetry
                    .getMetadata(this.domainObject);
                var timeKey = this.openmct.time.timeSystem().key;
                this.timeFormat = this.openmct
                    .telemetry
                    .getValueFormatter(metadata.value(timeKey));
                this.imageFormat = this.openmct
                    .telemetry
                    .getValueFormatter(metadata.valuesForHints(['image'])[0]);
                this.unsubscribe = this.openmct.telemetry
                    .subscribe(this.domainObject, this.updateValues);
                this.openmct.telemetry
                    .request(this.domainObject, {
                        strategy: 'all',
                        start: Date.now(),
                        end: Date.now() + 90000 // for testing purposes, gets full image
                                                // set (17 images, 5000ms between each)
                    })
                .then(function (values) {
                    values.forEach(function(datum) {
                        this.updateValues(datum);
                    }.bind(this));
                }.bind(this));
            }.bind(this));
    };
    
    ImageryTimelineController.prototype.updateValues = function (datum) {
        if (this.isPaused) {
            this.nextDatum = datum;
            return;
        }
        this.$scope.images.push(datum);
        this.time = this.timeFormat.format(datum);
        this.imageUrl = this.imageFormat.format(datum);
    };
    
    ImageryTimelineController.prototype.stopListening = function () {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }
    }; 
    return ImageryTimelineController;
});