/*
* BTCJSAPIHtmlManager
* */

var pluginDefine = {
    requireJsListenerRequests:[
        'getList' ,
        'getEntity' ,
        'getRecommendedList' ,
        'getNewList',
        'readFile',
        'getLocation',
        'getSystemConfig',
        'getEntityImage'
    ]
}

// define key here
var kApiAction = "data-api-action";
var kApiData = "data-api-data";
var kApiJsListener = "data-api-jsListener";
var kApiLink = "data-api-link";
var kEventObjectBinded = 'object-binded-event';
var kEventValueExtraData = 'extraData';
var btcjsapiMessage = "######### BTCJSAPI Message #########:  \n";
var btcjsapiRequestScheme = 'btcjsapi://';


//-----------------------------------------Lib Start-----------------------------------------//
var BTCJSAPIHtmlManager = new function () {

    "use strict";

    // array for caching operations  (private)
    // structure: [ {requestString:"##requestString##" ,responseData: {###JSON###}}]
    var BTCJSAPIOperations = [];

    // json object of listeners (private)
    var jsListeners = {};

    // should show default log
    var shouldShowBTCLog = false;

    // should cache response data
    var shouldCacheResponseData = false;

    /*
    * init the instance
    * */
    var init = function(){
        /* Set up default data */
        BTCJSAPIHtmlManager.BTCJSAPIOperations = BTCJSAPIOperations;
        BTCJSAPIHtmlManager.jsListeners = jsListeners;
        BTCJSAPIHtmlManager.shouldShowBTCLog = shouldShowBTCLog;
        BTCJSAPIHtmlManager.shouldCacheResponseData = shouldCacheResponseData;
    }

   /*
   * btcDebugger is a bug reporter, when any error returned from the bridge, it will handle the error
   *
   * @para data , un-parsed result data from the bridge
   * */
    var btcDebugger = function (data) {

        var json = parseJsonData(data);

        if (null !== json && json.error.message)
            logBTCConsoleMessage(btcjsapiMessage + 'debug error message : ' + json.error.message);
    }

    /*
     * Default request trigger before function if any
     *
     * @return (BOOL)
     * */
    var requestTriggerBeforeFunction = function (requestString, element) {

        logBTCConsoleMessage(btcjsapiMessage + 'trigger before requestString : ' + requestString);

        return true;
    }

    /*
     * Default js listener, which will be called anyway when any response from the request
     * Please override this method
     * */
    var defaultJSListener = function (data, result, requestId, error) {
        logBTCConsoleMessage(btcjsapiMessage + 'response from request: ' + data);
    }

    /*
    * Logger, console log the log message when the showBTCLog is on
    *
    * @para logMessage
    * */
    var logBTCConsoleMessage = function (logMessage) {
        if (BTCJSAPIHtmlManager.shouldShowBTCLog === true)
            console.log(logMessage);
    }

    /*
     * Helper method to parse json data
     *
     * @return parsed json object or null if fail
     * */
    var parseJsonData = function (data) {
        if (data) {
            try {
                var result = JSON.parse(data);
                return result;
            }
            catch (err) {
                // Do something about the exception here
                logBTCConsoleMessage(btcjsapiMessage + 'json error on parsing data: ' + data);
                return null;
            }
        } else {
            return null;
        }
    }

    /*
    * unescape html helper
    *
    * @para escapedHtmlString
    *
    * @return unescaped data
    * */
    var unescapeHtml = function (string) {
        return $('<div/>').html(string).text();
    }

    /*
     * escape html helper
     *
     * @para unescapedHtmlString
     *
     * @return escaped string
     * */
    var escapeHtml = function (string) {
        return $('<div/>').text(string).html();
    }

    /*
     * get request parameter from request string
     *
     * @return parameter json object
     * */
    var getRequestParameterFromString = function (requestString, key) {

        requestString = unescapeHtml(requestString);
        var stringArray = requestString.split("?");

        if (stringArray.length > 2) { //can only have 1 key and parameters in the request
            logBTCConsoleMessage(btcjsapiMessage + " error : request incorrect");
            return;
        }
        var parameterString = stringArray[1];

        var parameterArray = parameterString.split('&');

        for (var i = 0; i < parameterArray.length; i++) {
            var parameterPart = parameterArray[i];
            var parameterPartArray = parameterPart.split('=');
            if (parameterPartArray.length > 2) { //can only have 1 parameterkey and 1 parametervalue
                logBTCConsoleMessage(btcjsapiMessage + "error : request incorrect");
                return;
            }

            if (parameterPartArray[0] === key) {
                return parameterPartArray[1];
            }
        }
    }

    /*
    * get request Key from request String
    *
    * @return requestKey
    * */
    var getRequestKeyFromString = function (requestString) {
        requestString = unescapeHtml(requestString);
        var stringArray = requestString.split("?");
        return stringArray[0];
    }

    /*
    * make request with the request string (strongly recommended method)
    * */
    var makeRequest = function (requestString) {

        var finalRequestString = finalRequestStringWithRequestIdPreparation(requestString);

        iframeRequestCall(finalRequestString);
    }

    /*
    * final Request string preparation
    *
    * it will automatically generate the request ID and cache the request in memory in the purpose of keep track of the request
    *
    * @para requestString
    *
    * @return finalisedRequestString
    * */
    var finalRequestStringWithRequestIdPreparation = function(requestString) {
        requestString += '&requestId=' + BTCJSAPIOperations.length;

        // store request into array and generate request Id
        var request = {};
        request.requestString = requestString;
        request.responseData = "";

        BTCJSAPIOperations.push(request);

        // the final request
        return  btcjsapiRequestScheme + requestString;
    }

    /*
     * For performance to call multiple request simultaneously, this method making an iframe call for each request
     * */
    var iframeRequestCall = function(finalisedRequestString){
        // log the call
        logBTCConsoleMessage(btcjsapiMessage + 'request making : ' + finalisedRequestString);

        // use iframe allow calling multiple request at a time
        var iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", finalisedRequestString);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    }


    /*
    * handle response from the request
    *
    * @para data, un-parsed result data from the bridge
    * */
    var responseFromRequest = function (data) {

        // log the response
        logBTCConsoleMessage(btcjsapiMessage + 'got response : ' + data);

        var json = parseJsonData(data);

        if(null === json) return;

        var requestId = json.requestParameter.requestId;
        var error = json.error;
        var result = json.result;

        var operation = BTCJSAPIOperations[requestId];
        var jsListener = json.requestParameter.originalJsListener;

        if (typeof operation != 'undefined') {
            if (BTCJSAPIHtmlManager.shouldCacheResponseData) {
                operation.responseData = data;
                BTCJSAPIOperations[requestId] = operation; //overwrite it
            }
        }

        var fn = jsListeners[jsListener];

        BTCJSAPIHtmlManager.defaultJSListener(data, result, requestId, error);

        if (typeof fn == 'function' && !(typeof  fn == 'undefined')) {
            fn(result, requestId, error);
        }

    }

    /*
    * BTC JS API Trigger helper method for the plugin
    *
    * @para element -> dom object
    * @action       -> compulsory , and the requestKey
    * @data         -> request parameter JSON object
    * @jsListener   -> jsListener (request parameter)
    * */
    var createBTCJSAPITrigger = function (element, action, data, jsListener) {

        var linkString = "";
        var item = element;

        if (!action) {
            logBTCConsoleMessage(btcjsapiMessage + 'data-api-action is necessary for each request Trigger: ' + item);
            return;
        }

        linkString += action;
        linkString += "?";

        var i = 0;
        // append data into the request
        if (typeof data != 'undefined' && data != "" && data != null) {

            var jsonData = parseJsonData(data);

            for (var key in jsonData) {
                if (jsonData.hasOwnProperty(key)) {
                    if (i > 0)  linkString += '&';

                    var value = valuedStringFromObjectAndValue(item,jsonData[key]);

                    linkString += key + '=' + value;
                    i++;
                }
            }
        }

        // if jslistener is compulsory
        if ($.inArray(action, pluginDefine.requireJsListenerRequests) > -1) {

            //require jsListener
            if (!jsListener) {
                logBTCConsoleMessage(btcjsapiMessage + 'data-api-jsListener is necessary for each request trigger: ' + item);
                return;
            } else {
                if (i > 0)  linkString += '&';
                linkString +='originalJsListener='+ jsListener;
                i++;
            }

            if (i > 0)  linkString += '&';
            linkString += 'jsListener=responseFromRequest';

        } else {

            if (jsListener) {
                if (i > 0)  linkString += '&';
                linkString += 'originalJsListener=' + jsListener + '&jsListener=responseFromRequest';
                i++;
            }
        }

        item.attr(kApiLink, linkString);
        item.attr(kApiJsListener, jsListener);

        registerActionBTCJSAPITrigger(item);
    }

    /*
     * Create click event and look for any extraData by calling event trigger 'object-binded-event'
     *
     * @para item -> dom object (jQuery)
     * */
    var registerActionBTCJSAPITrigger = function (item) {

        item.on('click', function (event) {

            var element = item.trigger(kEventObjectBinded);
            var requestString = item.attr(kApiLink);
            var extraData = element.data(kEventValueExtraData);

            if (extraData) {
                var i = 0;

                for (var key in extraData) {
                    if (extraData.hasOwnProperty(key)) {

                        if (requestString.slice(-1) != "?")
                            requestString += '&';

                        var value = valuedStringFromObjectAndValue(item, extraData[key]);

                        requestString += key + '=' + value;
                    }
                }
            }

            var result = BTCJSAPIHtmlManager.requestTriggerBeforeFunction(requestString, item);
            if (!result)
                return;

            makeRequest(requestString);
        });
    }

    /*
    * extra and special data handler to finalise the data
    * all data must be url encoded
    *
    * @para item    -> jQueryObj
    * @para value   -> original value
    *
    * @return encoded Value
    * */
    var valuedStringFromObjectAndValue = function(item,value)
    {
        // handle special value
        // if value is a local reference
        if (value === 'localRef') {
            value = document.URL.replace('index.html', item.attr('href'));
        }

        return encodeURIComponent(value);
    }

    /*
    * get request histories by the request Id
    * Id is automatically generated if call by "makeRequest" method
    *
    * @para requestId
    *
    * @return request history according to the request Id
    * */
    var getRequestHistories = function (requestId) {

        var historyResult = null;

        if (typeof requestId == 'undefined')
            return BTCJSAPIOperations;

        historyResult = BTCJSAPIOperations[requestId];

        if(historyResult === null) {
             logBTCConsoleMessage('no history for the request id, please make sure you did turn on shouldCacheResponseData and have jsListener for the request');
        }

        return historyResult;
    }

    /*
    * get request parameter by the requestId
    *
    * @para requestId
    *
    * @return parameter JSON object or null if fail to parse response data
    * */
    var getRequestParameterByRequestId = function (requestId) {
        var historyObj = getRequestHistories(requestId);
        var data = historyObj.responseData;

        return getRequestParameterFromResponseData(data);
    }

    /*
     * get request parameter by the response data from request
     *
     * @para response data (unparsed)
     *
     * @return parameter JSON object or null if fail to parse response data
     * */
    var getRequestParameterFromResponseData = function (data) {
        var json = parseJsonData(data);
        var result = null;
        if(json){
            result = json.requestParameter;
        }
        return result;
    }

    /*
    * add js listeners, support multiple plugin used
    *
    * @para jsListenersDictionary JSON object of jsListener
    *
    * @return JSON Object
    * */
    var addJSListeners = function (jsListenersDictionary) {

        if (jsListenersDictionary === undefined)
            return;

        // append more js listeners
        $.each(jsListenersDictionary, function(key, value){
            jsListeners[key] = value;
        });

    }

    return {
        // init
        init:init,

        // parameters
        shouldCacheResponseData:shouldCacheResponseData,
        shouldShowBTCLog:shouldShowBTCLog,
        addJSListeners: addJSListeners,

        // parse helpers
        unescapeHtml:unescapeHtml,
        escapeHtml:escapeHtml,
        parseJsonData :parseJsonData,

        // default callback
        btcDebugger:btcDebugger,
        defaultJSListener:defaultJSListener,
        requestTriggerBeforeFunction:requestTriggerBeforeFunction,

        // request helper
        createBTCJSAPITrigger:createBTCJSAPITrigger,
        makeRequest:makeRequest,
        responseFromRequest:responseFromRequest,

        // operation history helper
        getRequestHistories:getRequestHistories,
        getRequestParameterByRequestId:getRequestParameterByRequestId,
        getRequestParameterFromResponseData:getRequestParameterFromResponseData
    }

};
//-----------------------------------------Lib End-----------------------------------------//
BTCJSAPIHtmlManager.init();

/* must have method for debugging */
function BTCJSAPIDebugger(data) {
    BTCJSAPIHtmlManager.btcDebugger(data);
}

/* must have method for response processing */
function responseFromRequest(data) {
    BTCJSAPIHtmlManager.responseFromRequest(data);
}




/*
* btcjsapi blugin
*
* it helps to create a hyper link for each ".RequestTrigger" item/element
* element should have the following attributes:
* - data-api-action
* - data-api-data
* - data-api-jsListener (not compulsory)
*
* also , allow override of the default methods like
* - btcDebugger                     (error reporter)
* - requestTriggerBeforeFunction    (this will be trigger before any request)
* - defaultJSListener               (which will be called when any feedback from the request)
*
* (BOOL) shouldCacheResponseData
*       if true, will ask the BTCJSHTMLManager to cache the request with request Id automatically
*
* (BOOL) shouldShowBTCLog
*       if true, it will print the log message report by the BTCJSHTMLManager
*       message including error message (e.g. json parse error), log message before and after each request
*
* */
//-----------------------------------------Plugin Start-----------------------------------------//
(function ($) {
    $.fn.extend({
        //plugin name - btcjsapi
        btcjsapi:function (_options) {

            var defaults = {
                shouldCacheResponseData : false,
                shouldShowBTCLog : true,
                btcDebugger : BTCJSAPIHtmlManager.btcDebugger,
                requestTriggerBeforeFunction : BTCJSAPIHtmlManager.requestTriggerBeforeFunction,
                defaultJSListener : BTCJSAPIHtmlManager.defaultJSListener
            };

            var options = $.extend(defaults, _options);

            BTCJSAPIHtmlManager.shouldCacheResponseData = options.shouldCacheResponseData;
            BTCJSAPIHtmlManager.shouldShowBTCLog = options.shouldShowBTCLog;

            BTCJSAPIHtmlManager.btcDebugger = options.btcDebugger;
            BTCJSAPIHtmlManager.requestTriggerBeforeFunction = options.requestTriggerBeforeFunction;
            BTCJSAPIHtmlManager.defaultJSListener = options.defaultJSListener;

            BTCJSAPIHtmlManager.addJSListeners(options.jsListeners);

            return this.each(function () {
                var o = options;
                var obj = $(this);
                var items = $(this).find('.RequestTrigger');

                items.each(function () {
                    var item = $(this);
                    BTCJSAPIHtmlManager.createBTCJSAPITrigger(item, item.attr(kApiAction), item.attr(kApiData), item.attr(kApiJsListener));
                });
            });
        }
    });

})(jQuery);
//-----------------------------------------Plugin End-----------------------------------------//