/**
 * SingapuRate namespace.
 */
if ("undefined" == typeof(XULSingapuRateChrome)) {
  var XULSingapuRateChrome = {};
}; 
if ("undefined" == typeof(SingapuRateMainWindow)) {
  var SingapuRateMainWindow = {};
}; 
if ("undefined" == typeof(SingapuRateObserver)) {
  var SingapuRateObserver = {};
}; 
if ("undefined" == typeof(SingapuRateObserverService)) {
  var SingapuRateObserverService = {};
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


// SingapuRate Modules 
var SingapuRateDomainName 				= "singapurate.com";
var SingapuRateWSNameSpace 				= "http://www.singapurate.com/soap/SingapuRateService";
var SingapuRateWSLocation 				= "http://www.singapurate.com/check/soapService.php";
var SingapuRateWSLoginMethod 			= "SingapuraLogin";
var SingapuRateWSRateMethod 			= "SingapuraRating";
var SingapuRateWSLoginSuccess 			= "3";
var SingapuRateExtensionName 			= "XULSingapuRateChrome";
var SingapuRatePrefKeyAcctName			= "acctName";
var SingapuRatePrefKeyBirthday			= "birthday";
var SingapuRatePrefKeyAuthenticate		= "authenticate";
var SingapuRatePrefKeyNumCaches			= "numCaches";
var SingapuRateMaxNumCaches				= 200;
var SingapuRateNumCachesMoveBack		= 10;
var SingapuRateDomainCheckDepth			= 2;
var SingapuRateLocalBlockedHtml			= "chrome://singapurate/locale/blocked.html";
var SingapuRateLocalBlockedDefaultHtml	= "chrome://singapurate/locale/default.html";
var SingapuRateLocalSuspendedHtml		= "chrome://singapurate/locale/suspended.html";

var SingapuRateParamNameUrl				= "wrs_url";
var SingapuRateParamNameCategoryName	= "wrs_cn";
var SingapuRateParamNameCategoryId		= "wrs_rc";
var SingapuRateParamNameVoteId			= "wrs_vi";
var SingapuRateParamNameMinAge			= "wrs_minAge";

var SingapuRateMainWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");

var SingapuRateCacheList = {
	liTotalNumCaches	: 4,
	prefKey 			: Array("*", "*", "*", "*"),															//normally acctName + index, then for each element add another initial
	domains 			: {"www.singapurate.com": 0, "www.singapurate.com/community": 1, "www.google.com": 2, "www.google.com.sg": 3},			//all urls accessed and processed
	idxToDomains		: {0: "www.singapurate.com", 1: "www.singapurate.com/community", 2: "www.google.com", 3: "www.google.com.sg"},			//all urls accessed and processed
	categories 			: Array("G", "G", "G", "G"),																//categories of the url
	ctgryIds 			: Array(1, 1, 1, 1),																	//category ids of the url
	minAges 			: Array(0, 0, 0, 0),																	//minimum age allowed to access
	entryDates			: Array(20140625, 20140625, 20140625, 20140625),								//all entries are valid for one day only.
	voteIds				: Array(-1, -1, -1, -1),											//votes provided the login user
	usrMinAges 			: Array(-1, -1, -1, -1),											//minimum age defined by user himself allowed to access
};

var SingapuRateUtilities = 
{
	
    getUserAge: function(sBirthday)
    {
		var acctAge = 0;
		
		if(!sBirthday || sBirthday === "")
			return acctAge;
		
		var resArray = sBirthday.split("-");
		if(resArray.length == 3)
		{
			//birthday is correct
			var birthDay = parseInt(resArray[0]);
			var birthMonth = parseInt(resArray[1]);
			var birthYear = parseInt(resArray[2]);
			
			if (birthYear > 0)
			{
				var today = new Date();
		
				var diff = today.getMonth() + 1 - birthMonth;
				if (diff == 0)
				{
					diff = (today.getDate() - birthDay < 0) ? 1 : 0;
				}
				else
				{
					diff = (diff < 0) ? 1 : 0;
				}
		
				acctAge = Math.max(0, (today.getFullYear() - birthYear - diff));
				
				//suppose a person cannot have age greater than 200 years old.
				if(acctAge > 200)
					acctAge = 0;
			}
								
		}
        return acctAge;
    },
    
	hex_sha256 : function (str)
	{
		var converter =	Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
	
		// we use UTF-8 here, you can choose other encodings.
		converter.charset = "UTF-8";
		// result is an out parameter,
		// result.value will contain the array length
		var result = {};
		// data is an array of bytes
		var data = converter.convertToByteArray(str, result);
		var ch = Components.classes["@mozilla.org/security/hash;1"]
		                   .createInstance(Components.interfaces.nsICryptoHash);
		ch.init(ch.SHA256);
		ch.update(data, data.length);
		var hash = ch.finish(false);
	
		// return the two-digit hexadecimal code for a byte
		function toHexString(charCode)
		{
		  return ("0" + charCode.toString(16)).slice(-2);
		}
	
		// convert the binary hash data to a hex string.
		return [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
	},
    
	getOnlyDomainName : function (weburl, maxDepth)
	{
		//at least one depth - means domain name
		var iLocalMaxDepth = 1;
		if(maxDepth > iLocalMaxDepth)
		{
			iLocalMaxDepth = maxDepth;
		}
		else if(maxDepth <= 0)
		{
			//took the maximum possible depth
			iLocalMaxDepth = 100;
		}
	    var sOnlyDomainName = "";
	    var splitResults = weburl.split("//");
		for(var i=0; i < splitResults.length; i++) 
		{
			if(i > 1)
				break;		//split with "//" can have at most two valid parts

			var strTemp = splitResults[i].toLowerCase();	
			if(!strTemp
					|| strTemp == "" 
					|| strTemp.indexOf("http:") == 0
					|| strTemp.indexOf("https:") == 0
					|| strTemp.indexOf("ftp:") == 0
					|| strTemp.indexOf("ftps:") == 0)
			{
				continue;
			}
			if(strTemp.indexOf("chrome://") == 0)
			{
				return "";
			}
			//now check whether the domain is allowed
			var sTempUrlParts = strTemp.split("/");						
			for(var j = 0; j < sTempUrlParts.length; j++) 
			{
				if(j >= iLocalMaxDepth)
					break;
				
				if(sTempUrlParts[j] == "")
					continue;	
					
				var sTemp = sOnlyDomainName + "/" + sTempUrlParts[j];
				if( sTemp.length > 60 )
					break;	//split with "/" and we are only interested in first 60 characters
				if(j == 0)
				{
					if( sTempUrlParts[j].indexOf("&") >= 0 
							|| sTempUrlParts[j].indexOf("?") >= 0 
							|| sTempUrlParts[j].indexOf("=") >= 0 
							|| sTempUrlParts[j].indexOf("#") >= 0 )
					{
						break;
					}
					var sTmpDomainParts = sTempUrlParts[j].split(":");
					sOnlyDomainName = sTmpDomainParts[0];  //only took the first part
				}
				else
				{
					if( sTempUrlParts[j].indexOf(".") >= 0
							|| sTempUrlParts[j].indexOf("&") >= 0 
							|| sTempUrlParts[j].indexOf("?") >= 0 
							|| sTempUrlParts[j].indexOf("=") >= 0 
							|| sTempUrlParts[j].indexOf("#") >= 0)
					{
						//for other parts of url, should not have . inside.
						break;
					}
					sOnlyDomainName = sOnlyDomainName + "/" + sTempUrlParts[j];
				}
			}
		}
		if(sOnlyDomainName == "")
			return sOnlyDomainName;
			
		var tmpDomainParts = sOnlyDomainName.split(".");
		if(tmpDomainParts.length <= 2)
		{
			if(	tmpDomainParts.length == 1				//only has one part
					|| tmpDomainParts[0] == "www")   	//only has www, wrong domain url
				return "";
			//it is not started with www., add it
			sOnlyDomainName = "www." + sOnlyDomainName;
		}	
		
		return sOnlyDomainName;	
	},
	
};

var SingapuRatePrefs = 
{
    storePrefs: function(bLogin, sAcctName, sBirthday)
    {
        SingapuRateStoredInformation[SingapuRatePrefKeyAuthenticate] = bLogin;
        SingapuRateStoredInformation[SingapuRatePrefKeyAcctName] = sAcctName;
        SingapuRateStoredInformation[SingapuRatePrefKeyBirthday] = sBirthday;
	    
        try
        {
	        var SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateExtensionName + ".");
	
	        // Store acct name
	        SingapuRatePrefBranch.setCharPref(SingapuRatePrefKeyAcctName, sAcctName);
	        // Store acct birthday
	        SingapuRatePrefBranch.setCharPref(SingapuRatePrefKeyBirthday, sBirthday);
	        // Store authenticate
	        var sCombinedAuthenticate = sAcctName.trim() + sBirthday.trim() + bLogin;
	        SingapuRatePrefBranch.setCharPref(SingapuRatePrefKeyAuthenticate, SingapuRateUtilities.hex_sha256(sCombinedAuthenticate + 'nh4da68h4jf6s4kj8g6d4df8b4d5'));
        }
        catch(e)
        {
        }        
        return true;
    },
	
    readPrefs: function()
    {
		var retResults = { SingapuRatePrefKeyAuthenticate: false, SingapuRatePrefKeyAcctName: "", SingapuRatePrefKeyBirthday: "" };
			    
        try
        {
        	const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateExtensionName + ".");
            
            // Read acct name
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRatePrefKeyAcctName))
            {
                retResults[SingapuRatePrefKeyAcctName] = SingapuRatePrefBranch.getCharPref(SingapuRatePrefKeyAcctName).trim();
            }

            // Read birthday
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRatePrefKeyBirthday))
            {
                retResults[SingapuRatePrefKeyBirthday] = SingapuRatePrefBranch.getCharPref(SingapuRatePrefKeyBirthday).trim();
            }
            
            // Read authenticate
            if(retResults[SingapuRatePrefKeyAcctName] && retResults[SingapuRatePrefKeyAcctName] !== ""
            		&& retResults[SingapuRatePrefKeyBirthday] && retResults[SingapuRatePrefKeyBirthday] !== ""
            		&& SingapuRatePrefBranch.prefHasUserValue(SingapuRatePrefKeyAuthenticate))
            {
                var sAuthenticate = SingapuRatePrefBranch.getCharPref(SingapuRatePrefKeyAuthenticate);
                //check whether it is not logged in?
                var bLoggedIn = false;
                var sCombinedAuthenticate = retResults[SingapuRatePrefKeyAcctName] + retResults[SingapuRatePrefKeyBirthday] + bLoggedIn;
                if(sAuthenticate == SingapuRateUtilities.hex_sha256(sCombinedAuthenticate + 'nh4da68h4jf6s4kj8g6d4df8b4d5'))
                {
	                retResults[SingapuRatePrefKeyAuthenticate] = false;
                }
                else	//check for login?
                {
	                bLoggedIn = true;
	                sCombinedAuthenticate = retResults[SingapuRatePrefKeyAcctName] + retResults[SingapuRatePrefKeyBirthday] + bLoggedIn;
	                if(sAuthenticate == SingapuRateUtilities.hex_sha256(sCombinedAuthenticate + 'nh4da68h4jf6s4kj8g6d4df8b4d5'))
	                {
		                retResults[SingapuRatePrefKeyAuthenticate] = true;
	                }
                }
            }
        }
        catch(e)
        {
        }
        
        SingapuRateStoredInformation[SingapuRatePrefKeyAuthenticate] = retResults[SingapuRatePrefKeyAuthenticate];
        SingapuRateStoredInformation[SingapuRatePrefKeyAcctName] = retResults[SingapuRatePrefKeyAcctName];
        SingapuRateStoredInformation[SingapuRatePrefKeyBirthday] = retResults[SingapuRatePrefKeyBirthday];
        
        return retResults;
    },

    readNumDomainCaches: function()
    {
	    var iTotalNumCaches = 0;
	    
        try
        {
        	const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateExtensionName + ".");
            
            // Read number of caches
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRatePrefKeyNumCaches))
            {
                iTotalNumCaches = SingapuRatePrefBranch.getIntPref(SingapuRatePrefKeyNumCaches);
            }
        }
        catch(e)
        {
        }	    
        
        return iTotalNumCaches;
    },
    
    storeNumDomainCaches: function(iTotalNumCaches)
    {
	    if(iTotalNumCaches <= 0)
	    	return false;
	    	
        try
        {
        	const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateExtensionName + ".");
            
            // store number of caches
            SingapuRatePrefBranch.setIntPref(SingapuRatePrefKeyNumCaches, iTotalNumCaches);
        }
        catch(e)
        {
	        return false;
        }	    
        
        return true;
    },
        
    storeDomainCaches: function(sPrefKey, iIdxNum, sDomainName, sCategory, iCtgryId, iMinAge, iIntegerToday, iVoteId, iUsrMinAge)
    {
	    
        try
        {
	        var SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateExtensionName + ".");

	        //store everything as a string under the key
	        var sResultValue = "";
	        
	        // Store domain idx as check sum
	        sResultValue = sResultValue + iIdxNum;
	        // Store domain url
	        sResultValue = sResultValue + "|||" + sDomainName;
	        // Store category
	        sResultValue = sResultValue + "|||" + sCategory;
	        // Store category id
	        sResultValue = sResultValue + "|||" + iCtgryId;
	        // Store min age
	        sResultValue = sResultValue + "|||" + iMinAge;
	        // Store entryDate
	        sResultValue = sResultValue + "|||" + iIntegerToday;
	        // Store vote id
	        sResultValue = sResultValue + "|||" + iVoteId;
	        // Store user min age
	        sResultValue = sResultValue + "|||" + iUsrMinAge;
	        
	        // Store it as preference
	        SingapuRatePrefBranch.setCharPref(sPrefKey, sResultValue);
	        
	        //store the checksum to verify the integrety of data
	        // Store it as preference
	        SingapuRatePrefBranch.setCharPref(sPrefKey+"|||cksum", SingapuRateUtilities.hex_sha256(sResultValue));
	        
	        
        }
        catch(e)
        {
	        return false;
        }        
        return true;
    },
    
    readDomainCaches: function(sAcctName)
    {
	    if(!sAcctName || sAcctName == "")
	    	return false;
	    
        try
        {
	        var SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateExtensionName + ".");

	        var iTotalNumCaches = 0;

            // Read number of caches
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRatePrefKeyNumCaches))
            {
                iTotalNumCaches = SingapuRatePrefBranch.getIntPref(SingapuRatePrefKeyNumCaches);
            }
            if(iTotalNumCaches <= 0)
            {
       	    	SingapuRateCacheList.liTotalNumCaches = 0;
	            return true;
            }
   	    	SingapuRateCacheList.iTotalNumCaches = iTotalNumCaches;
            //now start to restore the caches
            for(var i = 0; i < SingapuRateCacheList.iTotalNumCaches; i++)
            {
	            if(i >= SingapuRateMaxNumCaches)
	            	break;
	            	
				var sPrefKey = sAcctName + "|||" + i;	
	            if(SingapuRatePrefBranch.prefHasUserValue(sPrefKey))
	            {
	                var sPrefValueStored = SingapuRatePrefBranch.getCharPref(sPrefKey);
	                if(!sPrefValueStored || sPrefValueStored == "")
	                	continue;
	                	
	                var sPrefValueItems = sPrefValueStored.split("|||");
	                if( sPrefValueItems.length < 8 )
	                	continue;
	                	
	                if( !SingapuRatePrefBranch.prefHasUserValue(sPrefKey + "|||cksum" ) )	
	                {
		                continue;
	                }

					var sPrefValueCkSum = SingapuRatePrefBranch.getCharPref(sPrefKey + "|||cksum");	                
					if( sPrefValueCkSum != SingapuRateUtilities.hex_sha256(sPrefValueStored))
					{
						//cksum doesnot match, ignore
						continue;
					}
	                	
	                //iIdxNum, sDomainName, sCategory, iCtgryId, iMinAge, iIntegerToday, iVoteId, iUsrMinAge
	                var iIdxNum = parseInt(sPrefValueItems[0].trim());
	                if(iIdxNum != i)
	                	continue;
	                var sDomainName 	= sPrefValueItems[1].trim();	
	                var sCategory 		= sPrefValueItems[2].trim();	
	                var iCtgryId 		= parseInt(sPrefValueItems[3].trim());	
	                var iMinAge 		= parseInt(sPrefValueItems[4].trim());	
	                var iIntegerToday	= parseInt(sPrefValueItems[5].trim());	
	                var iVoteId			= parseInt(sPrefValueItems[6].trim());	
	                var iUsrMinAge		= parseInt(sPrefValueItems[7].trim());	
	                
	                //now all set, set back to 	SingapuRateCacheList	
					SingapuRateCacheList.prefKey[ i ] 				= sPrefKey;
					SingapuRateCacheList.domains[ sDomainName ] 	= i;
					SingapuRateCacheList.idxToDomains[ i ] 			= sDomainName;
					SingapuRateCacheList.categories[ i ] 			= sCategory;
					SingapuRateCacheList.ctgryIds[ i ] 				= iCtgryId;
					SingapuRateCacheList.minAges[ i ] 				= iMinAge;
					SingapuRateCacheList.entryDates[ i ] 			= iIntegerToday;				
					SingapuRateCacheList.voteIds[ i ] 				= iVoteId;
					SingapuRateCacheList.usrMinAges[ i ] 			= iUsrMinAge;
	            }
            }
	        
        }
        catch(e)
        {
	        return false;
        }        
        return true;
    },
    
    loadDomainCaches : function()
    {
	    this.readPrefs();
	    
	    var sAcctName = SingapuRateStoredInformation[SingapuRatePrefKeyAcctName];
        
		//for(var pKey in SingapuRateCacheList.domains)
		for(var pIdx in SingapuRateCacheList.prefKey)
		{
            //var idx = SingapuRateCacheList.domains[pKey];
            var idx = pIdx;
            //alert(pKey + "\n" 
            alert(SingapuRateCacheList.idxToDomains[ idx ] + "\n" 
            		   + idx + "\n" 
            		   + SingapuRateCacheList.prefKey[ idx ] + "\n"
            		   + SingapuRateCacheList.categories[ idx ] + "\n"
            		   + SingapuRateCacheList.entryDates[ idx ] + "\n"
            		   + SingapuRateCacheList.ctgryIds[ idx ] + "\n"
            		   + SingapuRateCacheList.minAges[ idx ] + "\n"
            		   + SingapuRateCacheList.voteIds[ idx ] + "\n"
            		   + SingapuRateCacheList.usrMinAges[ idx ] + "\n"
            		   + SingapuRateCacheList.idxToDomains[ idx ] + "\n");
            
        }        
        
        return true;
    },
    
};

var SingapuRateWebService = 
{
	send : function(url, method, header, body, async, funcName)
	{
		var xmlresult = "";
		var httprequest = new XMLHttpRequest();
		var parser = new DOMParser();
		var targetnamespace = SingapuRateWSNameSpace;
		var choosedoperationname = funcName;
	
		try 
		{
			httprequest.open(method, url, true);
					
			var headers = header;
			headers = headers.split("\n");
			for (var i = 0; i < headers.length; i++) 
			{
				var eachheader = headers[i].split(": ");
				if (eachheader[1])
					httprequest.setRequestHeader(eachheader[0],eachheader[1]);
			}
					
			var soapaction = ((targetnamespace.lastIndexOf("/") != targetnamespace.length - 1) ? targetnamespace + "/" : targetnamespace) + choosedoperationname;
			httprequest.setRequestHeader("Soapaction",soapaction);
					
			httprequest.send(body);
			var responseHeader = httprequest.getAllResponseHeaders();
					
			xmlresult = httprequest.responseXML;
		}
		catch(e)
		{
		    var stringBundle = document.getElementById("singapurate-string-bundle");
    		var errMsg = stringBundle.getString("SingapuRate.errRequesting");
			alert(errMsg);
		}		
		return xmlresult;
	},	
	
	soaprequest : function(targetnamespace, method, parameters)
	{
		var soaprequest = 
							"<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
							"<soap:Envelope " +
							"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
							"xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
							"xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
							"<soap:Body>" +
							"<" + method + " xmlns=\"" + targetnamespace + "\">" +
							parameters +
							"</" + method + "></soap:Body></soap:Envelope>";
					
		return soaprequest;
	},
	
	startParsingWS : function(soap)
	{
		body = soap.getElementsByTagName("return");
		var retString = "";
		for(var i = 0; i < body.length; i++)
		{
			retString = body[i].childNodes[0].nodeValue;
			break;
		}
		return retString;
	},	

	doSendRequest : function(funcName, param_and_inputs) 
	{
		var targetnamespace = SingapuRateWSNameSpace;
		var choosedoperationname = funcName;
		
		// as Array:  parameternames_and_inputs[name] = value
		var outString = "";
		for(var piKey in param_and_inputs) 
		{
			var tempStr = "<" + piKey + ">" + param_and_inputs[piKey] + "</" + piKey + ">";
			outString = outString + tempStr;
		}
				
		var soaprequestStr = this.soaprequest(targetnamespace, choosedoperationname, outString);
		
		// using SOAP Version 1.1
		var location = SingapuRateWSLocation;
		
		//prepare to send the soap request
		var wsMethod = "POST";
		var wsHeader = "Content-Type: text/xml";
		var wsBody = soaprequestStr;
		var response = "";
		var retString = "";
		var wsAsync = false;
		try
		{
			response = this.send(location, wsMethod, wsHeader, wsBody, wsAsync, funcName);
			retString = this.startParsingWS(response);
		}
		catch(e)
		{
		    var stringBundle = document.getElementById("singapurate-string-bundle");
    		var errMsg = stringBundle.getString("SingapuRate.wsdlError");
			alert(errMsg);
		}
		
		return retString;
		
	},	
};

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
    
    isSingapurateDomain: function(weburl)
    {
	    if(!weburl || weburl.length == 0)
	    	return false;

	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, 1);
		if(sOnlyDomainName 
				&& sOnlyDomainName == "")
		{
			return false;
		}  
		if(sOnlyDomainName 
				&& sOnlyDomainName != ""
				&& sOnlyDomainName.length >= SingapuRateDomainName.length
				&& sOnlyDomainName.toLowerCase().indexOf(SingapuRateDomainName) >= 0 )
		{
			//is our own singapurate urls
			return true;
		}
		
		return false;
    },
	
    isBlackList: function(weburl)
    {
	    if(!weburl || weburl.length == 0)
	    	return false;

		if( this.isSingapurateDomain(weburl) === true )
		{
			//certified singapurate urls always
			return false;
		}
	    	
	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, SingapuRateDomainCheckDepth);	
		if(!sOnlyDomainName
				|| sOnlyDomainName == "")
			return false;
			
		try
		{	
			
		    if( SingapuRateStoredInformation[SingapuRatePrefKeyAuthenticate] === false )
		    {
			    //donot allow access websites
			    return true;
		    }
			else
			{
				var iUrlIdx = -1;
				var today = new Date();
				var l_iTodayY = today.getFullYear();
				var l_iTodayM = (today.getMonth() + 1);
				var l_iTodayD = (today.getDate());
				var iIntegerToday = l_iTodayD + l_iTodayM * 100 + l_iTodayY * 10000;
				
				//user logged in successfully
				//loop through the array
				var l_iCacheListLength = SingapuRateCacheList.prefKey.length;
				var l_iStartPos = SingapuRateCacheList.liTotalNumCaches % SingapuRateMaxNumCaches;
				l_iStartPos += SingapuRateNumCachesMoveBack; //move further slots to list end to ensure previous cache can be better matched
				if( l_iStartPos >= l_iCacheListLength )			
				{
					l_iStartPos = l_iCacheListLength - 1;
				}
				
				for(var pIdx = l_iStartPos; pIdx > ( l_iStartPos + 1 - SingapuRateMaxNumCaches); pIdx--)
				{
					var lipIdx = pIdx;
					if( lipIdx < 0 )
						lipIdx = lipIdx + SingapuRateMaxNumCaches;
					
					var piKey = SingapuRateCacheList.idxToDomains[lipIdx];
					if( piKey != sOnlyDomainName )
						continue;
							
					iUrlIdx 		= lipIdx;
					if(iUrlIdx == -1)
						break;
						
					var prefKeys = SingapuRateCacheList.prefKey[iUrlIdx];	
					var prefKeyItems = prefKeys.split("|||");
					if( prefKeyItems.length <= 0
							|| (prefKeyItems[0] != "*" 
									&& prefKeyItems[0] != SingapuRateStoredInformation[SingapuRatePrefKeyAcctName]) )
					{
						//this cache does not belong to this login acct
						iUrlIdx = -1;
						continue;
					}
					
					var minAge 		= SingapuRateCacheList.minAges[iUrlIdx];
					var entryDate	= SingapuRateCacheList.entryDates[iUrlIdx];
					var voteId		= SingapuRateCacheList.voteIds[iUrlIdx];
						
					if( prefKeyItems[0] == "*"
							|| entryDate >= iIntegerToday)
					{
						//entry still valid
						if(minAge <= SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRatePrefKeyBirthday]))
						{
							//white listed 
							//allow it to continue and notify its status
							return false;
						}
						else
						{
							//not allow to access by age restriction
							return true;
						}
					}
					break;
				}
				
				//if need to check and certified with singapurate
				var param_and_inputs = {"usr" : SingapuRateStoredInformation[SingapuRatePrefKeyAcctName],
										"domain" : sOnlyDomainName };
				var retString = SingapuRateWebService.doSendRequest(SingapuRateWSRateMethod, param_and_inputs);
				//now check whether this login credential has been properly verified or not.
				var resArray = retString.split("|");
				var category = "";
				var ctgryId = -1;
				var minAge = 21;
				var usrAcct = "";
				var voteId = -1;
				var usrMinAge = 21;
				var lsPrefKey = "";
				var liNewIdxNum = -1;
				for(var idx in resArray)
				{
					var tmpStr = resArray[idx];
					var kvPair = tmpStr.split("=");
					if(kvPair.length >= 2)
					{
						if(kvPair[0] == "category")
						{
							category = (kvPair[1]).trim();
						}
						else if(kvPair[0] == "ctgryId")
						{
							ctgryId = (kvPair[1]).trim();
						}
						else if(kvPair[0] == "minAge")
						{
							minAge = (kvPair[1]).trim();
						}
						else if(kvPair[0] == "usr")
						{
							usrAcct = (kvPair[1]).trim();
						}
						else if(kvPair[0] == "voteId")
						{
							voteId = (kvPair[1]).trim();
						}
						else if(kvPair[0] == "usrMinAge")
						{
							usrMinAge = (kvPair[1]).trim();
						}
					}
				}
				
				if(iUrlIdx >= 0)
				{
					//update the cache
					lsPrefKey = SingapuRateStoredInformation[SingapuRatePrefKeyAcctName] + "|||" + iUrlIdx;  //||| as delimitor
					liNewIdxNum = iUrlIdx;
					SingapuRateCacheList.prefKey[iUrlIdx] 		= lsPrefKey;
					SingapuRateCacheList.categories[iUrlIdx] 	= category;
					SingapuRateCacheList.ctgryIds[iUrlIdx] 		= ctgryId;
					SingapuRateCacheList.minAges[iUrlIdx] 		= minAge;
					SingapuRateCacheList.entryDates[iUrlIdx] 	= iIntegerToday;				
					SingapuRateCacheList.voteIds[iUrlIdx] 		= voteId;
					SingapuRateCacheList.usrMinAges[iUrlIdx] 	= usrMinAge;
					
				}
				else
				{
					//add it to cache
					if( SingapuRateCacheList.liTotalNumCaches >= SingapuRateMaxNumCaches )
					{
						//we support up to SingapuRateMaxNumCaches caches of website ratings
						var liNewRoundedIdx = SingapuRateCacheList.liTotalNumCaches % SingapuRateMaxNumCaches;
						//reset the original site
						SingapuRateCacheList.domains[ SingapuRateCacheList.idxToDomains[liNewRoundedIdx] ] 		= -1;
						
						lsPrefKey = SingapuRateStoredInformation[SingapuRatePrefKeyAcctName] + "|||" + liNewRoundedIdx;
						liNewIdxNum = liNewRoundedIdx;
						SingapuRateCacheList.prefKey[liNewRoundedIdx] 		= lsPrefKey; 
						SingapuRateCacheList.domains[sOnlyDomainName] 		= liNewRoundedIdx;
						SingapuRateCacheList.idxToDomains[liNewRoundedIdx]	= sOnlyDomainName;
						SingapuRateCacheList.categories[liNewRoundedIdx] 	= category;
						SingapuRateCacheList.ctgryIds[liNewRoundedIdx] 		= ctgryId;
						SingapuRateCacheList.minAges[liNewRoundedIdx] 		= minAge;
						SingapuRateCacheList.entryDates[liNewRoundedIdx] 	= iIntegerToday;				
						SingapuRateCacheList.voteIds[liNewRoundedIdx] 		= voteId;
						SingapuRateCacheList.usrMinAges[liNewRoundedIdx] 	= usrMinAge;
					}
					else
					{
						//add new cache
						var iSize = SingapuRateCacheList.liTotalNumCaches;   
						lsPrefKey = SingapuRateStoredInformation[SingapuRatePrefKeyAcctName] + "|||" + iSize;
						liNewIdxNum = iSize;
						SingapuRateCacheList.prefKey[iSize] 				= lsPrefKey;
						SingapuRateCacheList.domains[sOnlyDomainName] 		= iSize;
						SingapuRateCacheList.idxToDomains[iSize] 			= sOnlyDomainName;
						SingapuRateCacheList.categories[iSize] 				= category;
						SingapuRateCacheList.ctgryIds[iSize] 				= ctgryId;
						SingapuRateCacheList.minAges[iSize] 				= minAge;
						SingapuRateCacheList.entryDates[iSize] 				= iIntegerToday;				
						SingapuRateCacheList.voteIds[iSize] 				= voteId;
						SingapuRateCacheList.usrMinAges[iSize] 				= usrMinAge;
						
					}
					SingapuRateCacheList.liTotalNumCaches = SingapuRateCacheList.liTotalNumCaches + 1;
				}
				
				if(minAge <= SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRatePrefKeyBirthday]))
				{
					return false;
				}
				else
				{
					return true;
				}
			}
		}
		catch(e)
		{
			//an exception caught, do nothing, just block the domain
		}		
				
        return true;
    },
    
    isDomainInCache: function(weburl)
    {
	    if(!weburl || weburl.length == 0)
	    	return true;
	    
		if( this.isSingapurateDomain(weburl) === true )
		{
			//certified singapurate urls always
			return true;
		}
	    	
	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, SingapuRateDomainCheckDepth);	
		if(!sOnlyDomainName
				|| sOnlyDomainName == "")
			return true;
		
		var iUrlIdx = -1;
			
		try
		{
			//loop through the array
			var l_iCacheListLength = SingapuRateCacheList.prefKey.length;
			var l_iStartPos = SingapuRateCacheList.liTotalNumCaches % SingapuRateMaxNumCaches;
			l_iStartPos += SingapuRateNumCachesMoveBack; //move further slots to list end to ensure previous cache can be better matched
			if( l_iStartPos >= l_iCacheListLength )			
			{
				l_iStartPos = l_iCacheListLength - 1;
			}
				
			for(var pIdx = l_iStartPos; pIdx > ( l_iStartPos + 1 - SingapuRateMaxNumCaches); pIdx--)
			{
				var lipIdx = pIdx;
				if( lipIdx < 0 )
					lipIdx = lipIdx + SingapuRateMaxNumCaches;
					
				var piKey = SingapuRateCacheList.idxToDomains[lipIdx];
				if( piKey != sOnlyDomainName )
					continue;
							
				iUrlIdx 		= lipIdx;
				break;
			}
		}
		catch(e)
		{
			//caught an exception, do nothing
		}		
		if(iUrlIdx >= 0)
			return true;
			
		//default not in cache
		return false;
    },

    
    isBlockedInCache: function(weburl)
    {
	    if(!weburl || weburl.length == 0)
	    	return false;

		if( this.isSingapurateDomain(weburl) === true )
		{
			//certified singapurate urls always
			return false;
		}
	    	
	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, SingapuRateDomainCheckDepth);	
		if(!sOnlyDomainName
				|| sOnlyDomainName == "")
			return false;
		
		try
		{	
			
		    if( SingapuRateStoredInformation[SingapuRatePrefKeyAuthenticate] === false )
		    {
			    //donot allow access websites
			    return true;
		    }
			else
			{
				var iUrlIdx = -1;
				var fiveDaysAgo = new Date();   
				fiveDaysAgo.setDate( fiveDaysAgo.getDate() - 5 );
				var l_iFiveDaysAgoY = fiveDaysAgo.getFullYear();
				var l_iFiveDaysAgoM = (fiveDaysAgo.getMonth() + 1);
				var l_iFiveDaysAgoD = (fiveDaysAgo.getDate());
				var iIntegerFiveDaysAgo = l_iFiveDaysAgoD + l_iFiveDaysAgoM * 100 + l_iFiveDaysAgoY * 10000;
				
				//user logged in successfully
				//loop through the array
				var l_iCacheListLength = SingapuRateCacheList.prefKey.length;
				var l_iStartPos = SingapuRateCacheList.liTotalNumCaches % SingapuRateMaxNumCaches;
				l_iStartPos += SingapuRateNumCachesMoveBack; //move further slots to list end to ensure previous cache can be better matched
				if( l_iStartPos >= l_iCacheListLength )			
				{
					l_iStartPos = l_iCacheListLength - 1;
				}
				
				for(var pIdx = l_iStartPos; pIdx > ( l_iStartPos + 1 - SingapuRateMaxNumCaches); pIdx--)
				{
					var lipIdx = pIdx;
					if( lipIdx < 0 )
						lipIdx = lipIdx + SingapuRateMaxNumCaches;
					
					var piKey = SingapuRateCacheList.idxToDomains[lipIdx];
					if( piKey != sOnlyDomainName )
						continue;
							
					iUrlIdx 		= lipIdx;
					if(iUrlIdx == -1)
						break;
						
					var minAge 		= SingapuRateCacheList.minAges[iUrlIdx];
					var entryDate	= SingapuRateCacheList.entryDates[iUrlIdx];
					
					if( iIntegerFiveDaysAgo > entryDate )
					{
						//expired, allow to access;
						return false;
					}	
					
					//entry still valid
					if(minAge <= SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRatePrefKeyBirthday]))
					{
						//white listed 
						//allow it to continue and notify its status
						return false;
					}
					else
					{
						//not allow to access by age restriction
						return true;
					}
					break;
				}
			}
		}
		catch(e)
		{
			//caught an exception, do nothing
		}		
		//default is to allow is not in cache
        return false;
    },    
	
    checkLocation: function(location)
    {
        if(this.isBlackList(location))
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
	    try
	    {
	        const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateExtensionName + ".");
			
	        if(event.type === "DOMContentLoaded" || event.type == "change")
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
					if(sUrlAddress.indexOf(SingapuRateLocalBlockedHtml) == 0)
					{
						var doc = event.target;
						var win = doc.defaultView;
						//now update the variables in the blocked html
						var resArray = sUrlAddress.split("?");
						if(resArray.length != 2)
						{
							//something wrong, use default block
							win.location.replace(SingapuRateLocalBlockedDefaultHtml);
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
							if(paramKeyValue[0] == SingapuRateParamNameUrl)
							{
								urlPath = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateParamNameCategoryName)
							{
								category = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateParamNameCategoryId)
							{
								ctgryId = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateParamNameVoteId)
							{
								voteId = paramKeyValue[1];
							}
							else if(paramKeyValue[0] == SingapuRateParamNameMinAge)
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
							sVoteOpinionUrl = "http://" + SingapuRateDomainName + "/viewdetails.php?p=" + voteId + "#p" + voteId;
			    			sVoteOrViewSite = stringBundle1.getString("SingapuRate.checkYourVoteText");
						}
						else
						{
							sVoteOpinionUrl = "http://" + SingapuRateDomainName + "/posting.php?" + SingapuRateParamNameUrl + "=" + urlPath;
							if(ctgryId > 0)
								sVoteOpinionUrl = sVoteOpinionUrl + "&" + SingapuRateParamNameCategoryId + "=" + ctgryId;
				    		sVoteOrViewSite = stringBundle1.getString("SingapuRate.voteYourOpinionText");
						}
						doc.getElementById("srVoteOpinionLink").setAttribute("href", sVoteOpinionUrl);
						doc.getElementById("srVoteOrViewSite").textContent = sVoteOrViewSite;
						doc.getElementById("srWebsiteRatingDescr").textContent = sWebsiteRatingDescr;
						
					}
					//this is a local url internal to firefox.
					else if(sUrlAddress.indexOf(SingapuRateLocalSuspendedHtml) == 0)
					{
						var doc = event.target;
						var win = doc.defaultView;
						//now update the variables in the blocked html
						var resArray = sUrlAddress.split( SingapuRateParamNameUrl + "=");
						if(resArray.length != 2)
						{
							//something wrong, use default block
							win.location.replace(SingapuRateLocalBlockedDefaultHtml);
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
				
				if( XULSingapuRateChrome.isSingapurateDomain(sUrlAddress) === true )
				{
					//certified singapurate urls always
					return;
				}
				            
		    	var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(sUrlAddress, SingapuRateDomainCheckDepth);
	            if(sOnlyDomainName == "")
	            	return;
	            	
				var usrCurrentAge = SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRatePrefKeyBirthday]);
				//loop through the cache array
				var iUrlIdx = -1;
				//loop through the array
				var l_iCacheListLength = SingapuRateCacheList.prefKey.length;
				var l_iStartPos = SingapuRateCacheList.liTotalNumCaches % SingapuRateMaxNumCaches;
				l_iStartPos += SingapuRateNumCachesMoveBack; //move further slots to list end to ensure previous cache can be better matched
				if( l_iStartPos >= l_iCacheListLength )			
				{
					l_iStartPos = l_iCacheListLength - 1;
				}
				
				for(var pIdx = l_iStartPos; pIdx > ( l_iStartPos + 1 - SingapuRateMaxNumCaches); pIdx--)
				{
					var lipIdx = pIdx;
					if( lipIdx < 0 )
						lipIdx = lipIdx + SingapuRateMaxNumCaches;
					
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
						var l_iStartPos2 = SingapuRateCacheList.liTotalNumCaches % SingapuRateMaxNumCaches;
						l_iStartPos2 += SingapuRateNumCachesMoveBack; //move further slots to list end to ensure previous cache can be better matched
						if( l_iStartPos2 >= l_iCacheListLength2 )			
						{
							l_iStartPos2 = l_iCacheListLength2 - 1;
						}
						
						for(var pIdx2 = l_iStartPos2; pIdx2 > ( l_iStartPos2 + 1 - SingapuRateMaxNumCaches); pIdx2--)
						{
							var lipIdx2 = pIdx2;
							if( lipIdx2 < 0 )
								lipIdx2 = lipIdx2 + SingapuRateMaxNumCaches;
							
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
					var sNotificationBoxName = SingapuRateExtensionName + '_SR_Website_Rating';
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
									var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
							      					.getService(Components.interfaces.nsIWindowMediator)
							      					.getMostRecentWindow('navigator:browser');
							      	win.gBrowser.selectedTab = win.gBrowser.addTab("http://" + SingapuRateDomainName + "/posting.php?wrs_url=" + sOnlyDomainName + "&wrs_rc=" + ctgryId);
							    }
						    },
						    
							{
						        label: whyYourOpinionMattersText,
						        accessKey: 'w',
						        callback: function(aEvent) 
						        { 
									//redirect to singapurate.com for registration
									var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
							      					.getService(Components.interfaces.nsIWindowMediator)
							      					.getMostRecentWindow('navigator:browser');
							      	win.gBrowser.selectedTab = win.gBrowser.addTab("http://" + SingapuRateDomainName + "/viewtopic.php?f=12&t=1280");
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
						var blockURL = SingapuRateLocalBlockedHtml + "?" + SingapuRateParamNameUrl + "=" + sOnlyDomainName 
											+ "&" + SingapuRateParamNameCategoryName + "=" + category 
											+ "&" + SingapuRateParamNameCategoryId + "=" + ctgryId
											+ "&" + SingapuRateParamNameVoteId + "=" + voteId
											+ "&" + SingapuRateParamNameMinAge + "=" + minAge;
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
					var blockURL = SingapuRateLocalSuspendedHtml + "?" + SingapuRateParamNameUrl + "=" + sUrlAddress ;
					win.location.replace(blockURL);
					return;
				}
				
	        }
        }
        catch(e)
        {
	        //caught an exception
        }
        //if reach this end, something wrong
		var doc = event.target;
		var win = doc.defaultView;
		var blockURL = SingapuRateLocalSuspendedHtml + "?" + SingapuRateParamNameUrl + "=" + sUrlAddress ;
		win.location.replace(blockURL);
		return;
    }
    
};

var SingapuRateBrowserOverlay = 
{
	/**
	*/
	loadSingapuRateLoginDialog : function(aEvent) 
	{
		var retResults = SingapuRatePrefs.readPrefs();
		if(retResults[SingapuRatePrefKeyAuthenticate] === true)
		{
			var acctAge = SingapuRateUtilities.getUserAge(retResults[SingapuRatePrefKeyBirthday]);
			
		    var stringBundle = document.getElementById("singapurate-string-bundle");
		    var sLoginMsg = stringBundle.getFormattedString("SingapuRate.loginSuccess", [retResults[SingapuRatePrefKeyAcctName], acctAge]);
			alert(sLoginMsg);
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
		if(retResults[SingapuRatePrefKeyAuthenticate] === false)
		{
		    var stringBundle = document.getElementById("singapurate-string-bundle");
		    var sLogoutMsg = stringBundle.getString("SingapuRate.alreadyLogout");
			alert(sLogoutMsg);
			return;
		}
		
		//pass the username to dialog box		
   		var retVals = {username : retResults[SingapuRatePrefKeyAcctName], password : null};
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
		var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
      					.getService(Components.interfaces.nsIWindowMediator)
      					.getMostRecentWindow('navigator:browser');
      	win.gBrowser.selectedTab = win.gBrowser.addTab("http://" + SingapuRateDomainName + "/ucp.php?mode=register");
      	
      	window.close();
      		
		return true;
	},
			
	onLogin	: function(aEvent)
	{
		var username = document.getElementById("c_username").value;
		var password = document.getElementById("c_password").value;
		
		var param_and_inputs = {"usr" : username,
								"password" : password };
								
		var retString = SingapuRateWebService.doSendRequest(SingapuRateWSLoginMethod, param_and_inputs);
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
					if(kvPair[1].trim() == SingapuRateWSLoginSuccess)
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
			var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
	      					.getService(Components.interfaces.nsIWindowMediator)
	      					.getMostRecentWindow('navigator:browser');
			
		    var stringBundle1 = win.document.getElementById("singapurate-string-bundle");
		    var sLoginMsg = stringBundle1.getFormattedString("SingapuRate.loginFailure", [username, loginErrMsg]);
			alert(sLoginMsg);
			//we store it login failure as well
			SingapuRatePrefs.storePrefs(loginSuccess, username, acctBirthday);
			return false;
		}

		//login succeed
		var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
      					.getService(Components.interfaces.nsIWindowMediator)
      					.getMostRecentWindow('navigator:browser');
	    var stringBundle2 = win.document.getElementById("singapurate-string-bundle");
	    var sLoginFirstTime = stringBundle2.getFormattedString("SingapuRate.loginFirstTime", [username, acctAge]);
		alert(sLoginFirstTime);
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
								
		var retString = SingapuRateWebService.doSendRequest(SingapuRateWSLoginMethod, param_and_inputs);
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
					if(kvPair[1].trim() == SingapuRateWSLoginSuccess)
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

			var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
	      					.getService(Components.interfaces.nsIWindowMediator)
	      					.getMostRecentWindow('navigator:browser');
						
		    var stringBundle1 = win.document.getElementById("singapurate-string-bundle");
		    var sLogoutFailure = stringBundle1.getFormattedString("SingapuRate.logoutFailure", [username, loginErrMsg]);
			alert(sLogoutFailure);
			return false;
		}

		//login succeed, proceed to logout
		var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
      					.getService(Components.interfaces.nsIWindowMediator)
      					.getMostRecentWindow('navigator:browser');
	    var stringBundle2 = win.document.getElementById("singapurate-string-bundle");
	    var sLogoutSuccess = stringBundle2.getFormattedString("SingapuRate.logoutSuccess", [username]);
		alert(sLogoutSuccess);
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
		    	var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(sUrlAddress, SingapuRateDomainCheckDepth);
		    	var sSubjectUriSpec = SingapuRateUtilities.getOnlyDomainName(aSubject.URI.spec, SingapuRateDomainCheckDepth); 
		    	
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
window.document.getElementById("appcontent").addEventListener("DOMContentLoaded", XULSingapuRateChrome.SingapuRateMain, false);

// load the stored preferences
var SingapuRateStoredInformation = SingapuRatePrefs.readPrefs();

