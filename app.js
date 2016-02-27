// "use strict";
//INIT

//Bootstrap tooltips
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

//FIREBASE
var firebaseDB = new Firebase('https://boiling-heat-4669.firebaseio.com/');
//Check if user is logged in
var user = firebaseDB.getAuth();
loggedIn();

//Variables

var $btnFeed = $('#btnFeed');
var $btnPee = $('#btnPee');
var $btnPoop = $('#btnPoop');
var $btnSleepStart = $('#btnSleepStart');
var $btnSleepEnd = $('#btnSleepEnd');
var $btnRageStart = $('#btnRageStart');
var $btnRageEnd = $('#btnRageEnd');
var $textCustomTime = $('#textCustomTime');

var $status = $('#status');
var $statusMessage = $('#statusMessage');

var $activeEvents = $('#activeEvents');
var $activeEventsText = $('#activeEventsText');
var $activeEventsTimer = $('#activeEventsTimer');

var timer;

//Logged in
function loggedIn() {
  if (user == null) {
    //user not logged in
    console.log("Not logged in!");
    $('#loginArea').show();
    return false;
  } else {
    //user logged in
    console.log("Logged in " + JSON.stringify(user));
    $('#loginArea').hide();
    return true;
  }
}

//Authenticate the user
function login(user, pass) {
  firebaseDB.authWithPassword({
    email: user,
    password: pass
  }, function(error, authData) {
    if (error) {
      console.log("Login Failed!", error);
    } else {
      console.log("Authenticated successfully with payload:", authData);
    }
  });
}

/////////
//Helpers
/////////

//Returns current time in this format: '13:35'
function getCurrentTime() {
  var date = new Date();
  var currentTime = '';
  currentTime = date.getHours() + ':' + date.getMinutes();

  return currentTime;
}

//Returns current day
function getCurrentDay() {
  var date = new Date();
  var dateString = '';
  dateString = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();

  return dateString;
}

//Button cooldown - 1 min
function coolDown($obj) {
  var btnClasses = $obj.attr('class');
  $obj.attr("disabled", "disabled");
  $obj.removeClass("btn-primary btn-success btn-info btn-warning btn-danger");
  setTimeout(function() {
    $obj.removeAttr("disabled");
    $obj.addClass(btnClasses);
  }, 5000);
}

//Status message
function statusMessage(message, alertClass) {
  //Update and show new status message
  $status.removeClass().addClass("alert alert-dismissible " + alertClass);
  $statusMessage.text(message);
}

//Start a sleeping or rage timer
function startTimer() {
  var timeElapsed = 0;
  $activeEventsTimer.text(timeElapsed);
  timer = setInterval(function() {
    timeElapsed++;
    $activeEventsTimer.text(timeElapsed);
    console.log(timeElapsed);
  }, 1000);
}

//Stop timer
function stopTimer() {
  clearInterval(timer);
}

//Add a custom time
function addCustomTime(eventName) {
  //Check if user entered a custom time
  //Regexp patter to validate user input for time
  var pattern = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  var currentTime = '';

  if ($textCustomTime.val() !== '') {
    if (pattern.test($textCustomTime.val())) {
      //User entered valid time in the custom time field

      //Check if user time is not in the future
      if ($textCustomTime.val() < getCurrentTime()) {
        currentTime = $textCustomTime.val();
        statusMessage("Your custom " + eventName + " time was added! :)", "alert-success");
      } else {
        currentTime = getCurrentTime();
        statusMessage("Your custom " + eventName + " time seems to be in the future. Added " + eventName + " time with current time value!:)", "alert-warning");
      }
    } else {
      //Fallback to current time
      currentTime = getCurrentTime();
      statusMessage("Your input was invalid. Added " + eventName + " time with current time value! Use HH:MM format to enter custom times!", "alert-warning");
    }
  } else {
    currentTime = getCurrentTime();
    statusMessage("Added " + eventName + " time :)", "alert-success");
  }

  //Clear the textbox for better UX
  $textCustomTime.val("");
  //Return time
  return currentTime;
}

//////
//UI
//////

//BUTTON EVENTS
$('#btnLogin').click(function() {
  login($('#user').val(), $('#pass').val());
});

$btnFeed.click(function() {
  //Check for custom time or fallback to current time
  var currentTime = addCustomTime("feeding");

  //Get starting boob data
  var boob = '';
  if ($('#radioLeftBoob').parent().hasClass("active")) {
    boob = "left";
  } else {
    boob = "right";
  }

  //UI - btn cooldown
  coolDown($btnFeed);

  //Push to DB
  firebaseDB.child(getCurrentDay() + '/feeding').push({
    time: currentTime,
    startingBoob: boob
  });

  //Change boobs in UI for better user experience
  if (boob == "left") {
    $('#radioLeftBoob').parent().removeClass("active");
    $('#radioRightBoob').parent().addClass("active");
  } else {
    $('#radioRightBoob').parent().removeClass("active");
    $('#radioLeftBoob').parent().addClass("active");
  }
});

$btnPee.click(function() {
  //Check for custom time or fallback to current time
  var currentTime = addCustomTime("peeing");

  //Update UI - cooldown
  coolDown($btnPee);

  //Push to DB
  firebaseDB.child(getCurrentDay() + '/pee').push({
    time: currentTime
  });
});

$btnPoop.click(function() {
  //Check for custom time or fallback to current time
  var currentTime = addCustomTime("pooping");

  //Update UI - cooldown and message
  coolDown($btnPoop);

  //Push to DB
  firebaseDB.child(getCurrentDay() + '/poop').push({
    time: currentTime
  });
});

$btnSleepStart.click(function() {
  //Start sleeping timer
  startTimer();

  //Update the UI
  $btnSleepStart.attr("disabled", "disabled");
  $btnRageStart.attr("disabled", "disabled");
  $btnSleepEnd.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.addClass("alert-info");
  $activeEventsText.text("Sleeping has started! Time passed: ");
});

$btnSleepEnd.click(function() {
  //Stop sleeping timer
  stopTimer();

  //Update the UI
  $btnSleepEnd.attr("disabled", "disabled");
  $btnSleepStart.removeAttr("disabled");
  $btnRageStart.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.addClass("alert-info");
  $activeEventsText.text("Sleeping has ended! Total time: ");
});

$btnRageStart.click(function() {
  //Start raging timer
  startTimer();

  //Update the UI
  $btnRageStart.attr("disabled", "disabled");
  $btnSleepStart.attr("disabled", "disabled");
  $btnRageEnd.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.addClass("alert-danger");
  $activeEventsText.text("Raging has started! Time passed: ");
});

$btnRageEnd.click(function() {
  //Stop raging timer
  stopTimer();

  //Update the UI
  $btnRageEnd.attr("disabled", "disabled");
  $btnRageStart.removeAttr("disabled");
  $btnSleepStart.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.removeClass("alert-danger");
  $activeEventsText.text("Raging has ended! Total time: ");
});
