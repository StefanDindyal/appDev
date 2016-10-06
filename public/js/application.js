'use strict';
;(function($){

	var dapp, char;
	var database = firebase.database();
	var storage = firebase.storage();
	var storageRef = storage.ref();
	var characters = database.ref('characters');
	
	// Update view when database is updated
	characters.on('value', function(snapshot) {
		var str = '';
		snapshot.forEach(function(data){
			var avatar = data.child('avatar').val();
			var firstname = data.child('firstname').val();
			var lastname = data.child('lastname').val();
			var campaign = data.child('campaign').val();
			str += '<li class="char" data-key="'+data.key+'">';
			str += '<div class="edge"><img src="'+avatar+'"/></div>';
			str += '<h3>'+firstname+'</h3>';
			str += '<h4>'+lastname+'</h4>';
			str += '<div class="info">';
			str += '<div class="action"><a href="#" class="edit">edit</a>';
			str += '&nbsp;|&nbsp;';
			str += '<a href="#" class="delete">delete</a></div><span>'+campaign+'</span></div>';
			str += '</li>';
		});
		$('#characters .list').html(str);
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
		$('body').append('<div id="edit"><div class="inner"><form><h2>Edit '+name+'</h2><div class="field"><input type="text" name="firstname" value="" placeholder="First Name"></div><div class="field"><input type="text" name="lastname" value="" placeholder="Last Name"></div><div class="field"><input type="text" name="campaign" value="" placeholder="Campaign"></div><div class="field"><input type="file" name="avatar" accept="image/*"></div><div class="field"><input type="submit" name="submit" value="Submit"></div></form></div></div>');
		$('body #edit').fadeIn(300);
		return false;	
		e.preventDefault();
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
			$('body').append('<div id="sure"><div class="inner"><p>Are you sure you want to delete <strong>'+name+'</strong>?</p><div class="action"><a href="#"class="delete confirm">delete</a></div></div></div>');
			$('body #sure').fadeIn(300);
			return false;
		} else {
			$('body #sure').fadeOut(300, function(){
				$(this).remove();	
			});
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
		e.preventDefault();
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

	// Upload files function with progress tracking
	function uploadImg(file){
		var uploadTask = storageRef.child('avatars/' + file.name).put(file);		
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

	char = {
		"abram":{
			"campaign":"Cave of Whispers",
			"avatar":"url",
			"firstname":"Abram",
			"lastname":"Doran",
			"class":"Ranger",
			"level":9,
			"race":"human",
			"size":"medium",
			"gender":"male",
			"alignment":"NG",
			"height":{"feet":5,"inches":8},
			"weight":190,
			"hp":59,
			"onhand":[
				{
					type: 'Compound Bow'
				}
			],
			armor: [
				{
					class: 'Medium'
				}
			]
		}
	};

})(jQuery);