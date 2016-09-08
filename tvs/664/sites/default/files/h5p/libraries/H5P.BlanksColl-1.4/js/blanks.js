/*global H5P*/
H5P.BlanksColl = (function ($, Question) {
  /**
   * @constant
   * @default
   */
  var STATE_ONGOING = 'ongoing';
  var STATE_CHECKING = 'checking';
  var STATE_SUBMITTING = 'submitting';    
  var STATE_SHOWING_SOLUTION = 'showing-solution';
  var STATE_FINISHED = 'finished';

  /**
   * Initialize module.
   *
   * @class H5P.Blanks
   * @extends H5P.Question
   * @param {Object} params Behavior settings
   * @param {number} id Content identification
   * @param {Object} contentData Task specific content data
   */
  function BlanksColl(params, id, contentData) {
    var self = this;

    // Inheritance
    Question.call(self, 'blanks');

    // IDs
    this.contentId = id;

    // Set default behavior.
    this.params = $.extend(true, {}, {
      text: "Fill in",
      questions: [
        "Oslo is the capital of *Norway*."
      ],
      userAnswers: [],
      score: "You got @score of @total points.",
      showSolutions: "Show solutions",
      tryAgain: "Try again",
//      checkAnswer: "Check",
      submitAnswer: "Submit",    
      changeAnswer: "Change answer",
      notFilledOut: "Please fill in all blanks",
      behaviour: {
        enableRetry: true,
        enableSolutionsButton: true,
        caseSensitive: true,
        showSolutionsRequiresInput: true,
        autoCheck: false,
        separateLines: false,
        disableImageZooming: false
      }
    }, params);

    // Delete empty questions
    for (var i = this.params.questions.length - 1; i >= 0; i--) {
      if (!this.params.questions[i]) {
        this.params.questions.splice(i, 1);
      }
    }

    // Previous state
    this.contentData = contentData;
    if (this.contentData !== undefined && this.contentData.previousState !== undefined) {
      this.previousState = this.contentData.previousState;
    }

    // Clozes
    this.clozes = [];

    // Keep track tabbing forward or backwards
    this.shiftPressed = false;

    H5P.$body.keydown(function (event) {
      if (event.keyCode === 16) {
        self.shiftPressed = true;
      }
    }).keyup(function (event) {
      if (event.keyCode === 16) {
        self.shiftPressed = false;
      }
    });
  }

  // Inheritance
  BlanksColl.prototype = Object.create(Question.prototype);
  BlanksColl.prototype.constructor = BlanksColl;

  /**
   * Registers this question type's DOM elements before they are attached.
   * Called from H5P.Question.
   */
  BlanksColl.prototype.registerDomElements = function () {
    var self = this;

    if (self.params.image) {
      // Register task image
      self.setImage(self.params.image.path, {disableImageZooming: self.params.behaviour.disableImageZooming});
    }

    // Register task introduction text
    self.setIntroduction(self.params.text);

    // Register task content area
    self.setContent(self.createQuestions(), {
      'class': self.params.behaviour.separateLines ? 'h5p-separate-lines' : ''
    });

    // ... and buttons
    self.registerButtons();

    // Restore previous state
    self.setH5PUserState();
  };

  /**
   * Create all the buttons for the task
   */
//  Blanks.prototype.registerButtons = function () {
//    var self = this;
//
//    if (!self.params.behaviour.autoCheck) {
//       Check answer button
//      self.addButton('check-answer', self.params.checkAnswer, function () {
//        self.toggleButtonVisibility(STATE_CHECKING);
//        self.markResults();
//        self.showEvaluation();
//        self.triggerAnswered();
//      });
//    }
//
//    // Check answer button
//    self.addButton('show-solution', self.params.showSolutions, function () {
//      if (self.allBlanksFilledOut()) {
//        self.toggleButtonVisibility(STATE_SHOWING_SOLUTION);
//        self.showCorrectAnswers();
//      }
//    }, self.params.behaviour.enableSolutionsButton);
//
//    // Try again button
//    if (self.params.behaviour.enableRetry === true) {
//      self.addButton('try-again', self.params.tryAgain, function () {
//        self.resetTask();
//        self.$questions.filter(':first').find('input:first').focus();
//      });
//    }
//    self.toggleButtonVisibility(STATE_ONGOING);
//  };

    
    
  BlanksColl.prototype.registerButtons = function () {
    var self = this;

    if (!self.params.behaviour.autoCheck) {
       //Check answer button
      self.addButton('submit-answer', self.params.submitAnswer, function () {
        self.toggleButtonVisibility(STATE_SUBMITTING);
//        self.markResults();
        self.showEvaluation();
        self.triggerAnswered();
      });
    }
      
        // Show solution button
    debugger;
    try {
        if (H5PIntegration.contents[Object.keys(H5PIntegration.contents)].library.toLowerCase().indexOf("h5p.presentation") === 0) {
            self.addButton('continue-button', "Continue", function () {
                debugger;
                H5P.instances[0].nextSlide();
            }, false);
        }
    }
    catch (ex) {}

    self.toggleButtonVisibility(STATE_ONGOING);
  };
    
    
    
    
  /**
   * Find blanks in a string and run a handler on those blanks
   *
   * @param {string} question
   *   Question text containing blanks enclosed in asterisks.
   * @param {function} handler
   *   Replaces the blanks text with an input field.
   * @returns {string}
   *   The question with blanks replaced by the given handler.
   */
  BlanksColl.prototype.handleBlanks = function (question, handler) {
    // Go through the text and run handler on all asterix
    var clozeEnd, clozeStart = question.indexOf('*');
    while (clozeStart !== -1 && clozeEnd !== -1) {
      clozeStart++;
      clozeEnd = question.indexOf('*', clozeStart);
      if (clozeEnd === -1) {
        continue; // No end
      }

      var replacer = handler(question.substring(clozeStart, clozeEnd));
      clozeEnd++;
      question = question.slice(0, clozeStart - 1) + replacer + question.slice(clozeEnd);

      // Find the next cloze
      clozeStart = question.indexOf('*', clozeEnd);
    }
    return question;
  };

  /**
   * Create questitons html for DOM
   */
  BlanksColl.prototype.createQuestions = function () {
    var self = this;

    var html = '';
    for (var i = 0; i < self.params.questions.length; i++) {
      var question = self.params.questions[i];

      // Go through the question text and replace all the asterisks with input fields
      question = self.handleBlanks(question, function(toBeReplaced) {
        // Create new cloze
        var defaultUserAnswer = (self.params.userAnswers.length > self.clozes.length ? self.params.userAnswers[self.clozes.length] : null);
        var cloze = new BlanksColl.Cloze(toBeReplaced, self.params.behaviour, defaultUserAnswer);

        self.clozes.push(cloze);
        return cloze;
      });

      html += '<div>' + question + '</div>';
    }

    this.$questions = $(html);

    // Set input fields.
    this.$questions.find('input').each(function (i) {
      var afterCheck;
      if (self.params.behaviour.autoCheck) {
        afterCheck = function () {
          if (self.done || self.getAnswerGiven()) {
            // All answers has been given. Show solutions button.
            self.toggleButtonVisibility(STATE_CHECKING);
            self.showEvaluation();
            self.done = true;
            self.triggerAnswered();
          }
        };
      }
      self.clozes[i].setInput($(this), afterCheck, function () {
        self.hideEvaluation();
      });
    }).keydown(function (event) {
      self.autoGrowTextField($(this));

      if (event.keyCode === 13) {
        return false; // Prevent form submission on enter key
      }

      // Refocus buttons after they have been toggled if last input
      if (event.keyCode === 9 && self.params.behaviour.autoCheck) {
        var $inputs = self.$questions.find('.h5p-input-wrapper:not(.h5p-correct) .h5p-text-input');
        var $lastInput = $inputs[$inputs.length - 1];
        if ($(this).is($lastInput) && !self.shiftPressed) {
          setTimeout(function () {
            self.focusButton();
          }, 10);
        }
      }
    }).on('change', function () {
      //self.triggerAnswered();
    });

    self.on('resize', function () {
      self.resetGrowTextField();
    });

    return this.$questions;
  };

  /**
   *
   */
  BlanksColl.prototype.autoGrowTextField = function ($input) {
    // Do not set text field size when separate lines is enabled
    if (this.params.behaviour.separateLines) {
      return;
    }

    var self = this;
    var fontSize = parseInt($input.css('font-size'), 10);
    var minEm = 3;
    var minPx = fontSize * minEm;
    var rightPadEm = 3.25;
    var rightPadPx = fontSize * rightPadEm;
    var static_min_pad = 0.5 * fontSize;

    setTimeout(function(){
      var tmp = $('<div>', {
        'html': $input.val()
      });
      tmp.css({
        'position': 'absolute',
        'white-space': 'nowrap',
        'font-size': $input.css('font-size'),
        'font-family': $input.css('font-family'),
        'padding': $input.css('padding'),
        'width': 'initial'
      });
      $input.parent().append(tmp);
      var width = tmp.width();
      var parentWidth = self.$questions.width();
      tmp.remove();
      if (width <= minPx) {
        // Apply min width
        $input.width(minPx + static_min_pad);
      } else if (width + rightPadPx >= parentWidth) {

        // Apply max width of parent
        $input.width(parentWidth - rightPadPx);
      } else {

        // Apply width that wraps input
        $input.width(width + static_min_pad);
      }

    }, 1);
  };

  /**
   * Resize all text field growth to current size.
   */
  BlanksColl.prototype.resetGrowTextField = function () {
    var self = this;

    this.$questions.find('input').each(function () {
      self.autoGrowTextField($(this));
    });
  };

  /**
   * Toggle buttons dependent of state.
   *
   * Using CSS-rules to conditionally show/hide using the data-attribute [data-state]
   */
  BlanksColl.prototype.toggleButtonVisibility = function (state) {
    // The show solutions button is hidden if all answers are correct
    var allCorrect = (this.getScore() === this.getMaxScore());
    if (this.params.behaviour.autoCheck && allCorrect) {
      // We are viewing the solutions
      state = STATE_FINISHED;
    }

//    if (this.params.behaviour.enableSolutionsButton) {
//      if (state === STATE_CHECKING && !allCorrect) {
//        this.showButton('show-solution');
//      }
//      else {
//        this.hideButton('show-solution');
//      }
//    }

//    if (this.params.behaviour.enableRetry) {
//      if (state === STATE_SHOWING_SOLUTION) {
//        this.showButton('try-again');
//      }
//      else {
//        this.hideButton('try-again');
//      }
//    }
      
      debugger;
      
    if (state === STATE_FINISHED) {
        this.showButton('continue-button');
    }

    this.showButton('submit-answer');
    this.trigger('resize');
  };

  /**
   * Check if all blanks are filled out. Warn user if not
   */
  BlanksColl.prototype.allBlanksFilledOut = function () {
    var self = this;

    if (!self.getAnswerGiven()) {
      this.updateFeedbackContent(self.params.notFilledOut);
      return false;
    }

    return true;
  };

  /**
   * Mark which answers are correct and which are wrong and disable fields if retry is off.
   */
//  Blanks.prototype.markResults = function () {
//    var self = this;
//    for (var i = 0; i < self.clozes.length; i++) {
//      self.clozes[i].checkAnswer();
//      if (!self.params.behaviour.enableRetry) {
//        self.clozes[i].disableInput();
//      }
//    }
//    this.trigger('resize');
//  };

  /**
   * Removed marked results
   */
  BlanksColl.prototype.removeMarkedResults = function () {
    this.$questions.find('.h5p-input-wrapper').removeClass('h5p-correct h5p-wrong');
    this.$questions.find('.h5p-input-wrapper > input').attr('disabled', false);
    this.trigger('resize');
  };


  /**
   * Displays the correct answers
   */
  BlanksColl.prototype.showCorrectAnswers = function () {
    var self = this;
    this.hideSolutions();

    for (var i = 0; i < self.clozes.length; i++) {
      self.clozes[i].showSolution();
    }
    this.trigger('resize');
  };

  /**
   * Display the correct solution for the input boxes.
   *
   * This is invoked from CP - be carefull!
   */
  BlanksColl.prototype.showSolutions = function () {
    this.params.behaviour.enableSolutionsButton = true;
    this.toggleButtonVisibility(STATE_FINISHED);
    this.markResults();
    this.showCorrectAnswers();
    this.showEvaluation();
    //Hides all buttons in "show solution" mode.
    this.hideButtons();
  };

  /**
   * Hides all buttons.
   * @public
   */
  BlanksColl.prototype.hideButtons = function () {
    this.toggleButtonVisibility(STATE_FINISHED);
  };

  /**
   * Trigger xAPI answered event
   */
  BlanksColl.prototype.triggerAnswered = function() {
    this.triggerXAPIScored(this.getScore(), this.getMaxScore(), 'answered');
  };
  
  /**
   * Show evaluation widget, i.e: 'You got x of y blanks correct'
   */
  BlanksColl.prototype.showEvaluation = function () {
    var maxScore = 0;
    var score = 0;
    var scoreText = "Thank you";
    this.setFeedback(scoreText, score, maxScore);

    if (score === maxScore) {
      this.toggleButtonVisibility(STATE_FINISHED);
    }
  };

  /**
   * Hide the evaluation widget
   */
  BlanksColl.prototype.hideEvaluation = function () {
    // Clear evaluation section.
    this.setFeedback();
  };

  /**
   * Hide solutions. (/try again)
   */
  BlanksColl.prototype.hideSolutions = function () {
    // Clean solution from quiz
    this.$questions.find('.h5p-correct-answer').remove();
  };

  /**
   * Get maximum number of correct answers.
   *
   * @returns {Number} Max points
   */
  BlanksColl.prototype.getMaxScore = function () {
    var self = this;
    return Number(self.params.behaviour.questionPoints);
  };

  /**
   * Count the number of correct answers.
   *
   * @returns {Number} Points
   */
  BlanksColl.prototype.getScore = function () {
    var self = this;
      
    var correct = true;
    for (var i = 0; i < self.clozes.length; i++) {
      if (!self.clozes[i].correct()) {
        correct = false;
        break;
      }
      self.params.userAnswers[i] = self.clozes[i].getUserAnswer();
    }
     
    var returnValue = 0;
    if (correct) {
        returnValue = Number(this.params.behaviour.questionPoints);
    }

    return returnValue;
  };

  BlanksColl.prototype.getTitle = function() {
    return H5P.createTitle(this.params.text);
  };

  /**
   * Clear the user's answers
   */
  BlanksColl.prototype.clearAnswers = function () {
    this.$questions.find('.h5p-text-input').val('');
  };

  /**
   * Checks if all has been answered.
   *
   * @returns {Boolean}
   */
  BlanksColl.prototype.getAnswerGiven = function () {
    var self = this;

    if (this.params.behaviour.showSolutionsRequiresInput === true) {
      for (var i = 0; i < self.clozes.length; i++) {
        if (!self.clozes[i].filledOut()) {
          return false;
        }
      }
    }

    return true;
  };

  /**
   * Helps set focus the given input field.
   * @param {jQuery} $input
   */
  BlanksColl.setFocus = function ($input) {
    setTimeout(function () {
      $input.focus();
    }, 1);
  };

  /**
   * Returns an object containing content of each cloze
   *
   * @returns {object} object containing content for each cloze
   */
  BlanksColl.prototype.getCurrentState = function () {
    var clozesContent = [];

    // Get user input for every cloze
    this.clozes.forEach(function (cloze) {
      clozesContent.push(cloze.getUserInput());
    });
    return clozesContent;
  };

  /**
   * Sets answers to current user state
   */
  BlanksColl.prototype.setH5PUserState = function () {
    var self = this;
    var isValidState = (this.previousState !== undefined &&
                        this.previousState.length &&
                        this.previousState.length === this.clozes.length);

    // Check that stored user state is valid
    if (!isValidState) {
      return;
    }

    // Set input from user state
    var hasAllClozesFilled = true;
    this.previousState.forEach(function (clozeContent, ccIndex) {
      var cloze = self.clozes[ccIndex];
      cloze.setUserInput(clozeContent);

      // Handle instant feedback
      if (self.params.behaviour.autoCheck) {
        if (cloze.filledOut()) {
//          cloze.checkAnswer();
            cloze.submitAnswer();
            
        } else {
          hasAllClozesFilled = false;
        }
      }
    });

    if (self.params.behaviour.autoCheck && hasAllClozesFilled) {
      self.showEvaluation();
      self.toggleButtonVisibility(STATE_CHECKING);
    }
  };

  /**
   * Disables any active input. Useful for freezing the task and dis-allowing
   * modification of wrong answers.
   */
  BlanksColl.prototype.disableInput = function () {
    this.$questions.find('input').attr('disabled', true);
  };

  return BlanksColl;
})(H5P.jQuery, H5P.Question);
