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
  var DEFAULT_FONT_SIZE = 28;

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
                this.$content = new H5P.URL(this.options.MLE.content.parameters,this.contentId);
                this.$content.attach($container);
          }
          else if (this.options.MLE.content.library.toLowerCase().indexOf("h5p.video") !== -1) { 
              if (this.options.MLE.content.params.sources.length > 0) {
                  this.$content = new H5P.Video(this.options.MLE.content.params,this.contentId);
                  this.$content.attach($container);
              }
          }
      }
      
      var $questionContainer = $container.clone();
      $questionContainer.html('');
      
      //Add in the questions
      if (this.options.MLE.question !== undefined && this.options.MLE.question !== null) {
          if (this.options.MLE.question.library.toLowerCase().indexOf("h5p.summary") !== -1) {
              this.$question = new H5P.Summary(this.options.MLE.question.params,this.contentId);
              this.$question.attach($questionContainer,"H5P.Summary");
          }
          else if (this.options.MLE.question.library.toLowerCase().indexOf("h5p.multichoice") !== -1) {
              this.$question = new H5P.MultiChoice(this.options.MLE.question.params,this.contentId);
              this.$question.attach($questionContainer,"H5P.MultiChoice");
          }
          else if (this.options.MLE.question.library.toLowerCase().indexOf("h5p.singlechoice") !== -1) {
              this.$question = new H5P.SingleChoice(this.options.MLE.question.params,this.contentId);
              this.$question.attach($questionContainer,"H5P.SingleChoice");
          }
          else if (this.options.MLE.question.library.toLowerCase().indexOf("h5p.blanks") !== -1) {
              this.$question = new H5P.Blanks(this.options.MLE.question.params,this.contentId);
              this.$question.attach($questionContainer,"H5P.Blanks");
          }
          
          $container.append($questionContainer);
      }
  };
//      
//      
//      
//       if (this.options.MLE.question !== undefined && this.options.MLE.question !== null) {
//          
//          if (this.options.MLE.question.library.toLowerCase().indexOf("h5p.multichoice") !== -1) {
//              if (this.options.MLE.content.params.question) {
//                  this.$multichoice = new H5P.Image(this.options.MLE.content.params,this.contentId);
//                  this.$multichoice.attach($container);
//              }
//          }
//               if (this.options.MLE.question.library.toLowerCase().indexOf("h5p.text") !== -1) {
//
//                  this.$text = new H5P.Text(this.options.MLE.content.params,this.contentId);
//                  this.$text.attach($container);             
//          }

//              if (this.options.MLE.content.library.toLowerCase().indexOf("h5p.video") !== -1) {          
//
//        if (this.options.MLE.content.parameters.source.path)
//        {
//                  this.$video = new H5P.Video(this.options.MLE.content.parameters,this.contentId);
//                  this.$video.attach($container);
//              }
//          }
          
//             if (this.options.MLE.content.library.toLowerCase().indexOf("h5p.url") !== -1) 
//             {          
//                 if (this.options.MLE.content.parameters) 
//                 {  this.$url = new H5P.URL(this.options.MLE.content.parameters,this.contentId);
//                  this.$url.attach($container);
//                 }
//                
//              }
        
     // }
   // }
      


  return MLE;
})(H5P.jQuery, H5P.EventDispatcher, H5P.ContentCopyrights, H5P.MediaCopyright, H5P.videoHandlers || []);
