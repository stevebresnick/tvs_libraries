var H5P = H5P || {};

/**
 * Constructor.
 *
 * @param {Object} params Options for this library.
 * @param {Number} id Content identifier
 * @returns {undefined}
 */
(function ($) {
  H5P.PDF = function (params, id) {
    H5P.EventDispatcher.call(this);
      
    this.on('resize', function () {
      this.resize();
    });
      
    if (params.title !== undefined) {
      this.title = params.title;
    }

    this.params = params;
  };

  H5P.PDF.prototype = Object.create(H5P.EventDispatcher.prototype);
  H5P.PDF.prototype.constructor = H5P.PDF;

  /**
   * Wipe out the content of the wrapper and put our HTML in it.
   *
   * @param {jQuery} $wrapper
   * @returns {undefined}
   */
  H5P.PDF.prototype.attach = function ($wrapper) {
    var self = this;
    var url = this.params.files.path.replace("http://","https://").replace(".pdf", "/index.html");
      
    if (window.location.host.toLowerCase().indexOf("showpad.biz") > 0) {
        debugger;
        var parseUrl = document.createElement('a');
        parseUrl.href = this.params.files.path;
        var pdfRelPath = parseUrl.pathname;
        
        url = window.location.protocol + "//" + window.location.host + window.location.pathname.replace("indexc.html","") + pdfRelPath.replace("/sites/default/files/h5peditor","sites/default/files/h5p/content/" + Object.keys(H5PIntegration.contents)[0].replace("cid-","")).replace(".pdf","/index.html");
    }
      
    var sanitizedUrl = sanitizeUrlProtocol(url);
    $wrapper.addClass('h5p-pdf').html('<iframe id="pdfFrame" src="' + sanitizedUrl + '" target="_self" width="100%"  frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen="">' + this.params.title + '</iframe>');
      
    this.trigger('resize');
  };
    
  /**
     * Private. Remove illegal url protocols from uri
     */
    var sanitizeUrlProtocol = function(uri) {
      var allowedProtocols = ['http', 'https', 'ftp', 'irc', 'mailto', 'news', 'nntp', 'rtsp', 'sftp', 'ssh', 'tel', 'telnet', 'webcal', 'showpad', 'btcjsapi','ms-local-stream'];

      var first = true;
      var before = '';
      while (first || uri != before) {
        first = false;
        before = uri;
        var colonPos = uri.indexOf(':');
        if (colonPos > 0) {
          // We found a possible protocol
          var protocol = uri.substr(0, colonPos);
          // If the colon is preceeded by a hash, slash or question mark it isn't a protocol
          if (protocol.match(/[/?#]/g)) {
            break;
          }
          // Is this a forbidden protocol?
          if (allowedProtocols.indexOf(protocol.toLowerCase()) == -1) {
            // If illegal, remove the protocol...
            uri = uri.substr(colonPos + 1);
          }
        }
      }
      return uri;
    };
    
    H5P.PDF.prototype.resize = function () {
        var self = this;
        debugger;

        var innerHeight = window.innerHeight;
        if (innerHeight < 100) { innerHeight = 600;}
        if (document.getElementById("pdfFrame") !== null) {
            document.getElementById("pdfFrame").style.height = innerHeight + "px";
        }
  };

  return H5P.PDF;
}(H5P.jQuery));
