<style>
Can be set :
After cretion->watch innerhtml -> possible
//After appending->watch innerhtml
<Elem>.style 
Can be set :
After creation->watch style -> possible
//After appending->watch style
<Elem>.style.property 
Can be set :
After creation->watch style.property -> possible
//After appending->watch style


//This works even if color is declared twice

	myspan = document.createElement("span")
	document.body.appendChild(myspan)
	myspan.innerText="TOTO"
	var properties = [
				["background-color","backgroundColor"],
			//	["border-left-color","borderLeftColor"],
			//	["border-right-color","borderRightColor"],
			//	["border-top-color","borderTopColor"],
			//	["border-bottom-color","borderBottomColor"],

			]
	function onlyUnique(value, index, self) { 
	    return self.indexOf(value) === index;
	}
	var properties_revert=[["color","color"]]
	temp0=myspan
	property=properties_revert[0]
	property.filter(onlyUnique).map(x=>{
					  		Object.defineProperty((temp0.style), x, {//edit on thr fly
									  set: function(val) {
											console.log(x,temp0,val)
											
									    this.setProperty(property[0],val)
									  	return true
									  }
									});
	})

	var observer1 = new MutationObserver(console.log);
	var observer2 = new MutationObserver(console.log);
	var target = myspan;
	var style_config ={ attributes : true, attributeFilter : ['style'] };//observe style
	var innerhtml_config = { characterData: false, attributes: false, childList: true, subtree: false };
	observer1.observe(target, style_config);
	observer2.observe(target, innerhtml_config);