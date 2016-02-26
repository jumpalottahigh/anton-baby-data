// "use strict";
//INIT
//FIREBASE
var myDataRef = new Firebase('https://boiling-heat-4669.firebaseio.com/');

//Variables

var $btnFeed = $('#btnFeed');
var $btnPee = $('#btnPee');
var $btnPoop = $('#btnPoop');
var $btnSleepStart = $('#btnSleepStart');
var $btnSleepEnd = $('#btnSleepEnd');
var $btnRageStart = $('#btnRageStart');
var $btnRageEnd = $('#btnRageEnd');

var $status = $('#status');
var $statusMessage = $('#statusMessage');

var $activeEvents = $('#activeEvents');
var $activeEventsText = $('#activeEventsText');
var $activeEventsTimer = $('#activeEventsTimer');

var timer;

//Initiate and construct current day object
var date = new Date();
var dateString = '';
dateString = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();

var currentDay = {};
currentDay[dateString] = {
  "feeding": [],
  "pee": [],
  "poop": []
};

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

//Button cooldown - 1 min
function coolDown($obj) {
  var btnClasses = $obj.attr('class');
  $obj.attr("disabled", "disabled");
  $obj.removeClass("btn-primary btn-success btn-info btn-warning btn-danger");
  setTimeout(function() {
    $obj.removeAttr("disabled");
    $obj.addClass(btnClasses);
  }, 60000);
}

//Status message
function statusMessage(message, alertClass) {
  //Update and show new status message
  $status.removeClass().addClass("alert alert-dismissible " + alertClass);
  $statusMessage.text(message);
}

function startTimer() {
  var timeElapsed = 0;
  $activeEventsTimer.text(timeElapsed);
  timer = setInterval(function() {
    timeElapsed++;
    $activeEventsTimer.text(timeElapsed);
    console.log(timeElapsed);
  }, 1000);
}

function stopTimer () {
  clearInterval(timer);
}

//////
//UI
//////

//BUTTON EVENTS
$btnFeed.click(function() {
  //TODO
  //or specify time from input field

  //push to db
  coolDown($btnFeed);
  statusMessage("Feeding time added! :)", "alert-success");
  currentDay[dateString].feeding.push(getCurrentTime());
  myDataRef.update(currentDay);
});

$btnPee.click(function() {
  coolDown($btnPee);
  statusMessage("Pee time recorded! :)", "alert-success");
  currentDay[dateString].pee.push(getCurrentTime());
  myDataRef.update(currentDay);
});

$btnPoop.click(function() {
  coolDown($btnPoop);
  statusMessage("Poop time noticed! :)", "alert-success");
  currentDay[dateString].poop.push(getCurrentTime());
  myDataRef.update(currentDay);
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
