/**
 * @class Oskari.mapframework.bundle.publisher.view.StartView
 * Renders the "publisher" view for users that are logged in and can publish maps.
 * This is an initial screen where the user is told that the map will move in to a publisher view.
 */
Oskari.clazz.define(
    'Oskari.mapframework.bundle.publisher.view.StartView',
    
    /**
     * @method create called automatically on construction
     * @static
     * @param {Oskari.mapframework.bundle.publisher.PublisherBundleInstance} instance
     * 		reference to component that created this view
     * @param {Object} localization
     *      localization data in JSON format
     */
    function(instance, localization) {
	this.instance = instance;
	this.template = jQuery("<div class='startview'><div class='content'></div><div class='buttons'></div></div>");
	this.templateLayerList = jQuery("<div class='layerlist'><h4></h4><ul></ul></div>");
	this.templateListItem = jQuery("<li></li>");
	this.templateError = jQuery('<div class="error"><ul></ul></div>');
	this.templateInfo = jQuery("<div class='icon-info'></div>");
	this.loc = localization;
	this.content = undefined;
	this.buttons = {};
    }, {
        /**
         * @method render
         * @param {jQuery} container reference to DOM element this component will be rendered to
         * Renders component to given DOM element
         */
	render : function(container) {
	    var me = this;
	    var content = this.template.clone();
	    this.content = content;
            var txt = "<missing_localisation>";
            if (this.loc && this.loc.text) {
                txt = this.loc.txt;
            }            
	    content.find('div.content').before(txt);
	    container.append(content);
	    
	    var continueButton = 
                Oskari.clazz.create('Oskari.userinterface.component.Button');
	    continueButton.addClass('primary');
            var txt = 'loc.buttons.continue';
            if (this.loc &&
                this.loc.buttons &&
                this.loc.buttons['continue']) {
                txt = this.loc.buttons['continue'];
            }
	    continueButton.setTitle(txt);
            continueButton.setHandler(function() {
        	                          me.instance.setPublishMode(true, me.getLayersWithoutPublishRights());
                                      });
	    this.buttons['continue'] = continueButton;
	    
	    
	    var cancelButton = Oskari.clazz.create('Oskari.userinterface.component.Button');
            txt = 'loc.buttons.cancel';
            if (this.loc && 
                this.loc.buttons && 
                this.loc.buttons.cancel) {
                txt = this.loc.buttons.cancel;
            }
	    cancelButton.setTitle(txt);
            cancelButton.setHandler(function() {
                                        me.instance.sandbox.postRequestByName('userinterface.UpdateExtensionRequest', [me.instance, 'close']);
                                    });
	    this.buttons['cancel'] = cancelButton;
	    
            cancelButton.insertTo(content.find('div.buttons'));
            continueButton.insertTo(content.find('div.buttons'));
            
	    this.renderLayerLists();
	},
	renderLayerLists : function() {
	    // empty any current lists
	    
	    var container = this.content.find('div.content');
	    container.find('div.error').remove();
	    container.find('div.layerlist').remove();
	    
            // resolve layers
            var layers = [];
            var deniedLayers = [];
            var selectedLayers = this.instance.sandbox.findAllSelectedMapLayers();
            for (var i = 0; i < selectedLayers.length; ++i) {
        	var layer = selectedLayers[i];
        	if(!this._hasPublishRight(layer)) {
        	    deniedLayers.push(layer);
        	}
        	else {
        	    layers.push(layer);
        	}
            }
            // render list of layers with publication rights
            if(layers.length > 0) {
		var layersList = this._getRenderedLayerList(layers);
		var heading = layersList.find('h4');
                var txt = 'loc.layerlist_title';
                if (this.loc &&
                    this.loc.layerlist_title) {
                    txt = this.loc.layerlist_title;
                }
		heading.append(txt);
		container.append(layersList);
		
	        // render list of layers that cannot be published
	        if(deniedLayers.length > 0) {
		    var deniedLayersList = this._getRenderedLayerList(deniedLayers);
		    var heading = deniedLayersList.find('h4');
                    txt = 'loc.layerlist_denied';
                    if (this.loc &&
                        this.loc.layerlist_denied) {
                        txt = this.loc.layerlist_denied
                    }
		    heading.append(txt);
		    // add tooltip
		    var tooltip = this.templateInfo.clone(); 
		    tooltip.attr('title', this.loc.denied_tooltip);
		    heading.before(tooltip);
		    container.append(deniedLayersList);
	        }
            }
            else {
        	// write a message that 
        	var errorsList= this.templateError.clone();
        	var error = this.templateListItem.clone();
        	error.append(this.loc.layerlist_empty);
        	errorsList.find('ul').append(error);
		container.append(errorsList);
		
		// TODO: disable this.buttons['continue'] 
            }
            
	},
	_getRenderedLayerList : function(list) {
	    var layerList = this.templateLayerList.clone();
	    var listElement = layerList.find('ul');
            for (var i = 0; i < list.length; ++i) {
        	var layer = list[i];
        	var item = this.templateListItem.clone();
        	item.append(layer.getName()); 
        	listElement.append(item);
            }
            return layerList;
	},
	handleLayerSelectionChanged : function() {
	    this.renderLayerLists();
	},
	_hasPublishRight : function(layer) {
	    // permission might be "no_publication_permission" or nothing at all
	    return layer.getPermission('publish') == 'publication_permission_ok';
	},
	getLayersWithoutPublishRights : function() {
            var deniedLayers = [];
            var selectedLayers = this.instance.sandbox.findAllSelectedMapLayers();
            for (var i = 0; i < selectedLayers.length; ++i) {
        	var layer = selectedLayers[i];
        	if(!this._hasPublishRight(layer)) {
        	    deniedLayers.push(layer);
        	}
            }
            return deniedLayers;
	}
    });
