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
        this.game = { team2: { players: [] }, team3: { players: [] } };
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
setInterval(function () {
    clients.forEach(function (client, index) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if ((_a = client === null || client === void 0 ? void 0 : client.gamestate) === null || _a === void 0 ? void 0 : _a.hero) {
            Object.keys(client.gamestate.hero.team2).map((player) => {
                client.game.team2.players.push({
                    inGameId: player,
                    inGameName: "",
                    heroPicked: "",
                });
            });
            Object.keys(client.gamestate.hero.team3).map((player) => {
                client.game.team3.players.push({
                    inGameId: player,
                    inGameName: "",
                    heroPicked: "",
                });
            });
            if (((_c = (_b = client === null || client === void 0 ? void 0 : client.gamestate) === null || _b === void 0 ? void 0 : _b.hero) === null || _c === void 0 ? void 0 : _c.team2) || ((_e = (_d = client === null || client === void 0 ? void 0 : client.gamestate) === null || _d === void 0 ? void 0 : _d.hero) === null || _e === void 0 ? void 0 : _e.team3)) {
                // Visitar el estado del juego para recorrer el array del equipo 2 y revisar si pickeo un nuevo héroe
                Object.keys((_g = (_f = client === null || client === void 0 ? void 0 : client.gamestate) === null || _f === void 0 ? void 0 : _f.hero) === null || _g === void 0 ? void 0 : _g.team2).forEach((player) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    const team2PlayerIndex = (_a = client.game.team2.players) === null || _a === void 0 ? void 0 : _a.findIndex((p) => p.inGameId === player);
                    if (client.game.team2.players[team2PlayerIndex].heroPicked === "" &&
                        ((_c = (_b = client.gamestate.hero) === null || _b === void 0 ? void 0 : _b.team2[player]) === null || _c === void 0 ? void 0 : _c.name)) {
                        console.log("sepickeo del equipo 2 ", (_e = (_d = client.gamestate.hero) === null || _d === void 0 ? void 0 : _d.team2[player]) === null || _e === void 0 ? void 0 : _e.name);
                        client.game.team2.players[team2PlayerIndex].heroPicked =
                            (_g = (_f = client.gamestate.hero) === null || _f === void 0 ? void 0 : _f.team2[player]) === null || _g === void 0 ? void 0 : _g.name;
                    }
                });
                // Visitar el estado del juego para recorrer el array del equipo 3 y revisar si pickeo un nuevo héroe
                Object.keys((_j = (_h = client === null || client === void 0 ? void 0 : client.gamestate) === null || _h === void 0 ? void 0 : _h.hero) === null || _j === void 0 ? void 0 : _j.team3).forEach((player) => {
                    var _a, _b, _c, _d, _e;
                    const team3PlayerIndex = (_a = client.game.team3.players) === null || _a === void 0 ? void 0 : _a.findIndex((p) => p.inGameId === player);
                    if (client.game.team3.players[team3PlayerIndex].heroPicked === "" &&
                        ((_c = (_b = client.gamestate.hero) === null || _b === void 0 ? void 0 : _b.team3[player]) === null || _c === void 0 ? void 0 : _c.name)) {
                        console.log("sepickeo del equipo 3");
                        client.game.team3.players[team3PlayerIndex].heroPicked =
                            (_e = (_d = client.gamestate.hero) === null || _d === void 0 ? void 0 : _d.team3[player]) === null || _e === void 0 ? void 0 : _e.name;
                    }
                });
            }
        }
    });
}, 0.5 * 1000);
const d2gsi = (options) => {
    options = options || {};
    const port = options.port || 3000;
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
