var hepml = hepml || {};
hepml.version = '0.0.4';

hepml.event_index = 0;
hepml.events = [];
hepml.event_loaded = false;

hepml.visible = [];
hepml.inverted_colors = false;

hepml.objectIds = {

  'ecal': [],
  'hcal': [],
  'primary': []

};

hepml.schema = {

  'ecal': [{'ix':'int'}, {'iy':'int'}, {'iz':'int'}, {'energy':'float'}],
  'hcal': [{'ix':'int'}, {'iy':'int'}, {'iz':'int'}, {'energy':'float'}],
  'primary': [{'i':'int'}, {'pid':'int'}, {'px':'float'}, {'py':'float'}, {'pz':'float'}, {'energy':'float'}]

};

hepml.get_type = function(name, attr) {

  // from a name like ecal and an attr like energy return its type: float
  return hepml.schema[name]
    .find(function(obj) {return obj.hasOwnProperty(attr);})[attr];

};

hepml.get_index = function(name, attr) {

  // from a name like ecal and an attr like energy return its index: 3
  var o = hepml.schema[name].find(function(obj) {return obj.hasOwnProperty(attr)});
  return hepml.schema[name].indexOf(o);

};

hepml.setFramerate = function(fr) {

  hepml.max_framerate = fr;
  $('#fr').html(fr);

};

hepml.ecal_settings = {

  color: 0xaaaaaa,
  linewidth: 0.1,
  depthWrite: false,
  transparent:true,
  opacity: 0.05

};

hepml.hcal_settings = {

  color: 0xaaaaaa,
  linewidth: 0.1,
  depthWrite: false,
  transparent:true,
  opacity: 0.25

};

hepml.init_camera = {

  'x': -15.0,
  'y': 15.0,
  'z': -15.0,
  'zoom': 1.5,
  'perspective': true,
  'orthographic': false

};

hepml.initCamera = function() {

  hepml.camera.position.x = hepml.init_camera.x;
  hepml.camera.position.y = hepml.init_camera.y;
  hepml.camera.position.z = hepml.init_camera.z;

  hepml.camera.setZoom(hepml.init_camera.zoom);
  hepml.camera.up = new THREE.Vector3(0,1,0);

  hepml.init_camera.perspective ? hepml.camera.toPerspective() : hepml.camera.toOrthographic();

  hepml.camera.lookAt(new THREE.Vector3(0,0,0));

};

hepml.init = function() {

  var display = document.getElementById('display');

  var w = display.clientWidth;
  var h = display.clientHeight;

  hepml.scene = new THREE.Scene();
  hepml.stats = new Stats();
  display.appendChild(hepml.stats.domElement);

  // On page load hide the stats
  $('#stats').hide();
  // FF keeps the check state on reload so force an "uncheck"
  $('#show-stats').prop('checked', false);

  $('#show-stats').change(function() {

    if ( this.checked ) { // if checked then show

      $('#stats').show();

    } else {

      $('#stats').hide();

    }

  });

  // See comment above re: FF
  $('#invert-colors').prop('checked', false);

  // width, height, fov, near, far, orthoNear, orthoFar
  hepml.camera = new THREE.CombinedCamera(w, h, 75, 0.1, 1000, 0.1, 1000);
  hepml.initCamera();

  hepml.inset_camera = new THREE.PerspectiveCamera(70, 1, 1, 100);
  hepml.inset_camera.up = hepml.camera.up;

  hepml.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  hepml.renderer.setSize(w, h);
  hepml.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  document.getElementById('display').appendChild(hepml.renderer.domElement);

  hepml.inset_renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  hepml.inset_renderer.setSize(h/5, h/5);
  hepml.inset_renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  document.getElementById('axes').appendChild(hepml.inset_renderer.domElement);

  hepml.controls = new THREE.TrackballControls(hepml.camera, hepml.renderer.domElement);
  hepml.controls.rotateSpeed = 3.0;
  hepml.controls.zoomSpeed = 0.5;

  var ambientLight = new THREE.AmbientLight(0x404040);
  ambientLight.name = 'Ambient';
  hepml.scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.name = 'Directional';
  directionalLight.position.set(0, 0.5, 1);
  hepml.scene.add(directionalLight);

  hepml.inset_scene = new THREE.Scene();

  var axis_length = 4.0;
  var axes = new THREE.AxisHelper(axis_length);
  axes.material.linewidth = 2;
  hepml.inset_scene.add(axes);

  var font_loader = new THREE.FontLoader();
  font_loader.load('./fonts/helvetiker_regular.typeface.json', function(font) {

    var tps = {size:0.75, height:0.1, font:font};

    var x_geo = new THREE.TextGeometry('X', tps);
    var y_geo = new THREE.TextGeometry('Y', tps);
    var z_geo = new THREE.TextGeometry('Z', tps);

    var x_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var x_text = new THREE.Mesh(x_geo, x_material);
    x_text.position.x = axis_length+0.5;

    var y_material = new THREE.MeshBasicMaterial({ color: 0x00ff00});
    var y_text = new THREE.Mesh(y_geo, y_material);
    y_text.position.y = axis_length+0.5;

    var z_material = new THREE.MeshBasicMaterial({ color: 0x0000ff});
    var z_text = new THREE.Mesh(z_geo, z_material);
    z_text.position.z = axis_length+0.5;

    hepml.inset_scene.add(x_text);
    hepml.inset_scene.add(y_text);
    hepml.inset_scene.add(z_text);
  });

  hepml.raycaster = new THREE.Raycaster();
  hepml.raycaster.linePrecision = 0.1;

  hepml.mouse = new THREE.Vector2();
  hepml.intersected = null;

  hepml.renderer.domElement.addEventListener('mousemove', hepml.onMouseMove, false);
  hepml.renderer.domElement.addEventListener('mousedown', hepml.onMouseDown, false);

  hepml.get_image_data = false;
  hepml.image_data = null;

  /*
    Detector
        ECAL
        HCAL
    Event
        EHits
        HHits
        Primary
  */

  var dobj = new THREE.Object3D();
  dobj.name = 'Detector';
  dobj.visible = true;

  var ecal = new THREE.Object3D();
  ecal.name = 'ECAL';
  ecal.visible = true;

  var hcal = new THREE.Object3D();
  hcal.name = 'HCAL';
  hcal.visible = true;

  dobj.add(ecal);
  dobj.add(hcal);

  var eobj = new THREE.Object3D();
  eobj.name = 'Event';
  eobj.visible = true;

  var ehits = new THREE.Object3D();
  ehits.name = 'EHits';
  ehits.visible = true;
  hepml.visible[ehits.name] = ehits.visible;

  var hhits = new THREE.Object3D();
  hhits.name = 'HHits';
  hhits.visible = true;
  hepml.visible[hhits.name] = hhits.visible;

  var primary = new THREE.Object3D();
  primary.name = 'Primary';
  primary.visible = true;
  hepml.visible[primary.name] = primary.visible;

  eobj.add(ehits);
  eobj.add(hhits);
  eobj.add(primary);

  hepml.scene.add(dobj);
  hepml.scene.add(eobj);

  // FF keeps the check state on reload so force the start states
  $('#show-ecal').prop('checked', true);
  $('#show-hcal').prop('checked', true);
  $('#show-primary').prop('checked', false);
  $('#show-ecal-hits').prop('checked', false);
  $('#show-hcal-hits').prop('checked', false);

  console.log(hepml.scene);

  hepml.setFramerate(30.0);
  $('#fps-slider').prop('value', hepml.max_framerate);

  hepml.mouse = new THREE.Vector2();
  hepml.intersected = null;

  $('#hepml-version').html('v'+hepml.version);
  $('#threejs-version').html('r'+THREE.REVISION);

};

hepml.render = function() {

  setTimeout( function() {
      requestAnimationFrame(hepml.render);
    },  1000 / hepml.max_framerate );

  hepml.renderer.render(hepml.scene, hepml.camera);
  hepml.inset_renderer.render(hepml.inset_scene, hepml.inset_camera);

  if ( hepml.get_image_data ) {

    hepml.image_data = hepml.renderer.domElement.toDataURL();
    hepml.get_image_data = false;

  }

  hepml.controls.update();
  hepml.stats.update();

  hepml.inset_camera.position.subVectors(hepml.camera.position, hepml.controls.target);
  hepml.inset_camera.up = hepml.camera.up;
  hepml.inset_camera.quarternion = hepml.camera.quaternion;
  hepml.inset_camera.position.setLength(10);
  hepml.inset_camera.lookAt(hepml.inset_scene.position);

};

hepml.resetControls = function() {

  hepml.controls.reset();
  hepml.initCamera();

};

hepml.zoomIn = function() {

  if ( hepml.camera.inPerspectiveMode ) {
    hepml.camera.position.multiplyScalar(0.5);
  } else {
    var zoom = hepml.camera.zoom;
    hepml.camera.setZoom(zoom+0.5);
  }
  
};

hepml.zoomOut = function() {

  if ( hepml.camera.inPerspectiveMode ) {
    hepml.camera.position.multiplyScalar(1.5);
  } else {
    var zoom = hepml.camera.zoom;
    hepml.camera.setZoom(zoom-0.5);
  }

};

hepml.setYX = function() {

  var length = hepml.camera.position.length();

  hepml.camera.position.x = 0;
  hepml.camera.position.y = 0;
  hepml.camera.position.z = -length;
  hepml.camera.up = new THREE.Vector3(0,1,0);

  hepml.camera.lookAt(new THREE.Vector3(0,0,0));

};

hepml.setXZ = function() {

  var length = hepml.camera.position.length();

  hepml.camera.position.x = 0;
  hepml.camera.position.y = length;
  hepml.camera.position.z = 0;
  hepml.camera.up = new THREE.Vector3(1,0,0);

  hepml.camera.lookAt(new THREE.Vector3(0,0,0));

};

hepml.setYZ = function() {

  var length = hepml.camera.position.length();

  hepml.camera.position.x = -length;
  hepml.camera.position.y = 0;
  hepml.camera.position.z = 0;
  hepml.camera.up = new THREE.Vector3(0,1,0);

  hepml.camera.lookAt(new THREE.Vector3(0,0,0));

};

hepml.perspective = function() {

  hepml.camera.toPerspective();
  $('#perspective').toggleClass('active');
  $('#orthographic').toggleClass('active');

};

hepml.orthographic = function() {

  hepml.camera.toOrthographic();
  $('#perspective').toggleClass('active');
  $('#orthographic').toggleClass('active');

};

hepml.toggle = function(name) {

  hepml.scene.getObjectByName(name).visible = ! hepml.scene.getObjectByName(name).visible;
  hepml.visible[name] = ! hepml.visible[name];

};

hepml.invertColors = function() {

  if ( hepml.inverted_colors ) {

    hepml.renderer.setClearColor(0x000000,1);
    hepml.inset_renderer.setClearColor(0x000000,0);


  } else {

    hepml.renderer.setClearColor(0xffffff,1);
    hepml.inset_renderer.setClearColor(0xffffff,0);

  }

  $('body').toggleClass('white').toggleClass('black');

  $('#titlebar').toggleClass('white').toggleClass('black');
  $('#toolbar').toggleClass('white').toggleClass('black');
  $('#display').toggleClass('white').toggleClass('black');

  $('#treeview').toggleClass('white').toggleClass('black');
  $('.table tr').toggleClass('white').toggleClass('black');

  $('#tableview').toggleClass('white').toggleClass('black');
  $('.modal-content').toggleClass('white').toggleClass('black');

  hepml.inverted_colors = !hepml.inverted_colors;

}

hepml.enterFullscreen = function() {

  var container = document.getElementById('hepml');

  if ( container.requestFullscreen ) {
    container.requestFullscreen();
  } else if ( container.msRequestFullscreen ) {
    container.msRequestFullscreen();
  } else if ( container.mozRequestFullScreen ) {
    container.mozRequestFullScreen();
  } else if ( container.webkitRequestFullscreen ) {
    container.webkitRequestFullscreen();
  } else {
    alert('Cannot go to full screen!');
  }

};

hepml.exitFullscreen = function() {

  if ( document.exitFullscreen ) {
    document.exitFullscreen();
  } else if ( document.msExitFullscreen ) {
    document.msExitFullscreen();
  } else if ( document.mozCancelFullScreen ) {
    document.mozCancelFullScreen();
  } else if ( document.webkitExitFullscreen ) {
    document.webkitExitFullscreen();
  } else {
    alert('Cannot exit full screen. Try Esc?');
  }

};

hepml.toggleFullscreen = function() {

  $('#enterFullscreen').toggleClass('active');
  $('#exitFullscreen').toggleClass('active');

};

document.addEventListener('webkitfullscreenchange', hepml.toggleFullscreen, false);
document.addEventListener('mozfullscreenchange', hepml.toggleFullscreen, false);
document.addEventListener('fullscreenchange', hepml.toggleFullscreen, false);
document.addEventListener('MSFullscreenChange', hepml.toggleFullscreen, false);

hepml.reload = function() {

  location.reload();

};

hepml.print = function() {

  hepml.get_image_data = true;
  hepml.render();
  window.open(hepml.image_data, "toDataURL() image", "width=800, height=400");

};

hepml.onWindowResize = function() {

  $('#display').removeAttr('style');

  var w = $('#display').innerWidth();
  var h = $('#display').innerHeight();

  hepml.camera.aspect = w/h;
  hepml.camera.updateProjectionMatrix();

  hepml.renderer.setSize(w,h);
  hepml.render();

}

window.addEventListener('resize', hepml.onWindowResize, false);

hepml.onMouseMove = function(e) {

  e.preventDefault();

  var w = $('#display').innerWidth();
  var h = $('#display').innerHeight();

  var doc = document.documentElement;
  var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
  var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

  var offsetX = $('#display').offset().left - left;
  var offsetY = $('#display').offset().top - top;

  hepml.mouse.x = ((e.clientX-offsetX) / w)*2 - 1;
  hepml.mouse.y = -((e.clientY-offsetY) / h)*2 +1;

  hepml.raycaster.setFromCamera(hepml.mouse, hepml.camera);

  var intersects = hepml.raycaster.intersectObjects(hepml.scene.getObjectByName('Event').children, true);

  if ( intersects.length > 0 ) {

    if ( hepml.intersected != intersects[0].object ) {

        if ( hepml.intersected ) {
          hepml.intersected.material.color.setHex(hepml.intersected.current_color);

          if ( hepml.intersected.parent.name === 'EHits' ) {
            hepml.highlightRow('ecal_'+hepml.intersected.userData.index, false);
          }

          if ( hepml.intersected.parent.name === 'HHits' ) {
            hepml.highlightRow('hcal_'+hepml.intersected.userData.index, false);
          }

        }

        hepml.intersected = intersects[0].object;
        hepml.intersected.current_color = hepml.intersected.material.color.getHex();
        hepml.intersected.material.color.setHex(0xcccccc);

        if ( hepml.intersected.parent.name === 'EHits' ) {
          hepml.highlightRow('ecal_'+hepml.intersected.userData.index, true);
        }

        if ( hepml.intersected.parent.name === 'HHits' ) {
          hepml.highlightRow('hcal_'+hepml.intersected.userData.index, true);
        }

    }

  } else {

    if ( hepml.intersected ) {
      hepml.intersected.material.color.setHex(hepml.intersected.current_color);

      if ( hepml.intersected.parent.name === 'EHits' ) {
        hepml.highlightRow('ecal_'+hepml.intersected.userData.index, false);
      }

      if ( hepml.intersected.parent.name === 'HHits' ) {
        hepml.highlightRow('hcal_'+hepml.intersected.userData.index, false);
      }

    }

    hepml.intersected = null;
  }

};

hepml.onMouseDown = function() {

  if ( hepml.intersected ) {

    var iobj = hepml.intersected;
    var data, name, ei;

    if ( iobj.parent.name === 'EHits' ) {
      data = hepml.current_event.ecal[iobj.userData.index];
      name = 'ECAL hit'
      ei = hepml.get_index('ecal', 'energy');
    }

    if ( iobj.parent.name === 'HHits' ) {
      data = hepml.current_event.hcal[iobj.userData.index];
      name = 'HCAL hit';
      ei = hepml.get_index('hcal', 'energy');
    }

    $('#collection-name').html(name);
    $('#object-data .modal-body').empty().html(data[ei].toPrecision(5) + ' GeV');
    $('#object-data').modal('show');

  }

};

hepml.highlighted = null;

hepml.highlightObject = function(objId) {

 var obj = hepml.scene.getObjectById(objId);
 hepml.highlighted = obj;
 hepml.highlighted.current_color = obj.material.color.getHex();
 hepml.highlighted.material.color.setHex(0xcccccc);

};

hepml.unhighlightObject = function() {

  hepml.highlighted.material.color.setHex(hepml.highlighted.current_color);
  hepml.hightlighted = null;

};

hepml.highlightRow = function(selector, hover) {

  var row = $('#'+selector);

  if ( row ) {

    if ( hover ) {

      var bgcolor = ! hepml.inverted_colors ? "#777777" : "#dfdfdf";
      row.css("background-color", bgcolor);
      row.scrollintoview();

    }
      else {

      row.removeAttr("style");

    }

  }

};

hepml.ecal = [25,25,25,0.4];
hepml.hcal = [5,5,60,2.0];

hepml.makeECAL = function(style) {

  var nx = hepml.ecal[0];
  var ny = hepml.ecal[1];
  var nz = hepml.ecal[2];

  var cx = hepml.ecal[3];
  var cy = cx;
  var cz = cx;

  var material = new THREE.LineBasicMaterial(hepml.ecal_settings);
  var boxes = new THREE.Geometry();

  for ( var i = 0; i < nx; i++ ) {
    for ( var j = 0; j < ny; j++ ) {
      for ( var k = 0; k < nz; k++ ) {

        var box = new THREE.Geometry();

        var shift = new THREE.Vector3((i + 0.5)*cx, (j + 0.5)*cy, (k + 0.5)*cz);
        shift.z -= 15;

        var f1 = new THREE.Vector3(-cx*0.5,-cy*0.5, cz*0.5);
        var f2 = new THREE.Vector3(-cx*0.5, cy*0.5, cz*0.5);
        var f3 = new THREE.Vector3( cx*0.5, cy*0.5, cz*0.5);
        var f4 = new THREE.Vector3( cx*0.5,-cy*0.5, cz*0.5);

        f1.add(shift);
        f2.add(shift);
        f3.add(shift);
        f4.add(shift);

        var b1 = new THREE.Vector3(-cx*0.5,-cy*0.5,-cz*0.5);
        var b2 = new THREE.Vector3(-cx*0.5, cy*0.5,-cz*0.5);
        var b3 = new THREE.Vector3( cx*0.5, cy*0.5,-cz*0.5);
        var b4 = new THREE.Vector3( cx*0.5,-cy*0.5,-cz*0.5);

        b1.add(shift);
        b2.add(shift);
        b3.add(shift);
        b4.add(shift);

        box.vertices.push(f1,f2);
        box.vertices.push(f2,f3);
        box.vertices.push(f3,f4);
        box.vertices.push(f4,f1);

        box.vertices.push(b1,b2);
        box.vertices.push(b2,b3);
        box.vertices.push(b3,b4);
        box.vertices.push(b4,b1);

        box.vertices.push(b1,f1);
        box.vertices.push(b3,f3);
        box.vertices.push(b2,f2);
        box.vertices.push(b4,f4);

        boxes.merge(box);

      }
    }
  }

  var geometry = new THREE.BufferGeometry();
  var positions = new Float32Array(boxes.vertices.length*3);
  geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).copyVector3sArray(boxes.vertices));

  var ecal = new THREE.LineSegments(geometry, material);
  hepml.scene.getObjectByName('ECAL').add(ecal);

};

hepml.makeHCAL = function(style) {

    var nx = hepml.hcal[0];
    var ny = hepml.hcal[1];
    var nz = hepml.hcal[2];

    var cx = hepml.hcal[3];
    var cy = cx;
    var cz = cx;

    var material = new THREE.LineBasicMaterial(hepml.hcal_settings);
    var boxes = new THREE.Geometry();

    for ( var i = 0; i < nx; i++ ) {
      for ( var j = 0; j < ny; j++ ) {
        for ( var k = 0; k < nz; k++ ) {

          var box = new THREE.Geometry();

          var shift = new THREE.Vector3((i + 0.5)*cx, (j + 0.5)*cy, (k + 0.5)*cz);
          shift.z += 5;

          var f1 = new THREE.Vector3(-cx*0.5,-cy*0.5, cz*0.5);
          var f2 = new THREE.Vector3(-cx*0.5, cy*0.5, cz*0.5);
          var f3 = new THREE.Vector3( cx*0.5, cy*0.5, cz*0.5);
          var f4 = new THREE.Vector3( cx*0.5,-cy*0.5, cz*0.5);

          f1.add(shift);
          f2.add(shift);
          f3.add(shift);
          f4.add(shift);

          var b1 = new THREE.Vector3(-cx*0.5,-cy*0.5,-cz*0.5);
          var b2 = new THREE.Vector3(-cx*0.5, cy*0.5,-cz*0.5);
          var b3 = new THREE.Vector3( cx*0.5, cy*0.5,-cz*0.5);
          var b4 = new THREE.Vector3( cx*0.5,-cy*0.5,-cz*0.5);

          b1.add(shift);
          b2.add(shift);
          b3.add(shift);
          b4.add(shift);

          box.vertices.push(f1,f2);
          box.vertices.push(f2,f3);
          box.vertices.push(f3,f4);
          box.vertices.push(f4,f1);

          box.vertices.push(b1,b2);
          box.vertices.push(b2,b3);
          box.vertices.push(b3,b4);
          box.vertices.push(b4,b1);

          box.vertices.push(b1,f1);
          box.vertices.push(b3,f3);
          box.vertices.push(b2,f2);
          box.vertices.push(b4,f4);

          boxes.merge(box);

        }
      }
    }

    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(boxes.vertices.length*3);
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).copyVector3sArray(boxes.vertices));

    var hcal = new THREE.LineSegments(geometry, material);
    hepml.scene.getObjectByName('HCAL').add(hcal);

};

hepml.makeDetector = function(style) {

  hepml.makeECAL();
  hepml.makeHCAL();

};

hepml.loadEventFile = function(name) {

  var name_split = name.split("/");
  hepml.file_name = name_split[name_split.length-1];
  hepml.event_index = 0;

  var xhr = new XMLHttpRequest();
  xhr.open("GET", name, true);
  xhr.responseType = 'json';

  xhr.onload = function() {

    if ( this.status === 200) {

      hepml.events = xhr.response;
      hepml.enableNextPrev();
      hepml.addEvent();

    } else {

      alert('Error loading event file', name);
    }

  };

  xhr.send();

};

hepml.loadData = function() {

  hepml.event_index = 0;

  hepml.loaded_file = document.getElementById('local-file').files;
  console.log(hepml.loaded_file);

  var reader = new FileReader();
  hepml.file_name = hepml.loaded_file[0].name;

  reader.onload = function(e) {

    hepml.events = JSON.parse(e.target.result);
    hepml.enableNextPrev();
    hepml.addEvent();
  };

  reader.onerror = function(e) {

    alert(e);

  };

  reader.readAsText(hepml.loaded_file[0]);

};

hepml.showTable = function(name) {

  if ( ! hepml.event_loaded ) {

    return;

  }

  var collectionTable = $('#collection-table');

  collectionTable.empty();
  collectionTable.append('<caption>' + name + '</caption>');
  collectionTable.append('<thead> <tr>');
  var collectionTableHead = collectionTable.find('thead').find('tr');

  collectionTableHead.append($('<th data-sort="int"><i class="fa fa-sort"></i> i</th>'));

  hepml.schema[name].forEach(function(obj){
      for ( var c in obj ) {
        var dataSort = obj[c];
        collectionTableHead.append($('<th data-sort="' + dataSort + '"><i class="fa fa-sort"></i> ' + c + '</th>'));
      }
  });

  var data = hepml.events[hepml.event_index][name];

  for ( var i = 0; i < data.length; i++ ) {

    var row_content = "<tr id="+ name+'_'.concat(i) +" onmouseenter='hepml.highlightObject(" + hepml.objectIds[name][i] + ");' onmouseout='hepml.unhighlightObject();' class=";

    if ( hepml.inverted_colors )
        row_content += "'white'>";
    else
        row_content += "'black'>";

    row_content += "<td>" + i + "</td>";

    for ( var j = 0; j < data[i].length; j++ ) {

      var vo = hepml.schema[name][j];

      for ( v in vo ) {

        var rc = vo[v] === 'float' ? data[i][j].toPrecision(5) : data[i][j];
        row_content += "<td>"+ rc + "</td>";

      }

    }

    collectionTable.append(row_content);
  }

  collectionTable.stupidtable()
    .bind('aftertablesort', function(event, data){
      collectionTableHead.find('th').find('i').removeClass().addClass('fa fa-sort');
      var newClass = "fa fa-sort-" + data.direction;
      collectionTableHead.find('th').eq(data.column).find('i').removeClass().addClass(newClass);
    });

  var $th_to_sort = collectionTable.find("thead th").eq(0);
  $th_to_sort.stupidsort();

};

hepml.addPrimary = function(p) {

  var dir = new THREE.Vector3(0, 0, 1);

  // dir, origin, length, hex, headLength, headWidth
  // Need to get proper positioning
  var arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,-17), 2, 0xffff00, 0.5, 1);
  arrow.line.material.linewidth = 3;

  //console.log(p[0]);

  //hepml.scene.getObjectByName('Primary').add(arrow);

  //$('#show-primary').prop('checked', true);

};

hepml.addECALhits = function(ecal) {

  var nx = hepml.ecal[0];
  var ny = hepml.ecal[1];
  var nz = hepml.ecal[2];

  var cx = hepml.ecal[3];
  var cy = cx;
  var cz = cx;

  var material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent:true, opacity:1});

  var maxe = 0;

  for ( var e in ecal ) {

    var energy = ecal[e][3];

    if ( energy > maxe ) {

      maxe = energy;

    }
  }

  var colors = chroma.scale('Spectral').domain([1,0]);
  var ehits = hepml.scene.getObjectByName('EHits');

  for ( var e in ecal ) {

    var hit = ecal[e];

    var i = ecal[e][0];
    var j = ecal[e][1];
    var k = ecal[e][2];

    var energy = ecal[e][3];
    var s = energy / maxe;

    var o = 1.0;

    var x = (i + 0.5)*cx;
    var y = (j + 0.5)*cy;
    var z = (k + 0.5)*cz;

    var c = colors(s);
    var color = new THREE.Color(c._rgb[0]/255, c._rgb[1]/255, c._rgb[2]/255);
    var box = new THREE.Mesh(new THREE.BoxGeometry(s*cx,s*cy,s*cz), new THREE.MeshBasicMaterial({color:color, transparent:true, opacity:o}));

    box.position.x = x;
    box.position.y = y;
    box.position.z = z - 15;

    box.userData.index = e;
    hepml.objectIds.ecal.push(box.id);

    ehits.add(box);

  }

  if ( ! hepml.event_loaded ) {

    $('#show-ecal-hits').prop('checked', true);

  }

};

hepml.addHCALhits = function(hcal) {

  var nx = hepml.hcal[0];
  var ny = hepml.hcal[1];
  var nz = hepml.hcal[2];

  var cx = hepml.hcal[3];
  var cy = cx;
  var cz = cx;

  var material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent:true, opacity:1});

  var maxe = 0;

  for ( var h in hcal ) {

    var energy = hcal[h][3];

    if ( energy > maxe ) {

      maxe = energy;

    }

  }

  var colors = chroma.scale('Spectral').domain([1,0]);
  var hhits = hepml.scene.getObjectByName('HHits');

  for ( var h in hcal ) {

    var hit = hcal[h];

    var i = hcal[h][0];
    var j = hcal[h][1];
    var k = hcal[h][2];

    var energy = hcal[h][3];
    var s = energy / maxe;

    var o = 1.0;

    var x = (i + 0.5)*cx;
    var y = (j + 0.5)*cy;
    var z = (k + 0.5)*cz;

    var c = colors(s);
    var color = new THREE.Color(c._rgb[0]/255, c._rgb[1]/255, c._rgb[2]/255);
    var box = new THREE.Mesh(new THREE.BoxGeometry(s*cx,s*cy,s*cz), new THREE.MeshBasicMaterial({color:color, transparent:true, opacity:o}));

    box.position.x = x;
    box.position.y = y;
    box.position.z = z + 5;

    box.userData.index = h;
    hepml.objectIds.hcal.push(box.id);

    hhits.add(box);

  }

  if ( ! hepml.event_loaded ) {

    $('#show-hcal-hits').prop('checked', true);

  }

};

hepml.addEvent = function() {

  hepml.scene.getObjectByName('EHits').children.length = 0;
  hepml.scene.getObjectByName('HHits').children.length = 0;
  hepml.scene.getObjectByName('Primary').children.length = 0;

  var data = hepml.events[hepml.event_index];
  hepml.current_event = data;

  var ievent = +hepml.event_index + 1; // JavaScript!

  $("#event-loaded").html(hepml.file_name + ": [" + ievent + " of " + hepml.events.length + "]");

  hepml.addECALhits(data.ecal);
  hepml.addHCALhits(data.hcal);
  hepml.addPrimary(data.primary);

  hepml.event_loaded = true;

  $('#collection-table').empty();
  $('#collection-table').append('Click on the names "Primary", "ECAL Hits", or "HCAL Hits" to display here in the table view');

};

hepml.enableNextPrev = function() {

  $("#prev-event-button").removeClass("disabled");
  $("#next-event-button").removeClass("disabled");

};

hepml.nextEvent = function() {

  if ( hepml.events && hepml.events.length-1 > hepml.event_index ) {
    hepml.event_index++;
    hepml.addEvent();
  }

};

hepml.prevEvent = function() {

  if ( hepml.events && hepml.event_index > 0) {
    hepml.event_index--;
    hepml.addEvent();
  }

};
