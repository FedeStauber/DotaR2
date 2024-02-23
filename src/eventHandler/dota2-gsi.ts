import express from "express";
import bodyParser from "body-parser";
import { EventEmitter } from "events";
import { logger } from "../logger";

const events = new EventEmitter();
const clients: GSIClient[] = [];

class GSIClient extends EventEmitter {
  ip: string;
  gamestate: any;

  constructor(ip: string) {
    super();
    this.ip = ip;
    this.gamestate = {};
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

const d2gsi = (options: {
  port?: number;
  tokens?: string | string[] | null;
  ip?: string;
}) => {
  options = options || {};
  const port = options.port || 3000;
  const tokens = options.tokens || null;
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
