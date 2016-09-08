var H5P = H5P || {};

/**
 * Used for xAPI events.
 *
 * @class
 * @extends H5P.Event
 */
H5P.XAPIEvent = function () {
  H5P.Event.call(this, 'xAPI', {'statement': {}}, {bubbles: true, external: true});
};

//Generates a GUID, stolen from TinCan.js
function getUUID () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = Math.random() * 16|0, v = c == "x" ? r : (r&0x3|0x8);
            return v.toString(16);
        }
    );
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if ((c.indexOf(name) == 0) && (c !== name)) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

H5P.XAPIEvent.prototype = Object.create(H5P.Event.prototype);
H5P.XAPIEvent.prototype.constructor = H5P.XAPIEvent;

/**
 * Set scored result statements.
 *
 * @param {number} score
 * @param {number} maxScore
 * @param {object} instance
 * @param {boolean} completion
 * @param {boolean} success
 */
H5P.XAPIEvent.prototype.setScoredResult = function (score, maxScore, instance, completion, success) {
  this.data.statement.result = {};
  
  if (typeof score !== 'undefined') {
    if (typeof maxScore === 'undefined') {
      this.data.statement.result.score = {'raw': Number(score)};
    }
    else {
      this.data.statement.result.score = {
        'min': 0,
        'max': Number(maxScore),
        'raw': Number(score)
      };
      if (maxScore > 0) {
        this.data.statement.result.score.scaled = Math.round(Number(score) / Number(maxScore) * 10000) / 10000;
      }
    }
  }
  
  if (typeof completion === 'undefined') {
    this.data.statement.result.completion = (Number(maxScore) === Number(score));
  }
  else {
    this.data.statement.result.completion = completion;
  }
  
  if (typeof success !== 'undefined') {
    this.data.statement.result.success = success;
  }
  
  if (instance && instance.activityStartTime) {
    var duration = Math.round((Date.now() - instance.activityStartTime ) / 10) / 100;
    // xAPI spec allows a precision of 0.01 seconds
    
    this.data.statement.result.duration = 'PT' + duration + 'S';
  }
};

/**
 * Set a verb.
 *
 * @param {string} verb
 *   Verb in short form, one of the verbs defined at
 *   {@link http://adlnet.gov/expapi/verbs/|ADL xAPI Vocabulary}
 *
 */
H5P.XAPIEvent.prototype.setVerb = function (verb) {
  if (H5P.jQuery.inArray(verb, H5P.XAPIEvent.allowedXAPIVerbs) !== -1) {
    this.data.statement.verb = {
      'id': 'http://adlnet.gov/expapi/verbs/' + verb,
      'display': {
        'en-US': verb
      }
    };
  }
  else if (verb.id !== undefined) {
    this.data.statement.verb = verb;
  }
};

/**
 * Get the statements verb id.
 *
 * @param {boolean} full
 *   if true the full verb id prefixed by http://adlnet.gov/expapi/verbs/
 *   will be returned
 * @returns {string}
 *   Verb or null if no verb with an id has been defined
 */
H5P.XAPIEvent.prototype.getVerb = function (full) {
  var statement = this.data.statement;
  if ('verb' in statement) {
    if (full === true) {
      return statement.verb;
    }
    return statement.verb.id.slice(31);
  }
  else {
    return null;
  }
};

/**
 * Set the object part of the statement.
 *
 * The id is found automatically (the url to the content)
 *
 * @param {Object} instance
 *   The H5P instance
 */
H5P.XAPIEvent.prototype.setObject = function (instance,verb) {
  if (instance.contentId) {
    this.data.statement.object = {
      'id': this.getContentXAPIId(instance),
      'objectType': 'Activity',
      'definition': {
        'extensions': {
          'http://apppublisher.biz/x-api/h5p-local-content-id': instance.contentId
        }
      }
    };
  }
      
    if ((/(13D15)/g.test(navigator.userAgent) === true) || (window.location.host.toLowerCase().indexOf("showpad.biz") > -1)) {
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/viewing-platform'] = "ShowPad";
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/usage'] = "Training";
    }
    else {
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/viewing-platform'] = "Web";
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/usage'] = "Marketing"; 
    }
      
    if (instance.subContentId) {
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/h5p-subContentId'] = instance.subContentId;
    }
    
    
    debugger;
      
    var viewId = "";
    var sid = getCookie("series_id");
    var gbEmail = localStorage.getItem("this_user_email");
    if (verb.toLowerCase() === "launched") {
      viewId = getUUID();
      localStorage.setItem("view-id",viewId);
    }
    else if ((verb.toLowerCase() === "completed") && (!instance.subContentId)) {
        viewId = localStorage.getItem("view-id");
        
        if (sid !== "") {
            //This is a series
            var updateSeries = "/sites/all/libraries/tvs/update_series_info.php?sid=" + sid + "&vk=" + viewId + "&complete=1&gbe=" + gbEmail;

            H5P.jQuery.ajax({ 
                type: "GET",
                url: updateSeries,
                async:  true,
                success: function(data){
                    
                },
                error: function(data) {

                }
            });
            
            setCookie("series_id","");
        }
        
        localStorage.setItem("view-id","");
    }
    else {
        viewId = localStorage.getItem("view-id");
        
        if (sid !== "") {
            //This is a series
            var updateSeries = "/sites/all/libraries/tvs/update_series_info.php?sid=" + sid + "&vk=" + viewId + "&complete=0&gbe=" + gbEmail;

            H5P.jQuery.ajax({ 
                type: "GET",
                url: updateSeries,
                async:  true,
                success: function(data){
                    
                },
                error: function(data) {

                }
            });
        }
    }
    
    this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/view-id'] = viewId;
    
    if (sid !== "") {
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/series-id'] = sid;
    }
        
    //Extensions are type specific, let the try/catch deal with adding the right ones...        
    try {
        if (instance.libraryInfo.machineName === "H5P.SingleChoiceSet") {
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/is-answer-correct'] = instance.actionData.correct.toString();
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/question-asked'] = instance.options.choices[0].question.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/answer-provided'] = instance.actionData.answerProvided.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
        }
    }
    catch (ex) {

    }
    
     try {
        if (instance.libraryInfo.machineName === "H5P.DragQuestion") {
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/question-asked'] = instance.options.question.settings.questionTitle.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            //JFM TO DO: Get the provided answer to report
        }
    }
    catch (ex) {

    }
                
    try {
        if (instance.libraryInfo.machineName === "H5P.Blanks") {
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/question-asked'] = instance.params.questions[0].replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            var answersProvided = "";
            for (var i = 0; i < instance.clozes.length; i++) {
                if (answersProvided !== "") { answersProvided += ","; }
                answersProvided += instance.clozes[i].getUserAnswer();
            }
            
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/answer-provided'] = answersProvided.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
        }
    }
    catch (ex) {

    }
        
    try {
        if (instance.libraryInfo.machineName === "H5P.MultiChoice") {
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/question-asked'] = instance.actionData.questionAsked.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            if (verb !== "answered") {
                this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/answer-provided'] = instance.actionData.answerProvided.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            }
            //JFM TO DO:  We need to determine ALL answers given
        }
    }
    catch (ex) {

    }
        
    try {
        if (instance.libraryInfo.machineName === "H5P.MarkTheWords") {
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/question-asked'] = instance.params.taskDescription.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            var answersGiven = "";
            var areAnswersCorrect = true;
            for (var mmI=0; mmI < instance.selectableWords.length; mmI++) {
                if (instance.selectableWords[mmI].isSelected()) {
                    if (answersGiven !== "") { 
                        answersGiven += ","; 
                    }
                    answersGiven += instance.selectableWords[mmI].getWord().replace(/\*/g,"");
                    if (instance.selectableWords[mmI].isCorrect() === false) { areAnswersCorrect = false; }
                }
            }

            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/answer-provided'] = answersGiven.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/is-answer-correct'] = areAnswersCorrect.toString();
        }
    }
    catch (ex) {

    }
        
        
    try {
        if (instance.libraryInfo.machineName === "H5P.Summary") {
            this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/question-asked'] = instance.options.intro.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
            if (verb.toLowerCase() === "answered") {
                this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/answer-provided'] = instance.summaries[0].summary[0].replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
                this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/is-answer-correct'] = "true";
            }
            else {
                this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/answer-provided'] = instance.actionData.answerProvided.replace("<div>","").replace("</div>","").replace("\n","").replace("<p>","").replace("</p>","");
                this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/is-answer-correct'] = "false";
            }
        }
    }
    catch (ex) {

    }
        

    // Don't set titles on main content, title should come from publishing platform
    var objectTitle = "";
    try {
        if ((verb.toLowerCase() === "launched") || ((verb.toLowerCase() === "completed") && (!instance.subContentId))) {
            if (H5PIntegration.contents['cid-' + instance.contentId] !== undefined) {
                objectTitle = H5PIntegration.contents['cid-' + instance.contentId].title;
            }
            else if (this.contentTitle !== undefined) {
                objectTitle = this.contentTitle;
            }
            else if (H5PIntegration.contents[Object.keys(H5PIntegration.contents)] !== undefined) {
                objectTitle = H5PIntegration.contents[Object.keys(H5PIntegration.contents)].title;
            }
        }
        else {
            if (typeof instance.getTitle === 'function') {
                objectTitle = instance.getTitle();
            }
            else if (instance.contentTitle !== undefined) {
                objectTitle = instance.contentTitle;
            }
            else if (H5PIntegration.contents['cid-' + instance.contentId] !== undefined) {
                objectTitle = H5PIntegration.contents['cid-' + instance.contentId].title;
            }
            else if (this.contentTitle !== undefined) {
                objectTitle = this.contentTitle;
            }
            else if (H5PIntegration.contents[Object.keys(H5PIntegration.contents)] !== undefined) {
                objectTitle = H5PIntegration.contents[Object.keys(H5PIntegration.contents)].title;
            }
        }
    }
    catch (ex) { }

    this.data.statement.object.definition.name = {
      "en-US": H5P.createTitle(objectTitle)
    };
};

H5P.XAPIEvent.prototype.setContentObject = function (instance) {
  if (instance.contentId) {
      
    var contentIndexId = 'https://apppublisher.biz/content-object?id=' + instance.contentId;
    if (instance.contentId.toString().toLowerCase().indexOf("http") > -1) {
        contentIndexId = instance.contentId;
    }
      
    this.data.statement.object = {
      'id': contentIndexId,
      'objectType': 'Activity',
      'definition': {
        'extensions': {
          'https://apppublisher.biz/object-type': instance.type
        }
      }
    };
      
    if ((/(13D15)/g.test(navigator.userAgent) === true) || (window.location.host.toLowerCase().indexOf("showpad.biz") > -1)) {
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/viewing-platform'] = "ShowPad";
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/usage'] = "Training";
    }
    else {
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/viewing-platform'] = "Web";
        this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/usage'] = "Marketing"; 
    }

    this.data.statement.object.definition.name = {
          "en-US": H5P.createTitle(instance.title)
    };
  }
    
  var viewId = localStorage.getItem("view-id");
  this.data.statement.object.definition.extensions['http://apppublisher.biz/x-api/view-id'] = viewId;
};

/**
 * Set the context part of the statement.
 *
 * @param {Object} instance
 *   The H5P instance
 */
H5P.XAPIEvent.prototype.setContext = function (instance) {
  if (instance.parent && (instance.parent.contentId || instance.parent.subContentId)) {
    var parentId = instance.parent.subContentId === undefined ? instance.parent.contentId : instance.parent.subContentId;
    this.data.statement.context = {
      "contextActivities": {
        "parent": [
          {
            "id": this.getContentXAPIId(instance.parent),
            "objectType": "Activity"
          }
        ]
      }
    };
  }
  if (instance.libraryInfo) {
    if (this.data.statement.context === undefined) {
      this.data.statement.context = {"contextActivities":{}};
    }
    this.data.statement.context.contextActivities.category = [
      {
        "id": "http://apppublisher.biz/libraries/" + instance.libraryInfo.versionedNameNoSpaces,
        "objectType": "Activity"
      }
    ];
  }
};

/**
 * Set the actor. Email and name will be added automatically.
 */
H5P.XAPIEvent.prototype.setActor = function () {
    var thisUserEmail = localStorage.getItem("this_user_email");
    var thisUserName = localStorage.getItem("this_user_name");
    
    if ((thisUserEmail !== "") && (thisUserEmail !== null)) {
        this.data.statement.actor = {
          'name': thisUserName,
          'mbox': 'mailto:' + thisUserEmail,
          'objectType': 'Agent'
        };
    }
    else {
        this.data.statement.actor = {
        'account': {
            'name': "anonymous@interactivecontentcreator.com",
            'mbox': 'mailto:anonymous@interactivecontentcreator.com',
            'homePage': "http://apppublisher.biz"
        },
        'objectType': 'Agent'
    };
  }
};

/**
 * Get the max value of the result - score part of the statement
 *
 * @returns {number}
 *   The max score, or null if not defined
 */
H5P.XAPIEvent.prototype.getMaxScore = function() {
  return this.getVerifiedStatementValue(['result', 'score', 'max']);
};

/**
 * Get the raw value of the result - score part of the statement
 *
 * @returns {number}
 *   The score, or null if not defined
 */
H5P.XAPIEvent.prototype.getScore = function() {
  return this.getVerifiedStatementValue(['result', 'score', 'raw']);
};

/**
 * Get content xAPI ID.
 *
 * @param {Object} instance
 *   The H5P instance
 */
H5P.XAPIEvent.prototype.getContentXAPIId = function (instance) {
  var xAPIId;
  if (instance.contentId && H5PIntegration && H5PIntegration.contents && (typeof( H5PIntegration.contents['cid-' + instance.contentId]) !== 'undefined')) {
    xAPIId =  H5PIntegration.contents['cid-' + instance.contentId].url;
    if (instance.subContentId) {
      xAPIId += '?subContentId=' +  instance.subContentId;
    }
  }
  return xAPIId;
};

/**
 * Figure out if a property exists in the statement and return it
 *
 * @param {string[]} keys
 *   List describing the property we're looking for. For instance
 *   ['result', 'score', 'raw'] for result.score.raw
 * @returns {*}
 *   The value of the property if it is set, null otherwise.
 */
H5P.XAPIEvent.prototype.getVerifiedStatementValue = function(keys) {
  var val = this.data.statement;
  for (var i = 0; i < keys.length; i++) {
    if (val[keys[i]] === undefined) {
      return null;
    }
    val = val[keys[i]];
  }
  return val;
};

/**
 * List of verbs defined at {@link http://adlnet.gov/expapi/verbs/|ADL xAPI Vocabulary}
 *
 * @type Array
 */
H5P.XAPIEvent.allowedXAPIVerbs = [
  'answered',
  'asked',
  'attempted',
  'attended',
  'commented',
  'completed',
  'exited',
  'experienced',
  'failed',
  'imported',
  'initialized',
  'interacted',
  'launched',
  'mastered',
  'passed',
  'preferred',
  'progressed',
  'registered',
  'responded',
  'resumed',
  'scored',
  'shared',
  'suspended',
  'terminated',
  'voided'
];
