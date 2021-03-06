/**
 * @class Oskari.mapframework.mapmodule.MarkersPlugin
 * Provides marker functionality for the map. 
 * This will be extended to provide support for multiple markers etc.
 * Maybe also refactored into a new class structure.
 * @deprecated mapmodule handles markers for now.
 */
Oskari.clazz.define('Oskari.mapframework.mapmodule.MarkersPlugin', 

/**
 * @method create called automatically on construction
 * @static
 */
function() {
    this.mapModule = null;
    this.pluginName = null;
    this._sandbox = null;
    this._map = null;
}, {
    /** @static @property __name plugin name */
    __name : 'MarkersPlugin',

    /**
     * @method getName
     * @return {String} plugin name
     */
    getName : function() {
        return this.pluginName;
    },

    /**
     * @method getMapModule
     * @return {Oskari.mapframework.ui.module.common.MapModule} reference to map module
     */
    getMapModule : function() {
        return this.mapModule;
    },
    /**
     * @method setMapModule
     * @param {Oskari.mapframework.ui.module.common.MapModule} reference to map module
     */
    setMapModule : function(mapModule) {
        this.mapModule = mapModule;
        this.pluginName = mapModule.getName() + this.__name;
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
     * Interface method for the module protocol
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    init : function(sandbox) {
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
     * Interface method for the plugin protocol.
     * Creates the base marker layer. 
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    startPlugin : function(sandbox) {
        this._sandbox = sandbox;
        this._map = this.getMapModule().getMap();

        this._createMapMarkersLayer();

        sandbox.register(this);
        for (p in this.eventHandlers ) {
            sandbox.registerForEventByName(this, p);
        }
    },
    /**
     * @method stopPlugin
     * Interface method for the plugin protocol
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    stopPlugin : function(sandbox) {

        for (p in this.eventHandlers ) {
            sandbox.unregisterFromEventByName(this, p);
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
     * @property {Object} eventHandlers 
     * @static 
     */
    eventHandlers : {
        'AfterHideMapMarkerEvent' : function(event) {
            this._afterHideMapMarkerEvent(event);
        }
    },

    /** 
     * @method onEvent
     * Event is handled forwarded to correct #eventHandlers if found or discarded if not.
     * @param {Oskari.mapframework.event.Event} event a Oskari event object
     */
    onEvent : function(event) {
        return this.eventHandlers[event.getName()].apply(this, [event]);
    },

    /**
     * @method _createMapMarkersLayer
     * @private
     * Creates an OpenLayers Markers layer names "Markers" and adds it to the map.
     */
    _createMapMarkersLayer : function() {
        var sandbox = this._sandbox;
        var layerMarkers = new OpenLayers.Layer.Markers("Markers");
        this._map.addLayer(layerMarkers);

    },

    /**
     * @methodafterHideMapMarkerEvent
     * @private
     * Handle HideMapMarkerEvent. Hides the markers layer.
     *
     * @param {Oskari.mapframework.event.common.AfterHideMapMarkerEvent}
     *            event
     */
    _afterHideMapMarkerEvent : function(event) {
        var markerLayer = this._map.getLayersByName("Markers");
        if (markerLayer != null && markerLayer[0] != null) {
            markerLayer[0].setVisibility(false);
        }
    }
}, {
    /**
     * @property {String[]} protocol array of superclasses as {String}
     * @static
     */
    'protocol' : ["Oskari.mapframework.module.Module", "Oskari.mapframework.ui.module.common.mapmodule.Plugin"]
});
