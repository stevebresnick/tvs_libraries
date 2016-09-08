function mleGoToNextQuestion(){
    debugger;
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
      debugger;
       var self = this;

    // Inheritance
    H5P.EventDispatcher.call(self);
    self.contentId = id;
    // Extend defaults with provided options
    self.options = $.extend(true, {}, {
    content: {},
    question: {}
    }, options);
      
    //jfm
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
      debugger;
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
      if (this.options.MLE.text !== undefined && this.options.MLE.text !== null) {
          this.$text = new H5P.Text(this.options.MLE,this.contentId);
          var $textContainer = $container.clone();
          $textContainer.html('');
          this.$text.attach($textContainer);
          $container.append($textContainer); 
      }
      
      //Add in the questions
      if (this.options.MLE.questions !== undefined && this.options.MLE.questions !== null) {
          for (var i = 0; i < this.options.MLE.questions.length; i++) {
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
    
                        $container.append($questionContainer);    

          }
          
          debugger;
          var nextBtn = $('<button id="nextBtnID" onclick="mleGoToNextQuestion()" style=" background: rgb(237, 37, 37) !important;color: white;text-transform: capitalize;box-shadow: none;border-radius: 0;cursor: pointer;border: 0px;height: 30px;width: 100px;margin-right: 10px;margin-left: 0px;margin-top: 20px;font-size: 0.8em;">Next Question</button>');
          var numQuestion = H5P.jQuery(".h5p-question").length;
          for (var i = 0; i < numQuestion; i++) {
              if (i !== 0) {H5P.jQuery(".h5p-question")[i].style.display="none";}
          }
          if (numQuestion > 1) {nextBtn.appendTo($container);}          
      }
   
    this.trigger('resize');
  };
    
    /**
     * Resize handling.
     * @returns {undefined}
     */
    MLE.prototype.resize = function () {
        debugger;
        var availScreenHeight = screen.availHeight;
        
        if (H5P.jQuery(".h5p-container:first > img").length > 0) {
            H5P.jQuery(".h5p-container:first > img")[0].style.border = "2px solid black";
            H5P.jQuery(".h5p-container:first > img")[0].style.minHeight = "400px";
            H5P.jQuery(".h5p-container:first > img")[0].style.height = (availScreenHeight*0.5).toString() + "px";
            H5P.jQuery(".h5p-container:first > img")[0].style.overflowY ="scroll";
        }
        if (H5P.jQuery(".h5p-container:first > .h5p-text").length > 0) {
            H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.border = "2px solid black";
            H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.minHeight = "200px";
            H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.height = (availScreenHeight*0.2).toString() + "px";
            H5P.jQuery(".h5p-container:first > .h5p-text")[0].style.overflowY ="scroll";
        }
        if (H5P.jQuery(".h5p-container:first > .h5p-question").length > 0) {
            for (var j = 0; j < H5P.jQuery(".h5p-container:first > .h5p-question").length; j++) {
                H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.border = "2px solid black";
                H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.minHeight = "300px";
                H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.height = (availScreenHeight*0.3).toString() + "px";
                H5P.jQuery(".h5p-container:first > .h5p-question")[j].style.overflowY ="scroll";
            }
        }
    };

  return MLE;
})(H5P.jQuery, H5P.EventDispatcher, H5P.ContentCopyrights, H5P.MediaCopyright, H5P.videoHandlers || []);
