Components.utils.import("chrome://singapurate/content/utils.js");

/**
 * SingapuRate namespace.
 */
if ("undefined" == typeof(XULSingapuRateChrome)) {
  var XULSingapuRateChrome = {};
}; 

// load the stored preferences
SingapuRatePrefs.readPrefs();

var XULSingapuRateChrome = 
{
    checkLocation: function(aWin, location)
    {
        if(SingapuRateWebsiteRatings.isBlackList(aWin, location))
        {
            return true;
        }
        
        return false;
		
    },
	
    SingapuRateMain: function(event)
    {
        const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");
			
        if(event.type === "DOMContentLoaded" || event.type == "change")
        {	
		    try
		    {
	            //get the url from urlbar
	            var sUrlAddress = document.getElementById("urlbar").value;
	            if(sUrlAddress == "")
	            	return;

				if(sUrlAddress.indexOf("chrome://") == 0
						|| sUrlAddress.indexOf("about:") == 0 )
				{
					//this is a local url internal to firefox.
					if(sUrlAddress.indexOf(SingapuRateUtilities.SingapuRateLocalBlockedHtml) == 0)
					{
						var doc = event.target;
						var win = doc.defaultView;
						//now update the variables in the blocked html
						var resArray = sUrlAddress.split("?");
						if(resArray.length != 2)
						{
							//something wrong, use default block
							win.location.replace(SingapuRateUtilities.SingapuRateLocalBlockedDefaultHtml);
							return;
						}
						var paramItems = resArray[1].split("&");
						var minAge = 21;
						var category = "R21";
						var voteId = -1;
						var ctgryId = -1;
						var urlPath = "#";
						for(var i = 0; i < paramItems.length; i++)
						{
							var paramKeyValue = paramItems[i].split("=");
							if(paramKeyValue.length != 2)
							{
								continue;
							}
							if(paramKeyValue[0] == SingapuRateUtilities.SingapuRateParamNameUrl)
							{
								urlPath = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateUtilities.SingapuRateParamNameCategoryName)
							{
								category = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateUtilities.SingapuRateParamNameCategoryId)
							{
								ctgryId = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateUtilities.SingapuRateParamNameVoteId)
							{
								voteId = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateUtilities.SingapuRateParamNameMinAge)
							{
								minAge = paramKeyValue[1];
							}
						}
						doc.getElementById("srWebsiteDomain").textContent = urlPath;
						doc.getElementById("srWebsiteRating").textContent = category;
		
					    var stringBundle1 = document.getElementById("singapurate-string-bundle");
					    var sVoteOrViewSite = "";
					    var sVoteOpinionUrl = "";
					    var sWebsiteRatingDescr = "";
					    
					    if(category == "G")
					    {
						    sWebsiteRatingDescr = stringBundle1.getString("SingapuRate.RatingGMsg");
					    }
					    else if(category == "PG")
					    {
						    sWebsiteRatingDescr = stringBundle1.getString("SingapuRate.RatingPGMsg");
					    }
					    else if(category == "PG13")
					    {
						    sWebsiteRatingDescr = stringBundle1.getString("SingapuRate.RatingPG13Msg");
					    }
					    else if(category == "NC16")
					    {
						    sWebsiteRatingDescr = stringBundle1.getString("SingapuRate.RatingNC16Msg");
					    }
					    else if(category == "M18")
					    {
						    sWebsiteRatingDescr = stringBundle1.getString("SingapuRate.RatingM18Msg");
					    }
					    else if(category == "R21")
					    {
						    sWebsiteRatingDescr = stringBundle1.getString("SingapuRate.RatingR21Msg");
					    }
					    else if(category == "BL")
					    {
						    sWebsiteRatingDescr = stringBundle1.getString("SingapuRate.RatingBLMsg");
					    }
		
					    //check by vote id				    
						if(voteId > 0)
						{
							sVoteOpinionUrl = "http://" + SingapuRateUtilities.SingapuRateDomainName + "/viewdetails.php?p=" + voteId + "#p" + voteId;
			    			sVoteOrViewSite = stringBundle1.getString("SingapuRate.checkYourVoteText");
						}
						else
						{
							sVoteOpinionUrl = "http://" + SingapuRateUtilities.SingapuRateDomainName + "/posting.php?" + SingapuRateUtilities.SingapuRateParamNameUrl + "=" + urlPath;
							if(ctgryId > 0)
								sVoteOpinionUrl = sVoteOpinionUrl + "&" + SingapuRateUtilities.SingapuRateParamNameCategoryId + "=" + ctgryId;
				    		sVoteOrViewSite = stringBundle1.getString("SingapuRate.voteYourOpinionText");
						}
						doc.getElementById("srVoteOpinionLink").setAttribute("href", sVoteOpinionUrl);
						doc.getElementById("srVoteOrViewSite").textContent = sVoteOrViewSite;
						doc.getElementById("srWebsiteRatingDescr").textContent = sWebsiteRatingDescr;
							
					}
					//this is a local url internal to firefox.
					else if(sUrlAddress.indexOf(SingapuRateUtilities.SingapuRateLocalSuspendedHtml) == 0)
					{
						var doc = event.target;
						var win = doc.defaultView;
						//now update the variables in the blocked html
						var resArray = sUrlAddress.split( SingapuRateUtilities.SingapuRateParamNameUrl + "=");
						if(resArray.length != 2)
						{
							//something wrong, use default block
							win.location.replace(SingapuRateUtilities.SingapuRateLocalBlockedDefaultHtml);
							return;
						}
						var urlPath = resArray[1];
						
						if( urlPath.indexOf("http:") == -1
							&& urlPath.indexOf("https:") == -1
							&& urlPath.indexOf("ftp:") == -1
							&& urlPath.indexOf("ftps:") == -1)
						{
							urlPath = "http://" + urlPath;
						}
							
						doc.getElementById("srWebsiteDomain").textContent = urlPath;
						doc.getElementById("srVoteOpinionLink").setAttribute("href", urlPath);
						
					}
					
					return;
				}
					
				if( SingapuRateUtilities.isSingapurateDomain(sUrlAddress) === true )
				{
					//certified singapurate urls always
					return;
				}
					            
		    	var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(sUrlAddress, SingapuRateUtilities.SingapuRateDomainCheckDepth);
	            if(sOnlyDomainName == "")
	            	return;
	            	
				var minAge = 21;
				var category = "R21";
				var voteId = -1;
				var ctgryId = -1;
				var retResults = SingapuRateWebsiteRatings.isBlockedInCache(sOnlyDomainName);
				if(retResults[SingapuRateUtilities.SingapuRateParamNameSiteBlocked] === false)
				{
					//allow the site
					if( retResults[SingapuRateUtilities.SingapuRateParamNameCategoryId] > 0 )
					{
						//found the cache
						category 		= retResults[SingapuRateUtilities.SingapuRateParamNameCategoryName];
						ctgryId 		= retResults[SingapuRateUtilities.SingapuRateParamNameCategoryId];
						voteId			= retResults[SingapuRateUtilities.SingapuRateParamNameVoteId];
						minAge			= retResults[SingapuRateUtilities.SingapuRateParamNameMinAge];
							
						var sLabelText = document.getElementById("singapurate-string-bundle").getFormattedString("SingapuRate.notificationText", [sOnlyDomainName, category]);
							
			            //display the rating inforamtion and promote the user to rate it.
						var nb = gBrowser.getNotificationBox();
						var sNotificationBoxName = SingapuRateUtilities.SingapuRateExtensionName + '_SR_Website_Rating';
						var n = nb.getNotificationWithValue(sNotificationBoxName);
						if(n) 
						{
						    n.label = sLabelText;
						}
						else 
						{
							var voteYourOpinionText = document.getElementById("singapurate-string-bundle").getString("SingapuRate.voteYourOpinionText");
							var whyYourOpinionMattersText = document.getElementById("singapurate-string-bundle").getString("SingapuRate.whyYourVoteMattersText");
							
							var buttons = [];
							if(voteId <= 0)
							{
							    buttons = [
							    {
							        label: voteYourOpinionText,
							        accessKey: 'v',
							        callback: function(aEvent) 
							        { 
										//redirect to singapurate.com for registration
								      	gBrowser.selectedTab = gBrowser.addTab("http://" + SingapuRateUtilities.SingapuRateDomainName + "/posting.php?wrs_url=" + sOnlyDomainName + "&wrs_rc=" + ctgryId);
								    }
							    },
							    
								{
							        label: whyYourOpinionMattersText,
							        accessKey: 'w',
							        callback: function(aEvent) 
							        { 
										//redirect to singapurate.com for registration
								      	gBrowser.selectedTab = gBrowser.addTab("http://" + SingapuRateUtilities.SingapuRateDomainName + "/viewtopic.php?f=12&t=1280");
								    }
							    },
								
							    //it is only for internal check of cached list
								{
							        label: 'Caches',
							        accessKey: 'C',
							        callback: function(aEvent) 
							        { 
								        //open preference dialog box
								        SingapuRatePrefs.loadDomainCaches();
								    }
							    }
							    ];
							}
						    const priority = nb.PRIORITY_WARNING_HIGH;
						    nb.appendNotification(sLabelText, sNotificationBoxName,
						                         'chrome://singapurate/skin/icon_exclaim.gif',
						                          priority, buttons);
						}
							
						return;						
					}
					else
					{
						//allowed but not in cache actually, send web service. wait for call back.
						var doc = event.target;
						var win = doc.defaultView;
						XULSingapuRateChrome.checkLocation(win, sOnlyDomainName);
						return;
					}
										
				}
				else
				{
					//block the site
					if( retResults[SingapuRateUtilities.SingapuRateParamNameCategoryId] > 0 )
					{
						//found the cache
						category 		= retResults[SingapuRateUtilities.SingapuRateParamNameCategoryName];
						ctgryId 		= retResults[SingapuRateUtilities.SingapuRateParamNameCategoryId];
						voteId			= retResults[SingapuRateUtilities.SingapuRateParamNameVoteId];
						minAge			= retResults[SingapuRateUtilities.SingapuRateParamNameMinAge];
						
						//display another page?
						var doc = event.target;
						var win = doc.defaultView;
						var blockURL = SingapuRateUtilities.SingapuRateLocalBlockedHtml + "?" + SingapuRateUtilities.SingapuRateParamNameUrl + "=" + sOnlyDomainName 
											+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryName + "=" + category 
											+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryId + "=" + ctgryId
											+ "&" + SingapuRateUtilities.SingapuRateParamNameVoteId + "=" + voteId
											+ "&" + SingapuRateUtilities.SingapuRateParamNameMinAge + "=" + minAge;
						win.location.replace(blockURL);
						
						return;
					}
					else
					{
						//blocked but without any information, happens if user is not logged in
						var doc = event.target;
						var win = doc.defaultView;
						win.location.replace(SingapuRateUtilities.SingapuRateLocalBlockedDefaultHtml);
					}
				}
			
	        }
	        catch(e)
	        {
		        //caught an exception
	        }
        }
		return;
    },
    
};

var SingapuRateBrowserOverlay = 
{
	/**
	*/
	
	loadSingapuRateLoginDialog : function(aEvent) 
	{
		var retResults = SingapuRatePrefs.readPrefs();
		var usernameStr = "";
		var birthdayStr = "";
		if(retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true)
		{
			usernameStr = retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName];
			birthdayStr = retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday];
			
			var acctAge = SingapuRateUtilities.getUserAge(retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday]);
			
			SingapuRateUtilities.alertFormatedWndMsg("SingapuRate.loginSuccess", [retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName], acctAge]);
			
		}
		else
		{
			var today = new Date();
			birthdayStr = "" + today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
		}
		
		
   		var retVals = {username : usernameStr, password : null, birthday : birthdayStr };
		window.openDialog(  'chrome://singapurate/content/login.xul',
							'showmore',
							'chrome,centerscreen,modal',
							retVals);	
	},
	
	onLoadLogin : function(aEvent)
	{
		document.getElementById("c_username").value = window.arguments[0].username;
		document.getElementById("c_birthday").value = window.arguments[0].birthday;
	},

	loadSingapuRateLogoutDialog : function(aEvent) 
	{
		var retResults = SingapuRatePrefs.readPrefs();
		if(retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === false)
		{
			SingapuRateUtilities.alertSimpleWndMsg("SingapuRate.alreadyLogout");
			return;
		}
		
		//pass the username to dialog box		
   		var retVals = {username : retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName], password : null};
		window.openDialog(  'chrome://singapurate/content/logout.xul',
							'showmore',
							'chrome,centerscreen,modal',
							retVals);
	},
	
	onLoadLogout : function(aEvent)
	{
		document.getElementById("c_username").value = window.arguments[0].username;
	},

	onOK	: function(aEvent)
	{
		
		var username = document.getElementById("c_username").value.trim();
		var password = document.getElementById("c_password").value.trim();
		var birthday = document.getElementById("c_birthday").value.trim();

		if( username.length < 4 || password.length < 4 )
		{
			//it is a wrong birthday format
			alert("User name and password must have at least 4 characters.");
			return false;
		}
		
		var resArray = birthday.split("-");
		if(resArray.length != 3)
		{
			//it is a wrong birthday format
			alert("Please ensure your birthday is in DD-MM-YYYY format.");
			return false;
		}
		
		var acctAge = SingapuRateUtilities.getUserAge(birthday);

		var passwordEncrypted = SingapuRateUtilities.hex_sha256(username + password + 'nh4da68h4jf6s4kj8g6d4df8b4d5');
		var retResults = SingapuRatePrefs.readPrefs();
		if(retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true)
		{
			//it is to update birthday
			if( retResults[SingapuRateUtilities.SingapuRatePrefKeyAthentCode] == passwordEncrypted )
			{
				//it is verified and proceed
				//we will need to save something to ensure that he does not need to relogin for browsing and our future reference.
				SingapuRatePrefs.storePrefs(true, username, birthday, passwordEncrypted);
				alert("profile updated successfully. You are now " + acctAge + " years old.");
			}
			else
			{
				//failed to authenticate, stop processing
				alert("You failed to authenticate your account, failed to update your profile.");
				return false;
			}
		}
		else
		{
			//it is not registered, creat the new acct
			//login succeed
			SingapuRateUtilities.alertFormatedWndMsg("SingapuRate.loginFirstTime", [username, acctAge]);
			
			//we will need to save something to ensure that he does not need to relogin for browsing and our future reference.
			SingapuRatePrefs.storePrefs(true, username, birthday, passwordEncrypted);
		}

		return true;
	},	

	onLogout : function(aEvent)
	{
		var username = document.getElementById("c_username").value;
		var password = document.getElementById("c_password").value;
		
		var passwordEncrypted = SingapuRateUtilities.hex_sha256(username + password + 'nh4da68h4jf6s4kj8g6d4df8b4d5');
		var retResults = SingapuRatePrefs.readPrefs();
		if(retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true)
		{
			if( retResults[SingapuRateUtilities.SingapuRatePrefKeyAthentCode] == passwordEncrypted )
			{
				//login succeed, proceed to deregister
				SingapuRateUtilities.alertFormatedWndMsg("SingapuRate.logoutSuccess", [username]);
				
				//we will need to save something to ensure that user will be required to login again
				SingapuRatePrefs.storePrefs(false, username, "", passwordEncrypted);
			}
			else
			{
				//donot deregister
				SingapuRateUtilities.alertFormatedWndMsg("SingapuRate.logoutFailure", [username, "Wrong Password"]);
				return false;
			}
		}
		else
		{
			//already deregistered
		}
		
		return true;
	},	
	
	onCancel : function(aEvent)
	{
		return true;
	},
			
};


// Observer for HTTP requests to block the sites we don't want
var SingapuRateObserver = 
{
    observe: function(aSubject, aTopic, aData)
    {
        try
        {
            if (aTopic == 'http-on-modify-request'
            		|| aTopic == 'content-document-global-created' 
            		|| aTopic ==  'http-on-examine-response')
			{
	            aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
				
	            var sUrlAddress = document.getElementById("urlbar").value;
		    	var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(sUrlAddress, SingapuRateUtilities.SingapuRateDomainCheckDepth);
		    	var sSubjectUriSpec = SingapuRateUtilities.getOnlyDomainName(aSubject.URI.spec, SingapuRateUtilities.SingapuRateDomainCheckDepth); 
		    	
		    	if(sOnlyDomainName == "")
		    	{
			    	document.getElementById("urlbar").value = aSubject.URI.spec;
		    	}
		    	else if( sOnlyDomainName !=  sSubjectUriSpec)
		    	{
			    	//if not same as urlbar address, then let it continue
			    	return;
		    	}
	            
				SingapuRatePrefs.readPrefs();
				
				//we donot block site here, just start the check with web service if necessary
				//XULSingapuRateChrome.checkLocation(window, aSubject.URI.spec);
			}
		            
            return; 
                   
        }catch(e){}
    },
            
    QueryInterface: function(iid)
    {
        if (!iid.equals(Components.interfaces.nsISupports) &&
            !iid.equals(Components.interfaces.nsIObserver) &&
            !iid.equals(Components.interfaces.nsIURIContentListener) )
            throw Components.results.NS_ERROR_NO_INTERFACE;

        return this;
    }
};

// Setting up the content listener

// Add our observer
var SingapuRateObserverService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
SingapuRateObserverService.addObserver(SingapuRateObserver, "http-on-modify-request", false);
SingapuRateObserverService.addObserver(SingapuRateObserver, "http-on-examine-response", false);
SingapuRateObserverService.addObserver(SingapuRateObserver, "content-document-global-created", false);

// Event listener
window.addEventListener("DOMContentLoaded", XULSingapuRateChrome.SingapuRateMain, false);

