# cannonHelper
###A simple helper class for Three.js and Cannon integration

Lauri-Matti Parppei 2016. Released under MIT License.

A very very very simple helper class for fast and simple physics in Three.js. Created for my own needs but someone else might find this handy too. Creates Cannon shapes from Three.js meshes and also automatically removes them from world if they no longer exist. 

You can access the world through CannonHelper.world and all bodies added by the helper are held in CannonHelper.bodies array. The original parent mesh can be found in .bodies[i].parent.

This could be expanded a lot. Feel free to do it - I lack the skills and knowledge!

**Note:** You need to include Cannon.js in your project.


### Example 

A bare bones example. Set gravity to -9 on Y axis, create a mesh and add a physics body from it. Then just fire it up! If an object no longer exists its body will be automatically removed from world, so at basic level no additional checks or code is needed. 
```
physics = new CannonHelper(0,-9,0);
var mesh = new THREE.Mesh( geometry, material );
physics.addBody( mesh, mass );

animate () { 
    physics.update();
    render(); 
}
```

Easiest way to use the helper is through the .addBody function, which automatically creates a body from Three.js mesh. (Come to think of it, maybe this should use geometry instead of the mesh? Or support both?)

For more control you can create a body and then add it to the world. Body object is a normal Cannon.js body, so you can do whatever you want with it.
```
var body = physics.newBody( mesh, mass, optional: Cannon shape ));
physics.add(body);
```

You can also create compound shapes by adding parts similar to Three.js children. Note that you need to add the parts before adding the object to world. 
```
var body = physics.newBody ( mesh, mass );
body.addPart( mesh );
physics.add(body);
```

If you want to set a different timeStep value for Cannon, you can set it with CannonHelper.timeStep. The default is 1.0 / 60.0.
```
physics.timeStep = 1.0 / 60.0;
```

I'll provide a simple example project some time soon. 
