// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { remote } = require("electron");
const config = require("./config.json");
const { manageChat, message, getChatters } = require("./utils.js");
const tmi = require("tmi.js");
const opts = {
  identity: {
    username: "MeuBotFavorito",
    password: "oauth:" + config.token
  },
  channels: ["#danielhe4rt"]
};

// Create a client with our options
const client = new tmi.client(opts);
message(null, "He4rtBot", null, "Chat iniciado");
message(null, "He4rtBot", null, '<a href="#" style="color: #EB007D">Topa Link Rosa?</a>');

client.on("message", (channel, userstate, message, self) => {
  getChatters("danielhe4rt");
  // Don't listen to my own messages..
  if (self) return;
  //console.log(userstate);
  // Handle different message types..
  switch (userstate["message-type"]) {
    case "action":
      manageChat(userstate, message,regex);
      break;
    case "chat":
      manageChat(userstate, message,regex);
      break;
    default:
      // Something else ?
      break;
  }
});

client.connect();

document.getElementById("close").addEventListener("click", () => {
  remote.BrowserWindow.getFocusedWindow().close();
});

document.getElementById("minimize").addEventListener("click", () => {
  remote.BrowserWindow.getFocusedWindow().minimize();
});

document.getElementById("maximize").addEventListener("click", () => {
  remote.BrowserWindow.getFocusedWindow().maximize();
});

// $("#button-send").on("click", function() {
//   $("form").submit();
// });
