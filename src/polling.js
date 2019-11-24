const commands = require("../commands.json");
const config = require("../config.json");
const axios = require("axios");
const { dispatchCommand } = require("./utils");

const ClientID = config.user_id;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const fetchFollowers = async () => {
  const config = {
    headers: {
      "Client-ID": ClientID
    }
  };
  const followersResponse = await axios.get(
    `https://api.twitch.tv/helix/users/follows?to_id=${227168488}`,
    config
  );
  return followersResponse.data.data;
};

const run = previous =>
  fetchFollowers().then(followers => {
    console.log(followers[0].followed_at);
    if (previous) {
      const lastPreviousFollower = previous[0].from_id;
      const from = followers.findIndex(
        follower => follower.from_id === lastPreviousFollower
      );
      const newFollowers = from === -1 ? followers : followers.slice(0, from);

      if (newFollowers.length > 0) {
        console.log("FLOW");
        dispatchCommand(commands.follow);
      }
    }
    return sleep(1000).then(() => run(followers));
  });
run();
