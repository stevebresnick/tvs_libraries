var H5P = H5P || {};

/**
 * The external event dispatcher. Others, outside of H5P may register and
 * listen for H5P Events here.
 *
 * @type {H5P.EventDispatcher}
 */
H5P.externalDispatcher = new H5P.EventDispatcher();

//JFM TO DO: Centrally manage these values, get them out of code...
var tinCanEndPoint = "https://learninglocker.the-content-creator.com/data/xAPI/";
var tinCanUsername = "3eeac63b7264e738bcf46ad5fc1f8b75c2e639ef";
var tinCanPassword = "fae05c0eb6b9d4fd677e31f173658631a3faa055";

// EventDispatcher extensions

var processingStoredEvents = false;

/**
 * Helper function for triggering xAPI added to the EventDispatcher.
 *
 * @param {string} verb
 *   The short id of the verb we want to trigger
 * @param {Oject} [extra]
 *   Extra properties for the xAPI statement
 */
H5P.EventDispatcher.prototype.triggerXAPI = function (verb, extra) {
    //this.trigger(this.createXAPIEventTemplate(verb, extra));
    
    try {
    
        var lrs = this.connectToLRS();
        var event = this.createXAPIEventTemplate(verb, extra).data.statement;
        
        var bSuccess = this.sendToLRS(lrs,event);
        if (bSuccess === true) {
            //this.processStoredTinCanEvents();
        }
        return true;
    }
    catch (ex) {
        console.log("Failed to send TinCan request: " + ex.message);
        return false;
    }
};

/**
 * Helper function to create event templates added to the EventDispatcher.
 *
 * Will in the future be used to add representations of the questions to the
 * statements.
 *
 * @param {string} verb
 *   Verb id in short form
 * @param {Object} [extra]
 *   Extra values to be added to the statement
 * @returns {H5P.XAPIEvent}
 *   Instance
 */
H5P.EventDispatcher.prototype.createXAPIEventTemplate = function (verb, extra) {
  var event = new H5P.XAPIEvent();

  event.setActor();
  event.setVerb(verb);
  
  if (!('object' in event.data.statement)) {
    event.setObject(this,verb);
      
    if (extra !== undefined) {
        for (var i in extra) {
          event.data.statement.object.definition.extensions[i] = extra[i];
        }
      }
  }
    
  if (!('context' in event.data.statement)) {
    event.setContext(this);
  }
  return event;
};

/**
 * Helper function to create xAPI completed events
 *
 * DEPRECATED - USE triggerXAPIScored instead
 *
 * @deprecated
 *   since 1.5, use triggerXAPIScored instead.
 * @param {number} score
 *   Will be set as the 'raw' value of the score object
 * @param {number} maxScore
 *   will be set as the "max" value of the score object
 * @param {boolean} success
 *   will be set as the "success" value of the result object
 */
H5P.EventDispatcher.prototype.triggerXAPICompleted = function (score, maxScore, success) {
  this.triggerXAPIScored(score, maxScore, 'completed', true, success);
};

/**
 * Helper function to create scored xAPI events
 *
 * @param {number} score
 *   Will be set as the 'raw' value of the score object
 * @param {number} maxScore
 *   Will be set as the "max" value of the score object
 * @param {string} verb
 *   Short form of adl verb
 * @param {boolean} completion
 *   Is this a statement from a completed activity?
 * @param {boolean} success
 *   Is this a statement from an activity that was done successfully?
 */
H5P.EventDispatcher.prototype.triggerXAPIScored = function (score, maxScore, verb, completion, success) { 
    try {
        var lrs = this.connectToLRS();
        var event = this.createXAPIEventTemplate(verb);
        event.setScoredResult(score, maxScore, this, completion, success);
        var newEvent = event.data.statement;

        var bSuccess = this.sendToLRS(lrs,newEvent);
        if (bSuccess === true) {
            //this.processStoredTinCanEvents();
        }
        this.trigger(event)
        return true;
    }
    catch (ex) {
        console.log("Failed to send TinCan request: " + ex.message);
        return false;
    }
};

H5P.EventDispatcher.prototype.connectToLRS = function () {
    var lrs;
    try {
        debugger;
        lrs = new TinCan.LRS( {
                endpoint: tinCanEndPoint,
                username: tinCanUsername,
                password: tinCanPassword,
                allowFail: false
            }
        );
    }
    catch (ex) {
        console.log("Failed to setup LRS object: " + ex.message);
        return null;
    }
    
    return lrs;
}

H5P.EventDispatcher.prototype.sendToLRS = function (lrs,event) {
    //Log if we are iframed and assumed we have grabbed the user name from
    //the application...
    var iFramed = false;
    var embedded = (window.location.href.toLowerCase().indexOf("/h5p/embed") > -1);
    try {
        if (parent.location.host !== window.location.host) { iFramed = true;}
    }
    catch (err) {iFramed = true;}
    
    try {
        debugger;
        if ((!iFramed) && (!embedded)) {
            //If we are in the web interface and logged in then do not log data
            if (window.location.host.toLowerCase().indexOf("apppublisher.biz") > -1) {
                if ((document.body !== undefined) &&  (document.body.className.indexOf(" logged-in") > -1)) { 
                    return false;
                }
                else if ((parent.bodyElement !== undefined) && (parent.bodyElement.className.indexOf(" logged-in") > -1)) {
                    return false;
                }

            }
        }
    }
    catch (err) { return false; }
    
    if ((typeof(lrs) === 'undefined') || (lrs === null)) {
        //this.storeTinCanEventsLocally(event);
        return false;
    }

    var statement = new TinCan.Statement(event);

    if ((typeof(statement) === 'undefined') || (statement === null)) {
        //this.storeTinCanEventsLocally(event);
        return false;
    }

    try {    
        lrs.saveStatement(
            statement,
            {
                callback: function (err, xhr) {
                    if (err !== null) {
                        if (xhr !== null) {
                            //this.storeTinCanEventsLocally(event);
                            console.log("Failed to save statement: " + xhr.responseText + " (" + xhr.status + ")");
                            return false;
                        }

                        //this.storeTinCanEventsLocally(event);
                        console.log("Failed to save statement: " + err.message);
                        return false;
                    }

                    console.log("Statement saved");
                    return true;
                }
            }
        );
    }
    catch (ex) {
        console.log("Failed to send TinCan request: " + ex.message + "; event is " + JSON.stringify(event));
        //this.storeTinCanEventsLocally(event);
        return false;
    }
    
    return true;
}

H5P.EventDispatcher.prototype.storeTinCanEventsLocally = function (event) {
    //If we have failed to send the information to TinCan store it off and we'll send it later
    var savedTinCanEvents = localStorage.getItem("stored-tincan-events");
    if (savedTinCanEvents === null) { savedTinCanEvents = ""; }
    savedTinCanEvents += "|-|" + JSON.stringify(event);
    localStorage.setItem("stored-tincan-events",savedTinCanEvents);
}

H5P.EventDispatcher.prototype.processStoredTinCanEvents = function () {
    /*
    if (processingStoredEvents === true) { return; }
    
    processingStoredEvents = true;
    
    //If we have failed to send the information to TinCan store it off and we'll send it later
    var savedTinCanEvents = localStorage.getItem("stored-tincan-events");
    if (savedTinCanEvents === null) { return; }
    
    var allViews = savedTinCanEvents.split("|-|");
    
    for (var i = 0; i < allViews.length; i++) {
        try {
            var lrs = this.connectToLRS();
            if ((typeof(lrs) === 'undefined') || (lrs === null)) {
                console.log("Failed to connected to the LRS while processing stored events");
                processingStoredEvents = false;
                return;
            }
            
            var eventToProcess = JSON.parse(allViews[1]);

            var bSuccess = this.sendToLRS(lrs,eventToProcess);
            if (bSuccess === true) {
                savedTinCanEvents.splice(index,1);
            }
        }
        catch (ex) {
            console.log("Failed to process stored events: " + ex.message);
        }
    }
    
    //Store any items we have not yet processed...
    localStorage.setItem("stored-tincan-events",savedTinCanEvents);
    processingStoredEvents = false;
    */
}


H5P.EventDispatcher.prototype.viewingEvent = function (contentId, eventType) {    
    try {
        var lrs = this.connectToLRS();
        this.contentId = contentId;
        this.subContentId = false;
        var event = this.createXAPIEventTemplate(eventType).data.statement;
        
        if ((typeof(lrs) === 'undefined') || (lrs === null)) {
            //this.storeTinCanEventsLocally(event);
            return "Failed to send statement, lrs not initialized properly...";
        }

        debugger;
        var bSuccess = this.sendToLRS(lrs,event);
        if (bSuccess === true) {
            //this.processStoredTinCanEvents();
        }
        this.trigger(event)
        return true;
    }
    catch (ex) {
        console.log("Failed to send TinCan request: " + ex.message);
        return false;
    }
    
};


H5P.EventDispatcher.prototype.contentEvent = function (type,contentId,contentTitle) {
    try {
        var lrs = this.connectToLRS();
        this.subContentId = contentId;
        this.contentTitle = contentTitle;
        this.contentId = H5PIntegration.contents[Object.keys(H5PIntegration.contents)].mainId;
        var event = this.createXAPIEventTemplate("experienced").data.statement;

        var newEvent = new H5P.XAPIEvent();
        var object = new Object;
        object.contentId = contentId;
        object.title = contentTitle;
        object.type = type;
        newEvent.setContentObject(object);
        event.object = newEvent.data.statement.object;

        var bSuccess = this.sendToLRS(lrs,event);
        if (bSuccess === true) {
            //this.processStoredTinCanEvents();
        }
        
        this.trigger(event);
        return true;
    }
    catch (ex) {
        console.log("Failed to send TinCan request: " + ex.message);
        return false;
    }
};

H5P.EventDispatcher.prototype.scoringEvent = function (event) {
    try {
        var lrs = this.connectToLRS();
        
        event = event.data.statement;

        var bSuccess = this.sendToLRS(lrs,event);
        if (bSuccess === true) {
            //this.processStoredTinCanEvents();
        }
        return true;
    }
    catch (ex) {
        console.log("Failed to send TinCan request: " + ex.message);
        return false;
    }
};


H5P.EventDispatcher.prototype.setActivityStarted = function() {
  if (this.activityStartTime === undefined) {
    // Don't trigger xAPI events in the editor
    if (this.contentId !== undefined &&
        H5PIntegration.contents !== undefined &&
        H5PIntegration.contents['cid-' + this.contentId] !== undefined) {
      //this.triggerXAPI('attempted');
    }
    this.activityStartTime = Date.now();
  }
};

/**
 * Internal H5P function listening for xAPI completed events and stores scores
 *
 * @param {H5P.XAPIEvent} event
 */
H5P.xAPICompletedListener = function (event) {
  if ((event.getVerb() === 'completed' || event.getVerb() === 'answered') && !event.getVerifiedStatementValue(['context', 'contextActivities', 'parent'])) {
    var score = event.getScore();
    var maxScore = event.getMaxScore();
    var contentId = event.getVerifiedStatementValue(['object', 'definition', 'extensions', 'http://h5p.org/x-api/h5p-local-content-id']);
    H5P.setFinished(contentId, score, maxScore);
  }
};
