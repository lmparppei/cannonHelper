/*

CannonHelper 1.02
2016-07-01

Lauri-Matti Parppei 
Released under the MIT license


A very very very simple helper class for fast and simple physics in Three.js. 
Created for my own needs but someone else might find this handy too. Creates 
Cannon shapes from Three.js meshes and also automatically removes them from 
world if they no longer exist.

You can access the world through CannonHelper.world and all bodies added by the 
helper are held in CannonHelper.bodies array. The original parent mesh can be 
found in .bodies[i].parent.

This could be expanded a lot. Feel free to do it - I lack the skills and knowledge!

Note: You need to include Cannon.js in your project.


EXAMPLE

A bare bones example. Set gravity to -9 on Y axis, create a mesh and add a physics
body from it. Then just fire it up! If an object no longer exists its body will be
automatically removed from world, so at basic level no additional checks or code is needed.

physics = new CannonHelper(0,-9,0);
var mesh = new THREE.Mesh( geometry, material );
physics.addBody( mesh, mass );

animate () { 
    physics.update();
    render(); 
}

Easiest way to use the helper is through the .addBody function, which automatically
creates a body from Three.js mesh. (Come to think of it, maybe this should use geometry
instead of the mesh? Or support both?)

For more control you can create a body and then add it to the world. Body object is a normal
Cannon.js body, so you can do whatever you want with it.

var body = physics.newBody( mesh, mass, optional: Cannon shape ));
physics.add(body);

You can also create compound shapes by adding parts similar to Three.js children. Note that
you need to add the parts before adding the object to world.

var body = physics.newBody ( mesh, mass );
body.addPart( mesh );
physics.add(body);

If you want to set a different timeStep value for Cannon, you can set it with 
CannonHelper.timeStep. The default is 1.0 / 60.0.

physics.timeStep = 1.0 / 60.0;


COLLISION GROUP HELPER

Not exactly a Three.js integration thing, but I included my collision group helper 
here too. It automatically adds ALL collision groups to body's collision filter 
and you can set the filter to exclude certain groups.

physics.setCollisionGroups([ 'floor', 'player', 'debris' ]);

// This object belongs to collision group 'floor'
body.setCollisions('player');

// Excludes groups 'debris' and 'decoration' from collisions     
body.noCollisions(['debris', 'decoration']);   

*/

function CannonHelper (gravityX,gravityY,gravityZ, timeStep) {
    if (!timeStep) { timeStep = 1.0/60.0; }

    this.bodies = [];
    this.world = new CANNON.World();
    this.world.gravity.set(gravityX,gravityY,gravityZ);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.timeStep = timeStep;

    this.collisionGroups = {};

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
            if (!shape) { shape = that.getGeometry(object3d); }

            var position = new CANNON.Vec3();
            var quaternion = new CANNON.Vec3();
            
            position.copy(object3d.position);
            quaternion.copy(object3d.quaternion);
            
            this.addShape(shape, position);
        }

        body.applyCentralImpulse = function (forceX, forceY, forceZ, offsetX = 0, offsetY = 0, offsetZ = 0) {
            this.applyImpulse(
                new CANNON.Vec3(forceX, forceY, forceZ), 
                new CANNON.Vec3(this.position.x + offsetX, this.position.y + offsetY, this.position.z + offsetZ)
            );
        }

        // Set the collision group this body belongs to
        body.setCollisions = function (group) {
            this.collisionFilterGroup = that.collisionGroups[group];
            this.collisionFilterMask = undefined;
            for (var index in that.collisionGroups) {
                this.collisionFilterMask |= parseInt(that.collisionGroups[index]);
            }
        }

        // Creates a filter mask that EXCLUDES certain groups
        body.noCollisions = function (groups) {
            var isArr = Object.prototype.toString.call(groups) == '[object Array]';
            if (!isArr) { groups = [ groups ]; }

            this.collisionFilterMask = undefined;
            for (var index in that.collisionGroups) {
                if (groups.indexOf(index) == -1) {
                    this.collisionFilterMask |= parseInt(that.collisionGroups[index]); 
                }
            }
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
                // The cylinder in Cannon is different than Three.js cylinder.
                // We need to rotate it before attaching it to the mesh.

                shape = new CANNON.Cylinder(parameters.radiusTop, parameters.radiusBottom, parameters.height, parameters.radialSegments);
                
                var quat = new CANNON.Quaternion();
                quat.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
                var translation = new CANNON.Vec3(0,0,0);
                shape.transformAllPoints(translation,quat);

                break;

            case "PlaneGeometry":
                // NOTE: This is NOT the Cannon plane which is infinite. 
                // It mimics a finite Three.js plane with a very thin box.

                shape = new CANNON.Box(
                    new CANNON.Vec3(parameters.width / 2, parameters.height / 2, 0.01)
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
        this.add (newBody);
        return (newBody);
    }

    this.add = function  (body) {
        this.world.add(body);
        this.bodies.push(body);
    }

    // Create collision groups
    this.setCollisionGroups = function (groups) {
        var n = 2;
        this.collisionGroups = {};

        for (var index in groups) {
            var index = parseInt(index);

            this.collisionGroups[groups[index]] = Math.pow(n, (index + 1));
        }
    }

    this.update = function () {
        for (var b in this.bodies) {
            var body = this.bodies[b];

            if (body.parent.parent) {
                body.parent.position.copy(body.position);
                body.parent.quaternion.copy(body.quaternion);
            } else {
                this.world.remove(body)
            }
        }

        this.world.step(this.timeStep);
    }
}