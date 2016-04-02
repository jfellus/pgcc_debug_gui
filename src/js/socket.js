var MAX_TRIALS = 1000;

function Socket(ip) {
	var trials = 0;
	var _this = this;
	var socket = null;
	this.create_socket = function() {
		socket = new WebSocket('ws://'+ip, ['pgcc_debug']);
		socket.binaryType = 'arraybuffer';
		socket.onopen = function () { 
			workbench.set_connection_status(true);
			if(_this.on_open) _this.on_open();
		};
		socket.onerror = function (error) { 
			workbench.set_connection_status(false);
			//alert("TRY " + trials);
			if(trials++ > MAX_TRIALS) { alert("Ouch, unable to connect to " + ip); return; }
			console.log('WebSocket Error ' + error);
			setTimeout(function(){_this.create_socket();}, 100);
		};
		socket.onmessage = function (e) {   
			var id = new Uint32Array(e.data,0,1)[0];
			_this.on_recv(""+id, e.data);
		};
	};

	
	this.send = function(s) {
		socket.send(s);
	};
	
	
	
	this.create_socket();

}