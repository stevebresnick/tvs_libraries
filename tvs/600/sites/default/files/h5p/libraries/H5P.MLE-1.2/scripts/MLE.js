function GetQueryStringByParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function remediateNow() {
    var email = GetQueryStringByParam("em");
    var sid = GetQueryStringByParam("sid");
    window.scrollTo(0,0);
    setTimeout(
        function() {window.location.href = "/sites/all/libraries/tvs/view_series.php?sid=" + sid + "&em=" + email;},1000
    );
}

function monitorQuestionCompletion () {
    if (H5P.jQuery(".h5p-question-show-solution").length > 0) {
        markMLECompleted();
        H5P.jQuery(".h5p-question-show-solution")[0].innerText="Review";
        H5P.jQuery(".h5p-question-show-solution")[0].onclick = remediateNow;
        
    }
    else if (H5P.jQuery(".h5p-joubelui-score-bar-full-score-star").length > 0) {
            markMLECompleted();
    }
    else {    
        setTimeout(monitorQuestionCompletion,500);
    }
}

function markMLECompleted() {
    
    var percToPass = Number(H5P.instances[0].options.override);
    
    var currentScore = 0;
    var maxScore = 0;
    for (var i = 0; i < H5P.instances[0].$allQuestions.length; i++) {
        maxScore += Number(H5P.instances[0].$allQuestions[i].getMaxScore());
        currentScore += Number(H5P.instances[0].$allQuestions[i].getScore());
    }
    
    var passed = false;
    if (Number((currentScore/maxScore)*100) >= percToPass) {
        passed = true;
    }
    
    
    H5P.instances[0].$currentMLE.triggerXAPIScored(currentScore,maxScore,'completed',passed);
    //alert("This has been marked as completed")
}

function mleGoToNextQuestion(){
    var numQuestions = H5P.jQuery(".h5p-question").length-1;
    var currQuestion = 0;
    for (var j=0; j<=numQuestions; j++) {
        if(H5P.jQuery(".h5p-question")[j].style.display=="block")
            {
                currQuestion = j;
                break;
            }
    }
    
    if (currQuestion >= numQuestions) { alert("There are no additional questions"); return;}

    for (var i=0; i <= numQuestions; i++) { 
        if (i == currQuestion+1)
        {
            H5P.jQuery(".h5p-question")[i].style.display="block";
         }
      else
        {
            H5P.jQuery(".h5p-question")[i].style.display="none";
        }
    }
}

function mleGoToPreviousQuestion(){
    var numQuestions = H5P.jQuery(".h5p-question").length-1;
    var currQuestion = 0;
    for (var j=0; j<=numQuestions; j++) {
        if(H5P.jQuery(".h5p-question")[j].style.display=="block")
            {
                currQuestion = j;
                break;
            }
    }
    
    if (currQuestion === 0) { alert("There are no previous questions"); return;}

    for (var i=0; i <= numQuestions; i++) { 
        if (i == currQuestion-1)
        {
            H5P.jQuery(".h5p-question")[i].style.display="block";
         }
      else
        {
            H5P.jQuery(".h5p-question")[i].style.display="none";
        }
    }
}

/**
 * Defines the H5P.MLE class
 */
H5P.MLE = (function ($, EventDispatcher) {

  /**
   * Default font size
   *
   * @constant
   * @type {number}
   * @default
   */
  var DEFAULT_FONT_SIZE = 24;

  /**
   * Creates a new Image hotspots instance
   *
   * @class
   * @augments H5P.EventDispatcher
   * @namespace H5P
   * @param {Object} options
   * @param {number} id
   */ 
  function MLE(options, id) {
        
        var self = this;
      
        this.$allQuestions = [];
        this.$currentMLE = this;

        // Inheritance
        H5P.EventDispatcher.call(self);
        self.contentId = id;
        // Extend defaults with provided options
        self.options = $.extend(true, {}, {
        content: {},
        question: {}
        }, options);

        this.on('resize', this.resize, this);
  }
        
  // Extends the event dispatcher
  MLE.prototype = Object.create(H5P.EventDispatcher.prototype);
  MLE.prototype.constructor = MLE;

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @public
   * @param {H5P.jQuery} $container
   */
    
    
  MLE.prototype.attach = function ($container) {
      
      var self = this;
      this.$container = $container;
      
      //Add in the content...
      if (this.options.MLE.content !== undefined && this.options.MLE.content !== null) {
          if (this.options.MLE.content.library.toLowerCase().indexOf("h5p.image") !== -1) {
              if (this.options.MLE.content.params.file.path) {
                  this.$content = new H5P.Image(this.options.MLE.content.params,this.contentId);
                  this.$content.attach($container);
              }
          }
          else if (this.options.MLE.content.library.toLowerCase().indexOf("h5p.text") !== -1) {
              this.$content = new H5P.Text(this.options.MLE.content.params,this.contentId);
              this.$content.attach($container);             
          }
          else if (this.options.MLE.content.library.toLowerCase().indexOf("h5p.url") !== -1) {               
                this.$content = new H5P.URL(this.options.MLE.content.params,this.contentId);
                this.$content.attach($container);
          }
          else if (this.options.MLE.content.library.toLowerCase().indexOf("h5p.video") !== -1) { 
              if (this.options.MLE.content.params.sources.length > 0) {    
                  this.$content = new H5P.Video(this.options.MLE.content.params,this.contentId);
                  this.$content.attach($container);
              }
          }
      }
      
      
      //add in the text area
      if ((this.options.MLE.text !== undefined) && (this.options.MLE.text !== null) && (this.options.MLE.text !== "") && (this.options.MLE.text !== "<br>")) {
          this.$text = new H5P.Text(this.options.MLE,this.contentId);
          var $textContainer = $container.clone();
          $textContainer.html('');
          this.$text.attach($textContainer);
          $textContainer.prepend('<div style="background:#f4f4f4;color:black;text-align: center;text-transform: uppercase;">Additional Information</dev>');
          $container.append($textContainer); 
      }
      
      //Add in the questions
      if (this.options.MLE.questions !== undefined && this.options.MLE.questions !== null) {
          
          if (this.options.MLE.questions.length > 1) {
            $container.append('<div style="background:#f4f4f4;color:black;"><span id="prevBtnID" onclick="mleGoToPreviousQuestion()" title="Previous Question" class="fa-caret-left fa fa-2x" style="padding-left:20px;cursor:pointer;color:rgb(237, 37, 37);"></span><span id="nextBtnID" onclick="mleGoToNextQuestion()" title="Next Question"  class="fa-caret-right fa fa-2x"  style="padding-left:20px;cursor:pointer;color:rgb(237, 37, 37);"></span><span id="completedBtnID"  class="fa-check fa fa-2x" onclick="markMLECompleted()" title="Mark Complete" style="float:right;cursor:pointer;padding-right:10px;color:#00b18f;"></span></dev>');  
          }
          else {
              $container.append('<hr/>');
          }
          
          
          for (var i = 0; i < this.options.MLE.questions.length; i++) {
              if (typeof(this.options.MLE.questions[i].library) !== "undefined") {
                  var $questionContainer = $container.clone();
                  $questionContainer.html('');

                  switch (this.options.MLE.questions[i].library.toLowerCase()) {
                          case "h5p.summary 1.4":
                            this.$question = new H5P.Summary(this.options.MLE.questions[i].params,this.contentId);
                            this.$question.attach($questionContainer,"H5P.Summary");
                            break;
                          case "h5p.multichoice 1.5":
                            this.$question = new H5P.MultiChoice(this.options.MLE.questions[i].params,this.contentId);
                            this.$question.attach($questionContainer,"H5P.MultiChoice");
                            break;
                          case "h5p.singlechoiceset 1.3":
                            this.$question = new H5P.SingleChoiceSet(this.options.MLE.questions[i].params,this.contentId);
                            this.$question.attach($questionContainer,"H5P.SingleChoiceSet");
                            break;
                          case "h5p.blanks 1.4":
                            this.$question = new H5P.Blanks(this.options.MLE.questions[i].params,this.contentId);
                            this.$question.attach($questionContainer,"H5P.Blanks");
                            break;
                  }

                  this.$allQuestions.push(this.$question);
                  $container.append($questionContainer);
              }
          }  
          var summaryBtn = $('<button id="summaryBtnID" onclick="" style=" background: rgb(237, 37, 37) !important;color: white;text-transform: capitalize;box-shadow: none;border-radius: 0;cursor: pointer;border: 0px;height: 30px;width: 100px;margin-right: 10px;margin-left: 0px;margin-top: 20px;font-size: 0.8em;">Summary</button>');
          
          var numQuestion = H5P.jQuery(".h5p-question").length;
          for (var i = 0; i < numQuestion; i++) {
              if (i !== 0) {H5P.jQuery(".h5p-question")[i].style.display="none";}
          }
      }
      
        var numQuestions = H5P.jQuery(".h5p-question").length-1;
        var currQuestion = 0;
        for (var j=0; j<numQuestions; j++) {
            if(H5P.jQuery(".h5p-question")[j].style.display=="block")
                {
                    currQuestion = j;
                    break;
                }
        }
      
        if (GetQueryStringByParam('sid') !== "") {
            setTimeout(monitorQuestionCompletion,1000);
        }
      
        this.trigger('resize');
  };
      
    MLE.prototype.readDeviceOrientation = function() {
        //Example taken from http://www.williammalone.com/articles/html5-javascript-ios-orientation/
        if (Math.abs(window.orientation) === 90) {
            // Landscape
            return 1;
        } else {
            // Portrait
            return 0;
        }
    }
    
    
   /**
     * Resize handling.
     * @returns {undefined}
     */
    MLE.prototype.resize = function () {
        var self = this;
        
        var availScreenHeight = screen.availHeight;
        
        if (self.initialWidth === undefined) {
          self.initialWidth = self.$container.width();
        }
        var containerWidth = self.$container.width();
        var containerHeight = self.$container.height();

        self.fontSize = (DEFAULT_FONT_SIZE * (containerWidth/self.initialWidth));
        //debugger;
        if (H5P.jQuery(".h5p-container:first > img").length > 0) {
            H5P.jQuery(".h5p-container:first > img")[0].style.height = "auto";
            H5P.jQuery(".h5p-container:first > img")[0].style.width = "100%";
            H5P.jQuery(".h5p-container:first > img")[0].style.overflowY ="auto";
        }
        if (H5P.jQuery(".h5p-container:first > .h5p-text").length > 0) {
            if ((this.readDeviceOrientation() === 0) && (navigator.userAgent.match(/iPhone/i) !== null && navigator.userAgent.match(/iPod/i) === null)) {
                H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.maxHeight = "800px";
            }
            else {
                H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.maxHeight = "400px";
            }
            
            H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.fontSize = self.fontSize;
            //H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.height = (availScreenHeight*0.25).toString() + "px";
            H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.overflowY ="auto";
        }
        if (H5P.jQuery(".h5p-container:first > .h5p-question").length > 0) {
            for (var j = 0; j < H5P.jQuery(".h5p-container:first > .h5p-question").length; j++) {
                if ((this.readDeviceOrientation() === 0) && (navigator.userAgent.match(/iPhone/i) !== null && navigator.userAgent.match(/iPod/i) === null)) {
                    H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.minHeight = "800px";
                }
                else {
                    H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.minHeight = "600px";
                }
                
                H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.height = (availScreenHeight*0.3).toString() + "px";
                H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.overflowY ="auto";
                H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.fontSize = self.fontSize;
            }
        }
        
        H5P.jQuery(".h5p-enable-fullscreen").remove();
    };   


  return MLE;
})(H5P.jQuery, H5P.EventDispatcher, H5P.ContentCopyrights, H5P.MediaCopyright, H5P.videoHandlers || []);
