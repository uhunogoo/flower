import './style.css'
import * as dat from 'dat.gui'
import * as THREE from 'three'

import gsap from 'gsap'
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'

/**
 * Base
 */
// Debug
const degubObject = {}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Object
 */
let mixer = null
let plants = new THREE.Group()
gltfLoader.load('plants.gltf', (model) => {
    let flower = model.scene.children[0]
    console.log(flower);
    flower.position.y = -1

    mixer = new THREE.AnimationMixer(model.scene)
    const action = mixer.clipAction(model.animations[0])
    const animationDuration = model.animations[0].duration
    action.play()
    
    plants.add(flower)

    gsap.timeline({
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: .1,
            duration: 2.9,
            markers: true,
            onUpdate: self => {
                const progress = self.progress.toFixed(3)

                // animation part
                flower.rotation.y = Math.PI * 0.7 * progress
                plants.rotation.x = Math.PI * 0.15 * progress
                mixer.setTime( (animationDuration * 0.5) * (1.0 - progress) )
            }
        }
    })
    
    scene.add( plants )
})


/**
 * Light
 */
degubObject.topColor = 0xff0000
degubObject.insetColor = 0xffffff
degubObject.bottomColor = 0x750238
const pointLight = new THREE.PointLight(degubObject.topColor, 1, 6, 2.6)
// const pointLight = new THREE.PointLight(degubObject.topColor, 0.95, 20, 2)
pointLight.position.y = 0.7

const directionalLight = new THREE.PointLight(degubObject.insetColor, 0.01, 1, 10)
directionalLight.position.y = 0

const bottomLight = new THREE.DirectionalLight(degubObject.bottomColor, 0.9)
bottomLight.position.y = -2

// light debug
gui.addColor(degubObject, 'topColor').name('top color').onChange(() => {
    pointLight.color.set( new THREE.Color(degubObject.topColor) )
})
gui.addColor(degubObject, 'insetColor').name('inset color').onChange(() => {
    directionalLight.color.set( new THREE.Color(degubObject.insetColor) )
})
gui.addColor(degubObject, 'bottomColor').name('bottom color').onChange(() => {
    bottomLight.color.set( new THREE.Color(degubObject.bottomColor) )
})

scene.add(directionalLight, pointLight, bottomLight)


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

    // Update effect composer
    effectComposer.setSize(sizes.width, sizes.height)
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
// camera.position.x = 4
camera.position.y = 2
camera.position.z = 6
camera.lookAt(0, 0, 0)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 1.5
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Composer
 */
 let RenderTargetClass = null

 if(renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2)
 {
     RenderTargetClass = THREE.WebGLMultisampleRenderTarget
     console.log('Using WebGLMultisampleRenderTarget')
 }
 else
 {
     RenderTargetClass = THREE.WebGLRenderTarget
     console.log('Using WebGLRenderTarget')
 }
 
 const renderTarget = new RenderTargetClass(
     800,
     600,
     {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
     }
 )
// Effect composer
const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

// Render pass
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

// Antialias pass
if(renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2)
{
    const smaaPass = new SMAAPass()
    effectComposer.addPass(smaaPass)

    console.log('Using SMAA')
}

// Unreal Bloom pass
console.log(UnrealBloomPass)
const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.enabled = false
effectComposer.addPass(unrealBloomPass)

unrealBloomPass.strength = 2
unrealBloomPass.radius = 1
unrealBloomPass.threshold = 0

gui.add(unrealBloomPass, 'enabled')
gui.add(unrealBloomPass, 'strength').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001)
gui.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    // controls.update()

    // Render
    // renderer.render(scene, camera)
    effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
