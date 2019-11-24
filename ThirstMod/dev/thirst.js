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
