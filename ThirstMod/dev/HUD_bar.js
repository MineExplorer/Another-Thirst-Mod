IMPORT("ScalesRPG");

let BitmapFactory = android.graphics.BitmapFactory;
let thirstScale = new ScalesRPG.Scale({
	right: __config__.getBool("right_bar_position"),
    bitmaps:{
        full: BitmapFactory.decodeFile(__dir__ + "gui/scale_water_0.png"), 
        half: BitmapFactory.decodeFile(__dir__ + "gui/scale_water_1.png"),
        empty: BitmapFactory.decodeFile(__dir__ + "gui/scale_water_2.png"),
    }
});

Callback.addCallback("NativeGuiChanged", function(screenName) {
    if(screenName == "hud_screen" || screenName == "in_game_play_screen"){
        thirstScale.show();
    }
});