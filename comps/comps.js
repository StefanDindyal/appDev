'use strict';
!(function($){

	var database = firebase.database();
	var weapons = database.ref('weapons');

	weapons.on('value', function(snapshot) {		
		console.log(snapshot);
		$('.weapons ul').html(weaponList(snapshot));
	});

	$('.weapons form').on('submit', function(e){
		var f = $(this);
		var name = f.find('input[name="name"]').val() || null;
		var img = f.find('input[name="img"]').val() || null;
		var hit = f.find('input[name="hit"]').val() || null;
		var critRoll = f.find('input[name="crit_roll"]').val() || null;
		var critMod = f.find('input[name="crit_mod"]').val() || null;
		var dmgRoll = f.find('input[name="dmg_roll"]').val() || null;
		var dmgDie = f.find('select[name="dmg_die"]').val() || null;
		var dmgType = f.find('select[name="dmg_type"]').val() || null;
		var range = f.find('input[name="range"]').val() || null;
		var type = f.find('select[name="type"]').val() || null;
		var armor = f.find('input[name="armor"]').val() || null;
		var ability = f.find('input[name="ability"]').val() || null;
		var flavor = f.find('input[name="flavor"]').val() || null;
		var equipped = 'no';
		createWeapon(name, img, hit, critRoll, critMod, dmgRoll, dmgDie, dmgType, range, type, armor, ability, flavor, equipped).then(function(){
			$('.weapons form').get(0).reset();
		});
		e.preventDefault();
	});

	function createWeapon(name, img, hit, critRoll, critMod, dmgRoll, dmgDie, dmgType, range, type, armor, ability, flavor, equipped) {
		var weaponData = {
			name: name,
			img: img,
			hit: hit,
			critical: {roll: critRoll, mod: critMod},
			damage: {rolls: dmgRoll, die: dmgDie, type: dmgType},
			range: range,
			type: type,
			armor: armor,
			ability: ability,
			flavor: flavor,
			equipped: equipped
		};
		var newWeapon = weapons.push();
		var weaponKey = newWeapon.key;
		console.log('my new shiny id is '+newWeapon.key);
		return firebase.database().ref('weapons/' + weaponKey).update(weaponData);
	}

	function equip(data){

	}

	function weaponList(data){
		var weapons = data,
			list = '';
		weapons.forEach(function(element, array, index){
			var weapon = weaponItemList(element);
			list += weapon;		
		});
		return list;
	}

	function weaponItemList(data){
		var name = data.child('name').val(),
			img = data.child('img').val(),
			hit = data.child('hit').val(),
			critRoll = data.child('critical/roll').val(),
			critMod = data.child('critical/mod').val(),
			dmgRoll = data.child('damage/rolls').val(),
			dmgDie = data.child('damage/die').val(),
			dmgType = data.child('damage/type').val(),
			range = data.child('range').val(),
			type = data.child('type').val(),
			armor = data.child('armor').val(),
			ability = data.child('ability').val(),
			flavor = data.child('flavor').val(),
			equipped = data.child('equipped').val(),
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