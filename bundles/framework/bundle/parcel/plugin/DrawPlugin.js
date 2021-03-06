/**
 * @class Oskari.mapframework.bundle.parcel.plugin.DrawPlugin
 *
 * This plugin handles the drawing of the loaded features and starts the WFST transactions for the saving of the feature data.
 * Also, this function manages the splitting operations of features. This class is the core of this bundle.
 */
Oskari.clazz.define('Oskari.mapframework.bundle.parcel.plugin.DrawPlugin',
/**
 * @method create called automatically on construction
 * @static
 * @param {Oskari.mapframework.bundle.parcel.DrawingToolInstance} instance
 */
function(instance) {
    this.instance = instance;
    this.mapModule = null;
    this.pluginName = null;
    this._sandbox = null;
    this._map = null;
    this.controls = null;
    this.drawControls = null;
    this.drawLayer = null;
    this.editLayer = null;
    this.markerLayer = null;
    this.currentDrawMode = null;
    this.currentFeatureType = null;
    // Created in init.
    this.splitter = null;
    this.splitSelection = false;
}, {
    /**
     * @method getName
     * Returns plugin name.
     * @return {String} The plugin name.
     */
    getName : function() {
        return this.pluginName;
    },
    /**
     * Initializes the plugin:
     * - layer that is used for drawing
     * - drawControls
     * - registers for listening to requests and events
     * @param sandbox reference to Oskari sandbox
     * @method init
     */
    init : function(sandbox) {
        var me = this;
        // This layer will first contain the downloaded feature. After the split is done, that feature
        // removed from the layer
        this.drawLayer = new OpenLayers.Layer.Vector("Parcel Draw Layer", {
            eventListeners : {
                "featuresadded" : function(layer) {
                    // Make sure that all the component states are in sync, such as dialogs.
                    var event = me._sandbox.getEventBuilder('Parcel.FinishedDrawingEvent')();
                    me._sandbox.notifyAll(event);
                    // Disable all draw controls.
                    // Then, the user needs to reselect what to do next.
                    // At the moment, this creates some consistency in the usability.
                    me.toggleControl();

                    // Because a new feature was added, do splitting.
                    me.splitFeature();
                }
            }
        });

        // This layer will contain the geometry that will split the original feature.
        this.editLayer = new OpenLayers.Layer.Vector("Parcel Edit Layer", {
            eventListeners : {
                "featuremodified" : function(event) {

                    var operatingFeature = this.features[0];
                    if (operatingFeature.geometry.CLASS_NAME === "OpenLayers.Geometry.LineString") {
                        var markerLayer = this.map.getLayersByName("Parcel Markers Layer")[0];
                        var order = markerLayer.markers[0].firstLine;
                        var mInd = order ? 0 : 1;

                        var lineRunLength = operatingFeature.geometry.components.length - 1;

                        operatingFeature.geometry.components[0].x = markerLayer.markers[mInd].lonlat.lon;
                        operatingFeature.geometry.components[0].y = markerLayer.markers[mInd].lonlat.lat;
                        operatingFeature.geometry.components[lineRunLength].x = markerLayer.markers[(mInd + 1) % 2].lonlat.lon;
                        operatingFeature.geometry.components[lineRunLength].y = markerLayer.markers[(mInd + 1) % 2].lonlat.lat;

                        var polygon1 = me.drawLayer.features[0];
                        var polygon2 = me.drawLayer.features[1];
                        var ind1 = polygon1.polygonCorners[0];
                        var ind2 = polygon1.polygonCorners[1];
                        var diff = ind2 - ind1 - 1;
                        polygon1.geometry.components[0].components.splice(ind1 + 1, diff);
                        if (order) {
                            for (var i = 1; i < lineRunLength; i++) {
                                polygon1.geometry.components[0].components.splice(ind1 + i, 0, operatingFeature.geometry.components[i]);
                            }
                        } else {
                            for (var i = 1; i < lineRunLength; i++) {
                                polygon1.geometry.components[0].components.splice(ind1 + i, 0, operatingFeature.geometry.components[lineRunLength - i]);
                            }
                        }
                        polygon1.polygonCorners[1] = polygon1.polygonCorners[0] + lineRunLength;

                        ind1 = polygon2.polygonCorners[0];
                        ind2 = polygon2.polygonCorners[1];
                        diff = ind2 - ind1 - 1;
                        polygon2.geometry.components[0].components.splice(ind1 + 1, diff);
                        if (order) {
                            for ( i = 1; i < lineRunLength; i++) {
                                polygon2.geometry.components[0].components.splice(ind1 + i, 0, operatingFeature.geometry.components[lineRunLength - i]);
                            }
                        } else {
                            for (var i = 1; i < lineRunLength; i++) {
                                polygon2.geometry.components[0].components.splice(ind1 + i, 0, operatingFeature.geometry.components[i]);
                            }
                        }
                        polygon2.polygonCorners[1] = polygon2.polygonCorners[0] + lineRunLength;

                        // Redo selection so the info box knows where we're at
                        me.controls.select.select(me.getDrawing());

                    }
                    this.redraw();
                    me.drawLayer.redraw();
                }
            }
        });

        // This layer will contain markers which show the points where the operation line
        // crosses with the border of the original layer. Those points may be moved to adjust
        // the split.
        this.markerLayer = new OpenLayers.Layer.Markers("Parcel Markers Layer", {});

        // The select control applies to the edit layer and the drawing layer as we will select the polygon to save for visuals
        var selectEditControl = new OpenLayers.Control.SelectFeature([me.editLayer, me.drawLayer]);
        this._map.addControl(selectEditControl);

        var modifyEditControl = new OpenLayers.Control.ModifyFeature(me.editLayer);
        this._map.addControl(modifyEditControl);

        this.controls = {
            select : selectEditControl,
            modify : modifyEditControl
        };

        this.drawControls = {
            line : new OpenLayers.Control.DrawFeature(me.drawLayer, OpenLayers.Handler.Path),
            area : new OpenLayers.Control.DrawFeature(me.drawLayer, OpenLayers.Handler.Polygon)
        };
        this._map.addLayers([me.drawLayer]);
        for (var key in this.drawControls) {
            this._map.addControl(this.drawControls[key]);
        }

        this._map.addLayers([me.editLayer]);
        this._map.addLayers([me.markerLayer]);
        this._map.setLayerIndex(me.drawLayer, 10);
        this._map.setLayerIndex(me.editLayer, 100);
        this._map.setLayerIndex(me.markerLayer, 1000);

        this.requestHandlers = {
            startDrawingHandler : Oskari.clazz.create('Oskari.mapframework.bundle.parcel.request.StartDrawingRequestHandler', me),
            stopDrawingHandler : Oskari.clazz.create('Oskari.mapframework.bundle.parcel.request.StopDrawingRequestHandler', me),
            cancelDrawingHandler : Oskari.clazz.create('Oskari.mapframework.bundle.parcel.request.CancelDrawingRequestHandler', me),
            saveDrawingHandler : Oskari.clazz.create('Oskari.mapframework.bundle.parcel.request.SaveDrawingRequestHandler', me)
        };

        this.splitter = Oskari.clazz.create('Oskari.mapframework.bundle.parcel.split.ParcelSplit', this);
        this.splitter.init();
    },
    /**
     * @method startPlugin
     * Interface method for the plugin protocol.
     * Register request handlers.
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    startPlugin : function(sandbox) {
        this._sandbox = sandbox;
        sandbox.register(this);
        sandbox.addRequestHandler('Parcel.StartDrawingRequest', this.requestHandlers.startDrawingHandler);
        sandbox.addRequestHandler('Parcel.StopDrawingRequest', this.requestHandlers.stopDrawingHandler);
        sandbox.addRequestHandler('Parcel.CancelDrawingRequest', this.requestHandlers.cancelDrawingHandler);
        sandbox.addRequestHandler('Parcel.SaveDrawingRequest', this.requestHandlers.saveDrawingHandler);
    },
    /**
     * @method stopPlugin
     * Interface method for the plugin protocol.
     * Unregister request handlers.
     *
     * @param {Oskari.mapframework.sandbox.Sandbox} sandbox
     *          reference to application sandbox
     */
    stopPlugin : function(sandbox) {
        // Let possible info box know that this layer should not be followed.
        var event = sandbox.getEventBuilder('ParcelInfo.ParcelLayerUnregisterEvent')(this.getDrawingLayer());
        sandbox.notifyAll(event);

        // Remove request handlers.
        sandbox.removeRequestHandler('Parcel.StartDrawingRequest', this.requestHandlers.startDrawingHandler);
        sandbox.removeRequestHandler('Parcel.StopDrawingRequest', this.requestHandlers.stopDrawingHandler);
        sandbox.removeRequestHandler('Parcel.CancelDrawingRequest', this.requestHandlers.cancelDrawingHandler);
        sandbox.removeRequestHandler('Parcel.SaveDrawingRequest', this.requestHandlers.saveDrawingHandler);
        sandbox.unregister(this);
        this._map = null;
        this._sandbox = null;
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
        this._map = mapModule.getMap();
        this.pluginName = mapModule.getName() + 'Parcel.DrawPlugin';
    },
    /**
     * Draw new feature to the map and zoom to its extent.
     *
     * Removes previous features if any on the map before adding the new feature to the parcel draw layer.
     *
     * This is called when the parcel is loaded from the server or if the parcel should be replaced by new one.
     *
     * The given feature may later be edited by tools selected from the UI. Notice, if feature should be edited by tools,
     * use other functions provided by this class for that.
     *
     * @param {OpenLayers.Feature.Vector} feature The feature that is added to the draw layer. May not be undefined or null.
     * @param {String} featureType The feature type of the feature. This is required when feature is committed to the server.
     * @method drawFeature
     */
    drawFeature : function(feature, featureType) {
        // remove possible old drawing
        this.drawLayer.removeAllFeatures();
        this.currentFeatureType = null;

        // Let possible parcel info bundle know that layer should be followed.
        // Notice, parcel info should be initialized before this call to make it get an event.
        // Therefore, this is not called during init when layer is created. Another, way might
        // be to set dependency or certain creation order between bundles. But, the dependency is
        // not mandatory to make this bundle work and the order is required only if info should be
        // updated from this bundle.
        var event = this._sandbox.getEventBuilder('ParcelInfo.ParcelLayerRegisterEvent')(this.getDrawingLayer());
        this._sandbox.notifyAll(event);

        // add feature to draw layer
        // This feature will be the parcel that may be edited by the tools.
        var features = [feature];
        this.drawLayer.addFeatures(features);

        this.currentFeatureType = featureType;
        // Zoom to the loaded feature.
        this._map.zoomToExtent(this.drawLayer.getDataExtent());

        // Show tool buttons only after the parcel has been loaded.
        // Because parcel may be removed only by loading a new one.
        // The buttons can be shown after this. If a new parcel is loaded,
        // buttons can still be shown.
        if (!this.buttons) {
            // handles toolbar buttons related to parcels
            this.buttons = Oskari.clazz.create("Oskari.mapframework.bundle.parcel.handler.ButtonHandler", this.instance);
            this.buttons.start();
        }
    },
    /**
     * Enables the draw control for given params.drawMode.
     *
     * This function is meant for the tool buttons actions.
     * When a tool is selected, corresponding feature can be drawn on the map.
     *
     * @param {Object} params includes isModify, drawMode, geometry.
     * @method
     */
    startDrawing : function(params) {
        // activate requested draw control for new geometry
        this.toggleControl(params.drawMode);
    },
    /**
     * Called when the user finishes sketching.
     * This function is provided for request handlers.
     *
     * Notice, "featuresadded" is listened separately. Therefore, double clicked finishing is handled
     * that way. Also, when sketching is finished here, the flow continues in "featuresadded" listener.
     *
     * Splits the parcel feature according to the editing.
     *
     * @method finishSketchDraw
     */
    finishSketchDraw : function() {
        try {
            this.drawControls[this.currentDrawMode].finishSketch();
            // Because flow has been quite by specific button.
            // Remove control. Then, user needs to choose the correct tool again.
            this.toggleControl();

        } catch(error) {
            // happens when the sketch isn't even started -> reset state
            var event = this._sandbox.getEventBuilder('Parcel.ParcelSelectedEvent')();
            this._sandbox.notifyAll(event);
        }
    },
    /**
     * Cancel tool editing action.
     *
     * Remove the cancelled feature.
     * Disables all draw controls.
     *
     * @method cancelDrawing
     */
    cancelDrawing : function() {
        // disable all draw controls
        this.toggleControl();
    },
    /**
     * Starts the save flow for the feature on the map.
     * If feature does not exists, does nothing.
     *
     * This function is meant for the tool buttons actions.
     * When a save tool is selected, the flow starts.
     *
     * Disables all draw controls and
     * sends a SaveDrawingEvent with the drawn feature.
     *
     * @method saveDrawing
     */
    saveDrawing : function() {
        // If editLayer is empty, no split has been done
        if (this.editLayer.features.length > 0) {

            // Select the feature that is going to be saved.
            // Then, it is shown for the user if user has unselected it before pressing save button.
            var featureToSave = this.getDrawing();

            this.controls.select.select(featureToSave);
            this.toggleControl();
            var event = this._sandbox.getEventBuilder('Parcel.SaveDrawingEvent')(featureToSave);
            this._sandbox.notifyAll(event);
        }
    },

    /**
     * Enables the given draw control.
     * Disables all the other draw controls.
     * @param drawMode draw control to activate (if undefined, disables all
     * controls)
     * @method toggleControl
     */
    toggleControl : function(drawMode) {
        this.currentDrawMode = drawMode;

        for (var key in this.drawControls) {
            var control = this.drawControls[key];
            if (drawMode == key) {
                control.activate();
            } else {
                control.deactivate();
            }
        }
    },
    /**
     * @return {OpenLayers.Layer.Vector} Returns the drawn vector layer.
     * @method getDrawingLayer
     */
    getDrawingLayer : function() {
        return this.drawLayer;
    },
    /**
     * TODO: This method needs to be informed which polygon is to be saved.
     *
     * @return {OpenLayers.Feature.Vector} Returns the drawn vector feature from the draw layer. May be undefined if no feature.
     * @method getDrawing
     */
    getDrawing : function() {
        return this.drawLayer.features[0];
    },
    /**
     * @param {String} featureType The feature type of the parcel feature. This is used when feature is commited to the server.
     * @method setFeatureType
     */
    setFeatureType : function(featureType) {
        this.currentFeatureType = featureType;
    },
    /**
     * @param {String} The feature type of the parcel feature. This is used when feature is commited to the server.
     * @method getFeatureType
     */
    getFeatureType : function() {
        return this.currentFeatureType;
    },
    /**
     * @method start
     * called from sandbox
     */
    start : function(sandbox) {
    },
    /**
     * @method stop
     * called from sandbox
     */
    stop : function(sandbox) {
        // Let possible info box know that this layer should not be followed.
        var event = sandbox.getEventBuilder('ParcelInfo.ParcelLayerUnregisterEvent')(getDrawingLayer());
        sandbox.notifyAll(event);
    },
    /**
     * @method register
     * Does nothing atm.
     */
    register : function() {
    },
    /**
     * @method unregister
     * Does nothing atm.
     */
    unregister : function() {
    },
    /**
     * Handles the splitting of the parcel feature
     * and replaces the feature hold by this instance.
     * @method splitFeature
     */
    splitFeature : function() {
        var operatingFeature = this.splitter.split();
        if (operatingFeature != undefined) {
            this.controls.select.select(operatingFeature);
            this.controls.modify.selectFeature(operatingFeature);
            this.controls.modify.activate();

            this.controls.select.select(this.getDrawing());

            // Make sure the marker layer is topmost (previous activations push the vector layer too high)
            var index = Math.max(this._map.Z_INDEX_BASE['Feature'], this.markerLayer.getZIndex()) + 1;
            this.markerLayer.setZIndex(index);
        }
    }
}, {
    'protocol' : ["Oskari.mapframework.module.Module", "Oskari.mapframework.ui.module.common.mapmodule.Plugin"]
});
