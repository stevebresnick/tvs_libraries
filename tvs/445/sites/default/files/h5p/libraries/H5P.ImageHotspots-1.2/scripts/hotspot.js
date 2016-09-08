/**
 * Defines the ImageHotspots.Hotspot class
 */
(function ($, ImageHotspots) {

  /**
   * Creates a new Hotspot
   *
   * @class
   * @namespace H5P.ImageHotspots
   * @param  {Object} config
   * @param  {string} color
   * @param  {number} id
   * @param  {boolean} isSmallDeviceCB
   * @param  {H5P.ImageHotspots} parent
   */
  ImageHotspots.Hotspot = function (config, color, id, isSmallDeviceCB, parent) {
    var self = this;
    this.config = config;
    this.visible = false;
    this.id = id;
    this.isSmallDeviceCB = isSmallDeviceCB;

    if (this.config.action === undefined) {
      throw new Error('Missing mandatory library for hotspot');
    }

    this.$element = $('<div/>', {
      'class': 'h5p-image-hotspot',
      click: function(){
        if(self.visible) {
          self.hidePopup();
        }
        else {
          self.showPopup();
        }
        return false;
      }
    }).css({
      top: this.config.position.y + '%',
      left: this.config.position.x + '%',
      color: '#'+ color
    });

    parent.on('resize', function () {
      if (self.popup && self.actionInstance.trigger !== undefined) {
        // The reason for this timeout is fullscreen on chrome on android
        setTimeout(function () {
          self.actionInstance.trigger('resize');
        }, 1);
      }
    });
  }

  /**
   * Append the hotspot to a container
   * @public
   * @param {H5P.jQuery} $container
   */
  ImageHotspots.Hotspot.prototype.appendTo = function ($container) {
    this.$container = $container;
    this.$element.appendTo($container);
  };

  /**
   * Display the popup
   * @public
   */
  ImageHotspots.Hotspot.prototype.showPopup = function () {
    var self = this;
      
    var hotSpotTitle = this.config.header;
    var hotSpotId = this.id;
    H5P.EventDispatcher.prototype.contentId = H5PIntegration.contents[Object.keys(H5PIntegration.contents)].mainId;
    H5P.EventDispatcher.prototype.contentEvent("Opened Hotspot",hotSpotId,hotSpotTitle);

    this.actionInstance = H5P.newRunnable(this.config.action, this.id);

    var waitForLoaded = (this.actionInstance.libraryInfo.machineName === 'H5P.Image' || this.actionInstance.libraryInfo.machineName === 'H5P.Video');

    var readyToPopup = function () {
      self.popup.show();
      self.$element.addClass('active');
      self.visible = true;
      self.actionInstance.trigger('resize');
    };

    // Create popup content:
    var $popupBody = $('<div/>', {'class': 'h5p-image-hotspot-popup-body'});
    self.actionInstance.attach($popupBody);
    self.popup = new ImageHotspots.Popup(self.$container, $popupBody, self.config.position.x, self.config.position.y, self.$element.outerWidth(), self.config.header, self.config.action.library.split(' ')[0].replace('.','-').toLowerCase(), self.config.alwaysFullscreen || self.isSmallDeviceCB());

    if (waitForLoaded) {
      var fire = function () {
        clearTimeout(timeout);
        self.actionInstance.off('loaded', fire);
        setTimeout(function () {
          readyToPopup();
        }, 100);
      };

      // Add timer fallback if loaded event is not triggered
      var timeout = setTimeout(fire, 1000);
      this.actionInstance.on('loaded', fire);
      self.actionInstance.trigger('resize');
    }
    else {
      setTimeout(function () {
        readyToPopup();
      }, 100);
    }

    // We don't get click events on body for iOS-devices
    $('body').children().on('click.h5p-image-hotspot-popup', function(event) {
      var $target = $(event.target);
      if(!$target.hasClass('h5p-enable-fullscreen') && !$target.hasClass('h5p-disable-fullscreen')) {
        self.hidePopup();
      }
    });
  };

  /**
   * Hide popup
   * @public
   */
  ImageHotspots.Hotspot.prototype.hidePopup = function () {
    if (this.popup) {
        var hotSpotTitle = this.config.header;
        var hotSpotId = this.id;
        H5P.EventDispatcher.prototype.contentEvent("Closed Hotspot",hotSpotId,hotSpotTitle);
        
      // We don't get click events on body for iOS-devices
      $('body').children().off('click.h5p-image-hotspot-popup');

      this.popup.hide();
      this.$element.removeClass('active');
      this.visible = false;

      this.popup = undefined;
    }
  };

  /**
   * Hex string to RGB
   * eg: FFFFFF -> 255,255,255
   * @private
   * @param {string} hex
   * @returns {string} RGB equivalent
   */
  var hexToRgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(result) {
      return parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16);
    }
    return '0,0,0';
  };

})(H5P.jQuery, H5P.ImageHotspots);
