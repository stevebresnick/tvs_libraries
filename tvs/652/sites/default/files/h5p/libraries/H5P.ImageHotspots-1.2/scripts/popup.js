/**
 * Defines the ImageHotspots.Popup class
 */
(function ($, ImageHotspots) {

  /**
   * Creates new Popup instance
   *
   * @class
   * @namespace H5P.ImageHotspots
   * @param {H5P.jQuery} $container
   * @param {H5P.jQuery} $content
   * @param {number} x
   * @param {number} y
   * @param {number} hotspotWidth
   * @param {string} header
   * @param {string} className
   * @param {boolean} fullscreen
   *
   */
  ImageHotspots.Popup = function ($container, $content, x, y, hotspotWidth, header, className, fullscreen) {
      

    var self = this;
    this.$container = $container;
    var width = this.$container.width();

    var pointerWidthInPercent = 4;
    hotspotWidth = (hotspotWidth/width)*100;

    var popupLeft = 0;
    var popupWidth = 0;
    var toTheLeft = false;

    if (fullscreen) {
      popupWidth = 100;
      className += ' fullscreen-popup';
    }
    else {
      toTheLeft = (x > 45);
      popupLeft = (toTheLeft ? 0 : (x + hotspotWidth + pointerWidthInPercent));
      popupWidth = (toTheLeft ?  x - pointerWidthInPercent : 100 - popupLeft);
    }

    this.$popupBackground = $('<div/>', {'class': 'h5p-image-hotspots-overlay'});
    //debugger;
    this.$popup = $('<div/>', {
      'class': 'h5p-image-hotspot-popup ' + className
    }).css({
      right: '0%',
      width: 'auto',
      height: 'auto',
    }).click(function (event){
      // If clicking on popup, stop propagating:
      event.stopPropagation();
    }).appendTo(this.$popupBackground);

    this.$popupContent = $('<div/>', {'class': 'h5p-image-hotspot-popup-content'});
    if (header) {
      this.$popupContent.append($('<div/>', {'class': 'h5p-image-hotspot-popup-header', html: header}));
      this.$popup.addClass('h5p-image-hotspot-has-header');
    }
    $content.appendTo(this.$popupContent);
    this.$popupContent.appendTo(this.$popup);

    // Need to add pointer to parent container, since this should be partly covered
    // by the popup

      this.$closeButton = $('<div>', {
        'class': 'h5p-image-hotspot-close-popup-button',
      }).click(function (event) { self.hide();}).appendTo(this.$popup);


    var $fullscreenButton = $('.h5p-enable-fullscreen');
    this.$closeButton.css({
      minWidth: $fullscreenButton.outerWidth() + 'px',
      width: '5%',
      top: $fullscreenButton.outerHeight() + 'px'
    });

    H5P.Transition.onTransitionEnd(self.$popup, function () {
      self.$closeButton.css({
        right: '0'
      });
    }, 300);

    this.$popupBackground.appendTo(this.$container);

    self.show = function () {
      // Fix height
      var contentHeight = self.$popupContent.height();
      var parentHeight = self.$popup.height();
      if (!fullscreen) {
      if (contentHeight < parentHeight) {
        // don't need all height:
        self.$popup.css({
          maxHeight: 'auto',
          height: 'auto'
        });

        // find new top:
        var yInPixels = (y / 100) * parentHeight;
        var top = ((y / 100) * parentHeight) - (contentHeight / 2);

        if (top < 0) {
          top = 0;
        }
        else if (top + contentHeight > parentHeight) {
          top = parentHeight - contentHeight;
        }

        // From pixels to percent:
        var pointerTop = yInPixels - top;
        top = (top / parentHeight) * 100 ;

        self.$popup.css({
          top: top + '%'
        });

        // Need to move pointer:
        var pointerHeightInPercent = (self.$pointer.height() / contentHeight) * 100 ;
        self.$pointer.css({
          top: ((pointerTop / contentHeight) * 100) - (parentHeight/contentHeight*0.5) + '%'
        });
      }
      else {
        // Need all height:
        self.$popupContent.css({
          height: '100%',
          overflow: 'auto'
        });
      }
    }
debugger;
    self.$popup.css({
      right: '0%',
      height: 'auto',
      width: 'auto'
    });
    self.$popupBackground.addClass('visible');
  };

  self.hide = function () {
    this.$popupBackground.remove();
  };
}
})(H5P.jQuery, H5P.ImageHotspots);
