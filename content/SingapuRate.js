Components.utils.import("resource://singapurate/utils.js");

/**
 * SingapuRate namespace.
 */
if ("undefined" == typeof(XULSingapuRateChrome)) {
  var XULSingapuRateChrome = {};
}; 

if ("undefined" == typeof(SingapuRateBrowserOverlay)) {
  var SingapuRateBrowserOverlay = {};
}; 

if ("undefined" == typeof(SingapuRateWebService)) {
  var SingapuRateWebService = {};
}; 
if ("undefined" == typeof(SingapuRatePrefs)) {
  var SingapuRatePrefs = {};
}; 
if ("undefined" == typeof(SingapuRateUtilities)) {
  var SingapuRateUtilities = {};
}; 
if ("undefined" == typeof(SingapuRateStoredInformation)) {
  var SingapuRateStoredInformation = {};
}; 

if ("undefined" == typeof(SingapuRateCacheList)) {
  var SingapuRateCacheList = {};
}; 

if ("undefined" == typeof(SingapuRateWebsiteRatings)) {
  var SingapuRateWebsiteRatings = {};
}; 

// load the stored preferences
SingapuRatePrefs.readPrefs();

var XULSingapuRateChrome = 
{
    alertsService: Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService),
    
    showBlockWarningBar: function()
    {
        
        var messageBarText = document.getElementById("singapurate-string-bundle").getString("SingapuRate.messageBarText");
        
        this.simpleDesktopNotify(messageBarText);
    },
    
    simpleDesktopNotify: function(text)
    {
	    var stringBundle = document.getElementById("singapurate-string-bundle");
	    var noteTitle = stringBundle.getString("SingapuRate.messageTitle");
        this.alertsService.showAlertNotification('chrome://singapurate/skin/stop.png', noteTitle, text, false);
        
    },
  
	
    checkLocation: function(location)
    {
        if(SingapuRateWebsiteRatings.isBlackList(location))
        {
            return true;
        }
        
        return false;
		
    },
	
    checkAnchor: function(anchor)
    {
        return false;
        
    },
	
    processAnchors: function(event)
    {
	    //do nothing, no check due to performance
    },
    
    SingapuRateMain: function(event)
    {
        const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");
			
        if(event.type === "DOMContentLoaded" || event.type == "change")
        {	
		    try
		    {
	            // Anchors check 
	            XULSingapuRateChrome.processAnchors(event);
		
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
					    //*/
		
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
		            	
				var usrCurrentAge = SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]);
				//loop through the cache array
				var iUrlIdx = -1;
				//loop through the array
				var l_iCacheListLength = SingapuRateCacheList.prefKey.length;
				var l_iStartPos = SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
				l_iStartPos += SingapuRateUtilities.SingapuRateNumCachesMoveBack; //move further slots to list end to ensure previous cache can be better matched
				if( l_iStartPos >= l_iCacheListLength )			
				{
					l_iStartPos = l_iCacheListLength - 1;
				}
					
				for(var pIdx = l_iStartPos; pIdx > ( l_iStartPos + 1 - SingapuRateUtilities.SingapuRateMaxNumCaches); pIdx--)
				{
					var lipIdx = pIdx;
					if( lipIdx < 0 )
						lipIdx = lipIdx + SingapuRateUtilities.SingapuRateMaxNumCaches;
					
					var piKey = SingapuRateCacheList.idxToDomains[lipIdx];
					if( piKey != sOnlyDomainName )
						continue;
								
					iUrlIdx 		= lipIdx;
							
					//we can break already as we have got one match
					break;
				}
					
				var liCheckCounter = 0;
				//check for 5 times if we cannot found it in cache
				while(liCheckCounter < 5 && iUrlIdx < 0)
				{
					var bCheckReusltBlock = XULSingapuRateChrome.checkLocation(sOnlyDomainName);
					liCheckCounter += 1;
					if(bCheckReusltBlock === false)
					{
						//found it again
						//loop through the array
						var l_iCacheListLength2 = SingapuRateCacheList.prefKey.length;
						var l_iStartPos2 = SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
						l_iStartPos2 += SingapuRateUtilities.SingapuRateNumCachesMoveBack; //move further slots to list end to ensure previous cache can be better matched
						if( l_iStartPos2 >= l_iCacheListLength2 )			
						{
							l_iStartPos2 = l_iCacheListLength2 - 1;
						}
							
						for(var pIdx2 = l_iStartPos2; pIdx2 > ( l_iStartPos2 + 1 - SingapuRateUtilities.SingapuRateMaxNumCaches); pIdx2--)
						{
							var lipIdx2 = pIdx2;
							if( lipIdx2 < 0 )
								lipIdx2 = lipIdx2 + SingapuRateUtilities.SingapuRateMaxNumCaches;
							
							var piKey2 = SingapuRateCacheList.idxToDomains[lipIdx2];
							if( piKey2 != sOnlyDomainName )
								continue;
										
							iUrlIdx 		= lipIdx2;
									
							//we can break already as we have got one match
							break;		//break from for loop, continue with while loop
						}
					}
					//*/
				}
					
				var minAge = 21;
				var category = "R21";
				var voteId = -1;
				var ctgryId = -1;
				if(iUrlIdx >= 0)
				{
					//found the cache
					category 		= SingapuRateCacheList.categories[iUrlIdx];
					ctgryId 		= SingapuRateCacheList.ctgryIds[iUrlIdx];
					voteId			= SingapuRateCacheList.voteIds[iUrlIdx];
					minAge			= SingapuRateCacheList.minAges[iUrlIdx];
						
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
						var voteId		= SingapuRateCacheList.voteIds[iUrlIdx];
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
							      	gBrowser.selectedTab = SingapuRateMainWindow.gBrowser.addTab("http://" + SingapuRateUtilities.SingapuRateDomainName + "/posting.php?wrs_url=" + sOnlyDomainName + "&wrs_rc=" + ctgryId);
							    }
						    },
						    
							{
						        label: whyYourOpinionMattersText,
						        accessKey: 'w',
						        callback: function(aEvent) 
						        { 
									//redirect to singapurate.com for registration
							      	gBrowser.selectedTab = SingapuRateMainWindow.gBrowser.addTab("http://" + SingapuRateUtilities.SingapuRateDomainName + "/viewtopic.php?f=12&t=1280");
							    }
						    },
							
						    /*
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
						    //*/					    
						    ];
						}
					    const priority = nb.PRIORITY_WARNING_HIGH;
					    nb.appendNotification(sLabelText, sNotificationBoxName,
					                         'chrome://singapurate/skin/icon_exclaim.gif',
					                          priority, buttons);
					}
		
					if(minAge > usrCurrentAge)
					{
						//display another page?
						var doc = event.target;
						var win = doc.defaultView;
						var blockURL = SingapuRateUtilities.SingapuRateLocalBlockedHtml + "?" + SingapuRateUtilities.SingapuRateParamNameUrl + "=" + sOnlyDomainName 
											+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryName + "=" + category 
											+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryId + "=" + ctgryId
											+ "&" + SingapuRateUtilities.SingapuRateParamNameVoteId + "=" + voteId
											+ "&" + SingapuRateUtilities.SingapuRateParamNameMinAge + "=" + minAge;
						win.location.replace(blockURL);
					}
						
					return;
										
				}
				else
				{
					//did not find it in the cache, soap request may come back late
					//let us inform user that its rating is possible 21, refresh to found it out
					//display another page?
					var doc = event.target;
					var win = doc.defaultView;
					var blockURL = SingapuRateUtilities.SingapuRateLocalSuspendedHtml + "?" + SingapuRateUtilities.SingapuRateParamNameUrl + "=" + sUrlAddress ;
					win.location.replace(blockURL);
					return;
				}
			
	        }
	        catch(e)
	        {
		        //caught an exception
	        }
	        //if reach this end, something wrong
			var doc = event.target;
			var win = doc.defaultView;
			win.location.replace(SingapuRateUtilities.SingapuRateLocalBlockedDefaultHtml);
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
		if(retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === true)
		{
			var acctAge = SingapuRateUtilities.getUserAge(retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday]);
			
		    var stringBundle = document.getElementById("singapurate-string-bundle");
		    var sLoginMsg = stringBundle.getFormattedString("SingapuRate.loginSuccess", [retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName], acctAge]);
			window.alert(sLoginMsg);
			return;
		}
		
   		var retVals = {username : null, password : null};
		window.openDialog(  'chrome://singapurate/content/login.xul',
							'showmore',
							'chrome,centerscreen,modal',
							retVals);	
	},

	loadSingapuRateLogoutDialog : function(aEvent) 
	{
		var retResults = SingapuRatePrefs.readPrefs();
		if(retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === false)
		{
		    var stringBundle = document.getElementById("singapurate-string-bundle");
		    var sLogoutMsg = stringBundle.getString("SingapuRate.alreadyLogout");
			window.alert(sLogoutMsg);
			return;
		}
		
		//pass the username to dialog box		
   		var retVals = {username : retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName], password : null};
		var theDialogBox = window.openDialog(  'chrome://singapurate/content/logout.xul',
							'showmore',
							'chrome,centerscreen,modal',
							retVals);
	},
	
	onLoadLogout : function(aEvent)
	{
		document.getElementById("c_username").value = window.arguments[0].username;
	},

	onRegister : function(aEvent)
	{
		//redirect to singapurate.com for registration
      	gBrowser.selectedTab = gBrowser.addTab("http://" + SingapuRateUtilities.SingapuRateDomainName + "/ucp.php?mode=register");
      	
      	window.close();
      		
		return true;
	},
			
	onLogin	: function(aEvent)
	{
		
		var username = document.getElementById("c_username").value;
		var password = document.getElementById("c_password").value;
		
		var param_and_inputs = {"usr" : username,
								"password" : password };
								
		var retString = SingapuRateWebService.doSendRequest(SingapuRateUtilities.SingapuRateWSLoginMethod, param_and_inputs);
		//now check whether this login credential has been properly verified or not.
		var resArray = retString.split("|");
		var loginSuccess = false;
		var loginErrMsg = "";
		var loginAcct = "";
		var acctBirthday = "";
		var acctAge = "";
		for(var idx in resArray)
		{
			var tmpStr = resArray[idx];
			var kvPair = tmpStr.split("=");
			if(kvPair.length >= 2)
			{
				if(kvPair[0] == "status")
				{
					if(kvPair[1].trim() == SingapuRateUtilities.SingapuRateWSLoginSuccess)
					{
						//it means he successfully signed in
						loginSuccess = true;
					}
					else
					{
						//failed to login
					}
				}
				else if(kvPair[0] == "birthday")
				{
					acctBirthday = (kvPair[1]).trim();
				}
				else if(kvPair[0] == "age")
				{
					acctAge = (kvPair[1]).trim();
				}
				else if(kvPair[0] == "usr")
				{
					loginAcct = (kvPair[1]).trim();
				}
				else if(kvPair[0] == "errorMsg")
				{
					loginErrMsg = (kvPair[1]).trim();
				}
			}
		}
		
		if(loginSuccess == false
				|| loginAcct != username)
		{
		    var stringBundle1 = document.getElementById("singapurate-string-bundle");
		    var sLoginMsg = stringBundle1.getFormattedString("SingapuRate.loginFailure", [username, loginErrMsg]);
			window.alert(sLoginMsg);
			//we store it login failure as well
			SingapuRatePrefs.storePrefs(loginSuccess, username, acctBirthday);
			return false;
		}

		//login succeed
	    var stringBundle2 = document.getElementById("singapurate-string-bundle");
	    var sLoginFirstTime = stringBundle2.getFormattedString("SingapuRate.loginFirstTime", [username, acctAge]);
		window.alert(sLoginFirstTime);
		//we will need to save something to ensure that he does not need to relogin for browsing and our future reference.
		SingapuRatePrefs.storePrefs(loginSuccess, username, acctBirthday);

		return true;
	},	

	onLogout : function(aEvent)
	{
		var username = document.getElementById("c_username").value;
		var password = document.getElementById("c_password").value;
		
		var param_and_inputs = {"usr" : username,
								"password" : password };
								
		var retString = SingapuRateWebService.doSendRequest(SingapuRateUtilities.SingapuRateWSLoginMethod, param_and_inputs);
		//now check whether this login credential has been properly verified or not.
		var resArray = retString.split("|");
		var loginSuccess = false;
		var loginErrMsg = "";
		var loginAcct = "";
		var acctBirthday = "";
		var acctAge = "";
		for(var idx in resArray)
		{
			var tmpStr = resArray[idx];
			var kvPair = tmpStr.split("=");
			if(kvPair.length >= 2)
			{
				if(kvPair[0] == "status")
				{
					if(kvPair[1].trim() == SingapuRateUtilities.SingapuRateWSLoginSuccess)
					{
						//it means he successfully signed in
						loginSuccess = true;
					}
					else
					{
						//failed to login
					}
				}
				else if(kvPair[0] == "birthday")
				{
					acctBirthday = (kvPair[1]).trim();
				}
				else if(kvPair[0] == "age")
				{
					acctAge = (kvPair[1]).trim();
				}
				else if(kvPair[0] == "usr")
				{
					loginAcct = (kvPair[1]).trim();
				}
				else if(kvPair[0] == "errorMsg")
				{
					loginErrMsg = (kvPair[1]).trim();
				}
			}
		}
		
		if(loginSuccess == false
				|| loginAcct != username)
		{

		    var stringBundle1 = document.getElementById("singapurate-string-bundle");
		    var sLogoutFailure = stringBundle1.getFormattedString("SingapuRate.logoutFailure", [username, loginErrMsg]);
			window.alert(sLogoutFailure);
			return false;
		}

		//login succeed, proceed to logout
	    var stringBundle2 = document.getElementById("singapurate-string-bundle");
	    var sLogoutSuccess = stringBundle2.getFormattedString("SingapuRate.logoutSuccess", [username]);
		window.alert(sLogoutSuccess);
		//we will need to save something to ensure that user will be required to login again
		SingapuRatePrefs.storePrefs(false, username, acctBirthday);
		
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
	                                        
	            aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
	            
				SingapuRateStoredInformation = SingapuRatePrefs.readPrefs();
				
				var bCheckReusltBlock = XULSingapuRateChrome.checkLocation(aSubject.URI.spec);
				if(bCheckReusltBlock === false)
				{
					return;
				}
	           	XULSingapuRateChrome.showBlockWarningBar();
	            aSubject.loadFlags = Components.interfaces.nsICachingChannel.LOAD_ONLY_FROM_CACHE;
	            aSubject.cancel(Components.results.NS_BINDING_ABORTED);
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

