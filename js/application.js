'use strict';
;(function($){

	var products = [
		{
			name: 'Bread',
			price: 12.30,
			id: 100
		},
		{
			name: 'Butter',
			price: 20.00,
			id: 103
		},
		{
			name: 'Milk',
			price: 15.99,
			id: 89
		},
		{
			name: 'Cheese',
			price: 10.99,
			id: 40
		},
		{
			name: 'Dogo',
			price: 110.99,
			id: 52
		},
		{
			name: 'Cato',
			price: 109.99,
			id: 99
		}
	];

	var store = (function($){
		var items = products || [];
		return {
			init: function(){
				this.build();
			},
			build: function(){
				if($('#app .products').length == 0){
					$('#app').append('<div class="products"></div>');
				}
				for(var i = 0; i < items.length; i++){
					var name = items[i].name,
						price = items[i].price,
						prodID = items[i].id;
					var str = '';
					str += '<div class="product">';
					str += '<h2>'+name+'</h2>';
					str += '<h3>$'+price.toFixed(2)+'</h3>';
					str += '<button data-id="'+prodID+'">Add To Cart</button>';
					str += '</div>';
					$('#app .products').append(str);
				}
			}
		}
	})(jQuery);

	var shopCart = (function($){
		var cart = [];
		return {
			init: function(){
				this.build();
			},
			addItem: function(values){
				cart.push(values);
				sessionStorage.setItem('cart', JSON.stringify(cart));
				this.send(values);
				this.updateCart();
			},
			removeItem: function(values){
				var index = cart.indexOf(values);
				if(index > -1){
					cart.splice(index, 1);
				}
				sessionStorage.setItem('cart', JSON.stringify(cart));
				this.trash(values);
				this.updateCart();
			},
			getItemCount: function(){
				return cart.length;
			},
			getTotal: function(){
				var total = 0;
				for(var i = 0; i < this.getItemCount(); i++){
					var val = $('#cart .item').eq(i).find('h3 em').text();
						val = val*1;
					total += val;
				}
				return total;
			},
			getCart: function(){
				return cart;
			},
			build: function(){
				var el = $('#app'),
					cartEl = el.find('#cart'),
					saved = JSON.parse(sessionStorage.getItem('cart')) || [];					
				if(cartEl.length == 0){
					el.prepend('<div id="cart"><ul></ul></div>');
				}
				cart = saved;
				if(cart.length > 0){
					console.log(cart);
					for(var i = 0; i < cart.length; i++){
						this.send(cart[i]);
					}
				}
				this.updateCart();
			},
			send: function(item){
				for(var i = 0; i < products.length; i++){
					if(products[i].id == item){
						var name = products[i].name;
						var price = products[i].price;
						var id = products[i].id;
					}					
				}
				var str = '';
				str += '<li class="item" data-id="'+id+'">';
				str += '<h2>'+name+'</h2>';
				str += '<h3>$<em>'+price.toFixed(2)+'</em></h3>';
				str += '<button>Remove From Cart</button>';
				str += '</li>';
				$('#cart ul').append(str);
			},
			trash: function(item){
				if($('#cart .item[data-id="'+item+'"]').length){
					$('#cart .item[data-id="'+item+'"]').last().remove();
				}
			},
			updateCart: function(){
				var count = this.getItemCount(),
					total = this.getTotal(),
					el = '<div class="count">Items In Cart: <strong></strong></div>',
					totalEl = '<div class="total">Total Price: $<strong></strong></div>';
				if($('#cart .count').length == 0){
					$('#cart').prepend(el);
				}
				if($('#cart .total').length == 0){
					$('#cart').append(totalEl);
				}
				$('#cart .count strong').text(count);
				$('#cart .total strong').text(total.toFixed(2));
			}		
		}
	})(jQuery, store);

	store.init();
	shopCart.init();

	// add to cart
	$(document).on('click', '.product button', function(){
		var el = $(this),
			id = el.attr('data-id');
		shopCart.addItem(id);
		console.log(shopCart.getCart());
	});

	// remove from cart
	$(document).on('click', '.item button', function(){
		var el = $(this),
			id = el.parent().attr('data-id');
		shopCart.removeItem(id);
		console.log(shopCart.getCart());
	});

})(jQuery);