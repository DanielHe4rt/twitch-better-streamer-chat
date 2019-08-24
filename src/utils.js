const $ = require('jquery');
const moment = require('moment');
const emotes = require('./assets/emotes.json');
const config = require('../config.json');

const getBadges = (badges) => {
  let html = '';
  if (!badges) return '';

  if (badges.length !== 0) {
    for (const key in badges) {
      if (Object.prototype.hasOwnProperty.call(badges, key)) {
        html += `<img class="badges" src="./images/${key}.png" width="20"> `;
      }
    }
    return html;
  }

  return null;
};

const formatName = (name, color) => `<span class="user-name" style="color: ${color !== null ? color : '#fed12d'}">${name}: </span>`;

const showImage = imgUrl => `<img src="${imgUrl}" width="250"></p>`;

const filterIcons = (msg) => {
  let parsedMsg = msg;
  emotes.forEach((item) => {
    while (parsedMsg.search(item.regex) >= 0) {
      parsedMsg = parsedMsg.replace(item.regex, `<img src='${item.image_url}'>`);
    }
  });
  return parsedMsg;
};

const message = (badges, name, color, chatMessage, regex = false) => {
  let msg = chatMessage;
  if (!msg.includes('<img')) {
    if (regex) {
      msg = msg.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/g, '');
    }
  }

  document.getElementById('chat').insertAdjacentHTML(
    'beforeend',
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
      </div>`,
  );
};

const popChat = () => {
  if ($('#chat-row').length >= 50) {
    $('#chat-row')[0].remove();
  }
};

const manageChat = (chatter, msg, regex = false) => {
  popChat();

  const cmd = msg.split(' ');
  if (cmd) {
    switch (cmd[0]) {
    case '!image':
      message(chatter.badges, chatter.username, chatter.color, showImage(cmd[1]), false);
      break;

    default:
      message(chatter.badges, chatter.username, chatter.color, filterIcons(msg), regex);
      break;
    }

    $('#chat').animate({ scrollTop: $('#chat').prop('scrollHeight') }, 1);
  }
};

const getStreamInformation = () => {
  const headers = new Headers();

  headers.append('Client-ID', config.client_id);

  fetch(`https://api.twitch.tv/helix/streams?user_id=${config.user_id}`, {
    headers,
  })
    .then(res => res.json())
    .then((res) => {
      console.log(res)
      const user = res.data[0];
      const uptime = moment().diff(moment(user.started_at));
      const duration = moment.duration(uptime);
      $('#title').html(user.title);
      $('#streamer-name').html( user.user_name);
      $('#viewers').html(user.viewer_count)
      $('#uptime').html(`${duration.hours()}h ${duration.minutes()} m`);
    })
    .catch(error => console.log(error));
};

const getChatters = (channel) => {
  fetch(`http://tmi.twitch.tv/group/user/${channel}/chatters`)
    .then(res => res.json())
    .then((res) => {
      const ul = document.createElement('ul');
      Object.keys(res.chatters).forEach((val) => {
        res.chatters[val].forEach((user) => {
          const li = document.createElement('li');
          li.appendChild(document.createTextNode(user));
          ul.appendChild(li);
        });
      });
      document.querySelector('#showChatters').dataset.content = ul.outerHTML;
    })
    .catch(error => console.log(error));
};

setInterval(() => getStreamInformation(), 5000);

module.exports = {
  manageChat,
  getStreamInformation,
  getChatters,
  message,
};
