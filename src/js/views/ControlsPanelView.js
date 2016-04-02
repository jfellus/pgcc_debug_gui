function ControlItem(panel, elt, type) {
	var _this = this;
	this.panel = panel;
	this.elt = elt;
	this.type = type;
	

	this.elt.click(function(e){
		if(mode=='right') {panel.add_after(_this); e.preventDefault(); e.stopPropagation(); set_mode(null);}
		else if(mode=='left'){panel.add_after(_this); e.preventDefault(); e.stopPropagation(); set_mode(null);}
	});

	
	
	this.create_range = function(orientation) {
		var range = $("<input type=range min=0 max=10000 value=3 width='100%' height='100%'/>");
		if(orientation=="v") range.addClass("vertical");
		this.elt.append(range);
		var bDrag = false;
		var oldvar = 0;
		range.mousedown(function(e) {bDrag = true;});
		range.mouseout(function(e) {bDrag = false;});
		range.mouseup(function(e) {bDrag = false;});
		range.mousemove(function(e) {	if(!bDrag) return;	if(range.val()!=oldvar) range.change();	oldvar = range.val();});
		range.change(function(e) {_this.change();});
		this.get = function() {return range.val()/10000;};
		this.set = function(v) { range.val(v*10000);};
		range.click(function(e){ 
			if(mode==null && e.ctrlKey && !e.shiftKey) {new ControlsPanelViewEditor(_this); e.preventDefault(); e.stopPropagation();}
		});
	};
	
	this.create_meter = function() {
		var meter = $("<div class='meter'><div class='val'><span /></div></div>");
		var max = 50;
		var min = 0;
		this.elt.append(meter);
		this.get = null;
		this.set = function(v) { 
			meter.children().height(Math.round((1-(v-min)/(max-min))*meter.height()));
			meter.children().children().text(v.toFixed(2));
		};
		meter.click(function(e){ 
			if(mode==null && e.ctrlKey && !e.shiftKey) {new ControlsPanelViewEditor(_this); e.preventDefault(); e.stopPropagation();}
		});		
	};
	
	this.create_component = function() {
		this.elt.empty();
		
		if(this.type=="vrange") this.create_range("v");
		else if(this.type=="hrange") this.create_range("h");
		else if(this.type=="meter") this.create_meter();

	};
	
	this.set = function(v) {};
	this.get = function() {};
	
	this.change = function() {
		if(!this.stream) return;
		if(this.get) this.stream.set(this.get());
	};
	
	this.update_info = function(info) {
		
	};
	
	this.update = function(data) {
		if(!this.stream) return;
		if(this.stream.is("float"))	this.set(new Float32Array(data,4)[0]);
		else if(this.stream.is("bool"))	this.set(new Char8Array(data,4)[0]);
		else if(this.stream.is("int"))	this.set(new Int32Array(data,4)[0]);
		else if(this.stream.is("unsigned int") || this.stream.is("uint")) this.set(new Uint32Array(data,4)[0]);
	};
	
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
	
	this.set_type = function(type) {
		this.type = type;
		this.create_component();
	};

	this.set_type(type);
}



function ControlsPanelView(placeholder) {
	var _this = this;
	this.elt = $("<table class='controls_panel_view'><tr><td /></td></tr></table>");
	placeholder.empty();
	placeholder.append(this.elt);
	this.elt = this.elt.find("td");
	this.elt.append("<table><tr><td /></tr></table>");
	
	this.items = [new ControlItem(this, this.elt.find("td"), "vrange")];
	
	

	this.add_after = function(item) {
		var td = $("<td />");
		td.insertAfter(item.elt);
		var x = new ControlItem(this, td, item.type);
		this.items.push(x);
		return x;
	};
	
	this.add_before = function(item) {
		var td = $("<td />");
		td.insertBefore(item.elt);
		var x = new ControlItem(this, td, item.type);
		this.items.push(x);
		return x;
	};
	
	this.read = function(s) {
		var a = s.split(",");
		var cur = null;
		for(var i=1; i<a.length; i++) {
			var spec = a[i].split("=");
			if(!cur) cur = this.items[0];
			else cur = this.add_after(cur);
			cur.set_type(spec[0]);
			cur.plug(pgdb_get_plug(spec[1]));
		}
	};
	
	this.write = function() {
		var s = "ControlsPanelView";
		for(var j = 0; j<this.items.length; j++) {
			for(var i = 0; i<this.items.length; i++) {
				if(this.items[i].elt.index()==j) {
					s+= "," + this.items[i].type + "=" + ((this.items[i].stream) ? this.items[i].stream.variable : "null");
				}
			}
		}
		return s;
	};
	
	this.set_placeholder = function(placeholder) {
		this.placeholder = placeholder;
		placeholder.view = this;
		placeholder.write = function() { return _this.write(); };
		placeholder.read = function(s) {_this.read(s); };
	};
	
	
	
	this.set_placeholder(placeholder);
	views.push(this);
}




function ControlsPanelViewEditor(control) {
	var _this = this;
	var editor = $("<div class='view_editor' />");
	var variable = control.stream ? control.stream.variable : null;
	editor.click(function(e){  e.preventDefault(); e.stopPropagation(); });
	
	control.panel.elt.append(editor);
	var plugs = $("<table class='plugs' />");
	DBG_PLUGS_LIST(plugs);
	editor.append(plugs);
	if(variable) plugs.select(variable);
	plugs.on_select = function(plug) {variable = plug.variable;};
	
	
	editor.append($("<button>OK</button>").click(function(e){ _this.ok();  e.preventDefault(); e.stopPropagation();}));
	editor.append($("<button>Cancel</button>").click(function(e){ _this.cancel();  e.preventDefault(); e.stopPropagation();}));
	editor.append("<div />");
	
	editor.append($("<button>vrange</button>").click(function(e){ control.set_type("vrange"); _this.ok();  e.preventDefault(); e.stopPropagation();}));
	editor.append($("<button>hrange</button>").click(function(e){ control.set_type("hrange");  _this.ok();  e.preventDefault(); e.stopPropagation();}));
	editor.append($("<button>meter</button>").click(function(e){  control.set_type("meter"); _this.ok();  e.preventDefault(); e.stopPropagation();}));

	
	editor.slideDown();
	
	this.ok = function() {
		editor.remove();
		control.unplug();
		control.plug(pgdb_get_plug(variable));
	};
	this.cancel = function() {editor.remove(); };
}