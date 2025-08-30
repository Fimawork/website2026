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

let instrumentMount_index=0;//預設為固定支撐版(目前用不到)
let column_index=1520;//預設為1.5/2inch可調高度圓管(目前用不到)

///使用來觸發底座與移動輪連動
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
let _dimension_content= document.querySelector('#dimension_content');

let _labelContainer = document.querySelector('#labelContainer');
let _ShowLabelToggle = document.querySelector('#ShowLabelToggle'); 

let isLabelOn=true;

//是否啟用鏡頭飛行模式，避免初始零件生成同時觸發飛行功能
let isCameraManagerOn=false;

let _item_01_btn = document.querySelector('#item_01_btn');
let _item_02_btn = document.querySelector('#item_02_btn');
let _item_03_btn = document.querySelector('#item_03_btn');
let _item_04_btn = document.querySelector('#item_04_btn');
let _item_05_btn = document.querySelector('#item_05_btn');
let _item_06_btn = document.querySelector('#item_06_btn');
let _item_07_btn = document.querySelector('#item_07_btn');
let _item_08_btn = document.querySelector('#item_08_btn');
let _item_09_btn = document.querySelector('#item_09_btn');
let _item_10_btn = document.querySelector('#item_10_btn');
let _item_11_btn = document.querySelector('#item_11_btn');
let _item_12_btn = document.querySelector('#item_12_btn');
let _item_13_btn = document.querySelector('#item_13_btn');
let _item_14_btn = document.querySelector('#item_14_btn');
let _item_15_btn = document.querySelector('#item_15_btn');
let _item_16_btn = document.querySelector('#item_16_btn');
let _item_17_btn = document.querySelector('#item_17_btn');
let _item_18_btn = document.querySelector('#item_18_btn');
let _item_19_btn = document.querySelector('#item_19_btn');
let _item_20_btn = document.querySelector('#item_20_btn');

let item_btn_list=[];

let accessory_01_num=0;
let accessory_02_num=0;
let accessory_03_num=0;
let accessory_04_num=0;
let accessory_05_num=0;
let accessory_06_num=0;
let accessory_07_num=0;
let accessory_08_num=0;
let accessory_09_num=0;

let current_instrument_mount=[];
let current_column=[];
let current_base=[];
let current_caster=[];
let current_accessories=[];

let cartDimension;
let cartBox;

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
				edgeThickness: 3.6,
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


  ///hdri 環境光源
   new RGBELoader()
					.setPath( 'textures/hdri/' )
					.load( 'studio_small_09_2k.hdr', function ( texture ) {

						texture.mapping = THREE.EquirectangularReflectionMapping;

						//scene.background = texture;
						scene.environment = texture;

	} );

  ///主要物件
	const defaultScenes = 
  [
		() => new Promise((resolve) => setTimeout(() => { BaseManager(24); resolve(); }, 100)),//底座&移動輪
    () => new Promise((resolve) => setTimeout(() => { InstrumentMountManager(0); resolve(); }, 110)),//儀器支撐版
    () => new Promise((resolve) => setTimeout(() => { ColumnManager(1520); resolve(); }, 120)),//中柱
      
    () => new Promise((resolve) => setTimeout(() => { SetupBtnList(); resolve(); }, 400)),//設定Item案例群組
    () => new Promise((resolve) => setTimeout(() => { SetupLabelTarget(); resolve(); }, 450)),//LabelTarget
    () => new Promise((resolve) => setTimeout(() => { isCameraManagerOn=true; resolve(); }, 500)),//啟用攝影機飛行功能      
	];

	async function SetupDefaultScene() 
  {
		for (const task of defaultScenes) 
    {
			await task(); // 確保每個任務依次完成
		}
		
    console.log('All scenes loaded');
	}

	SetupDefaultScene();


  //依初始零件位置放置SceneLabelTarget 
  const LabelTargets = 
  [
    () => new Promise((resolve) => setTimeout(() => { InstantiateLabelTarget(labelTarget_instrumentMount,scene.getObjectByName    ("FixedAnglePanel"));SetupSenceTag("label label_fadeIn_anim","EditMode",1,_labelContainer);resolve(); }, 200)),

    () => new Promise((resolve) => setTimeout(() => { InstantiateLabelTarget(labelTarget_column,scene.getObjectByName   ("15And20HeighAdjustableTube")); SetupSenceTag("label label_fadeIn_anim","EditMode",2,_labelContainer);resolve(); }, 400)),

    () => new Promise((resolve) => setTimeout(() => { InstantiateLabelTarget(labelTarget_base,scene.getObjectByName("24Base")); SetupSenceTag   ("label label_fadeIn_anim","EditMode",3,_labelContainer);resolve(); }, 600)),

    () => new Promise((resolve) => setTimeout(() => { InstantiateLabelTarget(labelTarget_caster,scene.getObjectByName   ("4inchCasterFor24BaseModule")); SetupSenceTag("label label_fadeIn_anim","EditMode",4,_labelContainer);resolve(); }, 800)),

    () => new Promise((resolve) => setTimeout(() => { UpdateSceneLabel(); resolve(); }, 1000)),//Label追蹤3D物件
  ];

  function UpdateSceneLabel()
  {
    requestAnimationFrame( UpdateSceneLabel );
    
    SceneTag(labelTarget_instrumentMount,document.querySelector('#label_1'),new THREE.Vector2(-5,-2.5),camera);  
    SceneTag(labelTarget_column,document.querySelector('#label_2'),new THREE.Vector2(2,-2.5),camera);  
    SceneTag(labelTarget_base,document.querySelector('#label_3'),new THREE.Vector2(-10,-10),camera);  
    SceneTag(labelTarget_caster,document.querySelector('#label_4'),new THREE.Vector2(10,0),camera); 
    SceneTag(labelTarget_accessory,document.querySelector('#label_5'),new THREE.Vector2(0,0),camera); 
  }

  async function SetupLabelTarget()//綁定預設物件
  {
    for (const task of LabelTargets) 
    {
    	await task(); // 確保每個任務依次完成
    }
    
    console.log('All LabelTarget loaded');
  }

  labelTarget_accessory.position.set(1.7,3,0);
  scene.add(labelTarget_accessory);

  

  const CameraDefaultPos=new THREE.Vector3(-4.848,5.501,-4.925);
  const ControlsTargetDefaultPos=new THREE.Vector3(-0.131,2.274,-0.023);
  camera.position.copy(CameraDefaultPos);
  posData[0]={ camera_pos:CameraDefaultPos, controlsTarget_pos:ControlsTargetDefaultPos};

  //儀器支架
  posData[1]={ camera_pos:new THREE.Vector3(-0.244,5.351,-0.791), controlsTarget_pos:new THREE.Vector3(0.301,3.856,1.063)};
  //中柱
  posData[2]={ camera_pos:new THREE.Vector3(-4.642,3.297,2.753), controlsTarget_pos:new THREE.Vector3(0.570,2.752,-0.238)};
  //底座
  posData[3]={ camera_pos:new THREE.Vector3(-3.681,3.052,-1.480), controlsTarget_pos:new THREE.Vector3(0.014,0.174,-0.001)};
  //移動輪
  posData[4]={ camera_pos:new THREE.Vector3(0.494,3.414,-3.141), controlsTarget_pos:new THREE.Vector3(-0.090,0.533,-0.423)};
  
  //配件(增加配件時觸發)
  posData[5]={ camera_pos:new THREE.Vector3(-8.263,6.645,-7.018), controlsTarget_pos:new THREE.Vector3(0.380,3.145,0.451)};

  ///利用座標設定旋轉中心及鏡頭焦點，camera不須另外設定初始角度
  controls = new OrbitControls( camera, renderer.domElement );
  controls.enablePan = true;//右鍵平移效果
  controls.panSpeed = 0.4;
  controls.enableDamping = true;
  controls.dampingFactor =0.05;
  controls.maxDistance = 500;
  controls.target.copy( ControlsTargetDefaultPos );
  controls.zoomSpeed=0.5;
  controls.update();

  ///postprocessing
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

  ///EventListener
  window.addEventListener( 'resize', onWindowResize );  
  window.addEventListener("pointerdown", (event) => {InputEvent();});
  window.addEventListener("wheel", (event) => {InputEvent();});
  
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
        MoveModelOFF();

        break;

        case "ArrowDown":

       //console.log(scene);

        break;

        case "ArrowUp":
        
        //EditMode(1);

        
        break;

        case "ArrowLeft":

        break;

        case "ArrowRight":

        break;
      }
      
    });
}

function DefaultCamera()
{
  CameraManager(0);
  EditMode(0);
}

function InstrumentMountManager(i)//儀器支撐板設定 
{
  current_instrument_mount=[];//移除原outline指定物件

  instrumentMount_index=i

  ResetInstrumentModule();//重置儀器支架

  let name="";

  if(isCameraManagerOn)CameraManager(1);
  
  switch(i)
  {
    case 0: //固定支撐板
    
    name="FixedAnglePanel";
    
    if(scene.getObjectByName(name)==null)//
    {
      InstGLTFLoader('./models/FixedAnglePanel.glb',modelPosition,modelRotation,modeScale,name,null, scene);
      
      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_instrument_mount.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    //更新支架規格欄位
    _instrument_mount_content.textContent = "Fixed Mounting Plate";

    break;

    case 2: //旋轉滑板支架
    
    name="AngleAdjustableWithSlidePanel";
    
    if(scene.getObjectByName(name)==null)//
    {
      InstGLTFLoader('./models/AngleAdjustableWithSlidePanel.glb',modelPosition,modelRotation,modeScale,name,null, scene);
      
      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_instrument_mount.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    //更新支架規格欄位
    _instrument_mount_content.textContent = "Angle Adjustable With Slide Mounting Plate";

    break;
  }
}

function ColumnManager(i)
{
  current_column=[];//移除原outline指定物件

  column_index=i;

  ResetColumnModule()//重置中柱

  let name="";

  if(isCameraManagerOn)CameraManager(2);

  switch(i)
  {
    case 1500:

    name="15StainlessSteelTube";

    if(scene.getObjectByName(name)==null)//1.5"&2"管
    {
      InstGLTFLoader('./models/15StainlessSteelTube.glb',modelPosition,modelRotation,modeScale,name,null, scene);

      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_column.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    //更新中柱規格欄位
    _column_content.textContent="Ø1-1/2 inches stainless steel pole";

    break;

    case 1520:

    name="15And20HeighAdjustableTube";

    if(scene.getObjectByName(name)==null)//1.5"&2"管
    {
      InstGLTFLoader('./models/15And20Tube.glb',modelPosition,modelRotation,modeScale,name,null, scene);

      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_column.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    //更新中柱規格欄位
    _column_content.textContent="Ø1-1/2 inches/Ø2 inches pole";

    break;

    case 1215:

    name="12And15HeighAdjustableTube";

    if(scene.getObjectByName(name)==null)//2吋鋁管
    {
      InstGLTFLoader('./models/12And15Tube.glb',modelPosition,modelRotation,modeScale,name,null, scene);

      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_column.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    //更新中柱規格欄位
    _column_content.textContent="Ø1-1/4 inches/Ø1.5 inches pole";

    break;
  }
}

function BaseManager(i)//底座設定功能, 變數名稱 20Base/24Base/4LegBase
{
  current_base=[];//移除原outline指定物件

  base_index=i;

  ResetBaseModule();//重置底座

  let name="";

  if(isCameraManagerOn)CameraManager(3);

  switch(i)
  {
    case 20://20吋底座

    name="20Base";

    if(scene.getObjectByName(name)==null)//載入20吋底座
    {
      InstGLTFLoader('./models/20Base.glb',modelPosition,modelRotation,modeScale,name,null, scene);

      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_base.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    CasterManager(caster_index);//更新移動輪

    //更新底座規格欄位
    _base_content.textContent="5-Leg Base (20”)";

    break;

    case 24://24吋底座

    name="24Base";

    if(scene.getObjectByName(name)==null)
    {
      InstGLTFLoader('./models/24Base.glb',modelPosition,modelRotation,modeScale,name,null, scene);

      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_base.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    CasterManager(caster_index);//更新移動輪

    //更新底座規格欄位
    _base_content.textContent="5-Leg Base (24”)";

    break;

    case 40://4腳底座

    name="4LegBase";

    if(scene.getObjectByName(name)==null)//載入4腳底座
    {
      InstGLTFLoader('./models/4LegBase.glb',modelPosition,modelRotation,modeScale,name,null, scene);

      //指定新outline指定物件，並hightlight該物件
      setTimeout(() => {current_base.push(scene.getObjectByName(name));addSelectedObject(scene.getObjectByName(name));}, 500);//1000=1sec}
    }

    CasterManager(caster_index);//更新移動輪

    //更新底座規格欄位
    _base_content.textContent="4-Leg Base";

    break;
  }
}


function CasterManager(i)//移動輪設定功能
{
  current_caster=[];//移除原outline指定物件

  ResetCasterModule();//刪除目前場景上的移動輪

  caster_index=i;

  if(isCameraManagerOn)CameraManager(4);

  switch(i)
  {
    case 3:

    let name_301="3inchCasterFor20BaseModule";
      
    if(base_index==20&&scene.getObjectByName(name_301)==null)//4吋輪for20吋底座
    {
      InstGLTFLoader('./models/3inchCasterFor20Base.glb',modelPosition,modelRotation,modeScale,name_301,null, scene);

      //指定新outline指定物件，並hightlight該物件(與底座有0.5秒時間差)
      setTimeout(() => {current_caster.push(scene.getObjectByName(name_301));addSelectedObject(scene.getObjectByName(name_301));}, 1000);//1000=1sec}
    }

    let name_302="3inchCasterFor24BaseModule";

    if(base_index==24&&scene.getObjectByName(name_302)==null)//4吋輪for24吋底座
    {
      InstGLTFLoader('./models/3inchCasterFor24Base.glb',modelPosition,modelRotation,modeScale,name_302,null, scene);

      //指定新outline指定物件，並hightlight該物件(與底座有0.5秒時間差)
      setTimeout(() => {current_caster.push(scene.getObjectByName(name_302));addSelectedObject(scene.getObjectByName(name_302));}, 1000);//1000=1sec}
    }

    let name_303="3inchCasterFor4LegBaseModule";

    if(base_index==40&&scene.getObjectByName(name_303)==null)//4吋輪for24吋底座
    {
      InstGLTFLoader('./models/3inchCasterFor4LegBase.glb',modelPosition,modelRotation,modeScale,name_303,null, scene);

      //指定新outline指定物件，並hightlight該物件(與底座有0.5秒時間差)
      setTimeout(() => {current_caster.push(scene.getObjectByName(name_303));addSelectedObject(scene.getObjectByName(name_303));}, 1000);//1000=1sec}

    }

    

    //更新移動輪規格欄位
    _caster_content.textContent="3 Twin-wheel Caster ";

    break;

    case 4:

    let name_401="4inchCasterFor20BaseModule";
      
    if(base_index==20&&scene.getObjectByName(name_401)==null)//4吋輪for20吋底座
    {
      InstGLTFLoader('./models/4inchCasterFor20Base.glb',modelPosition,modelRotation,modeScale,name_401,null, scene);

      //指定新outline指定物件，並hightlight該物件(與底座有0.5秒時間差)
      setTimeout(() => {current_caster.push(scene.getObjectByName(name_401));addSelectedObject(scene.getObjectByName(name_401));}, 1000);//1000=1sec}
    }

    let name_402="4inchCasterFor24BaseModule";

    if(base_index==24&&scene.getObjectByName(name_402)==null)//4吋輪for24吋底座
    {
      InstGLTFLoader('./models/4inchCasterFor24Base.glb',modelPosition,modelRotation,modeScale,name_402,null, scene);

      //指定新outline指定物件，並hightlight該物件(與底座有0.5秒時間差)
      setTimeout(() => {current_caster.push(scene.getObjectByName(name_402));addSelectedObject(scene.getObjectByName(name_402));}, 1000);//1000=1sec}
    }

    let name_403="4inchCasterFor4LegBaseModule";

    if(base_index==40&&scene.getObjectByName(name_403)==null)//4吋輪for24吋底座
    {
      InstGLTFLoader('./models/4inchCasterFor4LegBase.glb',modelPosition,modelRotation,modeScale,name_403,null, scene);

      //指定新outline指定物件，並hightlight該物件(與底座有0.5秒時間差)
      setTimeout(() => {current_caster.push(scene.getObjectByName(name_403));addSelectedObject(scene.getObjectByName(name_403));}, 1000);//1000=1sec}
    }

    //更新移動輪規格欄位
    _caster_content.textContent="4 Twin-wheel Caster ";

    break;
  }
}

function AccessoryManager(i)
{
  let multiple_item_hight=3;

  MoveModelOFF();

  switch(i)
  {
    case 1://管籃
    accessory_01_num++;
    
    let accessory_01_name="accessory_01_"+`${accessory_01_num}`;

    InstGLTFLoader('./models/accessory_01.glb',modelPosition,modelRotation,modeScale,accessory_01_name,null, scene);

    //指定新outline指定物件，並hightlight該物件
    setTimeout(() => {current_accessories.push(scene.getObjectByName(accessory_01_name));addSelectedObject(scene.getObjectByName(accessory_01_name));}, 500);//1000=1sec}

    //啟用模型移動功能
    setTimeout(() => {current_INTERSECTED=scene.getObjectByName(accessory_01_name);}, 600);//1000=1sec}

    if(accessory_01_num==1)//第一件為場景預設視角
    {
      CameraManager(0);
    }
    
    if(accessory_01_num>1)//第二件以上零件放置在推車上方，鏡頭拉遠
    {
      setTimeout(() => {scene.getObjectByName(accessory_01_name).position.set(0,multiple_item_hight,0);}, 500);
      CameraManager(5);
    }
    
    break;
  }
}

function ResetInstrumentModule()//重置儀器支架
{
  DestroyObject(scene.getObjectByName("AngleAdjustableWithSlidePanel"));
  DestroyObject(scene.getObjectByName("FixedAnglePanel"));
}

function ResetColumnModule()//重置中柱
{
  DestroyObject(scene.getObjectByName("15And20HeighAdjustableTube"));
  DestroyObject(scene.getObjectByName("12And15HeighAdjustableTube"));
  DestroyObject(scene.getObjectByName("15StainlessSteelTube"));
}

function ResetBaseModule()//重置底座
{
  DestroyObject(scene.getObjectByName("24Base"));
  DestroyObject(scene.getObjectByName("20Base"));
  DestroyObject(scene.getObjectByName("4LegBase"));
}

function ResetCasterModule()//重置移動輪
{
  DestroyObject(scene.getObjectByName("3inchCasterFor20BaseModule"));
  DestroyObject(scene.getObjectByName("3inchCasterFor24BaseModule"));
  DestroyObject(scene.getObjectByName("3inchCasterFor4LegBaseModule"));
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
          
          //if(current_INTERSECTED!=INTERSECTED)
          //{
          //  current_INTERSECTED=INTERSECTED;
          //  console.log(current_INTERSECTED);
          //}
          
        }
			
      } );
		}
	} 

	else 
	{
		INTERSECTED = null;

    //if(current_INTERSECTED!=INTERSECTED)
    //{
    //  current_INTERSECTED=INTERSECTED;
    //  //console.log(current_INTERSECTED);
    //}
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

function SetupSenceTag(ccsStyle,thisEvent,index,thisSceneTagHolder)
{
  let thisSceneTag = document.createElement("div");
	thisSceneTag.setAttribute("id", `label_${index}`);
	thisSceneTag.setAttribute("class", ccsStyle);
  thisSceneTag.textContent=`${index}`;
	thisSceneTag.setAttribute("onclick", thisEvent+`(${index})`);
  
	thisSceneTagHolder.append(thisSceneTag);
}

function EditMode(i) //編輯模式 0:default , 1:儀器支架 2:中柱 3:底座 4:移動輪 5:配件
{
  
  switch(i)
  {
    case 0:

    CameraManager(0);

    FilterItems(0);
    

    break;

    case 1:

    CameraManager(1);

    for(let i=0;i<current_instrument_mount.length;i++)
    {
      addSelectedObject(current_instrument_mount[i]);
    }

    FilterItems(1);
    
    break;

    case 2:

    CameraManager(2);

    for(let i=0;i<current_column.length;i++)
    {
      addSelectedObject(current_column[i]);
    }

    FilterItems(2);
    
    break;

    case 3:

    CameraManager(3);

    for(let i=0;i<current_base.length;i++)
    {
      addSelectedObject(current_base[i]);
    }

    FilterItems(3);
    
    break;

    case 4:

    CameraManager(4);

    for(let i=0;i<current_caster.length;i++)
    {
      addSelectedObject(current_caster[i]);
    }

    FilterItems(4);

    break;

    case 5:


    FilterItems(5);

    break;
  }
  
}

///Outline效果&重置尺寸
function addSelectedObject( object ) 
{
	selectedObjects = [];
	selectedObjects.push( object );

  setTimeout(() => {outlinePass.selectedObjects = selectedObjects;}, 100);//1000=1sec}//oultine效果開始
  setTimeout(() => {outlinePass.selectedObjects = [];}, 1500);//1000=1sec}//oultine效果結束

  //量測推車尺寸
  setTimeout(() => {MeasureCartDimension();}, 1600);//1000=1sec}
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

function ShowSceneLabelToggle()
{
  if(!isLabelOn)
  {
    _labelContainer.style.display="block";
    _ShowLabelToggle.style.cssText = "color: #6bb4f7;";
    isLabelOn=true;
  }

  else
  {
    _labelContainer.style.display="none";
    _ShowLabelToggle.style.cssText = "color: rgba(0, 0, 0, 0.45);";
    isLabelOn=false;
  }
}

function SetupBtnList()
{
  item_btn_list.push(_item_01_btn);//Fixed Angle Panel
  item_btn_list.push(_item_02_btn);//Fixed Angle with Slide Panel
  item_btn_list.push(_item_03_btn);//Angle Adjustable with Slide Panel
  item_btn_list.push(_item_04_btn);//1.5"/2" Height Adjustable Tube
  item_btn_list.push(_item_05_btn);//1.25"/1.5" Height Adjustable Tube
  item_btn_list.push(_item_06_btn);//1.5" Stainless Steel Tube
  item_btn_list.push(_item_07_btn);//20" Base
  item_btn_list.push(_item_08_btn);//24" Base
  item_btn_list.push(_item_09_btn);//4 Leg Base
  item_btn_list.push(_item_10_btn);//4" Medical Caster
  item_btn_list.push(_item_11_btn);//4" Twin-Caster
  item_btn_list.push(_item_12_btn);//3" Twin-Caster
  item_btn_list.push(_item_13_btn);//Basket
  item_btn_list.push(_item_14_btn);//Adapter Holder
  item_btn_list.push(_item_15_btn);//Barcode Scanner Holder
  item_btn_list.push(_item_16_btn);//Cable Management Holder
  item_btn_list.push(_item_17_btn);//Tray
  item_btn_list.push(_item_18_btn);//Handle
  item_btn_list.push(_item_19_btn);//Drawer
  item_btn_list.push(_item_20_btn);//Printer Holder
}

function FilterItems(type_index) //編輯模式 0:default , 1:儀器支架 2:中柱 3:底座 4:移動輪 5:配件
{
  switch(type_index)
  {
    case 0:

    for(let i=0;i<item_btn_list.length;i++)
    {
      item_btn_list[i].style.display="block";
    }

    break;

    case 1:

    for(let i=0;i<item_btn_list.length;i++)
    {
      if(i<=2)
      {
        item_btn_list[i].style.display="block";
      }

      else
      {
        item_btn_list[i].style.display="none";
      }
    }

    break;

    case 2:

    for(let i=0;i<item_btn_list.length;i++)
    {
      if(i<=2)
      {
        item_btn_list[i].style.display="none";
      }

      else if(i<=5)
      {
        item_btn_list[i].style.display="block";
      }

      else
      {
        item_btn_list[i].style.display="none";
      }
    }

    break;

    case 3:

    for(let i=0;i<item_btn_list.length;i++)
    {
      if(i<=5)
      {
        item_btn_list[i].style.display="none";
      }

      else if(i<=8)
      {
        item_btn_list[i].style.display="block";
      }

      else
      {
        item_btn_list[i].style.display="none";
      }
    }

    break;

    case 4:

    for(let i=0;i<item_btn_list.length;i++)
    {
      if(i<=8)
      {
        item_btn_list[i].style.display="none";
      }

      else if(i<=11)
      {
        item_btn_list[i].style.display="block";
      }

      else
      {
        item_btn_list[i].style.display="none";
      }
    }

    break;

    case 5:

    for(let i=0;i<item_btn_list.length;i++)
    {
      if(i<=11)
      {
        item_btn_list[i].style.display="none";
      }

      else
      {
        item_btn_list[i].style.display="block";
      }
    }

    break;
  }
   
}


function MeasureCartDimension()
{
  cartBox= new THREE.Box3().setFromObject(scene);
  cartDimension= new THREE.Vector3();
  cartBox.getSize(cartDimension);
  
  //console.log(cartDimension);

  //4.986644500000001-->996.5(高度對照)

  const scale=996.5/4.9866445;
   _dimension_content.textContent=`W ${Math.round(cartDimension.x*scale)}mm x D ${Math.round(cartDimension.z*scale)}mm x H ${Math.round(cartDimension.y*scale)}mm`;

}

function MoveModel(action)
{
  if(current_INTERSECTED!=null)
  {
    if(action==="UP")
    {
      current_INTERSECTED.position.y+=0.5;
    }

    if(action==="DOWN")
    {
      current_INTERSECTED.position.y-=0.5;
    }

    if(action==="RIGHT")
    {
      current_INTERSECTED.rotation.y+=Math.PI*0.5;
    }

    if(action==="LEFT")
    {
      current_INTERSECTED.rotation.y-=Math.PI*0.5;
    }
  }
}

function MoveModelOFF()
{
  current_INTERSECTED=null;
}



///將函數掛載到全域範圍
window.DefaultCamera = DefaultCamera;
window.InstrumentMountManager=InstrumentMountManager;
window.ColumnManager=ColumnManager;
window.BaseManager = BaseManager;
window.CasterManager=CasterManager;
window.EditMode = EditMode;
window.ShowSceneLabelToggle=ShowSceneLabelToggle;
window.AccessoryManager=AccessoryManager;
window.MoveModel=MoveModel;
window.MoveModelOFF=MoveModelOFF;