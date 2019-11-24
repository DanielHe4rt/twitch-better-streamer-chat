const $ = require("jquery");
const moment = require("moment");
const parseColor = require("parse-color");

const socket = require("./socket");
const commands = require("../commands.json");
const emotes = require("./assets/emotes.json");
const config = require("../config.json");

const getBadges = badges => {
  if (!badges) return "";
  return Object.keys(badges).reduce(
    (acc, key) =>
      acc + `<img class="badges" src="./images/${key}.png" width="20"> `,
    ""
  );
};

const formatName = (name, color) =>
  `<span class="user-name" style="color: ${
    color !== null ? color : "#fed12d"
  }">${name}: </span>`;

const showImage = imgUrl => `<img src="${imgUrl}" width="250"></p>`;

const filterIcons = msg => {
  const emote = emotes.find(emote => msg.search(emote.regex) >= 0);
  return emote
    ? msg.replace(emote.regex, `<img src='${emote.image_url}'>`)
    : msg;
};

const sendMessage = (badges, name, color, chatMessage, regex = false) => {
  let msg = chatMessage;
  if (!msg.includes("<img")) {
    if (regex) {
      msg = msg.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/g, "");
    }
  }

  document.getElementById("chat").insertAdjacentHTML(
    "beforeend",
    `<div class="chat-row">
        <div id="actions" style="display:none;">
          <div>
            <button type="button" ><i class="fas fa-eraser erase-style" ></i></button>
            <button type="button" class="delete" >&times;</button>
          </div>
        </div>
        <div class="user-info">
          ${getBadges(badges)}
          ${formatName(name, color)}
        </div>
        <p class="message">
          ${msg}
        </p>
      </div>`
  );
};

const popChat = () => {
  if ($("#chat-row").length >= 50) {
    $("#chat-row")[0].remove();
  }
};
socket.on("data", data => console.log(data.toString()));
let id = 1;
const dispatchCommand = command => {
  command = { ...command, id: id++ };
  socket.write(JSON.stringify(command) + "\r\n");
  return new Promise(resolve =>
    socket.on("data", data => {
      const obj = JSON.parse(data.toString());
      if (obj.id === command.id) {
        resolve(obj);
      }
    })
  );
};
const colorHandler = async hex => {
  console.log("asdasdas");
  if (!parseColor(hex).hex) {
    return;
  }
  const color = parseColor(hex);
  const colorValue = parseInt(color.hex.slice(1), 16);
  const bright = color.rgba.slice(-1) * 100;

  return Promise.all([
    dispatchCommand({
      ...commands.color,
      params: [colorValue, "smooth", 500]
    }),
    dispatchCommand({
      ...commands.bright,
      params: [bright, "smooth", 500]
    })
  ]);
};

const manageChat = (chatter, msg, regex = false) => {
  popChat();
  const cmd = msg.split(" ");
  if (cmd) {
    switch (cmd[0]) {
      case "!image":
        sendMessage(
          chatter.badges,
          chatter.username,
          chatter.color,
          showImage(cmd[1]),
          false
        );
        break;
      case "!color":
        colorHandler(cmd.slice(1).join(" "));
        break;

      default:
        sendMessage(
          chatter.badges,
          chatter.username,
          chatter.color,
          filterIcons(msg),
          regex
        );
        break;
    }

    $("#chat").animate({ scrollTop: $("#chat").prop("scrollHeight") }, 1);
  }
};

const getStreamData = res => {
  const user = res.data[0];
  const uptime = moment().diff(moment(user.started_at));
  const duration = moment.duration(uptime);
  $("#title").html(user.title);
  $("#streamer-name").html(user.user_name);
  $("#viewers").html(user.viewer_count);
  $("#uptime").html(`${duration.hours()}h ${duration.minutes()} m`);
};

const getStreamInformation = () => {
  const headers = new Headers();

  headers.append("Client-ID", config.client_id);

  fetch(`https://api.twitch.tv/helix/streams?user_id=${config.user_id}`, {
    headers
  })
    .then(res => res.json())
    .then(getStreamData)
    .catch(error => console.log(error));
};

const getChatters = channel => {
  fetch(`http://tmi.twitch.tv/group/user/${channel}/chatters`)
    .then(res => res.json())
    .then(res => {
      const ul = document.createElement("ul");
      Object.keys(res.chatters).forEach(val => {
        res.chatters[val].forEach(user => {
          const li = document.createElement("li");
          li.appendChild(document.createTextNode(user));
          ul.appendChild(li);
        });
      });
      document.querySelector("#showChatters").dataset.content = ul.outerHTML;
    })
    .catch(error => console.log(error));
};

module.exports = {
  manageChat,
  getStreamInformation,
  getChatters,
  sendMessage,
  dispatchCommand
};
