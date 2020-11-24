function hiddenemail(d,u,t)
{
   var email = u + "@" + d;
   if (t)
      document.write("<a href=mailto:"+email+">"+t+"</a>");
   else
      document.write("<a href=mailto:"+email+">"+email+"</a>");
}
