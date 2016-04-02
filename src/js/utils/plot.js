function view_create_plot() {
	var v2 = new View(null, "Plot", {tab:"right"});
	v2.ph = 0;
	v2.update = function(e) {
		e.empty();

		var values = [0,1,0,1,0,1,0,1,0,1];

//		Formatters for counts and times (converting numbers to Dates).
		var formatCount = d3.format(",.0f");
		
		var margin = {top: 10, right: 30, bottom: 30, left: 30},
			width = $(e).width() - margin.left - margin.right,
			height = $(e).height() - margin.top - margin.bottom;

		var x = d3.scale.ordinal().domain(d3.range(values.length)).rangeRoundBands([0, width],0.05);
		var y = d3.scale.linear().domain([0,d3.max(values)]).range([0, height]);
		var xAxis = d3.svg.axis().scale(x).orient("bottom");


		var svg = d3.selectAll($(e).toArray()).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		var rect = svg.selectAll("rect")
		.data(values)
		.enter()
		.append("rect")
		.attr("x", function(d,i) {return x(i);})
		.attr("y", function(d) { return height - y(d);})
		.attr("width", x.rangeBand())
		.attr("height", function(d) { return y(d); })
		.attr("fill", function(d) {
			return "rgb(0, 0, " + (d * 255) + ")";
		});

		svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
		
		
//		Generate a histogram using twenty uniformly-spaced bins.
		var load_data = function() {
			var height = $(e).height() - margin.top - margin.bottom;
			
			fs.readFile("/dev/shm/aaa", function(err,data) {
				if(!data) return;
				for(var i=0; i*4<data.length; i++) values[i] = data.readFloatLE(i*4);
				
				rect.data(values);
				rect.attr("height", function(d){ return y(d); })
					.attr("y", function(d) { return height - y(d);})
					.attr("fill", function(d) {
						return "rgb(0, 0, " + Math.floor(d * 255) + ")";
					});				
			});
		};
		if(v2.inter) clearInterval(v2.inter);
		v2.inter = setInterval(load_data, 40);
	};
}
