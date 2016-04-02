
function NumericView(placeholder) {
	var _this = this;

	placeholder.empty();
	this.elt = $("<table class='numeric_view'><tr><td>?</td></tr></table>");
	this.elt.click(function(e){ if(mode==null) {new NumericViewEditor(_this);e.stopPropagation();}  e.preventDefault(); });
	placeholder.append(this.elt);
	
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
	
	this.update = function(data) {
		if(_this.stream.is("float")) {
			var buf = new Float32Array(data, 4);
			_this.elt.html("<tr><td>"+buf[0].toFixed(2) +"</td></tr>");
		} else if(_this.stream.is("int")) {
			var buf = new Int32Array(data, 4);
			_this.elt.html("<tr><td>"+buf[0] +"</td></tr>");
		} else if(_this.stream.is("Matrix")) {
			var buf = new Float32Array(data, 4);
			var s = "";
			for(var i=0; i<buf.length; i++) s +="<td>"+buf[i] +"</td>"; 
			_this.elt.html("<tr>"+s+"</tr>");
		}	
		
	};
	
	this.write = function() {
		var s = "NumericView";
		if(this.stream) s += "," + this.stream.variable;
		return s;
	};
	
	this.read = function(s) {
		var a = s.split(",");
		if(a[1]) this.plug(pgdb_get_plug(a[1]));
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


function NumericViewEditor(view) {
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