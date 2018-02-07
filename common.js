function loadStrings() {
    // fetch english strings from json
    $.getJSON("resource/strings.json", function (data) {
        populateStrings(data);
    });
    return;
}

function loadComparisonData(score) {
    var results;
    $.getJSON("resource/results.json", function (data) {
        results = data.results;
        results.push({ "device": "Your device", "score": score });
        populateComparison(results);
    });
    return;
}

function populateStrings(strings) {
    $(".appTitle").text(strings.appTitle);
    $(".appDesc").text(strings.appDesc);
    $(".startButton").text(strings.startButton[Math.floor(Math.random() * Math.floor(strings.startButton.length))]);
    $(".progDesc").text(strings.progDesc);
    $(".resultDesc").text(strings.resultDesc);
    $(".retryButton").text(strings.retryButton);
    $(".progUnit").text(strings.progUnit);
    $(".compareButton").text(strings.compBtn);
    return;
}

function populateComparison(results) {
    //clear any existing contents
    $(".compTable").empty();

    //perform stats
    var scale = 100 / getMaxScore(results);

    //sort list
    results = sortScores(results);

    //fill display
    for (i = 0; i < results.length; i++) {
        var resultId = "dev".concat(i);
        debugmsg("putting " + resultId + " with device " + results[i].device + " and score " + results[i].score);
        var addString = (("<div class='result' id='").concat(resultId)).concat("'></div>");
        $(".compTable").append(addString);

        var currentResult = $("#".concat(resultId));
        fillResult(currentResult, results[i], scale);
    }
}

function sortScores(objectArray) {
    return objectArray.sort(function (a, b) {
        return b.score - a.score;
    });
}

function getMaxScore(objectArray) {
    var max = 0;
    for (i = 0; i < objectArray.length; i++) {
        if ((objectArray[i].score) > max) {
            max = objectArray[i].score;
        }
    }
    return max;
}

function fillResult(element, data, scale) {
    element.load(("compBar.html"), function () {
        element.children(".resultLbl").text(data.device);
        element.find(".resultScore").text(data.score);
        element.find(".resultBar").css("width", (data.score * scale) + "%");
    });
}

function startBench() {
    //make sure form is valid first
    var $myForm = $('#setup');

    if (!$myForm[0].checkValidity()) {
        $myForm.find(':submit').click();
    } else {
        // move to benchmark display
        showPage("bench");
        setTimeout(
            function () {
                var benchmarkLength = 60;
                if ($('input[name=timeToggle]:checked').val() == 0) {
                    benchmarkLength = $("#lengthRad").val();
                }

                // run benchmark
                var score = execBench(benchmarkLength);
            }, 2000);
    }
    return;
}

function debugmsg(message) {
    //console.log(message);
    return;
}

function execBench(time) {
    var graphUpdateRate = 0.5; // horizontal "resolution" of graph/sprint length in s
    var sprintCount = Math.floor(time / graphUpdateRate);
    debugmsg("Running " + sprintCount + " " + graphUpdateRate + "-second sprints");
    var currentTime = new Date();
    var sprintDeadline = currentTime;
    var counter = 0; // "score" for the end, # of primes generated
    var lastPrime = 0;
    var record = []; // datapoints for graph

    var i = 0;
    (function draw() {
        // perform calculations
        sprintDeadline = incrementDate(new Date(), graphUpdateRate);
        while (currentTime < sprintDeadline) {
            currentTime = Date.now();
            lastPrime = generatePrime(lastPrime);
            counter++;
        }

        // report progress
        record.push(counter);
        if (i == sprintCount - 1) {
            debugmsg("setting final count");
            var score = Math.floor(counter / 1000);
            $(".result").text(score);
            setTimeout(function () {
                //set score and move page
                showPage("result");
            }, 4000);
            loadComparisonData(score);
        }
        drawGraph(document.getElementById('progGraph'), record, sprintCount, graphUpdateRate);

        i++;
        if (i < sprintCount) {
            requestAnimationFrame(draw);
        }
    })();

    return counter;
}

function generatePrime(min) {
    var primeFound = false;
    while (!primeFound) {
        primeFound = isPrime(min);
        min++;
    }
    return min;
}

function isPrime(number) {
    var start = 2;
    while (start <= Math.sqrt(number)) {
        if (number % start++ < 1) return false;
    }
    return number > 1;
}

function drawGraph(canvas, dataPoints, maxPoints, interval) {
    var context = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;
    var xIncrement = width / maxPoints;
    var xBegin = 0;
    var prevPoint = 0;
    var yScale = -1 * height / Math.max(...dataPoints);
    var rate;
    if (dataPoints.length > 1) {
        debugmsg("t: " + dataPoints[dataPoints.length - 1] + " t-1: " + dataPoints[dataPoints.length - 2]);
        rate = (dataPoints[dataPoints.length - 1] - dataPoints[dataPoints.length - 2]) / (1 / interval);
        $(".progRate").text(rate);
    }


    //reset canvas
    canvas.width = canvas.width;
    context.clearRect(0, 0, canvas.width, canvas.height);

    //move context to bottom right and set scale
    context.translate(0, height);
    context.scale(1, 1);

    context.strokeStyle = "#ed1e79";

    for (dataPoint in dataPoints) {
        currentPoint = (dataPoints[dataPoint] * yScale);

        context.beginPath();
        context.moveTo(xBegin, prevPoint);
        context.lineTo(xBegin + xIncrement, currentPoint);
        context.lineWidth = 3;
        context.lineCap = 'round';
        context.stroke();

        prevPoint = currentPoint;
        xBegin += xIncrement;
    }

    debugmsg(Math.max(...dataPoints));
    return;
}

function incrementDate(date, seconds) {
    return new Date(date.getTime() + (seconds * 1000));
}

function showPage(pageId) {
    var target = "#" + pageId;
    jQuery.mobile.changePage(target);
    debugmsg("going to " + pageId);
    return;
}

$(document).ready(function () {
    loadStrings();

    $("#setup").submit(function(event) {
        event.preventDefault();
        startBench();
    });

    $('input:radio[name="timeToggle"]').change(
        function () {
            debugmsg($(this).val());
            if ($(this).val() == 0) {
                $('#lengthRad').prop('disabled', false); // toggle custom text entry
                $(".ui-input-text").removeClass("ui-state-disabled");
                $("#result").find(".compareButton").css("display", "none");
                $("#result").find(".retryButton").css("display", "block");
            } else {
                $('#lengthRad').prop('disabled', true);
                $(".ui-input-text").addClass("ui-state-disabled");
                $("#result").find(".compareButton").css("display", "block");
                $("#result").find(".retryButton").css("display", "none");
                debugmsg("blocking text entry");
            }
        });
});