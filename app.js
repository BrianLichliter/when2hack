
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

  angular.module('when2hack').controller('EventCtrl', ['$scope', '$meteor', '$state', '$stateParams', '$rootScope', function ($scope, $meteor, $state, $stateParams, $rootScope) {
    $rootScope.user = { name: "" };
    $scope.user = $rootScope.user;

    // all changes made to $scope.parties will have effect on the Parties DB as well
    $scope.events = $meteor.collection(Events);
    $scope.removeEvent = function(event) {
      $scope.events.remove(event._id);
    };
    $scope.createEvent = function() {
        if ( $rootScope.user.name == "" )
        {
          //note: should also make sure that event name && date combination is unique
          alert("username required!");
          return;
        }
        
        $scope.newEvent.timeUnits = {'9:00 AM':[],'10:00 AM':[],'11:00 AM':[],'12:00 PM':[],'1:00 PM':[],'2:00 PM':[],'3:00 PM':[],'4:00 PM':[],'5:00 PM':[]}
        $scope.events.push($scope.newEvent);
        $state.go("eventDetails", { eventName: $scope.newEvent.name });
    };
  }]);

  angular.module('when2hack').controller('EventDetailsCtrl',
      ['$scope', '$meteor', '$stateParams', '$rootScope', "$location", function ($scope, $meteor, $stateParams, $rootScope, $location) {

        $scope.curURL = $location.absUrl();
    $scope.event = $scope.$meteorObject(Events, { name: $stateParams.eventName }, true);
    // currently resets availability of those logging back in... should change
    $scope.timeUnits = {'9:00 AM':false,'10:00 AM':false,'11:00 AM':false,'12:00 PM':false,'1:00 PM':false,'2:00 PM':false,'3:00 PM':false,'4:00 PM':false,'5:00 PM':false};

        //make sure that if logging in with same name, the user's availabile slots
        //are carried over from previous selection
        $scope.$watch(function() { return $rootScope.user.name; },  function( newvalue, oldvalue ) {
          if ( newvalue === undefined ) return;
          console.log("username has changed! user:" + newvalue);
          angular.forEach($scope.event.timeUnits, function(usersForTime, time) {
            if ( usersForTime.indexOf( newvalue ) >= 0 )
              $scope.timeUnits[ time ] = true;
          });
        });

    // possible values are select and unselect
    $scope.selectionType = true;
    // possible values are true and false
    $scope.selectionStarted = false;
    // start and end times of our selection
    $scope.startTime = 0;
    $scope.endTime = 0;

    angular.element(document).bind('mouseup', function(){
        $scope.selectionStarted = false;
        console.log("ending selection");
        $scope.updateEvent();
    });

    $scope.updateEvent = function() {
      angular.forEach($scope.event.timeUnits, function(usersForTime, time) {
        if($scope.timeUnits[time]) {
          var idx = usersForTime.indexOf($scope.user.name);
          if (idx < 0)
            usersForTime.push($scope.user.name);
        }
        else {
          var idx = usersForTime.indexOf($scope.user.name);
          if (idx >= 0)
            usersForTime.splice(idx, 1);
        }
      });
      $scope.$apply();
    };

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
        return "success";
      } else {
        return "";
      }
    };

        $scope.groupAvailClass = function( timeUnit ) {
          var maxAvail = 0;
          var all_user_names = [];
          var user_name;
          angular.forEach($scope.event.timeUnits, function(usersForTime, time) { //note: (value, key)
            if ( usersForTime.length > maxAvail )
              maxAvail = usersForTime.length;

            for ( var i = 0; i < usersForTime.length; ++i ) {
              user_name = usersForTime[i];
              if ( all_user_names.indexOf( user_name ) < 0 )
                all_user_names.push( user_name );
            }
          });

          //colour: time with everyone inside
          if ( $scope.event.timeUnits[timeUnit].length == all_user_names.length )
            return "avail_all";

          //colour: time with highest number of people
          if ( $scope.event.timeUnits[timeUnit].length == maxAvail )
            return "avail_max";
          return "";
        };
  }]);
}