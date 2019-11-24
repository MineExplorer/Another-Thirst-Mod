let MAX_THIRST_LEVEL = 3000;
let waterLevel = 20;
let thirstLevel = 0;
disableRegeneration = false;
let onCompleteItems = [373, 322, 466];

Saver.addSavesScope("thirst",
    function read(scope){
        thirstLevel = scope.thirst || 0;
		ThirstAPI.setWaterLevel(scope.water || 20);
    },
    function save(){
        return {
            water: waterLevel,
            thirst: thirstLevel,
        }
    }
);

let drinkSound = new android.media.MediaPlayer();
drinkSound.setDataSource(__dir__+"res/sound/Drink.ogg");
drinkSound.prepare();

let ThirstAPI = {
	bar: thirstScale,
	getMaxHunger: function(){
		return disableRegeneration ? 16 : 20;
	},
	getWaterLevel: function(){
		return waterLevel;
	},
	setWaterLevel: function(level){
		waterLevel = level;
		this.bar.setValue(level);
	},
	increaseWaterLevel: function(value){
		waterLevel = Math.min(waterLevel + value, 20);
		this.bar.setValue(waterLevel);
	},
	decreaseWaterLevel: function(value){
		waterLevel = Math.max(waterLevel - value, 0);
		this.bar.setValue(waterLevel);
	},
	restoreValues: function(){
		waterLevel = 20;
		thirstLevel = 0;
		this.bar.setValue(20);
	},
	registerOnCompleteItem: function(id){
		onCompleteItems.push(id);
	},
	playDrinkSound: function(){
		if(!drinkSound.isPlaying()){
			drinkSound.seekTo(0);
			drinkSound.start();
		}
	}
}

ModAPI.registerAPI("ThirstAPI", ThirstAPI);