//INIT

//Bootstrap tooltips
$(function() {
  $('[data-toggle="tooltip"]').tooltip();
});

// Init and set options for time picker
$('.clockpicker').clockpicker({
  placement: 'bottom',
  align: 'left',
  donetext: 'Save',
  default: 'now'
});

// Get the unique ID generated by push()
var pushID;

//Variables

var $btnFeed = $('#btnFeed');
var $btnPee = $('#btnPee');
var $btnPoop = $('#btnPoop');
var $btnSleepStart = $('#btnSleepStart');
var $btnSleepEnd = $('#btnSleepEnd');
var $btnRageStart = $('#btnRageStart');
var $btnRageEnd = $('#btnRageEnd');
var $btnSaveExtra = $('#btnSaveExtra');

var $textCustomTime = $('#textCustomTime');
var $selectCustomEvent = $('#selectCustomEvent');

var $status = $('#status');
var $statusMessage = $('#statusMessage');

var $activeEvents = $('#activeEvents');
var $activeEventsText = $('#activeEventsText');
var $activeEventsTimer = $('#activeEventsTimer');

var timer;
var startTimeStamp;
var endTimeStamp;

var addingCustomSleepTime = false;

//User options object
var userOptions = {};

//Datepickk init
var datepicker = new Datepickk();
datepicker.maxSelections = 1;
datepicker.closeOnSelect = true;

//INIT FIREBASE

//Production
var config = {
  apiKey: "AIzaSyDzVt6Za0xVZOjwWg4chaCX18ugL8QTSXk",
  authDomain: "anton-data.firebaseapp.com",
  databaseURL: "https://anton-data.firebaseio.com",
  storageBucket: "anton-data.appspot.com",
};

//Development
// var config = {
//   apiKey: "AIzaSyDJJAuimDWqUJJCrSAUexG95PwoXSuCahw",
//   authDomain: "boiling-heat-4669.firebaseapp.com",
//   databaseURL: "https://boiling-heat-4669.firebaseio.com",
//   storageBucket: "boiling-heat-4669.appspot.com",
// };

var app = firebase.initializeApp(config);
var firebaseDB = app.database().ref();
var auth = app.auth();

//Check if the user is logged in
function loggedIn() {
  auth.onAuthStateChanged(function(user) {
    if (user) {
      //user logged in
      $('#loggedUser').html('<i class="glyphicon glyphicon-user"></i> Logged in as: <b>' + JSON.stringify(user.email) + '</b><br><i class="glyphicon glyphicon-cloud"></i> To firebase: <b>' + firebaseDB.toString() + '</b>').show();
      $('#loginArea').hide();
    } else {
      if (user === null) {
        //user not logged in
        $('#loggedUser').hide();
        $('#loginArea').show();
      }
    }

  });
}

//Check user status at start up
loggedIn();

//Authenticate the user
function login(username, pass) {
  auth.signInWithEmailAndPassword(username, pass).catch(function(error) {
    console.log("HI: " + user);
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode + errorMessage);
    // ...
    if (error) {
      statusMessage("Login Failed! " + error, "alert-danger");
    } else {
      statusMessage("Authenticated successfully!", "alert-success");

    }
    //Error check
    if (errorCode === 'auth/wrong-password') {
      console.log('Wrong password.');
    } else {
      console.error(error);
    }
    console.log("SUCCESS?");
  });
}

function fetchFromDB() {
  //Fetch the user options from the DB
  var firebaseOptions = firebaseDB.child('/options/');
  firebaseOptions.on("value", function(snap) {
    //Update the global user options object
    userOptions = snap.val();

    //Update the UI
    $('#optionsSound').prop('checked', userOptions.sound);
  });

  //Fetch the additional baby data from the DB
  var firebaseExtraInfo = firebaseDB.child('/baby-data/');
  firebaseExtraInfo.on("value", function(snap) {
    //Calculate exact days ago
    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    var firstDate = snap.val().DOB_timestamp * 1000;
    var secondDate = new Date();
    var diffDays = Math.round(Math.abs((firstDate - secondDate.getTime()) / (oneDay)));
    //Update the UI with extra baby data
    $('#babyDataDOB').html("Little baby was born on: <b>" + snap.val().DOB + "</b>");
    $('#babyDataDOBTimestamp').html("And is now: <b>" + diffDays + "</b> days old.");
    //Update FB with the current age in days
    firebaseDB.child('/baby-data/').update({
      ageDays: diffDays
    });
  });

  //Fetch and update app data if child element is added to Firebase
  //This event listener works on app start up as well as any time a child node is added
  var firebaseLastFeeding = firebaseDB.child(getCurrentDay() + '/feeding/');
  var firebaseLastSleeping = firebaseDB.child(getCurrentDay() + '/sleep/');
  var firebaseLastRaging = firebaseDB.child(getCurrentDay() + '/rage/');
  var firebaseTotalPees = firebaseDB.child(getCurrentDay() + '/pee/');
  var firebaseTotalPoops = firebaseDB.child(getCurrentDay() + '/poop/');

  //watch feeding
  firebaseLastFeeding.limitToLast(1).on("child_added", function(snap) {
    $('#reportLastFeedingTime').html(snap.val().time);
    $('#reportLastFeedingBoob').html(snap.val().startingBoob);
  });

  //watch sleep for changing the last sleep child node
  firebaseLastSleeping.limitToLast(1).on("child_changed", function(snap) {
    $('#reportLastSleepingStartTime').html(snap.val().start_time);
    $('#reportLastSleepingEndTime').html(snap.val().end_time);
    $('#reportLastSleepingDuration').html(snap.val().duration);
  });

  //watch sleep for changing the last sleep child node
  firebaseLastRaging.limitToLast(1).on("child_changed", function(snap) {
    $('#reportLastRagingStartTime').html(snap.val().start_time);
    $('#reportLastRagingEndTime').html(snap.val().end_time);
    $('#reportLastRagingDuration').html(snap.val().duration);
  });

  //grab last sleeping time on app start up
  firebaseLastSleeping.limitToLast(1).on("child_added", function(snap) {
    //Sync from DB and update UI even on different devices
    if (snap.val().event_active) {
      //Update the UI
      $btnSleepStart.attr("disabled", "disabled");
      $btnRageStart.attr("disabled", "disabled");
      $btnSleepEnd.removeAttr("disabled");
      $activeEvents.show();
      $activeEvents.addClass("alert-info");
      $activeEventsText.text("Sleeping has started! Time passed: ");

      //Update quick stats
      $('#reportLastSleepingStartTime').html("Last sleep <b>ONGOING</b> since <b>" + snap.val().start_time + "</b>");
    } else {
      //Update quick stats
      $('#reportLastSleepingStartTime').html("Last sleep from <b>" + snap.val().start_time + "</b>");
      $('#reportLastSleepingEndTime').html("until <b>" + snap.val().end_time + "</b>");
      $('#reportLastSleepingDuration').html("for " + snap.val().duration);
    }
  });

  //grab last raging time on app start up
  firebaseLastRaging.limitToLast(1).on("child_added", function(snap) {
    $('#reportLastRagingStartTime').html(snap.val().start_time);
    $('#reportLastRagingEndTime').html(snap.val().end_time);
    $('#reportLastRagingDuration').html(snap.val().duration);
    //Sync from DB and update UI even on different devices
    if (snap.val().event_active) {
      //Update the UI
      $btnRageStart.attr("disabled", "disabled");
      $btnSleepStart.attr("disabled", "disabled");
      $btnRageEnd.removeAttr("disabled");
      $activeEvents.show();
      $activeEvents.addClass("alert-danger");
      $activeEventsText.text("Raging has started! Time passed: ");
    }
  });

  //grab total amount of pees for today
  firebaseTotalPees.on("value", function(snap) {
    $('#reportTotalPees').html(snap.numChildren());
  });

  //grab total amount of poops for today
  firebaseTotalPoops.on("value", function(snap) {
    $('#reportTotalPoops').html(snap.numChildren());
  });

  //
  //FULL DAILY REPORTS
  //

  //All daily feedings
  firebaseLastFeeding.on("value", function(snap) {
    var constructor = '';
    var counter = 1;

    var previousFeedingTS = '';
    var thisFeedingTS = '';
    var feedingDifference = '';

    for (var i in snap.val()) {
      //Calculate difference between previous and current feeding time
      thisFeedingTS = snap.val()[i].timestamp;
      if (previousFeedingTS !== '') {
        feedingDifference = thisFeedingTS - previousFeedingTS;
      }

      //Feeding time
      constructor += "Feeding " + counter + ": <b>" + snap.val()[i].startingBoob + "</b> starting boob at <b>" + snap.val()[i].time + "(+" + secondsToHours(feedingDifference) + ")</b><br>";

      previousFeedingTS = thisFeedingTS;
      counter++;
    }
    $('#reportDailyFeeding').html(constructor);
    $('#reportTotalFeedings').html(snap.numChildren());
  });

  //All daily sleeps
  firebaseLastSleeping.on("value", function(snap) {
    var constructor = '';
    var counter = 1;
    var total_sleeping_time = 0;

    for (var i in snap.val()) {
      constructor += "Sleep " + counter + "<b>(" + snap.val()[i].start_time + "-" + snap.val()[i].end_time + ")</b> for <b>" + snap.val()[i].duration + "</b><br>";
      counter++;

      //Sum up total sleeping time
      if (snap.val()[i].start_timestamp !== null && snap.val()[i].end_timestamp !== null) {
        total_sleeping_time += (snap.val()[i].end_timestamp - snap.val()[i].start_timestamp);
      }

    }
    $('#reportDailySleeping').html(constructor);
    $('#reportTotalSleeping').html(secondsToHours(total_sleeping_time));
  });

  //Time of last poop
  firebaseTotalPoops.limitToLast(1).on("value", function(snap) {
    var constructor = '';

    if (snap.val() === null) {
      //No poop data for the current day fetch the last poop data
      firebaseDB.child('/baby-data/').on("value", function(snap) {
        constructor += "Last poop was <b>" + moment(snap.val().lastPoop * 1000).fromNow() + "</b>,<br>at: <b>" + moment(snap.val().lastPoop * 1000).format("HH:mm Do MMM YYYY") + "</b>";
      });
    } else {
      //If more than one poops in this current day
      for (var i in snap.val()) {
        constructor += "Time of last poop was at: <b>" + snap.val()[i].time + "</b> on <b>" + getCurrentDay() + "</b>";
      }
    }

    $('#reportTimeOfLastPoop').html(constructor);
  });

  //Fetch weight data from DB
  var firebaseBabyData = firebaseDB.child('/baby-data/');
  firebaseBabyData.on('value', function(snap) {

    var weightTimes = [];
    var weightValues = [];
    var weightData = snap.val()["weight-data"];
    var babyAgeInDays = snap.val().ageDays;
    var startingWeight = '';
    var lastWeight = '';

    //Loop all weight values
    for (var i in weightData) {
      if (weightData.hasOwnProperty(i)) {
        // console.log("Weight time: " + new Date (weightData[i].timestamp*1000) + "\n Weight value: " + weightData[i].weight);
        weightValues.push(weightData[i].weight);
        //Parse the timestamp to readable date
        weightTimes.push(moment(weightData[i].timestamp * 1000).format("MMM Do YY"));
      }
    }

    startingWeight = weightValues[0];
    lastWeight = weightValues[weightValues.length - 1];

    //Update UI with weight stats and gains
    $('#weightBabyAgeDays').html("Baby age in days: <b>" + babyAgeInDays + "</b>");
    $('#weightCurrent').html("Current baby weight: <b>" + lastWeight + "</b>");
    $('#weightGainSinceBirth').html("Total weight gain since birth: <b>" + (lastWeight - startingWeight) + "</b>");
    $('#weightGainPerDay').html("Average weight gain per day: <b>" + ((lastWeight - startingWeight) / babyAgeInDays).toFixed(2) + "</b>");

    //Construct and draw the weight chart
    //Plug in weight data
    var data = {
      // A labels array that can contain any sort of values
      labels: weightTimes,
      // Our series array that contains series objects or in this case series data arrays
      series: [
        weightValues
      ]
    };

    //Weight chart options
    var options = {
      width: "650px",
      height: "400px",
      showPoint: true,
      lineSmooth: true,
      axisX: {
        showGrid: true,
        showLabel: true
      }
    };

    //Instantiate the chart
    //REENABLE LATER WHEN ISSUES RESOLVED
    new Chartist.Line('#chartWeight', data, options);

  });

}

fetchFromDB();

/////////
//Helpers
/////////

//Returns a timestamp in seconds
function getTimeStamp() {
  return Math.round(new Date().getTime() / 1000);
}

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
  }, 60000);
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
    $activeEventsTimer.text(duration(0, timeElapsed));
  }, 1000);
}

//Stop timer
function stopTimer() {
  clearInterval(timer);
}

//Boob change alert
function changeBoobAlert() {
  var audio = new Audio('assets/cool-notification.mp3');
  setTimeout(function() {
    audio.play();
    $('#switchBoob').fadeIn(1000).delay(10000).slideUp(1000);
    setTimeout(function() {
      audio.play();
    }, 10000);
  }, 1200000);
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
        addingCustomSleepTime = true;
        statusMessage("Your custom " + eventName + " time (" + currentTime + ") was added! :)", "alert-success");
      } else {
        currentTime = getCurrentTime();
        statusMessage("Your custom " + eventName + " time seems to be in the future. Added " + eventName + " time with current time (" + currentTime + ") value!:)", "alert-warning");
      }
    } else {
      //Fallback to current time
      currentTime = getCurrentTime();
      statusMessage("Your input was invalid. Added " + eventName + " time with current time (" + currentTime + ") value! Use HH:MM format to enter custom times!", "alert-warning");
    }
  } else {
    currentTime = getCurrentTime();
    statusMessage("Added " + eventName + " time (" + currentTime + ") :)", "alert-success");
  }

  //Clear the textbox for better UX
  $textCustomTime.val("");
  //Return time
  return currentTime;
}

//Calculate duration
//Accepts timestamp in seconds
function duration(start, end) {
  //Calculate duration of sleep
  var timeDuration = end - start;

  //Covert duration to hours and minutes
  var hours, minutes, seconds;

  hours = Math.floor(timeDuration / 3600);
  timeDuration %= 3600;
  minutes = Math.floor(timeDuration / 60);
  seconds = timeDuration % 60;

  timeDuration = hours + "hr:" + minutes + "min:" + seconds + "s";

  //Return duration string
  return timeDuration;
}

//Seconds to hours and minutes
//This function deprecates the duration() implementation and can be refactored to work with a single parameter - seconds
function secondsToHours(timeInSeconds) {
  var hours, mins, seconds, formatted_time;

  hours = Math.floor(timeInSeconds / 3600);
  timeInSeconds %= 3600;
  mins = Math.floor(timeInSeconds / 60);
  seconds = timeInSeconds % 60;

  formatted_time = hours + "hr:" + mins + "min:" + seconds + "s";

  return formatted_time;
}

//////
//UI
//////

//BUTTON EVENTS
//Login button
$('#btnLogin').click(function() {
  login($('#user').val(), $('#pass').val());
});

//Refresh button
$('#refresh').click(function() {
  location.reload();
});

$btnFeed.click(function() {
  //Fire change boob alert to remind in 20 mins
  //Get proper sound to act as an alert
  //Check if sound options are on for the current user
  if (userOptions.sound) {
    changeBoobAlert();
  }

  //Check for custom time or fallback to current time
  var currentTime = addCustomTime("feeding");

  //Get starting boob data
  var boob = '';
  if ($('#radioLeftBoob').parent().hasClass("active")) {
    boob = "left";
  } else if ($('#radioRightBoob').parent().hasClass("active")) {
    boob = "right";
  } else {
    boob = "bottle";
  }

  //UI - btn cooldown
  coolDown($btnFeed);

  //Push to DB
  firebaseDB.child(getCurrentDay() + '/feeding').push({
    time: currentTime,
    startingBoob: boob,
    timestamp: getTimeStamp()
  }, function(err) {
    if (err) {
      statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
    }
  });

  //Change boobs in UI for better user experience
  if (boob == "left") {
    $('#radioLeftBoob').parent().removeClass("active");
    $('#radioBottle').parent().removeClass("active");
    $('#radioRightBoob').parent().addClass("active");
  } else if (boob == "right") {
    $('#radioRightBoob').parent().removeClass("active");
    $('#radioBottle').parent().removeClass("active");
    $('#radioLeftBoob').parent().addClass("active");
  }
});

$btnPee.click(function(e) {
  //Check for custom time or fallback to current time
  var currentTime = addCustomTime("peeing");

  //Update UI - cooldown
  coolDown($btnPee);

  //Push to DB
  firebaseDB.child(getCurrentDay() + '/pee').push({
    time: currentTime,
    timestamp: getTimeStamp()
  }, function(err) {
    if (err) {
      statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
    }
  });
});

$btnPoop.click(function() {
  //Check for custom time or fallback to current time
  var currentTime = addCustomTime("pooping");

  //Update UI - cooldown and message
  coolDown($btnPoop);

  //Push to DB
  firebaseDB.child(getCurrentDay() + '/poop').push({
    time: currentTime,
    timestamp: getTimeStamp()
  }, function(err) {
    if (err) {
      statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
    }
  });

  //Update current last poop
  firebaseDB.child('/baby-data/').update({
    lastPoop: getTimeStamp()
  });
});

$btnSleepStart.click(function() {
  //Get current time
  var currentTime = addCustomTime("sleeping start");

  if (addingCustomSleepTime) {
    //If adding custom time, generate the correct timestamp
    var curDay = getCurrentDay();

    var customTime = new Date(curDay.split('-')[2], (curDay.split('-')[1] - 1), curDay.split('-')[0], currentTime.split(':')[0], currentTime.split(':')[1]);
    startTimeStamp = Math.floor(customTime.getTime() / 1000);

    addingCustomSleepTime = false;
  } else {
    //Get start timestamp
    startTimeStamp = getTimeStamp();
  }

  //Update the UI
  $btnSleepStart.attr("disabled", "disabled");
  $btnRageStart.attr("disabled", "disabled");
  $btnSleepEnd.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.addClass("alert-info");
  $activeEventsText.text("Sleeping has started! Time passed: ");

  //Push to DB and acquire unique key
  pushID = firebaseDB.child(getCurrentDay() + '/sleep').push({
    start_timestamp: startTimeStamp,
    start_time: currentTime,
    event_active: true
  }, function(err) {
    if (err) {
      statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
    }
  }).key();

});

$btnSleepEnd.click(function() {
  //Get current time
  var currentTime = addCustomTime("sleeping end");

  if (addingCustomSleepTime) {
    //If adding custom time, generate the correct timestamp
    var curDay = getCurrentDay();

    var customTime = new Date(curDay.split('-')[2], (curDay.split('-')[1] - 1), curDay.split('-')[0], currentTime.split(':')[0], currentTime.split(':')[1]);
    endTimeStamp = Math.floor(customTime.getTime() / 1000);

    addingCustomSleepTime = false;
  } else {
    //Get end of sleep timestamp in seconds from miliseconds
    endTimeStamp = getTimeStamp();
  }

  //Update the UI
  $btnSleepEnd.attr("disabled", "disabled");
  $btnSleepStart.removeAttr("disabled");
  $btnRageStart.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.addClass("alert-info");
  $activeEventsText.text("Sleeping has ended! Total time: ");

  //Construct smarter pushUrl for support on many devices
  var pushUrl = getCurrentDay() + '/sleep/';

  if (pushID === undefined) {

    var ref = firebaseDB.child(pushUrl);
    ref.limitToLast(1).on("value", function(snap) {
      for (var i in snap.val()) {
        pushUrl += i;
      }
    });
  } else {
    pushUrl += pushID;
  }

  var startTimeStamp = '';
  //Fetch start of sleep timestamp
  firebaseDB.child(pushUrl).once('value', function(snap) {
    startTimeStamp = snap.val().start_timestamp;
  });


  //Get the sleep duration
  var sleepDuration = duration(startTimeStamp, endTimeStamp);

  //Push to DB end time and duration
  firebaseDB.child(pushUrl).update({
    end_timestamp: endTimeStamp,
    end_time: currentTime,
    duration: sleepDuration,
    event_active: false
  }, function(err) {
    if (err) {
      statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
    }
  });
});

$btnRageStart.click(function() {
  //Get current time
  var currentTime = addCustomTime("raging start");

  if (addingCustomSleepTime) {
    //If adding custom time, generate the correct timestamp
    var curDay = getCurrentDay();

    var customTime = new Date(curDay.split('-')[2], (curDay.split('-')[1] - 1), curDay.split('-')[0], currentTime.split(':')[0], currentTime.split(':')[1]);
    startTimeStamp = Math.floor(customTime.getTime() / 1000);

    addingCustomSleepTime = false;
  } else {
    //Get start timestamp
    startTimeStamp = getTimeStamp();
  }

  //Update the UI
  $btnRageStart.attr("disabled", "disabled");
  $btnSleepStart.attr("disabled", "disabled");
  $btnRageEnd.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.addClass("alert-danger");
  $activeEventsText.text("Raging has started! Time passed: ");

  //Push to DB and acquire unique key
  pushID = firebaseDB.child(getCurrentDay() + '/rage').push({
    start_timestamp: startTimeStamp,
    start_time: currentTime,
    event_active: true
  }, function(err) {
    if (err) {
      statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
    }
  }).key();
});

$btnRageEnd.click(function() {
  //Get current time
  var currentTime = addCustomTime("rage end");

  if (addingCustomSleepTime) {
    //If adding custom time, generate the correct timestamp
    var curDay = getCurrentDay();

    var customTime = new Date(curDay.split('-')[2], (curDay.split('-')[1] - 1), curDay.split('-')[0], currentTime.split(':')[0], currentTime.split(':')[1]);
    endTimeStamp = Math.floor(customTime.getTime() / 1000);

    addingCustomSleepTime = false;
  } else {
    //Get end of sleep timestamp in seconds from miliseconds
    endTimeStamp = getTimeStamp();
  }

  //Update the UI
  $btnRageEnd.attr("disabled", "disabled");
  $btnRageStart.removeAttr("disabled");
  $btnSleepStart.removeAttr("disabled");
  $activeEvents.show();
  $activeEvents.removeClass("alert-danger");
  $activeEventsText.text("Raging has ended! Total time: ");

  //Construct smarter pushUrl to support multi device interaction
  var pushUrl = getCurrentDay() + '/rage/';

  if (pushID === undefined) {
    //user refreshed page or is on another device
    var ref = firebaseDB.child(pushUrl);
    ref.limitToLast(1).on("value", function(snap) {
      for (var i in snap.val()) {
        pushUrl += i;
      }
    });
  } else {
    pushUrl += pushID;
  }

  //Fetch start of rage timestamp
  var startTimeStamp = '';
  firebaseDB.child(pushUrl).once("value", function(snap) {
    startTimeStamp = snap.val().start_timestamp;
  });

  //Get the rage duration
  var rageDuration = duration(startTimeStamp, endTimeStamp);

  //Push to DB end time and duration
  firebaseDB.child(pushUrl).update({
    end_timestamp: endTimeStamp,
    end_time: currentTime,
    duration: rageDuration,
    event_active: false
  }, function(err) {
    if (err) {
      statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
    }
  });
});

//Save additional info
$btnSaveExtra.click(function() {
  var fbExtraInfo = firebaseDB.child("baby-data");
  var fbWeight = firebaseDB.child("baby-data/weight-data/");
  var option = $('#selectExtra').val();
  var infoText = $('#textExtra').val();

  switch (option) {
    case "weight":
      fbWeight.push({
        weight: infoText,
        timestamp: getTimeStamp()
      });
      statusMessage("Saved new weight value!", "alert-success");
      break;
    default:
      console.log("Default case");
  }

});

//ADDITIONAL DATA BUTTONS
$('#btnBabyDOB').click(function() {
  //FB reference
  var fbBabyData = firebaseDB.child("baby-data");
  //Show datepicker
  datepicker.show();
  datepicker.onSelect = function(checked) {
    var that = this;
    var state = (checked) ? 'selected' : 'unselected';
    console.log(this.toLocaleDateString() + ' ' + state);

    //Update the baby DOB in Firebase
    fbBabyData.update({
      DOB: that.toLocaleDateString("en-GB"),
      DOB_timestamp: Math.round(new Date(that).getTime() / 1000)
    });

  };
});


//OPTIONS BUTTONS
//Sound options button
$('#optionsSound').click(function() {
  if (userOptions.sound !== $(this).is(':checked')) {
    //Populate also global options object
    userOptions.sound = $(this).is(':checked');

    //Save sound options to DB
    firebaseDB.child('/options/').update({
      sound: $(this).is(':checked')
    }, function(err) {
      if (err) {
        statusMessage("Failed to save data: " + err + ". Check if you are logged in!", "alert-danger");
      }
    });
  }
});
