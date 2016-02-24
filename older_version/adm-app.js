(function(){
  //TESTERS
  console.log(data);

  //VARS
  $overallData = $('#data-overall');
  $totalHoursSlept = $('#data-slept-total');

  //Go through all days in array
  for (var i=0; i< data.length; i++ ){
    //Construct overall data
    var constructorOverall = "";
    constructorOverall += "<b>Date: " + data[i].date + "</b><br>";
    constructorOverall += "<span class='text-info'>Breastfeeding:</span> " + data[i].breastfeeding + "<br>";
    constructorOverall += "<span class='text-success'>Urination:</span> " + data[i].urination;

    //Construct total hours slept data
    var constructorTotalHoursSlept = "";
    constructorTotalHoursSlept += "<b>Slept: </b>" + data[i].sleepTotalHours;

    //Append overall data
    $overallData.append("<div class='box'>" + constructorOverall + "</div>");
    //Append total hours slept
    $totalHoursSlept.append("<div class='box'>" + constructorTotalHoursSlept + "</div>");


  }

})();
