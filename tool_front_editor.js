var ud_styles_array=[]
document.querySelectorAll("style").forEach((styletag,index)=>{
  var text=styletag.innerHTML;
	text=text.replace(/url\(/,'\aurl(')
	text=text.replace(/<!--.*?-->/,'')
	var res =[...text.matchAll("[^{};]*?{(\n|[^{])*?}")];
//	res= res.filter(x=>x[0].match(/([^a-z0-9-])(color|background-color?)[\s\t\n\r]*?:/))
	res = res.map((x,i)=>"#ud_coloritem-"+index+"-"+i+","+x[0])
	ud_styles_array= ud_styles_array.concat(res)
})
var str = ud_styles_array.join("");
 str = ud.edit_dynamic_colors(str)
          str=ud.prefix_fg_vars(str);
          str=ud.restore_var_color(str);
          str = ud.restore_color(str)
          str = ud.restore_comments(str)
         
var newstyletag = document.createElement("style")
newstyletag.innerHTML=str;
document.body.appendChild(newstyletag)