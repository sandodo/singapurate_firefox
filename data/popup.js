// popup.js

var SingapuRateOptionsHandler = {

};

// Run our script as soon as the panel is ready.
self.port.on("show", function onShow() {
	/*
  //load the preference and display to html
  document.getElementById("c_username").value = SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAcctName];
  document.getElementById("c_birthday").value = SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday];

  //we will need to disable modification of username if already registered
  if( SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === true 
    || SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "true"  )
  {
    document.getElementById("c_username").setAttribute("disabled","disabled");
    
    var sWelcomeMessage = chrome.i18n.getMessage("SingapuRate_welcome_local_acct", [ SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAcctName], 
                                                                                     SingapuRateUtils.SR_Utilities.getUserAge(SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday]) ]);
    document.getElementById("label_username").textContent = sWelcomeMessage;
    
    if(SingapuRateSS.storage[ SingapuRateUtils.SR_Utilities.SingapuRatePrefKeySuperSafeMode ] == "yes" )    													
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

  var strKeyCurDomainUrlIdx 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCurDomainUrlIdx;
  var iUrlIdx = SingapuRateSS.storage[strKeyCurDomainUrlIdx];
  var strKeyCLVoteIdsWI = SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCLVoteIds + iUrlIdx;
  var iVoteId = parseInt(SingapuRateSS.storage[strKeyCLVoteIdsWI]);
  
  if(iUrlIdx >= 0 && iVoteId <= 0 )
  {
    document.getElementById("c_divider_line").setAttribute("style","background-image:url('skin/grey_line.jpg');");	
    
    document.getElementById("c_vote_buttons").setAttribute("style","vertical-align: top; width: 50px;");	
    
    document.getElementById("b_vote_opinion").setAttribute("style","vertical-align: top; width: 50px;");	
    document.getElementById("b_vote_opinion").setAttribute("type","image");	
    document.getElementById("b_vote_opinion").setAttribute("src","skin/vote_opinion.png");	

    document.getElementById("b_why_matters").setAttribute("style","vertical-align: top; width: 50px;");	
    document.getElementById("b_why_matters").setAttribute("type","image");	
    document.getElementById("b_why_matters").setAttribute("src","skin/why_matters.png");
        
  }
  else
  {
    document.getElementById("c_vote_buttons").setAttribute("style","vertical-align: top; width: 1px;");	
    document.getElementById("b_vote_opinion").setAttribute("style","vertical-align: top; width: 1px; height: 1px;");	
    document.getElementById("b_why_matters").setAttribute("style","vertical-align: top; width: 1px; height: 1px;");	
  }
	//*/
});

self.port.on("c_username", function(msg) {
	document.getElementById("c_username").value = msg;
});

self.port.on("c_birthday", function(msg) {
	document.getElementById("c_birthday").value = msg;
});
self.port.on("authenticate", function(msg) {
  	//we will need to disable modification of username if already registered
  	if( msg === true 
    	|| msg == "true"  )
  	{
    	document.getElementById("c_username").setAttribute("disabled","disabled");
    
    	//var sWelcomeMessage = chrome.i18n.getMessage("SingapuRate_welcome_local_acct", [ SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAcctName], 
        //                                                                             SingapuRateUtils.SR_Utilities.getUserAge(SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday]) ]);
        var sWelcomeMessage = "SingapuRate_welcome_local_acct";
    	document.getElementById("label_username").textContent = sWelcomeMessage;
    
    	//if(SingapuRateSS.storage[ SingapuRateUtils.SR_Utilities.SingapuRatePrefKeySuperSafeMode ] == "yes" )    													
    	//{
      	//	document.getElementById("c_supersafe").setAttribute("checked","checked");
      	//	document.getElementById("c_supersafe").value = "yes";
    	//}
    	//else
    	//{
	  	//	document.getElementById('c_username').removeAttribute("checked");	
      	//	document.getElementById("c_supersafe").value = "no";
    	//}
  	}
  	else
  	{
    	document.getElementById('c_username').removeAttribute("disabled");	  
    	document.getElementById('b_deregister').setAttribute("disabled","disabled");	  
    	document.getElementById("c_supersafe").setAttribute("checked","checked");
    	document.getElementById("c_supersafe").value = "yes";
  	}
});
self.port.on("curDomainUrlIdx", function(msg) {
	var sLocalMsg = msg;
	if(sLocalMsg == "")
		sLocalMsg = "-1";
	document.getElementById("curDomainUrlIdx").value = sLocalMsg;

});
self.port.on("voteId", function(msg) {
	var sLocalMsg = msg;
	if(sLocalMsg == "")
		sLocalMsg = "0";
	document.getElementById("voteId").value = sLocalMsg;
	var iUrlIdx = parseInt(document.getElementById("curDomainUrlIdx").value);
	var iVoteId = parseInt(document.getElementById("voteId").value);

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
    var username = document.getElementById("c_username").value.trim();
	var password = document.getElementById("c_password").value.trim();
	var birthday = document.getElementById("c_birthday").value.trim();
	var supersafe = document.getElementById("c_supersafe").value.trim();
	var bLogin = false;
	
	if( username.length < 4 || password.length < 4 )
	{
	  //it is a wrong username or password
	  //alert(chrome.i18n.getMessage("SingapuRate_wrong_username_or_password", [4]));
	  alert("SingapuRate_wrong_username_or_password");
	  return;
	}
	else
	{
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
			if( SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === true 
					|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "true"  )
			{
		        var passwordCombineStr = username.trim() + password.trim() + 'nh4da68h4jf6s4kj8g6d4df8b4d5';
				var passwordEncrypted = SingapuRateUtils.SR_Utilities.hex_sha256(passwordCombineStr);
				if( passwordEncrypted == SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAthentCode] )
				{
					//authenticate the user with password, proceed to update profile
				}
				else
				{
					//failed to authenticate
	  	  			//alert(chrome.i18n.getMessage("SingapuRate_update_fail"));
	  	  			alert("SingapuRate_update_fail");
					return;
				}
			}
			
			bLogin = true;
		}
	}
	
	if(birthday != SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday]
			|| supersafe != SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeySuperSafeMode]
			|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === false 
			|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "false" )
	{
		//store username
		//store birthday
		//store password
		//store super safe mode
		SingapuRateUtils.SR_Prefs.storePrefs(bLogin, username, birthday, password, supersafe);
		
		//alert(chrome.i18n.getMessage("SingapuRate_update_success", [ SingapuRateUtils.SR_Utilities.getUserAge(SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday]) ]));
		alert("SingapuRate_update_success");
	}
			
    if(bLogin === true)
		window.close();
		
    return;
  };
  
  document.getElementById("b_deregister").onclick = function() {
    var username = document.getElementById("c_username").value.trim();
	var password = document.getElementById("c_password").value.trim();
	var birthday = document.getElementById("c_birthday").value.trim();
	
	if( username.length < 4 || password.length < 4 )
	{
	  //it is a wrong username or password
	  //alert(chrome.i18n.getMessage("SingapuRate_wrong_username_or_password", [4]));
	  alert("SingapuRate_wrong_username_or_password");
	  
	  return;
	}
	else
	{
		if( SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === true 
				|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "true"  )
		{
	        var passwordCombineStr = username.trim() + password.trim() + 'nh4da68h4jf6s4kj8g6d4df8b4d5';
			var passwordEncrypted = SingapuRateUtils.SR_Utilities.hex_sha256(passwordCombineStr);
			if( passwordEncrypted == SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAthentCode] )
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
	
	if(SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === true 
			|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "true" )
	{
		//alert(chrome.i18n.getMessage("SingapuRate_logout_success", [ username ]));
		alert("SingapuRate_logout_success");
		//store username
		//store birthday
		//store encrypted password
		SingapuRatePrefs.storePrefs(false, username, birthday, "", "no");
	}
			
	window.close();
		
    return;	  
  };
  
  document.getElementById("b_close").onclick = function() {
    window.close();
  };

  document.getElementById("c_supersafe").onclick = function() {
	var supersafe = document.getElementById("c_supersafe").value.trim();  
    if( supersafe == "yes" )
    {
	  document.getElementById("c_supersafe").value = "no";
    }
    else
    {
      document.getElementById("c_supersafe").value = "yes"; 
    }
  };
  
  
  document.getElementById("b_vote_opinion").onclick = function() {
	
	var voteUrl = "http://" + SingapuRateUtils.SR_Utilities.SingapuRateDomainName;
  
	var strKeyCurDomainUrlIdx 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCurDomainUrlIdx;
	
	var iUrlIdx = SingapuRateSS.storage[strKeyCurDomainUrlIdx];

	if(iUrlIdx >= 0)
	{
		var strKeyCLCtgryIdsWI 		= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCLCtgryIds + iUrlIdx;
		var strKeyCLIdxToDomainsWI 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCLIdxToDomains + iUrlIdx;	
	
		var sOnlyDomainName 	= SingapuRateSS.storage[strKeyCLIdxToDomainsWI];
		var ctgryId 			= SingapuRateSS.storage[strKeyCLCtgryIdsWI];
	    voteUrl = "http://" + SingapuRateUtils.SR_Utilities.SingapuRateDomainName + "/posting.php?wrs_url=" + sOnlyDomainName + "&wrs_rc=" + ctgryId;
    	
	}
	//chrome.tabs.create( { url : voteUrl  }, function() {} ); 
   	window.close();
	
  };

  document.getElementById("b_why_matters").onclick = function() {

	var voteUrl = "http://" + SingapuRateUtils.SR_Utilities.SingapuRateDomainName + "/viewtopic.php?f=12&t=1280";
	//chrome.tabs.create( { url : voteUrl  }, function() {} ); 
    window.close();
  };
      
}



