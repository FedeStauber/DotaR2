import express from "express";
import { app, BrowserWindow, globalShortcut } from "electron";
import { logger } from "./logger";
import d2gsi from "./eventHandler/dota2-gsi";

const server = express();
const port = 3000;

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    /*  height: 1080,
    width: 1920, */
    movable: true,
    resizable: false,
    titleBarStyle: "hidden",
    center: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    fullscreen: true,
    show: true,
  });
  mainWindow.removeMenu();
  mainWindow.setMenu(null);
  mainWindow.loadFile("./src/index.html");
  setTimeout(() => {
    globalShortcut.register("Alt+CommandOrControl+D", () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });
  }, 500);
});

const gsi = d2gsi({ port: 3000 });
gsi.events.on("newclient", function (client) {
  console.log("New client connection, IP address: " + client.ip);

  /*  client.on("newdata", function (asd: any) {
    console.log("se pickeo", asd.hero?.team2);
  });
 */
  client.on("draft:pick", function (asd: any) {
    console.log("acasiquesepickeo");
  });

  client.on("draft", function (asd: any) {
    console.log("draft", asd);
  });

  client.on("draft:pick", function (asd: any) {
    console.log("draft:pick", asd);
  });

  client.on("player:activity", function (activity: any) {
    if (activity == "playing") console.log("Game started!");
  });
  client.on("hero:level", function (level: any) {
    console.log("Now level " + level);
  });
  client.on("abilities:ability0:can_cast", function (can_cast: any) {
    if (can_cast) console.log("Ability0 off cooldown!");
  });
});

/* server.use(express.urlencoded({ extended: true }));
server.use(express.raw({ limit: "10Mb", type: "application/json" }));

server.post("/", (req, res) => {
  console.log(req.body);
  logger.info(req.body);
  const text = req.body
    .toString()
    .replace(/"(player|owner)":([ ]*)([0-9]+)/gm, '"$1": "$3"')
    .replace(/(player|owner):([ ]*)([0-9]+)/gm, '"$1": "$3"');
  const data = JSON.parse(text);
  res.sendStatus(200);
});

server.listen(port, () => {
  return console.log(`Server is listening on ${port}`);
});
 */
