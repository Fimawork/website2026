import * as THREE from 'three';

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import {CameraManager,UpdateCameraPosition,targetPosition,CameraDefaultPos, InputEvent,Camera_Inspector,ControlsTargetDefaultPos,SetDefaultCameraStatus,InstFBXLoader,InstGLTFLoader,FindMataterialByName} from 'https://cdn.jsdelivr.net/gh/Fimawork/threejs_tools/fx_functions.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let scene, camera, renderer, stats, mixer, clock;
let controls;
let threeContainer = document.getElementById("threeContainer");

const modelPosition=new THREE.Vector3(0,0,0);
const modelRotation=new THREE.Vector3(0,Math.PI, 0);
const modeScale=0.005;

let base_index=24;//預設為24吋底座
let caster_index=4;//預設為4吋移動輪

init();
animate();
EventListener();
//Camera_Inspector(camera,controls);



function init()
{
  scene = new THREE.Scene();
  //scene.background= new THREE.Color( 0xFFFFFF );
  camera = new THREE.PerspectiveCamera( 50, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000 );//非全螢幕比例設定
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( threeContainer.clientWidth, threeContainer.clientHeight );//非全螢幕比例設定

  renderer.setClearColor(0x000000, 0.0);//需加入這一條，否則看不到CSS的底圖
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.75;
  //document.body.appendChild( renderer.domElement );
  threeContainer.appendChild( renderer.domElement );


  //hdri 環境光源
   new RGBELoader()
					.setPath( 'textures/hdri/' )
					.load( 'studio_small_09_2k.hdr', function ( texture ) {

						texture.mapping = THREE.EquirectangularReflectionMapping;

						//scene.background = texture;
						scene.environment = texture;

	} );

  

  InstGLTFLoader('./models/MedicalCartAssembly.glb',modelPosition,modelRotation,modeScale,"MedicalCartModel",null, scene);
  //InstGLTFLoader('./models/BaseAssembly.glb',modelPosition,modelRotation,modeScale,"BaseModule",null, scene);

  ///場景

		const defaultScenes = [
			() => new Promise((resolve) => setTimeout(() => { BaseManager(24); resolve(); }, 100)),//底座&移動輪
      
		];

		async function SetupDefaultScene() {
			for (const task of defaultScenes) {
			  await task(); // 確保每個任務依次完成
			}
			console.log('All scenes loaded');
		  }

		SetupDefaultScene();

  
  
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
    camera.aspect = threeContainer.clientWidth/threeContainer.clientHeight;//非全螢幕比例設定
		camera.updateProjectionMatrix();
    renderer.setSize( threeContainer.clientWidth, threeContainer.clientHeight );
}

function animate() 
{
  requestAnimationFrame( animate );
  
  controls.update();
  renderer.render( scene, camera );

  UpdateCameraPosition(camera,controls);

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
        
        BaseManager(20);
        //console.log(scene.getObjectByName("24BaseModule"));

        break;

        case "ArrowDown":

        BaseManager(24);

        break;

        case "ArrowUp":
        


        break;

        case "ArrowLeft":

        

        break;

        case "ArrowRight":

        

        break;
      }
      
    });

  window.addEventListener("pointerdown", (event) => {InputEvent();});
  window.addEventListener("wheel", (event) => {InputEvent();});


}

function DefaultCamera()
{
  CameraManager(0);
}

function BaseManager(i)//底座設定功能, 變數名稱 20Base/24Base
{
  switch(i)
  {
    case 20://20吋底座

    if(scene.getObjectByName("20Base")==null)
    {
      InstGLTFLoader('./models/20Base.glb',modelPosition,modelRotation,modeScale,"20Base",null, scene);
    }

    if(scene.getObjectByName("24Base")!=null)//如果目前場景上為24吋則刪除之
    {
      scene.remove(scene.getObjectByName("24Base"));

      //刪除移動輪
      if(scene.getObjectByName("4inchCasterFor20BaseModule")!=null) 
      {
        scene.remove(scene.getObjectByName("4inchCasterFor20BaseModule"));
      }

      if(scene.getObjectByName("4inchCasterFor24BaseModule")!=null)
      {
        scene.remove(scene.getObjectByName("4inchCasterFor24BaseModule"));
      }

    }

    base_index=20;

    CasterManager(caster_index);//更新移動輪
    
    break;

    case 24://24吋底座

    if(scene.getObjectByName("24Base")==null)
    {
      InstGLTFLoader('./models/24Base.glb',modelPosition,modelRotation,modeScale,"24Base",null, scene);
    }

    if(scene.getObjectByName("20Base")!=null)//如果目前場景上為20吋則刪除之
    {
      scene.remove(scene.getObjectByName("20Base"));

      //刪除移動輪
      if(scene.getObjectByName("4inchCasterFor20BaseModule")!=null) 
      {
        scene.remove(scene.getObjectByName("4inchCasterFor20BaseModule"));
      }

      if(scene.getObjectByName("4inchCasterFor24BaseModule")!=null)
      {
        scene.remove(scene.getObjectByName("4inchCasterFor24BaseModule"));
      }
    }

    base_index=24;

    CasterManager(caster_index);//更新移動輪
    
    break;
  }
}


function CasterManager(i)//移動輪設定功能
{
  switch(i)
  {
    case 4:

    if(base_index==20&&scene.getObjectByName("4inchCasterFor20BaseModule")==null)//4吋輪for20吋底座
    {
      InstGLTFLoader('./models/4inchCasterFor20Base.glb',modelPosition,modelRotation,modeScale,"4inchCasterFor20BaseModule",null, scene);
    }

    if(base_index==24&&scene.getObjectByName("4inchCasterFor24BaseModule")==null)//4吋輪for24吋底座
    {
      InstGLTFLoader('./models/4inchCasterFor24Base.glb',modelPosition,modelRotation,modeScale,"4inchCasterFor24BaseModule",null, scene);
    }

    caster_index=4;

    break;
  }
}



///將函數掛載到全域範圍
window.DefaultCamera = DefaultCamera;

window.BaseManager = BaseManager;