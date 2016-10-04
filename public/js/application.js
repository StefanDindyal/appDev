'use strict';
;(function($){

	var dapp, character;

	character = [
		{
			name: 'Abram Doran',
			class: 'Ranger',
			level: 9,
			onhand: [
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
	];

	dapp = {
		data: character,
		init: function(){
			dapp.build(dapp.data);
		},
		build: function(data){

		}
	}

})(jQuery);