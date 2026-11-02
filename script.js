let websocket = null;
let roomInfo;
//let parsedData;
let INITIAL_HP = 100;
let FPS = .2; //15

let players = [];
let mvps = [];
let first_to_score = [];
let mvp_id = undefined;
let mvp_score = 0;

let canvasEl, ctx;
let canvas_w, canvas_h;

let player_w = 60; //60 -> 120
let player_h = 60;
let font_size = 20;
let MAX_INACTIVITY_SECONDS = 99;
let MAX_INACTIVITY_FRAMES = FPS * MAX_INACTIVITY_SECONDS;
let MAX_INACTIVITY_SECONDS_BOT = 9;
let MAX_INACTIVITY_FRAMES_BOT = FPS * MAX_INACTIVITY_SECONDS_BOT;
let MAX_SCORER_HIGHLIGHT_SECONDS = 5;
let MAX_SCORER_HIGHLIGHT_FRAMES = FPS * MAX_SCORER_HIGHLIGHT_SECONDS;
let scorer_color = "#0F0";
let PLAY_COLOR = "rgba(0, 94, 0, 1)";
let PAUSE_COLOR = "rgba(83, 83, 0, 1)";
let highest_round_score = 0;
//let highest_score = 0;
let background_color = "#333";

let order_type = "score";

let cheat_ships = []
let cheat_ship_ids = [1,2];
let cheat_ship_nicknames = ["HACKER 1", "HACKER 2"];
let cheat_ship_comments = ["Soy hacker", "Soy hacker"];
let cheat_ship, cheat_ship_id;
let backgroundEl = document.createElement("img");
backgroundEl.src = "milky-way.jpg";
let chatEl, barEl;
let play_pause_el;
let chat_is_paused = true;
let mensajes_pendientes = 0;
let next_comment_index = 1;



let global_parsedData;
let room_user_parsedData;

// Definición de las 8 direcciones posibles (dr = cambio en fila, dc = cambio en columna)
const DIRECTIONS = [
    { dr: 0,  dc: 1  }, // 0: Derecha (Original)
    { dr: 1,  dc: 0  }, // 1: Abajo (Original)
    { dr: 0,  dc: -1 }, // 2: Izquierda
    { dr: -1, dc: 0  }, // 3: Arriba
    { dr: 1,  dc: 1  }, // 4: Diagonal Abajo-Derecha
    { dr: -1, dc: 1  }, // 5: Diagonal Arriba-Derecha
    { dr: 1,  dc: -1 }, // 6: Diagonal Abajo-Izquierda
    { dr: -1, dc: -1 }  // 7: Diagonal Arriba-Izquierda
];


// --- CONFIGURACIÓN SOPA DE LETRAS ---
// --- CONFIGURACIÓN SOPA DE LETRAS ---
//15×20
let GRID_COLS = 15; // Ancho (columnas). Máximo recomendado: 26 (letras del abecedario)
let GRID_ROWS = 20; // Alto (filas) //20
// Generar las letras automáticamente según el ancho
let LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".substring(0, GRID_COLS);
// Lista de palabras a buscar (puedes cambiarlas aquí)
let searchWords = []; // Se llenará desde el menú
let gridData = []; // Matriz interna del juego
let foundWords = []; // Rastreo de palabras encontradas
let wordLocations = []; // Guarda dónde empieza cada palabra: {word: "HOLA", r: 0, c: 0, found: false}

let occupiedCells = {}; // Mapa para rastrear ocupación: "fila-columna" -> userId



window.addEventListener("keydown", function(event) {
	//console.log("event.code = " + event.code);
	console.log(event);
/*

if (event.key != "Shift" && event.key != "Control" && event.key != "Alt" && event.key != "Meta" && event.key != "F12") {
	/*
	cheat_ship_ids.forEach(function(cheat_ship_id, i) {
		cheat_ship = getShip(cheat_ship_id);
		cheat_ships[i] = cheat_ship;
		
		if (cheat_ship != undefined) {
			
			cheat_ship.v = 5;
			
			cheat_ship.v = 5;
			cheat_ship.nickname = cheat_ship_nicknames[i];
			cheat_ship.last_comment = cheat_ship_comments[i];
			cheat_ship.lastDiamondCount = 0;
			cheat_ship.repeatEnd = false;
		}
	});

}
/*
*/
	switch (event.code) {
		case "KeyH":

		break;

	}
});

//Uno dos tres probando
//


function connect() {
    if (websocket) return; // Already connected

    websocket = new WebSocket("ws://localhost:21213/");
	
    websocket.onopen = function () {
        document.getElementById("status").innerHTML = "Connected";
    }

    websocket.onclose = function () {
        document.getElementById("status").innerHTML = "Disconnected";
        websocket = null;
        setTimeout(connect, 1000); // Schedule a reconnect attempt
    }

    websocket.onerror = function () {
        document.getElementById("status").innerHTML = "Connection Failed";
        websocket = null;
        setTimeout(connect, 1000); // Schedule a reconnect attempt
    }

    websocket.onmessage = function (event) {
        let parsedData = JSON.parse(event.data); // Parse the JSON data
		global_parsedData = parsedData;
		
		let userId;
		


		switch (parsedData.event) {

			case "roomUser":
				room_user_parsedData = parsedData;
				roomUserEvent(parsedData);
				sort();
				mostrar();
			break;
			case "member":
				//resetLastActivity(parsedData.data.userId);
				let user = parsedData.data;
				user.is_in_list = true;
				createPlayer(user);
			break;
			
			case "like":
				likeEvent(parsedData);

			break;
			case "chat":
				let user_id = parsedData.data.userId;
				let comment = parsedData.data.comment;
				let player = players.find(function(_player, _player_i){
					return _player.userId == user_id;
				});
				
				if (player != undefined) {
					createPlayer(parsedData.data);
					player.last_comment = comment;
					player.is_in_list = true;
					player.inactivity_frames = MAX_INACTIVITY_FRAMES;
					player.isHuman = true;
				} else {
					let created_ship = createPlayer(parsedData.data);
					created_ship.last_comment = comment;
					created_ship.is_in_list = true;
					created_ship.inactivity_frames = MAX_INACTIVITY_FRAMES;
					created_ship.isHuman = true;
					player = created_ship;
				}
				switch (parsedData.data.comment) {
					//user_id de Josie: 6858294175004820485
					case "!powerup":
					break;
				}


                // --- NUEVO: Interceptar el comando !color ---
                let commentUpper = comment.toUpperCase();
                if (commentUpper.startsWith("#COLOR")) {
                    let parts = commentUpper.split(" ");
                    // Si el comando tiene un segundo elemento y es un número
                    if (parts.length > 1 && !isNaN(parts[1])) {
                        player.customHue = parseInt(parts[1]);
                    } else {
                        // Si solo escriben !color, se elimina la preferencia y vuelve al original
                        player.customHue = undefined; 
                    }
                }



				captureWordsFromChat(comment);
                
               // --- NUEVO: Capturar el estado de la jugada ---
                let attemptResult = checkWordAttempt(user_id, comment);

                let bgColorStyle = "";
                let appendedText = "";

                if (attemptResult) {
                    // Obtenemos el color único asignado al jugador
                    let userColor = getPlayerColor(user_id); 

                    if (attemptResult.status === "new_found") {
                        // Verde oscuro de fondo, palabra con el color del jugador
                        bgColorStyle = "background-color: #004d00; padding: 2px 5px; border-radius: 4px;"; 
                        appendedText = ` <span style="color: ${userColor}; font-weight: bold; font-size: 16px; text-shadow: 1px 1px 2px #000;">${attemptResult.word}</span>`;
                    } else if (attemptResult.status === "already_found") {
                        // Amarillo oscuro de fondo, palabra con el color del jugador
                        bgColorStyle = "background-color: #665c00; padding: 2px 5px; border-radius: 4px;"; 
                        appendedText = ` <span style="color: ${userColor}; font-weight: bold; font-size: 16px; text-shadow: 1px 1px 2px #000;">${attemptResult.word}</span>`;
                    } else if (attemptResult.status === "wrong") {
                        // Rojo oscuro de fondo
                        bgColorStyle = "background-color: #660000; padding: 2px 5px; border-radius: 4px;"; 
                    }
                }

                // Inyectamos los estilos en el div del comentario
                // --- NUEVO: Darle color al número en el chat ---
// --- NUEVO: Darle color al número en el chat y mostrar su nombre ---
 // --- NUEVO: Darle color al número en el chat y mostrar su nombre con el mismo color ---
                let displayComment = comment;
                let colorMatch = displayComment.match(/^(#COLOR)\s+(\d+)/i);
                
                if (colorMatch) {
                    let hue = parseInt(colorMatch[2]) % 360;
                    let visualColor = `hsl(${hue}, 100%, 50%)`;
                    
                    // Definimos la lista de nombres
                    let colorNames = ["Niño del OXXO", "Cheems con ansiedad", "Movimiento Naranja (Yuawi)", "Pikachu sorprendido", "Shrek", "Rana René", "Marcianito de la Cumbia", "Mamá Lucha", "Wazowski con dos ojos", "Calamardo guapo", "Burbuja Hola Adiós", "Pantalones de Tienda", "Spiderman Señalando", "Est^p!d@ mi cabello !d!.t@!", "Minion Morado", "Ajolote de 50", "Jabón ZOTE", "Salsa de la que pica", "Niño del OXXO"];
                    
                    // Calculamos qué nombre le toca dividiendo entre 20 y redondeando
                    let index = Math.round(hue / 20);
                    if (index > 18) index = 18; // Límite de seguridad
                    
                    let colorName = colorNames[index];

                    // Reemplazamos el comando original para inyectarle el color al número y al nombre del meme
                    displayComment = displayComment.replace(
                        colorMatch[0], 
                        `${colorMatch[1]} <span style="color: ${visualColor}; font-weight: bold; text-shadow: 1px 1px 2px #000;">${colorMatch[2]}</span> <span style="color: ${visualColor}; font-weight: bold; font-size: 13px; text-shadow: 1px 1px 2px #000;">[${colorName}]</span>`
                    );
                }

                // Inyectamos los estilos en el div del comentario usando displayComment
                chatEl.innerHTML += `<button class="comment-checkbox uid-${user_id}" onclick="commentCorrectToggle(this, ${user_id})">▪️</button><div class="comment" onclick="commentClick(this)" style="${bgColorStyle}">${next_comment_index++} <b>${player.nickname}</b> > <span style="color: #999">${displayComment}</span>${appendedText}</div><br>`;
                // ----------------------------------------------

                if (!chat_is_paused) {
                    chatEl.scrollTop = chatEl.scrollHeight;
                } else {
                    mensajes_pendientes++;
                    play_pause_el.innerHTML = `PLAY [${mensajes_pendientes}]`
                }






			break;
			case "gift":
				giftEvent(parsedData)

			break;
			case "share":
			break;
			case "subscribe":

			break;
			case "follow":
			break;
		}


        console.log("Data received", parsedData);
		mostrar();
    }
}



function debug() {

	console.log(players)

}

function mostrar() {
    let barPlayersEl = document.getElementById("bar-players");
    if (!barPlayersEl) return;
    
    let str = "";
    let currentRank = 1;

    for (let i = 0; i < players.length; i++) {
        let player = players[i];
        
        // --- CÁLCULO DE RANKING ---
        let rankStr = "";
        
        if (order_type === "score") {
            if (i > 0) {
                if (player.score < players[i-1].score) {
                    currentRank++; 
                }
            } else {
                currentRank = 1; 
            }
            
            let rankColor = "#FFFFFF"; 
            if (currentRank === 1) rankColor = "#FFD700";      
            else if (currentRank === 2) rankColor = "#C0C0C0"; 
            else if (currentRank === 3) rankColor = "#CD7F32"; 

            if (player.score > 0) {
                rankStr = `<span class="rank-number" style="color: ${rankColor}">#${currentRank}</span>`;
            }
        }

        // Obtenemos el color dinámico del jugador
        let playerColor = getPlayerColor(player.userId);

        let bar_display_name = player.nickname || player.uniqueId || player.userId;
        let hasCrownStr = (mvp_id == player.userId && player.score > 0) ? "<span style='font-size: 20px'>👑</span>" : "";
        let isAliveStr = "";
        let isInListStr = !player.is_in_list ? "not-in-list" : "";
        let isInListStr2 = !player.is_in_list ? ` | DX in: ${Math.floor(player.inactivity_frames / FPS)}` : "";
        let killerStr = (player.killer_highlight > 0) ? "killer" : "";

        // Construcción del HTML
        str += `<div class='${isAliveStr} ${isInListStr} ${killerStr}' style='text-wrap: nowrap; margin-bottom: 5px;'>`;
        
        // 1. Ranking
        str += rankStr;
        
        // 2. Botones y Puntos
        str += `<div data-userid='${player.userId}' class='add-button' onclick='addScore("${player.userId}",1)'>+</div> 
                <span style="font-weight:bold; width:20px; display:inline-block; text-align:center">${player.score}</span> 
                <div data-userid='${player.userId}' class='sub-button' onclick='addScore("${player.userId}",-1)'>-</div> `;
        
        // 3. Corona, Foto, CUADRITO DE COLOR y Nombre
        str += `${hasCrownStr} 
                <img id='${player.userId}' class='profile' src='${player.profilePictureUrl}' data-tooltip='${bar_display_name} - ${player.score} pts'> 
                <div style='display: inline-block; vertical-align: middle;'>
                    <span class='last_comment'>${player.last_comment}</span><br>
                    <div style='display: inline-block; width: 12px; height: 12px; background-color: ${playerColor}; border: 1px solid #000; margin-right: 5px; border-radius: 2px; vertical-align: middle;'></div>${bar_display_name} ${isInListStr2}
                </div>`;
                
        str += `</div>`;
    }
    
    barPlayersEl.innerHTML = str;
}

function createPlayer(info) {
	let player;
	let userId = String(info.userId);
	player = players.find(function(_player, _player_i){
		return _player.userId == userId;
	});
	if (player == undefined) {
		players.push(info);
		//player.userId = userId;
		player = players[players.length-1];
		player.size = player_w;
		player.w = player_w;
		player.h = player_h;
		player.last_comment = "";
		player.score = 0;
		player.killer_highlight = 0;
		player.inactivity_frames = MAX_INACTIVITY_FRAMES_BOT;
		player.is_in_list = true;
		player.isHuman = false;
		
		player.hp = INITIAL_HP;
		player.diamondCount = 0;
		player.lastDiamondCount = 0;
	}
	
	player.nickname = info.nickname;
	player.profilePictureUrl = info.profilePictureUrl;
	player.uniqueId = info.uniqueId;
	player.is_in_list = true;
	//ship.respawn_frames = MAX_RESPAWN_FRAMES;
	player.inactivity_frames = MAX_INACTIVITY_FRAMES_BOT;

	
	sort();
	return player;
}

function getPlayer(uid) {
	let player = players.find(function(_player, _player_i){
		return _player.userId == uid;
	});
	if (player != undefined) {
		return player;
	} else {
		player = createPlayer({
			userId: uid
		});
		return player;
	}
}
function respawnPlayer(player){
	player.x = Math.floor(Math.random()*(canvas_w-ship_w));
	player.y = Math.floor(Math.random()*(canvas_h-ship_h));
	player.v = ship_v;
	player.a = Math.random()*2*Math.PI;
	player.vx = player.v * Math.cos(player.a);
	player.vy = player.v * Math.sin(player.a);
	player.hp = INITIAL_HP;
	player.score = 0;
	player.hasPoints = true;
	player.size = ship_w;
	if (player.isHuman) {player.inactivity_frames = MAX_INACTIVITY_FRAMES;}
	else {player.inactivity_frames = MAX_INACTIVITY_FRAMES_BOT;}
	//ship.inactivity_frames = MAX_INACTIVITY_FRAMES;
	player.respawn_frames = MAX_RESPAWN_FRAMES;
	player.is_in_list = true;
	return player;
}

function addScore(userId, amount) {
    let player = players.find(p => p.userId == userId);
    if (player) {
        player.score += amount;
    }
    
    sort();
    mostrar();
    
    // --- NUEVO: Actualizar coronas ---
    updateCrowns();
}

function sortLikers() {
	listoflikers.sort(function(a, b) {
		return (b.likes - a.likes);
	});
}

function updateShipList(viewers) {
	
	

	
	
	
	
	for (let i = 0; i < players.length; i++) {
		
	/*
		//agregar a ships[] si no est谩
		ind = ships.findIndex(function(element){
			return element.userId == listofmembers[i].userId;
		});
		
		if (ind == -1) {
			let x = Math.floor(Math.random()*(canvas_w-ship_w));
			let y = Math.floor(Math.random()*(canvas_h-ship_h));
			let v = ship_v;
			let a = Math.random()*2*Math.PI;
			let vx = v * Math.cos(a);
			let vy = v * Math.sin(a);
			ships.push({
				uniqueId: listofmembers[i].uniqueId,
				nickname: listofmembers[i].nickname,
				profilePic: listofmembers[i].profilePic,
				HP: INITIAL_HP,
				time_alive: 0,
				userId: listofmembers[i].userId,
				member: listofmembers[i],
				x: x,
				y: y,
				v: v,
				a: a,
				vx: vx,
				vy: vy
			});
		}
	}
	*/	
	}
	for (let i = 0; i < players.length; i++) {
	
		//borrar de ships[] si no est谩
		let user;
		if (parsedData.data.user == undefined) {
			user = parsedData.data;
		} else {
			user = parsedData.data.user;
		}
		ind = listofusers.findIndex(function(element){
			return element.userId == players[i].userId;
		});
		if (ind == -1) {
			players.splice(i,1);
		}		
	}					
}

function createBullet(sh_id) {
	let shooter = getPlayer(sh_id);
	let safe_radius = (ship_w + 50);
	let new_x = shooter.x + (safe_radius * Math.cos(shooter.a));
	let new_y = shooter.y + (safe_radius * Math.sin(shooter.a));
	listofbullets.push({
		x: shooter.x + shooter.size/2,
		y: shooter.y + shooter.size/2,
		a: shooter.a,
		v: shooter.v + BULLET_SPEED,
		size: BULLET_SIZE,
		speed: BULLET_SPEED,
		hp: BULLET_HP,
		persist: false,
		is_bomb: false,
		bounces_left:  0,
		giftPictureUrl: undefined,
		shooter_id : sh_id,
	});
}
	
function createBomb(shp_id) {
	missileEl.play();
	let shooter = getPlayer(shp_id);
	let safe_radius = (ship_w + 50);
	let new_x = shooter.x + (safe_radius * Math.cos(shooter.a));
	let new_y = shooter.y + (safe_radius * Math.sin(shooter.a));
	listofbullets.push({
		x: shooter.x + shooter.size/2,
		y: shooter.y + shooter.size/2,
		a: shooter.a,
		v: shooter.v + BOMB_SPEED,
		size: BOMB_SIZE,
		speed: BOMB_SPEED,
		hp: BOMB_HP,
		persist: false,
		isBomb: true,
		bounces_left:  shooter.paid_bombs[0].bomb_coin_value,
		shooter_id : shooter.userId,
		giftPictureUrl: shooter.paid_bombs[0].giftPictureUrl,
	});
	
	
	
	let next_bullet_frames = BULLET_FRAMES;
	
}




function updateCrown(){
	let first_place_ships = [];
	let p = undefined;
	if (mvp_id != undefined) {
		p = getPlayer(mvp_id);
		p.size = player_w;
	}
	
	let newCrown;
	

	//MVP más kills y más antiguo
	mvp_score = 0;
	//getShip(mvp_id).size = ship_w;
	//mvp_id = mvps[0].userId;
	for (let i = 0; i < mvps.length; i++) {
		let p = getPlayer(mvps[i]);
		if (p.score >= mvp_score && p.score > 0) {
			
			newCrown = p;
			mvp_score = sh.score;
			
			
		}
	}

	if (newCrown) {
		mvp_id = newCrown.userId;
		//newCrown.w = ship_w_final;
		//newCrown.h = ship_h_final;
		newCrown.size = player_w;
	}
	
}
function sumOfLikes() {
	let sum = 0;
	for (let i=0; i < listoflikers.length; i++) {
		sum += listoflikers[i].likes;
	}
	return sum;
}
function addLastActivity(t) {
	for (let i=0; i<last_activity.length; i++) {
		last_activity[i].last_activity += t;
	}
}
function resetLastActivity(id) {
	let last_activity_index = last_activity.findIndex(function(element){
		return element.userId == id;
	});
	if (last_activity_index != -1) {
		last_activity[last_activity_index].last_activity = 0;
	}
}

function actualizar() {

	for (let i = 0; i < players.length; i++) {
		let player = players[i];

		
		if (player.killer_highlight > 0) {
			player.killer_highlight--;
		}
		
		
		//ELIMINAR NAVES INACTIVAS
		if (!player.is_in_list) {
			if (--player.inactivity_frames <= 0 && player.score == 0) {
				removePlayer(player);
			}
		}
		

		
			
	}
}

function removePlayer(player) {
	let player_i;
	let score;
	for (const _score of first_to_score) {
		player_i = _score.findIndex(function(_player) {
			return _player.userId == player.userId;
		});
		score = first_to_score[player_i];
	}
	if (score && player_i) {
		score.splice(player_i,1);
	}

	
	player_i = players.findIndex(function(_player) {
		return _player.userId == player.userId;
	});
	players.splice(player_i,1);
}

function killShip(ship, bullet) {
	ship.hp = 0;
	//explosionEl.play();
	ship.hasPoints = false;
	ship.respawn_frames = MAX_RESPAWN_FRAMES;
	let shooter_ship = getPlayer(bullet.shooter_id);
	shooter_ship.score++;
	last_killer_ship = shooter_ship;
	shooter_ship.killer_highlight = MAX_SCORER_HIGHLIGHT_FRAMES;
	
	
	let killer_in_mvps = mvps.findIndex(function(kl, kl_i){
		return mvps[kl_i] == bullet.shooter_id;
	});
	if (killer_in_mvps > -1) {
		mvps.splice(killer_in_mvps,1);
	}
	mvps.unshift(bullet.shooter_id);
	
	let dead_in_mvps = mvps.findIndex(function(dd){
		return dd == ship.userId;
	});
	if (dead_in_mvps > -1) {
		mvps.splice(dead_in_mvps,1);
	}
	//getShip(mvp_id).size = ship_w;
	updateCrown();
	
	
	
	if (mvp_id != undefined) {
		let la_mvp_ship = getPlayer(mvp_id);
		la_mvp_ship.size = player_w;
	}
	
	spawnPowerup(undefined ,ship.x+(ship.size/2)-(POWERUP_SIZE/2),ship.y+(ship.size/2)+(POWERUP_SIZE/2));
	//spawnPowerup(undefined,ship.x+15,ship.y+15);
	if (survival_mode == "started" && getAliveShipCount() <= 1) {
		survival_mode = "ended";
	}
}

function restartScore() {
	let player;
	for (let i = 0; i < players.length; i++) {
		player = players[i];
		player.score = 0;
	}
	mostrar();
}

function sort() {
	switch (order_type) {
		case "name":
		sortByName();
		break;
		case "score":
		sortByScore();
		break;
		case "viewer":
		sortByViewer();
		break;
	}
	mostrar();
}

function sortByNameClick() {
	order_type = "name";
	sort();
}

function sortByName() {
	players.sort(function(a, b) {
		let a_name = a.nickname ? a.nickname :"zzzzzzzz";
		let b_name = b.nickname ? b.nickname :"zzzzzzzz";


		a_name = a_name.toLowerCase();
		b_name = b_name.toLowerCase();

		a_name = a_name.match(/\w/gi);
		b_name = b_name.match(/\w/gi);

		if (a_name < b_name) {return -1}
		if (a_name > b_name) {return 1}
		return 0;
	})
}

function sortByScoreClick() {
	order_type = "score";
	sort();
}

function sortByScore() {
	players.sort(function(a, b) {
		let a_score = a.score;
		let b_score = b.score;
		return b_score - a_score;
	})
}

function sortByViewerClick() {
	order_type = "viewer";
	sort();
}
function sortByViewer() {
	roomUserEvent(room_user_parsedData);
}

function bounceBullet(bullet, ship) {
	let bounce_angle = ( (bullet.a+ship.a)/2 );
	bullet.a = ( (2*bounce_angle) - bullet.a ) % (2*Math.PI);
	bullet.vx = bullet.v * Math.cos(bullet.a);
	bullet.vy = bullet.v * Math.sin(bullet.a);
	bullet.x += 1*bullet.vx;
	bullet.y += 1*bullet.vy;
	
	ship.a = ( (2*bounce_angle) - ship.a) % (2*Math.PI);
	ship.vx = ship.v * Math.cos(ship.a);
	ship.vy = ship.v * Math.sin(ship.a);
	
}

function swipe(uid) {
	for (ship of players) {
		if (ship.userId != uid) {
			killShip(ship, {shooter_id:uid});
		}
	}
}

function roomUserEvent(parsedData) {

	//listofmembers = [];

			//actualizar lista de naves
	let topViewers = parsedData.data.topViewers;
//	for (let viewer_i = 0 ; viewer_i < topViewers.length; viewer_i++) {	
	for (let viewer_i = topViewers.length-1 ; viewer_i >= 0; viewer_i--) {
		let vwr = topViewers[viewer_i];
		let player_i;

		let player = players.find(function(_player, _player_i){
				player_i = _player_i;
				return _player.userId == vwr.user.userId;
		});	


		//createShip(vwr);
		
		
		//si encuentra al espectador en players
		if (player != undefined) {
			player.is_in_list = true;
			//si llegó la información completa
			if (vwr.user.uniqueId != undefined) {
				//ship = vwr.user;
				player.uniqueId = vwr.user.uniqueId;
				//ship.profilePictureUrl = vwr.user.profilePictureUrl;
				player.nickname = vwr.user.nickname;
				
			}
			players.unshift(player);
			players.splice(player_i+1,1);

		//si no encuentra la nave
		} else {
			//ships.push(viewer);
				createPlayer(vwr.user);
		}
		
		
		
		
		

	}
	
	//Quitar players que no están en los TopViewers
	
	players.forEach(function(_player, _player_i){
		let viewer = topViewers.find(function(vwr, vwr_i){
				return vwr.user.userId == _player.userId;
		});
		if (viewer == undefined) {
			_player.is_in_list = false;
			//
		}
	});
	

	//mostrar();
}

function likeEvent(parsedData) {
	let shooter_id = parsedData.data.userId;
	let quantity = parsedData.data.likeCount;
	let shooter_ship = getPlayer(shooter_id);
	shooter_ship.is_in_list = true;
	shooter_ship.inactivity_frames = MAX_INACTIVITY_FRAMES;
	shooter_ship.isHuman = true;
	//getShip(shooter_id).paid_bullets += parsedData.data.likeCount;
	//shooter_ship.paid_bullets += parsedData.data.likeCount;
	if (shooter_ship.nickname == undefined) {
	shooter_ship.nickname = parsedData.data.nickname;
	}
	if (shooter_ship.profilePictureUrl == undefined) {
	shooter_ship.profilePictureUrl = parsedData.data.profilePictureUrl;
	}
	
	/*
	if (shooter_ship.nickname != undefined) {
		shooter_ship.nickname = parsedData.data.nickname;
	} if (shooter_ship.profilePictureUrl != undefined) {
		shooter_ship.profilePictureUrl = parsedData.data.profilePictureUrl;
	}
	*/	
}

function giftEvent(parsedData) {
	let data = parsedData.data;
	/*
	data.diamondCount
	data.repeatCount
	data.repeatEnd (true/false)
	data.giftType (1 = combo)
	*/
	let gifter_id = data.userId;
	let gifter_ship = getPlayer(gifter_id);
	let repeatC;
	if (data.giftType == 1) {
		repeatC = data.repeatCount;
	} else {
		repeatC = 1;
	}
	/*versi贸n anterior*/ //let bomb_quantity = data.diamondCount * (repeatC - gifter_ship.lastDiamondCount);
	/*versi贸n nueva*/ let bomb_quantity = /* data.diamondCount * */ (repeatC - gifter_ship.lastDiamondCount);
	let bomb_coin_value = data.diamondCount;
	//(irrelevante)
	gifter_ship.lastDiamondCount = bomb_quantity;
	if (data.repeatEnd || data.giftType != 1) {gifter_ship.lastDiamondCount = 0;}
	
	gifter_ship.is_in_list = true;
	gifter_ship.inactivity_frames = MAX_INACTIVITY_FRAMES;
	gifter_ship.isHuman = true;
	//getShip(shooter_id).paid_bullets += data.likeCount;
	if (!data.repeatEnd || data.giftType !=1) {
		/*versi贸n anterior*/ //gifter_ship.paid_bombs += bomb_quantity;
		/*versi贸n nueva*/
		for (let i = 0; i < bomb_quantity; i++) {
			/*
			gifter_ship.paid_bombs.push(
				{
					giftPictureUrl: data.giftPictureUrl,
					bomb_coin_value: bomb_coin_value
				}
			);
			*/
		}
	}
	gifter_ship.giftPictureUrl = data.giftPictureUrl;
	//resetLastActivity(data.userId);
}

function shareEvent(parsedData, dir) {
	let sharer_id = parsedData.data.userId;
	let sharer_ship = getPlayer(sharer_id);
	sharer_ship.is_in_list = true;
	sharer_ship.inactivity_frames = MAX_INACTIVITY_FRAMES;
	sharer_ship.isHuman = true;
	if (dir != undefined) {
		sharer_ship.a = dir;
	} else {
		sharer_ship.a = Math.random()*2*Math.PI;
	}
	sharer_ship.vx = sharer_ship.v * Math.cos(sharer_ship.a);
	sharer_ship.vy = sharer_ship.v * Math.sin(sharer_ship.a);
}

function toggleSurvivalMode() {
	if (survival_mode == "off") {
		survival_mode = "started"
		document.body.style.backgroundColor = survival_background_color;
		powerups = [];
	} else {
		/*
		if (survival_mode == "ended") {
			for (let ship of ships) {
				respawnShip(ship);
			}
		}
		*/
		survival_mode = "off";
		document.body.style.backgroundColor = background_color;
	}
}

function getAliveShipCount() {
	let alive_ships = 0;
	for (let ship of players) {
		if (ship.hasPoints) {alive_ships++;}
	}
	return alive_ships;
}

function pauseClick() {
	chat_is_paused = !chat_is_paused;
	if (chat_is_paused) {
		play_pause_el.style.backgroundColor = PLAY_COLOR;
		play_pause_el.innerHTML = "PLAY";
		chatEl.style.borderColor = "rgb(255, 251, 0)" ;
	}
	else {
		play_pause_el.style.backgroundColor = PAUSE_COLOR;
		play_pause_el.innerHTML = "PAUSE";
		chatEl.scrollTop = chatEl.scrollHeight;
		chatEl.style.borderColor = background_color;
		mensajes_pendientes = 0;
	}
}

function commentClick(el) {
	el.classList.toggle("highlighted");
	if (!chat_is_paused) {
		pauseClick();
	}
}

function commentCorrectToggle(el, user_id) {
	console.log("commentCorrectToggle");
	let commentEl = el.nextElementSibling;
	let isCorrect = commentEl.classList.toggle("correct");
	el.classList.toggle("correct");
	let player = getPlayer(user_id);
	if (isCorrect) {
		player.score++;
		/*⬛️⬜️▫️▪️🔹⏹️🟫◻️❌✖️✔️✅☑️🕊️*/
		el.innerHTML = "🕊️";
	} else {
		player.score--;
		el.innerHTML = "▪️";
	}

}


// ---------------------------------------------------------
// LÓGICA SOPA DE LETRAS
// ---------------------------------------------------------

function initWordSearch() {
    // Ya no generamos el grid inmediatamente.
    // Aseguramos que el menú de configuración sea visible
    document.getElementById('game-setup').classList.remove('hidden');
}

function generateGrid() {
    // 1. Inicializar grilla vacía
    gridData = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(''));
    wordLocations = [];
    foundWords = [];

    // 2. Colocar palabras
    for (let word of searchWords) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 150) { 
            let dirIndex = Math.floor(Math.random() * 8); 
            let row = Math.floor(Math.random() * GRID_ROWS);
            let col = Math.floor(Math.random() * GRID_COLS);

            if (canPlaceWord(word, row, col, dirIndex)) {
                placeWord(word, row, col, dirIndex);
                let coordKey = LETTERS[col] + (row + 1);
                
                wordLocations.push({
                    word: word,
                    key: coordKey, 
                    coords: getWordCoords(word, row, col, dirIndex), 
                    found: false
                });
                placed = true;
            }
            attempts++;
        }
    }

    // 3. Rellenar espacios vacíos
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            if (gridData[r][c] === '') {
                gridData[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

function canPlaceWord(word, r, c, dirIndex) {
    const { dr, dc } = DIRECTIONS[dirIndex];

    for (let i = 0; i < word.length; i++) {
        let nr = r + (i * dr);
        let nc = c + (i * dc);

        // Verificar límites rectangulares
        if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) {
            return false;
        }

        // Verificar colisiones
        if (gridData[nr][nc] !== '' && gridData[nr][nc] !== word[i]) {
            return false;
        }
    }
    return true;
}

function placeWord(word, r, c, dirIndex) {
    const { dr, dc } = DIRECTIONS[dirIndex];
    
    for (let i = 0; i < word.length; i++) {
        let nr = r + (i * dr);
        let nc = c + (i * dc);
        gridData[nr][nc] = word[i];
    }
}

function getWordCoords(word, r, c, dirIndex) {
    const { dr, dc } = DIRECTIONS[dirIndex];
    let coords = [];
    
    for (let i = 0; i < word.length; i++) {
        coords.push({
            r: r + (i * dr),
            c: c + (i * dc)
        });
    }
    return coords;
}

function renderBoard() {
    const boardEl = document.getElementById('word-search-grid');
    const listEl = document.getElementById('word-list-items');
    
    if (!boardEl) return;

    // --- MAGIA: Actualizar el CSS para que se adapte al ancho ---
    boardEl.style.gridTemplateColumns = `repeat(${GRID_COLS + 2}, 40px)`;

    boardEl.innerHTML = '';
    listEl.innerHTML = '';

    // --- 1. FILA SUPERIOR ---
    boardEl.appendChild(createCell('', 'header-cell')); 
    for (let i = 0; i < GRID_COLS; i++) {
        boardEl.appendChild(createCell(LETTERS[i], 'header-cell'));
    }
    boardEl.appendChild(createCell('', 'header-cell')); 

    // --- 2. FILAS CENTRALES ---
    for (let r = 0; r < GRID_ROWS; r++) {
        boardEl.appendChild(createCell(r + 1, 'header-cell'));
        
        for (let c = 0; c < GRID_COLS; c++) {
            let cell = createCell(gridData[r][c], 'cell');
            cell.id = `cell-${r}-${c}`;
            boardEl.appendChild(cell);
        }

        boardEl.appendChild(createCell(r + 1, 'header-cell'));
    }

    // --- 3. FILA INFERIOR ---
    boardEl.appendChild(createCell('', 'header-cell')); 
    for (let i = 0; i < GRID_COLS; i++) {
        boardEl.appendChild(createCell(LETTERS[i], 'header-cell'));
    }
    boardEl.appendChild(createCell('', 'header-cell')); 

    // --- 4. LISTA DE PALABRAS ---
    wordLocations.sort((a, b) => a.word.localeCompare(b.word)); 

    wordLocations.forEach(item => {
        let word = item.word;
        if(document.getElementById(`list-${word}`)) return; 
        
        let div = document.createElement('div');
        div.className = 'word-item';
        div.id = `list-${word}`;
        
        // --- CAMBIO: Envolvemos solo la palabra en un span ---
        div.innerHTML = `<span class="the-word">${word}</span>`;
        // -----------------------------------------------------
        
        listEl.appendChild(div);
    });



}

function createCell(content, className) {
    let div = document.createElement('div');
    div.className = className;
    // Envolvemos el contenido en un span para controlar el z-index frente a la imagen
    let span = document.createElement('span');
    span.innerText = content;
    div.appendChild(span);
    return div;
}

// Función principal que procesa el chat
function checkWordAttempt(userId, msg) {
    if (!msg) return { status: "none" }; 
    
    let text = msg.toUpperCase();
    
    // Nueva expresión regular
    const regex = /([A-Z])\s*([1-9][0-9]*)|([1-9][0-9]*)\s*([A-Z])/;
    const match = text.match(regex);

    if (!match) return { status: "none" };

    let letterPart = "";
    let numberPart = "";
    let coordKey = "";

    if (match[1] && match[2]) {
        letterPart = match[1];
        numberPart = match[2];
        coordKey = letterPart + numberPart;
    } else if (match[3] && match[4]) {
        letterPart = match[4];
        numberPart = match[3];
        coordKey = letterPart + numberPart; 
    }

    let colIndex = LETTERS.indexOf(letterPart); 
    let rowIndex = parseInt(numberPart) - 1;

    // Validación: Saber si estamos jugando
    const setupMenu = document.getElementById('game-setup');
    const isGameRunning = setupMenu && setupMenu.classList.contains('hidden');

    if (!isGameRunning) {
        return { status: "none" }; 
    }

    // Validación de límites del tablero
    if (colIndex >= 0 && colIndex < GRID_COLS && rowIndex >= 0 && rowIndex < GRID_ROWS) {
        updatePlayerPosition(userId, rowIndex, colIndex);
    } else {
        return { status: "none" }; 
    }

    // --- NUEVO: Buscamos TODAS las palabras que inicien en esta coordenada ---
    let targets = wordLocations.filter(w => w.key === coordKey);

    if (targets.length > 0) {
        // Filtramos cuáles de esas palabras aún no se han encontrado
        let unfoundTargets = targets.filter(t => !t.found);

        if (unfoundTargets.length > 0) {
            // Elegimos UNA al azar de las que faltan por encontrar
            let target = unfoundTargets[Math.floor(Math.random() * unfoundTargets.length)];

            target.found = true;
            addScore(userId, 1);

            let player = getPlayer(userId);
            let startCoord = target.coords[0]; 
            
            showScorePopup(player, startCoord.r, startCoord.c);
            
            let allFound = wordLocations.every(w => w.found);

            if (allFound) {
                let explAudio = document.getElementById("explosion");
                if(explAudio) explAudio.play();
                // --- NUEVO: Disparar la cuenta regresiva de la siguiente sopa ---
                startNextGameCountdown();
                buildAndShowResults();
            }

            let pColor = getPlayerColor(userId);
            target.coords.forEach(pos => {
                let cell = document.getElementById(`cell-${pos.r}-${pos.c}`);
                if (cell) {
                    cell.style.setProperty('--player-color', pColor);
                    cell.classList.add('found');
                }
            });

           let listEl = document.getElementById(`list-${target.word}`);
            if (listEl) {
                // --- CAMBIO: Buscamos el span y lo tachamos SOLAMENTE a él ---
                let wordSpan = listEl.querySelector('.the-word');
                if (wordSpan) wordSpan.classList.add('word-found');
                
                // Le damos el color del jugador a todo el renglón
                listEl.style.color = pColor; 
                
                listEl.innerHTML += ` <span style="color: #FFF; font-size: 14px; font-weight: normal;">[${coordKey}]</span> <img src="${player.profilePictureUrl}" class="finder-icon" data-tooltip="${player.nickname} - ${player.score} pts"> ${player.nickname}`;
            }
            
            let dropAudio = document.getElementById("drop");
            if(dropAudio) dropAudio.play();

// --- NUEVO: Desplazar la lista si la casilla está marcada ---
            scrollToFirstUnfound();


            // Retornamos éxito nuevo
            return { status: "new_found", word: target.word };
        } else {
            // Si TODAS las palabras de esta coordenada ya se encontraron, 
            // elegimos una al azar para mostrar el aviso amarillo
            let randomFound = targets[Math.floor(Math.random() * targets.length)];
            return { status: "already_found", word: randomFound.word };
        }
    }

    // Retornamos que la coordenada no tiene palabra
    return { status: "wrong" };
}

function updatePlayerPosition(userId, r, c) {
    const cellKey = `${r}-${c}`;
    
    if (occupiedCells[cellKey] && occupiedCells[cellKey] !== userId) {
        return; 
    }

    let player = getPlayer(userId);
    if (!player) return;

    if (player.lastRow !== undefined && player.lastCol !== undefined) {
        let oldKey = `${player.lastRow}-${player.lastCol}`;
        if (occupiedCells[oldKey] === userId) {
            delete occupiedCells[oldKey];
        }
    }

    player.lastRow = r;
    player.lastCol = c;
    occupiedCells[cellKey] = userId;

    let targetCell = document.getElementById(`cell-${r}-${c}`);
    if (!targetCell) return;

    let token = document.getElementById(`token-${userId}`);
    
    if (!token) {
        token = document.createElement('div');
        token.id = `token-${userId}`;
        token.className = 'player-token';
        
        // --- FORZAR ESTILOS EN JS PARA EVITAR ERRORES DE CSS ---
        token.style.width = '40px';
        token.style.height = '40px';
        token.style.boxSizing = 'border-box'; // Para que el borde no aumente el tamaño
        //token.style.overflow = 'hidden';      // Recorta cualquier cosa que sobresalga
        token.style.borderRadius = '4px';
        token.style.display = 'flex';         // Centra la imagen
        token.style.justifyContent = 'center';
        token.style.alignItems = 'center';
        
        let img = document.createElement('img');
        img.src = player.profilePictureUrl;
		img.setAttribute('data-tooltip', `${player.nickname} - ${player.score} pts`);
        
        // Forzar imagen a llenar el contenedor exacto
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover'; // 'cover' recorta, 'fill' estira.
        img.style.display = 'block';   // Elimina el espacio fantasma debajo de las imágenes inline
        img.style.margin = '0';
        img.style.padding = '0';
        
        token.appendChild(img);
        document.getElementById('word-search-grid').appendChild(token);
    } else { // Si la ficha ya existía, también le actualizamos los puntos por si acaso
        let img = token.querySelector('img');
        if (img) img.setAttribute('data-tooltip', `${player.nickname} - ${player.score} pts`);
    }

    // --- ANIMACIÓN ---
    token.style.left = targetCell.offsetLeft + 'px';
    token.style.top = targetCell.offsetTop + 'px';
}

function startGameWithCustomWords() {

	if (autoStartTimer) {
        clearInterval(autoStartTimer);
        autoStartTimer = null;
    }

// --- NUEVO: Cancelar timer de siguiente sopa si existe ---
    if (nextGameTimer) {
        clearInterval(nextGameTimer);
        nextGameTimer = null;
        let display = document.getElementById('next-game-countdown');
        if (display) display.style.display = 'none';
    }

    // --- NUEVO: Limpiar chat y reiniciar contadores ---
    let chatContainer = document.getElementById('chat');
    if (chatContainer) chatContainer.innerHTML = '';
    next_comment_index = 1;
    mensajes_pendientes = 0;
    
    let playPauseBtn = document.getElementById('play-pause-bt');
    if (playPauseBtn && chat_is_paused) {
        playPauseBtn.innerHTML = "PLAY [0]";
    }
    // -------------------------------------------------


	const keepWordsCb = document.getElementById('keep-words-checkbox');
    if (keepWordsCb) {
        keepWordsForNext = keepWordsCb.checked;
    }

	restartScore();

    let input = document.getElementById('custom-words-input');
    let rawText = input.value;

    if (!rawText.trim()) {
        alert("¡Escribe al menos una palabra!");
        return;
    }

    let newWords = rawText.split(/[\n, ]+/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
    let uniqueWords = [...new Set(newWords)];

// Calcular el lado más largo del tablero para limitar palabras
    let maxLen = Math.max(GRID_COLS, GRID_ROWS);
    let validWords = uniqueWords.filter(w => w.length <= maxLen);

    if (validWords.length === 0) {
        alert(`Ninguna palabra es válida (máximo ${maxLen} letras).`);
        return;
    }

    // Reescribimos el cuadro de texto para que el usuario vea la lista ya limpia
    input.value = validWords.join(", ");
    updateWordCount(); // Forzamos la actualización del contador numérico

   searchWords = validWords;

    document.getElementById('game-setup').classList.add('hidden');
    document.getElementById('word-search-grid').classList.remove('hidden');
    
    // Encoger la columna al tamaño de la sopa
    document.getElementById('left-column').classList.add('playing');

    generateGrid();
    renderBoard();
}

function showScorePopup(player, r, c) {
    const grid = document.getElementById('word-search-grid');
    const cell = document.getElementById(`cell-${r}-${c}`);
    
    if (!grid || !cell) return;

    const popup = document.createElement('div');
    popup.className = 'score-popup';
    
    // Solo el nombre y el número gigante con la clase nueva
    popup.innerHTML = `
        ${player.nickname}
        <span class="big-number">${player.score}</span>
    `;

    // Posición
    popup.style.left = (cell.offsetLeft + 20) + 'px';
    popup.style.top = (cell.offsetTop) + 'px';

    grid.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 10000);
}


function updateCrowns() {
    // 1. Encontrar el puntaje máximo (mayor a 0)
    let maxScore = 0;
    players.forEach(p => {
        if (p.score > maxScore) maxScore = p.score;
    });

    // 2. Recorrer todos los jugadores con ficha en el tablero
    players.forEach(p => {
        let token = document.getElementById(`token-${p.userId}`);
        if (!token) return;

        // --- NUEVO: ACTUALIZAR TOOLTIP DE LA FICHA ---
        // Buscamos la imagen dentro de la ficha y le ponemos el tooltip actualizado
        let img = token.querySelector('img');
        if (img) {
            img.setAttribute('data-tooltip', `${p.nickname} - ${p.score} pts`);
        }
        // ---------------------------------------------

        // Buscar si ya tiene corona
        let crown = token.querySelector('.crown-icon');

        // Si es líder (y tiene puntos), se la ponemos
        if (p.score > 0 && p.score === maxScore) {
            if (!crown) {
                crown = document.createElement('div');
                crown.className = 'crown-icon';
                crown.innerText = '👑'; // Emoji de corona
                token.appendChild(crown);
            }
        } else {
            // Si no es líder, se la quitamos
            if (crown) crown.remove();
        }
    });
}
// --- LÓGICA DEL TOOLTIP INSTANTÁNEO ---
document.addEventListener('mousemove', function(e) {
    let target = e.target;
    let tooltip = document.getElementById('custom-tooltip');
    
    if (!tooltip) return;

    // Si el elemento bajo el ratón tiene el atributo data-tooltip...
    if (target && target.hasAttribute('data-tooltip')) {
        tooltip.innerHTML = target.getAttribute('data-tooltip'); // Poner el texto
        tooltip.style.display = 'block'; // Mostrarlo

		// Medimos la altura del tooltip una vez que tiene texto
        let tooltipHeight = tooltip.offsetHeight;


		
        // Posición X: 15px a la derecha
        tooltip.style.left = (e.clientX + 15) + 'px'; 
        
        // Posición Y: ARRIBA del cursor (Restamos su altura y 15px de margen)
        tooltip.style.top = (e.clientY - tooltipHeight - 15) + 'px';
    } else {
        // Si no, ocultarlo
        tooltip.style.display = 'none';
    }
});


// --- GENERADOR DE COLORES ÚNICOS ---
// --- GENERADOR DE COLORES ÚNICOS (MEJORADO) ---
function getPlayerColor(userId) {
    // Buscamos al jugador para ver si tiene un color personalizado
    let player = players.find(p => p.userId == userId);
    
    // Si existe y tiene un customHue asignado, usamos ese valor
    if (player && player.customHue !== undefined) {
        return `hsl(${Math.abs(player.customHue % 360)}, 100%, 50%)`;
    }

    // Si no tiene color personalizado, calculamos el color por defecto basado en su ID
    let str = String(userId);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
        hash ^= hash >>> 13;
    }
    
    let hue = Math.abs(hash % 360);
    return `hsl(${hue}, 100%, 50%)`;
}

// --- FUNCIÓN PARA CAPTURAR PALABRAS DEL CHAT ---
function captureWordsFromChat(comment) {
	const setupMenu = document.getElementById('game-setup');
    if (setupMenu && setupMenu.classList.contains('hidden')) {
        return; 
    }
    const checkbox = document.getElementById('capture-chat-checkbox');
    if (!checkbox || !checkbox.checked) return; 

    const regex = /[A-ZÁÉÍÓÚÑ0-9]{4,}/gi;
    const wordsInComment = comment.match(regex);

    if (!wordsInComment) return;

    const inputArea = document.getElementById('custom-words-input');
    let currentText = inputArea.value;
    
    // Convertimos el texto actual en array para contar bien
    let currentWords = currentText.split(/[\n, ]+/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
    
    let addedNew = false;

    wordsInComment.forEach(word => {
        let upperWord = word.toUpperCase();
        if (!currentWords.includes(upperWord)) {
            currentWords.push(upperWord);
            
            if (currentText.length > 0 && !currentText.endsWith(' ') && !currentText.endsWith('\n')) {
                currentText += ', ';
            }
            currentText += upperWord;
            addedNew = true;
        }
    });

    if (addedNew) {
        inputArea.value = currentText;
        inputArea.scrollTop = inputArea.scrollHeight; 
        
        // Llamamos a la función para actualizar el texto visual "Palabras: X"
        updateWordCount();
        const autoWordsCb = document.getElementById('auto-start-words-checkbox'); 
        const maxWordsInput = document.getElementById('max-words-input');
        
        if (autoWordsCb && autoWordsCb.checked) {
            let maxWords = parseInt(maxWordsInput.value) || 25; 
            
            if (currentWords.length >= maxWords) {
                console.log("Límite de palabras alcanzado. Iniciando juego...");
                startGameWithCustomWords();
            }
        
        }
    }
}


// --- LÓGICA DE INICIO AUTOMÁTICO (CON CONTADOR) ---
let autoStartTimer = null;
let remainingSeconds = 0;

// --- LÓGICA DE INICIO AUTOMÁTICO POR TIEMPO ---


function toggleAutoStartTimer() {
    const checkbox = document.getElementById('auto-start-time-checkbox'); // Nuevo ID
    const secondsInput = document.getElementById('max-seconds-input');
    const countdownDisplay = document.getElementById('auto-start-countdown');
    
    if (autoStartTimer) {
        clearInterval(autoStartTimer); 
        autoStartTimer = null;
    }

    if (checkbox && checkbox.checked) {
        remainingSeconds = parseInt(secondsInput.value) || 120;
        
        countdownDisplay.style.display = 'inline-block';
        countdownDisplay.innerText = `(${remainingSeconds}s)`;
        
        autoStartTimer = setInterval(() => {
            remainingSeconds--;
            countdownDisplay.innerText = `(${remainingSeconds}s)`;
            
            if (remainingSeconds <= 0) {
                clearInterval(autoStartTimer);
                autoStartTimer = null;
                if (!document.getElementById('game-setup').classList.contains('hidden')) {
                    startGameWithCustomWords();
                }
            }
        }, 1000);
    } else {
        if(countdownDisplay) countdownDisplay.style.display = 'none';
    }
}

// --- ACTUALIZAR CONTADOR VISUAL DE PALABRAS ---
function updateWordCount() {
    const inputArea = document.getElementById('custom-words-input');
    const display = document.getElementById('word-count-display');
    if (!inputArea || !display) return;
    
    let text = inputArea.value;
    let currentWords = text.split(/[\n, ]+/).map(w => w.trim()).filter(w => w.length > 0);
    display.innerText = `Palabras: ${currentWords.length}`;
}

// --- LÓGICA DE NUEVA SOPA Y CONSERVACIÓN DE PALABRAS ---
let keepWordsForNext = true; // Estado guardado de la sopa anterior

function showSetup() {

    document.getElementById('word-list-panel').classList.remove('hidden');
    document.getElementById('left-column').classList.remove('showing-results');

    // --- NUEVO: Limpiar timer al regresar al menú ---
    if (nextGameTimer) {
        clearInterval(nextGameTimer);
        nextGameTimer = null;
        let display = document.getElementById('next-game-countdown');
        if (display) display.style.display = 'none';
    }
    // ------------------------------------------------

    // 1. Mostrar el menú y ocultar la sopa
    document.getElementById('game-setup').classList.remove('hidden');
    document.getElementById('word-search-grid').classList.add('hidden');
    
// --- NUEVO: Regresar la columna al 50% de la pantalla ---
    document.getElementById('left-column').classList.remove('playing');

// Ocultar resultados de la partida anterior
    let overlay = document.getElementById('results-overlay');
    if(overlay) overlay.classList.add('hidden');
    let toggleCb = document.getElementById('toggle-results-cb');
    if(toggleCb) toggleCb.checked = false;


    // Ocultar las coronas y fichas de la partida anterior del tablero
    document.getElementById('word-search-grid').innerHTML = '';
    occupiedCells = {}; 
    
    // 2. Si no marcamos conservar palabras en el juego anterior, limpiamos
    const inputArea = document.getElementById('custom-words-input');
    if (!keepWordsForNext) {
        inputArea.value = '';
    }
    
    // 3. Actualizar conteo de palabras
    updateWordCount();
    
    // 4. Desactivar Auto-Start de Palabras si ya estamos en el límite
    checkWordLimitStart();
    
    // 5. Reiniciar el temporizador (si está marcado)
    toggleAutoStartTimer();
}

function checkWordLimitStart() {
    const autoWordsCb = document.getElementById('auto-start-words-checkbox');
    const maxWordsInput = document.getElementById('max-words-input');
    const inputArea = document.getElementById('custom-words-input');
    
    if (!autoWordsCb || !maxWordsInput || !inputArea) return;
    
    let currentWords = inputArea.value.split(/[\n, ]+/).map(w => w.trim()).filter(w => w.length > 0);
    let maxWords = parseInt(maxWordsInput.value) || 25;
    
    // Si la lista cargada supera el límite, desmarcamos el checkbox para que no inicie en bucle
    if (currentWords.length >= maxWords) {
        autoWordsCb.checked = false;
    }
}

// --- LÓGICA DE INICIO AUTOMÁTICO DE SIGUIENTE SOPA ---
let nextGameTimer = null;

function startNextGameCountdown() {
    let cb = document.getElementById('auto-next-game-cb');
    let secInput = document.getElementById('auto-next-game-sec');
    let display = document.getElementById('next-game-countdown');
    
    // Solo inicia si el checkbox está marcado
    if (cb && cb.checked) {
        let seconds = parseInt(secInput.value) || 10;
        
        display.style.display = "inline";
        display.innerText = `(${seconds})`;
        
        if (nextGameTimer) clearInterval(nextGameTimer);
        
        nextGameTimer = setInterval(() => {
            seconds--;
            display.innerText = `(${seconds})`;
            
            if (seconds <= 0) {
                clearInterval(nextGameTimer);
                display.style.display = "none";
                // Iniciamos la siguiente partida automáticamente
                showSetup();
            }
        }, 1000);
    }
}

function scrollToFirstUnfound() {
    let cb = document.getElementById('auto-scroll-cb');
    if (!cb || !cb.checked) return;

    let firstUnfound = wordLocations.find(w => !w.found);
    if (firstUnfound) {
        let element = document.getElementById(`list-${firstUnfound.word}`);
        let panel = document.getElementById('word-list-panel');
        let header = panel.querySelector('div:first-child'); 
        
        if (element && panel && header) {
            let headerHeight = header.offsetHeight;
            panel.scrollTo({
                top: element.offsetTop - headerHeight - 15,
                behavior: 'smooth'
            });
        }
    }
}

function buildAndShowResults() {
    let resultsBoard = document.getElementById('results-board');
    let colorList = document.getElementById('color-commands-list');
    let cb = document.getElementById('toggle-results-cb');

    let sortedPlayers = [...players].filter(p => p.score > 0).sort((a, b) => b.score - a.score);
    let resultsHTML = `<h3 style="text-align:center; margin-top:0; margin-bottom:5px; font-size: 32px; text-shadow: 2px 2px 0 #000;">Resultados Finales</h3><table class="results-table"><tr><th>Lugar</th><th>Jugador</th><th>Puntos</th></tr>`;
    
    // --- NUEVO: Inicializamos la variable del ranking ---
    let currentRank = 1;

    sortedPlayers.forEach((p, index) => {
        // --- NUEVO: Cálculo del Dense Ranking ---
        if (index > 0) {
            // Si el jugador actual tiene menos puntos que el anterior, bajamos de posición
            if (p.score < sortedPlayers[index-1].score) {
                currentRank++; 
            }
        }
        
        // --- NUEVO: Asignar color según el lugar ---
        let rankColor = "#FFFFFF"; // Blanco a partir del 4to lugar
        if (currentRank === 1) rankColor = "#FFD700";      // Oro
        else if (currentRank === 2) rankColor = "#C0C0C0"; // Plata
        else if (currentRank === 3) rankColor = "#CD7F32"; // Bronce

        let pColor = getPlayerColor(p.userId);
        
        // Inyectamos el color metálico y el ranking en la primera celda (td)
        resultsHTML += `<tr>
            <td style="text-align:center; font-weight:bold; color: ${rankColor}; text-shadow: 1px 1px 2px #000;">#${currentRank}</td>
            <td>
                <img src="${p.profilePictureUrl}" style="width:30px; height:30px; vertical-align:middle; border-radius:6px; margin-right:8px;">
                <div class="color-box-small" style="background-color: ${pColor};"></div>
                ${p.nickname || p.uniqueId}
            </td>
            <td style="text-align:center; font-weight:bold; color: #FFD700;">${p.score}</td>
        </tr>`;
    });
    resultsHTML += `</table>`;
    resultsBoard.innerHTML = resultsHTML;

    if (colorList.innerHTML === "") {
        let colorsHTML = `<h3 style="text-align:center; margin-top:0; margin-bottom:5px; font-size: 32px; text-shadow: 2px 2px 0 #000;">Comandos de Color</h3><table class="colors-table"><tr><th>Comando</th><th>Color</th></tr>`;
        
        // Aquí puedes seguir ajustando tu lista de memes en el futuro
        let colorNames = ["Niño del OXXO", "Cheems con ansiedad", "Movimiento Naranja (Yuawi)", "Pikachu sorprendido", "Shrek", "Rana René", "Marcianito de la Cumbia", "Mamá Lucha", "Wazowski con dos ojos", "Calamardo guapo", "Burbuja Hola Adiós", "Pantalones de Tienda", "Spiderman Señalando", "Est^p!d@ mi cabello !d!.t@!", "Minion Morado", "Ajolote de 50", "Jabón ZOTE", "Salsa de la que pica", "Niño del OXXO"];
        
        for(let i = 0; i <= 360; i += 20) {
            let cName = colorNames[i/20];
            colorsHTML += `<tr>
                <td style="font-weight:bold;">#color ${i}</td>
                <td>
                    <div class="color-box-small" style="background-color: hsl(${i}, 100%, 50%);"></div>
                    ${cName}
                </td>
            </tr>`;
        }
        colorsHTML += `</table>`;
        colorList.innerHTML = colorsHTML;
    }

    // Activamos la casilla y llamamos a toggleResultsVis para que haga el trabajo de paneles
    if (cb) {
        cb.checked = true;
        toggleResultsVis(); 
    }
}

function toggleResultsVis() {
    let overlay = document.getElementById('results-overlay');
    let cb = document.getElementById('toggle-results-cb');
    if (!overlay || !cb) return;

    if (cb.checked) {
        overlay.classList.remove('hidden');
        document.getElementById('word-list-panel').classList.add('hidden');
        document.getElementById('left-column').classList.remove('playing');
        document.getElementById('left-column').classList.add('showing-results');
    } else {
        overlay.classList.add('hidden');
        // Cuando cerramos los resultados, regresamos todo a la normalidad
        document.getElementById('word-list-panel').classList.remove('hidden');
        document.getElementById('left-column').classList.remove('showing-results');
        
        // Revisamos si el juego está activo para encoger la columna de nuevo
        const setupMenu = document.getElementById('game-setup');
        if (setupMenu && setupMenu.classList.contains('hidden')) {
             document.getElementById('left-column').classList.add('playing');
        }
    }
}




// Try connect when window is loaded
window.addEventListener('load', function() {
	

	explosionEl = document.getElementById("explosion");
	missileEl = document.getElementById("missile");
	dropEl = document.getElementById("drop");
	chatEl = document.getElementById("chat");
	play_pause_el = this.document.getElementById("play-pause-bt");
	barEl = document.getElementById("bar");
	pauseClick();

	//debug();

	initWordSearch(); // <--- INICIAR SOPA DE LETRAS



	connect();
});



window.setInterval(function(){

	actualizar();

	//updateBullets();
	//updateShipList();

	mostrar();

	//updatePowerups();
	//drawPowerUps();
	
}, 1000/FPS)
