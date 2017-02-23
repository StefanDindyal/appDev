'use strict';
!(function($){

	var database = firebase.database();
	var weapons = database.ref('weapons');

	weapons.on('value', function(snapshot) {
		// $('.weapons ul').append(weaponList(char));
		console.log(snapshot);
	});

	function createWeapon(charId, firstname, lastname, campaign, imageUrl) {
		return firebase.database().ref('weapons/' + charId).set({
			firstname: firstname,
			lastname: lastname,
			campaign: campaign,
			avatar: imageUrl
		});
	}

	function equip(data){

	}

	function weaponList(data){
		var weapons = data.weapons,
			list = '';
		for (var i = 0; i < weapons.length; i++) {		
			var weapon = weaponItemList(weapons[i]);
			list += weapon;		
		}
		return list;
	}

	function weaponItemList(data){
		var name = data.name,
			img = data.img,
			hit = data.hit,
			critRoll = data.critical.roll,
			critMod = data.critical.mod,
			dmgRoll = data.damage.rolls,
			dmgDie = data.damage.die,
			dmgType = data.damage.type,
			range = data.range,
			type = data.type,
			armor = data.armor,
			ability = data.ability,
			flavor = data.flavor,
			equipped = data.equipped,
			str = '';
		str += '<li class="weapon '+equipped+'"><div class="tile">';		
		if(img){
			str += '<div class="point img"><img src="'+img+'" alt="'+name+'"/></div>';	
		} else {
			str += '<div class="point img"><i class="upload icon"></i></div>';
		}		
		str += '<div class="point name"><h1>'+name+'</h1></div>',
		str += '<div class="stats">',
		str += '<div class="point hit">Weapon Bonus: <span class="value">+'+hit+'</span></div>',
		str += '<div class="point crit">Critical Roll: <span class="value">'+critRoll+'</span></div>',
		str += '<div class="point mod">Critical Bonus: <span class="value">x'+critMod+'</span></div>',
		str += '<div class="point damage">Weapon Damage: <span class="value">',
		str += '<span class="type"><i class="lightning icon"></i></span>',
		str += '<span class="rolls">'+dmgRoll+' </span>',
		str += '<span class="die">'+dmgDie+'</span></span>',
		str += '</div>',
		str += '<div class="point armor">Armor Bonus: <span class="value"><span class="ac">+'+armor+'</span></span></div>',
		str += '<div class="equipped"><i class="linkify icon"></i></div>',
		str += '</div></div></li>';
		return str;
	}

	function weaponItemCard(data){
		var name = data.name,
			img = data.img,
			hit = data.hit,
			critRoll = data.critical.roll,
			critMod = data.critical.mod,
			dmgRoll = data.damage.rolls,
			dmgDie = data.damage.die,
			dmgType = data.damage.type,
			range = data.range,
			type = data.type,
			armor = data.armor,
			ability = data.ability,
			flavor = data.flavor,
			equipped = data.equipped,
			str = '';
		str += '<li class="weapon '+equipped+'"><div class="tile">';		
		if(img){
			str += '<div class="point img"><img src="'+img+'" alt="'+name+'"/></div>';	
		} else {
			str += '<div class="point img"><i class="upload icon"></i></div>';
		}		
		str += '<div class="point name"><h1>'+name+'</h1></div>',
		str += '<div class="point text">',
		str += '<div class="copy type"><p>'+type+'</p></div>',
		str += '<div class="copy range"><p>'+range+' ft</p></div>',
		str += '<div class="copy ability"><p>'+ability+'</p></div>',
		str += '<div class="copy flavor"><p>'+flavor+'</p></div>',		
		str += '</div>',
		str += '<div class="point hit">+'+hit+'</div>',
		str += '<div class="point crit">('+critRoll+') <span class="mod">x'+critMod+'</span></div>',
		str += '<div class="point damage">',
		str += '<span class="type"><i class="lightning icon"></i></span>',
		str += '<span class="rolls">('+dmgRoll+')</span>',
		str += '<span class="die">'+dmgDie+'</span>',
		str += '</div>',
		str += '<div class="point armor"><span class="ac">'+armor+'</span></div>',
		str += '</div></li>';
		return str;
	}

})(jQuery);