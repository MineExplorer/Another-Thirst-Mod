/*
BUILD INFO:
  dir: dev
  target: main.js
  files: 4
*/



// file: HUD_bar.js

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




// file: API&data.js

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




// file: thirst.js

IMPORT("EntityState");

let HOT_BIOMES = [2, 35, 36, 37, 38, 39, 135, 164, 165, 166, 167];
let isDestroyingBlock = false;
let isInTheSun = false;
Callback.addCallback("tick", function(){
	// if player is alive
	if(Entity.getHealth(Player.get()) <= 0) return;
	// check temperature
	if(World.getThreadTime()%20 == 0){
		let pos = Player.getPosition();
		let biome = World.getBiome(pos.x, pos.y, pos.z);
		let time = World.getWorldTime()%24000;
		if(biome == 8 || 
		  HOT_BIOMES.indexOf() != -1 && time <= 12000 && World.getLightLevel(pos.x, pos.y, pos.z) == 15){
			isInTheSun = true;
		} else {
			isInTheSun = false;
		}
	}
	thirstLevel += isInTheSun? 2 : 1;
	// check block destroying
	if(isDestroyingBlock){
		thirstLevel++;
		isDestroyingBlock = false;
	}
	// check player moving
	let state = EntityState.getPlayerState();
    if(state.checkFlags(EntityState.RUNNING) || state.checkFlags(EntityState.JUMPING)){
        thirstLevel++;
	} else if(state.checkFlags(EntityState.WALKING) || state.checkFlags(EntityState.SWIMMING) || state.checkFlags(EntityState.FLOATING)){
        thirstLevel += 0.5;
	}
	// decrease water level
	if(thirstLevel >= MAX_THIRST_LEVEL){
		thirstLevel -= MAX_THIRST_LEVEL;
		ThirstAPI.decreaseWaterLevel(1);
	}
	// dehydration effects
	disableRegeneration = waterLevel <= 10;
	if(disableRegeneration){
		let hunger = Player.getHunger();
		if(hunger > 16){
			Player.setHunger(16);
			Player.setSaturation(Player.getSaturation() + hunger - 16);
		}
	}
	if(waterLevel <= 6){
		Entity.addEffect(Player.get(), MobEffect.movementSlowdown, 2 - Math.ceil(waterLevel/3), 5);
	}
	if(waterLevel <= 3){
		Entity.addEffect(Player.get(), MobEffect.weakness, 1, 5);
	}
	if(waterLevel <= 0){
		Entity.addEffect(Player.get(), MobEffect.blindness, 0, 25);
		if(World.getThreadTime()%100 == 0){
			Entity.damageEntity(Player.get(), 1);
		}
	}
	// debug
	/*if(World.getThreadTime()%10 == 0)
	Game.tipMessage(thirstLevel);*/
});

Callback.addCallback("EntityDeath", function(entity){
	if(entity == Player.get()){
		ThirstAPI.restoreValues();
	}
});

Callback.addCallback("DestroyBlockContinue", function(coords, block, progress, player){
	isDestroyingBlock = true;
});

Callback.addCallback("ItemUse", function(coords, item, block){
	let c = coords.relative;
	block = World.getBlock(c.x, c.y, c.z)
	if(waterLevel < 20 && item.id == 0 && (block.id == 8 || block.id == 9) && block.data == 0){
		ThirstAPI.increaseWaterLevel(2);
		ThirstAPI.playDrinkSound();
	}
});

Callback.addCallback("ItemUsingComplete", function(item){
	if(Player.getHunger() >= ThirstAPI.getMaxHunger() && onCompleteItems.indexOf(item.id) == -1){
		Game.prevent();
	}
	if(item.id == 373 && item.data == 0){
		ThirstAPI.increaseWaterLevel(5);
	}
});




// file: flask.js

Translation.addTranslation("Flask", {ru: "Фляга"});

IDRegistry.genItemID("flask");
Item.createItem("flask", "Flask", {name: "flask", meta: 0});
Item.setMaxDamage(ItemID.flask, 20);
Item.setLiquidClip(ItemID.flask, true);

Recipes.addShaped({id: ItemID.flask, count: 1, data: 20}, [
	" s ",
	"vlv",
	" v "
], ['v', 265, 0, 'l', 334, 0, 's', 287, 0]);

Item.registerUseFunction("flask", function(coords, item, block){
	if(block.id == 8 || block.id == 9){
		Player.setCarriedItem(item.id, 1, 0);
	}
});

Item.registerNoTargetUseFunction("flask", function(item){
	if(waterLevel < 20){
		let add = Math.min(20 - waterLevel, 20 - item.data);
		ThirstAPI.setWaterLevel(waterLevel + add);
		Player.setCarriedItem(item.id, 1, item.data + add);
		ThirstAPI.playDrinkSound();
	}
});




