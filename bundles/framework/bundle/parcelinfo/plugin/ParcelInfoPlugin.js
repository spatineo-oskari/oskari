/**
 * @class Oskari.mapframework.bundle.parcelinfo.plugin.ParcelInfoPlugin
 *
 * Shows name, area and length information about the selected feature on the map.
 *
 * This plugin does not send any events. This plugin listens for events with the following name:
 * 'ParcelInfo.ParcelLayerRegisterEvent' and 'ParcelInfo.ParcelLayerUnregisterEvent'. By using events,
 * other bundles may register and unregister layers for this bundle. Then, this bundle may show information
 * about the selected feature and update information when the feature is modified.
 *
 * This plugin also registers to listen feature selection and modification events of the layers that are registered
 * for this plugin.
 */
Oskari.clazz.define('Oskari.mapframework.bundle.parcelinfo.plugin.ParcelInfoPlugin',
/**
 * @method create called automatically on construction
 * @static
 * @param {Object} config
 *      JSON config with params needed to run the plugin
 */
function(config, locale) {
    this._conf = config;
    this._locale = locale;
    this._mapModule = null;
    this._sandbox = null;
    this._map = null;
    this._elements = {};
    this._templates = {};
    this._layers = [];
    this._selectedFeature = null;

}, {
    /**
     * @method getName
     * @return {String} plugin name
     */
    getName : function() {
        return 'ParcelInfoPlugin';
    },
    /**
     * @method getMapModule
     * @return {Oskari.mapframework.ui.module.common.MapModule} reference to map
     * module
     */
    getMapModule : function() {
        return this._mapModule;
    },
    /**
     * @method setMapModule
     * @param {Oskari.mapframework.ui.module.common.MapModule} reference to map
     * module
     */
    setMapModule : function(mapModule) {
        this._mapModule = mapModule;
    },
    /**
     * @method hasUI
     * @return {Boolean} true
     * This plugin has an UI so always returns true
     */
    hasUI : function() {
        return true;
    },
    /**
     * @method init
     *
     * Interface method for the module protocol.
     * Initializes the plugin.
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    init : function(sandbox) {
        // Define the template that is used to show information in UI.
        this._templates['infodiv'] = jQuery('<div>' + '<table class="piMain">' + '<tr>' + '<td class="piHeaderLabel" colspan="3"></td>' + '</tr>' + '<tr>' + '<td class="piLabel piLabelName" infotype="name"></td>' + '<td class="piLabelValue" infotype="name" colspan="2"></td>' + '</tr>' + '<tr>' + '<td class="piLabel piLabelArea" infotype="area"></td>' + '<td class="piValue" infotype="area"></td>' + '<td class="piUnit" infotype="area"></td>' + '</tr>' + '<tr>' + '<td class="piLabel piLabelLength" infotype="length"></td>' + '<td class="piValue" infotype="length"></td>' + '<td class="piUnit" infotype="length"></td>' + '</tr>' + '</table>' + '</div>');
    },
    /**
     * @method register
     * Interface method for the plugin protocol
     */
    register : function() {
    },
    /**
     * @method unregister
     * Interface method for the plugin protocol
     */
    unregister : function() {
    },
    /**
     * @method startPlugin
     * Interface method for the plugin protocol
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    startPlugin : function(sandbox) {
        this._sandbox = sandbox;
        this._map = this.getMapModule().getMap();

        sandbox.register(this);
        this._createUI();
        for (p in this.eventHandlers ) {
            sandbox.registerForEventByName(this, p);
        }
    },
    /**
     * @method stopPlugin
     *
     * Interface method for the plugin protocol
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    stopPlugin : function(sandbox) {

        for (p in this.eventHandlers ) {
            sandbox.unregisterFromEventByName(this, p);
        }

        if (this._elements['display']) {
            this._elements['display'].remove();
            delete this._elements['display'];
        }

        sandbox.unregister(this);
        this._map = null;
        this._sandbox = null;
    },
    /**
     * @method start
     * Interface method for the module protocol
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    start : function(sandbox) {
    },
    /**
     * @method stop
     * Interface method for the module protocol
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    stop : function(sandbox) {
    },
    /**
     * @method _createUI
     * @private
     * Creates UI for information display and places it on the maps div where this plugin registered.
     */
    _createUI : function() {
        var sandbox = this._sandbox;
        var me = this;
        // get div where the map is rendered from openlayers
        var parentContainer = jQuery(this._map.div);
        var el = me._elements['display'];
        if (!me._elements['display']) {
            el = me._elements['display'] = me._templates['infodiv'].clone();
        }

        el.find('.piHeaderLabel').html(me._locale['header']);
        el.find('.piLabelName').html(me._locale['info']['name']);
        el.find('.piLabelArea').html(me._locale['info']['area']);
        el.find('.piLabelLength').html(me._locale['info']['length']);

        parentContainer.append(el);
        this.update();
        el.show();
    },
    /**
     * @method update
     * @param {Object} data contains information to show on UI
     * Updates the given information to the UI
     */
    update : function(data) {
        if (!data || !data.info) {
            // Because data has not been given,
            // initialize with empty data.
            data = {
                'info' : {
                    'name' : '',
                    'area' : '',
                    'length' : ''
                }
            };
        }
        // Show the data in the UI component.
        var me = this;
        var info = data['info'];
        var el = me._elements['display'];
        var spanName = el.find('.piLabelValue[infotype="name"]');
        var spanArea = el.find('.piValue[infotype="area"]');
        var spanAreaUnit = el.find('.piUnit[infotype="area"]');
        var spanLength = el.find('.piValue[infotype="length"]');
        var spanLengthUnit = el.find('.piUnit[infotype="length"]');
        if (spanName && spanArea && spanLength) {
            spanName.text(info.name);
            spanArea.text(info.area);
            // Use HTML because of the special HTML character.
            spanAreaUnit.html(me._map.units + "&sup2;");
            spanLength.text(info.length);
            spanLengthUnit.text(me._map.units);
        }
    },

    /**
     * @property {Object} eventHandlers
     * @static
     */

    eventHandlers : {
        /**
         * @method
         */
        'ParcelInfo.ParcelLayerRegisterEvent' : function(event) {
            var me = this;
            if (event && event.getLayer()) {
                // Register the given layer for this plugin.
                me._registerLayer(event.getLayer());
            }
        },
        'ParcelInfo.ParcelLayerUnregisterEvent' : function(event) {
            var me = this;
            if (event && event.getLayer()) {
                // Unregister the given layer from this plugin.
                me._unregisterLayer(event.getLayer());
            }
        }
    },

    /**
     * @method onEvent
     * @param {Oskari.mapframework.event.Event} event a Oskari event object
     * Event is handled forwarded to correct #eventHandlers if found or discarded
     * if not.
     */
    onEvent : function(event) {
        return this.eventHandlers[event.getName()].apply(this, [event]);
    },

    /**
     * @method _registerLayer
     * @private
     * @param layer The layer whose features should be followed
     *              by this plugin to show information about the selected feature.
     */
    _registerLayer : function(layer) {
        var me = this;
        if (jQuery.inArray(layer, me._layers) === -1) {
            // Layer has not been registered before.
            // Therefore, register it now.
            layer.events.register("featureselected", me, me._updateInfoSelected);
            layer.events.register("featureunselected", me, me._updateInfoUnselected);
            layer.events.register("featuremodified", me, me._updateInfo);
            layer.events.register("vertexmodified", me, me._updateInfo);
            this._layers.push(layer);
        }
    },
    /**
     * @method _unregisterLayer
     * @private
     * @param layer The layer whose features should not be followed anymore.
     */
    _unregisterLayer : function(layer) {
        var me = this;
        var index = jQuery.inArray(layer, me._layers);
        if (index != -1) {
            // Layer was found. So, unregister it.
            layer.events.unregister("featureselected", me, me._updateInfoSelected);
            layer.events.unregister("featureunselected", me, me._updateInfoUnselected);
            layer.events.unregister("featuremodified", me, me._updateInfo);
            layer.events.unregister("vertexmodified", me, me._updateInfo);
            this_layers.splice(index, 1);
        }
    },
    /**
     * @method _updateInfoSelected
     * @private
     * @param event Event sent by the layer when feature is selected.
     */
    _updateInfoSelected : function(event) {
        this._selectedFeature = null;
        if (event) {
            this._selectedFeature = event.feature;
        }
        // Update info for the given feature if any.
        this._updateInfo(event);
    },
    /**
     * @method _updateInfoUnselected
     * @private
     * @param event Event sent by the layer when feature is unselected.
     */
    _updateInfoUnselected : function(event) {
        this._selectedFeature = null;
        // Set to default values because none is selected.
        this.update();
    },
    /**
     * @method _updateInfo
     * @private
     * @param event Event send by the layer when feature is modified.
     */
    _updateInfo : function(event) {
        var me = this;
        // Update the info only for the selected feature.
        if (event && event.feature && event.feature.geometry && event.feature === me._selectedFeature) {
            me.update({
                'info' : {
                    'name' : event.feature.attributes.nimi || event.feature.attributes.name || '',
                    'area' : event.feature.geometry.getArea().toFixed(0),
                    'length' : event.feature.geometry.getLength().toFixed(0)
                }
            });
        }
    }
}, {
    /**
     * @property {String[]} protocol array of superclasses as {String}
     * @static
     */
    'protocol' : ["Oskari.mapframework.module.Module", "Oskari.mapframework.ui.module.common.mapmodule.Plugin"]
});
