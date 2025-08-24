import * as THREE from 'three';

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import {CameraManager,UpdateCameraPosition,CameraDefaultPos, InputEvent,Camera_Inspector,ControlsTargetDefaultPos,SetDefaultCameraStatus,InstFBXLoader,InstGLTFLoader,FindMataterialByName,posData} from 'https://cdn.jsdelivr.net/gh/Fimawork/threejs_tools/fx_functions.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

//Outline
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

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
let current_INTERSECTED,INTERSECTED;
//////Raycaster工具//////
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let _instrument_mount_content = document.querySelector('#instrument_mount_content');
let _column_content = document.querySelector('#column_content');
let _base_content = document.querySelector('#base_content');
let _caster_content = document.querySelector('#caster_content');
let _accessory_content = document.querySelector('#accessory_content');

let labelTarget_instrumentMount=new THREE.Object3D();
let labelTarget_column=new THREE.Object3D();
let labelTarget_base=new THREE.Object3D();
let labelTarget_caster=new THREE.Object3D();
let labelTarget_accessory=new THREE.Object3D();

let targetPosition=null;

//outline
let selectedObjects = [];
let composer, effectFXAA, outlinePass;
const scale=2.5;//提高渲染解析度渲染後縮小顯示

const params = {
				edgeStrength: 3.0,
				edgeGlow: 1.5,
				edgeThickness: 3.0,
				pulsePeriod: 0,
				color:'#6bb4f7'
			};

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
  //renderer.setSize( threeContainer.clientWidth, threeContainer.clientHeight );//非全螢幕比例設定

  //提高渲染解析度渲染後縮小顯示
  renderer.setSize(threeContainer.clientWidth * scale, threeContainer.clientHeight * scale, false);

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

  

  //InstGLTFLoader('./models/MedicalCartAssembly.glb',modelPosition,modelRotation,modeScale,"MedicalCartModel",null, scene);
  //InstGLTFLoader('./models/BaseAssembly.glb',modelPosition,modelRotation,modeScale,"BaseModule",null, scene);

  ///場景

		const defaultScenes = [
			() => new Promise((resolve) => setTimeout(() => { BaseManager(24); resolve(); }, 100)),//底座&移動輪
      () => new Promise((resolve) => setTimeout(() => { InstrumentMountManager(0); resolve(); }, 110)),//儀器支撐版
      () => new Promise((resolve) => setTimeout(() => { ColumnManager(1520); resolve(); }, 120)),//中柱
      

      () => new Promise((resolve) => setTimeout(() => { SetupLabelTarget(); resolve(); }, 150)),//LabelTarget
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
  posData[0]={ camera_pos:CameraDefaultPos, controlsTarget_pos:ControlsTargetDefaultPos};

  ///儀器支架
  posData[1]={ camera_pos:new THREE.Vector3(-0.468,5.010,-0.887), controlsTarget_pos:new THREE.Vector3(1.004,3.972,1.311)};
  ///中柱
  posData[2]={ camera_pos:new THREE.Vector3(-4.642,3.297,2.753), controlsTarget_pos:new THREE.Vector3(0.570,2.752,-0.238)};
  ///底座
  posData[3]={ camera_pos:new THREE.Vector3(-3.535,2.968,-2.012), controlsTarget_pos:new THREE.Vector3(0.157,0.085,-0.524)};
  ///移動輪
  posData[4]={ camera_pos:new THREE.Vector3(-0.260,3.485,-3.173), controlsTarget_pos:new THREE.Vector3(0.359,0.400,-0.697)};

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

  // postprocessing

	composer = new EffectComposer( renderer );

	const renderPass = new RenderPass( scene, camera );
  renderPass.clearAlpha=0;
	composer.addPass( renderPass );

	outlinePass = new OutlinePass( new THREE.Vector2( threeContainer.clientWidth, threeContainer.clientHeight ), scene, camera );
	composer.addPass( outlinePass );

	const outputPass = new OutputPass();
	composer.addPass( outputPass );

	effectFXAA = new ShaderPass( FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / threeContainer.clientWidth, 1 / threeContainer.clientHeight );
	composer.addPass( effectFXAA );

  outlinePass.edgeStrength = params.edgeStrength;
  outlinePass.edgeGlow= params.edgeGlow;
	outlinePass.edgeThickness= params.edgeThickness;
  outlinePass.visibleEdgeColor.set(params.color);
  

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
    renderer.setSize( threeContainer.clientWidth* scale, threeContainer.clientHeight* scale, false );

    composer.setSize( threeContainer.clientWidth* scale, threeContainer.clientHeight* scale, false );

		effectFXAA.uniforms[ 'resolution' ].value.set( 1 / threeContainer.clientWidth, 1 / threeContainer.clientHeight );
}

function animate() 
{
  requestAnimationFrame( animate );
  
  controls.update();
  //renderer.render( scene, camera );
  composer.render();//使用postprocessing替代

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
        
        EditMode(0);

        break;

        case "ArrowDown":

        EditMode(2);

        break;

        case "ArrowUp":
        
        EditMode(1);

        break;

        case "ArrowLeft":

        EditMode(3);

        break;

        case "ArrowRight":

        EditMode(4);

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
          
          if(current_INTERSECTED!=INTERSECTED)
          {
            current_INTERSECTED=INTERSECTED;
            //console.log(current_INTERSECTED);
          }
          
        }
			
      } );
		}
	} 

	else 
	{
		INTERSECTED = null;
	}
}

function SetupLabelTarget()//綁定預設物件
{
  
  InstantiateLabelTarget(labelTarget_instrumentMount,scene.getObjectByName("FixedAnglePanel"));

  InstantiateLabelTarget(labelTarget_column,scene.getObjectByName("15And20HeighAdjustableTube"));

  InstantiateLabelTarget(labelTarget_base,scene.getObjectByName("24Base"));

  InstantiateLabelTarget(labelTarget_caster,scene.getObjectByName("4inchCasterFor24BaseModule"));

  UpdateSceneLabel();

  function UpdateSceneLabel()
  {
    requestAnimationFrame( UpdateSceneLabel );
    SceneTag(labelTarget_instrumentMount,document.querySelector('#label_01'),new THREE.Vector2(-5,-2.5),camera);  
    SceneTag(labelTarget_column,document.querySelector('#label_02'),new THREE.Vector2(2,-2.5),camera);  
    SceneTag(labelTarget_base,document.querySelector('#label_03'),new THREE.Vector2(-2.5,-5),camera);  
    SceneTag(labelTarget_caster,document.querySelector('#label_04'),new THREE.Vector2(10,5),camera);  
  }

}



function InstantiateLabelTarget(thisLabelTarget,targetObject)
{

  const box = new THREE.Box3().setFromObject(targetObject); // 創建包圍盒
  const center = new THREE.Vector3();
  box.getCenter(center); // 計算中心點

  thisLabelTarget.position.copy(center);
  scene.add(thisLabelTarget);
}

function EditMode(i) //編輯模式 0:default , 1:儀器支架 2:中柱 3:底座 4:移動輪
{
  
  switch(i)
  {
    case 0:

    CameraManager(0);

    console.log("YES");

    

    break;

    case 1:

    CameraManager(1);
    console.log("YES");
    addSelectedObject(scene.getObjectByName("FixedAnglePanel") );
		
    break;

    case 2:

    CameraManager(2);
    console.log("YES");
    
    break;

    case 3:

    CameraManager(3);
    console.log("YES");
    
    break;

    case 4:

    CameraManager(4);
    console.log("YES");

    break;
  }
  
}

function addSelectedObject( object ) 
{
	selectedObjects = [];
	selectedObjects.push( object );

  setTimeout(() => {outlinePass.selectedObjects = selectedObjects;}, 100);//1000=1sec}
  setTimeout(() => {outlinePass.selectedObjects = [];}, 1000);//1000=1sec}
}

function SceneTag(target,lable,offset,targetCam)  
{
  try 
  {
    var width = threeContainer.clientWidth, height = threeContainer.clientHeight;
      var widthHalf = width / 2, heightHalf = height / 2;
    const worldPosition = new THREE.Vector3();
    target.getWorldPosition(worldPosition);
    var pos_3D = worldPosition.clone()
      //var pos_3D = _target.position.clone();///object.position 取得的是相對座標（即該物體相對於其父物體的座標），而不是世界座標。

      pos_3D.project(targetCam);
      pos_3D.x = ( pos_3D.x * widthHalf ) + widthHalf;
      pos_3D.y = - ( pos_3D.y * heightHalf ) + heightHalf;

    lable.style.cssText = `position:absolute;top:${pos_3D.y/height*100+offset.y}%;left:${pos_3D.x/width*100+offset.x}%;`;
  }

  catch (error) 
  {
    console.log(`Error Setting Camera Default Property.${error}`);
  }
}

///將函數掛載到全域範圍
window.DefaultCamera = DefaultCamera;
window.BaseManager = BaseManager;
window.EditMode = EditMode;