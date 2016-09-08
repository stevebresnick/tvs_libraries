<script src="//code.jquery.com/jquery-latest.min.js"></script>
<script>
var authHeader = 'Basic NWMyNTQ3NDQxOWNhZTdlYWM1OGE5OTZmZmY1MzZlNGEwZDMwMWJhYTo3M2QwOWY3Y2Q0NzEzNjRhNDI2MzhmMmJmZDMyYWEzODc2ZjNmMzBi';
    
var fullReportHtml = "";
    
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
    
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
    
Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]) + "00:00:00"; // padding
  };
    
function loadCSVFile(cid,userEmail,startDateStr,endDateStr) {
    debugger;
    var reportUrl = 'https://learninglocker.the-content-creator.com/api/v1/statements/aggregate';
    var urlData = "";
    
    if ((userEmail === "") && (cid === null)) {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    else if ((userEmail !== "") && (cid !== null)) {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.object.id": "https:\/\/' + window.location.hostname + '\/node\/' + cid + '"},{"statement.actor.mbox": "mailto:' + userEmail + '"},{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    else if ((userEmail === "" ) && (cid !== null)) {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.object.id": "https:\/\/' + window.location.hostname + '\/node\/' + cid + '"},{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    else {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.actor.mbox": "mailto:' + userEmail + '"},{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}}]}},{"$sort":{"statement.timestamp":-1}}]';
    }

    var csvFile = "Time Stamp,Viewing Platform,Viewing Use Case,User Name,";
    csvFile += "User Email,Action,Content Name,Content URL,";
    csvFile += "Question Asked,Answer Provided,Points Earned,Points Total,Passed\n";
    
    $.ajax({ 
        type: 'GET',
        url: reportUrl,
        data: urlData,
        headers: {
            Authorization: authHeader
        },
        success: function(data){
            for (var i = 0; i < data.result.length; i++) {
                if ((data.result[i].statement.actor.name !== undefined) || (data.result[i].statement.actor.account.name !== undefined)) {
                    csvFile += "";
                    csvFile += new Date(data.result[i].statement.timestamp).toLocaleString().replace(","," ");
                    csvFile += ",";
                    csvFile += data.result[i].statement.object.definition.extensions['http://apppublisher.biz/x-api/viewing-platform'];
                    csvFile += ",";
                    csvFile += data.result[i].statement.object.definition.extensions['http://apppublisher.biz/x-api/usage'];
                    csvFile += ",";
                    if (data.result[i].statement.actor.name !== undefined) {
                        csvFile += data.result[i].statement.actor.name;
                        csvFile += ",";
                        csvFile += data.result[i].statement.actor.mbox.replace("mailto:","");
                        csvFile += ",";
                    }
                    else if (data.result[i].statement.actor.account.name !== undefined) {
                        csvFile += data.result[i].statement.actor.account.name;
                        csvFile += ",";
                        csvFile += data.result[i].statement.actor.account.name;
                        csvFile += ",";
                    }
                    
                    var detailedVerb = data.result[i].statement.object.definition.extensions["https://apppublisher.biz/object-type"];
                    var questionAsked = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/question-asked"];
                    var actionResponse = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/answer-provided"];
                    var isAnswerCorrect = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/is-answer-asked"];
                    
                    var thisVerb = "";
                    if (detailedVerb !== undefined) {
                        csvFile += toTitleCase(detailedVerb);
                    }
                    else {
                        if ((data.result[i].statement.verb !== null) && (data.result[i].statement.verb !== null)) {
                            thisVerb = data.result[i].statement.verb.display["en-US"];
                        }
                        else {
                            thisVerb = "";
                        }
                        
                        if ((thisVerb === "completed") && (actionResponse !== null) && (actionResponse !== "") && (actionResponse !== undefined)) {
                            csvFile += "Answered";
                        } 
                        else {
                            csvFile += toTitleCase(thisVerb);
                        }
                    }
                    
                    var pointsReceived = 0;
                    var pointsTotal = 0;
                    var passedQuestion = false;
                    if ((data.result[i].statement.result !== null) && (data.result[i].statement.result !== undefined)) {
                        pointsTotal = data.result[i].statement.result.score.max;
                        pointsReceived = data.result[i].statement.result.score.raw;
                        if (data.result[i].statement.result.success !== undefined) {
                            passedQuestion = data.result[i].statement.result.success;
                        }
                    }
                    
                    csvFile += ",";
                    var objectName = "";
                    if ((data.result[i].statement.object !== null) && (data.result[i].statement.object !== undefined) && (data.result[i].statement.object.definition !== null) && (data.result[i].statement.object.definition !== undefined) && (data.result[i].statement.object.definition.name !== null) && (data.result[i].statement.object.definition.name !== undefined)) {
                        objectName = data.result[i].statement.object.definition.name["en-US"].replace("\n","");
                    }
                    csvFile += objectName;
                    csvFile += ",";
                    csvFile += data.result[i].statement.object.id;
                    csvFile += ",";
                    if ((questionAsked !== null) && (questionAsked !== "") && (questionAsked !== undefined)) {
                        csvFile += questionAsked.replace("\n","");
                    }
                    else {
                        csvFile += "";
                    }
                    csvFile += ",";
                    if ((actionResponse !== null) && (actionResponse !== "") && (actionResponse !== undefined)) {
                        csvFile += actionResponse.replace("\n","");
                    }
                    else {
                        csvFile += "";
                    }
                    
                    csvFile += ",";
                    
                    csvFile += pointsReceived + ",";
                    csvFile += pointsTotal + ",";
                    
                    if (thisVerb === "completed") {
                        if (passedQuestion) {
                            csvFile += "Passed";
                        }
                        else {
                            csvFile += "Failed";
                        }
                    }
                    else {
                        csvFile += "N/A";
                    }
                    csvFile += "\n";
                }
            }
            window.open("data:text/csv;filename:report.csv;file:report.csv;charset=utf-8," + escape(csvFile));
        },
        error: function(data) {
            console.log("Error: " + data.responseText);
        }
    });
}
    
function moreDetails(viewId,contentId,viewDateTime,viewerName) {
    $(".reportResults")[0].innerHTML = "<h2>Loading...</h2>";
    
    var startDT = new Date(viewDateTime);
    startDT.setHours(startDT.getHours() - 24);
    var endDT = new Date(viewDateTime);
    endDT.setHours(startDT.getHours() + 72);
    
    var reportUrl = 'https://learninglocker.the-content-creator.com/api/v1/statements/aggregate';
    var urlData = 'pipeline=[{"$match":{"statement.timestamp": {"$gt": "' + startDT.yyyymmdd() + '","$lt": "' + endDT.yyyymmdd() + '"}}},{"$sort":{"statement.timestamp": 1}}]';
    
    $.ajax({ 
        type: 'GET',
        url: reportUrl,
        data: urlData,
        headers: {
            Authorization: authHeader
        },
        success: function(data){
            var passedQuestion = false;
            var includePassed = false;
            var localContentId = "";
            
            var thisHtml = "<input type='button' value='back' onclick='loadReportData()' />";
            
            thisHtml += "[[VIEW_DETAILS]]";
            
            thisHtml += '<table><tr><th>Date/Time</th>'; 
            thisHtml += '<th>Action</th><th>Object</th>';
            thisHtml += "<th>Response</th>";
            thisHtml += "<th>Points Earned</th>";
            thisHtml += "<th>Points Total</th>";
            thisHtml += "</tr>";
            
            var scoreEarned = 0;
            for (var i = 0; i < data.result.length; i++) {
                if (data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/view-id"] === viewId) {
                debugger;    
                }
                
                
                if ((data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/view-id"] === viewId) && ((data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/h5p-local-content-id"] === undefined) || (data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/h5p-local-content-id"].toString() === localContentId) || (data.result[i].statement.verb.display["en-US"].toLowerCase() === "launched"))) {
                    thisHtml += "<tr>";
                    thisHtml += "<td>"; 
                    thisHtml += new Date(data.result[i].statement.timestamp).toLocaleString();
                    thisHtml += "</td>";
                    thisHtml += "<td>";
                    
                    var detailedVerb = data.result[i].statement.object.definition.extensions["https://apppublisher.biz/object-type"];
                    var questionAsked = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/question-asked"];
                    var actionResponse = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/answer-provided"];
                    var isAnswerCorrect = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/is-answer-asked"];
                    
                    var thisVerb = "";
                    if (detailedVerb !== undefined) {
                        thisHtml += toTitleCase(detailedVerb);
                    }
                    else {
                        thisVerb = data.result[i].statement.verb.display["en-US"];
                        if ((thisVerb === "completed") && (actionResponse !== null) && (actionResponse !== "") && (actionResponse !== undefined)) {
                            thisHtml += "Answered";
                        } 
                        else {
                            thisHtml += toTitleCase(thisVerb);
                        }
                        
                    }
                    
                    if (thisVerb.toLowerCase() === "launched") {
                        localContentId = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/h5p-local-content-id"];
                    }
                    var pointsEarned = 0;
                    var pointsTotal = 0;
                    
                    if ((data.result[i].statement.result !== null) && (data.result[i].statement.result !== undefined)) {
                        pointsEarned = data.result[i].statement.result.score.raw;
                        pointsTotal = data.result[i].statement.result.score.max;
                        
                        if (thisVerb === "completed") {
                            scoreEarned = data.result[i].statement.result.score.scaled;
                            if (data.result[i].statement.result.success !== undefined) {
                                if (thisVerb.toLowerCase() === "completed") {
                                    passedQuestion = data.result[i].statement.result.success;
                                    includePassed = true;
                                }
                            }
                        }
                    }
                    
                    thisHtml += "</td>";
                    thisHtml += "<td>";
                    thisHtml += data.result[i].statement.object.definition.name["en-US"];
                    thisHtml += "</td>";
                    thisHtml += "<td>";
                    
                    if ((actionResponse !== null) && (actionResponse !== "") && (actionResponse !== undefined)) {
                        thisHtml += actionResponse;
                    }
                    else {
                        thisHtml += "&nbsp;";
                    }
                    thisHtml += "</td>";
                    
                    thisHtml += "<td>";
                    thisHtml += pointsEarned;
                    thisHtml += "</td>";
                    
                    thisHtml += "<td>";
                    thisHtml += pointsTotal;
                    thisHtml += "</td>";
                    thisHtml += "</tr>";
                }
            }
            thisHtml += "</table>";
            
            if (!Number(scoreEarned)) { scoreEarned = 0; }
            scoreEarned = (scoreEarned).toFixed(2);
            
                        
            var viewerDetails = "<br />Viewer Name:   " + viewerName + "<br />";
            viewerDetails += "<br />Score Earned:   " + (scoreEarned*100).toFixed(2) + "% ";
            if (includePassed === true) {
                if (passedQuestion) {
                    viewerDetails += " (PASSED)";
                }
                else {
                    viewerDetails += " (FAILED)";
                }
            }
            else viewerDetails += "<br /><br />";
            

            $(".reportResults")[0].innerHTML = thisHtml.replace("[[VIEW_DETAILS]]",viewerDetails);
        },
        error: function(data) {
            console.log("Error: " + data.responseText);
        }
    });
}

function loadReportData(startDateStr,endDateStr) {
    var cid = getParameterByName('cid');

    var reportUrl = 'https://learninglocker.the-content-creator.com/api/v1/statements/aggregate';
    var urlData = 'pipeline=[{"$match": {"$and":[{"statement.object.id": "https:\/\/' + window.location.hostname + '\/node\/' + cid + '"},{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}},{"statement.verb.display.en-US": "launched"}]}},{"$sort":{"statement.timestamp":-1}}]';

    if (cid === null) {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}},{"statement.verb.display.en-US": "launched"}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    
    $.ajax({ 
        type: 'GET',
        url: reportUrl,
        data: urlData,
        headers: {
            Authorization: authHeader
        },
        success: function(data){
            var thisHtml = "";
            if (getParameterByName('drilldown') === "1") {
                thisHtml += "<input type='button' value='back' onclick='window.location=\"/viewing-report\";' />";
            }
            
            thisHtml += "<input type='button' value='CSV' onclick='loadCSVFile(" + cid + ",null,\"" + startDateStr + "\",\"" + endDateStr + "\")' />";
            thisHtml += "<table><tr><th>View Date/Time</th><th>User Name</th>"; 
            thisHtml += "<th>Item Name</th><th>&nbsp;</th>";
            thisHtml += "</tr>";
            for (var i = 0; i < data.result.length; i++) {
                if (data.result[i].statement.actor.name !== undefined) {
                    var viewId = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/view-id"];
                    var contentId = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/h5p-local-content-id"];
                    
                    contentId = data.result[i].statement.object.id;
                    contentId = contentId.substr(contentId.lastIndexOf("/") +1);
                    

                    thisHtml += "<tr>";
                    thisHtml += "<td>"; 
                    thisHtml += new Date(data.result[i].statement.timestamp).toLocaleString();
                    thisHtml += "</td>";
                    thisHtml += "<td>";
                    thisHtml += data.result[i].statement.actor.name;
                    thisHtml += "</td>";
                    thisHtml += "<td>";
                    thisHtml += "<a href='";
                    if (cid === null) {
                        thisHtml += "/viewing-report?cid=" + contentId + "&drilldown=1";
                    }
                    else {
                        thisHtml += data.result[i].statement.object.id;
                    }
                    thisHtml += "'>";
                    thisHtml += data.result[i].statement.object.definition.name["en-US"];
                    thisHtml += "</a>";
                    thisHtml += "</td>";

                    thisHtml += "<td>";
                    if ((viewId !== null) && (viewId !== "") && (viewId !== undefined)) {
                        thisHtml += "<a href='#' onclick='moreDetails(\"" + viewId + "\",\"" + contentId + "\",\"" + data.result[i].statement.timestamp + "\",\"" + data.result[i].statement.actor.name + "\")'>More Details</a>";
                    }
                    else {
                        thisHtml += "&nbsp;";
                    }
                    thisHtml += "</td>";
                    thisHtml += "</tr>";
                }
            }
            thisHtml += "</table>";
            
            fullReportHtml = thisHtml;
            $(".reportResults")[0].innerHTML = fullReportHtml;
        },
        error: function(data) {
            console.log("Error: " + data.responseText);
        }
    });
}
    
function loadReportDataByViewer(userEmail,cid,startDateStr,endDateStr) {
    debugger;
    var reportUrl = 'https://learninglocker.the-content-creator.com/api/v1/statements/aggregate';
    var urlData = '';
    
    
    if ((userEmail === "") && (cid === null)) {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}},{"statement.verb.display.en-US": "launched"}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    else if ((userEmail !== "") && (cid !== null)) {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.object.id": "https:\/\/' + window.location.hostname + '\/node\/' + cid + '"},{"statement.actor.mbox": "mailto:' + userEmail + '"},{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}},{"statement.verb.display.en-US": "launched"}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    else if ((userEmail === "" ) && (cid !== null)) {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.object.id": "https:\/\/' + window.location.hostname + '\/node\/' + cid + '"},{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}},{"statement.verb.display.en-US": "launched"}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    else {
        urlData = 'pipeline=[{"$match": {"$and":[{"statement.actor.mbox": "mailto:' + userEmail + '"},{"statement.timestamp": {"$gt":"' + startDateStr + '","$lt":"' + endDateStr + '"}},{"statement.verb.display.en-US": "launched"}]}},{"$sort":{"statement.timestamp":-1}}]';
    }
    
    $.ajax({ 
        type: 'GET',
        url: reportUrl,
        data: urlData,
        headers: {
            Authorization: authHeader
        },
        success: function(data){
            var thisHtml = "";
            if (getParameterByName('drilldown') === "1") {
                thisHtml += "<input type='button' value='back' onclick='window.location=\"/viewing-report\";' />";
            }
            thisHtml += "<input type='button' value='CSV' onclick='loadCSVFile(" + cid + ",\"" + userEmail + "\",\"" + startDateStr + "\",\"" + endDateStr + "\")' />";
            thisHtml += "<table><tr><th>View Date/Time</th><th>User Name</th>"; 
            thisHtml += "<th>Item Name</th><th>&nbsp;</th>";
            thisHtml += "</tr>";
            for (var i = 0; i < data.result.length; i++) {
                if ((data.result[i].statement.actor.name !== undefined) || (data.result[i].statement.actor.account.name !== undefined)) {
                    var viewId = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/view-id"];
                    var contentId = data.result[i].statement.object.definition.extensions["http://apppublisher.biz/x-api/h5p-local-content-id"];
                    
                    contentId = data.result[i].statement.object.id;
                    contentId = contentId.substr(contentId.lastIndexOf("/") +1);
                    

                    thisHtml += "<tr>";
                    thisHtml += "<td>"; 
                    thisHtml += new Date(data.result[i].statement.timestamp).toLocaleString();
                    thisHtml += "</td>";
                    thisHtml += "<td>";
                    if (data.result[i].statement.actor.name !== undefined) {
                        thisHtml += data.result[i].statement.actor.name;
                    }
                    else if (data.result[i].statement.actor.account.name !== undefined) {
                        thisHtml += data.result[i].statement.actor.account.name;
                    }
                    
                    thisHtml += "</td>";
                    thisHtml += "<td>";
                    thisHtml += "<a href='";
                    thisHtml += data.result[i].statement.object.id;
                    thisHtml += "'>";
                    thisHtml += data.result[i].statement.object.definition.name["en-US"];
                    thisHtml += "</a>";
                    thisHtml += "</td>";

                    thisHtml += "<td>";
                    if ((viewId !== null) && (viewId !== "") && (viewId !== undefined)) {
                        thisHtml += "<a href='#' onclick='moreDetails(\"" + viewId + "\",\"" + contentId + "\",\"" + data.result[i].statement.timestamp + "\",\"" + data.result[i].statement.actor.name + "\")'>More Details</a>";
                    }
                    else {
                        thisHtml += "&nbsp;";
                    }
                    thisHtml += "</td>";
                    thisHtml += "</tr>";
                }
            }
            thisHtml += "</table>";
            
            fullReportHtml = thisHtml;
            $(".reportResults")[0].innerHTML = fullReportHtml;
        },
        error: function(data) {
            console.log("Error: " + data.responseText);
        }
    });
}
    
function showViewsByDays() {
    document.getElementById("allReportList").style.display="none";
    document.getElementById("viewsByDayForm").style.display="block";
}
    
function runReportByDateRange() {
    var dateRangeSelected = document.getElementById("viewsByDayDateRange").value;
    
    var endDate = new Date();
    var startDate = new Date();
    
    switch (dateRangeSelected) {
        case "0":
            startDate.setDate(startDate.getDate());
            endDate.setDate(endDate.getDate()+2);
            break;
        case "1":
            startDate.setDate(startDate.getDate()-2);
            endDate.setDate(endDate.getDate());
            break;
        case "2":
            startDate.setDate(startDate.getDate()-7);
            endDate.setDate(endDate.getDate()+1);
            break;
        case "3":
            startDate.setDate(startDate.getDate()-30);
            endDate.setDate(endDate.getDate()+1);
            break;
        case "4":
            startDate.setDate(startDate.getDate()-90);
            endDate.setDate(endDate.getDate()+1);
            break;
    }
    
    var startDateStr = startDate.getFullYear() + "-" + ("0" + (startDate.getMonth() + 1)).substr(("0" + (startDate.getMonth() + 1)).length-2) + "-" + ("0" + startDate.getDate()).substr(("0" + startDate.getDate()).length -2);
    var endDateStr = endDate.getFullYear() + "-" + ("0" + (endDate.getMonth() + 1)).substr(("0" + (endDate.getMonth() + 1)).length-2) + "-" + ("0" + endDate.getDate()).substr(("0" + endDate.getDate()).length -2);
    
    loadReportData(startDateStr,endDateStr);
    
}

function showViewsByUser() {
    document.getElementById("allReportList").style.display="none";
    document.getElementById("viewsByUserForm").style.display="block";
}
    
function runReportByUser() {
    var dateRangeSelected = document.getElementById("viewsByDayDateRange").value;
    var userEmail = document.getElementById("userEmailAddr").value;
    
    if (userEmail === "") { runReportByDateRange(); }
    
    var endDate = new Date();
    var startDate = new Date();
    
    switch (dateRangeSelected) {
        case "0":
            startDate.setDate(startDate.getDate());
            endDate.setDate(endDate.getDate()+2);
            break;
        case "1":
            startDate.setDate(startDate.getDate()-2);
            endDate.setDate(endDate.getDate()-1);
            break;
        case "2":
            startDate.setDate(startDate.getDate()-7);
            endDate.setDate(endDate.getDate()+1);
            break;
        case "3":
            startDate.setDate(startDate.getDate()-30);
            endDate.setDate(endDate.getDate()+1);
            break;
        case "4":
            startDate.setDate(startDate.getDate()-90);
            endDate.setDate(endDate.getDate()+1);
            break;
    }
    
    var startDateStr = startDate.getFullYear() + "-" + ("0" + (startDate.getMonth() + 1)).substr(("0" + (startDate.getMonth() + 1)).length-2) + "-" + ("0" + startDate.getDate()).substr(("0" + startDate.getDate()).length -2);
    var endDateStr = endDate.getFullYear() + "-" + ("0" + (endDate.getMonth() + 1)).substr(("0" + (endDate.getMonth() + 1)).length-2) + "-" + ("0" + endDate.getDate()).substr(("0" + endDate.getDate()).length -2);
    
    loadReportDataByViewer(userEmail,getParameterByName('cid'),startDateStr,endDateStr);
    
}
    
</script>

<style>
    table, tr, td {
        border: 0px none white;
        vertical-align: top;
    }
    tr td:last-child {
        border-right: 0px none white;
    }
    table td, table th {
        vertical-align: top;
    }
    tbody {
        border-top: 0px none white;
    }
</style>


<div style="display:block;" id="viewsByUserForm">    
    <h5>Select your time range</h5>
    <select id="viewsByDayDateRange" style="width:300px;">
        <option value="0">Today</option>
        <option value="1">Yesterday</option>
        <option value="2">Last 7 days</option>
        <option value="3">Last 30 days</option>
        <option value="4">Last 90 days</option>
    </select>
    <h6>Email address of the user to report upon (optional)</h6>
    <select id="userEmailAddr" style="width:300px;">
        <option></option>
        <script>
            debugger;
            var allEmails = document.getElementById("userEmailList").value.split(",").sort();
            for (var i = 0; i< allEmails.length; i++) {
                var optionStr = "<option>" + allEmails[i] + "</option>";
                document.writeln(optionStr);
            }
        </script>
    </select>
    <input type="button" onclick="runReportByUser()" value="Submit" />
</div>


<div id="reportResults" class="reportResults"></div>

<script defer>
    var cid = getParameterByName('cid');

if (cid !== null) {
    showViewsByDays();
}
</script>