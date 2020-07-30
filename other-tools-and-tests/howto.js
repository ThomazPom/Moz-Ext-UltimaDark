must_eval = x=>{
document.o_createElement = document.createElement;

String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


var min=Math.min;
var max=Math.max;
var rgb=rgba=function(r,g,b,a){
    var maxcol = max(r,g,b);
    if(maxcol<=maxbrighttigger){return "rgba("+r+","+g+","+b+","+(a||1)+")";}
    var delta = maxcol-maxbright;
    r=r-delta;g=g-delta;b=b-delta
    return "rgba("
                    +max(r,0)+","
                    +max(g,0)+","
                    +max(b,0)+","
                    +min(a||1)+")"
}
var revert_rgb=revert_rgba=function(r,g,b,a){
    var mincol = min(r,g,b);
    if(mincol>=minbright){return "rgba("+r+","+g+","+b+","+(a||1)+")"}
    var delta = minbright-mincol;

    r=r+delta;g=g+delta;b=b+delta;

	var multiplier = 255/max(r,g,b)
    return "rgba("
                    +min(parseInt(r*multiplier),255)+","
                    +min(parseInt(g*multiplier),255)+","
                    +min(parseInt(b*multiplier),255)+","
                    +min(a||1)+")"
}





var minbright=210;
var maxbright=70;
var maxbrighttigger=210;

var doproperties=window.doproperties=function(propertys,prefix="",elems=undefined,elemscontainer=document){
var apply = "darked_"+[prefix,propertys].toString().hashCode()
elems = elems || elemscontainer.querySelectorAll(":not(.dark_preset),:not(.darked_lock) :not(."+apply+"):not(.darked_lock)");


elems.forEach(function(temp0){

	if(!(temp0 instanceof Element)){return}

	propertys.forEach(function(property){

		var computed = getComputedStyle(temp0);
	

		var basergb=getComputedStyle(temp0)[property[0]];
		if(basergb)
		{

			if(["rgb(0, 0, 0)","rgba(0, 0, 0, 0)"].includes(basergb+prefix)){return}
			//var rgbstring = eval(prefix+basergb); TO FIX
			
			temp0.style[property[0]]=rgbstring
			
		//temp0.classList.add("dark_preset");

		}

			try{

				
				 property.map(x=>{
				  		Object.defineProperty((temp0.style), x, {
								  set: function(val) {
								  	var elemExample = document.o_createElement("span");
								  	elemExample.color=val;
								  	var basergb2=getComputedStyle(temp0)["color"];
									if(["rgb(0, 0, 0)","rgba(0, 0, 0, 0)"].includes(basergb+prefix)){return}
								 //   this.setProperty(property[0],eval(prefix+basergb2))
								  	return true
								  }
								});
				 
				 })
				 
		}	
		catch(e){
	//		console.log(e)
		}


//temp0.classList.add(apply);




	})

})

}

var properties = [
			["background-color","backgroundColor"],
		//	["border-left-color","borderLeftColor"],
		//	["border-right-color","borderRightColor"],
		//	["border-top-color","borderTopColor"],
		//	["border-bottom-color","borderBottomColor"],

		]

var properties_revert=[["color","color"]]


Inspector = window.Inspector = class Inspector {
    constructor(leType, atName,applyOnReturn=false) {

	        var leProto = leType instanceof Function ? leType.prototype : leType
	        var originalMethod = leProto[atName]
	        var inspectMethod = function() {

	        //console.log(originalMethod, "called with", arguments, "on", this || leType)
			
			var callresult = originalMethod.apply(this, arguments)
			doproperties(properties,"", applyOnReturn?[callresult]:[...arguments]);
			doproperties(properties_revert,"revert_", applyOnReturn?[callresult]:[...arguments]);
			console.log(callresult,properties);
			return callresult;
        }
        if(leProto[atName].name != "inspectMethod")
    	{
    		leProto[atName] = inspectMethod
    	}
        console.log("Now watching",leType.name, originalMethod, "in", document.location.href)
    }
}	

	new Inspector(Node, "insertBefore")
	new Inspector(Node, "appendChild")
	new Inspector(DocumentFragment, "insertBefore")
	new Inspector(DocumentFragment, "appendChild")
	new Inspector(Document, "createElement",true)











var alldark=function()
{
	doproperties(properties_revert,"revert_");
	doproperties(properties);
	//doproperties(["backgroundColor"],":after");
}

//setInterval(alldark,10000)
window.addEventListener("load", alldark);

}

//window.eval("("+must_eval.toString()+")()")











/*

if(property=="backgroundColor")
		{
			
			if(computed.backgroundImage.includes("gradient"))
			{
				var array = computed.backgroundImage.split(",")
				var dir = "linear-gradient("
				if(array[0].includes("deg") || array[0].includes("to ") )
				{
					dir=array[0]+",";
				}
				temp0.style.backgroundImage=dir+"darkgray,rgb(50,50,50))";
			//	temp0.style.background="rgb(50,50,50)"
				temp0.style.color="white"
			//	temp0.style.borderStyle="2px solid white"
				
			}
			else if( computed.backgroundImage!="none" && parseInt(computed.height)<0)
			{
				temp0.classList.add("darked_lock");
			
				temp0.style.filter="invert(0.3)"
				temp0.classList.add("darked_lock");
				return;
			}
		}
		*/