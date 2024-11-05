var defaultValues={
  white_list:["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n'),
  black_list:["*://example.com/*"].join('\n'),
  precision_number:2,
}


let myPort = browser.runtime.connect({name:"port-from-popup"});

let usedMode = new URL(document.location.href).searchParams.get("mode")
if(usedMode)
  {document.documentElement.classList.add(usedMode);}

window.onload=function()
{
  fetch("manifest.json").then(x=>x.json()).then(x=>document.querySelectorAll(".version").forEach(z=>z.innerText=x.version))
  var updatefunction = function(event){
    console.log("Popup will ask background to update status and list because of",event)
    var checkbox_status =  Object.fromEntries( [...disable_checkboxes].map( x => [x.id, x.checked]) );
    var action_lists_status =  Object.fromEntries( [blacklist,whitelist,precision_number].map( x => [x.id, x.value||defaultValues[x.id]]) );
    browser.storage.local.set(
      {
        ...action_lists_status,
        ...checkbox_status
      }
    ), () => {
      console.log('Settings saved');
    }
    
  }
  var updateexcludetext=function(){
    browser.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
      let url = tabs[0].url;
      var urlobject=new URL(url) 
      
      var host_l2 = urlobject.hostname.split(".").slice(-precision_number.value).join(".")
      document.querySelector("#donotdarken").textContent="Exclude "+ host_l2
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
    
    document.addEventListener("click",function(e){
      if(e.target.classList.contains("close_window"))
        {
        setTimeout(()=>window.close(),100); 
      }
    })
    
    function loadURL(strUrl)
    {
      try{
        let objUrl = new URL(strUrl);
        
        myPort.postMessage(
          {
            allowFraming:true,
          }
        );
        websitePickerIframe.src=objUrl.href;
        
      }
      catch(e)
      {
        console.error(e)
      }
    }
    websitePicker.addEventListener("change",function(e){
      websitePickerText.value=this.value;
      loadURL(this.value);
    })
    document.querySelector("[data-editProperty]").addEventListener("change",function(e){ 
      let splited = (this.getAttribute("data-editProperty").split("|",2));
      let [selector,property]=splited
      console.log(selector,property)
      document.querySelectorAll(selector).forEach(x=>{
        x.style[property]=this.value;
      })
      
    });
    {
      let shiftSelector = document.querySelector(".shiftSelector");
      
      for(i=1;i<=5;i++)
        {
        shiftSelector.parentNode.appendChild(shiftSelector.cloneNode(true));
      }
    }
  }