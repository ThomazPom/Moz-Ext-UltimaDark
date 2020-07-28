String.prototype.insert = function(index, string) {
  if (index > 0)
  {
    return this.substring(0, index) + string + this.substring(index, this.length);
  }

  return string + this;
};
function has(elem,value)
{
return ["rgba(0, 0, 0, 0)",""].includes(getComputedStyle(elem)[value])?false:value+":"+getComputedStyle(elem)[value]
}
fetch("result.css").then(res=>res.text()).then(text=>{
var res =[...text.matchAll(/{/g)];
for(i=res.length-1;i>=0;i--)
{
var	item=res[i]
	text=text.insert(item.index,",#coloritem-"+i)
	var h3 = document.createElement("h3");
	h3.id="coloritem-"+i;
	document.body.appendChild(h3)
	h3.innerHTML="#coloritem-"+i
}
var lestyle = document.createElement("style");
lestyle.innerHTML="body{background:transparent}*{color:transparent;background:transparent}";
document.body.appendChild(lestyle);

var lestyle = document.createElement("style");
lestyle.innerHTML=text;
document.body.appendChild(lestyle);
var finaltext=""
var names=text.split(/[{}/;]+/).filter(x=>x.includes("#coloritem")).map(x=>x.trim())
document.querySelectorAll("h3").forEach((elem)=>{
//console.log(names)
var lename=names.filter(x=>x.includes(elem.id))
var cssrule = [
has(elem,"color"),
has(elem,"background-color"),
has(elem,"border-color"),
].filter(x=>x)
var truecss = cssrule.join(";\n")
if(truecss)
{
		console.log(lename,elem.id,truecss)
		finaltext+=`
${lename}{
${truecss}
}`

}



})
console.log(finaltext)
})