const cv = require("opencv");
const WebSocket = require("ws");

const vid = new cv.VideoCapture(0);

const wss = new WebSocket.Server({ port: 9090 });
wss.on("connection", (ws) => {
	let stop = false;
	let fn = (mat) => { };
	const sendMessage = (type, data) => {
		ws.send(JSON.stringify({
			type,
			data,
		}));
	};
	const capture = () => {
		vid.read((err, mat) => {
			if (stop) {
				return;
			}
			if (err){
				sendMessage("error", err.stack);
			}
			try {
				if (fn) {
					fn(mat);
					const buff = mat.toBuffer({ ext: ".jpg", jpegQuality: 50 });
					ws.send(buff);
				}

			} catch (e) {
				sendMessage("error", e.stack);
			};
			process.nextTick(capture);
		})
	}
	const log = (...args) => {
		sendMessage("log", args);
	}
	const inClient = (fn, ...args) => {
		sendMessage("execute", {
			fn: `(${fn})`, 
			args,
		});
	}
	ws.on("message", (func) => {
		try {
			fn = eval(func);
		} catch (e) {
			fn = null;
			sendMessage("error", e.stack);
		}

	});
	ws.on("close", () => {
		stop = true;
	})
	capture();
});