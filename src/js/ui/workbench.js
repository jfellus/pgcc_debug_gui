
///////////
// UTILS //
///////////

function ASSERT_WORKBENCH_INIT() {if(!workbench) throw "Workbench not initialized";}



///////////////
// WORKBENCH //
///////////////

function Workbench() {
	
	/////////////////////////
	// Workbench Structure //
	/////////////////////////
	
	this.mainwindow = create_window();
	$("body").append(this.mainwindow);
	this.menubar = this.mainwindow.menubar;
	this.toolbar = this.mainwindow.toolbar;
	this.status = this.mainwindow.status;
	this.main = this.mainwindow.main;
	
	// Menubar
	this.menubar.append("<li>File</li><li>Edit</li><li>Search</li><li>Help</li>");
	
	// Toolbar
	this.toolbar.append($("<li/>").addClass("new").click(function(){workbench.new_document();}));
	this.toolbar.append($("<li/>").addClass("open").click(function(){workbench.open();}));
	this.toolbar.append($("<li/>").addClass("save").click(function(){workbench.save();}));
	this.toolbar.append($("<li/>").addClass("close").click(function(){workbench.close();}));
	this.toolbar.append($("<li/>").addClass("_____"));
	this.toolbar.append($("<li/>").addClass("undo").click(function(){workbench.undo();}));
	this.toolbar.append($("<li/>").addClass("redo").click(function(){workbench.redo();}));
	this.toolbar.append($("<li/>").addClass("_____"));
	this.toolbar.append($("<li/>").addClass("add_view").click(function(){workbench.start_creator(new ModuleCreator());}));
	this.toolbar.append($("<li/>").addClass("_____"));
	this.toolbar.append($("<li/>").addClass("start").click(function(){workbench.play();}));
	this.toolbar.append($("<p/>").addClass("connection_status"));
	
	dbg_elt = this.status;

	
	
	this.set_connection_status = function(status) {
		this.toolbar.children(".connection_status").html(status ? "CONNECTED" : "NO CONNECTION");
		this.toolbar.children(".connection_status").css("color", status ? "green" : "red");
	};
	
	//////////////
	// Commands //
	//////////////

	this.close = function() {
		// TODO
	};

	this.open = function(filename) {
		if(!filename) file_open_dialog(function(filename) { workbench.open(filename);}, "*.pgccdebug");
		else {
			ui_file = filename;
			read_ui_file(filename);
		}
	};
	
	this.new_document = function() {
		workbench.main.empty();
		new ToolPalette(workbench.main);
		
	};
	
	this.save = function(filename) {
		if(!filename) filename = ui_file;
		if(!filename) file_save_as_dialog(function(filename) { workbench.save(filename);}, "*.pgccdebug");
		else {
			ui_file = filename;
			write_ui_file(filename);
		}
	};
	
	this.undo = function() {//TODO
	};
	this.redo = function() {//TODO
	};
	
	
	///////////
	// DEBUG //
	///////////
	
	this.play = function () {
		debug_socket.send("L");
		debug_socket.send("Y");
	};
	
	
	
	//////////////////
	// KEY BINDINGS //
	//////////////////
	
	this.on_keydown = function(e) {
		var k = String.fromCharCode(e.which);
		if(e.ctrlKey) {
			if(k=='W') this.close();
			else if(k=='O') this.open();
			else if(k=='N') this.new_document();
			else if(k=='S') this.save();	
			else if(k=='Z') {if(e.shiftKey) this.redo(); else this.undo();}
		}		
	};
	
	this.on_keypress = function(e) {
		if(cur_editor) cur_editor.canvas.keypress(e);
	};
	
	$(window).keydown(function(e) {workbench.on_keydown(e);});
}

