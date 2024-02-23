"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const electron_1 = require("electron");
const dota2_gsi_1 = __importDefault(require("./eventHandler/dota2-gsi"));
const server = (0, express_1.default)();
const port = 3000;
electron_1.app.whenReady().then(() => {
    const mainWindow = new electron_1.BrowserWindow({
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
        electron_1.globalShortcut.register("Alt+CommandOrControl+D", () => {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            }
            else {
                mainWindow.show();
            }
        });
    }, 500);
    const gsi = (0, dota2_gsi_1.default)({ port: 3000 });
    gsi.events.on("newclient", function (client) {
        console.log("New client connection, IP address: " + client.ip);
        /*  client.on("newdata", function (asd: any) {
          console.log("se pickeo", asd.hero?.team2);
        });
       */
        client.on("hero:team2", function (asd) {
            console.log("sepickeoalgoelequipo2");
        });
        client.on("hero:team#:player#", function (asd) {
            console.log("sepickeoalgoelequipo3", asd);
        });
        client.on("draft:pick", function (asd) {
            console.log("draft:pick", asd);
        });
        client.on("player:activity", function (activity) {
            if (activity == "playing") {
                mainWindow.show();
                console.log("Game started!");
            }
        });
        client.on("hero:level", function (level) {
            console.log("Now level " + level);
        });
        client.on("abilities:ability0:can_cast", function (can_cast) {
            if (can_cast)
                console.log("Ability0 off cooldown!");
        });
    });
});
