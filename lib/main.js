var SingapuRateTabs = require("sdk/tabs");
var { ToggleButton } = require('sdk/ui/button/toggle');
var SingapuRatePanels = require("sdk/panel");
var SingapuRateSelf = require("sdk/self");
var SingapuRateSS = require("sdk/simple-storage");
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
	width: 350,
	height: 300,
	contentURL: SingapuRateSelf.data.url("popup.html"),
	contentScriptFile: SingapuRateSelf.data.url("popup.js"),
	onHide: SingapuRateHandleHide
});

//when panel is ready, send this event to popup.js to prepare for init
SingapuRatePanel.on("show", function() {
	SingapuRatePanel.port.emit("show");
	//continue to emit messages to init the panel
	var sPostMsg = "";
	sPostMsg += "c_username" + "===" + SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAcctName] + "|||";
	sPostMsg += "c_birthday" + "===" + "15-08-2014" + "|||";
	sPostMsg += "authenticate" + "===" + SingapuRateSS.storage[SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyAuthenticate] + "|||";
	
	var strKeyCurDomainUrlIdx 	= SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCurDomainUrlIdx;
	var iUrlIdx = SingapuRateSS.storage[strKeyCurDomainUrlIdx];
	sPostMsg += "curDomainUrlIdx" + "===" + "23" + "|||";
    var strKeyCLVoteIdsWI = SingapuRateUtils.SR_Utilities.SingapuRatePrefKeyCLVoteIds + iUrlIdx;
    var sVoteId = (SingapuRateSS.storage[strKeyCLVoteIdsWI]);	
	sPostMsg += "voteId" + "===" + "12" + "|||";
	
	SingapuRatePanel.port.emit("initMsg", sPostMsg);
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
	    SingapuRateUtilities.init(); 
	    SingapuRatePrefs.init();  
	    SingapuRateWebService.init();
	    SingapuRateWebsiteRatings.init(); 
    },
    
    checkLocation: function(aTab, location)
    {
        if(SingapuRateWebsiteRatings.isBlackList(aTab, location))
        {
            return true;
        }
        
        return false;
		
    },
	
    SingapuRateMain: function(aTab)
    {
	    try
	    {
            //get the url from urlbar
			var strKeyCurDomainUrlIdx 	= SingapuRateUtilities.SingapuRatePrefKeyCurDomainUrlIdx;	    
            SingapuRateSS.storage[strKeyCurDomainUrlIdx] = -1;
			
            var sUrlAddress = aTab.url;
            if(sUrlAddress == "")
            	return;

            var sUrlAddressLowerCase = sUrlAddress.toLowerCase();	
			if(sUrlAddressLowerCase.indexOf("chrome://extensions") == 0)
			{
				//let us check whether we should apply super safe mode
				if( SingapuRateSS.storage[ SingapuRateUtilities.SingapuRatePrefKeySuperSafeMode ] == "yes" )
				{
                   	aTab.url = SingapuRateSuperSafePage;
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
					|| sUrlAddressLowerCase.indexOf("about:") == 0
					|| sUrlAddressLowerCase.indexOf("view-source:") == 0 )
			{
				chrome.browserAction.setIcon({path: "skin/icon19.png"}, function() {});
				return;
			}
					
			if( SingapuRateUtilities.isSingapurateDomain(sUrlAddress) === true )
			{
				//certified singapurate urls always
				chrome.browserAction.setIcon({path: "skin/icon19.png"}, function() {});
				return;
			}
					            
	    	var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(sUrlAddress, SingapuRateUtilities.SingapuRateDomainCheckDepth);
            if(sOnlyDomainName == "")
            {
				chrome.browserAction.setIcon({path: "skin/icon19.png"}, function() {});
            	return;
        	}
            	    	
			var minAge = 21;
			var category = "R21";
			var voteId = -1;
			var ctgryId = -1;
			var retResults = SingapuRateWebsiteRatings.isBlockedInCache(sOnlyDomainName);
			SingapuRateSS.storage[strKeyCurDomainUrlIdx] = retResults[strKeyCurDomainUrlIdx];
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
					
					//set page action
					  SingapuRateButton.state("window", {
					    "icon" : {
					      "16": "./Rating_" + category + ".png",
					      "32": "./icon32.png",
					      "64": "./icon64.png"
					    }
					  });
					
				}
				else
				{
					//allowed because not in cache, now send web service request
					chrome.browserAction.setIcon({path: "skin/icon19.png"}, function() {});
					XULSingapuRateChrome.checkLocation(aTab, sOnlyDomainName);
				}
				return;
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
					var blockURL = SingapuRateBlockedPage + "?" + SingapuRateUtilities.SingapuRateParamNameUrl + "=" + sOnlyDomainName 
										+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryName + "=" + category 
										+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryId + "=" + ctgryId
										+ "&" + SingapuRateUtilities.SingapuRateParamNameVoteId + "=" + voteId
										+ "&" + SingapuRateUtilities.SingapuRateParamNameMinAge + "=" + minAge;
			        chrome.tabs.update(aTab.id, {
                      		url: blockURL
               		});
						
					return;
				}
				else
				{
					//blocked but without any information, happens if user is not logged in
			        chrome.tabs.update(aTab.id, {
                   		url: SingapuRateBlkDftPage
               		});
               		return;
				}
			}
        }
        catch(e)
        {
	        //caught an exception
        }
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

