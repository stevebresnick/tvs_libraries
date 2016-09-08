// Will render a Question with multiple choices for answers.

// Options format:
// {
//   title: "Optional title for question box",
//   question: "Question text",
//   answers: [{text: "Answer text", correct: false}, ...],
//   randomAnswers: false  // Whether to randomize the order of answers.
// }
//
// Events provided:
// - h5pQuestionAnswered: Triggered when a question has been answered.

var H5P = H5P || {};

H5P.MultiChoiceColl = function(options, contentId, contentData) {
  if (!(this instanceof H5P.MultiChoiceColl))
    return new H5P.MultiChoiceColl(options, contentId, contentData);
  var self = this;
  this.contentId = contentId;
  H5P.Question.call(self, 'multichoice');
  var $ = H5P.jQuery;
  var texttemplate =
      '<ul class="h5p-answers">' +
      '  <% for (var i=0; i < answers.length; i++) { %>' +
      '    <li class="h5p-answer<% if (userAnswers.indexOf(i) > -1) { %> h5p-selected<% } %>">' +
      '      <label>' +
      '        <div class="h5p-input-container" aria-label="<% answers[i].text %>" aria-live="polite" <% if (userAnswers.indexOf(i) > -1) { %>aria-selected="true"<% } else { %>aria-selected="false"<% } %> role="button" tabindex="0">' +
      '          <input type="checkbox" name="answer_<%= i %>" class="h5p-input" value="answer_<%= i %>"<% if (userAnswers.indexOf(i) > -1) { %> checked<% } %> />' +
      '          <a width="100%" height="100%" class="h5p-radio-or-checkbox" href="#"><%= answers[i].checkboxOrRadioIcon %></a>' +
      '        </div><div class="h5p-alternative-container">' +
      '          <span class="h5p-span"><%= answers[i].text %></span>' +
      '        </div><div class="h5p-clearfix"></div>' +
      '      </label>' +
      '    </li>' +
      '  <% } %>' +
      '</ul>';

  var defaults = {
    image: null,
    question: "No question text provided",
    answers: [
      {
        tipsAndFeedback: {
          tip: ''
        },
        text: "Answer 1",
        correct: true
      }
    ],
    weight: 1,
    userAnswers: [],
    UI: {
      checkAnswerButton: 'Submit',
      showSolutionButton: 'Show solution',
      tryAgainButton: 'Try again',
      continueButton: 'Continue'
    },
    behaviour: {
      enableRetry: true,
      enableSolutionsButton: true,
      type: 'auto',
      questionPoints: '0',
      randomAnswers: false,
      showSolutionsRequiresInput: true,
      disableImageZooming: false
    }
  };

  // Make sure tips and feedback exists
  if (options.answers) {
    options.answers.forEach(function (answer) {
      answer.tipsAndFeedback = answer.tipsAndFeedback || {};
    });
  }


  var template = new EJS({text: texttemplate});
  var params = $.extend(true, {}, defaults, options);

  var getCheckboxOrRadioIcon = function (radio, selected) {
    var icon;
    icon = selected ? '&#xe601;' : '&#xe602;';

    return icon;
  };

  // Initialize buttons and elements.
  var $myDom;
  var $feedbackDialog;

  /**
   * Remove all feedback dialogs
   */
  var removeFeedbackDialog = function () {
    // Remove the open feedback dialogs.
    $myDom.unbind('click', removeFeedbackDialog );
    $myDom.find('.h5p-feedback-button, .h5p-feedback-dialog').remove();
    $myDom.find('.h5p-has-feedback').removeClass('h5p-has-feedback');
    if ($feedbackDialog) {
      $feedbackDialog.remove();
    }
  };

  var score = 0;
  var maxScore = 0;
  var solutionsVisible = false;

  /**
   * Add feedback to element
   * @param {jQuery} $element Element that feedback will be added to
   * @param {string} feedback Feedback string
   */
  var addFeedback = function ($element, feedback) {
    if ((!feedback.length) || (feedback === "") || (feedback === "<br>")) {
        return;
      }
      
    $feedbackDialog = $('' +
    '<div class="h5p-feedback-dialog">' +
      '<div class="h5p-feedback-inner">' +
        '<div class="h5p-feedback-text">' + feedback + '</div>' +
      '</div>' +
    '</div>');

    //make sure feedback is only added once
    if (!$element.find($('.h5p-feedback-dialog')).length ) {
      $feedbackDialog.appendTo($element.addClass('h5p-has-feedback'));
    }
  };

  /**
   * Register the different parts of the task with the H5P.Question structure.
   */
  self.registerDomElements = function () {
    if (params.media && params.media.library) {
      var type = params.media.library.split(' ')[0];
      if (type === 'H5P.Image') {
        if (params.media.params.file) {
          // Register task image
          self.setImage(params.media.params.file.path, {disableImageZooming: params.behaviour.disableImageZooming, alt: params.media.alt});
        }
      }
      else if (type === 'H5P.Video') {
        if (params.media.params.sources) {
          // Register task video
          self.setVideo(params.media);
        }
      }
    }

    // Determine if we're using checkboxes or radio buttons
    for (var i = 0; i < params.answers.length; i++) {
      params.answers[i].checkboxOrRadioIcon = getCheckboxOrRadioIcon(params.behaviour.singleAnswer, params.userAnswers.indexOf(i) > -1);
    }

    // Register Introduction
    self.setIntroduction(params.question);

    // Register task content area
    $myDom = $(template.render(params));
    self.setContent($myDom, {
      'class': params.behaviour.singleAnswer ? 'h5p-radio' : 'h5p-check'
    });

    // Create tips:
    $('.h5p-answer', $myDom).each(function (i) {
      var $tipContainer = $(this);
        
      // Register click on input container
      $('.h5p-input-container', $tipContainer)
        .click(function () {
          $('input', $tipContainer).change();
        }).keyup(function (e) {
        if (e.which == 32) {
          $('input', $tipContainer).change();
        }

        return false;
      });
        
      var tip = "";

      tip = tip.trim();
      if ((!tip.length) || (tip === "") || (tip === "<br>")) {
        return; // Empty tip
      }

      // Add tip
      var $multichoiceTip = $('<div>', {
        'class': 'multichoice-tip'
      }).click(function () {
        var openFeedback = !$tipContainer.children('.h5p-feedback-dialog').is($feedbackDialog);
        removeFeedbackDialog();

        // Do not open feedback if it was open
        if (openFeedback) {
          // Add tip dialog
          addFeedback($tipContainer, tip);
          $feedbackDialog.addClass('h5p-has-tip');
        }

        self.trigger('resize');

        // Remove tip dialog on dom click
        setTimeout(function () {
          $myDom.click(removeFeedbackDialog);
        }, 100);

        // Do not propagate
        return false;
      });

      $('.h5p-alternative-container', this).append($multichoiceTip);
    });

    // Set event listeners.
    $('input', $myDom).change(function () {
      var $this = $(this);
      var num = parseInt($(this).val().split('_')[1], 10);
      if (params.behaviour.singleAnswer) {
        params.userAnswers[0] = num;
        score = 0;

        $this.parents('.h5p-answers').find('.h5p-answer.h5p-selected').removeClass("h5p-selected");
        $this.parents('.h5p-answers').find('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(true, false));

        $this.parents('.h5p-answer').addClass("h5p-selected");
        $this.siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(true, true));
      } else {
        if ($this.is(':checked')) {
          $this.parents('.h5p-answer').addClass("h5p-selected");
          $this.siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(false, true));
        } else {
          $this.parents('.h5p-answer').removeClass("h5p-selected");
          $this.siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(false, false));
        }
        calcScore();
      }

      if ((self.actionData === undefined) || ((self.actionData !== undefined) && (self.actionData.answerProvided !== params.answers[num].text.replace("<div>","").replace("</div>","").replace("\n","")))) {
          self.actionData = new Object;
          self.actionData.answerProvided = params.answers[num].text.replace("<div>","").replace("</div>","").replace("\n","");
          self.actionData.questionAsked = params.question.replace("<div>","").replace("</div>","").replace("\n","");

          self.triggerXAPI('interacted');
      }
      
      var answerChecked = false;
      $myDom.find('.h5p-answer').each( function () {
        if($(this).hasClass('h5p-selected')) {
          answerChecked = true;
        }
      });

      if (answerChecked) {
        self.hideSolutions();
        self.showButton('check-answer');
        self.hideButton('try-again');
        self.hideButton('show-solution');
      }
    });

    // Adds check and retry button
    addButtons();

    score = 0;
  };

  this.showAllSolutions = function () {
    if (solutionsVisible) {
      return;
    }
    solutionsVisible = true;

    $myDom.find('.h5p-answer').each(function (i, e) {
      var $e = $(e);
      var a = params.answers[i];
      $e.find('.h5p-input-container').attr('disabled', 'disabled');
      $e.find('input').attr('disabled', 'disabled');
    });
    var max = self.getMaxScore();

    // Add css class disabled to labels.
    $myDom.find('label').addClass('h5p-mc-disabled');

    //Hide buttons and retry depending on settings.
    self.showButton('check-answer');
    self.trigger('resize');
  };

  /**
   * Used in contracts.
   * Shows the solution for the task and hides all buttons.
   */
  this.showSolutions = function () {
    self.showAllSolutions();
    self.hideButton('try-again');
  };

  /**
   *
   */
  this.hideSolutions = function () {
    solutionsVisible = false;

    $myDom.find('.h5p-should').removeClass('h5p-should');
    $myDom.find('.h5p-should-not').removeClass('h5p-should-not');
    $myDom.find('input').prop('disabled', false);
    $myDom.find('.h5p-input-container').prop('disabled', false);
    $myDom.find('.h5p-feedback-button, .h5p-feedback-dialog').remove();
    $myDom.find('.h5p-has-feedback').removeClass('h5p-has-feedback');
    this.setFeedback(); // Reset feedback

    self.trigger('resize');
  };

  /**
   * Resets the whole task.
   * Used in contracts with integrated content.
   * @private
   */
  this.resetTask = function () {
    self.answered = false;
    self.hideSolutions();
    params.userAnswers = [];
    removeSelections();
    self.showButton('check-answer');
    self.hideButton('try-again');
    self.hideButton('show-solution');
  };

  var calculateMaxScore = function () {
    return 0;
  };

  this.getMaxScore = function () {
    return 0;
  };

  /**
   * Adds the ui buttons.
   * @private
   */
  var addButtons = function () {
    // Show solution button
    self.addButton('show-solution', params.UI.showSolutionButton, function () {
      calcScore();
      if (self.getAnswerGiven()) {
        self.showAllSolutions();
      }
    }, false);

    // Check solution button
    self.addButton('check-answer', "Submit", function () {
        self.answered = true;
        // Unbind removal of feedback dialogs on click
        $myDom.unbind('click', removeFeedbackDialog );

        // Remove all tip dialogs
        removeFeedbackDialog();

        self.showButton('continue-button');
        if (params.behaviour.enableRetry) {
            self.showButton('try-again');
        }
        self.showCheckSolution();
        
        debugger;
        self.actionData.answerProvided = "";
        $myDom.find('.h5p-answer').each( function () {
            debugger;
            if($(this).hasClass('h5p-selected')) {
                if (self.actionData.answerProvided !== "") { self.actionData.answerProvided += ";";}
                self.actionData.answerProvided += $(this).find(".h5p-span")[0].innerText;
            }
        });

        self.triggerXAPIScored(self.getScore(), self.getMaxScore(), 'answered');
    });

    // Try Again button
    self.addButton('try-again', params.UI.tryAgainButton, function () {
      self.showButton('check-answer');
      self.hideButton('try-again');
      self.hideButton('show-solution');
      self.hideButton('continue-button');
      self.hideSolutions();
      removeSelections();
      enableInput();
    }, false);
      
    // Show solution button
    try {
        if (H5PIntegration.contents[Object.keys(H5PIntegration.contents)].library.toLowerCase().indexOf("h5p.mle") === 0) {
            self.addButton('continue-button', params.UI.continueButton, function () {
                H5P.instances[0].mleGoToNextQuestion();
            }, false);
        }
        else if (H5PIntegration.contents[Object.keys(H5PIntegration.contents)].library.toLowerCase().indexOf("h5p.presentation") === 0) {
            self.addButton('continue-button', params.UI.continueButton, function () {
                H5P.instances[0].nextSlide();
            }, false);
        }
    }
    catch (ex) {}
  };


  /**
   * Shows feedback on the selected fields.
   * @public
   */
  this.showCheckSolution = function () {
    // Determine feedback
    var max = self.getMaxScore();
    var score = self.getScore();
    var feedback, ratio = 1;

    // Show feedback
    var scoreText = "Thank you";

    this.setFeedback(scoreText, score, max);

    //Disable task if maxscore is achieved
    if (score === max) {
        finishedTask();
    }
    //Add disabled css class to label
    $myDom.find('label').addClass('h5p-mc-disabled');
    self.trigger('resize');
  };

  /**
   * Method to use when the task is correctly answered, removes all buttons and disables input.
   */
  var finishedTask = function () {
    self.showButton('check-answer');
    self.hideButton('try-again');
    self.hideButton('show-solution');
    $myDom.find('input').attr('disabled', 'disabled');
    $myDom.find('.h5p-input-container').attr('disabled', 'disabled');
    self.trigger('resize');
  };

  /**
   * Disables choosing new input.
   */
  var disableInput = function () {
    $myDom.find('input').attr('disabled', 'disabled');
    $myDom.find('.h5p-input-container').attr('disabled', 'disabled');
  };

  /**
   * Enables new input.
   */
  var enableInput = function () {
    $myDom.find('input').attr('disabled', false);
    $myDom.find('.h5p-input-container').attr('disabled', false);
    // Remove css class disabled from labels.
    $myDom.find('label').removeClass('h5p-mc-disabled');
  };

  var blankIsCorrect = false;

  var calcScore = function () {
    score = 0;
  };

  /**
   * Removes selections from task.
   */
  var removeSelections = function () {
    $myDom.find('input.h5p-input').each( function () {
      this.checked = false;
      $(this).parents('.h5p-answer').removeClass("h5p-selected");

      //Sets type of icon depending on answer type.
      if (params.behaviour.singleAnswer) {
        $(this).siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(true, false));
      }
      else {
        $(this).siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(false, false));
      }
    });
    calcScore();
  };

  /**
   * Add the question itselt to the definition part of an xAPIEvent
   */
  var addQuestionToXAPI = function(xAPIEvent) {
    var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    definition.description = {
      'en-US': $(params.question).text()
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'choice';
    definition.correctResponsesPattern = [];
    definition.choices = [];
    for (var i = 0; i < params.answers.length; i++) {
      definition.choices[i] = {
        'id': params.answers[i].originalOrder + '',
        'description': {
          'en-US': $(params.answers[i].text).text()
        }
      };
    }
  };

  /**
   * Add the response part to an xAPI event
   *
   * @param {H5P.XAPIEvent} xAPIEvent
   *  The xAPI event we will add a response to
   */
  var addResponseToXAPI = function(xAPIEvent) {
    maxScore = self.getMaxScore();
    var success = score == maxScore ? true : false;
    xAPIEvent.setScoredResult(score, maxScore, self, true, success);
    if (params.userAnswers === undefined) {
      calcScore();
    }
    var response = '';
    for (var i = 0; i < params.userAnswers.length; i++) {
      if (response !== '') {
        response += '[,]';
      }
      response += idMap === undefined ? $(params.userAnswers[i]).text() : idMap[params.userAnswers[i]];
    }
      
    xAPIEvent.data.statement.result.response = response;
  };

  // Initialization code
  // Randomize order, if requested
  var idMap;
  // Store original order in answers
  for (i = 0; i < params.answers.length; i++) {
    params.answers[i].originalOrder = i;
  }
  if (params.behaviour.randomAnswers) {
    var origOrder = $.extend([], params.answers);
    params.answers = H5P.shuffleArray(params.answers);

    // Create a map from the new id to the old one
    idMap = [];
    for (i = 0; i < params.answers.length; i++) {
      idMap[i] = params.answers[i].originalOrder;
    }
  }

  // Start with an empty set of user answers.
  params.userAnswers = [];

  // Restore previous state
  if (contentData && contentData.previousState !== undefined) {

    // Restore answers
    if (contentData.previousState.answers) {
      if (!idMap) {
        params.userAnswers = contentData.previousState.answers;
      }
      else {
        // The answers have been shuffled, and we must use the id mapping.
        for (i = 0; i < contentData.previousState.answers.length; i++) {
          for (var k = 0; k < idMap.length; k++) {
            if (idMap[k] === contentData.previousState.answers[i]) {
              params.userAnswers.push(k);
            }
          }
        }
      }
    }
  }

  /**
   * Pack the current state of the interactivity into a object that can be
   * serialized.
   *
   * @public
   */
  this.getCurrentState = function () {
    var state = {};
    if (!idMap) {
      state.answers = params.userAnswers;
    }
    else {
      // The answers have been shuffled and must be mapped back to their
      // original ID.
      state.answers = [];
      for (var i = 0; i < params.userAnswers.length; i++) {
        state.answers.push(idMap[params.userAnswers[i]]);
      }
    }
    return state;
  };


  this.getAnswerGiven = function() {
    return this.answered || params.behaviour.showSolutionsRequiresInput !== true || params.userAnswers.length || blankIsCorrect;
  };

  this.getScore = function() {
    return 0;
  };

  this.getTitle = function() {
    return H5P.createTitle(params.question);
  };
};

H5P.MultiChoiceColl.prototype = Object.create(H5P.Question.prototype);
H5P.MultiChoiceColl.prototype.constructor = H5P.MultiChoiceColl;
