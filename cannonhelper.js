/*

CannonHelper 1.0
Lauri-Matti Parppei 
Released under the MIT license


A very very very simple helper class for fast and simple physics in Three.js.
Developed just for my own needs but someone might find this useful.

You can access the world through CannonHelper.world and all bodies added
by the helper are held in CannonHelper.bodies array.


Usage:

// -9 gravity on Y axis
physics = new CannonHelper(0,-9,0);

// You can also specify timeStep. The default is 1.0/60.0.
this.timeStep = value;   

// Create a Three.js Object3D
var mesh = new THREE.Mesh( geometry, material );

// Cheat function to create and add a body with no unnecessary steps
physics.addBody( mesh, mass );

// Alternative way for more control
var body = physics.newBody( mesh, mass, optional: Cannon shape ));
physics.add(body);

// You can also create compund shapes with adding parts to bodies.
// NOTE that you need to add the parts before adding the object to world.
var body = physics.newBody ( mesh, mass );
body.addPart( mesh );
physics.add(body);

animate () { 
    physics.update();
    render(); 
}

*/

function CannonHelper (gravityX,gravityY,gravityZ, timeStep) {
    if (!timeStep) timeStep = 1.0/60.0;

    this.bodies = [];
    this.world = new CANNON.World();
    this.world.gravity.set(gravityX,gravityY,gravityZ);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.timeStep = timeStep;

    this.newBody = function (object3d, mass, shape) {
        var body = new CANNON.Body({ mass: mass });

        if (!shape) {
            shape = this.getGeometry(object3d);
        }

        body.addShape(shape);
        body.parent = object3d;
        body.position.copy(object3d.position);
        body.quaternion.copy(object3d.quaternion);
        
        var that = this;

        body.addPart = function (object3d, shape) {
            if (!shape) shape = that.getGeometry(object3d);

            var position = new CANNON.Vec3();
            var quaternion = new CANNON.Vec3();
            
            position.copy(object3d.position);
            quaternion.copy(object3d.quaternion);
            
            //this.parent = object3d;
            this.addShape(shape, position);
        }

        return body;
    }

    this.getGeometry = function (object3d) {

        var shape = {};

        var geometry = object3d.geometry;
        var parameters = geometry.parameters;

        switch (geometry.type) {
            case "BoxGeometry":
                shape = new CANNON.Box(
                    new CANNON.Vec3(parameters.width / 2, parameters.height / 2, parameters.depth / 2)
                );
                break;
            case "SphereGeometry":
                shape = new CANNON.Sphere(parameters.radius);
                break;
            case "CylinderGeometry":
                shape = new CANNON.Cylinder(parameters.radiusTop, parameters.radiusBottom, parameters.height, parameters.radialSegments);
                break;
            case "PlaneGeometry":

                shape = new CANNON.Box(
                    new CANNON.Vec3(parameters.width / 2, parameters.height / 2, 0.5)
                );
                break;
            default:
                console.log("Specify a Cannon.js shape");
                break;
        }
        return shape;
    }

    // A cheat function for lazy me.
    this.addBody = function  (body, mass, shape) {
        var newBody = this.newBody(body, mass, shape);
        this.add(newBody);
    }

    this.add = function  (body) {
        this.world.add(body);
        this.bodies.push(body);
    }

    this.update = function () {
        for (var b in this.bodies) {
            var body = this.bodies[b];

            if (body.parent) {
                body.parent.position.copy(body.position);
                body.parent.quaternion.copy(body.quaternion);
            } else {
                this.world.remove(body)
            }
        }

        this.world.step(this.timeStep);
    }
}