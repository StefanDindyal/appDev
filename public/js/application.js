'use strict';
;(function($){

	// Vars declaration
	var dapp, char;
	var database = firebase.database();
	var storage = firebase.storage();
	var storageRef = storage.ref();
	var characters = database.ref('characters');
	var stats = database.ref('stats');

	// Update view when database is updated
	characters.on('value', function(snapshot) {
		$('#characters .list').html(charIntro(snapshot));
	});

	// Form submit data to database and upload avatar image
	$('.add form').on('submit', function(e){
		e.preventDefault();		
		var firstname = $('input[name="firstname"]').val();
		var charId = firstname.trim().toLowerCase().replace(/\W/g, '');
		var lastname = $('input[name="lastname"]').val();
		var campaign = $('input[name="campaign"]').val();
		var avatar = $('input[name="avatar"]').get(0).files[0];
		if(firstname && lastname && campaign && avatar){
			uploadImg(avatar).then(function(snapshot){
				var downloadURL = snapshot.downloadURL;
				writeCharData(charId, firstname, lastname, campaign, downloadURL).then(function(){
					$('.add form').get(0).reset();
				});				
			});			
		} else {
			console.log('Please fill out the form.');
		}				
	});

	// Edit Character form event
	var editChar = '';
	$(document).on('submit', '#edit form', function(e){
		e.preventDefault();
		var charId = editChar.attr('data-key');
		var firstname = $('#edit input[name="firstname"]').val();
		var lastname = $('#edit input[name="lastname"]').val();
		var campaign = $('#edit input[name="campaign"]').val();
		var avatar = $('#edit input[name="avatar"]').get(0).files[0];
		var value = {};
		if(firstname){
			value.firstname = firstname;
		}
		if(lastname){
			value.lastname = lastname;
		}
		if(campaign){
			value.campaign = campaign;
		}		
		if(avatar){
			var oldAvatar = editChar.find('img').attr('src');
			var httpsReference = storage.refFromURL(oldAvatar);
			// Delete avatar image		
			httpsReference.delete().then(function(){
				console.log(httpsReference + ' has been removed');
			}).catch(function(error){
				console.log('Something went wrong', error);
			});
			uploadImg(avatar).then(function(snapshot){
				value.avatar = snapshot.downloadURL;
				updateCharData(charId, value).then(function(){
					$('body #edit').fadeOut(300, function(){
						$(this).remove();	
					});
				});				
			});
		} else {
			updateCharData(charId, value).then(function(){
				$('body #edit').fadeOut(300, function(){
					$(this).remove();	
				});
			});
		}
	});

	// Edit Character event
	$(document).on('click', '.action .edit', function(e){
		e.preventDefault();
		editChar = $(this).parents('.char');
		var firstname = $(this).parents('.char').find('h3').text();
		var lastname = $(this).parents('.char').find('h4').text();
		var name = firstname+' '+lastname;
		$('body').append('<div id="edit"><div class="inner"><div class="close">Close X</div><form><h2>Edit '+name+'</h2><div class="field"><input type="text" name="firstname" value="" placeholder="First Name"></div><div class="field"><input type="text" name="lastname" value="" placeholder="Last Name"></div><div class="field"><input type="text" name="campaign" value="" placeholder="Campaign"></div><div class="field"><input type="file" name="avatar" accept="image/*"></div><div class="field"><input type="submit" name="submit" value="Submit"></div></form></div></div>');
		$('body #edit').fadeIn(300);
	});

	// Edit close event
	$(document).on('click', '#edit .close', function(e){
		$('body #edit').fadeOut(300, function(){
			$(this).remove();	
		});
	});

	// Delete character event
	var sure = false;
	var key = '';
	var avatar = '';
	$(document).on('click', '.action .delete', function(e){
		if(!$(this).hasClass('confirm')){
			key = $(this).parents('.char').attr('data-key');
			avatar = $(this).parents('.char').find('img').attr('src');
		} else {
			sure = true;			
		}
		var firstname = $(this).parents('.char').find('h3').text();
		var lastname = $(this).parents('.char').find('h4').text();
		var name = firstname+' '+lastname;
		var httpsReference = storage.refFromURL(avatar);				
		if(sure == false){
			$('body').append('<div id="sure"><div class="inner"><p>Are you sure you want to delete<br><strong>'+name+'</strong>?</p><div class="action"><a href="#"class="delete confirm">delete</a></div></div></div>');
			$('body #sure').fadeIn(300);
			return false;
		} else {
			$('body #sure').fadeOut(300, function(){
				$(this).remove();	
			});
			sure = false;
		}
		// Delete avatar image		
		httpsReference.delete().then(function(){
			console.log(httpsReference + ' has been removed');
		}).catch(function(error){
			console.log('Something went wrong', error);
		});
		// Delete character
		removeCharData(key).then(function(){
			console.log(key + ' has been removed');
		}).catch(function(error){
			console.log('Error updating', error);
		});
		// Delete character stats
		removeStatData(key).then(function(){
			console.log(key + ' has been removed');
		}).catch(function(error){
			console.log('Error updating', error);
		});
		e.preventDefault();
	});

	// More information about character
	$(document).on('click', '.char h3, .char h4, .char .edge', function(){
		var char = $(this).parents('.char').attr('data-key');
		var basic = {};
		characters.child(char).once('value', function(snapshot){
			var img = snapshot.child('avatar').val();
			var firstname = snapshot.child('firstname').val();
			var lastname = snapshot.child('lastname').val();
			var campaign = snapshot.child('campaign').val();
			var name = firstname + ' ' + lastname;
			var str = '';
			str += '<div class="basic" data-key="'+char+'">';
			str += '<div class="wrap"><div class="pic">';
			str += '<img src="'+img+'"/>';
			str += '</div>';
			str += '<div class="over"><div class="name">'+name+'</div>';
			str += '<div class="campaign">'+campaign+'</div>';
			str += '</div></div><div class="weld"></div></div>';
			$('#view .contents').append(str);
		});

		stats.child(char).on('value', function(snapshot){
			if(snapshot.val() == null){
				stats.child(char).set('').then(function(snapshot){
					$('#view .basic .weld').html(showAllStats(snapshot));
				});				
			} else {
				$('#view .basic .weld').html(showAllStats(snapshot));
			}
		});

		$('body').addClass('cut');
		$('#view').slideDown(300);
	});

	$(document).on('click', '#view .close', function(){		
		$('#view').slideUp(300, function(){
			$('body').removeClass('cut');
			$('#view .contents .basic').remove();
		});
	});

	// Input blur function
	$(document).on('blur', '#view .one li div', function(e){
		e.preventDefault();
		var el = $(this);
		var val = el.text();
		var name = el.attr('data-name');
		var key = el.parents('.basic').attr('data-key');
		var value = {[name]: val};		
		updateStatData(key, value).then(function(){			
			stats.child(key).on('value', function(snapshot) {
				var update = snapshot.child(name).val();					
			});	
		});
		$('#view .one li').removeClass('editing');				
	});

	// Input focus function
	$(document).on('focus', '#view .one li div', function(e){
		e.preventDefault();
		var el = $(this).parents('li');
		el.addClass('editing');
	});

	// Loading bar
	Pace.on('start', function(){		
		$('#loading').show();		
	});
	Pace.on('done', function(){		
		$('#loading').fadeOut(250);		
	});

	// Add to database function
	function writeCharData(charId, firstname, lastname, campaign, imageUrl) {
		return firebase.database().ref('characters/' + charId).set({
			firstname: firstname,
			lastname: lastname,
			campaign: campaign,
			avatar: imageUrl
		});
	}

	// Update to database function
	function updateCharData(charId, value) {
		return firebase.database().ref('characters/' + charId).update(value);
	}		

	// Remove from database function
	function removeCharData(charId) {
		return firebase.database().ref('characters/' + charId).set(null);
	}

	//Add Stats in db
	function writeStatData(charId, value) {
		return firebase.database().ref('stats/' + charId).set(value);
	}

	// Update Stats in db
	function updateStatData(charId, value) {
		return firebase.database().ref('stats/' + charId).update(value);
	}

	// Remove Stats in db
	function removeStatData(charId) {
		return firebase.database().ref('stats/' + charId).set(null);
	}

	// Upload files function with progress tracking
	function uploadImg(file){
		var uploadTask = storageRef.child('avatars/' + new Date().getTime() + file.name).put(file);		
		// Listen for state changes, errors, and completion of the upload.
		uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
		  function(snapshot) {
		    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
		    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
		    console.log('Upload is ' + progress + '% done');
		    switch (snapshot.state) {
		      case firebase.storage.TaskState.PAUSED: // or 'paused'
		        console.log('Upload is paused');
		        break;
		      case firebase.storage.TaskState.RUNNING: // or 'running'
		        console.log('Upload is running');
		        break;
		    }
		  }, function(error) {
		  switch (error.code) {
		    case 'storage/unauthorized':
		      // User doesn't have permission to access the object
		      break;

		    case 'storage/canceled':
		      // User canceled the upload
		      break;

		    case 'storage/unknown':
		      // Unknown error occurred, inspect error.serverResponse
		      break;
		  }
		}, function() {
		  // Upload completed successfully, now we can get the download URL
		  var downloadURL = uploadTask.snapshot.downloadURL;		  
		});
		return uploadTask;
	}

	// Show Character intro
	function charIntro(snapshot){
		var str = '';
		snapshot.forEach(function(data){
			var avatar = data.child('avatar').val();
			var firstname = data.child('firstname').val();
			var lastname = data.child('lastname').val();
			var campaign = data.child('campaign').val();
			str += '<li class="char" data-key="'+data.key+'"><div class="inner">';
			str += '<div class="edge"><img src="'+avatar+'"/></div>';
			str += '<div class="name">'
			str += '<h3>'+firstname+'</h3>';
			if(lastname == ' ' || !lastname){
				str += '<h4>&nbsp;</h4>';
			} else {
				str += '<h4>'+lastname+'</h4>';
			}
			str += '</div>';
			str += '<div class="info">';
			str += '<div class="action"><a href="#" class="edit">edit</a>';
			str += '&nbsp;|&nbsp;';
			str += '<a href="#" class="delete">delete</a></div><span>'+campaign+'</span></div>';
			str += '</div></li>';
		});
		return str;
	}	

	function showAllStats(snap){									
		var str = '';
		str += getStatus(snap);
		str += getCore(snap);
		str += getAbility(snap);
		str += getDefence(snap);
		str += getItems(snap);
		str += getWeapons(snap);		
		str += getAmmo(snap);
		str += getSpells(snap);
		str += getFeats(snap);
		str += getSkills(snap);
		str += getBag(snap);
		return str;
	}

	function getStatus(snap){
		var status = getStatData(snap, 'madness'),
			str = '';
		str += '<div class="one status">';
		str += '<div class="a">';
		str += '<h1>Status</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Madness</strong><div contentEditable="true" data-name="'+status.key+'" >'+status.val+'</div></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getCore(snap){
		var Class = getStatData(snap, 'class'),
			Level = getStatData(snap, 'level'),
			Race = getStatData(snap, 'race'),
			Size = getStatData(snap, 'size'),
			Gender = getStatData(snap, 'gender'),
			Alignment = getStatData(snap, 'alignment'),
			Height = getStatData(snap, 'height'),
			Weight = getStatData(snap, 'weight'),
			Hp = getStatData(snap, 'hp'),
			str = '';
		str += '<div class="one base">';
		str += '<div class="a">';
		str += '<h1>Core</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Class</strong><div contentEditable="true" data-name="'+Class.key+'" >'+Class.val+'</div></li>';
		str += '<li><strong>Level</strong><div contentEditable="true" data-name="'+Level.key+'" >'+Level.val+'</div></li>';
		str += '<li><strong>Race</strong><div contentEditable="true" data-name="'+Race.key+'" >'+Race.val+'</div></li>';
		str += '<li><strong>Size</strong><div contentEditable="true" data-name="'+Size.key+'" >'+Size.val+'</div></li>';
		str += '<li><strong>Gender</strong><div contentEditable="true" data-name="'+Gender.key+'" >'+Gender.val+'</div></li>';
		str += '<li><strong>Alignment</strong><div contentEditable="true" data-name="'+Alignment.key+'" >'+Alignment.val+'</div></li>';
		str += '<li><strong>Height</strong><div contentEditable="true" data-name="'+Height.key+'" >'+Height.val+'</div></li>';
		str += '<li><strong>Weight</strong><div contentEditable="true" data-name="'+Weight.key+'" >'+Weight.val+'</div></li>';
		str += '<li><strong>HP</strong><div contentEditable="true" data-name="'+Hp.key+'" >'+Hp.val+'</div></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getAbility(snap){
		var stre = getStatData(snap, 'str'),
			dex = getStatData(snap, 'dex'),
			con = getStatData(snap, 'con'),
			int = getStatData(snap, 'int'),
			wis = getStatData(snap, 'wis'),
			cha = getStatData(snap, 'cha'),
			speed = getStatData(snap, 'speed'),
			init = getStatData(snap, 'init'),
			grapple = getStatData(snap, 'grapple'),
			str = '';
		str += '<div class="one ability">';
		str += '<div class="a">';
		str += '<h1>Ability Scores</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Str</strong><div contentEditable="true" data-name="'+stre.key+'" >'+stre.val+'</div><span class="mod">&nbsp;'+getMod(stre.val)+'</span></li>';
		str += '<li><strong>Dex</strong><div contentEditable="true" data-name="'+dex.key+'" >'+dex.val+'</div><span class="mod">&nbsp;'+getMod(dex.val)+'</span></li>';
		str += '<li><strong>Con</strong><div contentEditable="true" data-name="'+con.key+'" >'+con.val+'</div><span class="mod">&nbsp;'+getMod(con.val)+'</span></li>';
		str += '<li><strong>Int</strong><div contentEditable="true" data-name="'+int.key+'" >'+int.val+'</div><span class="mod">&nbsp;'+getMod(int.val)+'</span></li>';
		str += '<li><strong>Wis</strong><div contentEditable="true" data-name="'+wis.key+'" >'+wis.val+'</div><span class="mod">&nbsp;'+getMod(wis.val)+'</span></li>';
		str += '<li><strong>Cha</strong><div contentEditable="true" data-name="'+cha.key+'" >'+cha.val+'</div><span class="mod">&nbsp;'+getMod(cha.val)+'</span></li>';
		str += '<li><strong>Speed</strong><div contentEditable="true" data-name="'+speed.key+'" >'+speed.val+'</div><span class="mod">&nbsp;ft</span></li>';
		str += '<li><strong>Init</strong><span class="mod">+</span><div contentEditable="true" data-name="'+init.key+'" >'+init.val+'</div></li>';
		str += '<li><strong>Grapple</strong><span class="mod">+</span><div contentEditable="true" data-name="'+grapple.key+'" >'+grapple.val+'</div></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getDefence(snap){
		var fort = getStatData(snap, 'fort'),
			refl = getStatData(snap, 'refl'),
			will = getStatData(snap, 'will'),
			ac = getStatData(snap, 'ac'),
			flat = getStatData(snap, 'flatac'),
			touch = getStatData(snap, 'touchac'),
			arm = getStatData(snap, 'armor'),
			armClass = getStatData(snap, 'armclass'),
			armBonus = getStatData(snap, 'armbonus'),
			armPenalty = getStatData(snap, 'armpenalty'),
			armWeight = getStatData(snap, 'armweight'),
			str = '';
		str += '<div class="one defence">';
		str += '<div class="a">';
		str += '<h1>Saves / AC</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Fort</strong><div contentEditable="true" data-name="'+fort.key+'" >'+fort.val+'</div></li>';
		str += '<li><strong>Refl</strong><div contentEditable="true" data-name="'+refl.key+'" >'+refl.val+'</div></li>';
		str += '<li><strong>Will</strong><div contentEditable="true" data-name="'+will.key+'" >'+will.val+'</div></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>AC</strong><div contentEditable="true" data-name="'+ac.key+'" >'+ac.val+'</div></li>';
		str += '<li><strong>Flat AC</strong><div contentEditable="true" data-name="'+flat.key+'" >'+flat.val+'</div></li>';
		str += '<li><strong>Touch AC</strong><div contentEditable="true" data-name="'+touch.key+'" >'+touch.val+'</div></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>Armor</strong><div contentEditable="true" data-name="'+arm.key+'" >'+arm.val+'</div></li>';
		str += '<li><strong>Arm Class</strong><div contentEditable="true" data-name="'+armClass.key+'" >'+armClass.val+'</div></li>';
		str += '<li><strong>Arm Stat+</strong><div contentEditable="true" data-name="'+armBonus.key+'" >'+armBonus.val+'</div></li>';
		str += '<li><strong>Arm Penalty</strong><div contentEditable="true" data-name="'+armPenalty.key+'" >'+armPenalty.val+'</div></li>';
		str += '<li><strong>Arm Weight</strong><div contentEditable="true" data-name="'+armWeight.key+'" >'+armWeight.val+'</div></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getItems(snap){
		var wHead = getStatData(snap, 'head'),
			wEyes = getStatData(snap, 'eyes'),
			wNeck = getStatData(snap, 'neck'),
			wShoulders = getStatData(snap, 'shoulders'),
			wRing1 = getStatData(snap, 'ring1'),
			wRing2 = getStatData(snap, 'ring2'),
			wHands = getStatData(snap, 'hands'),
			wWrists = getStatData(snap, 'wrists'),
			wBody = getStatData(snap, 'body'),
			wTorso = getStatData(snap, 'torso'),
			wWaist = getStatData(snap, 'waist'),
			wFeet = getStatData(snap, 'feet'),
			str = '';
		str += '<div class="one worn">';
		str += '<div class="a">';
		str += '<h1>Items Worn</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Head</strong><div contentEditable="true" data-name="'+wHead.key+'" >'+wHead.val+'</div></li>';
		str += '<li><strong>Eyes</strong><div contentEditable="true" data-name="'+wEyes.key+'" >'+wEyes.val+'</div></li>';
		str += '<li><strong>Neck</strong><div contentEditable="true" data-name="'+wNeck.key+'" >'+wNeck.val+'</div></li>';
		str += '<li><strong>Shoulders</strong><div contentEditable="true" data-name="'+wShoulders.key+'" >'+wShoulders.val+'</div></li>';
		str += '<li><strong>Ring 1</strong><div contentEditable="true" data-name="'+wRing1.key+'" >'+wRing1.val+'</div></li>';
		str += '<li><strong>Ring 2</strong><div contentEditable="true" data-name="'+wRing2.key+'" >'+wRing2.val+'</div></li>';
		str += '<li><strong>Hands</strong><div contentEditable="true" data-name="'+wHands.key+'" >'+wHands.val+'</div></li>';
		str += '<li><strong>Wrists</strong><div contentEditable="true" data-name="'+wWrists.key+'" >'+wWrists.val+'</div></li>';
		str += '<li><strong>Body</strong><div contentEditable="true" data-name="'+wBody.key+'" >'+wBody.val+'</div></li>';
		str += '<li><strong>Torso</strong><div contentEditable="true" data-name="'+wTorso.key+'" >'+wTorso.val+'</div></li>';
		str += '<li><strong>Waist</strong><div contentEditable="true" data-name="'+wWaist.key+'" >'+wWaist.val+'</div></li>';
		str += '<li><strong>Feet</strong><div contentEditable="true" data-name="'+wFeet.key+'" >'+wFeet.val+'</div></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getWeapons(snap){
		var w1 = getStatData(snap, 'slot1'),
			w2 = getStatData(snap, 'slot2'),
			w3 = getStatData(snap, 'slot3'),
			w4 = getStatData(snap, 'slot4'),
			w5 = getStatData(snap, 'slot5'),
			w6 = getStatData(snap, 'shieldslot'),
			str = '';
		str += '<div class="one equiped">';
		str += '<div class="a">';
		str += '<h1>Weapons / Sheilds</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Slot 1</strong><div contentEditable="true" data-name="'+w1.key+'" >'+w1.val+'</div></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>Slot 2</strong><div contentEditable="true" data-name="'+w2.key+'" >'+w2.val+'</div></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>Slot 3</strong><div contentEditable="true" data-name="'+w3.key+'" >'+w3.val+'</div></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>Slot 4</strong><div contentEditable="true" data-name="'+w4.key+'" >'+w4.val+'</div></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>Slot 5</strong><div contentEditable="true" data-name="'+w5.key+'" >'+w5.val+'</div></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>Shield Slot</strong><div contentEditable="true" data-name="'+w6.key+'" >'+w6.val+'</div></li>';		
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getAmmo(snap){
		var str = '';
		str += '<div class="one ammo">';
		str += '<div class="a">';
		str += '<h1>Ammunition</h1>';
		str += '<div class="add"><a href="#">+ Add Ammo</a></div>';
		str += '<ul class="list">';	
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getSpells(snap){
		var str = '';
		str += '<div class="one spells">';
		str += '<div class="a">';
		str += '<h1>Spells</h1>';
		str += '<div class="add"><a href="#">+ Add Spells</a></div>';
		str += '<ul class="list">';	
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getFeats(snap){
		var str = '';
		str += '<div class="one feats">';
		str += '<div class="a">';
		str += '<h1>Feats</h1>';
		str += '<div class="add"><a href="#">+ Add Feats</a></div>';
		str += '<ul class="list">';	
		str += '</ul>';
		str += '</div>';
		str += '</div>';		
		return str;
	}

	function getSkills(snap){
		var str = '';
		str += '<div class="one skills">';
		str += '<div class="a">';
		str += '<h1>Skills</h1>';
		str += '<div class="add"><a href="#">+ Add Skills</a></div>';
		str += '<ul class="list">';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getBag(snap){
		var str = '';
		str += '<div class="one bag">';
		str += '<div class="a">';
		str += '<h1>Inventory</h1>';
		str += '<div class="add"><a href="#">+ Add Item</a></div>';
		str += '<ul class="list">';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		return str;
	}

	function getStatData(snap, name){
		var str = '';
		if(snap && name){
			if(snap.child(name).val()){
				str = snap.child(name).val();	
			} else {
				str = '?';
			}		
		} else {
			str = '?';
		}
		return {			
			key: name,
			val: str
		}
	}

	function getMod(ability){
		var ability = (ability*1) || 0, mod = 0, str = '(+0)';
		if(ability > 10){
			mod = Math.floor((ability - 10)/2);
			str = '(+'+mod+')';
		}
		return str;
	}

	function takeOverWorld(msg){
		var str = msg || 'Doles';
		return str;
	}

	console.log(takeOverWorld('liquid licks and squish picks. oh wondrous lips and moist tips. dripping dripping, oh how they drip.'));

})(jQuery);