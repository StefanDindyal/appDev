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

		stats.child(char).once('value', function(snapshot){
			if(snapshot.val() == null){
				stats.child(char).set('').then(function(snapshot){
					$('#view .basic .weld').html(showAllStats(snapshot));
				});				
			} else {
				$('#view .basic .weld').html(showAllStats(snapshot));
			}
		});

		$('body').addClass('cut');
		$('#view').show(300);
	});

	$(document).on('click', '#view .close', function(){
		console.log('closed');				
		$('#view').hide(300, function(){
			$('body').removeClass('cut');
			$('#view .contents .basic').remove();
		});
	});

	// Input blur function
	$(document).on('blur', '#view .one input', function(e){
		e.preventDefault();
		var el = $(this);
		var val = el.val();
		var name = el.attr('name');
		var key = el.parents('.basic').attr('data-key');
		var value = {[name]: val};
		if(value[name] == val){
			console.log('no change');			
		} else {
			console.log('change');
			updateStatData(key, value).then(function(){			
				stats.child(key).on('value', function(snapshot) {
					var update = snapshot.child(name).val();
					console.log(update);					
				});	
			});
		}
		$('#view .one li').removeClass('editing');				
	});

	// Input focus function
	$(document).on('focus', '#view .one input', function(e){
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
		var Class = getStatData(snap, 'class'),
			Level = getStatData(snap, 'level'),
			Race = getStatData(snap, 'race'),
			Size = getStatData(snap, 'size'),
			Gender = getStatData(snap, 'gender'),
			Alignment = getStatData(snap, 'alignment'),
			Height = getStatData(snap, 'height'),
			Weight = getStatData(snap, 'weight'),
			Hp = getStatData(snap, 'hp'),
			stre = getStatData(snap, 'str'),
			dex = getStatData(snap, 'dex'),
			con = getStatData(snap, 'con'),
			int = getStatData(snap, 'int'),
			wis = getStatData(snap, 'wis'),
			cha = getStatData(snap, 'cha'),
			speed = getStatData(snap, 'speed'),
			init = getStatData(snap, 'init'),
			grapple = getStatData(snap, 'grapple'),
			fort = getStatData(snap, 'fort'),
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
			status = getStatData(snap, 'madness'),
			wHead = getStatData(snap, 'head'),
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
			w1 = getStatData(snap, 'slot1'),
			w2 = getStatData(snap, 'slot2'),
			w3 = getStatData(snap, 'slot3'),
			w4 = getStatData(snap, 'slot4'),
			w5 = getStatData(snap, 'slot5'),
			w6 = getStatData(snap, 'shieldslot'),
			f1 = getStatData(snap, 'feat1'),			
			str = '';
		str += '<div class="one status">';
		str += '<div class="a">';
		str += '<h1>Status</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Madness</strong><input type="text" name="'+status.key+'" value="'+status.val+'" contenteditable="true"></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		str += '<div class="one base">';
		str += '<div class="a">';
		str += '<h1>Core</h1>';
		str += '<ul class="list">';
		// <input type="text" name="'+key+'" value="'+cur+'" contenteditable="true">
		str += '<li><strong>Class</strong><input type="text" name="'+Class.key+'" value="'+Class.val+'" contenteditable="true"></li>';
		str += '<li><strong>Level</strong><input type="text" name="'+Level.key+'" value="'+Level.val+'" contenteditable="true"></li>';
		str += '<li><strong>Race</strong><input type="text" name="'+Race.key+'" value="'+Race.val+'" contenteditable="true"></li>';
		str += '<li><strong>Size</strong><input type="text" name="'+Size.key+'" value="'+Size.val+'" contenteditable="true"></li>';
		str += '<li><strong>Gender</strong><input type="text" name="'+Gender.key+'" value="'+Gender.val+'" contenteditable="true"></li>';
		str += '<li><strong>Alignment</strong><input type="text" name="'+Alignment.key+'" value="'+Alignment.val+'" contenteditable="true"></li>';
		str += '<li><strong>Height</strong><input type="text" name="'+Height.key+'" value="'+Height.val+'" contenteditable="true"></li>';
		str += '<li><strong>Weight</strong><input type="text" name="'+Weight.key+'" value="'+Weight.val+'" contenteditable="true"></li>';
		str += '<li><strong>HP</strong><input type="text" name="'+Hp.key+'" value="'+Hp.val+'" contenteditable="true"></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		str += '<div class="one ability">';
		str += '<div class="a">';
		str += '<h1>Ability Scores</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Str</strong><input type="text" name="'+stre.key+'" value="'+stre.val+'" contenteditable="true"></li>';
		str += '<li><strong>Dex</strong><input type="text" name="'+dex.key+'" value="'+dex.val+'" contenteditable="true"></li>';
		str += '<li><strong>Con</strong><input type="text" name="'+con.key+'" value="'+con.val+'" contenteditable="true"></li>';
		str += '<li><strong>Int</strong><input type="text" name="'+int.key+'" value="'+int.val+'" contenteditable="true"></li>';
		str += '<li><strong>Wis</strong><input type="text" name="'+wis.key+'" value="'+wis.val+'" contenteditable="true"></li>';
		str += '<li><strong>Cha</strong><input type="text" name="'+cha.key+'" value="'+cha.val+'" contenteditable="true"></li>';
		str += '<li><strong>Speed</strong><input type="text" name="'+speed.key+'" value="'+speed.val+'" contenteditable="true"></li>';
		str += '<li><strong>Init</strong><input type="text" name="'+init.key+'" value="'+init.val+'" contenteditable="true"></li>';
		str += '<li><strong>Grapple</strong><input type="text" name="'+grapple.key+'" value="'+grapple.val+'" contenteditable="true"></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		str += '<div class="one defence">';
		str += '<div class="a">';
		str += '<h1>Saves / AC</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Fort</strong><input type="text" name="'+fort.key+'" value="'+fort.val+'" contenteditable="true"></li>';
		str += '<li><strong>Refl</strong><input type="text" name="'+refl.key+'" value="'+refl.val+'" contenteditable="true"></li>';
		str += '<li><strong>Will</strong><input type="text" name="'+will.key+'" value="'+will.val+'" contenteditable="true"></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>AC</strong><input type="text" name="'+ac.key+'" value="'+ac.val+'" contenteditable="true"></li>';
		str += '<li><strong>Flat AC</strong><input type="text" name="'+flat.key+'" value="'+flat.val+'" contenteditable="true"></li>';
		str += '<li><strong>Touch AC</strong><input type="text" name="'+touch.key+'" value="'+touch.val+'" contenteditable="true"></li>';
		str += '<li class="empty"></li>';
		str += '<li><strong>Armor</strong><input type="text" name="'+arm.key+'" value="'+arm.val+'" contenteditable="true"></li>';
		str += '<li><strong>Arm Class</strong><input type="text" name="'+armClass.key+'" value="'+armClass.val+'" contenteditable="true"></li>';
		str += '<li><strong>Arm Stat+</strong><input type="text" name="'+armBonus.key+'" value="'+armBonus.val+'" contenteditable="true"></li>';
		str += '<li><strong>Arm Penalty</strong><input type="text" name="'+armPenalty.key+'" value="'+armPenalty.val+'" contenteditable="true"></li>';
		str += '<li><strong>Arm Weight</strong><input type="text" name="'+armWeight.key+'" value="'+armWeight.val+'" contenteditable="true"></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		str += '<div class="one worn">';
		str += '<div class="a">';
		str += '<h1>Items Worn</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Head</strong><input type="text" name="'+wHead.key+'" value="'+wHead.val+'" contenteditable="true"></li>';
		str += '<li><strong>Eyes</strong><input type="text" name="'+wEyes.key+'" value="'+wEyes.val+'" contenteditable="true"></li>';
		str += '<li><strong>Neck</strong><input type="text" name="'+wNeck.key+'" value="'+wNeck.val+'" contenteditable="true"></li>';
		str += '<li><strong>Shoulders</strong><input type="text" name="'+wShoulders.key+'" value="'+wShoulders.val+'" contenteditable="true"></li>';
		str += '<li><strong>Ring 1</strong><input type="text" name="'+wRing1.key+'" value="'+wRing1.val+'" contenteditable="true"></li>';
		str += '<li><strong>Ring 2</strong><input type="text" name="'+wRing2.key+'" value="'+wRing2.val+'" contenteditable="true"></li>';
		str += '<li><strong>Hands</strong><input type="text" name="'+wHands.key+'" value="'+wHands.val+'" contenteditable="true"></li>';
		str += '<li><strong>Wrists</strong><input type="text" name="'+wWrists.key+'" value="'+wWrists.val+'" contenteditable="true"></li>';
		str += '<li><strong>Body</strong><input type="text" name="'+wBody.key+'" value="'+wBody.val+'" contenteditable="true"></li>';
		str += '<li><strong>Torso</strong><input type="text" name="'+wTorso.key+'" value="'+wTorso.val+'" contenteditable="true"></li>';
		str += '<li><strong>Waist</strong><input type="text" name="'+wWaist.key+'" value="'+wWaist.val+'" contenteditable="true"></li>';
		str += '<li><strong>Feet</strong><input type="text" name="'+wFeet.key+'" value="'+wFeet.val+'" contenteditable="true"></li>';
		str += '</ul>';
		str += '</div>';
		str += '</div>';		
		str += '<div class="one equiped">';
		str += '<div class="a">';
		str += '<h1>Weapons / Sheilds</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Slot 1</strong><input type="text" name="'+w1.key+'" value="'+w1.val+'" contenteditable="true"></li>';
		str += '<li><strong>Slot 2</strong><input type="text" name="'+w2.key+'" value="'+w2.val+'" contenteditable="true"></li>';
		str += '<li><strong>Slot 3</strong><input type="text" name="'+w3.key+'" value="'+w3.val+'" contenteditable="true"></li>';
		str += '<li><strong>Slot 4</strong><input type="text" name="'+w4.key+'" value="'+w4.val+'" contenteditable="true"></li>';
		str += '<li><strong>Slot 5</strong><input type="text" name="'+w5.key+'" value="'+w5.val+'" contenteditable="true"></li>';
		str += '<li><strong>Shield Slot</strong><input type="text" name="'+w6.key+'" value="'+w6.val+'" contenteditable="true"></li>';		
		str += '</ul>';
		str += '</div>';
		str += '</div>';
		str += '<div class="one Feats">';
		str += '<div class="a">';
		str += '<h1>Feats</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Feat 1</strong><input type="text" name="'+f1.key+'" value="'+f1.val+'" contenteditable="true"></li>';			
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

})(jQuery);