var defaultRgx =  ["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n')


var myPort = browser.runtime.connect({name:"port-from-cs"});


browser.storage.local.get(null, function(res) {
  document.querySelector("#disable_webext").checked=res.is_disabled;

});
window.onload= function()
{

  var disable_checkbox=  document.querySelector("#disable_webext");
	disable_checkbox.onchange
  = function(){
    myPort.postMessage({
    	is_disabled: disable_checkbox.checked
    });
  }
}