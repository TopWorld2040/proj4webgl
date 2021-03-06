(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(['dojo/dom', 'dojo/on', 'dojo/Evented', 'dojo/dom-geometry', 'dojo/dom-construct', 'dojo/dom-attr', './script/mapviewer.js', './script/rasterlayer.js', './script/vectorlayer.js', './script/proj4js-compressed.js', 'dojo/domReady'], function(dom, _on, Evented, domGeom, domConstruct, domAttr, MapViewer, RasterLayer, VectorLayer) {
    var Dragging, baseLayer, boundaryLayer, coastLayer, dragging, graticuleLayer, id, idx, input, label, layer, layerToggles, li, mapCanvas, mv, oldCenter, projDef, projSelect, projSelectChanged, scaleAround, textures, _i, _len, _ref;
    Proj4js.defs['SR-ORG:6864'] = '+proj=merc\
      +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137\
      +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
    Proj4js.defs["SR-ORG:22"] = "+proj=cea      +lon_0=0 +lat_ts=45 +x_0=0 +y_0=0 +ellps=WGS84      +units=m +no_defs";
    projDef = 'EPSG:27700';
    projDef = 'EPSG:3031';
    projDef = 'EPSG:2163';
    projDef = 'SR-ORG:6864';
    projSelect = dom.byId('projection');
    mapCanvas = dom.byId('mapCanvas');
    mapCanvas.width = mapCanvas.clientWidth;
    mapCanvas.height = mapCanvas.clientHeight;
    _on(window, 'resize', function() {
      mapCanvas.width = mapCanvas.clientWidth;
      mapCanvas.height = mapCanvas.clientHeight;
      return mv.scheduleRedraw();
    });
    mv = new MapViewer(mapCanvas);
    textures = [[4096, 'world-4k.jpg'], [2048, 'world-2k.jpg'], [1024, 'world-1k.jpg']];
    baseLayer = new RasterLayer(mv, textures, 'Topography and bathymetry');
    mv.addLayer(baseLayer);
    boundaryLayer = new VectorLayer(mv, 'ne_110m_admin_0_boundary_lines_land.json', 'Boundaries');
    boundaryLayer.set('lineWidth', 1);
    boundaryLayer.set('lineColor', {
      r: 1,
      g: 0,
      b: 0
    });
    mv.addLayer(boundaryLayer);
    coastLayer = new VectorLayer(mv, 'ne_110m_coastline.json', 'Coastline');
    coastLayer.set('lineWidth', 2);
    coastLayer.set('lineColor', {
      r: 0,
      g: 0.5,
      b: 1
    });
    mv.addLayer(coastLayer);
    graticuleLayer = new VectorLayer(mv, 'ne_50m_graticules_10.json', '10 degree graticule');
    graticuleLayer.set('lineWidth', 1);
    graticuleLayer.set('lineColor', {
      r: 0,
      g: 0.5,
      b: 0
    });
    mv.addLayer(graticuleLayer);
    layerToggles = dom.byId('layerToggles');
    idx = 1;
    _ref = mv.layers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      layer = _ref[_i];
      id = 'layerToggle' + idx.toString();
      li = domConstruct.create('li', null, layerToggles, 'last');
      input = domConstruct.create('input', {
        type: 'checkbox',
        id: id
      }, li, 'last');
      if (layer.visible) {
        domAttr.set(input, 'checked', 1);
      }
      _on(input, 'change', (function(layer) {
        return function(ev) {
          return layer.set('visible', domAttr.get(ev.target, 'checked'));
        };
      })(layer));
      label = domConstruct.create('label', {
        "for": id
      }, li, 'last');
      domConstruct.place(document.createTextNode(layer.description), label, 'last');
      idx++;
    }
    projSelectChanged = function(elem) {
      var opt;
      opt = elem.options[elem.selectedIndex];
      return new Proj4js.Proj(opt.value, function(proj) {
        return mv.set('projection', proj);
      });
    };
    _on(projSelect, 'change', function(ev) {
      return projSelectChanged(ev.target);
    });
    projSelectChanged(projSelect);
    _on(dom.byId('zoomIn'), 'click', function(ev) {
      return mv.set('scale', mv.scale / 1.1);
    });
    _on(dom.byId('zoomOut'), 'click', function(ev) {
      return mv.set('scale', mv.scale * 1.1);
    });
    Dragging = (function(_super) {

      __extends(Dragging, _super);

      function Dragging(elem) {
        var downLocation, isDragging,
          _this = this;
        isDragging = false;
        downLocation = null;
        _on(elem, 'mousedown', function(ev) {
          var mouseMoveListener, mouseUpListener;
          if (ev.button !== 0 || isDragging) {
            return;
          }
          isDragging = true;
          downLocation = {
            x: ev.clientX,
            y: ev.clientY
          };
          _this.emit('dragstart', {
            target: elem,
            controller: _this
          });
          mouseMoveListener = _on(document, 'mousemove', function(ev) {
            if (!isDragging) {
              return;
            }
            return _this.emit('dragmove', {
              target: elem,
              controller: _this,
              deltaX: ev.clientX - downLocation.x,
              deltaY: ev.clientY - downLocation.y
            });
          });
          return mouseUpListener = _on(document, 'mouseup', function(ev) {
            isDragging = false;
            mouseMoveListener.remove();
            mouseMoveListener = null;
            mouseUpListener.remove();
            mouseUpListener = null;
            return _this.emit('dragstop', {
              target: elem,
              controller: _this
            });
          });
        });
        _on(elem, 'touchstart', function(ev) {
          if (isDragging) {
            return;
          }
          isDragging = true;
          downLocation = {
            x: ev.changedTouches[0].clientX,
            y: ev.changedTouches[0].clientY
          };
          return _this.emit('dragstart', {
            target: elem,
            controller: _this
          });
        });
        _on(elem, 'touchmove', function(ev) {
          if (!isDragging) {
            return;
          }
          console.log(ev.changedTouches[0].clientX - downLocation.x);
          _this.emit('dragmove', {
            target: elem,
            controller: _this,
            deltaX: ev.changedTouches[0].clientX - downLocation.x,
            deltaY: ev.changedTouches[0].clientY - downLocation.y
          });
          return ev.preventDefault();
        });
        _on(elem, 'touchend', function(ev) {
          isDragging = false;
          return _this.emit('dragstop', {
            target: elem,
            controller: _this
          });
        });
      }

      return Dragging;

    })(Evented);
    oldCenter = null;
    dragging = new Dragging(mapCanvas);
    dragging.on('dragstart', function(ev) {
      return oldCenter = mv.center;
    });
    dragging.on('dragmove', function(ev) {
      return mv.set('center', {
        x: oldCenter.x + ev.deltaX * mv.scale,
        y: oldCenter.y - ev.deltaY * mv.scale
      });
    });
    scaleAround = function(ev, scale) {
      var elemBox, newZoomCenter, x, y, zoomCenter;
      elemBox = domGeom.position(ev.target, false);
      x = ev.clientX - elemBox.x;
      y = ev.clientY - elemBox.y;
      zoomCenter = mv.elementToProjection({
        x: x,
        y: y
      });
      mv.set('scale', scale);
      newZoomCenter = mv.elementToProjection({
        x: x,
        y: y
      });
      return mv.set('center', {
        x: mv.center.x + newZoomCenter.x - zoomCenter.x,
        y: mv.center.y + newZoomCenter.y - zoomCenter.y
      });
    };
    _on(mapCanvas, 'mousewheel', function(ev) {
      if (ev.wheelDelta < 0) {
        scaleAround(ev, mv.scale * 1.1);
      } else if (ev.wheelDelta > 0) {
        scaleAround(ev, mv.scale / 1.1);
      }
      return ev.preventDefault();
    });
    return _on(mapCanvas, 'wheel', function(ev) {
      if (ev.deltaY > 0) {
        scaleAround(ev, mv.scale * 1.1);
      } else if (ev.deltaY < 0) {
        scaleAround(ev, mv.scale / 1.1);
      }
      return ev.preventDefault();
    });
  });

}).call(this);
