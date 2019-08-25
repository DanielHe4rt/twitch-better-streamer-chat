/* eslint-disable import/no-extraneous-dependencies */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { remote } = require('electron');
const tmi = require('tmi.js');
const $ = require('jquery');
const config = require('../config.json');
const { manageChat, message, getChatters } = require('./utils.js');

const opts = {
  identity: {
    username: 'MeuBotFavorito',
    password: `oauth:${config.token}`,
  },
  connection: {
    reconnect: true,
    secure: true,
  },
  channels: config.channels,
};

// Create a client with our options
const client = new tmi.Client(opts);
message(null, config.botName, null, 'Chat iniciado');

client.on('message', (channel, userstate, chatMessage, self) => {
  getChatters('danielhe4rt');
  // Don't listen to my own messages..
  if (self) return;
  // console.log(userstate);
  // Handle different message types..
  switch (userstate['message-type']) {
  case 'action':
    manageChat(userstate, chatMessage, null);
    break;
  case 'chat':
    manageChat(userstate, chatMessage, null);
    break;
  default:
    // Something else ?
    break;
  }
});

client.connect();

document.getElementById('close').addEventListener('click', () => {
  remote.BrowserWindow.getFocusedWindow().close();
});

document.getElementById('minimize').addEventListener('click', () => {
  remote.BrowserWindow.getFocusedWindow().minimize();
});

document.getElementById('maximize').addEventListener('click', () => {
  remote.BrowserWindow.getFocusedWindow().maximize();
});

$('#button-send').click(() => {
  const textInput = $('#input');
  if (textInput.val() < 1) return;

  // define message
  const msg = textInput.val();
  // render message
  message(null, config.channels[0], null, msg);
  // send message
  client.say(opts.channels[0], msg);
  // clear input
  $('#input').val('');
});
