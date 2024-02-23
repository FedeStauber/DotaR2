"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const events_1 = require("events");
const events = new events_1.EventEmitter();
const clients = [];
class GSIClient extends events_1.EventEmitter {
    constructor(ip) {
        super();
        this.ip = ip;
        this.gamestate = {};
    }
}
function CheckClient(req, res, next) {
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].ip == req.ip) {
            req.client = clients[i];
            return next();
        }
    }
    clients.push(new GSIClient(req.ip));
    req.client = clients[clients.length - 1];
    req.client.gamestate = req.body;
    events.emit("newclient", clients[clients.length - 1]);
    next();
}
function EmitAll(prefix, obj, emitter) {
    Object.keys(obj).forEach((key) => {
        emitter.emit(prefix + key, obj[key]);
    });
}
function RecursiveEmit(prefix, changed, body, emitter) {
    Object.keys(changed).forEach((key) => {
        if (typeof changed[key] == "object") {
            if (body[key] != null) {
                RecursiveEmit(prefix + key + ":", changed[key], body[key], emitter);
            }
        }
        else {
            if (body[key] != null) {
                if (typeof body[key] == "object") {
                    EmitAll(prefix + key + ":", body[key], emitter);
                }
                else {
                    emitter.emit(prefix + key, body[key]);
                }
            }
        }
    });
}
function ProcessChanges(section) {
    return function (req, res, next) {
        if (req.body[section]) {
            RecursiveEmit("", req.body[section], req.body, req.client);
        }
        next();
    };
}
function UpdateGamestate(req, res, next) {
    req.client.gamestate = req.body;
    next();
}
function NewData(req, res) {
    req.client.emit("newdata", req.body);
    res.end();
}
const d2gsi = (options) => {
    options = options || {};
    const port = options.port || 3000;
    const tokens = options.tokens || null;
    const ip = options.ip || "0.0.0.0";
    const app = (0, express_1.default)();
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.post("/", CheckClient, UpdateGamestate, ProcessChanges("previously"), ProcessChanges("added"), NewData);
    const server = app.listen(port, ip, () => {
        console.log("Dotar2 listening on port " + port);
    });
    return { events };
};
module.exports = d2gsi;
