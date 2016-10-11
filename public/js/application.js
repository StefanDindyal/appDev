'use strict';
;(function($){

	var dapp, char;
	var database = firebase.database();
	var storage = firebase.storage();
	var storageRef = storage.ref();
	var characters = database.ref('characters');
	var stats = database.ref('stats');
	
	// stats.child('abram').update({time:50});

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
		editChar = $(this).parents('.char');
		var firstname = $(this).parents('.char').find('h3').text();
		var lastname = $(this).parents('.char').find('h4').text();
		var name = firstname+' '+lastname;
		$('body').append('<div id="edit"><div class="inner"><div class="close">Close X</div><form><h2>Edit '+name+'</h2><div class="field"><input type="text" name="firstname" value="" placeholder="First Name"></div><div class="field"><input type="text" name="lastname" value="" placeholder="Last Name"></div><div class="field"><input type="text" name="campaign" value="" placeholder="Campaign"></div><div class="field"><input type="file" name="avatar" accept="image/*"></div><div class="field"><input type="submit" name="submit" value="Submit"></div></form></div></div>');
		$('body #edit').fadeIn(300);
		return false;	
		e.preventDefault();
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
			str += '<div class="add"><a href="#">Add Info</a></div>';
			str += '</div></div><div class="weld"></div></div>';
			$('#view .contents').append(str);
		});

		stats.child(char).once('value', function(snapshot){
			if(snapshot.val() != null){
				$('#view .contents .add').hide();
				$('#view .basic .weld').html(showBase(snapshot));
			}			
		});

		console.log('learn more');
		$('body').addClass('cut');
		$('#view').fadeIn(300);
	});



	$(document).on('click', '#view .close', function(){
		console.log('closed');				
		$('#view').fadeOut(300, function(){
			$('body').removeClass('cut');
			$('#view .contents .basic').remove();
		});
	});

	$(document).on('click', '#view .add', function(e){
		e.preventDefault();
		console.log('adding stats');		
		var str = '';
		str += '<form>';
		str += '<div><label>Class</label><input type="text" name="class"></div>';
		str += '<div><label>Level</label><input type="text" name="level"></div>';
		str += '<div><label>Race</label><input type="text" name="race"></div>';
		str += '<div><label>Size</label><input type="text" name="size"></div>';
		str += '<div><label>Gender</label><input type="text" name="gender"></div>';
		str += '<div><label>Alignment</label><input type="text" name="alignment"></div>';
		str += '<div><label>Height</label><input type="text" name="height"></div>';
		str += '<div><label>Weight</label><input type="text" name="weight"></div>';
		str += '<div><label>HP</label><input type="text" name="hp"></div>';	
		str += '<div><input type="submit" value="Submit"></div>'
		str += '</form>';
		if($(this).find('a').hasClass('open')){
			$(this).find('a').removeClass();
			$('.basic form').remove();
			$('#view .add a').text('Add Info');			
		} else {
			$(this).find('a').addClass('open');
			$('.basic').append(str);
			$('#view .add a').text('Never mind');
		}	
	});

	$(document).on('submit', '#view form', function(e){
		e.preventDefault();
		var charId = $(this).parents('.basic').attr('data-key');
		var values = {};
		$(this).find('input').each(function(){
			if($(this).attr('type') == 'text'){
				var key = $(this).attr('name');
				var val = $(this).val();
				values[key] = val;
			}
		});
		writeStatData(charId, values).then(function(snapshot){			
			$('#view form').remove();
			$('#view .add a').hide();						
		});
		stats.child(charId).on('value', function(snapshot) {
			$('#view .basic .weld').html(showBase(snapshot));
		});	
	});

	$(document).on('blur', '#view .base input', function(e){
		e.preventDefault();
		var el = $(this);
		var val = el.val();
		var name = el.attr('name');
		var key = el.parents('.basic').attr('data-key');
		var keyin = el.parents('li').find('span').text();
		var thisLi = el.parents('li').find('.node');
		var value = {[name]: val};
		if(value[name] == ''){
			console.log('no change');
			el.parents('li').find('input').remove();
			thisLi.text(keyin).show();
		} else {
			console.log('change');
			updateStatData(key, value).then(function(){			
				stats.child(key).on('value', function(snapshot) {
					var update = snapshot.child(name).val();
					el.parents('li').find('input').hide().remove();
					thisLi.text(update).show();
				});	
			});
		}				
	});

	$(document).on('click', '.node', function(e){
		e.preventDefault();
		var el = $(this).parents('li');
		var key = el.find('strong').text().toLowerCase();
		var cur = el.find('span').text();		
		el.find('.node').hide();
		el.append('<input type="text" name="'+key+'" placeholder="'+cur+'" contenteditable="true">');
		el.find('input').focus();
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

	function showBase(snapshot){
		var Class = snapshot.child('class').val() || '?';
		var Level = snapshot.child('level').val() || '?';
		var Race = snapshot.child('race').val() || '?';
		var Size = snapshot.child('size').val() || '?';
		var Gender = snapshot.child('gender').val() || '?';
		var Alignment = snapshot.child('alignment').val() || '?';
		var Height = snapshot.child('height').val() || '?';
		var Weight = snapshot.child('weight').val() || '?';
		var Hp = snapshot.child('hp').val() || '?';
		var str = '';
		str += '<div class="base">';
		str += '<h1>Core</h1>';
		str += '<ul class="list">';
		str += '<li><strong>Class</strong><span class="node">'+Class+'</span></li>';
		str += '<li><strong>Level</strong><span class="node">'+Level+'</span></li>';
		str += '<li><strong>Race</strong><span class="node">'+Race+'</span></li>';
		str += '<li><strong>Size</strong><span class="node">'+Size+'</span></li>';
		str += '<li><strong>Gender</strong><span class="node">'+Gender+'</span></li>';
		str += '<li><strong>Alignment</strong><span class="node">'+Alignment+'</span></li>';
		str += '<li><strong>Height</strong><span class="node">'+Height+'</span></li>';
		str += '<li><strong>Weight</strong><span class="node">'+Weight+'</span></li>';
		str += '<li><strong>HP</strong><span class="node">'+Hp+'</span></li>';
		str += '</ul>';
		str += '</div>';
		return str;
	}

})(jQuery);