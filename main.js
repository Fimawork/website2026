import * as THREE from 'three';

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import {CameraManager,UpdateCameraPosition,targetPosition,CameraDefaultPos, InputEvent,Camera_Inspector,ControlsTargetDefaultPos,SetDefaultCameraStatus,InstFBXLoader,InstGLTFLoader,FindMataterialByName} from 'https://cdn.jsdelivr.net/gh/Fimawork/threejs_tools/fx_functions.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let scene, camera, renderer, stats, mixer, clock;
let controls;
let threeContainer = document.getElementById("threeContainer");

const modelPosition=new THREE.Vector3(0,0,0);
const modelRotation=new THREE.Vector3(0,Math.PI, 0);
const modeScale=0.005;

let instrumentMount_index=0;//預設為固定支撐版
let column_index=1520;//預設為1.5/2inch可調高度圓管
let base_index=24;//預設為24吋底座
let caster_index=4;//預設為4吋移動輪


let mousePos = { x: undefined, y: undefined };
let INTERSECTED;
//////Raycaster工具//////
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let _instrument_mount_content = document.querySelector('#instrument_mount_content');
let _column_content = document.querySelector('#column_content');
let _base_content = document.querySelector('#base_content');
let _caster_content = document.querySelector('#caster_content');
let _accessory_content = document.querySelector('#accessory_content');

///css2d renderer工具
let labelRenderer;

let labelTarget_instrumentMount=new THREE.Object3D();
let labelTarget_column=new THREE.Object3D();
let labelTarget_base=new THREE.Object3D();
let labelTarget_caster=new THREE.Object3D();
let labelTarget_accessory=new THREE.Object3D();

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

  ///for使用css2d
  labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( threeContainer.clientWidth, threeContainer.clientHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	threeContainer.appendChild( labelRenderer.domElement );


  //hdri 環境光源
   new RGBELoader()
					.setPath( 'textures/hdri/' )
					.load( 'studio_small_09_2k.hdr', function ( texture ) {

						texture.mapping = THREE.EquirectangularReflectionMapping;

						//scene.background = texture;
						scene.environment = texture;

	} );

  

  //InstGLTFLoader('./models/MedicalCartAssembly.glb',modelPosition,modelRotation,modeScale,"MedicalCartModel",null, scene);
  //InstGLTFLoader('./models/BaseAssembly.glb',modelPosition,modelRotation,modeScale,"BaseModule",null, scene);

  ///場景

		const defaultScenes = [
			() => new Promise((resolve) => setTimeout(() => { BaseManager(24); resolve(); }, 100)),//底座&移動輪
      () => new Promise((resolve) => setTimeout(() => { InstrumentMountManager(0); resolve(); }, 110)),//儀器支撐版
      () => new Promise((resolve) => setTimeout(() => { ColumnManager(1520); resolve(); }, 120)),//中柱
      

      () => new Promise((resolve) => setTimeout(() => { SetupSceneLabel(); resolve(); }, 150)),//LabelTarget
		];

		async function SetupDefaultScene() {
			for (const task of defaultScenes) {
			  await task(); // 確保每個任務依次完成
			}
			console.log('All scenes loaded');
		  }

		SetupDefaultScene();

  
  
  const CameraDefaultPos=new THREE.Vector3(-4.848,5.501,-4.925);
  const ControlsTargetDefaultPos=new THREE.Vector3(-0.131,2.274,-0.023);
  camera.position.copy(CameraDefaultPos);

  //利用座標設定旋轉中心及鏡頭焦點，camera不須另外設定初始角度
  //controls = new OrbitControls( camera, renderer.domElement );

  ///for使用css2d
  controls = new OrbitControls( camera, labelRenderer.domElement );

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

  //////EventListener//////
	window.addEventListener('pointermove', (event) => {
    mousePos = { x: event.clientX, y: event.clientY };
		onPointerMove(event);
    //console.log(INTERSECTED);
  });
}



function onWindowResize() 
{
    camera.aspect = threeContainer.clientWidth/threeContainer.clientHeight;//非全螢幕比例設定
		camera.updateProjectionMatrix();
    renderer.setSize( threeContainer.clientWidth, threeContainer.clientHeight );

    ///for使用css2d
    labelRenderer.setSize( threeContainer.clientWidth, threeContainer.clientHeight );
}

function animate() 
{
  requestAnimationFrame( animate );
  
  controls.update();
  renderer.render( scene, camera );

  ///for使用css2d
  labelRenderer.render( scene, camera );

  UpdateCameraPosition(camera,controls);

  RaycastFunction();

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
        
        InstantiateLabel(labelTarget_instrumentMount);

        console.log(labelTarget_instrumentMount);

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

function InstrumentMountManager(i)//儀器支撐板設定
{
  switch(i)
  {
    case 0:

    if(scene.getObjectByName("FixedAnglePanel")==null)//4吋輪for20吋底座
    {
      InstGLTFLoader('./models/FixedAnglePanel.glb',modelPosition,modelRotation,modeScale,"FixedAnglePanel",null, scene);
    }

    instrumentMount_index=0;

    //更新支架規格欄位
    _instrument_mount_content.textContent = "Fixed Mounting Plate";

    break;
  }
}

function ColumnManager(i)
{
  switch(i)
  {
    case 1520:

    if(scene.getObjectByName("15And20HeighAdjustableTube")==null)//4吋輪for20吋底座
    {
      InstGLTFLoader('./models/15And20Tube.glb',modelPosition,modelRotation,modeScale,"15And20HeighAdjustableTube",null, scene);
    }

    column_index=1520;

    //更新中柱規格欄位
    _column_content.textContent="Ø1-1/2 inches/Ø2 inches pole";

    break;
  }
}

function BaseManager(i)//底座設定功能, 變數名稱 20Base/24Base/4LegBase
{
  switch(i)
  {
    case 20://20吋底座

    if(scene.getObjectByName("20Base")==null)//載入20吋底座
    {
      InstGLTFLoader('./models/20Base.glb',modelPosition,modelRotation,modeScale,"20Base",null, scene);
    }

    DestroyObject(scene.getObjectByName("24Base"));
    DestroyObject(scene.getObjectByName("4LegBase"));

    //刪除移動輪
    ResetCasterModule();

    base_index=20;

    CasterManager(caster_index);//更新移動輪

    //更新底座規格欄位
    _base_content.textContent="5-Leg Base (20”)";
    
    break;

    case 24://24吋底座

    if(scene.getObjectByName("24Base")==null)
    {
      InstGLTFLoader('./models/24Base.glb',modelPosition,modelRotation,modeScale,"24Base",null, scene);
    }

    DestroyObject(scene.getObjectByName("20Base"));
    DestroyObject(scene.getObjectByName("4LegBase"));

    //刪除移動輪
    ResetCasterModule();

    base_index=24;

    CasterManager(caster_index);//更新移動輪

    //更新底座規格欄位
    _base_content.textContent="5-Leg Base (24”)";
    
    break;

    case 40://4腳底座

    if(scene.getObjectByName("4LegBase")==null)//載入4腳底座
    {
      InstGLTFLoader('./models/4LegBase.glb',modelPosition,modelRotation,modeScale,"4LegBase",null, scene);
    }

    DestroyObject(scene.getObjectByName("20Base"));
    DestroyObject(scene.getObjectByName("24Base"));

    //刪除移動輪
    ResetCasterModule();

    base_index=40;

    CasterManager(caster_index);//更新移動輪

    //更新底座規格欄位
    _base_content.textContent="4-Leg Base";
    
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

    if(base_index==40&&scene.getObjectByName("4inchCasterFor4LegBaseModule")==null)//4吋輪for24吋底座
    {
      InstGLTFLoader('./models/4inchCasterFor4LegBase.glb',modelPosition,modelRotation,modeScale,"4inchCasterFor4LegBaseModule",null, scene);
    }

    caster_index=4;

    //更新移動輪規格欄位
    _caster_content.textContent="4 Twin-wheel Caster ";

    break;
  }
}

function ResetCasterModule()
{
  DestroyObject(scene.getObjectByName("4inchCasterFor20BaseModule"));
  DestroyObject(scene.getObjectByName("4inchCasterFor24BaseModule"));
  DestroyObject(scene.getObjectByName("4inchCasterFor4LegBaseModule"));
}

function DestroyObject(target)
{
  if(target!=null)
  {
    scene.remove(target);
  }
}

//////Raycaster工具//////
function onPointerMove( event ) 
{
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
}

function RaycastFunction()
{
	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );
		
	const intersects = raycaster.intersectObjects( scene.children);
		
	if ( intersects.length > 0 ) 
	{
		if ( INTERSECTED != intersects[ 0 ].object ) 
		{
			INTERSECTED = intersects[ 0 ].object;
			
      INTERSECTED.traverseAncestors( function ( object ) {

        if (object.parent===scene) 
        //往父層回推，將INTERSECTED重新指定為在scene底下第一層的type為Object3D的物件	
        {
          INTERSECTED=object;
        }
			
      } );
		}
	} 

  
		
	else 
	{
		INTERSECTED = null;
    
	}
}

function SetupSceneLabel()//綁定預設物件
{
  InstantiateLabel(labelTarget_instrumentMount,scene.getObjectByName("FixedAnglePanel"),new THREE.Vector3(0.75,0,0),'label','1');

  InstantiateLabel(labelTarget_column,scene.getObjectByName("15And20HeighAdjustableTube"),new THREE.Vector3(0.75,0,0),'label','2');

  InstantiateLabel(labelTarget_base,scene.getObjectByName("24Base"),new THREE.Vector3(2,0,0),'label','3');

  InstantiateLabel(labelTarget_caster,scene.getObjectByName("4inchCasterFor24BaseModule"),new THREE.Vector3(-1.5,-0.5,0),'label','4');
}

function InstantiateLabel(thisLabelTarget,targetObject,offsetPosition,thisCSS,thisContent)
{
  const thisDiv = document.createElement( 'div' );
	thisDiv.className = thisCSS;
	thisDiv.textContent = thisContent;

	const sceneLabel = new CSS2DObject( thisDiv );
	sceneLabel.position.copy(offsetPosition );
	sceneLabel.center.set( 0, 1 );
	sceneLabel.layers.set( 0 );

  const box = new THREE.Box3().setFromObject(targetObject); // 創建包圍盒
  const center = new THREE.Vector3();
  box.getCenter(center); // 計算中心點

  thisLabelTarget.position.copy(center);
  scene.add(thisLabelTarget);
  thisLabelTarget.add( sceneLabel );
}




///將函數掛載到全域範圍
window.DefaultCamera = DefaultCamera;
window.BaseManager = BaseManager;