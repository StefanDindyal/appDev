'use strict';
;(function($){

	var clientId = 'f2520f9ad645461e850cd6785ba1981a';
	var redirect = 'http://localhost/appDev/';
	var accessToken = (window.location.hash).split('=')[1];

	console.log(accessToken);
	if(!accessToken){
		window.location = 'https://api.instagram.com/oauth/authorize/?client_id='+clientId+'&redirect_uri='+redirect+'&response_type=token';
		return false; 
	}

	var inst = $.ajax({
		type: 'GET',
		dataType: 'jsonp',
		url: 'https://api.instagram.com/v1/users/227513114/media/recent/?access_token='+accessToken 
	});

	$.when(inst).then(function(data){
		var posts = data.data;
		return posts;
	}).then(function(posts){
		var feed = builder(posts);
		// console.log(feed);
		$('#app').html(feed);
	});

	function builder(posts){
		var str = ''
		posts.forEach(function(post){			
			if($.inArray('inktober', post.tags) > -1){
				str += '<div class="media">';
					str += '<img src="'+post.images.standard_resolution.url+'"/>';
				str += '</div>';
			}			
		})
		return str;
	}

})(jQuery);