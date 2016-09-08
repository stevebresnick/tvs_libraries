var H5P = H5P || {};
H5P.MLE = H5P.MLE || {};

H5P.MLE.SummarySlide = (function ($, JoubelUI) {

  /**
   * Constructor for summary slide
   * @param {MLE} MLE parent of summary slide
   * @param {$} $summarySlide Summary slide element
   * @constructor
   */
  function SummarySlide(mle, $summarySlide) {
    // Create summary slide if not an editor
    this.$summarySlide = $summarySlide;
    this.mle = mle;
  }

  /**
   * Updates the provided summary slide with current values.
   *
   * @param {$} $summarySlide Summary slide that will be updated
   */
  SummarySlide.prototype.updateSummarySlide = function (slideNumber, noJump) {
    var that = this;

    if (this.mle.editor !== undefined) {
      return;
    }

    // Remove old content
    this.$summarySlide.children().remove();

    // Get scores and updated html for summary slide
    var slideScores = that.mle.getSlideScores(noJump);
    var htmlText = that.outputScoreStats(slideScores);
    $(htmlText).appendTo(that.$summarySlide);

    // Button container ref
    var $summaryFooter = $('.h5p-summary-footer', that.$summarySlide);
    that.mle.$summarySlide.hide();
  };

  /**
   * Gets html for summary slide.
   *
   * @param slideScores Scores for all pages
   * @returns {string} html
   */
  SummarySlide.prototype.outputScoreStats = function (slideScores) {
    var self = this;
      
    if (slideScores === undefined) {
      this.$summarySlide.addClass('h5p-summary-only-export');
      return '<div class="h5p-summary-footer"></div>';
    }
    H5P.jQuery(".h5p-question").hide();

      var that = this;
    var totalScore = 0;
    var totalMaxScore = 0;
    var tds = ''; // For saving the main table rows
    var i;
    var slidePercentageScore = 0;
    var slideDescription = '';
    var slideElements;
    var action;
    for (i = 0; i < slideScores.length; i += 1) {
      // Get percentage score for slide
      debugger;
      slidePercentageScore = (Number(slideScores[i].score) / Number(slideScores[i].maxscore)) * 100;
      if (slideScores[i].score === 0) {
        slidePercentageScore = 0;
      }
        
      if (self.mle.$allQuestions[i].getTitle !== undefined) {
          slideDescription = self.mle.$allQuestions[i].getTitle();
      }
      else {
          slideDescription = self.mle.$allQuestions[i].params.text;
      }

      if (slideScores[i].maxScore !== 0) {
          slidePercentageScore = Math.round((Number(slideScores[i].score) / Number(slideScores[i].maxScore)) * 100);
      }
      else {
          slidePercentageScore = 0;
      }
      
        
      tds +=
        '<tr>' +
          '<td class="h5p-td h5p-summary-task-title">' +
            '<span role="button" class="h5p-slide-link" data-slide="' + (i+1) + '">Question ' + (i+1) + ': ' + (slideDescription.replace(/(<([^>]+)>)/ig, "")) + '</span>' +
          '</td>' +
          '<td class="h5p-td h5p-summary-score-bar">' +
            '<div title="' + slidePercentageScore + '%" class="h5p-summary-score-meter">' +
              '<span style="width: ' + slidePercentageScore + '%; opacity: ' + (slidePercentageScore / 100) + '"></span>' +
            '</div>' +
          '</td>' +
        '</tr>';
      totalScore += Number(slideScores[i].score);
      totalMaxScore += Number(slideScores[i].maxScore);
    }

    var bSuccess = false;
    var scoreToPass = Number(that.mle.scoreToPass.toString().replace("%",""));
    var overallPercentageScore = Math.round((Number(totalScore) / Number(totalMaxScore)) * 100);
    if (overallPercentageScore >= scoreToPass) {
        bSuccess = true;
    }

    that.mle.triggerXAPICompleted(totalScore, totalMaxScore,bSuccess);

    var percentScore = Math.round((Number(totalScore) / Number(totalMaxScore) * 100));

    var html =
      '<div class="h5p-score-message">' +
      '<div class="h5p-score-message-percentage">Score: ' + percentScore + '%</div>' +
      '</div>' +
      '<div class="h5p-summary-table-holder">' +
      ' <div class="h5p-summary-table-pages">' +
      '   <table class="h5p-score-table">' +
      '     <tbody>' + tds + '</tbody>' +
      '   </table>' +
      ' </div>' +
      ' <table class="h5p-summary-total-table" style="width: 100%">' +
      '    <tr>' +
      '     <td class="h5p-td h5p-summary-task-title">Total</td>' +
      '     <td class="h5p-td h5p-summary-score-bar">' +
      '       <div title="' + percentScore + '%" class="h5p-summary-score-meter">' +
      '         <span style="width: ' + percentScore + '%; opacity: ' + (percentScore / 100) + '"></span>' +
      '       </div>' +
      '     </td>' +
      '   </tr>' +
      ' </table>' +
      '</div>' +
      '<div class="h5p-summary-footer">' +
      '</div>';

    return html;
  };

  /**
   * Gets total scores for all slides
   * @param {Array} slideScores
   * @returns {{totalScore: number, totalMaxScore: number, totalPercentage: number}} totalScores Total scores object
   */
  SummarySlide.prototype.totalScores = function (slideScores) {
    if (slideScores === undefined) {
      return {
        totalScore: 0,
        totalMaxScore: 0,
        totalPercentage: 0
      };
    }
    var totalScore = 0;
    var totalMaxScore = 0;
    var i;
    for (i = 0; i < slideScores.length; i += 1) {
      // Get percentage score for slide
      totalScore += Number(slideScores[i].score);
      totalMaxScore += Number(slideScores[i].maxScore);
    }

    var totalPercentage = Math.round((totalScore / totalMaxScore) * 100);
    if (isNaN(totalPercentage)) {
      totalPercentage = 0;
    }

    return {
      totalScore: totalScore,
      totalMaxScore: totalMaxScore,
      totalPercentage: totalPercentage
    };
  };

  return SummarySlide;
})(H5P.jQuery, H5P.JoubelUI);
