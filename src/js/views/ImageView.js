
function ImageView(placeholder) {
	var _this = this;
	
	this.canvas = $("<canvas width=640 height=480></canvas>");
	this.elt = $("<td class='imageview' />").append(this.canvas);
	var w = placeholder.width();
	var h = placeholder.height();
	placeholder.empty();
	placeholder.append($("<table class='imageview'><tr /></table>").append(this.elt));
	this._canvas = this.canvas[0];
	this.elt.width(w);
	this.elt.height(h);
	this.elt.click(function(e){ if(mode==null) {new ImageViewEditor(_this); e.preventDefault(); e.stopPropagation();}});
	
	this.plug = function(stream) {
		if(this.stream) this.disconnect();
		this.stream = stream;
		stream.add_listener(this);		
		this.stream.ready(function() {_this.stream.request();});
	};
	
	this.unplug = function() {
		if(!this.stream) return;
		this.stream.remove_listener(this);
		this.stream = null;
	};
	
	this.update_info = function(info) {
		var dims = info.split(",");
		if(this.stream.is("Matrix")) this.set_image_size(parseInt(dims[1]), parseInt(dims[0]));
		else this.set_image_size(parseInt(dims[0]), parseInt(dims[1]));
	};
	
	this.update = function(data) {
		if(!this.stream) return;
		var ctx = this._canvas.getContext("2d");
		var imgData = ctx.getImageData(0, 0, this._canvas.width, this._canvas.height);
		var out = imgData.data;
		if(this.stream.is("ImageRGB")) {
			var j=0, i=0;
			var img = new Uint8Array(data, 4);
			while(i < out.length) {
				out[i++] = img[j++];
				out[i++] = img[j++];
				out[i++] = img[j++];
				out[i++] = 255;
			}
		} else {
			var j=0, i=0;
			var img = new Float32Array(data, 4);
			while(i < out.length) {
				var x = img[j++]*255;
				out[i++] = x;
				out[i++] = x;
				out[i++] = x;
				out[i++] = 255;
			}
		}
		imgData.data = out;
		ctx.putImageData(imgData, 0, 0);
		if(this.stream) this.stream.request();
	};
	
	this.write = function() {
		var s = "ImageView";
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
		placeholder.resize(function() {_this.resize();});
		placeholder.write = function() {return _this.write();};
		placeholder.read = function(s) {_this.read(s);};
	};
	
	this.resize = function() {
		var w = this.placeholder.width();
		var h = this.placeholder.height();
		var cw = this.canvas.width();
		var ch = this.canvas.height();
		if(ch*w/cw > h) {
			this.canvas.width(Math.round(cw*h/ch)); this.canvas.height(h);
			this.canvas.css("left", (w-this.canvas.width())/2);
			this.canvas.css("top", 0);
		}
		else {
			this.canvas.width(w); this.canvas.height(Math.round(ch*w/cw));
			this.canvas.css("left", 0);
			this.canvas.css("top", (h-this.canvas.height())/2);
		}
		this.elt.width(w);
		this.elt.height(h);
	};
	
	this.set_image_size = function(w,h) {
		this.canvas.attr("width", w);
		this.canvas.attr("height", h);
	};
	
	this.set_placeholder(placeholder);
	this.resize();
	views.push(this);
	
	this.set_image_size(640,480);
}


function ImageViewEditor(view) {
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