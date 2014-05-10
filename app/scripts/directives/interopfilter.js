angular.module('statusieApp')
    .directive('interopfilter', function () {
        'use strict';
        return {
            templateUrl: '/templates/interopfilter.html',
            replace: true,
            restrict: 'E',
            controller: function (Status, $location, $timeout, $scope) {
                var convertStatus = Status.statuses;


                var search = $location.search();

                var needsFiltering = false;

                var select = function (parameter) {
                    //TODO: sanitize this
                    var options = search[parameter];

                    var addToObject = function (result, key) {
                        result[key] = true;
                        return result;
                    };

                    if (options) {
                        options = _.reduce(options.split(','), addToObject, {});
                    }

                    return function (result, key) {
                        if (options) {
                            result[key] = options[key] || false;
                            needsFiltering = true;
                        } else {
                            result[key] = true;
                        }

                        return result;
                    };
                };

                $scope.iestatus = _.reduce(['notplanned',
                    'underconsideration',
                    'indevelopment',
                    'implemented'], select('iestatuses'), {});


                $scope.browserstatus = _.reduce(['notsupported',
                    'indevelopment',
                    'implemented'], select('browserstatuses'), {});


                $scope.browsers = _.reduce(['chrome',
                    'firefox',
//                    'opera',
                    'safari'], select('browsers'), {});


                if (search['ieversion']) {
                    $scope.ieversion = 'ie' + search['ieversion'];
                } else {
                    $scope.ieversion = 'ie8';
                }


                var getSelected = function (source) {
                    var targetObject = {};

                    _.forOwn(source, function (value, key) {

                        if (value) {
                            targetObject[key] = value;
                        }
                    });
                    return targetObject;
                };

                var applyFilters = function () {
                    var filters = _.toArray(arguments);

                    return function (item) {
                        return _.reduce(filters, function (acum, val) {
                            //If a previous filter has failed we don't want to check
                            if (!acum) {
                                return acum;
                            }

                            var add = val(item);
                            return acum && add;
                        }, true);
                    };
                };

                var ieStatusFilter = function (ieStatuses, ieVersion) {

                    return function (item) {
                        //If no selections, ieStatuses is undefined and we shouldn't apply any IE filter, just add it)
                        var addItem = _.keys(ieStatuses).length === 0;

                        _.forOwn(ieStatuses, function (value, status) {
                            if (convertStatus[status] === convertStatus.implemented) {
                                if ($scope.iestatus.implemented) {
                                    if (_.isNaN(item.browsers.ie.prefixed) && item.browsers.ie.unprefixed >= ieVersion) {
                                        addItem = true;
                                    } else if (item.browsers.ie.prefixed >= ieVersion) {
                                        addItem = true;
                                    }
                                } else {
                                    addItem = true;
                                }
                            } else {
                                if (item.browsers.ie.status === convertStatus[status]) {
                                    addItem = true;
                                }
                            }
                        });

                        return addItem;
                    }
                };

                var interopFilter = function (browserStatuses, browsers) {

                    return function (item) {
                        var addBrowsers = true;
                        if (_.keys(browserStatuses).length === 0) {
                            return true;
                        }
                        _.forOwn(browsers, function (browserValue, browser) {
                            var addBrowser = false;
                            _.forOwn(browserStatuses, function (statusValue, browserStatus) {
                                if (item.browsers[browser].status === convertStatus[browserStatus]) {
                                    addBrowser = true;
                                }
                            });
                            addBrowsers = addBrowsers && addBrowser;
                        });

                        return addBrowsers;
                    };
                };

                var getIEVersion = function () {
                    var ieVersion;
                    if ($scope.ieversion !== 'iedev') {
                        var version = $scope.ieversion.replace(/\D+/, '');
                        ieVersion = parseInt(version, 10);
                    } else {
                        ieVersion = 'iedev';
                    }

                    return ieVersion;
                };

                var updateSearchQuery = function (ieStatuses, ieVersion, browserStatuses, browsers) {
                    $location.search('iestatuses', _.keys(ieStatuses).join(','));
                    $location.search('browserstatuses', _.keys(browserStatuses).join(','));
                    $location.search('browsers', _.keys(browsers).join(','));
                    $location.search('ieversion', ieVersion);
                };

                $scope.browsersDisabled = false;

                var filterFunction = function () {
                    var ieStatuses = getSelected($scope.iestatus);
                    var browsers = getSelected($scope.browsers);
                    var browserStatuses = getSelected($scope.browserstatus);
                    var ieVersion = getIEVersion();
                    var processItem = applyFilters(ieStatusFilter(ieStatuses, ieVersion), interopFilter(browserStatuses, browsers));

                    $scope.browsersDisabled = _.keys(browserStatuses).length === 0;

                    updateSearchQuery(ieStatuses, ieVersion, browserStatuses, browsers);

                    return function (acum, item) {

                        if (processItem(item)) {
                            acum.push(item);
                        }
                        return acum;
                    };
                };

                var filter = function () {
                    $scope.$emit('filterupdated', {
                        name: 'interop',
                        filterFunction: filterFunction()
                    });
                };

                $scope.checkChanged = filter;

                if (needsFiltering) {
                    filter();
                    needsFiltering = false;
                }

            },
            link: function postLink(scope, element) {
                element[0].querySelector('.dropdown-menu').addEventListener('click', function (evt) {
                    evt.stopPropagation();
                });
            }
        };
    }
);
