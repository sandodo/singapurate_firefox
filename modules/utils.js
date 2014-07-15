var EXPORTED_SYMBOLS = [ 'SingapuRateWebService', 'SingapuRatePrefs', 'SingapuRateUtilities', 'SingapuRateStoredInformation', 'SingapuRateCacheList', 'SingapuRateWebsiteRatings' ];

const Cc = Components.classes;
const Ci = Components.interfaces;

var SingapuRateStoredInformation = [];
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
	// SingapuRate Modules 
	SingapuRateDomainName: "singapurate.com",
	SingapuRateWSNameSpace: "http://www.singapurate.com/soap/SingapuRateService",
	SingapuRateWSLocation: "http://www.singapurate.com/check/soapService.php",
	SingapuRateWSLoginMethod: "SingapuraLogin",
	SingapuRateWSRateMethod: "SingapuraRating",
	SingapuRateWSLoginSuccess: "3",
	SingapuRateExtensionName: "XULSingapuRateChrome",
	SingapuRatePrefKeyAcctName: "acctName",
	SingapuRatePrefKeyBirthday: "birthday",
	SingapuRatePrefKeyAuthenticate: "authenticate",
	SingapuRatePrefKeyNumCaches: "numCaches",
	SingapuRateMaxNumCaches: 200,
	SingapuRateNumCachesMoveBack: 10,
	SingapuRateDomainCheckDepth: 2,
	SingapuRateLocalBlockedHtml: "chrome://singapurate/locale/blocked.html",
	SingapuRateLocalBlockedDefaultHtml: "chrome://singapurate/locale/default.html",
	SingapuRateLocalSuspendedHtml: "chrome://singapurate/locale/suspended.html",

	SingapuRateParamNameUrl: "wrs_url",
	SingapuRateParamNameCategoryName: "wrs_cn",
	SingapuRateParamNameCategoryId: "wrs_rc",
	SingapuRateParamNameVoteId: "wrs_vi",
	SingapuRateParamNameMinAge: "wrs_minAge",
	
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
				&& sOnlyDomainName.length >= SingapuRateUtilities.SingapuRateDomainName.length
				&& sOnlyDomainName.toLowerCase().indexOf(SingapuRateUtilities.SingapuRateDomainName) >= 0 )
		{
			//is our own singapurate urls
			return true;
		}
		
		return false;
    },
	
	
};

var SingapuRatePrefs = 
{
    storePrefs: function(bLogin, sAcctName, sBirthday)
    {
        SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] = bLogin;
        SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] = sAcctName;
        SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday] = sBirthday;
	    
        try
        {
	        var SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");
	
	        // Store acct name
	        SingapuRatePrefBranch.setCharPref(SingapuRateUtilities.SingapuRatePrefKeyAcctName, sAcctName);
	        // Store acct birthday
	        SingapuRatePrefBranch.setCharPref(SingapuRateUtilities.SingapuRatePrefKeyBirthday, sBirthday);
	        // Store authenticate
	        var sCombinedAuthenticate = sAcctName.trim() + sBirthday.trim() + bLogin;
	        SingapuRatePrefBranch.setCharPref(SingapuRateUtilities.SingapuRatePrefKeyAuthenticate, SingapuRateUtilities.hex_sha256(sCombinedAuthenticate + 'nh4da68h4jf6s4kj8g6d4df8b4d5'));
        }
        catch(e)
        {
        }        
        return true;
    },
	
    readPrefs: function()
    {
	    var strKeyAuthenticate = SingapuRateUtilities.SingapuRatePrefKeyAuthenticate;
	    var strKeyAcctName = SingapuRateUtilities.SingapuRatePrefKeyAcctName;
	    var strKeyBirthday = SingapuRateUtilities.SingapuRatePrefKeyBirthday;
	    
		var retResults = { strKeyAuthenticate: false, strKeyAcctName: "", strKeyBirthday: "" };
			    
        try
        {
        	const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");
            
            // Read acct name
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRateUtilities.SingapuRatePrefKeyAcctName))
            {
                retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName] = SingapuRatePrefBranch.getCharPref(SingapuRateUtilities.SingapuRatePrefKeyAcctName).trim();
            }

            // Read birthday
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRateUtilities.SingapuRatePrefKeyBirthday))
            {
                retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday] = SingapuRatePrefBranch.getCharPref(SingapuRateUtilities.SingapuRatePrefKeyBirthday).trim();
            }
            
            // Read authenticate
            if(retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName] && retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName] !== ""
            		&& retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday] && retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday] !== ""
            		&& SingapuRatePrefBranch.prefHasUserValue(SingapuRateUtilities.SingapuRatePrefKeyAuthenticate))
            {
                var sAuthenticate = SingapuRatePrefBranch.getCharPref(SingapuRateUtilities.SingapuRatePrefKeyAuthenticate);
                //check whether it is not logged in?
                var bLoggedIn = false;
                var sCombinedAuthenticate = retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName] + retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday] + bLoggedIn;
                if(sAuthenticate == SingapuRateUtilities.hex_sha256(sCombinedAuthenticate + 'nh4da68h4jf6s4kj8g6d4df8b4d5'))
                {
	                retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] = false;
                }
                else	//check for login?
                {
	                bLoggedIn = true;
	                sCombinedAuthenticate = retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName] + retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday] + bLoggedIn;
	                if(sAuthenticate == SingapuRateUtilities.hex_sha256(sCombinedAuthenticate + 'nh4da68h4jf6s4kj8g6d4df8b4d5'))
	                {
		                retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] = true;
	                }
                }
            }
        }
        catch(e)
        {
        }
        
        SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] = retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate];
        SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] = retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName];
        SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday] = retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday];
        
        return retResults;
    },

    readNumDomainCaches: function()
    {
	    var iTotalNumCaches = 0;
	    
        try
        {
        	const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");
            
            // Read number of caches
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRateUtilities.SingapuRatePrefKeyNumCaches))
            {
                iTotalNumCaches = SingapuRatePrefBranch.getIntPref(SingapuRateUtilities.SingapuRatePrefKeyNumCaches);
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
        	const SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");
            
            // store number of caches
            SingapuRatePrefBranch.setIntPref(SingapuRateUtilities.SingapuRatePrefKeyNumCaches, iTotalNumCaches);
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
	        var SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");

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
	        var SingapuRatePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions." + SingapuRateUtilities.SingapuRateExtensionName + ".");

	        var iTotalNumCaches = 0;

            // Read number of caches
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRateUtilities.SingapuRatePrefKeyNumCaches))
            {
                iTotalNumCaches = SingapuRatePrefBranch.getIntPref(SingapuRateUtilities.SingapuRatePrefKeyNumCaches);
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
	            if(i >= SingapuRateUtilities.SingapuRateMaxNumCaches)
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
	    
	    var sAcctName = SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName];
        
		//for(var pKey in SingapuRateCacheList.domains)
		for(var pIdx in SingapuRateCacheList.prefKey)
		{
            //var idx = SingapuRateCacheList.domains[pKey];
            var idx = pIdx;
            
            SingapuRateMainWindow.alert(SingapuRateCacheList.idxToDomains[ idx ] + "\n" 
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
		var targetnamespace = SingapuRateUtilities.SingapuRateWSNameSpace;
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
		    var stringBundle = SingapuRateMainWindow.document.getElementById("singapurate-string-bundle");
    		var errMsg = stringBundle.getString("SingapuRate.errRequesting");
			SingapuRateMainWindow.alert(errMsg);
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
		var targetnamespace = SingapuRateUtilities.SingapuRateWSNameSpace;
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
		var location = SingapuRateUtilities.SingapuRateWSLocation;
		
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
		    var stringBundle = SingapuRateMainWindow.document.getElementById("singapurate-string-bundle");
    		var errMsg = stringBundle.getString("SingapuRate.wsdlError");
			SingapuRateMainWindow.alert(errMsg);
		}
		
		return retString;
		
	},	
};


var SingapuRateWebsiteRatings = 
{
    isBlackList: function(weburl)
    {
	    if(!weburl || weburl.length == 0)
	    	return false;

		if( this.isSingapurateDomain(weburl) === true )
		{
			//certified singapurate urls always
			return false;
		}
	    	
	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, SingapuRateUtilities.SingapuRateDomainCheckDepth);	
		if(!sOnlyDomainName
				|| sOnlyDomainName == "")
			return false;
			
		try
		{	
			
		    if( SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === false )
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
					if(iUrlIdx == -1)
						break;
						
					var prefKeys = SingapuRateCacheList.prefKey[iUrlIdx];	
					var prefKeyItems = prefKeys.split("|||");
					if( prefKeyItems.length <= 0
							|| (prefKeyItems[0] != "*" 
									&& prefKeyItems[0] != SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName]) )
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
						if(minAge <= SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]))
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
				var param_and_inputs = {"usr" : SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName],
										"domain" : sOnlyDomainName };
				var retString = SingapuRateWebService.doSendRequest(SingapuRateUtilities.SingapuRateWSRateMethod, param_and_inputs);
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
					lsPrefKey = SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] + "|||" + iUrlIdx;  //||| as delimitor
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
					if( SingapuRateCacheList.liTotalNumCaches >= SingapuRateUtilities.SingapuRateMaxNumCaches )
					{
						//we support up to SingapuRateUtilities.SingapuRateMaxNumCaches caches of website ratings
						var liNewRoundedIdx = SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
						//reset the original site
						SingapuRateCacheList.domains[ SingapuRateCacheList.idxToDomains[liNewRoundedIdx] ] 		= -1;
						
						lsPrefKey = SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] + "|||" + liNewRoundedIdx;
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
						lsPrefKey = SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] + "|||" + iSize;
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
				
				if(minAge <= SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]))
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
	    	
	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, SingapuRateUtilities.SingapuRateDomainCheckDepth);	
		if(!sOnlyDomainName
				|| sOnlyDomainName == "")
			return true;
		
		var iUrlIdx = -1;
			
		try
		{
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
	    	
	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, SingapuRateUtilities.SingapuRateDomainCheckDepth);	
		if(!sOnlyDomainName
				|| sOnlyDomainName == "")
			return false;
		
		try
		{	
			
		    if( SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === false )
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
					if(minAge <= SingapuRateUtilities.getUserAge(SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]))
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
};




