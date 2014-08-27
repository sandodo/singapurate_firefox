var SingapuRateTabs = require("sdk/tabs");
var { ToggleButton } = require('sdk/ui/button/toggle');
var SingapuRatePanels = require("sdk/panel");
var SingapuRateSelf = require("sdk/self");
var SingapuRateSS = require("sdk/simple-storage");
var SingapuRateWin = require("sdk/windows").browserWindows;
var SingapuRateUtils = require("./utils.js");


var SingapuRateButton = ToggleButton({
	id: "my_button",
	label: "Website Filtering Service",
	icon: {
		"16": "./icon16.png",
		"32": "./icon32.png",
		"64": "./icon64.png"
	},
	onChange: SingapuRateHandleChange
});

var SingapuRatePanel = SingapuRatePanels.Panel({
	width: 380,
	height: 300,
	contentURL: SingapuRateSelf.data.url("popup.html"),
	contentScriptFile: [ 
		SingapuRateSelf.data.url("md5.js"),
		SingapuRateSelf.data.url("popup.js") 
	],
	onHide: SingapuRateHandleHide
});

//when panel is ready, send this event to popup.js to prepare for init
SingapuRatePanel.on("show", function() {
	SingapuRatePanel.port.emit("show");
	//continue to emit messages to init the panel
	var sPostMsg = "";
	sPostMsg += "c_username" + "===" + SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAcctName] + "|||";

	//get birthday
	var today = new Date();
	var l_iTodayY = today.getFullYear();
	var l_iTodayM = (today.getMonth() + 1);
	var l_iTodayD = (today.getDate());
	var sBirthday = "" + l_iTodayD + "-" + l_iTodayM + "-" + l_iTodayY;	
	var sStoredBirthday = "" + SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday];
	if( sStoredBirthday != "undefined")
	{
		var resArray = sStoredBirthday.split("-");
		if(resArray.length == 3)
		{
			//it is a correct birthday format
			sBirthday = sStoredBirthday;
		}
	}
	sPostMsg += "c_birthday" + "===" + sBirthday + "|||";
	
	var sUserAge = SingapuRateUtils.SR_Utilities.getUserAge( sBirthday );
	sPostMsg += "userAge" + "===" + sUserAge + "|||";
	
	sPostMsg += "authenticate" + "===" + SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] + "|||";
	sPostMsg += "c_supersafe" + "===" + SingapuRateSS.storage[ SingapuRateUtils.SR_Utilities.SingapuRatePrefKeySuperSafeMode ] + "|||";
	
	var sAuthenticateCode = "" + SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAthentCode];
	sPostMsg += "authencode" + "===" + sAuthenticateCode + "|||";
	
	var strKeyCurDomainUrlIdx 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCurDomainUrlIdx;
	var iUrlIdx = SingapuRateSS.storage[strKeyCurDomainUrlIdx];
	sPostMsg += "curDomainUrlIdx" + "===" + iUrlIdx + "|||";
	
	var strKeyCLIdxToDomainsWI 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCLIdxToDomains + iUrlIdx;
	var sOnlyDomainName 		= SingapuRateSS.storage[strKeyCLIdxToDomainsWI];
	sPostMsg += "ToCheckDomainName" + "===" + sOnlyDomainName + "|||";
	
    var strKeyCLVoteIdsWI  	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCLVoteIds + iUrlIdx;
    var strKeyCLCtgryIdsWI 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCLCtgryIds + iUrlIdx;
    var sVoteId 			= SingapuRateSS.storage[strKeyCLVoteIdsWI];	
    var sCategoryId 		= SingapuRateSS.storage[strKeyCLCtgryIdsWI];
	sPostMsg += "voteId" + "===" + sVoteId + "|||";
	sPostMsg += "categoryId" + "===" + sCategoryId + "|||";
	
	sPostMsg += "SRDomainName" + "===" + SingapuRateUtils.SR_Utilities.SingapuRateDomainName + "|||";
	
	SingapuRatePanel.port.emit("initMsg", sPostMsg);
	//console.log("pst initMsg" + ": " + sPostMsg);
});

SingapuRatePanel.port.on("save", function(msg) {
	
	//console.log("rcv save" + ": " + msg);
	var sRcvMsg = msg;
	var resArray = sRcvMsg.split("|||");
	var sUserName = "";
	var sUserPassword = "";
	var sUserBirthday = "";
	var sSuperSafeMode = "";
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
		else if (sTempKeyValuePair[0] == "c_password")
		{
			sUserPassword = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "c_birthday")
		{
			sUserBirthday = sTempKeyValuePair[1];
		}
		else if (sTempKeyValuePair[0] == "c_supersafe")
		{
			sSuperSafeMode = sTempKeyValuePair[1];
		}
	}
	
	var bAuthenticated = true;
	if( SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === true 
			|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "true"  )
	{
	    var passwordCombineStr = sUserName + sUserPassword + 'nh4da68h4jf6s4kj8g6d4df8b4d5';
		var passwordEncrypted = "" + SingapuRateUtils.SR_Utilities.hex_sha256(passwordCombineStr);
		//console.log("save" + ": [" + passwordEncrypted + "] vs ["
		//				+ SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAthentCode] + "]");
		
		if( passwordEncrypted == SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAthentCode] )
		{
			//authenticate the user with password, proceed to update profile
		}
		else
		{
			//failed to authenticate
			bAuthenticated = false;
			return;
		}
	}	
	//console.log("save" + ": " + bAuthenticated + ", "
	//			+ sUserName + ", "
	//			+ sUserBirthday + ", "
	//			+ sUserPassword + ", "
	//			+ sSuperSafeMode);
	
	if(sUserBirthday != SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyBirthday]
			|| sSuperSafeMode != SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeySuperSafeMode]
			|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === false 
			|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "false" )
	{
		//store username
		//store birthday
		//store password
		//store super safe mode
		SingapuRateUtils.SR_Prefs.storePrefs(bAuthenticated, sUserName, sUserBirthday, sUserPassword, sSuperSafeMode);
	}

	//*/
	
});

SingapuRatePanel.port.on("deregister", function(msg) {
	
	//console.log("rcv deregister" + ": " + msg);
	var sRcvMsg = msg;
	var resArray = sRcvMsg.split("|||");
	var sUserName = "";
	var sUserBirthday = "";
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
	}	
	
	if(SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] === true 
			|| SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] == "true" )
	{
		//store username
		//store birthday
		//store encrypted password
		SingapuRateUtils.SR_Prefs.storePrefs(false, sUserName, sUserBirthday, "", "no");
	}

	//*/
	
});

SingapuRatePanel.port.on("goUrl", function(msg) {
	
	//console.log("rcv goUrl" + ": " + msg);
	var sRcvMsg = msg;

	SingapuRateTabs.open(sRcvMsg);
	
	SingapuRatePanel.hide();
	
});

function SingapuRateHandleChange(state) {
	if (state.checked) {
		SingapuRatePanel.show({
			position: SingapuRateButton
		});
	}
}

function SingapuRateHandleHide() {
	SingapuRateButton.state('window', {checked: false});
}

/**
 * SingapuRate namespace.
 */

var XULSingapuRateChrome = 
{
	
    init: function()
    {
	    //console.log("XULSingapuRateChrome init");
	    SingapuRateUtils.SR_Utilities.init(); 
		SingapuRateUtils.SR_Prefs.init();
	    SingapuRateUtils.SR_WebService.init();
	    SingapuRateUtils.SR_WebsiteRatings.init(); 
    },
    
    checkLocation: function(aTab, location)
    {
        if(SingapuRateUtils.SR_WebsiteRatings.isBlackList(aTab, location))
        {
            return true;
        }
        
        return false;
		
    },
	
    SingapuRateMain: function(aTab)
    {
	    //console.log("XULSingapuRateChrome SingapuRateMain process " + aTab.url);
	    
	    try
	    {
            //get the url from urlbar
			var strKeyCurDomainUrlIdx 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCurDomainUrlIdx;	    
            SingapuRateSS.storage[strKeyCurDomainUrlIdx] = -1;
			
            var sUrlAddress = aTab.url;
            if(sUrlAddress == "")
            	return;

            var sUrlAddressLowerCase = sUrlAddress.toLowerCase();	
			if(sUrlAddressLowerCase.indexOf("about:addons") == 0)
			{
				//let us check whether we should apply super safe mode
				if( SingapuRateSS.storage[ SingapuRateUtils.SR_Utilities.SingapuRatePrefKeySuperSafeMode ] == "yes" )
				{
                   	aTab.url = SingapuRateSelf.data.url(SingapuRateUtils.SR_Utilities.SingapuRateLocalSuperSafeHtml);
				}
				SingapuRateButton.state("window", {
					"icon" : {
						"16": "./icon16.png",
				    	"32": "./icon32.png",
				    	"64": "./icon64.png"
					}
				});
				return;
			}            	
			else if(sUrlAddressLowerCase.indexOf("chrome-extension:") == 0
					|| sUrlAddressLowerCase.indexOf("chrome:") == 0
					|| sUrlAddressLowerCase.indexOf("resource:") == 0
					|| sUrlAddressLowerCase.indexOf("about:") == 0
					|| sUrlAddressLowerCase.indexOf("view-source:") == 0 )
			{
				SingapuRateButton.state("window", {
					"icon" : {
						"16": "./icon16.png",
				    	"32": "./icon32.png",
				    	"64": "./icon64.png"
					}
				});
				return;
			}
					
			if( SingapuRateUtils.SR_Utilities.isSingapurateDomain(sUrlAddress) === true )
			{
				//certified singapurate urls always
				SingapuRateButton.state("window", {
					"icon" : {
						"16": "./icon16.png",
				    	"32": "./icon32.png",
				    	"64": "./icon64.png"
					}
				});
				return;
			}
					            
	    	var sOnlyDomainName = SingapuRateUtils.SR_Utilities.getOnlyDomainName(sUrlAddress, SingapuRateUtils.SR_Utilities.SingapuRateDomainCheckDepth);
            if(sOnlyDomainName == "")
            {
				SingapuRateButton.state("window", {
					"icon" : {
						"16": "./icon16.png",
				    	"32": "./icon32.png",
				    	"64": "./icon64.png"
					}
				});
            	return;
        	}
            	    	
			var minAge = 21;
			var category = "R21";
			var voteId = -1;
			var ctgryId = -1;
			var retResults = SingapuRateUtils.SR_WebsiteRatings.isBlockedInCache(sOnlyDomainName);
			SingapuRateSS.storage[strKeyCurDomainUrlIdx] = retResults[strKeyCurDomainUrlIdx];
			if(retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameSiteBlocked] === false)
			{
				//allow the site
				if( retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryId] > 0 )
				{
					//found the cache
					category 		= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryName];
					ctgryId 		= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryId];
					voteId			= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameVoteId];
					minAge			= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameMinAge];
					
					//set page action
					SingapuRateButton.state("window", {
					    "icon" : {
					      "16": "./Rating_" + category + ".png",
					      "32": "./Rating_" + category + "_32.png",
					      "64": "./Rating_" + category + "_64.png"
					    }
					});
					
				}
				else
				{
					//allowed because not in cache, now send web service request
					//console.log("XULSingapuRateChrome SingapuRateMain allow " + aTab.url + " because it is not in cache");
					SingapuRateButton.state("window", {
						"icon" : {
							"16": "./icon16.png",
					    	"32": "./icon32.png",
					    	"64": "./icon64.png"
						}
					});
					XULSingapuRateChrome.checkLocation(aTab, sOnlyDomainName);
				}
				return;
			}
			else
			{
				//block the site
				if( retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryId] > 0 )
				{
					//found the cache
					category 		= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryName];
					ctgryId 		= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryId];
					voteId			= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameVoteId];
					minAge			= retResults[SingapuRateUtils.SR_Utilities.SingapuRateParamNameMinAge];
						
					//display another page?
					var blockURL = SingapuRateSelf.data.url(SingapuRateUtils.SR_Utilities.SingapuRateLocalBlockedHtml) 
										+ "?" + SingapuRateUtils.SR_Utilities.SingapuRateParamNameUrl + "=" + sOnlyDomainName 
										+ "&" + SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryName + "=" + category 
										+ "&" + SingapuRateUtils.SR_Utilities.SingapuRateParamNameCategoryId + "=" + ctgryId
										+ "&" + SingapuRateUtils.SR_Utilities.SingapuRateParamNameVoteId + "=" + voteId
										+ "&" + SingapuRateUtils.SR_Utilities.SingapuRateParamNameMinAge + "=" + minAge;
               		aTab.url = blockURL;
						
					return;
				}
				else
				{
					//blocked but without any information, happens if user is not logged in
					//console.log("XULSingapuRateChrome SingapuRateMain block " + aTab.url + " because user is not logged in");

               		aTab.url = SingapuRateSelf.data.url(SingapuRateUtils.SR_Utilities.SingapuRateLocalBlockedDefaultHtml);
               		return;
				}
			}
        }
        catch(e)
        {
	        //caught an exception
        }
        //*/
		return;
    },
    
};

var windows = require("sdk/windows").browserWindows;
// add a listener to the 'open' event
windows.on('open', function(window) {
  XULSingapuRateChrome.init();  
});

function SingapuRateCallMain() {
	XULSingapuRateChrome.SingapuRateMain(SingapuRateTabs.activeTab);
	require('sdk/timers').setTimeout(SingapuRateCallMain, 500);
};

require('sdk/timers').setTimeout(SingapuRateCallMain, 500);

//*/