const $ = require("jquery");
const emotes = require("./emotes.json");
const config = require("./config.json");
const moment = require("moment");

function getBadges(badges) {
  let html = "";
  if (!badges) {
    return "";
  }
  if (badges.length !== 0) {
    for (let key in badges) {
      html += `<img class="badges" src="./images/${key}.png" width="20"> `;
    }
    return html;
  }
}

function formatName(name, color) {
  
  return `<span class="user-name" style="color: ${
    color !== null ? color : "#fed12d"
  }">${name}: </span>`;
}
function showImage(img_url) {
  return `<img src="${img_url}" width="250"></p>`;
}

function filterIcons(msg) {
  emotes.forEach(function(item, index) {
    while (msg.search(item.regex) >= 0) {
      msg = msg.replace(item.regex, "<img src='" + item.image_url + "'>");
    }
  });
  console.log(msg)
  return msg;
}

function message(badges, name, color, message, regex = false) {
  if(!message.includes('<img')){
    if(regex){
      message = message.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/g,'')
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
          ${message}
        </p>
      </div>`
  );
}

function popChat() {
  if ($("#chat-row").length >= 50) {
    $("#chat-row")[0].remove();
  }
}


function manageChat(chatter, msg,regex = false) {
  popChat();

  let cmd = msg.split(" ");
  if (cmd) {
    switch (cmd[0]) {
      case "!image":
        message(
          chatter.badges,
          chatter.username,
          chatter.color,
          showImage(cmd[1]),
          false
        );
        break;

      default:
        message(
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
}

const getStreamInformation = () => {
  let headers = new Headers();

  headers.append("Client-ID", config.client_id);
  fetch(`https://api.twitch.tv/helix/streams?user_id=${config.user_id}`, {
    headers: headers
  })
    .then(res => res.json())
    .then(res => {
      
      const user = res.data[0];
      const uptime = moment().diff(moment(user.started_at));
      var duration = moment.duration(uptime);
      document.getElementById("title").innerHTML = user.title;
      document.getElementById("streamer-name").innerHTML = user.user_name;
      document.getElementById("viewers").innerHTML = user.viewer_count;
      document.getElementById("uptime").innerHTML =
        duration.hours() + "h " + duration.minutes() + " m";
      eae = user.thumbnail_url;
    })
    .catch(error => {});
};

function getChatters(channel) {
  fetch(`http://tmi.twitch.tv/group/user/${channel}/chatters`)
    .then(res => res.json())
    .then(res => {
      const ul = document.createElement("ul");
      Object.keys(res.chatters).map((val, i) => {
        res.chatters[val].map(user => {
          let li = document.createElement("li");
          li.appendChild(document.createTextNode(user));
          ul.appendChild(li);
        });
      });
      document.querySelector("#showChatters").dataset.content = ul.outerHTML;
    })
    .catch(error => {});
}
setInterval(() => getStreamInformation(), 5000);

module.exports = {
  manageChat,
  getStreamInformation,
  getChatters,
  message
};
