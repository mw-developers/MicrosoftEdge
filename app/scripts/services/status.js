'use strict';

angular.module('statusieApp')
    .service('Status', ['$http', '$q', function Status($http, $q) {
        //We can load it locally using /static/features.json
        var chromeStatusURL = 'http://www.chromestatus.com/features.json';

        //TODO: load this from a remote url
        var ieStatusURL = '/static/ie-status.json';
        var observedBrowsers = _.map(['Chrome', 'Firefox', 'Safari', 'Opera'], function(browser){
            return {name: browser, selected: false};
        });
        var chromeStatus ;
        var ieStatus;
        var categories;

        var getChromeStatus = function () {
            return $http.get(chromeStatusURL).then(function (response) {
                var data = response.data;
                var tempCategories = {};

                chromeStatus = {};

                _.forEach(data,function (item) {
                    item.category = item.category.replace(/[^a-zA-Z0-9]/g, ''); //Remove Whitespace
                    chromeStatus[item.name] = item;
                    tempCategories[item.category] = {
                        name: item.category,
                        selected: false
                    };
                });

                categories = _.toArray(tempCategories);

                return chromeStatus;
            });
        };

        var getIEStatus = function () {
            return $http.get(ieStatusURL).then(function (response) {
                ieStatus = response.data;
                return ieStatus;
            });
        };

        var mergeData = function () {
            var deferred = $q.defer();

            setTimeout(function () {
                _.forOwn(ieStatus, function (val, key) {
                    if (chromeStatus[key]) {
                        chromeStatus[key].ie_status = val;
                    }
                });

                deferred.resolve({
                    features: chromeStatus,
                    categories: categories,
                    browsers: observedBrowsers
                });
            }, 0);

            return deferred.promise;
        };

        var load = function () {
            return getChromeStatus()
                .then(getIEStatus)
                .then(mergeData);
        };

        return {
            load: load
        };
    }]);