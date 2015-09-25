
// Meteor automatically adds all js files inside
// Note: renaming to app.ng.js seeems to make Meteor.isServer part not work

//Note: Parties is outside the Meteor.isClient: it runs both on server and client
Parties = new Mongo.Collection("parties");
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

        .state('parties', {
          url: '/parties',
          templateUrl: 'parties-list.ng.html',
          controller: 'PartiesListCtrl'
        })
        .state('partyDetails', {
          url: '/parties/:partyId',
          templateUrl: 'party-details.ng.html',
          controller: 'PartyDetailsCtrl'
        });

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
    $scope.timeUnits = [ 9.0, 9.3, 10, 10.3, 11, 11.3, 12, 12.3 ];
    $scope.availTimes = [];

    $scope.availTimes = [];
    $scope.selectionStarted = false;
    $scope.startTime = 0;
    $scope.endTime = 0;
    $scope.startSelection = function( startTimeUnit ) {
      $scope.selectionStarted = true;
      $scope.startTime = startTimeUnit;
    };
    $scope.endSelection = function() {
      $scope.selectionStarted = false;

      //
    };
    $scope.updateEndTime = function( timeUnit ) {
        if ( !$scope.selectionStarted ) return;
        $scope.endTime = timeUnit;

        var idx = $scope.availTimes.indexOf( timeUnit );
        if ( idx < 0 )
          $scope.availTimes.push( timeUnit );
        else
          $scope.availTimes.splice(idx, 1);
    };
    $scope.cellClass = function( timeUnit ) {

    };
  });

  ///////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////
  angular.module('when2hack').controller('PartiesListCtrl', function ($scope, $meteor) {
    // all changes made to $scope.parties will have effect on the Parties DB as well
    $scope.parties = $meteor.collection(Parties);

    // The splicing seems to also work on the db data
    $scope.remove = function(party){
      // $scope.parties.splice($scope.parties.indexOf(party), 1);
      $scope.parties.remove(party); //built in remove / save function in Meteor for MeteorCollections
    };
    $scope.removeAll = function(){
      $scope.parties.remove();
    };
  });

  angular.module("when2hack").controller("PartyDetailsCtrl", ['$scope', '$stateParams', "$meteor",
    function($scope, $stateParams, $meteor){

      //get the wanted party from the id
      // $scope.party = $meteor.object(Parties, $stateParams.partyId);
      $scope.party = $meteor.object(Parties, $stateParams.partyId, false); //false: prevent auto save on all changes
      $scope.partyId = $stateParams.partyId;

      $scope.save = function() {
        $scope.party.save().then(function(numberOfDocs){
          console.log('save success doc affected ', numberOfDocs);
        }, function(error){
          console.log('save error', error);
        });
      };

      $scope.reset = function() {
        $scope.party.reset(); //resets the object to the value saved inside the db
      };

    }]);
}

if (Meteor.isServer) {
  console.log("server reached");
  Meteor.startup(function () {
    if (Parties.find().count() === 0) {
      var parties = [
        {'name': 'Dubstep-Free Zone',
          'description': 'Fast just got faster with Nexus S.'},
        {'name': 'All dubstep all the time',
          'description': 'Get it on!'},
        {'name': 'Savage lounging',
          'description': 'Leisure suit required. And only fiercest manners.'}
      ];
      for (var i = 0; i < parties.length; i++)
        Parties.insert(parties[i]);
    }
  });
}
