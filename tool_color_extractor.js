var  copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};
document.querySelectorAll("h3,style").forEach(x=>x.remove())
var validCsses = {};
var finalCss= "";
var lestyle = document.createElement("style");
lestyle.innerHTML="body{background:transparent}*{color:transparent;background:transparent}";
document.body.appendChild(lestyle);

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
fetch("result.css").then(res=>res.text()).then(o_text=>{

  var text=o_text;
	text=text.replace(/url\(/,'\aurl(')
	text=text.replace(/<!--.*?-->/,'')
	var res =[...text.matchAll("([^{};]*?)({(\n|[^{])*?})")];
	res = res.map((x,i)=>[x[0].trim(),x[1].split(",").map(x=>x.trim()),x[2].replace(/url\(/,'arl').trim()])
	res.forEach((x,i)=>{
		x[1].forEach((y,j)=>
		{
			var h3 = document.createElement("h3");
			h3.id=`coloritem-${i}-${j}`;
			document.body.appendChild(h3)
			h3.innerHTML=h3.id;

			var substyle = document.createElement("style");
			substyle.innerHTML=`#${h3.id},${y}${x[2]}`;
			document.body.appendChild(substyle)

			var cssrule = [
			has(h3,"color"),
			has(h3,"background-color"),
			has(h3,"border-color"),
			].filter(x=>x)
			var truecss = cssrule.join(";\n")
			if(truecss)
			{
					var prevnames =validCsses[truecss]||[]
					prevnames.push(y)

					validCsses[truecss]= prevnames;
			}

		});
	})
Object.keys(validCsses).map(csskey=>{
finalCss+=`
${validCsses[csskey].join(",")}{
${csskey};
}`

})
document.body.innerHTML=`<pre>${finalCss}</pre>`;
});
