
function FadersView(placeholder) {
	var _this = this;
	
	this.faders = [];
	
	this.elt = $("<table class='faders_view'><tr><td /></td></tr></table>");
	placeholder.empty();
	placeholder.append(this.elt);
	this.elt = this.elt.find("td");
	this.elt.click(function(e){ if(mode==null) {new FadersViewEditor(_this); e.preventDefault(); e.stopPropagation();}});
	
	this.tr = $("<tr></tr>");
	this.elt.append($("<table></table>").append(this.tr));
	
	
	
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
	
	
	this.add_fader = function() {
		var range = $("<input type=range min=0 max=1000 value=500 width='100%' height='100%'/>");
		range.addClass("vertical");
		var i = this.tr.children().length;
		var e = $("<table></table>");
		var number = $("<td class='number' contentEditable=true />");
		e.append($("<tr/>").append(number));
		e.append($("<tr/>").append($("<td/>").append(range)));
		this.tr.append($("<td class='fader' />").append(e));
		range.min = -1;
		range.max = 1;
		
		number.mousedown(function(e) { e.stopPropagation();});
		number.mouseup(function(e) { e.stopPropagation();});
		number.click(function(e) { e.stopPropagation();});
		number.keydown(function(e){
			if(e.which==13) { range.set(parseFloat(number.text())); range.change(); e.preventDefault(); e.stopPropagation();}
			else if(e.which==40 /* down */) {range.set(parseFloat(number.text())-0.05); range.change(); e.preventDefault(); e.stopPropagation();}
			else if(e.which==38 /* up */) {range.set(parseFloat(number.text())+0.05); range.change(); e.preventDefault(); e.stopPropagation();}
		});
		
		var bDrag = false;
		var oldvar = 0;
		range.mousedown(function(e) {bDrag = true;  e.stopPropagation();});
		range.mouseout(function(e) {bDrag = false;});
		range.mouseup(function(e) {bDrag = false;  e.stopPropagation();});
		range.mousemove(function(e) {	if(!bDrag) return;	if(range.val()!=oldvar) range.change();	oldvar = range.val();});
		range.click(function(e) {e.stopPropagation(); });
		range.change(function(e) {_this.change(i); number.text(range.get().toFixed(2));});
		
		range.get = function() {return (range.val()/1000*(range.max-range.min) + range.min);};
		range.set = function(v) { 
			range.val((v-range.min)/(range.max-range.min)*1000);
			number.text(range.get().toFixed(2));
		};
		number.text(range.get().toFixed(2));
		
		this.faders.push(range);
	};
	
	this.change = function(i) {
		if(this.stream) this.stream.set(""+i+"="+this.get(i));
	};
	
	this.get = function(i) {
		return this.faders[i].get();
	};
	
	this.set = function(i, v) {
		this.faders[i].set(v);
	};
	
	this.update_info = function(infos) {
		this.faders = [];
		this.tr.empty();
		var v = infos.split(",");
		var n = parseInt(v[0]) * parseInt(v[1]);
		for(var i = 0; i<n; i++) this.add_fader();
	};
	
	this.update = function(indata) {};
	
	this.read = function(s) {
		var a = s.split(",");
		if(a[1]) _this.plug(pgdb_get_plug(a[1])); 
	};
	
	this.write = function() {
		var s = "FadersView";
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
		this.update();
	};
	
	
	this.set_placeholder(placeholder);
	views.push(this);
	
	this.update();
	this.resize();
}




function FadersViewEditor(view) {
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