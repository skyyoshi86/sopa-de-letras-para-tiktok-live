let POWERUP_FONTSIZE = 20; //20 -> 35
let POWERUP_SIZE = 20;
let POWERUP_SPAWN_SECONDS = 30;
let POWERUP_SPAWN_FRAMES = POWERUP_SPAWN_SECONDS * FPS;
let POWERUP_FRAME = 0;
let powerup_types = [
	{
		name: "recovery_health",
		chances: 70,
		emoji: "🥕",
		
	},
	{
		name: "full_recovery_health",
		chances: 30,
		emoji: "🍅",
	}
];
let powerups = [];
let powerup_total_chances = 0;
for (powerup_type of powerup_types) {
	powerup_total_chances += powerup_type.chances;
}

function spawnPowerup(_powerup, x, y) {
	let random_number;
	let chosen_type;
	let current_chance = 0;
	let powerup;
	if (_powerup == undefined) {
		random_number = Math.floor(Math.random() * powerup_total_chances);
		for (powerup_type of powerup_types) {			
			if (random_number < powerup_type.chances + current_chance) {
				chosen_type = powerup_type;
				break;
			} else {
				current_chance += powerup_type.chances;
			}
		}
	} else {
		chosen_type = _powerup;
	}
	
	powerup = Object.create(chosen_type);
	
	//if (arguments.length < 2) {
	if (x == undefined) {
		powerup.x = Math.random() * canvas_w;
	} else {
		powerup.x = x;
	}
	//if (arguments.length < 3) {
	if (y == undefined) {
		powerup.y = Math.random() * canvas_h;
	} else {
		powerup.y = y;
	}

	powerups.push(powerup);
}

function updatePowerups() {
	if (++POWERUP_FRAME >= POWERUP_SPAWN_FRAMES) {
		if (survival_mode == "off") {
			spawnPowerup();
			POWERUP_FRAME = 0;
		}
	}
	for (let powerup_i in powerups) {
		let powerup = powerups[powerup_i];
		for (let ship of ships) {
			let ship_left = ship.x;
			let ship_right = ship.x + ship.size;
			let ship_top = ship.y;
			let ship_bottom = ship.y + ship.size;
			let powerup_left = powerup.x;
			let powerup_right = powerup.x + POWERUP_SIZE;
			let powerup_top = powerup.y - POWERUP_SIZE;
			let powerup_bottom = powerup.y;
			/*
			if (((ship_left > powerup_left && ship_left < powerup_right) || (ship_right > powerup_left && ship_right < powerup_right)) &&
			((ship_top > powerup_top && ship_top < powerup_bottom) || (ship_bottom > powerup_top && ship_bottom < powerup_bottom))
			)
			*/
			if (ship.isAlive) {
				if (((powerup_left > ship_left && powerup_left < ship_right) || (powerup_right > ship_left && powerup_right < ship_right)) &&
				((powerup_top > ship_top && powerup_top < ship_bottom) || (powerup_bottom > ship_top && powerup_bottom < ship_bottom))
				)
				
				{
					switch (powerup.name) {
						case "recovery_health":
						ship.hp += 20;
						break;
						case "full_recovery_health":
						ship.hp += 100;
						break;
					}
					powerups.splice(powerup_i,1);
				}

			}
			
			
		}
	}
}

function drawPowerUps() {
	for (let powerup of powerups) {
		ctx.font = POWERUP_FONTSIZE + 'px "Segoe UI Emoji"';
		ctx.fillText(powerup.emoji, powerup.x, powerup.y);
		//ctx.strokeRect(powerup.x, powerup.y-POWERUP_SIZE, POWERUP_SIZE, POWERUP_SIZE);
	}
}