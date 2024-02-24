import express from "express";
import bodyParser from "body-parser";
import { EventEmitter } from "events";
import { logger } from "../logger";

const events = new EventEmitter();
const clients: GSIClient[] = [];

interface IGame {
  team2: ITeam;
  team3: ITeam;
}

interface ITeam {
  players: IPlayer[];
}

interface IPlayer {
  inGameName: string;
  inGameId?: string;
  heroPicked: string;
}

class GSIClient extends EventEmitter {
  ip: string;
  gamestate: any;
  game: IGame;

  constructor(ip: string) {
    super();
    this.ip = ip;
    this.gamestate = {};
    this.game = { team2: { players: [] }, team3: { players: [] } };
  }
}

function CheckClient(req: any, res: any, next: any) {
  for (let i = 0; i < clients.length; i++) {
    if (clients[i].ip == req.ip) {
      req.client = clients[i];
      return next();
    }
  }

  clients.push(new GSIClient(req.ip!));
  req.client = clients[clients.length - 1];
  req.client.gamestate = req.body;

  events.emit("newclient", clients[clients.length - 1]);

  next();
}

function EmitAll(prefix: string, obj: any, emitter: EventEmitter) {
  Object.keys(obj).forEach((key) => {
    emitter.emit(prefix + key, obj[key]);
  });
}

function RecursiveEmit(
  prefix: string,
  changed: any,
  body: any,
  emitter: EventEmitter
) {
  Object.keys(changed).forEach((key) => {
    if (typeof changed[key] == "object") {
      if (body[key] != null) {
        RecursiveEmit(prefix + key + ":", changed[key], body[key], emitter);
      }
    } else {
      if (body[key] != null) {
        if (typeof body[key] == "object") {
          EmitAll(prefix + key + ":", body[key], emitter);
        } else {
          emitter.emit(prefix + key, body[key]);
        }
      }
    }
  });
}

function ProcessChanges(section: string) {
  return function (req: any, res: any, next: any) {
    if (req.body[section]) {
      RecursiveEmit("", req.body[section], req.body, req.client);
    }
    next();
  };
}

function UpdateGamestate(req: any, res: any, next: any) {
  req.client.gamestate = req.body;
  next();
}

function NewData(req: any, res: any) {
  req.client.emit("newdata", req.body);
  res.end();
}

setInterval(function () {
  clients.forEach(function (client, index) {
    if (client?.gamestate?.hero) {
      Object.keys(client.gamestate.hero.team2).map((player) => {
        client.game.team2.players.push({
          inGameId: player,
          inGameName: "",
          heroPicked: "",
        } as IPlayer);
      });
      Object.keys(client.gamestate.hero.team3).map((player) => {
        client.game.team3.players.push({
          inGameId: player,
          inGameName: "",
          heroPicked: "",
        } as IPlayer);
      });

      if (client?.gamestate?.hero?.team2 || client?.gamestate?.hero?.team3) {
        // Visitar el estado del juego para recorrer el array del equipo 2 y revisar si pickeo un nuevo héroe
        Object.keys(client?.gamestate?.hero?.team2).forEach((player: any) => {
          const team2PlayerIndex = client.game.team2.players?.findIndex(
            (p) => p.inGameId === player
          );
          if (
            client.game.team2.players[team2PlayerIndex].heroPicked === "" &&
            client.gamestate.hero?.team2[player]?.name
          ) {
            console.log(
              "sepickeo del equipo 2 ",
              client.gamestate.hero?.team2[player]?.name
            );
            client.game.team2.players[team2PlayerIndex].heroPicked =
              client.gamestate.hero?.team2[player]?.name;
          }
        });
        // Visitar el estado del juego para recorrer el array del equipo 3 y revisar si pickeo un nuevo héroe
        Object.keys(client?.gamestate?.hero?.team3).forEach((player: any) => {
          const team3PlayerIndex = client.game.team3.players?.findIndex(
            (p) => p.inGameId === player
          );
          if (
            client.game.team3.players[team3PlayerIndex].heroPicked === "" &&
            client.gamestate.hero?.team3[player]?.name
          ) {
            console.log("sepickeo del equipo 3");
            client.game.team3.players[team3PlayerIndex].heroPicked =
              client.gamestate.hero?.team3[player]?.name;
          }
        });
      }
    }
  });
}, 0.5 * 1000);

const d2gsi = (options: {
  port?: number;
  tokens?: string | string[] | null;
  ip?: string;
}) => {
  options = options || {};
  const port = options.port || 3000;
  const ip = options.ip || "0.0.0.0";

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post(
    "/",
    CheckClient,
    UpdateGamestate,
    ProcessChanges("previously"),
    ProcessChanges("added"),
    NewData
  );

  const server = app.listen(port, ip, () => {
    console.log("Dotar2 listening on port " + port);
  });

  return { events };
};

export = d2gsi;
