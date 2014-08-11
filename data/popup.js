// popup.js

var SingapuRateOptionsHandler = {

};

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  //load the preference and display to html
  document.getElementById("c_username").value = localStorage[SingapuRateUtilities.SingapuRatePrefKeyAcctName];
  document.getElementById("c_birthday").value = localStorage[SingapuRateUtilities.SingapuRatePrefKeyBirthday];

  //we will need to disable modification of username if already registered
  if( localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true 
    || localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] == "true"  )
  {
    document.getElementById("c_username").setAttribute("disabled","disabled");
    
    var sWelcomeMessage = chrome.i18n.getMessage("SingapuRate_welcome_local_acct", [ localStorage[SingapuRateUtilities.SingapuRatePrefKeyAcctName], 
                                                                                     SingapuRateUtilities.getUserAge(localStorage[SingapuRateUtilities.SingapuRatePrefKeyBirthday]) ]);
    document.getElementById("label_username").textContent = sWelcomeMessage;
    
    if(localStorage[ SingapuRateUtilities.SingapuRatePrefKeySuperSafeMode ] == "yes" )    													
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

  var strKeyCurDomainUrlIdx 	= SingapuRateUtilities.SingapuRatePrefKeyCurDomainUrlIdx;
  var iUrlIdx = localStorage[strKeyCurDomainUrlIdx];
  var strKeyCLVoteIdsWI = SingapuRateUtilities.SingapuRatePrefKeyCLVoteIds + iUrlIdx;
  var iVoteId = parseInt(localStorage[strKeyCLVoteIdsWI]);
  
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
	  alert(chrome.i18n.getMessage("SingapuRate_wrong_username_or_password", [4]));
	  return;
	}
	else
	{
		var resArray = birthday.split("-");
		if(resArray.length != 3)
		{
		  //it is a wrong birthday format
	  	  alert(chrome.i18n.getMessage("SingapuRate_wrong_birthday"));
		  return;
		}
		else
		{
			if( localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true 
					|| localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] == "true"  )
			{
		        var passwordCombineStr = username.trim() + password.trim() + 'nh4da68h4jf6s4kj8g6d4df8b4d5';
				var passwordEncrypted = SingapuRateUtilities.hex_sha256(passwordCombineStr);
				if( passwordEncrypted == localStorage[SingapuRateUtilities.SingapuRatePrefKeyAthentCode] )
				{
					//authenticate the user with password, proceed to update profile
				}
				else
				{
					//failed to authenticate
	  	  			alert(chrome.i18n.getMessage("SingapuRate_update_fail"));
					return;
				}
			}
			
			bLogin = true;
		}
	}
	
	if(birthday != localStorage[SingapuRateUtilities.SingapuRatePrefKeyBirthday]
			|| supersafe != localStorage[SingapuRateUtilities.SingapuRatePrefKeySuperSafeMode]
			|| localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === false 
			|| localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] == "false" )
	{
		//store username
		//store birthday
		//store password
		//store super safe mode
		SingapuRatePrefs.storePrefs(bLogin, username, birthday, password, supersafe);
		
		alert(chrome.i18n.getMessage("SingapuRate_update_success", [ SingapuRateUtilities.getUserAge(localStorage[SingapuRateUtilities.SingapuRatePrefKeyBirthday]) ]));
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
	  alert(chrome.i18n.getMessage("SingapuRate_wrong_username_or_password", [4]));
	  
	  return;
	}
	else
	{
		if( localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true 
				|| localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] == "true"  )
		{
	        var passwordCombineStr = username.trim() + password.trim() + 'nh4da68h4jf6s4kj8g6d4df8b4d5';
			var passwordEncrypted = SingapuRateUtilities.hex_sha256(passwordCombineStr);
			if( passwordEncrypted == localStorage[SingapuRateUtilities.SingapuRatePrefKeyAthentCode] )
			{
				//authenticate the user with password, proceed to deregister the profile
			}
			else
			{
				//failed to authenticate
	  			alert(chrome.i18n.getMessage("SingapuRate_logout_fail", [username]));
				
				return;
			}
		}
		else
		{
  			alert(chrome.i18n.getMessage("SingapuRate_already_logout"));
			return;
		}
	}
	
	if(localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true 
			|| localStorage[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] == "true" )
	{
		alert(chrome.i18n.getMessage("SingapuRate_logout_success", [ username ]));
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
	
	var voteUrl = "http://" + SingapuRateUtilities.SingapuRateDomainName;
  
	var strKeyCurDomainUrlIdx 	= SingapuRateUtilities.SingapuRatePrefKeyCurDomainUrlIdx;
	
	var iUrlIdx = localStorage[strKeyCurDomainUrlIdx];

	if(iUrlIdx >= 0)
	{
		var strKeyCLCtgryIdsWI 		= SingapuRateUtilities.SingapuRatePrefKeyCLCtgryIds + iUrlIdx;
		var strKeyCLIdxToDomainsWI 	= SingapuRateUtilities.SingapuRatePrefKeyCLIdxToDomains + iUrlIdx;	
	
		var sOnlyDomainName 	= localStorage[strKeyCLIdxToDomainsWI];
		var ctgryId 			= localStorage[strKeyCLCtgryIdsWI];
	    voteUrl = "http://" + SingapuRateUtilities.SingapuRateDomainName + "/posting.php?wrs_url=" + sOnlyDomainName + "&wrs_rc=" + ctgryId;
    	
	}
	chrome.tabs.create( { url : voteUrl  }, function() {} ); 
   	window.close();
	
  };

  document.getElementById("b_why_matters").onclick = function() {

	var voteUrl = "http://" + SingapuRateUtilities.SingapuRateDomainName + "/viewtopic.php?f=12&t=1280";
	chrome.tabs.create( { url : voteUrl  }, function() {} ); 
    window.close();
  };
      
}



