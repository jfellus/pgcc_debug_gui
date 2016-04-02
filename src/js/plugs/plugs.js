var plugs = [];

function set_plugs_list(s) {
	plugs = [];
	var l = s.split("\n");
	for(var i=0; i<l.length; i++) {
		var t = l[i].split(",");
		if(t.length!=3) continue;
		plugs.push({variable:t[0], bReadOnly:(t[2]=='1' ? "R" : "RW"), type:t[1]});
	}
}

function DBG_PLUGS_LIST(table) {
	if(!table) { var l = $("<table />"); DBG_PLUGS_LIST(l); $("body").append(l); return;}
	function add(plug) {
		table.append($("<tr><td class='"+plug.bReadOnly+"'>"+plug.bReadOnly+"</td><td>"+plug.type+"</td><td>"+plug.variable + "</td></tr>")
				.click(function(){
					table.find_plug(table.cur_variable).parent().removeClass("selected");
					table.cur_variable = plug.variable;
					$(this).addClass("selected");
					table.on_select(plug);	
				})
		);		
	}
	for(var i = 0; i<plugs.length; i++) add(plugs[i]);

	table.find_plug = function(variable) {
		return table.find("td:last-child").filter(function(){return $(this).text()===variable;});
	};
	
	table.on_select = function(plug) {};
	table.select = function(variable) {table.find_plug(variable).parent().addClass("selected"); table.cur_variable = variable;};
}

function pgdb_get_plug_infos(variable) {
	for(var i = 0; i<plugs.length; i++) {
		if(plugs[i].variable === variable) return plugs[i];
	}
	return null;
}

/////////////
// STREAMS //
/////////////

var streams = [];



function pgdb_get_plug(variable) {
	for(var i = 0; i<streams.length; i++) {
		if(streams[i].variable === variable) return streams[i];
	}
	return new Plug(variable);
}


function Plug(variable) {
	var _this = this;
	this.variable = variable;
	this.plug_infos = pgdb_get_plug_infos(variable);
	this.listeners = [];
	
	this.on_recv = function(data) {
		for(var i=0; i<this.listeners.length; i++) {
			this.listeners[i].update(data);
		}
	};
	
	this.on_info = function(data) {
		for(var i=0; i<this.listeners.length; i++) {
			if(this.listeners[i].update_info) this.listeners[i].update_info(data);
		}
	};
	
	this.request = function() {
		debug_socket.send("G"+this.variable);
	};
	
	this.set = function(val) {
		debug_socket.send("S"+this.variable+","+val);
	};
		
	this.add_listener = function(l) { this.listeners.push(l);};
	
	this.remove_listener = function(l) {
		this.listeners.remove(l);
		if(this.listeners.length==0) this.unplug();
	};
	
	this.unplug = function() {
		streams.remove(this);
		debug_socket.send("U"+this.channel);
	};
	
	this.find_channel = function() {
		var channel = 0;
		while(streams[""+channel]) channel++;
		return channel;	
	};
	
	this.plug = function(channel) {
		this.channel = ""+channel;
		streams[this.channel] = this;
		function do_plug() {
			if(debug_socket && debug_socket.bReady && plugs.length>0) {
				_this.plug_infos = pgdb_get_plug_infos(_this.variable);
				debug_socket.send("P"+_this.variable+","+_this.channel);
				_this.ready();
			}
			else setTimeout(do_plug, 500);
		}
		do_plug();
	};

	this.ready = function(l) {
		if(!this.ready_listeners) this.ready_listeners = [];
		if(l) {
			this.ready_listeners.push(l);
			if(this.bReady) l();
		} else {
			this.bReady = true;
			for(var i=0; i<this.ready_listeners.length; i++) this.ready_listeners[i]();
		}
	};
	
	this.is = function(type) {
		if(!this.plug_infos) return false;
		return this.plug_infos.type === type;
	};
	
	this.plug(this.find_channel());
}
