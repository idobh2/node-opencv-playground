const cv = require("opencv");
const WebSocket = require("ws");

const vid = new cv.VideoCapture(1);

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
			if(stop){
				return;
			}
			if (err) throw err;
			try{
				fn(mat);
				const buff = mat.toBuffer({ ext: ".jpg", jpegQuality: 50 });
				ws.send(buff);
			} catch(e){
				sendMessage("error", e.stack);
			};
			process.nextTick(capture);
		})
	}
	const log = (...args) => {
		sendMessage("log", args);
	}
	ws.on("message", (func) => {
		fn = eval(func);
	});
	ws.on("close", () => {
		stop = true;
	})
	capture();
});