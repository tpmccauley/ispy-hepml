var hepml = hepml || {};
hepml.version = '0.0.1';

hepml.event_index = 0;
hepml.events = [];

hepml.init = function() {

  var w = window.innerWidth;
  var h = window.innerHeight;

  hepml.scene = new THREE.Scene();
  hepml.stats = new Stats();
  document.getElementById('display').appendChild(hepml.stats.domElement);

  hepml.camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 1000);
  hepml.camera.position.x = -15;
  hepml.camera.position.y = 20;
  hepml.camera.position.z = -15;

  hepml.renderer = new THREE.WebGLRenderer({antialias:true});
  hepml.renderer.setSize(w, h);
  hepml.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  document.getElementById('display').appendChild(hepml.renderer.domElement);

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

  var axes = new THREE.AxisHelper(2);
  axes.name = 'Axes';
  hepml.scene.add(axes);

  var dobj = new THREE.Object3D();
  dobj.name = 'Detector';
  dobj.visible = true;

  var eobj = new THREE.Object3D();
  eobj.name = 'Event';
  eobj.visible = true;

  hepml.scene.add(dobj);
  hepml.scene.add(eobj);

  console.log(hepml.scene);

};

hepml.render = function() {

  requestAnimationFrame(hepml.render);
  hepml.renderer.render(hepml.scene, hepml.camera);

  hepml.controls.update();
  hepml.stats.update();

};

hepml.resetControls = function() {

  hepml.controls.reset();

};

hepml.setYX = function() {

  var length = hepml.camera.position.length();

  hepml.camera.position.x = 0;
  hepml.camera.position.y = 0;
  hepml.camera.position.z = length;
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

hepml.makeECAL = function(style) {

  var nx = 24;
  var ny = 24;
  var nz = 25;

  var cx = 0.5;
  var cy = 0.5;
  var cz = 0.5;

  var material = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    linewidth: 0.1,
    depthWrite: true,
    transparent:true,
    opacity: 0.1
  });

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

  ecal = new THREE.LineSegments(boxes, material);
  ecal.name = 'ECAL';
  hepml.scene.getObjectByName('Detector').add(ecal);

};

hepml.makeHCAL = function(style) {

    var nx = 4;
    var ny = 4;
    var nz = 60;

    var cx = 3.0;
    var cy = 3.0;
    var cz = 3.0;

    var material = new THREE.LineBasicMaterial({
      color: 0xaaaaaa,
      linewidth: 0.1,
      depthWrite: true,
      transparent:true,
      opacity: 0.5
    });

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

    hcal = new THREE.LineSegments(boxes, material);
    hcal.name = 'HCAL';
    hepml.scene.getObjectByName('Detector').add(hcal);

};

hepml.makeDetector = function(style) {

  hepml.makeECAL();
  hepml.makeHCAL();

};

hepml.loadData = function() {

  hepml.loaded_file = document.getElementById('local-file').files;

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

hepml.addECALhits = function(ecal) {

  var nx = 24;
  var ny = 24;
  var nz = 25;

  var cx = 0.5;
  var cy = 0.5;
  var cz = 0.5;

  var material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent:true, opacity:1});

  var maxe = 0;

  for ( var e in ecal ) {
    var energy = ecal[e][3];
    if ( energy > maxe ) {
      maxe = energy;
    }
  }

  var colors = chroma.scale('Spectral').domain([1,0]);

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

    hepml.scene.getObjectByName('Event').add(box);

  }

};


hepml.addHCALhits = function(hcal) {

  var nx = 4;
  var ny = 4;
  var nz = 60;

  var cx = 3.0;
  var cy = 3.0;
  var cz = 3.0;

  var material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent:true, opacity:1});

  var maxe = 0;

  for ( var h in hcal ) {
    var energy = hcal[h][3];
    if ( energy > maxe ) {
      maxe = energy;
    }
  }

  var colors = chroma.scale('Spectral').domain([1,0]);

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

    hepml.scene.getObjectByName('Event').add(box);

  }

};

hepml.addEvent = function() {

  hepml.scene.getObjectByName('Event').children.length = 0;
  var data = hepml.events[hepml.event_index];

  var ievent = +hepml.event_index + 1; // JavaScript!

  $("#event-loaded").html(hepml.file_name + ": [" + ievent + " of " + hepml.events.length + "]");

  hepml.addECALhits(data.ecal);
  hepml.addHCALhits(data.hcal);

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
