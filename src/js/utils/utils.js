//////////////
// INCLUDES //
//////////////

var ngui = require('nw.gui');
var nwin = ngui.Window.get();
var sys = require('sys');
var exec_async = require('child_process').exec;
var execSync = require('child_process').execSync;
var fs = require('fs');
var path = require('path');


////////////
// STRING //
////////////

String.prototype.replaceAll = function (find, replace) {
	var str = this;
	return str.replace(new RegExp(find, 'g'), replace);
};	

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

if (typeof String.prototype.has != 'function') {
	String.prototype.has = function (str){
		return this.indexOf(str) !== -1;
	};
}

Array.prototype.remove = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

Array.prototype.has = function(val) {
	return this.indexOf(val)!==-1;
};

$(function(){
	$.extend($.fn.disableTextSelect = function() {
	return this.each(function(){$(this).mousedown(function(e){
		if(!document.edragged && e.button==0) return false;
	});});
});});


function file_basename(f) {
	return f.indexOf("/")!==-1 ? f.substring(f.lastIndexOf("/")+1, f.length) : f;
}

function file_dirname(f) {
	return f.indexOf("/")!==-1 ? f.substring(0, f.lastIndexOf("/")) : '.';
}

function file_exists(f) {
	try {
	    stats = fs.lstatSync(f);
	    return stats.isFile();
	}
	catch (e) { return false;}
}

function ISDEF(i) {return (typeof i != "undefined");}

function zero_pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function Uint8Array_to_string(data) {
	var s = "";
	for (var i=0; i<data.byteLength; i++) s += String.fromCharCode(data[i]);
	return s;
}

///////////
// DEBUG //
///////////

var dbg_elt = null;
$(function() { dbg_elt = $("body");});
function DBG(x) {
	if(dbg_elt) dbg_elt.html("<div>"+x+"</div>");
}


////////
// IO //
////////

function file_read(f, callback) {
	return exec_async("cat " + f, callback);
}

function file_write(f, str) {
	return exec_async("echo '"+ str + "' > " + f);
}

function file_read_array(f, callback) {
	return file_read(f, function(err,stdout,stderr){
		if(stderr.length) alert(stderr);
		callback(stdout.split("\n"));
	});
}

function file_write_array(f, a) {
	file_write(f, a.join("\n"));
}

function touch(f) {
	fs.closeSync(fs.openSync(f, 'a'));
}

function file_change_ext(f, ext) {
	return f.substr(0, f.lastIndexOf(".")) + ext;
}

function list_dir(dir, callback) {
	exec_async("find "+dir+" -maxdepth 1 -type f", function(error, stdout, stderr){
		callback(stdout.split("\n"));
	});
}

function list_dir_filter(dir, filter, callback) {
	exec_async("find "+dir+" -name '"+filter+"' -maxdepth 1 -type f", function(error, stdout, stderr){
		callback(stdout.split("\n"));
	});
}


function file_open_dialog(callback, filter_ext) {
	if(!filter_ext) filter_ext="*.*";
	var e = $("<input type='file' style='display:none' accept='"+filter_ext+"'/>"); $("body").append(e);
	e.change(function(){callback(e.val());e.remove();});
	e.click();
}

function file_save_as_dialog(callback, filter_ext) {
	if(!filter_ext) filter_ect="*.*";
	var e = $("<input type='file' style='display:none' nwsaveas accept='"+filter_ext+"'/>"); $("body").append(e);
	e.change(function(){callback(e.val());e.remove();});
	e.click();
}


//////////
// LIST //
//////////

function list_append_array(list, a) {
	var ul = list;
	for(var i = 0; i<a.length; i++) {
		if(a[i].trim().length) ul.append("<li>"+a[i]+"</li>");
	}
	if(a.length==0) ul.append("<li/>");
}


function get_list_array(list) {
	var a = [];
	var ul = list;
	ul.children().each(function() { 
		if($(this).text().trim()) a.push($(this).text().trim());
	});
	return a;
}

function link_list_to_file(list, file, callback) {
	var l = $(list);

	function update() {
		var a = [];
		$(list).children("ul").children().each(function() {a.push($(this).text());});
		file_write_array(file, a);	
		callback();
	}

	exec_async("mkdir -p ~/.agml/; touch " + file, function() {
		file_read_array(file, function(a) {
			var ul = $(list).children("ul");
			ul.empty();
			for(var i = 0; i<a.length; i++) {
				if(a[i].trim().length) ul.append("<li>"+a[i]+"</li>");
			}
			callback();
		});
	});


	var _d = null;
	l.keyup(function() {
		if(_d) clearTimeout(_d);
		_d = setTimeout(update, 1000);
	});
}

$(function() {
	$(".list > div:first-child").click(function() {
		$(this).parent().children(".content").slideToggle();
	});
});



/////////////////////
// CODE GENERATION //
/////////////////////

function _SVG(elt_name) {return $(document.createElementNS('http://www.w3.org/2000/svg',elt_name));}
function SVG_ADD_CLASS(e, cls) { e.attr("class", e.attr("class")+" "+cls); return e;}
function SVG_REMOVE_CLASS(e, cls) { e.attr("class", e.attr("class").replaceAll(cls, "")); return e;}
function SVG_HAS_CLASS(e, cls) { return e.attr("class").has(cls);}

function set_singlelined(elt) {
	elt.keydown(function(e) {if(e.which==13) { $(this).change(); elt.blur(); e.preventDefault(); e.stopPropagation(); }});
	elt.keyup(function(e) {if(e.which==13) { elt.blur(); e.preventDefault(); e.stopPropagation(); }});
	elt.keypress(function(e) {if(e.which==13) { elt.blur(); e.preventDefault(); e.stopPropagation(); }});
}

function create_table_from_data(data, callback_edit, filter) {
	var t = $("<table class='props'></table>");
	for(var i in data) {
		if(filter && filter.has(i)) continue;
		var tr = $("<tr/>");
		tr.append("<td class='key'>"+i+"</td>");
		var td = $("<td class='val' key='"+i+"' contentEditable=true>"+data[i]+"</td>");
		set_singlelined(td);
		if(callback_edit) td.change(function() {callback_edit($(this).attr("key"), $(this).text());});
		tr.append(td);
		t.append(tr);
	}
	return t;
}

function create_data_tr(key, val, callback_edit) {
	var tr = $("<tr/>");
	var keyEditable = "true";
	if(key=="x" || key=="y" || key=="name" || key=="type") keyEditable = "false";
	var tdkey = $("<td class='key' key='"+key+"' contentEditable="+keyEditable+">"+key+"</td>");
	tr.append(tdkey);
	set_singlelined(tdkey);
	var td = $("<td class='val' contentEditable=true>"+val+"</td>");
	set_singlelined(td);
	tdkey.change(function() {
		if(callback_edit) callback_edit(tdkey.attr("key"), null);
		if(tdkey.text()) {
			if(callback_edit) callback_edit(tdkey.text(), td.text());
			tdkey.attr("key", tdkey.text());
		}
		else tr.remove();
	});
	td.change(function() {
		if(callback_edit) callback_edit(tdkey.text(), $(this).text());
		if(!td.text()) tr.remove();
	});
	tr.append(td);
	return tr;
}

function create_table_from_data_plus(data, callback_edit, filter) {
	var t = $("<table class='props'></table>");
	for(var i in data) {
		if(filter && filter.has(i)) continue;
		t.append(create_data_tr(i, data[i], callback_edit));
	}
	
	var tr = $("<tr class='plus'/>"); tr.append("<td colspan=2><button class='add'/></td>");
	tr.find("button.add").click(function(e) {
		create_data_tr("key", "-", callback_edit).insertBefore(tr);
	});
	t.append(tr);
	return t;
}

function create_table(rows, cols) {
	var t = $("<table></table>");
	for(var i = 0; i<rows; i++) {
		var tr = $("<tr></tr>");
		t.append(tr);
		for(var j=0;j<cols;j++) {tr.append("<td></td>");}
	}
	return t;
}

function create_hdivider() {
	var t = create_table(1,3);
	t.addClass("divider"); t.children("tr").addClass("divider"); t.find("td").addClass("divider");
	var v = t.find("td").eq(0).append("<div></div>"); t.left = v.children("div"); 
	t.sep = t.find("td").eq(1); t.sep.addClass("sep");
	var v = t.find("td").eq(2).append("<div></div>"); t.right = v.children("div");
	
	t.setLocation = function(l) {
		t.left.parent().css("width", (l*100)+"%");
		t.right.parent().css("width", "auto");
		t.left.css("height", "100%"); t.right.css("height", "100%");
		t.left.css("width", "100%"); t.right.css("width", "100%");
		t.resize();
	};
	
	t.getLocation = function() {
		return t.left.width() / t.width();
	};
	
	t.sep.mousedown(function() {document.edragged = t;});
	
	t.dragg = function(dx,dy) {
		t.setLocation((t.left.width()+dx)/t.width());
	};
	
	t.resize = function() {	
		t.left.resize(); t.right.resize();
	};
	
	t.left.resize_listeners = [];
	t.left.resize = function(l) {
		if(l) t.left.resize_listeners.push(l);
		else for(var i=0; i<t.left.resize_listeners.length; i++) t.left.resize_listeners[i]();
	};
	
	t.right.resize_listeners = [];
	t.right.resize = function(l) {
		if(l) t.right.resize_listeners.push(l);
		else {
			for(var i=0; i<t.right.resize_listeners.length; i++) t.right.resize_listeners[i]();
		}
	};
	
	return t;
}

function create_vdivider() {
	var t = create_table(3,1);
	t.addClass("vdivider"); t.children("tr").addClass("vdivider");	t.find("td").addClass("vdivider");
	var v = t.find("td").eq(0).append("<div></div>"); t.left = v.children("div"); 
	t.sep = t.find("td").eq(1);	t.sep.addClass("sep");
	var v = t.find("td").eq(2).append("<div></div>"); t.right = v.children("div");
	
	t.setLocation = function(l) {
		t.left.parent().css("height", (l*100)+"%");
		t.right.parent().css("height", "auto");
		t.left.css("height", "100%"); t.right.css("height", "100%");
		t.left.css("width", "100%"); t.right.css("width", "100%");
		t.resize();
	};
	
	t.getLocation = function() {
		return parseFloat(t.left.height()) / parseFloat(t.height());
	};
	
	t.sep.mousedown(function() {document.edragged = t;});
	
	t.dragg = function(dx,dy) {
		t.setLocation((t.left.height()+dy)/t.height());
	};
	
	t.resize = function() {
		t.left.resize(); t.right.resize();
	};
	
	t.left.resize_listeners = [];
	t.left.resize = function(l) {
		if(l) t.left.resize_listeners.push(l);
		else for(var i=0; i<t.left.resize_listeners.length; i++) t.left.resize_listeners[i]();
	};
	
	t.right.resize_listeners = [];
	t.right.resize = function(l) {
		if(l) t.right.resize_listeners.push(l);
		else for(var i=0; i<t.right.resize_listeners.length; i++) t.right.resize_listeners[i]();
	};
	
	return t;
}

function create_window() {
	var nwin = ngui.Window.get();
	nwin.show();
	nwin.maximize();
	
	var t = create_table(3,1);
	t.addClass("window");
	var v = t.find("td").eq(0).addClass("h menubar").append("<ul></ul>");
	t.menubar = v.children("ul");
	v.focus(function () {$(this).blur();});
	t.menubar.focus(function () {$(this).blur();});
	var v = t.find("td").eq(1).addClass("h toolbar").append("<ul></ul>");
	t.toolbar = v.children("ul");
	t.toolbar.focus(function () {$(this).blur();});
	v.focus(function () {$(this).blur();});
	t.main = t.find("td").eq(2).addClass("main");
	//t.status = t.find("td").eq(3).addClass("status");
	
	return t;
}

function create_tabbed_pane() {
	var t = create_table(2,1);
	t.ids = [];
	t.closeListeners = [];
	t.addClass("tabbed_pane");
	var v = t.find("td").eq(0).addClass("h header").append("<ul></ul>");
	t.header = v.children("ul");
	t.header.focus(function () {$(this).blur();});
	t.body = t.find("td").eq(1).addClass("body");
	t.body.focus(function () {$(this).blur();});
	t.has = function(id) {return this.ids.has(id);};
	t.add = function(id, icon_cls, title, body, update_callback) {
		if(this.has(id)) return this.open(id);
		this.ids.push(id);
		var li = $("<li class='"+id+"'></li>");
		if(icon_cls) li.append("<span class='icon "+icon_cls+"'></span>");
		li.append("<span class='title'>"+title+"</span>");
		li.append("<a class='close'></a>");
		this.header.append(li);
		var b = $("<div class='"+id+"' style='display:none'></div>");
		b.append(body);
		this.body.append(b);
		
		var t = this;
		li.click(function() {
			var id = $(this).attr("class").split(" ")[0];
			t.header.children("li").removeClass("selected"); li.addClass("selected");
			t.body.children("div").removeClass("selected").hide();  
			t.body.children("div."+id).addClass("selected").show();
			update_callback(t.body.children("div."+id));
			t.cur = li;
		});	
		li.children("a.close").click(function() {t.close(li.attr("class").split(" ")[0]);});
	};
	t.get_body = function(title) { return t.body.children("div."+title); };
	t.open = function(id) {
		var li = t.header.children("li."+id);
		if(!li) throw "Can't find view '"+id+"'";
		li.click();
	};
	t.close = function(id) {
		if(typeof id === "function") t.closeListeners.push(id);
		else {
			var ok = true;
			for(var i = 0; i<t.closeListeners.length; i++) if(!t.closeListeners[i](id)) { ok = false; break;}
			if(!ok) return; 
			t.header.children("li."+id).remove();
			t.body.children("div."+id).remove();
			t.ids.remove(id);
			if(t.ids.length>0) t.open(t.ids[t.ids.length-1]);
		}
	};
	t.set_title = function(id, title) {
		var li = t.header.children("li."+id);
		if(!li) throw "Can't find view '"+id+"'";
		li.children(".title").html(title);
	};
	t.change_id = function(old_id, new_id) {
		var li = t.header.children("li."+old_id);
		li.removeClass(old_id); li.addClass(new_id);
		var body = t.body.children("div."+old_id);
		body.removeClass(old_id); body.addClass(new_id);
		t.ids.remove(old_id); t.ids.push(new_id);
	};
	t.focus(function () {$(this).blur();});
	$(window).resize(function(e) {if(t.cur) t.cur.click();});
	
	t.cur = null;
	return t;
}


function create_canvas() {
	var canvas = _SVG("svg");
	canvas.x = 0; canvas.y = 0;
	canvas.offsetx = 0; canvas.offsety = 0; canvas._zoom = 1;
	
	canvas.maingroup = _SVG("g");
	canvas.maingroup.attr("transform", "translate("+canvas.offsetx+","+canvas.offsety+")");
	canvas.append(canvas.maingroup);
	
	canvas.move = function(dx,dy) {
		canvas.offsetx += dx; canvas.offsety += dy;
		canvas.update_view();
	};
	canvas.zoom = function(cx, cy, dzoom) {
		cx =  (cx - canvas.offsetx)/ canvas._zoom;
		cy =  (cy - canvas.offsety)/ canvas._zoom;
		var oldzoom = canvas._zoom;
		canvas._zoom *= 1 + dzoom;
		canvas.offsetx -= cx*(canvas._zoom - oldzoom);
		canvas.offsety -= cy*(canvas._zoom - oldzoom);
		canvas.update_view();
	};
	canvas.relX = function(x) {return (x-canvas.offsetx)/canvas._zoom;};
	canvas.relY = function(y) {return (y-canvas.offsety)/canvas._zoom;};
	canvas.update_view = function() {
		canvas.maingroup.attr("transform", "translate("+(canvas.offsetx)+","+(canvas.offsety)+") scale("+canvas._zoom+")");
		$("#markerArrow").children().attr("transform", "translate(0,7) scale("+(1.0/canvas._zoom)+") translate(0,-7)");
	};
	canvas.update = function() {
		cur_canvas = this;
		this.update_view();
		var p = this.parent();
		this.detach();
		var w = p.width();
		var h = p.height();
		this.attr("width", w);
		this.attr("height", h);
		p.append(this);
		if(this.on_update) this.on_update();
	};
	
	canvas.elt_sel_rect = _SVG("rect").attr("x", 0).attr("y",0).attr("width",0).attr("height",0).attr("class", "selection_rectangle");
	canvas.maingroup.append(canvas.elt_sel_rect);
	canvas.x = 0; canvas.y = 0;
	canvas.mousemove(function(e) {
		if(document.btn==1) canvas.move(e.pageX-canvas.x, e.pageY-canvas.y);
		canvas.x = e.pageX;
		canvas.y = e.pageY;
	});
	canvas.on('mousewheel', function(e) {
		canvas.zoom(e.offsetX, e.offsetY, e.originalEvent.wheelDelta*0.001);
		e.preventDefault();
        e.stopPropagation();
	});
	canvas.mousedown(function(e) {
		if(e.button==0 && !canvas._is_sel) {
			canvas.sel_rect = {x:canvas.relX(e.offsetX), y:canvas.relY(e.offsetY), w:0,h:0 };
		}
	});
	canvas.mouseup(function(e) {
		if(e.button==0) {
			if(canvas.sel_rect && canvas.sel_rect.w && canvas.sel_rect.h) {
				canvas.select_rectangle(canvas.sel_rect.x, canvas.sel_rect.y, canvas.sel_rect.w, canvas.sel_rect.h);
			} else if(!canvas._is_sel) canvas.unselect_all(); 
			canvas.sel_rect = null;
			canvas.elt_sel_rect.css("display", "none");
		}
	});
	canvas.mousemove(function(e) {
		if(canvas.sel_rect && canvas.sel_rect.x) {
			canvas.sel_rect.w = canvas.relX(e.offsetX) - canvas.sel_rect.x;
			canvas.sel_rect.h = canvas.relY(e.offsetY) - canvas.sel_rect.y;
			canvas.elt_sel_rect.attr("x", canvas.sel_rect.w < 0 ? canvas.sel_rect.x+canvas.sel_rect.w : canvas.sel_rect.x);
			canvas.elt_sel_rect.attr("y", canvas.sel_rect.h < 0 ? canvas.sel_rect.y+canvas.sel_rect.h : canvas.sel_rect.y);
			canvas.elt_sel_rect.attr("width", canvas.sel_rect.w < 0 ? -canvas.sel_rect.w : canvas.sel_rect.w);
			canvas.elt_sel_rect.attr("height", canvas.sel_rect.h < 0 ? -canvas.sel_rect.h : canvas.sel_rect.h);
			canvas.elt_sel_rect.css("display", "block");
		}
	});
	canvas.click(function(e) {	canvas._is_sel=false; canvas.blur();});
	
	canvas.focus = function() {canvas.parent().focus();};
	canvas.blur = function() {canvas.end_edit_text();};
	
	canvas.unselect_all = function() {cur_editor.unselect_all();};
	canvas.select_rectangle = function(x,y,w,h) {
		if(w<0) {x = x+w; w = -w;}
		if(h<0) {y = y+h; h = -h;}
		cur_editor.select_rectangle(x,y,w,h);
	};
	
	canvas.clear = function() {	canvas.maingroup.empty();	};
	
	$(window).resize(function() {canvas.update();});
	
	canvas.start_edit_text = function(t) {
		if(canvas.cur_edited_text) SVG_REMOVE_CLASS(t, "edit");
		SVG_ADD_CLASS(t, "edit");
		canvas.cur_edited_text = t;
	};
	canvas.end_edit_text = function() {
		if(canvas.cur_edited_text) SVG_REMOVE_CLASS(canvas.cur_edited_text, "edit");
		canvas.cur_edited_text = null;
	};
	canvas.keypress = function(e) { if(canvas.cur_edited_text) {on_text_keypress(e); return true;} return false;};
	canvas.keydown = function(e) { if(canvas.cur_edited_text) {on_text_keydown(e); return true;} return false;};
	

	return canvas;
}


function on_text_keydown(e) {
	var text = cur_canvas.cur_edited_text.html();
	if (e.which == 8) { // Backspace
		e.preventDefault();
		text = text.substring(0,text.length-1);
		cur_canvas.cur_edited_text.html(text);
		cur_canvas.cur_edited_text.on_change();
	};
	if (e.which == 13) { cur_canvas.blur(); };
}

function on_text_keypress(e) {
	var text = cur_canvas.cur_edited_text.html();
	text = text+String.fromCharCode(e.which);
	cur_canvas.cur_edited_text.html(text);
	cur_canvas.cur_edited_text.on_change();
}
	


$(function() {
	$(window).mousedown(function(e) { 
		document.btn = e.button; 
		if(e.button==0 && document.edragged) return false; 
//		if(e.button==0 && !$(e.target).attr("contentEditable")) return false;
	});
	$(window).mousemove(function(e) { 
		if(document.edragged && typeof(document.lastX)!="undefined" && document.btn==0) 
			document.edragged.dragg(e.pageX-document.lastX, e.pageY-document.lastY); 
		document.lastX = e.pageX; document.lastY = e.pageY; 
	});
	$(window).mouseup(function(e) { document.btn = -1; document.edragged = null;});
});



///////////////////
// EDITABLE LIST //
///////////////////

function create_editable_list(data, selected_items) {
	var list = $("<ul class='editable_list' />");
	var li_new = $("<li class='add'></li>");
	list.append(li_new);
	var ul_choices = $("<ul class='choices'/>");
	li_new.click(function() {
		ul_choices.css("top",list.offset().top+list.height()); ul_choices.slideDown(100);
	});
	list.append(li_new);
	list.append(ul_choices);
	
	list.add = function(x) {
		if(list.children("li:not(.add):contains("+x+")").length) return;
		var li = $("<li class='item'>"+x+"<button class='remove' /></li>");
		li.insertBefore(li_new);
		ul_choices.children("li:contains("+x+")").addClass("selected");
		li.children(".remove").click(function() {
			li.remove();
			ul_choices.children("li:contains("+x+")").removeClass("selected");
			list.change();
		});
		ul_choices.slideUp(100);
	};
	list.add_choice = function(x) {
		ul_choices.append($("<li>"+x+"</li>").click(function(e) { 
			list.add(x); 
			list.change();
		}));	
	};
	list.get_selected_items = function() {
		var d = [];
		list.children("li:not(.add)").each(function() {d.push($(this).text());});
		return d;
	};
	list.change = function(listener) {
		if(ISDEF(listener)) {
			if(!ISDEF(list.changeListeners)) list.changeListeners = [];
			list.changeListeners.push(listener);
			return list;
		} else for(var i = 0; i < list.changeListeners.length; i++) list.changeListeners[i]();
	};

	for(var i = 0; i<data.length; i++) list.add_choice(data[i]);
	if(selected_items) for(var i = 0; i<selected_items.length; i++) list.add(selected_items[i]);
	return list;
}


function create_editable_list_editable(selected_items) {
	var list = $("<ul class='editable_list' />");
	var li_new = $("<li class='add'></li>");
	list.append(li_new);
	li_new.click(function() {list.add("");});
	list.append(li_new);
	
	list.add = function(x) {
		var li = 
			x ? $("<li class='item'>"+x+"<button class='remove' /></li>")
			  : $("<li class='item'><span class='edit' contentEditable=true></span><button class='remove' /></li>");
		li.insertBefore(li_new);
		li.children(".edit").blur(function() {if(!li.children(".edit").text().trim()) li.remove(); list.change();});
		li.children(".edit").keydown(function(e) {if (e.which == 13 || e.which==27) { $(this).attr("contentEditable", "false"); $(this).blur();};});
		li.children(".edit").focus();
		li.children(".remove").click(function() {
			li.remove();
		});
	};
	list.get_selected_items = function() {
		var d = [];
		list.children("li:not(.add)").each(function() {d.push($(this).text());});
		return d;
	};
	list.change = function(listener) {
		if(ISDEF(listener)) {
			if(!ISDEF(list.changeListeners)) list.changeListeners = [];
			list.changeListeners.push(listener);
			return list;
		} else {
			if(!ISDEF(list.changeListeners)) return;
			var si = this.get_selected_items();
			for(var i = 0; i < list.changeListeners.length; i++) list.changeListeners[i](si);
		}
	};

	if(selected_items) for(var i = 0; i<selected_items.length; i++) list.add(selected_items[i]);
	return list;
}