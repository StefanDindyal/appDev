'use strict';
;(function(){

	var app = {
		element: document.getElementById('app'),
		name: 'John Lisp',
		version: 0.1,
		init: function(id){
			app.say(app.name);			
		},
		say: function(str){
			app.element.innerHTML = str;
		}
	}

	app.init();

})();