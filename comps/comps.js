'use strict';
!(function($){

	$('.weapons ul').append(weaponList(char));

	function weaponList(data){
		var weapons = data.weapons,
			list = '';
		for (var i = 0; i < weapons.length; i++) {		
			var weapon = weaponItem(weapons[i]);
			list += weapon;		
		}
		return list;
	}

	function weaponItem(data){
		var name = data.name,
			img = data.img,
			hit = data.hit,
			crit = data.critical,
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
		str += '<li class="weapon"><div class="tile">';		
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
		str += '<div class="point crit">'+crit+'</div>',
		str += '<div class="point damage">',
		str += '<span class="type"><i class="lightning icon"></i></span>',
		str += '<span class="rolls">'+dmgRoll+'</span>',
		str += '<span class="die">'+dmgDie+'</span>',
		str += '</div>',
		str += '<div class="point armor"><span class="ac">'+armor+'</span></div>',
		str += '<div class="point equip">'+equipped+'</div>',
		str += '</div></li>';
		return str;
	}

})(jQuery);