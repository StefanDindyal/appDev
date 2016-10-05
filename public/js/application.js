'use strict';
;(function($){

	var dapp, char;
	var database = firebase.database();
	var storage = firebase.storage();
	var storageRef = storage.ref();

	$('input[type="file"]').on('change', function(){
		var file = $(this).get(0).files[0];
		
		uploadImg(file).then(function(snapshot){
			var downloadURL = snapshot.downloadURL;
			$('.view').html('<img src="'+downloadURL+'"/>');			
		})

		return false;
	});

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

	dapp = {
		data: char,
		init: function(){
			dapp.build(dapp.data);
		},
		build: function(data){

		}
	}

})(jQuery);