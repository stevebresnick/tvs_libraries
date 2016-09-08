var H5PEditor = H5PEditor || {};
var ns = H5PEditor;

/**
 * Adds a file upload field to the form.
 *
 * @param {mixed} parent
 * @param {object} field
 * @param {mixed} params
 * @param {function} setValue
 * @returns {ns.File}
 */
ns.File = function (parent, field, params, setValue) {
    var self = this;

    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;
    this.library = parent.library + '/' + field.name;

    if (params !== undefined) {
        this.copyright = params.copyright;
    }

    this.changes = [];
    this.passReadies = true;
    parent.thisfileObject = this;

    parent.ready(function () {
        self.passReadies = false;
    });
};

/**
 * Append field to the given wrapper.
 *
 * @param {jQuery} $wrapper
 * @returns {undefined}
 */
ns.File.prototype.appendTo = function ($wrapper) {
  var self = this;
  
  ns.File.addIframe();

  var label = '';
  if (this.field.label !== 0) {
    label = '<span class="h5peditor-label">' + (this.field.label === undefined ? this.field.name : this.field.label) + '</span>';
  }
    
    var copyRightHtml = "";
    if ((this.showEditorCopyright) && (this.showEditorCopyright == true)){
        copyRightHtml = "<br /><br />" + ns.t('core', 'editCopyright') + '<a class="h5p-copyright-button" href="#">' + ns.t('core', 'editCopyright') + '</a>';
    }

    var html = ns.createItem(this.field.type, label + '<span class="fileThumb"></span><div role="button" tabindex="1" class="h5p-add-file" title="' + H5PEditor.t('core', 'addFile') + '"></div><div class="h5p-add-dialog"><div class="h5p-dialog-box"><button class="h5p-file-upload">Upload new file</button></div><div class="h5p-or"><span>or</span></div><div class="h5p-dialog-box"><button class="h5p-file-from-dam">Select file from library</button></div><div class="h5p-buttons"><button class="h5p-cancel">Cancel</button></div></div>' +  copyRightHtml, this.field.description);

  var $container = ns.$(html).appendTo($wrapper);
    
  this.$file = $container.find('.fileThumb');
  this.$errors = $container.find('.h5p-errors');
  this.addFile();
  if (this.$file.find("img").length > 0) {
    H5P.jQuery(".h5p-add-file").hide();  
  }
    
  $container.children('.h5p-add-file').click(function () {
      $container.find('.h5p-add-dialog').addClass('h5p-open');
  });
  $container.find('.h5p-cancel').click(function () {
      $container.find('.h5p-add-dialog').toggleClass('h5p-open');
  });
  $container.find('.h5p-file-upload').click(function () {
      
      $container.find('.h5p-add-dialog').toggleClass('h5p-open');
      self.uploadFile();
      return false;
  });
  $container.find('.h5p-file-from-dam').click(function () {
      $container.find('.h5p-add-dialog').toggleClass('h5p-open');
      parent.thisfileObject = self;
      var nodeId = H5PEditor.contentId;

      parent.document.getElementById("approvedDamContentFrame").src = "/sites/all/libraries/tvs/get_dam_content.php?typ=img&r=" + Math.random().toString(36).substring(7) + "&nid=" + nodeId;
      parent.document.getElementById('approvedContent').style.display='block';
  });

  var $dialog = $container.find('.h5p-editor-dialog');
  $container.find('.h5p-copyright-button').add($dialog.find('.h5p-close')).click(function () {
    $dialog.toggleClass('h5p-open');
    return false;
  });

  var group = new ns.widgets.group(self, ns.copyrightSemantics, self.copyright, function (field, value) {
    if (self.params !== undefined) {
      self.params.copyright = value;
    }
    self.copyright = value;
  });
  group.appendTo($dialog);
  group.expand();
  group.$group.find('.title').remove();
  this.children = [group];
};


/**
 * Sync copyright between all video files.
 *
 * @returns {undefined}
 */
ns.File.prototype.setCopyright = function (value) {
  this.copyright = this.params.copyright = value;
};

/**
 * Creates thumbnail HTML and actions.
 *
 * @returns {Boolean}
 */
ns.File.prototype.addFile = function () {
  var that = this; 

  if (this.params === undefined) {
    this.$file.html('<a href="#" class="add" title="' + ns.t('core', 'addFile') + '"></a>').children('.add').click(function () {
      that.uploadFile();
      return false;
    });
    return;
  }

  var thumbnail;
  if (this.field.type === 'image') {
    thumbnail = {};
    thumbnail.path = H5P.getPath(this.params.path, H5PEditor.contentId);
    thumbnail.height = "auto";
    thumbnail.width = "200";
  }
  else if ((this.field.type === 'pdf') || (this.field.type === 'ppt')) {
    thumbnail = {};
    thumbnail.path = '/sites/all/modules/h5p/modules/h5peditor/h5peditor/images/binary-file.png';
    thumbnail.height = "auto";
    thumbnail.width = "200";
  } 
  else {
    thumbnail = ns.fileIcon;
  }

  this.addFileToPage(thumbnail);
};

/**
 * Creates thumbnail HTML and actions.
 *
* @returns {Boolean}
 */
ns.File.prototype.addDAMFile = function (imagePath,imageExt,width,height) {
    var that = this; 

    var thumbnail;
    thumbnail = {};
    thumbnail.path = H5P.getPath(imagePath, H5PEditor.contentId);
    thumbnail.height = height;
    thumbnail.width = width;
    
    that.params = {
        path: thumbnail.path,
        mime: "image/" + imageExt,
        height: thumbnail.height,
        width: thumbnail.width,
        copyright: that.copyright
    };

    that.setValue(that.field, that.params);

    for (var i = 0; i < that.changes.length; i++) {
        that.changes[i](that.params);
    }
    
    H5P.jQuery(".h5p-add-file").hide();  
    
    parent.document.getElementById("approvedDamContentFrame").src = "";

    this.addFileToPage(thumbnail);
};

/**
 * Start a new upload.
 */
ns.File.prototype.uploadFile = function () {
  var that = this; 

  if (ns.File.$file === 0) {
    return; // Wait for our turn :)
  }

  this.$errors.html('');

  ns.File.changeCallback = function () {
    that.$file.html('<div class="h5peditor-uploading h5p-throbber">' + ns.t('core', 'uploading') + '</div>');
  };

  ns.File.callback = function (err, result) {
    try {
    
      if (err) {
        throw err;
      }
        
        var nodeId = 0;
        if (H5P.instances.length > 0) {
            nodeId = H5P.instances[0].contentId;
        }
        else {
            nodeId = H5PEditor.contentId;
            if (nodeId === undefined) { nodeId = 0;}
        }
        
        if (that.field.type === 'image') {   
            var convertImageInDAMJSON = { 
                filePath: result.path,
                tvsNode: nodeId
            }

            var convertImageInDAMUrl = "/sites/all/libraries/tvs/post_to_dam_images.php";
            
            if (that.$file !== undefined && that.$file.length !== 0) {
                that.$file.html('<div class="h5peditor-uploading h5p-throbber">' + H5PEditor.t('core', 'damProcessing') + '</div>');
            }

            H5P.jQuery.ajax({ 
                type: "POST",
                data: convertImageInDAMJSON,
                dataType: "json",
                url: convertImageInDAMUrl,
                success: function(data){
                        that.params = {
                            path: H5P.getPath(result.path, H5PEditor.contentId),
                            mime: result.mime,
                            copyright: that.copyright
                          };
                          if (that.field.type === 'image') {
                            that.params.width = result.width;
                            that.params.height = result.height;
                          }

                          that.setValue(that.field, that.params);

                          for (var i = 0; i < that.changes.length; i++) {
                            that.changes[i](that.params);
                          }
                    
                          H5P.jQuery(".h5p-add-file").hide();
                          that.addFileToPage(that.params);
                    },
                error: function(data) {
                        that.params = {
                            path: H5P.getPath(result.path, H5PEditor.contentId),
                            mime: result.mime,
                            copyright: that.copyright
                          };
                          if (that.field.type === 'image') {
                            that.params.width = result.width;
                            that.params.height = result.height;
                          }

                          that.setValue(that.field, that.params);

                          for (var i = 0; i < that.changes.length; i++) {
                            that.changes[i](that.params);
                          }
                    
                          H5P.jQuery(".h5p-add-file").hide();
                          that.addFileToPage(that.params);

                    }
                });
        }
        else if ((that.field.type === 'pdf') || (that.field.type === 'ppt')) {
            var convertFileSON = { 
                filePath: result.path,
                tvsNode: nodeId
            }

            var convertFileUrl = "/sites/all/libraries/tvs/convert_pdf_to_html5.php";
            if (that.field.type === 'ppt') {
                convertFileUrl = "/sites/all/libraries/tvs/convert_ppt_to_html5.php";
            }
            
            if (that.$file !== undefined && that.$file.length !== 0) {
                that.$file.html('<div class="h5peditor-uploading h5p-throbber">' + H5PEditor.t('core', 'damProcessing') + '</div>');
            }

            H5P.jQuery.ajax({ 
                type: "POST",
                data: convertFileSON,
                dataType: "json",
                url: convertFileUrl,
                success: function(data){
                    that.params = {
                        path: H5P.getPath(result.path, H5PEditor.contentId),
                        mime: result.mime,
                        copyright: that.copyright
                      };


                      that.setValue(that.field, that.params);

                      for (var i = 0; i < that.changes.length; i++) {
                        that.changes[i](that.params);
                      }

                      H5P.jQuery(".h5p-add-file").hide();
                      that.addFileToPage(that.params);
                    
                      debugger;
                      window.processingObj = that;
                      if (that.field.type === 'ppt') {
                            data = data.substring(data.indexOf("ppts/"));
                      }
                      that.monitorConversions(that.field.type,H5PEditor.contentId,data,result.mime);
                    },
                error: function(data) {
                    that.params = {
                        path: H5P.getPath(result.path, H5PEditor.contentId),
                        mime: result.mime,
                        copyright: that.copyright
                      };


                      that.setValue(that.field, that.params);

                      for (var i = 0; i < that.changes.length; i++) {
                        that.changes[i](that.params);
                      }

                      H5P.jQuery(".h5p-add-file").hide();
                      that.addFileToPage(that.params);
                    
                      debugger;
                      window.processingObj = that;
                      if (that.field.type === 'ppt') {
                            data.responseText = data.responseText.substring(data.responseText.indexOf("ppts/"));
                      }
                      that.monitorConversions(that.field.type,H5PEditor.contentId,data.responseText,result.mime);
                    }
                });
        }
        else {
            that.setValue(that.field, that.params);

            for (var i = 0; i < that.changes.length; i++) {
                that.changes[i](that.params);
            }
        }
    }
    catch (error) {
      that.$errors.append(ns.createError(error));
    }
  };

  if (this.field.mimes !== undefined) {
    var mimes = '';
    for (var i = 0; i < this.field.mimes.length; i++) {
      if (mimes !== '') {
        mimes += ',';
      }
      mimes += this.field.mimes[i];
    }
    ns.File.$file.attr('accept', mimes);
  }
  else if (this.field.type === 'image') {
    ns.File.$file.attr('accept', 'image/jpeg,image/png,image/gif');
  }
  else if (this.field.type === 'pdf') {
    ns.File.$file.attr('accept', 'application/pdf');
  }
  else if (this.field.type === 'ppt') {
    ns.File.$file.attr('accept', 'application/powerpoint');
  }

  ns.File.$field.val(JSON.stringify(this.field));
  ns.File.$file.click();
};

/**
 * Validate this item
 */
ns.File.prototype.validate = function () {
  return true;
};

/**
 * Remove this item.
 */
ns.File.prototype.remove = function () {
  // TODO: Check what happens when removed during upload.
  this.$file.parent().remove();
};

/**
 * Collect functions to execute once the tree is complete.
 *
 * @param {function} ready
 * @returns {undefined}
 */
ns.File.prototype.ready = function (ready) {
  if (this.passReadies) {
    this.parent.ready(ready);
  }
  else {
    ready();
  }
};

ns.File.prototype.monitorConversions = function(fileType, contentId,processedFilePath,mime) {
    H5PEditor.readyToSave = true;
    localStorage.setItem("fileBeingConverted", processedFilePath);
}

/**
 * Add the iframe we use for uploads.
 */
ns.File.addIframe = function () {
  
  if (ns.File.iframeLoaded !== undefined) {
    return;
  }
  ns.File.iframeLoaded = true;

  // Prevent trying to parse first load event.
  var initialized = false;
  

  // All editor uploads share this iframe to conserve valuable resources.
  ns.$('<iframe id="h5peditor-uploader"></iframe>').load(function (data) {
    
    var $body = ns.$(this).contents().find('body');

    if (initialized) {
      // Try to read response
      var response, error;
      try {
        response = JSON.parse($body.text());
        if (response.error) {
          error = response.error;
        }
      }
      catch (err) {
        H5P.error(err);
        error = H5PEditor.t('core', 'fileToLarge');
      }

      // Trigger callback if set.
      if (ns.File.callback !== undefined) {
        if (error) {
          ns.File.callback(H5PEditor.t('core', 'uploadError') + ': ' + error);
        }
        else {
          ns.File.callback(undefined, response);
        }
      }
    }
    else {
      initialized = true;
    }

    $body.html('');
    
    var $form = ns.$('<form method="post" enctype="multipart/form-data" action="' + ns.getAjaxUrl('files') + '"><input name="file" type="file"/><input name="field" type="hidden"/><input name="contentId" type="hidden" value="' + (ns.contentId === undefined ? 0 : ns.contentId) + '"/></form>').appendTo($body);

    ns.File.$field = $form.children('input[name="field"]');
    ns.File.$file = $form.children('input[name="file"]');
    

    ns.File.$file.change(function () {
      if (ns.File.changeCallback !== undefined) {
        ns.File.changeCallback();
      }
      ns.File.$field = 0;
      ns.File.$file = 0;
      $form.submit();
    });

  }).appendTo('body');
};

// Tell the editor what widget we are.
ns.widgets.file = ns.File;
ns.widgets.image = ns.File;
ns.widgets.pdf = ns.File;
ns.widgets.ppt = ns.File;

//Jun8,2016@12:24AM Updated by Avneet Chadha

  ns.File.prototype.addFileToPage = function (thumbnail){
 var that = this;

  var thumbnailImg = thumbnail.path;
  if ((thumbnail.path.toLowerCase().indexOf(".pdf") > -1) || (thumbnail.path.toLowerCase().indexOf(".ppt") > -1) || (thumbnail.path.toLowerCase().indexOf("index.html") > -1)) {
      thumbnailImg = '/sites/all/modules/h5p/modules/h5peditor/h5peditor/images/binary-file.png';
  }
  this.$file.html('<a href="#" title="' + ns.t('core', 'changeFile') + '" class="thumbnail"><img style="max-width:250px" alt="' + (this.field.label === undefined ? '' : this.field.label) + '"/><a href="#" class="remove" title="' + ns.t('core', 'removeFile') + '"><img style="width: 16px;position: absolute;" src="/sites/default/files/images/trash.svg" /></a></a>').children(':eq(0)').click(function () {
    that.uploadFile();
    return false;
  }).children('img').attr('src', thumbnailImg).end().next().click(function (e) {
    if (!confirm(ns.t('core', 'confirmRemoval', {':type': 'file'}))) {
      return false;
    }
    delete that.params;
    that.setValue(that.field);
    that.addFile();
    H5P.jQuery(".h5p-add-file").show();

    for (var i = 0; i < that.changes.length; i++) {
      that.changes[i]();
    }

    return false;
  });
      
      if ((H5PEditor.contentId != 0) && (H5PEditor.contentId != undefined)) {
          if (this.field.type.toLowerCase() === "pdf") {
             var pdfFilePath = this.params.path.replace("http://","https://").replace(".pdf", "/index.html");
              
              var urlExist = true;
              H5P.jQuery.ajax({url:pdfFilePath,async: false,type:'HEAD',error:urlExist=false});
              if (urlExist) {
                  this.$file.html(this.$file.html() + "<span style='float:right;'><iframe src='" + pdfFilePath + "'  frameborder='0' webkitallowfullscreen='' mozallowfullscreen='' allowfullscreen='' style='height: 300px;'></iframe></span>");
              }
          }
          else if (this.field.type.toLowerCase() === "ppt") {
              var pptFilePath = this.params.path.replace("http://","https://").replace(".pptx", "/index.html").replace(".ppt", "/index.html");
              
              var urlExist = true;
              H5P.jQuery.ajax({url:pptFilePath,async: false,type:'HEAD',error:urlExist=false});
              if (urlExist) {
                  this.$file.html(this.$file.html() + "<span style='float:right;'><iframe src='" + pptFilePath + "'  frameborder='0' webkitallowfullscreen='' mozallowfullscreen='' allowfullscreen='' style='height: 300px;'></iframe></span>");
              }
          }
      } 
  };


