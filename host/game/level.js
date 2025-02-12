var generators = require('./generators/all');
var THREE = require('./libs/three');
var Entity = require('./entity/entity');
var hook = require('./hook');
var global = require('./global');
var Asteroid = require('./entity/asteroid');

var LEVEL_SEGMENTS = global.LEVEL_SEGMENTS;

//TODO: Generators that aren't full random, but have theme and cohesion, ala minecraft biomes
var Level = function(gameObject, seed, startPoint) {
  this.points = [startPoint];
  this.asteroidList = [];
  this.asteroidList.push(generators.AsteroidField(this, LEVEL_SEGMENTS - 1));

  this.path = new THREE.SplineCurve3(this.points);

  var geometry = new THREE.Geometry();
  geometry.vertices = this.path.getPoints(LEVEL_SEGMENTS * 20);

  // material
  var material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 8 } );

  // line
  this.line = new THREE.Line( geometry, material );

  Entity.scene.add(this.line);

  this.plane = { position: new THREE.Vector3(), rotation: new THREE.Quaternion() }
  this.plane.position.set(0,0,0);
  this.plane.rotation.set(0,0,0,0);

  this.distance = 0;
  this.velocity = 0.001;
  this.timescale = 1/100;
  var self = this;
  var box = new Asteroid(0,0,0);
  var called = {};
  hook.add('think', function levelThink(delta) {
    self.distance += (delta * self.velocity);
    var t = self.distance*self.timescale;
    if (t>1) {
      //level complete
      console.log('level done');
      hook.remove('think', levelThink);
      hook.call('level done');
      return;
    }
    self.plane.position = self.path.getPoint(t);
    self.plane.rotation.setFromUnitVectors(global.forward, self.path.getTangent(t));
    gameObject.camera.position.set(self.plane.position.x, self.plane.position.y, self.plane.position.z);

    
    var t2 = (self.distance+1)*self.timescale;
    var boxPos = self.path.getPoint(t2);
    gameObject.camera.lookAt(boxPos);
    gameObject.camera.lookAtPos = boxPos;

    var nodeNum = Math.floor(t*LEVEL_SEGMENTS);
    if (!called[nodeNum]) {
      hook.call('node '+nodeNum, self);
      called[nodeNum] = true;
    }
  });

  window.addEventListener("keyup", function(event) {
    if(event.keyCode == '32'){
      self.velocity = self.velocity === 0 ? 0.001 : 0;
    }
  })
};

Level.prototype = {};

Level.prototype.remove = function() {
  var length = this.asteroidList.length;
  var tempRoid;
  for(var i = 0; i < length; i++) {
    tempRoid = this.asteroidList.pop();
    if(tempRoid) {
      tempRoid.remove();
    }
  }
  Entity.scene.remove(this.line);
};

Level.prototype.getPos = function() {
  return this.plane.position;
};

Level.prototype.getRotation = function() {
  return this.plane.rotation;
}

module.exports = Level;
