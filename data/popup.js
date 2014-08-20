// popup.js

// Run our script as soon as the panel is ready.
self.port.on("show", function onShow() {
	return;
});

// Run our script as soon as the panel is ready.
self.port.on("initMsg", function(msg) {

	var sRcvMsg = msg;
	var resArray = sRcvMsg.split("|||");
	var sUserName = "";
	var sUserBirthday = "";
	var sAuthenticate = "";
	var sCurDomainUrlIdx = "";
	var sSuperSafeMode = "";
	var sVoteId = "";
	var sAuthenticateCode = "";
	
	for(var i=0; i < resArray.length; i++) 
	{
		var strTemp = resArray[i];
		var sTempKeyValuePair = strTemp.split("===");
		if(sTempKeyValuePair.length != 2)
		{
			continue;
		}
		if(sTempKeyValuePair[0] == "c_username")
		{
			sUserName = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "c_birthday")
		{
			sUserBirthday = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "c_supersafe")
		{
			sSuperSafeMode = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "authenticate")
		{
			sAuthenticate = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "curDomainUrlIdx")
		{
			sCurDomainUrlIdx = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "voteId")
		{
			sVoteId = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "authencode")
		{
			sAuthenticateCode = sTempKeyValuePair[1];
		}
	}
	//*/
	if(sCurDomainUrlIdx == "")
		sCurDomainUrlIdx = "-1";
	if(sVoteId == "")
		sVoteId = "0";		
			
	document.getElementById("c_username").value = sUserName;
	document.getElementById("c_birthday").value = sUserBirthday;
	document.getElementById("authencode").value = sAuthenticateCode;
	document.getElementById("authenticate").value = sAuthenticate;
	
  	if( sAuthenticate == "true"  )
  	{
    	document.getElementById("c_username").setAttribute("disabled","disabled");
    
    	//var sWelcomeMessage = chrome.i18n.getMessage("SingapuRate_welcome_local_acct", [ SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAcctName], 
        //                                                                             SingapuRateUtils.SR_Utilities.getUserAge(SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday]) ]);
        var sWelcomeMessage = "SingapuRate_welcome_local_acct";
    	document.getElementById("label_username").textContent = sWelcomeMessage;
    
    	if(sSuperSafeMode == "yes" )    													
    	{
      		document.getElementById("c_supersafe").setAttribute("checked","checked");
      		document.getElementById("c_supersafe").value = "yes";
    	}
    	else
    	{
	  		document.getElementById('c_username').removeAttribute("checked");	
      		document.getElementById("c_supersafe").value = "no";
    	}
  	}
  	else
  	{
    	document.getElementById('c_username').removeAttribute("disabled");	  
    	document.getElementById('b_deregister').setAttribute("disabled","disabled");	  
    	document.getElementById("c_supersafe").setAttribute("checked","checked");
    	document.getElementById("c_supersafe").value = "yes";
  	}
 		
	var iUrlIdx = parseInt(sCurDomainUrlIdx);
	var iVoteId = parseInt(sVoteId);
	if(iUrlIdx >= 0 && iVoteId <= 0 )
  	{
    	document.getElementById("c_divider_line").setAttribute("style","background-image:url('./data/grey_line.jpg');");	
    
    	document.getElementById("c_vote_buttons").setAttribute("style","vertical-align: top; width: 50px;");	
    
    	document.getElementById("b_vote_opinion").setAttribute("style","vertical-align: top; width: 50px;");	
    	document.getElementById("b_vote_opinion").setAttribute("type","image");	
    	document.getElementById("b_vote_opinion").setAttribute("src","./data/vote_opinion.png");	

    	document.getElementById("b_why_matters").setAttribute("style","vertical-align: top; width: 50px;");	
    	document.getElementById("b_why_matters").setAttribute("type","image");	
    	document.getElementById("b_why_matters").setAttribute("src","./data/why_matters.png");
        
  	}
  	else
  	{
    	document.getElementById("c_vote_buttons").setAttribute("style","vertical-align: top; width: 1px;");	
    	document.getElementById("b_vote_opinion").setAttribute("style","vertical-align: top; width: 1px; height: 1px;");	
    	document.getElementById("b_vote_opinion").setAttribute("type","hidden");
    	document.getElementById("b_why_matters").setAttribute("style","vertical-align: top; width: 1px; height: 1px;");	
    	document.getElementById("b_why_matters").setAttribute("type","hidden");
  	}	
  	
});


window.onload = function() {
  	document.getElementById("b_save").onclick = function() {
	  	console.log("b_save" + ": " + "clicked");
    	var username = document.getElementById("c_username").value.trim();
		var password = document.getElementById("c_password").value.trim();
		var birthday = document.getElementById("c_birthday").value.trim();
		var supersafe = document.getElementById("c_supersafe").value.trim();
		var sAuthenticateCode = document.getElementById("authencode").value.trim();
		var sAuthenticate = document.getElementById("authenticate").value.trim();
	
		//console.log("b_save" + ": " + "check " + username + " & " + password);
		if( username.length < 4 || password.length < 4 )
		{
	  		//it is a wrong username or password
	  		//alert(chrome.i18n.getMessage("SingapuRate_wrong_username_or_password", [4]));
	  		alert("SingapuRate_wrong_username_or_password");
	  		return;
		}
		else
		{
			//console.log("b_save" + ": " + "check " + birthday);
			var resArray = birthday.split("-");
			if(resArray.length != 3)
			{
		  		//it is a wrong birthday format
	  	  		//alert(chrome.i18n.getMessage("SingapuRate_wrong_birthday"));
	  	  		alert("SingapuRate_wrong_birthday");
		  		return;
			}
			else
			{
				if( sAuthenticate == "true"  )
				{
					//console.log("b_save" + ": " + "check " + sAuthenticate);
		        	var passwordCombineStr = username.trim() + password.trim() + 'nh4da68h4jf6s4kj8g6d4df8b4d5';
					var passwordEncrypted = CryptoJS.MD5(passwordCombineStr);
					if( passwordEncrypted == sAuthenticateCode )
					{
						//authenticate the user with password, proceed to update profile
					}
					else
					{
						//failed to authenticate
	  	  				alert("SingapuRate_update_fail");
						return;
					}
				}
			}
		}
		
		alert("SingapuRate_update_success");
			
		//compose the string for profile save
		var sPostMsg = "";
		sPostMsg += "c_username" + "===" + username + "|||";
		sPostMsg += "c_password" + "===" + password + "|||";
		sPostMsg += "c_birthday" + "===" + birthday + "|||";
		sPostMsg += "c_supersafe" + "===" + supersafe + "|||";
			
		self.port.emit("save", sPostMsg);
		//*/		
    	return;
  	};

  	document.getElementById("b_deregister").onclick = function() {
	  	console.log("b_deregister" + ": " + "clicked");
    	var username = document.getElementById("c_username").value.trim();
		var password = document.getElementById("c_password").value.trim();
		var birthday = document.getElementById("c_birthday").value.trim();
		var sAuthenticateCode = document.getElementById("authencode").value.trim();
		var sAuthenticate = document.getElementById("authenticate").value.trim();
			
		if( username.length < 4 || password.length < 4 )
		{
	  		//it is a wrong username or password
	  		//alert(chrome.i18n.getMessage("SingapuRate_wrong_username_or_password", [4]));
	  		alert("SingapuRate_wrong_username_or_password");
	  
	  		return;
		}
		else
		{
			if( sAuthenticate == "true"  )
			{
	        	var passwordCombineStr = username.trim() + password.trim() + 'nh4da68h4jf6s4kj8g6d4df8b4d5';
				var passwordEncrypted = CryptoJS.MD5(passwordCombineStr);
				if( passwordEncrypted == sAuthenticateCode )
				{
					//authenticate the user with password, proceed to deregister the profile
				}
				else
				{
					//failed to authenticate
	  				//alert(chrome.i18n.getMessage("SingapuRate_logout_fail", [username]));
	  				alert("SingapuRate_logout_fail");
				
					return;
				}
			}
			else
			{
  				//alert(chrome.i18n.getMessage("SingapuRate_already_logout"));
  				alert("SingapuRate_already_logout");
				return;
			}
		}
	
		alert("SingapuRate_logout_success");
		
		//compose the string for profile save
		var sPostMsg = "";
		sPostMsg += "c_username" + "===" + username + "|||";
		sPostMsg += "c_birthday" + "===" + birthday + "|||";
			
		self.port.emit("deregister", sPostMsg);
									
    	return;	  
  };  	      
};

