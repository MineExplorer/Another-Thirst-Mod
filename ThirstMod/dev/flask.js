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