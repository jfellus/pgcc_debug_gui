
function Plot3DView(placeholder) {
	var _this = this;
	
	var data_memory = [];
	
	this._svg = $("<x3d width=640 height=480></svg>");
	this.elt = $("<td class='plot_view' />").append(this._svg);
	var w = placeholder.width();
	var h = placeholder.height();
	placeholder.empty();
	placeholder.append($("<table class='plot_view'><tr /></table>").append(this.elt));
	this.elt.width(w);
	this.elt.height(h);
	this._svg.width(w);
	this._svg.height(h);
	this.elt.click(function(e){ if(mode==null) {new Plot3DViewEditor(_this); e.preventDefault(); e.stopPropagation();}});
	
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
		var x3d = this.svg;
		
		 function randomData() {
		        return d3.range(6).map( function() { return Math.random()*20; } );
		      };

		      var scene = x3d.append("scene");
		      scene.append("viewpoint")
		           .attr( "centerOfRotation", "3.75 0 10")
		           .attr( "position", "13.742265188709691 -27.453522975182366 16.816062840792625" )
		           .attr( "orientation", "0.962043810961999 0.1696342804961945 0.21376603254551874 1.379433089729343" )
		           ;

		      function refresh( data ) {
		        shapes = scene.selectAll("transform").data( data );
		        shapesEnter = shapes
		             .enter()
		             .append( "transform" )
		             .append( "shape" )
		             ;
		        // Enter and update
		        shapes.transition()
		              .attr("translation", function(d,i) { return i*1.5 + " 0.0 " + d/2.0; } )
		              .attr("scale", function(d) { return "1.0 1.0 " + d; } )
		              ;

		        shapesEnter
		            .append("appearance")
		              .append("material")
		              .attr("diffuseColor", "steelblue" );

		        shapesEnter.append( "box" )
		          .attr( "size", "1.0 1.0 1.0" );
		      }

		      refresh( randomData() );
		      setInterval(
		        function(){
		          refresh( randomData() );
		        },
		        2500);

	};
	
	this.update = function(indata) {
		if(!indata || !_this.stream) {
			_this.plot(data_memory);
		} else if(_this.stream.is("float")) {
			var buf = new Float32Array(indata);
			var x = 0; 
			if(data_memory.length>0) x = data_memory[data_memory.length-1].x+1;
			data_memory.push({x:x,y:buf[0]});
			_this.plot(data_memory);
		}
	};
	
	this.write = function() {
		return "Plot3DView";
	};
	
	this.read = function(s) {
		var a = s.split(",");
		if(a[1]) this.plug(pgdb_get_plug(a[1]));
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
	this.resize();
	this.plug(pgdb_get_plug("main_expe.fps.fps"));
	views.push(this);
	
	this.update();
}




function Plot3DViewEditor(view) {
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