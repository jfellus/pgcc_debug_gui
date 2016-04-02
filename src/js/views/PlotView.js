
function PlotView(placeholder) {
	var _this = this;
	
	var data_memory = [];
	
	this._svg = $("<svg width=640 height=480></svg>");
	this.elt = $("<td class='plot_view' />").append(this._svg);
	var w = placeholder.width();
	var h = placeholder.height();
	placeholder.empty();
	placeholder.append($("<table class='plot_view'><tr /></table>").append(this.elt));
	this._svg.width(w);
	this._svg.height(h);
	this.elt.click(function(e){ if(mode==null) {new PlotViewEditor(_this); e.preventDefault(); e.stopPropagation();}});
	
	this.svg = d3.selectAll( this._svg.toArray() );
	
	
	this.plug = function(stream) {
		if(this.stream) this.disconnect();
		this.stream = stream;
		stream.add_listener(this);
	};
	
	this.unplug = function() {
		if(!this.stream) return;
		this.stream.remove_listener(this);
		this.stream = null;
	};
	
	
	this.plot = function(data) {
		this._svg.empty();
		var vis = this.svg,
		WIDTH = this._svg.width(),
		HEIGHT = this._svg.height(),
		MARGINS = {
			top: 20,
			right: 20,
			bottom: 20,
			left: 50
		},
		minx = d3.min(data, function(d) {return d.x;	}), 
		maxx = d3.max(data, function(d) {return d.x; }),
		miny = d3.min(data, function(d) {return d.y;	}), 
		maxy = d3.max(data, function(d) {return d.y; }),
		xRange = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([minx,maxx]),
		yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([miny,maxy]),
		xAxis = d3.svg.axis()
		.scale(xRange)
		.tickSize(5)
		.tickSubdivide(true),
		yAxis = d3.svg.axis()
		.scale(yRange)
		.tickSize(5)
		.orient('left')
		.tickSubdivide(true);

		vis.append('svg:g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
		.call(xAxis);

		vis.append('svg:g')
		.attr('class', 'y axis')
		.attr('transform', 'translate(' + (MARGINS.left) + ',0)')
		.call(yAxis);

		var lineFunc = d3.svg.line()
		.x(function(d) {   return xRange(d.x);  })
		.y(function(d) {   return yRange(d.y);  })
		.interpolate('linear');
	
		vis.append('svg:path')
		  .attr('d', lineFunc(data))
		  .attr('stroke', 'blue')
		  .attr('stroke-width', 2)
		  .attr('fill', 'none');
	
	};
	
	this.update_info = function(infos) {}
	
	this.update = function(indata) {
		if(!indata || !_this.stream) {
			_this.plot(data_memory);
		} else if(_this.stream.is("float")) {
			var buf = new Float32Array(indata,4);
			var x = 0; 
			if(data_memory.length>0) x = data_memory[data_memory.length-1].x+1;
			if(data_memory.length>100) data_memory = data_memory.slice(1);
			if(!isNaN(buf[0])) data_memory.push({x:x,y:buf[0]});
			_this.plot(data_memory);
		} else if(_this.stream.is("int")) {
			var buf = new Int32Array(indata,4);
			var x = 0; 
			if(data_memory.length>0) x = data_memory[data_memory.length-1].x+1;
			if(data_memory.length>100) data_memory = data_memory.slice(1);
			if(!isNaN(buf[0])) data_memory.push({x:x,y:buf[0]});
			_this.plot(data_memory);
		}
	};
	
	this.read = function(s) {
		var a = s.split(",");
		if(a[1]) _this.plug(pgdb_get_plug(a[1])); 
	};
	
	this.write = function() {
		var s = "PlotView";
		if(this.stream) s += "," + this.stream.variable;
		return s;
	};
	
	this.set_placeholder = function(placeholder) {
		this.placeholder = placeholder;
		placeholder.view = this;
		placeholder.resize(function() {_this.resize();});
		placeholder.write = function() { return _this.write(); };
		placeholder.read = function(s) {_this.read(s); };
	};
	
	this.resize = function() {
		var w = this.placeholder.width();
		var h = this.placeholder.height();
		this._svg.width(w);
		this._svg.height(h);
		this.update();
	};
	
	
	this.set_placeholder(placeholder);
	views.push(this);
	
	this.update();
	this.resize();
}




function PlotViewEditor(view) {
	var _this = this;
	var editor = $("<div class='view_editor' />");
	var variable = view.stream ? view.stream.variable : null;
	editor.click(function(e){  e.preventDefault(); e.stopPropagation(); });
	
	view.elt.append(editor);
	var plugs = $("<table class='plugs' />");
	DBG_PLUGS_LIST(plugs);
	editor.append(plugs);
	if(variable) plugs.select(variable);
	plugs.on_select = function(plug) {variable = plug.variable;};
	
	
	editor.append($("<button>OK</button>").click(function(e){ _this.ok();  e.preventDefault(); e.stopPropagation();}));
	editor.append($("<button>Cancel</button>").click(function(e){ _this.cancel();  e.preventDefault(); e.stopPropagation();}));
	
	
	editor.slideDown();
	
	this.ok = function() {
		editor.remove();
		view.unplug();
		view.plug(pgdb_get_plug(variable));
	};
	this.cancel = function() {editor.remove(); };
}