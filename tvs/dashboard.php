<script src="//code.jquery.com/jquery-latest.min.js"></script>
<script src="//www.gstatic.com/charts/loader.js"></script>

<script>
var authHeader = 'Basic NWMyNTQ3NDQxOWNhZTdlYWM1OGE5OTZmZmY1MzZlNGEwZDMwMWJhYTo3M2QwOWY3Y2Q0NzEzNjRhNDI2MzhmMmJmZDMyYWEzODc2ZjNmMzBi';

function sortItems ( a, b )
{
    if ( a < b )
        return -1;
    if ( a > b )
        return 1;
    return 0; // a == b
}
    
function sortDateItems ( a, b )
{
    debugger;
    return new Date(a[0]) - new Date(b[0]);
}
    
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


function loadReportData() {
    var aWeekAgo = new Date();
    aWeekAgo.setDate(aWeekAgo.getDate()-7);
    var aWeekAgoStr = aWeekAgo.getFullYear() + "-" + ("0" + (aWeekAgo.getMonth() + 1)).substr(("0" + (aWeekAgo.getMonth() + 1)).length-2) + "-" + ("0" + aWeekAgo.getDate()).substr(("0" + aWeekAgo.getDate()).length -2);
    var tmrwDate = new Date();
    tmrwDate.setDate(tmrwDate.getDate()+1);
    var tmrwDateStr = tmrwDate.getFullYear() + "-" + ("0" + (tmrwDate.getMonth() + 1)).substr(("0" + (tmrwDate.getMonth() + 1)).length-2) + "-" + ("0" + tmrwDate.getDate()).substr(("0" + tmrwDate.getDate()).length -2);
                                   
    var reportUrl = 'https://learninglocker.the-content-creator.com/api/v1/statements/aggregate';
    urlData = 'pipeline=[{"$match": {"$and": [{"statement.verb.display.en-US": "launched"},{"statement.timestamp": {"$gt":"' + aWeekAgoStr + '","$lt":"' + tmrwDateStr + '"}}]}},{"$sort":{"statement.timestamp":-1}}]';
    
    $.ajax({ 
        type: 'GET',
        url: reportUrl,
        data: urlData,
        headers: {
            Authorization: authHeader
        },
        success: function(data){
            var allViewObj = {};
            var allViewersObj = {};
            var allContentObj = {};
            
            if (data.result === undefined) {return;}

            for (var i = 0; i < data.result.length; i++) {
                if ((data.result[i].statement.actor.name !== undefined) || (data.result[i].statement.actor.account.name !== undefined)) {
                    
                    var viewDate = new Date(data.result[i].statement.timestamp).toLocaleDateString();
                    var viewerName = "";
                    if (data.result[i].statement.actor.name !== undefined)
                        viewerName = data.result[i].statement.actor.name.replace("mailto:","");
                    if (viewerName === "") {
                        viewerName = data.result[i].statement.actor.account.name.replace("mailto:","");
                    }
                    var contentName = data.result[i].statement.object.definition.name["en-US"];
                    
                    if (allViewObj[viewDate] === undefined) {
                        allViewObj[viewDate] = 1;
                    }
                    else {
                        allViewObj[viewDate] += 1;
                    }
                    if (allViewersObj[viewerName] === undefined) {
                        allViewersObj[viewerName] = 1;
                    }
                    else {
                        allViewersObj[viewerName] += 1;
                    }
                    if (allContentObj[contentName] === undefined) {
                        allContentObj[contentName] = 1;
                    }
                    else {
                        allContentObj[contentName] += 1;
                    }
                }
            }
            
            var allViewData = [];
            for (var i = 0; i < Object.keys(allViewObj).length; i++) {
                var thisData = [Object.keys(allViewObj)[i],allViewObj[Object.keys(allViewObj)[i]]];
                allViewData.push(thisData);
            }
            drawOverview(allViewData);
            
            var allViewerData = [];
            for (var i = 0; i < Object.keys(allViewersObj).length; i++) {
                var thisData = [Object.keys(allViewersObj)[i],allViewersObj[Object.keys(allViewersObj)[i]]];
                allViewerData.push(thisData);
            }
            drawViewers(allViewerData);
            
            var allContentData = [];
            for (var i = 0; i < Object.keys(allContentObj).length; i++) {
                var thisData = [Object.keys(allContentObj)[i],allContentObj[Object.keys(allContentObj)[i]]];
                allContentData.push(thisData);
            }
            drawContent(allContentData);
        },
        error: function(data) {
            console.log("Error: " + data.responseText);
        }
    });
}

function drawOverview(allViewData) {
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Date');
        data.addColumn('number', 'Views');

        allViewData.sort(sortDateItems);

        data.addRows(allViewData);

        var options = {
        title: 'Views By Day - Last 7 Days',
        hAxis: {
            baseline: 0
        },
        vAxis: {
            title: 'Views',
            baseline: 0
        },
        lineWidth: 5,
        legend: 'none'
        };

        var chart = new google.visualization.LineChart(document.getElementById('overview_div'));

        chart.draw(data, options);
    }
    
function drawViewers(allViewerData) {
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Viewer');
        data.addColumn('number', 'Views');

        allViewerData.sort(sortItems);

        data.addRows(allViewerData);
    
        var options = {
            title: "Views by Individual Viewers - Last 7 Days",
            width: '100%',
            height: 600,
            bar: {groupWidth: "95%"},
            legend: 'none'
      };


        var chart = new google.visualization.BarChart(document.getElementById('viewers_div'));

        chart.draw(data, options);
    }
    
function drawContent(allContentData) {
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Content');
        data.addColumn('number', 'Views');

        allContentData.sort(sortItems);

        data.addRows(allContentData);
    
        var options = {
            title: "Views by Content Pieces - Last 7 Days",
            width: '100%',
            height: 600,
            bar: {groupWidth: "95%"},
            legend: 'none'
      };


        var chart = new google.visualization.BarChart(document.getElementById('content_div'));

        chart.draw(data, options);
    }
    
google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(loadReportData);
    
</script>

<div id="overview_div"></div>
 <div id="viewers_div" style="width:90%;"></div>
<div id="content_div" style="width:90%;"></div>