<script>

var cheddar = 15;
var hours = 8;

console.log( getPaid(cheddar, hours).cash );

function getPaid(rate, time){		
	var bank = rate * time;
	return {
		rate: rate,
		time: time,
		cash: bank
	}
}

</script>