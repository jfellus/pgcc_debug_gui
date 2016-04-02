var gui = require('nw.gui');

/////////////
// GLOBALS //
/////////////

var CHANNEL_LIST_PLUGS = "4294967295";
var CHANNEL_INFOS = "4294967294";
var AUTOSTART = true;

var workbench = null;
var views = [];
var mode = null;
var debug_socket = null;

function set_mode(_mode) {
	mode = _mode;
	div_mode.html(mode);
}














function ToolPalette(placeholder) {
	var elt = $("<table class='palette centerer'><tr class='centerer'><td class='centerer'><ul class='tool_palette'></ul></td></tr></table>");
	var l = elt.find("ul");
	
	l.append($("<li><button>Plot</button><li>").click(function(e){new PlotView(placeholder);}));
	l.append($("<li><button>Plot3D</button><li>").click(function(e){new Plot3DView(placeholder);}));
	l.append($("<li><button>Image</button><li>").click(function(e){new ImageView(placeholder);}));
	l.append($("<li><button>Numeric</button><li>").click(function(e){new NumericView(placeholder);}));
	l.append($("<li><button>ControlsPanel</button><li>").click(function(e){new ControlsPanelView(placeholder);}));
	l.append($("<li><button>Faders</button><li>").click(function(e){new FadersView(placeholder);}));
	
	placeholder.append(elt);	
}

function set_dividable(elt) {
	elt.click(function(e){
		var x = e.clientX - elt.offset().left;
	    var y = e.clientY - elt.offset().top;
		if(mode=="vsplit") vsplit(elt, y<elt.height()/2);
		else if(mode=="hsplit") hsplit(elt, x<elt.width()/2);
		else if(mode=="remove") elt.close();
		e.preventDefault();
		e.stopPropagation();
		set_mode(null);
	});
}


function dosplit(e, d, placeholder) {
	// Reattach content (from 'e' to 'placeholder')
	var c = e.children(); c.detach(); placeholder.append(c);
	if(e.view) { var view = e.view; view.set_placeholder(placeholder); }
	else if(c.hasClass("palette")) c.remove();
	
	// Forward resize events
	e.append(d);
	e.css("overflow", "visible");
	if(e.resize_listeners) e.resize(function(){d.resize();});
	
	// Make both parts dividable themselves
	set_dividable(d.left);
	set_dividable(d.right);
	
	// Add a palette to empty parts
	if(d.left.children().length==0) new ToolPalette(d.left);
	if(d.right.children().length==0) new ToolPalette(d.right);
	
	// On 'close' of a part, reattach the other one to the parent
	d.left.close = function() { d.right.detach(); var p = d.parent(); d.remove(); p.append(d.right); };
	d.right.close = function() { d.left.detach(); var p = d.parent(); d.remove(); p.append(d.left); };
	
	d.setLocation(0.5);
	
	e.d = d;
}

function vsplit(e, bBottom) { var d = create_vdivider(); dosplit(e, d, bBottom ? d.right : d.left); return d;}
function hsplit(e, bRight) { var d = create_hdivider(); dosplit(e, d, bRight ? d.right : d.left); return d;}



var ui_file = null;
var prog = null;

function run(prog) {
	exec_async("cd "+ file_dirname(prog) + "; gnome-terminal -x "+prog + "; sleep 10;", function(err, stdout, stderr) {});
}

function read_ui_file(ui_file) {
	file_read_array(ui_file, function(s) {
		var i = 0;
		if(s[i].startsWith("prog=")) {
			prog = s[i++].split("=")[1];
			if(prog!="" && prog!="null") run(prog);
		}
		function recurse(ptr, cur) {
			var str = s[ptr.i++];
			if(str.startsWith("v ")) {
				vsplit(cur, false); 
				recurse(ptr, cur.d.left); 
				recurse(ptr, cur.d.right); 
				function resize() {	cur.d.setLocation(parseFloat(str.split(" ")[1])); }
				setTimeout(resize, 100);
			}
			else if(str.startsWith("h ")) {
				hsplit(cur, false); 
				recurse(ptr, cur.d.left); 
				recurse(ptr, cur.d.right); 
				function resize() {	cur.d.setLocation(parseFloat(str.split(" ")[1])); }
				setTimeout(resize, 100);
			}
			else {
				if(str.startsWith("PlotView")) new PlotView(cur); 
				else if(str.startsWith("Plot3DView")) new Plot3DView(cur); 
				else if(str.startsWith("ImageView")) new ImageView(cur); 
				else if(str.startsWith("NumericView")) new NumericView(cur); 
				else if(str.startsWith("ControlsPanelView")) new ControlsPanelView(cur); 
				else if(str.startsWith("FadersView")) new FadersView(cur); 
				if(cur.read) cur.read(str);
			}			
		}
		recurse({i:i},workbench.main);
	});
}

function write_ui_file(ui_file) {
	var s = "prog=" + prog + "\n";
	var cur = workbench.main;
	var a = [];
	function recurse(cur, a) {
		if(cur.d) {
			if(cur.d.hasClass("vdivider")) a.push("v "+cur.d.getLocation());
			else a.push("h "+cur.d.getLocation());
			recurse(cur.d.left, a);
			recurse(cur.d.right, a);
		} else if(cur.write) a.push(cur.write());
	}
	recurse(cur, a);
	s+= a.join("\n");
	alert(s);
	file_write(ui_file, s);
}

function main(){
	try {
		workbench = new Workbench();
		
		if(gui.App.argv.length>=3 && gui.App.argv[1]=="-f") {
			ui_file = gui.App.argv[2];
			workbench.open(ui_file);
		}
		else if(gui.App.argv.length>=2) {
			prog = gui.App.argv[1]; run(prog);
		}
		
		
		
		

		div_mode = $("<div class='mode'>eoijroij</div>");
		workbench.toolbar.append(div_mode);
		
		set_dividable(workbench.main);
		new ToolPalette(workbench.main);
		
		
		$(document).keydown(function(e) {
			var k = String.fromCharCode(e.which);
			if(k=='V') set_mode("vsplit");
			else if(k=='H') set_mode("hsplit");
			else if(k=='X') set_mode("remove");
			else if(k=='R') set_mode("right");
			else if(k=='L') set_mode("left");
		});

		function connect() {
			debug_socket = new Socket("localhost:10001");
			debug_socket.on_open = function() {
				if(AUTOSTART) {
					workbench.play();
					function set_ready() {debug_socket.bReady = true;}
					setTimeout(set_ready, 1000);
				}
			};
			debug_socket.on_recv = function(id, data) { 
				if(id==CHANNEL_LIST_PLUGS) set_plugs_list(Uint8Array_to_string(new Uint8Array(data, 4)));
				else if(id==CHANNEL_INFOS) streams[new Uint16Array(data, 4,1)[0]].on_info(Uint8Array_to_string(new Uint8Array(data, 8)));
				else if(streams[id]) streams[id].on_recv(data);
			};		
		}
		setTimeout(connect,1000);


	} catch(err) {alert(err.stack ? err.stack : err);}
}