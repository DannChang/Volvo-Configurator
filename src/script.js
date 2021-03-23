import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import { gsap } from 'gsap'
import { Group, Raycaster } from 'three'

/**
 * Loaders
 */
let sceneIsReady = false
const loadingBarElement = document.querySelector('.loading-bar')
const loadingManager = new THREE.LoadingManager(
    // On finish loading object
    () => {
        window.setTimeout(() => {
            // set overlay shader from opaque to transparent
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 })

            // css transitions to fade in
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        }, 500)

        window.setTimeout(()=> {
            sceneIsReady = true
        }, 3500)
    },
    // Progress of object
    (itemsUrl, itemsLoaded, itemsTotal) => {
        // console.log(itemsLoaded)
        // console.log(itemsTotal)
        const progressRatio = itemsLoaded / itemsTotal;
        loadingBarElement.style.transform = `scaleX(${progressRatio})`
        
    }
)


/**
 * Model Loader
 */
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)

let mixer = null
gltfLoader.load(
    '/models/Volvo/glTF/scene.gltf',
    (gltf) => {
        console.log(gltf.scenes[0])
        gltf.scenes[0].scale.set(0.25, 0.25, 0.25)
        gltf.scenes[0].position.set(0, -0.17, 0)
        scene.add(gltf.scenes[0])

        updateAllMaterials()
    }
)


/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


/**
 * Overlay Shader Materials for Loading Page
 */
 const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
 const overlayMaterial = new THREE.ShaderMaterial({
     uniforms: {
         uAlpha: { value: 1 }
     },
     transparent: true,
     vertexShader: `
     void main()
     {
         gl_Position = vec4(position, 1.0);
     }
     `,
     fragmentShader: `
     uniform float uAlpha;
 
     void main()
     {
         gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
     }
     `
 })
 const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
 scene.add(overlay)
 
 /**
  * Update all materials
  */
 const updateAllMaterials = () =>
 {
     scene.traverse((child) =>
     {
         if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
         {
             // child.material.envMap = environmentMap
             // child.material.envMapIntensity = debugObject.envMapIntensity
             child.material.needsUpdate = true
             child.castShadow = true
             child.receiveShadow = true
         }
     })
 }

// Raycaster to detect mouse-over intersections of 3D model
const raycaster = new Raycaster()
const mouse = new THREE.Vector2()

const onMouseMove = (event) => {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = ( event.clientY / window.innerHeight ) * 2 + 1;

}

// Text Points
const points = [
    {
        position: new THREE.Vector3(0, 1.5, - 1.75),
        element: document.querySelector('.point-0')
    },
    // {
    //     position: new THREE.Vector3(0.5, 0.8, - 1.6),
    //     element: document.querySelector('.point-1')
    // },
    // {
    //     position: new THREE.Vector3(1.6, - 1.3, - 0.7),
    //     element: document.querySelector('.point-2')
    // }
]


/**
 * Environment Map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environments/snowy-env-map/px.png',
    '/textures/environments/snowy-env-map/nx.png',
    '/textures/environments/snowy-env-map/py.png',
    '/textures/environments/snowy-env-map/ny.png',
    '/textures/environments/snowy-env-map/pz.png',
    '/textures/environments/snowy-env-map/nz.png',
])

environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

// Particle Materials (snowfall)
const particlesMaterial = new THREE.PointsMaterial()
particlesMaterial.size = 0.02
particlesMaterial.sizeAttenuation = true

// Geometry
const particlesGeometry = new THREE.BufferGeometry()
const count = 500

const positions = new Float32Array(count * 3) // Multiply by 3 because each position is composed of 3 values (x, y, z)

for(let i = 0; i < count * 3; i++) // Multiply by 3 for same reason
{
    positions[i] = (Math.random() - 0.5) * 10 // Math.random() - 0.5 to have a random value between -0.5 and +0.5
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)) 

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 1.5, -3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

// Debugging scene
console.log(scene.children[5])

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // // Update particles for snow effect
    // particles.position.y = - elapsedTime * 0.2

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera)

    //calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children)

    // for(let i = 0; i < intersects.length; i++) {
    //     intersects[i].object.material.color.set(0xff0000)
    // }

    // Update mixer
    if(mixer !== null) {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Add text points
    for(const point of points) {
        const screenPosition = point.position.clone()
        screenPosition.project(camera)

        const translateX = screenPosition.x * sizes.width * 0.5
        const translateY = screenPosition.y * sizes.height * 0.5
        point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
    }

    // Render
    renderer.render(scene, camera)

    // Event listener for mouse
    window.addEventListener('mousemove', onMouseMove, false)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()