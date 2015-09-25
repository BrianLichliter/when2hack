
// Meteor automatically adds all js files inside
// Note: renaming to app.ng.js seeems to make Meteor.isServer part not work

Events = new Mongo.Collection("events");

// everything here will only run on the client side
if (Meteor.isClient) {
  console.log("reached");
  angular.module('when2hack',['angular-meteor', 'ui.router']);

  angular.module('when2hack').config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
    function($urlRouterProvider, $stateProvider, $locationProvider){

      $locationProvider.html5Mode(true);

      $stateProvider
          .state('event', {
            url: '/event',
            templateUrl: 'event-main.ng.html',
            controller: 'EventCtrl'
          })
          .state('eventDetails', {
            url: '/event/:eventName',
            templateUrl: 'event-details.ng.html',
            controller: 'EventDetailsCtrl'
          })
      $urlRouterProvider.otherwise("/event");
    }]);

  angular.module('when2hack').controller('EventCtrl', function ($scope, $meteor, $state, $rootScope) {
    $rootScope.user = {};
    $scope.user = $rootScope.user;

    // all changes made to $scope.parties will have effect on the Parties DB as well
    $scope.events = $meteor.collection(Events);
    $scope.createEvent = function() {
        if ( $rootScope.user.name == "" )
        {
          //note: should also make sure that event name && date combination is unique
          alert("username required!");
          return;
        }
        $scope.events.push($scope.newEvent);
        $state.go("eventDetails", { eventName: $scope.newEvent.name });
    };
  });

  angular.module('when2hack').controller('EventDetailsCtrl', function ($scope, $meteor, $stateParams, $rootScope) {
    $scope.event = $meteor.object(Events, { name: $stateParams.eventName }, true);
    $scope.user = $rootScope.user;
    $scope.timeUnits = {"0900":true,"0915":false,"0930":false,"0945":false};
    console.log($scope.timeUnits)

    // possible values are select and unselect
    $scope.selectionType = true;
    // possible values are true and false
    $scope.selectionStarted = false;
    $scope.startTime = 0;
    $scope.endTime = 0;

    angular.element(document).bind('mouseup', function(){
        $scope.selectionStarted = false;
        console.log("ending selection")
    });

    $scope.startSelection = function( timeUnit ) {
      console.log("starting selection")
      $scope.selectionType = !$scope.timeUnits[timeUnit];
      $scope.timeUnits[timeUnit] = $scope.selectionType;
      $scope.selectionStarted = true;
      $scope.startTime = timeUnit;
      $scope.endTime = timeUnit;
    };
    $scope.updateSelection = function( timeUnit ) {
      console.log("updating selection")
        if ( !$scope.selectionStarted ) {
          return;
        } else {
          if (timeUnit < $scope.startTime) {
            $scope.startTime = timeUnit
          } else if (timeUnit > $scope.startTime){
            $scope.endTime = timeUnit;
          }
          if (timeUnit <= $scope.endTime && timeUnit >= $scope.startTime) {
            $scope.timeUnits[timeUnit] = $scope.selectionType;
          }
        }
    };
    $scope.cellClass = function( timeUnit ) {
      if ($scope.timeUnits[timeUnit]) {
        return "avail";
      } else {
        return "";
      }
    };
  });
}