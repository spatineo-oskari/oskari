/* This is a packed Oskari bundle (bundle script version Thu May 31 2012 12:23:19 GMT+0300 (Suomen kesäaika)) */ 
Oskari.clazz.define("Oskari.mapframework.bundle.search.service.SearchService",function(a){this._searchUrl=a},{__qname:"Oskari.mapframework.bundle.search.service.SearchService",getQName:function(){return this.__qname},__name:"SearchService",getName:function(){return this.__name},doSearch:function(a,d,b){var c=Oskari.getLang();jQuery.ajax({dataType:"json",type:"POST",beforeSend:function(e){if(e&&e.overrideMimeType){e.overrideMimeType("application/json")}},url:this._searchUrl,data:"searchKey="+a+"&Language="+c,error:b,success:d})}},{protocol:["Oskari.mapframework.service.Service"]});Oskari.clazz.define("Oskari.mapframework.bundle.search.SearchBundleInstance",function(){this.sandbox=null;this.started=false;this.plugins={};this.localization=null;this.service=null},{__name:"Search",getName:function(){return this.__name},setSandbox:function(a){this.sandbox=a},getSandbox:function(){return this.sandbox},getLocalization:function(a){if(!this._localization){this._localization=Oskari.getLocalization(this.getName())}if(a){return this._localization[a]}return this._localization},start:function(){var d=this;if(d.started){return}d.started=true;var a=Oskari.$("sandbox");d.sandbox=a;this.localization=Oskari.getLocalization(this.getName());var c=null;if(this.conf&&this.conf.url){c=this.conf.url}else{c=a.getAjaxUrl()+"action_route=GetSearchResult"}this.service=Oskari.clazz.create("Oskari.mapframework.bundle.search.service.SearchService",c);a.register(d);for(p in d.eventHandlers){a.registerForEventByName(d,p)}var b=a.getRequestBuilder("userinterface.AddExtensionRequest")(this);a.request(this,b);d.createUi()},init:function(){return null},update:function(){},onEvent:function(b){var a=this.eventHandlers[b.getName()];if(!a){return}return a.apply(this,[b])},eventHandlers:{},stop:function(){var a=this.sandbox();for(p in this.eventHandlers){a.unregisterFromEventByName(this,p)}var b=a.getRequestBuilder("userinterface.RemoveExtensionRequest")(this);a.request(this,b);this.sandbox.unregister(this);this.started=false},startExtension:function(){this.plugins["Oskari.userinterface.Flyout"]=Oskari.clazz.create("Oskari.mapframework.bundle.search.Flyout",this);this.plugins["Oskari.userinterface.Tile"]=Oskari.clazz.create("Oskari.mapframework.bundle.search.Tile",this)},stopExtension:function(){this.plugins["Oskari.userinterface.Flyout"]=null;this.plugins["Oskari.userinterface.Tile"]=null},getPlugins:function(){return this.plugins},getTitle:function(){return this.getLocalization("title")},getDescription:function(){return this.getLocalization("desc")},createUi:function(){var a=this;this.plugins["Oskari.userinterface.Flyout"].createUi();this.plugins["Oskari.userinterface.Tile"].refresh()}},{protocol:["Oskari.bundle.BundleInstance","Oskari.mapframework.module.Module","Oskari.userinterface.Extension"]});Oskari.clazz.define("Oskari.mapframework.bundle.search.Flyout",function(a){this.instance=a;this.container=null;this.state=null;this.template=null;this.templateResultTable=null;this.templateResultTableHeader=null;this.templateResultTableRow=null;this.resultHeaders=[];this.lastResult=null;this.lastSort=null},{getName:function(){return"Oskari.mapframework.bundle.search.Flyout"},setEl:function(c,b,a){this.container=c[0];if(!jQuery(this.container).hasClass("search")){jQuery(this.container).addClass("search")}},startPlugin:function(){this.template=jQuery('<div class="searchContainer"><div class="controls"><input class="search_field" type="text" name="search" /><input class="search_button" type="button" name="btn_find" /></div><div><br></div><div class="info"></div><div><br></div><div class="resultList"></div></div>');this.templateResultTable=jQuery('<table class="search_result"><thead><tr></tr></thead><tbody></tbody></table>');this.templateResultTableHeader=jQuery('<th><a href="JavaScript:void(0);"></a></th>');this.templateResultTableRow=jQuery('<tr><td><a href="JavaScript:void(0);"></a></td><td></td><td></td></tr>');this.resultHeaders=[{title:"Nimi",prop:"name"},{title:"Kylä",prop:"village"},{title:"Tyyppi",prop:"type"}]},stopPlugin:function(){},getTitle:function(){return this.instance.getLocalization("title")
},getDescription:function(){return this.instance.getLocalization("desc")},getOptions:function(){},setState:function(a){this.state=a;console.log("Flyout.setState",this,a)},createUi:function(){var e=this;var b=e.instance.getSandbox();var a=jQuery(this.container);a.empty();var h=this.template.clone();var f=h.find("input[name=search]");this._bindClearButton(f);var d=function(){f.attr("disabled","disabled");c.attr("disabled","disabled");var i=h.find("div.resultList");i.empty();e.instance.service.doSearch(f.val(),function(j){f.removeAttr("disabled");c.removeAttr("disabled");e._renderResults(j,f.val())},function(j){f.removeAttr("disabled");c.removeAttr("disabled");alert("vihre!")})};var c=h.find("input[name=btn_find]");var g=this.instance.getLocalization("searchButton");c.val(g);c.bind("click",d);f.keypress(function(i){if(i.which==13){d()}});a.append(h)},_bindClearButton:function(a){var b=jQuery('<div style="margin-left: 0px; position: relative; display: inline-block; left: -20px; top: 3px;"><img src="/Oskari/applications/paikkatietoikkuna.fi/full-map/icons/icon-close.png"/></div>');b.bind("click",function(){a.val("");a.trigger("keyup")});a.after(b)},_renderResults:function(m,c){if(!m||!m.totalCount){return}var d=jQuery(this.container).find("div.resultList");this.lastResult=m;var j=this;var a=jQuery(this.container).find("div.info");a.empty();if(m.totalCount==-1){d.append("searchservice_search_alert_title: "+m.errorText);return}else{if(m.totalCount==0){d.append(this.instance.getLocalization("searchservice_search_alert_title")+":"+this.instance.getLocalization("searchservice_search_not_found_anything_text"));return}else{a.append(this.instance.getLocalization("searchResultCount")+m.totalCount+this.instance.getLocalization("searchResultDescription"))}}if(m.totalCount==1){j._resultClicked(m.locations[0]);this.instance.sandbox.postRequestByName("userinterface.UpdateExtensionRequest",[j.instance,"close"])}var l=this.templateResultTable.clone();var e=l.find("thead tr");var b=l.find("tbody");var h=function(i){return function(){b.empty();var o=false;if(j.lastSort&&j.lastSort.attr==i.prop){o=!j.lastSort.descending}j._sortResults(i.prop,o);j._populateResultTable(b);var n=e.find("a:contains("+i.title+")");e.find("th").removeClass("asc");e.find("th").removeClass("desc");if(o){n.parent().addClass("desc")}else{n.parent().addClass("asc")}}};for(var f=0;f<this.resultHeaders.length;++f){var g=this.templateResultTableHeader.clone();var k=g.find("a");k.append(this.resultHeaders[f].title);k.bind("click",h(this.resultHeaders[f]));e.append(g)}this._populateResultTable(b);d.append("<div><h3>Tulokset:"+m.totalCount+" hakutulosta haulla "+c+"</h3></div>");d.append(l)},_populateResultTable:function(b){var e=this;var a=function(i){return function(){e._resultClicked(i)}};var d=this.lastResult.locations;for(var c=0;c<d.length;++c){var k=d[c];var g=this.templateResultTableRow.clone();var j=g.find("td");var h=jQuery(j[0]);var f=h.find("a");f.append(k.name);f.bind("click",a(k));jQuery(j[1]).append(k.village);jQuery(j[2]).append(k.type);b.append(g)}},_resultClicked:function(a){var f=this;var c="searchResultPopup";var b=this.instance.sandbox;var g=this.instance.sandbox.getRequestBuilder("MapMoveRequest");b.request(f.instance.getName(),g(a.lon,a.lat,a.zoomLevel,false));var e=[{html:"<h3>"+a.name+"</h3><p>"+a.village+"<br/>"+a.type+"</p>",actions:{Sulje:function(){var h=b.getRequestBuilder("InfoBox.HideInfoBoxRequest")(c);b.request(f.instance.getName(),h)}}}];var d=b.getRequestBuilder("InfoBox.ShowInfoBoxRequest")(c,"Hakutulos",e,new OpenLayers.LonLat(a.lon,a.lat),true);b.request(this.instance.getName(),d)},_sortResults:function(c,a){var b=this;if(!this.lastResult){return}this.lastSort={attr:c,descending:a};this.lastResult.locations.sort(function(e,d){return b._searchResultComparator(e,d,c,a)})},_searchResultComparator:function(d,c,i,f){var g=d[i].toLowerCase();var e=c[i].toLowerCase();var h=0;if(g==e||"name"==i){g=d.id;e=c.id}if(g<e){h=-1}else{if(g>e){h=1}}if(f){h=h*-1}return h}},{protocol:["Oskari.userinterface.Flyout"]});Oskari.clazz.define("Oskari.mapframework.bundle.search.Tile",function(a){this.instance=a;
this.container=null;this.template=null},{getName:function(){return"Oskari.mapframework.bundle.search.Tile"},setEl:function(c,b,a){this.container=jQuery(c)},startPlugin:function(){this.refresh()},stopPlugin:function(){this.container.empty()},getTitle:function(){return this.instance.getLocalization("title")},getDescription:function(){return this.instance.getLocalization("desc")},getOptions:function(){},setState:function(a){console.log("Tile.setState",this,a)},refresh:function(){var f=this;var a=f.instance;var e=this.container;var d=this.template;var c=a.getSandbox();var b=e.children(".oskari-tile-status")}},{protocol:["Oskari.userinterface.Tile"]});