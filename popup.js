var defaultValues={
  white_list:["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n'),
  black_list:["*://example.com/*"].join('\n'),
  precision_number:2,
}


var myPort = browser.runtime.connect({name:"port-from-cs"});


window.onload=function()
{
var updatefunction = function(event){
  console.log("Popup will ask background to update lists because of",event)
  var checkbox_status =  Object.fromEntries( [...disable_checkboxes].map( x => [x.id, x.checked]) );
  var action_lists_status =  Object.fromEntries( [blacklist,whitelist,precision_number].map( x => [x.id, x.value||defaultValues[x.id]]) );
    myPort.postMessage(
        {
          ...action_lists_status,
          ...checkbox_status
        }
      );
 }
var updateexcludetext=function(){
    browser.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
    var urlobject=new URL(url) 
    
  var host_l2 = urlobject.hostname.split(".").slice(-precision_number.value).join(".")
    document.querySelector("#donotdarken").innerHTML="Exclude "+ host_l2
    donotdarken.onclick=x=>{
      blacklist.value = [...blacklist.value.trim().split("\n"),
      "*://"+host_l2+"/*",
      "*://*."+host_l2+"/*"]
      .filter(x=>x)
      .filter((x,y,z)=>z.indexOf(x) === y)
      .join("\n")

      /*
      browser.tabs.executeScript(tabs[0].id,{
        code: `[...document.styleSheets].filter(x=>x.href).map(x=>new URL(x.href).hostname.split('.').slice(-precision_number).join('.')).filter((x,y,z)=>z.indexOf(x) === y)`.replace("precision_number",precision_number.value)
      }).then(result=>{
          result[0].forEach(host_l2=>{
            blacklist.value = [...blacklist.value.trim().split("\n"),
            "*://"+host_l2+"/*",
          "*://*."+host_l2+"/*"]
          .filter(x=>x)
          .filter((x,y,z)=>z.indexOf(x) === y)
          .join("\n")
        });

      
        }).then(updatefunction);*/  
        updatefunction(); 
    }

});
}
    var blacklist=document.querySelector("#black_list");

    var whitelist=document.querySelector("#white_list");
    var precision_number=document.querySelector("#precision_number");
  var disable_checkboxes = document.querySelectorAll(".disable_something");

  browser.storage.local.get(null, function(res) {
    disable_checkboxes.forEach(e=>{
      e.checked=res[e.id];
      e.onchange=updatefunction;
    });
    [blacklist,whitelist].forEach(e=>{
      e.value=res[e.id] || defaultValues[e.id];
      e.onchange=e.onkeyup=x=>{
        if(x.ctrlKey && x.code=="KeyR" || x.code=="F5")
        {
          console.log("Ignoring refresh in popup textarea")
        }
        else
        {
          updatefunction(x);
        }
      }
    });
    [precision_number].forEach(e=>{
      e.value=res[e.id] || defaultValues[e.id];
      e.onchange=(x=>{updateexcludetext(x);updatefunction(x)});
    })

    updateexcludetext()

  });


}