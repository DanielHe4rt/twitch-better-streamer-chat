/* eslint-disable */

let regex = false;

require('../src/renderer.js');
require('./js/bootstrap.bundle.min.js');
const $ = require('jquery');
$(document).on('click','.erase-style', function() {
  let data = $(this).parent().closest(".chat-row").find('.message')[0]
  let msg = data.innerHTML
  data.innerHTML = msg.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/,'<p $1$2>')
})

$(document).on('click','.delete', function() {
  $(this).parent().closest(".chat-row")[0].remove();
})

$(document).ready(function(){

  $('[data-toggle=popover]').popover({
    html: true,
  });

  $("#deleteStyles").click(() => {
      $('#chat').find('style').remove();
  });

});

$(document).on("click",'#regexSwitch', function(){
  if(regex){
    $(this).find('i').removeClass('fa-frown').addClass('fa-flushed')
    regex = false;
  }else{
    $(this).find('i').removeClass('fa-flushed').addClass('fa-frown')
    regex = true;
  }
})

$(document).on("click",".chat-row",function (){
    let div = $(this).find('#actions')[0];
    div.style.display = div.style.display === "none" ? "" : "none";
});
