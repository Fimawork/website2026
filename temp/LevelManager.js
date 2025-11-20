let targetPosition;

let scroll=0;

let present_scroll=0;

let position_ratio=0;

let car_flip;

function updateScrollValue(value)
{
    delta_value=(value-present_scroll)/window.innerHeight;//正，往下滑;負 往上滑

    position_ratio=value/window.innerHeight;//桌機 3;手機 2.7
          
     //console.log(position_ratio);       
    if(delta_value>0)
    {
        if(!car_flip&&position_ratio>0.5)
        {
            callCarSceneFunction(0);
            car_flip=true;
        }

    }

   if(delta_value<0)
   {
        if(car_flip&&position_ratio<1.8)
        {
            callCarSceneFunction(1);
            car_flip=false;
        }
   }
 
}


function callCarSceneFunction(i) 
{
    var _work_01 = document.getElementById("work_01");
    _work_01.contentWindow.CameraAnim(i);
}








