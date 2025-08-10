import * as THREE from 'three';

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import {CameraManager,targetPosition,CameraDefaultPos, Camera_Inspector,ControlsTargetDefaultPos,SetDefaultCameraStatus,InstFBXLoader,InstGLTFLoader,FindMataterialByName} from 'https://cdn.jsdelivr.net/gh/Fimawork/threejs_tools/fx_functions.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let scene, camera, renderer, stats, mixer, clock;
let controls;

init();
animate();
EventListener();
Camera_Inspector(camera,controls);

function init()
{
  scene = new THREE.Scene();
  scene.background= new THREE.Color( 0xFFFFFF );
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1;
  document.body.appendChild( renderer.domElement );


  //hdri 環境光源
   new RGBELoader()
					.setPath( 'textures/hdri/' )
					.load( 'studio_small_09_2k.hdr', function ( texture ) {

						texture.mapping = THREE.EquirectangularReflectionMapping;

						//scene.background = texture;
						scene.environment = texture;

	} );


  InstGLTFLoader('./models/MedicalCartAssembly.glb',new THREE.Vector3(0,0,0),new THREE.Vector3(0,Math.PI, 0),0.005,"MedicalCartModel",null, scene);
  
  const CameraDefaultPos=new THREE.Vector3(0,5,-12);
  const ControlsTargetDefaultPos=new THREE.Vector3(0,2.5,0);
  camera.position.copy(CameraDefaultPos);

  //利用座標設定旋轉中心及鏡頭焦點，camera不須另外設定初始角度
  controls = new OrbitControls( camera, renderer.domElement );
  controls.enablePan = true;//右鍵平移效果
  controls.panSpeed = 0.4;
  controls.enableDamping = true;
  controls.dampingFactor =0.05;
  controls.maxDistance = 500;
  controls.target.copy( ControlsTargetDefaultPos );
  controls.zoomSpeed=0.5;
  controls.update();

  ///紀錄相機的初始位置
	SetDefaultCameraStatus(CameraDefaultPos,ControlsTargetDefaultPos);

  window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() 
{
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() 
{
  requestAnimationFrame( animate );
  
  controls.update();
  renderer.render( scene, camera );

}

function EventListener()
  {
      window.addEventListener("keydown",function (event) {

      switch (event.code) 
      {

        case "Space":
        

        //const box = new THREE.Box3().setFromObject(scene.getObjectByName("target_02")); // 創建包圍盒
        //const center = new THREE.Vector3();
        //box.getCenter(center); // 計算中心點，此為相對座標
//
        //console.log(center);
        
        //console.log(sandTextureAluminum.clearcoatNormalScale);

        break;

        case "ArrowDown":

        console.log(scene.getObjectByName("test"));

        

        break;

        case "ArrowUp":
        


        break;

        case "ArrowLeft":

        

        break;

        case "ArrowRight":

        

        break;
      }
      
    });


  }