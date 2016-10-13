'use strict';
;(function($){

	var clientId = 'f2520f9ad645461e850cd6785ba1981a';
	var redirect = 'http://www.sukiyakimedia.com/sample-code/appDev/';
	// http://localhost/appDev/
	var accessToken = (window.location.hash).split('=')[1];

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
		console.log(posts);
		$('#app').html(feed);
	});

	$(document).on('click', '.core', function(e){
		e.preventDefault();
		var el = $(this);
		var id = el.parents('.media').attr('data-id');
		var url = el.find('img').attr('src');
		var modal = '<div id="modal" data-id="'+id+'"><div class="close"></div><div class="in"><img src="'+url+'"/><a href="#" class="nav prev"></a><a href="" class="nav next"></a></div></div>';
		$('body').append(modal);
	});

	$(document).on('click', '#modal .close', function(e){
		e.preventDefault();
		$('#modal').remove();
	});

	$(document).on('click', '#modal .nav', function(e){
		e.preventDefault();
		var el = $(this);
		var id = el.parents('#modal').attr('data-id');
		var img = el.parents('#modal').find('img');
		var src = '';
		if(el.hasClass('prev')){
			var prev = $('.media[data-id="'+id+'"]').prev();
			if(prev.length < 1){
				prev = $('.media').last();
			}
			id = prev.attr('data-id');
			src = prev.find('img').attr('src');
		} else if(el.hasClass('next')){
			var next = $('.media[data-id="'+id+'"]').next();
			if(next.length < 1){
				next = $('.media').first();
			}
			id = next.attr('data-id');
			src = next.find('img').attr('src');
		}
		$('#modal').attr('data-id', id);
		img.attr('src', src);
	});

	function builder(posts){
		var str = ''
		posts.forEach(function(post){			
			if($.inArray('inktober', post.tags) > -1){
				str += '<div class="media" data-id="'+post.id+'">';
					str += '<div class="core">';
					str += '<div class="img">';
					str += '<img src="'+post.images.standard_resolution.url+'"/>';
					str += '<div class="likes">'+post.likes.count+'<span> Likes</span></div>';
					str += '</div>';
					str += '<div class="caption">'+post.caption.text+'</div>';
					str += '</div>';
				str += '</div>';
			}			
		})
		return str;
	}

})(jQuery);