let scene, camera, renderer, stars, starGeo;

    const PARTICLES_COUNT = 10000;

    const PARTICLE_COLOR = 0x7a6400;  // color: 0xffce00,
    const PARTICLE_SIZE = 4.0;  // in pixels 

    const FORCE_FACTOR = 0.001;  // 0.1
    const VELOCITY_CLAMP = 0.5;

    const inc = 0.04;  // Perlin, 0.4
    const scl = 20;
    let cols, rows;

    let viewport = {};

    let offset = 0

    let flowfield;
    let arrows;

    function setVectorFromAngle(v, angle) {
      v.x = Math.cos(angle)
      v.z = Math.sin(angle)
    }  

    function vectorFromAngle(angle) {
      return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
    }

    function init(pathToSprite) {
      scene = new THREE.Scene();

      cols = Math.floor(window.innerWidth / scl);
      rows = Math.floor(window.innerHeight / scl);

      camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -1, 1000);
      camera.position.z = 1;
      camera.rotation.x = Math.PI/2;

      const canvas = document.querySelector("#canvas");
      renderer = new THREE.WebGLRenderer({canvas});
      renderer.setSize(window.innerWidth, window.innerHeight);

      onWindowResize();

      document.body.appendChild(renderer.domElement);

      starGeo = new THREE.Geometry();
      for (let i = 0; i < PARTICLES_COUNT; i++) {
        star = new THREE.Vector3(
          Math.random() * window.innerWidth,
          10,  // Math.random() * 10,
          Math.random() * window.innerHeight,
        );
        star.velocity = new THREE.Vector3();
        star.acceleration = new THREE.Vector3();
        starGeo.vertices.push(star);
      }

      flowfield = new Array(cols * rows);
      
      arrows    = new Array(cols * rows);
      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          const index = x + z * cols;

          flowfield[index] = new THREE.Vector3();

          /*
          // Create arrows in direction and with given position.
          const arrowHelper = new THREE.ArrowHelper(
            new THREE.Vector3(0, 10, 0), 
            new THREE.Vector3(x * scl, 600, z * scl), 
            6.0, 0xffffff
          );
          arrows[index] = arrowHelper;
          scene.add(arrowHelper);
          */
        }
      }

      let sprite = new THREE.TextureLoader().load(pathToSprite);
      let starMaterial = new THREE.PointsMaterial({
        map: sprite,
        color: PARTICLE_COLOR,
        size: PARTICLE_SIZE,
        // aplhaTest: true,
        depthTest: true,
        transparent: true,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      });

      stars = new THREE.Points(starGeo,starMaterial);
      scene.add(stars);

      window.addEventListener("resize", onWindowResize, false);

      animate(); 
    }

    function onWindowResize() {
      viewport.w = window.innerWidth;
      viewport.h = window.innerHeight;

      camera.left = 0;
      camera.right = viewport.w;
      camera.top = viewport.h;
      camera.bottom = 0;

      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function follow(p) {
      let x = Math.floor(p.x / scl);
      let z = Math.floor(p.z / scl);
      x = Math.min(Math.max(x, 0), cols - 1);
      z = Math.min(Math.max(z, 0), rows - 1);
      let index = x + z * cols;
      let force = flowfield[index];

      applyForce(p, force)
    }

    function applyForce(p, force) {
      p.acceleration.x += force.x * FORCE_FACTOR  // 0.1
      p.acceleration.y += force.y 
      p.acceleration.z += force.z * FORCE_FACTOR  // 0.1 

      p.velocity.x += p.acceleration.x
      p.velocity.y += p.acceleration.y
      p.velocity.z += p.acceleration.z
      
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.z += p.velocity.z;

      p.velocity.clampLength(0, VELOCITY_CLAMP);

      if (p.x > viewport.w) {
        p.x = 0;
      } else if (p.x < 0) {
        p.x = viewport.w;
      }
      if (p.z < 0) {
        p.z = viewport.h;
      } else if (p.z > viewport.h) {
        p.z = 0;
      }

      p.acceleration.x = 0
      p.acceleration.y = 0
      p.acceleration.z = 0
    }

    function animate() {
      requestAnimationFrame(animate);
      
      let zoff = 0;
      for (let z = 0; z < rows; z++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
          let index = x + z * cols;
          
          let angle = noise.perlin3(xoff, zoff, offset) * Math.PI * 2;

          setVectorFromAngle(flowfield[index], angle);
          // arrows[index].setDirection(vectorFromAngle(angle));

          xoff += inc;
        }
        offset += 0.00008;

        zoff += inc;
      }

      starGeo.vertices.forEach(p => {
        follow(p)
      });
      starGeo.verticesNeedUpdate = true;
    
      renderer.render(scene, camera);
    }