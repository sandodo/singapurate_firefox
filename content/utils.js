var EXPORTED_SYMBOLS = [ 'SingapuRateWebService', 'SingapuRatePrefs', 'SingapuRateUtilities', 'SingapuRateWebsiteRatings' ];

var SingapuRateMainWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");

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
	SingapuRatePrefKeyAthentCode: "authCode",
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
	SingapuRateParamNameSiteBlocked: "wrs_sb",
	
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
	
    alertSimpleWndMsg: function(sMessage)
    {
    	var stringBundle = SingapuRateMainWindow.document.getElementById("singapurate-string-bundle");
	    var sAlertMsg = stringBundle.getString(sMessage);
		SingapuRateMainWindow.alert(sAlertMsg);
		return true;
    },

    alertFormatedWndMsg: function(sMessage, sVariables)
    {
    	var stringBundle = SingapuRateMainWindow.document.getElementById("singapurate-string-bundle");
	    var sAlertMsg = stringBundle.getFormattedString(sMessage, sVariables);
		SingapuRateMainWindow.alert(sAlertMsg);
		return true;
    },
    	
};

var SingapuRatePrefs = 
{
	SingapuRateStoredInformation: { "empty": false },
	
	SingapuRateCacheList: {
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
	},
	
    isDomainInCache: function(weburl)
    {
	    if(!weburl || weburl.length == 0)
	    	return true;
	    
		if( SingapuRateUtilities.isSingapurateDomain(weburl) === true )
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
			var l_iCacheListLength = SingapuRatePrefs.SingapuRateCacheList.prefKey.length;
			var l_iStartPos = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
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
					
				var piKey = SingapuRatePrefs.SingapuRateCacheList.idxToDomains[lipIdx];
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
	
    storePrefs: function(bLogin, sAcctName, sBirthday, sPassword)
    {
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] = bLogin;
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] = sAcctName;
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday] = sBirthday;
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAthentCode] = sPassword;
	    
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
	        // Store acct authentication code
	        SingapuRatePrefBranch.setCharPref(SingapuRateUtilities.SingapuRatePrefKeyAthentCode, sPassword);
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
	    var strKeyAuthentCode = SingapuRateUtilities.SingapuRatePrefKeyAthentCode;
	    
		var retResults = { strKeyAuthenticate: false, strKeyAcctName: "", strKeyBirthday: "", strKeyAuthentCode: "" };
			    
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

            // Read authneticate code
            if(SingapuRatePrefBranch.prefHasUserValue(SingapuRateUtilities.SingapuRatePrefKeyAthentCode))
            {
                retResults[SingapuRateUtilities.SingapuRatePrefKeyAthentCode] = SingapuRatePrefBranch.getCharPref(SingapuRateUtilities.SingapuRatePrefKeyAthentCode).trim();
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
        
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] = retResults[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate];
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] = retResults[SingapuRateUtilities.SingapuRatePrefKeyAcctName];
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday] = retResults[SingapuRateUtilities.SingapuRatePrefKeyBirthday];
        SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAthentCode] = retResults[SingapuRateUtilities.SingapuRatePrefKeyAthentCode];
        
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
       	    	SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches = 0;
	            return true;
            }
   	    	SingapuRatePrefs.SingapuRateCacheList.iTotalNumCaches = iTotalNumCaches;
            //now start to restore the caches
            for(var i = 0; i < SingapuRatePrefs.SingapuRateCacheList.iTotalNumCaches; i++)
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
	                
	                //now all set, set back to 	SingapuRatePrefs.SingapuRateCacheList	
					SingapuRatePrefs.SingapuRateCacheList.prefKey[ i ] 				= sPrefKey;
					SingapuRatePrefs.SingapuRateCacheList.domains[ sDomainName ] 	= i;
					SingapuRatePrefs.SingapuRateCacheList.idxToDomains[ i ] 			= sDomainName;
					SingapuRatePrefs.SingapuRateCacheList.categories[ i ] 			= sCategory;
					SingapuRatePrefs.SingapuRateCacheList.ctgryIds[ i ] 				= iCtgryId;
					SingapuRatePrefs.SingapuRateCacheList.minAges[ i ] 				= iMinAge;
					SingapuRatePrefs.SingapuRateCacheList.entryDates[ i ] 			= iIntegerToday;				
					SingapuRatePrefs.SingapuRateCacheList.voteIds[ i ] 				= iVoteId;
					SingapuRatePrefs.SingapuRateCacheList.usrMinAges[ i ] 			= iUsrMinAge;
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
	    
	    var sAcctName = SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName];
        
		for(var pIdx in SingapuRatePrefs.SingapuRateCacheList.prefKey)
		{
            var idx = pIdx;
            
            SingapuRateMainWindow.alert(SingapuRatePrefs.SingapuRateCacheList.idxToDomains[ idx ] + "\n" 
            		   + idx + "\n" 
            		   + SingapuRatePrefs.SingapuRateCacheList.prefKey[ idx ] + "\n"
            		   + SingapuRatePrefs.SingapuRateCacheList.categories[ idx ] + "\n"
            		   + SingapuRatePrefs.SingapuRateCacheList.entryDates[ idx ] + "\n"
            		   + SingapuRatePrefs.SingapuRateCacheList.ctgryIds[ idx ] + "\n"
            		   + SingapuRatePrefs.SingapuRateCacheList.minAges[ idx ] + "\n"
            		   + SingapuRatePrefs.SingapuRateCacheList.voteIds[ idx ] + "\n"
            		   + SingapuRatePrefs.SingapuRateCacheList.usrMinAges[ idx ] + "\n"
            		   + SingapuRatePrefs.SingapuRateCacheList.idxToDomains[ idx ] + "\n");
            
        }        
        
        return true;
    },
    
};

var SingapuRateWebService = 
{
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
	
	sendReq : function(aWin, url, method, header, body, funcName)
	{
		var xmlresult = "";
		
		var httprequest = new SingapuRateMainWindow.XMLHttpRequest();
		var parser = new SingapuRateMainWindow.DOMParser();
		
		var targetnamespace = SingapuRateUtilities.SingapuRateWSNameSpace;
		var choosedoperationname = funcName;

		var getresponse = function () {
			
			//callback gets response
			if (httprequest.readyState == 4) 
			{
				try 
				{
					var response = "";
					if (httprequest.responseXML != null)
					{
							response = httprequest.responseXML;
					}
					else
					{
						response = parser.parseFromString(httprequest.responseText,'text/xml');
					}
					
					var retString = SingapuRateWebService.startParsingWS(response);
					
					//now check whether this login credential has been properly verified or not.
					var resArray = retString.split("|");
					var domainUrl = "";
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
							else if(kvPair[0] == "domain")
							{
								domainUrl = (kvPair[1]).trim();
							}
						}
					}
					
					var today = new Date();
					var l_iTodayY = today.getFullYear();
					var l_iTodayM = (today.getMonth() + 1);
					var l_iTodayD = (today.getDate());
					var iIntegerToday = l_iTodayD + l_iTodayM * 100 + l_iTodayY * 10000;					
					
					//we can actually pass checking domain here
					if(domainUrl != "")
					{
						if( SingapuRatePrefs.isDomainInCache(domainUrl) === false )
						{
							//add it to cache
							if( SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches >= SingapuRateUtilities.SingapuRateMaxNumCaches )
							{
								//we support up to SingapuRateUtilities.SingapuRateMaxNumCaches caches of website ratings
								var liNewRoundedIdx = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
								//reset the original site
								SingapuRatePrefs.SingapuRateCacheList.domains[ SingapuRatePrefs.SingapuRateCacheList.idxToDomains[liNewRoundedIdx] ] 		= -1;
									
								lsPrefKey = SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] + "|||" + liNewRoundedIdx;
								liNewIdxNum = liNewRoundedIdx;
								SingapuRatePrefs.SingapuRateCacheList.prefKey[liNewRoundedIdx] 		= lsPrefKey; 
								SingapuRatePrefs.SingapuRateCacheList.domains[domainUrl] 		= liNewRoundedIdx;
								SingapuRatePrefs.SingapuRateCacheList.idxToDomains[liNewRoundedIdx]	= domainUrl;
								SingapuRatePrefs.SingapuRateCacheList.categories[liNewRoundedIdx] 	= category;
								SingapuRatePrefs.SingapuRateCacheList.ctgryIds[liNewRoundedIdx] 		= ctgryId;
								SingapuRatePrefs.SingapuRateCacheList.minAges[liNewRoundedIdx] 		= minAge;
								SingapuRatePrefs.SingapuRateCacheList.entryDates[liNewRoundedIdx] 	= iIntegerToday;				
								SingapuRatePrefs.SingapuRateCacheList.voteIds[liNewRoundedIdx] 		= voteId;
								SingapuRatePrefs.SingapuRateCacheList.usrMinAges[liNewRoundedIdx] 	= usrMinAge;
							}
							else
							{
								//add new cache
								var iSize = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches;
								lsPrefKey = SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName] + "|||" + iSize;
								liNewIdxNum = iSize;
								SingapuRatePrefs.SingapuRateCacheList.prefKey[iSize] 				= lsPrefKey;
								SingapuRatePrefs.SingapuRateCacheList.domains[domainUrl] 		= iSize;
								SingapuRatePrefs.SingapuRateCacheList.idxToDomains[iSize] 			= domainUrl;
								SingapuRatePrefs.SingapuRateCacheList.categories[iSize] 				= category;
								SingapuRatePrefs.SingapuRateCacheList.ctgryIds[iSize] 				= ctgryId;
								SingapuRatePrefs.SingapuRateCacheList.minAges[iSize] 				= minAge;
								SingapuRatePrefs.SingapuRateCacheList.entryDates[iSize] 				= iIntegerToday;				
								SingapuRatePrefs.SingapuRateCacheList.voteIds[iSize] 				= voteId;
								SingapuRatePrefs.SingapuRateCacheList.usrMinAges[iSize] 				= usrMinAge;
									
							}
							SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches + 1;
						}
													
						if(minAge > SingapuRateUtilities.getUserAge(SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]))
						{
			        		//block the site
							var blockURL = SingapuRateUtilities.SingapuRateLocalBlockedHtml + "?" + SingapuRateUtilities.SingapuRateParamNameUrl + "=" + domainUrl 
											+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryName + "=" + category 
											+ "&" + SingapuRateUtilities.SingapuRateParamNameCategoryId + "=" + ctgryId
											+ "&" + SingapuRateUtilities.SingapuRateParamNameVoteId + "=" + voteId
											+ "&" + SingapuRateUtilities.SingapuRateParamNameMinAge + "=" + minAge;
							aWin.location.replace(blockURL);
							return;
					  	}
					  	else
					  	{
						  	//allow the site with a notification
							var sLabelText = SingapuRateMainWindow.document.getElementById("singapurate-string-bundle").getFormattedString("SingapuRate.notificationText", [domainUrl, category]);
											
				            //display the rating inforamtion and promote the user to rate it.
							var nb = SingapuRateMainWindow.gBrowser.getNotificationBox();
							var sNotificationBoxName = SingapuRateUtilities.SingapuRateExtensionName + '_SR_Website_Rating';
							var n = nb.getNotificationWithValue(sNotificationBoxName);
							if(n) 
							{
							    n.label = sLabelText;
							}
							else 
							{
								var voteYourOpinionText = SingapuRateMainWindow.document.getElementById("singapurate-string-bundle").getString("SingapuRate.voteYourOpinionText");
								var whyYourOpinionMattersText = SingapuRateMainWindow.document.getElementById("singapurate-string-bundle").getString("SingapuRate.whyYourVoteMattersText");
											
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
									      	SingapuRateMainWindow.gBrowser.selectedTab = SingapuRateMainWindow.gBrowser.addTab("http://" + SingapuRateUtilities.SingapuRateDomainName + "/posting.php?wrs_url=" + domainUrl + "&wrs_rc=" + ctgryId);
									    }
								    },
											    
									{
								        label: whyYourOpinionMattersText,
								        accessKey: 'w',
								        callback: function(aEvent) 
								        { 
											//redirect to singapurate.com for registration
									      	SingapuRateMainWindow.gBrowser.selectedTab = SingapuRateMainWindow.gBrowser.addTab("http://" + SingapuRateUtilities.SingapuRateDomainName + "/viewtopic.php?f=12&t=1280");
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
						  	
						return;
					}
					else
					{
						//something wrong with the domain, shall not happen
					}
					
				}
				catch(e) 
				{
					//error in getting response, shall never happen, block the site
					aWin.location.replace(SingapuRateUtilities.SingapuRateLocalBlockedDefaultHtml);				
				}
			}
		}
		
		var gettimeout = function () 
		{
			//something wrong with the webservice, block current tab
			aWin.location.replace(SingapuRateUtilities.SingapuRateLocalBlockedDefaultHtml);				
		}		
						
		httprequest.onreadystatechange = getresponse;
		httprequest.ontimeout = gettimeout;
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
		}
		catch(e)
		{
			SingapuRateUtilities.alertSimpleWndMsg("SingapuRate.errRequesting");
		}		
		
		return xmlresult;
	},	
	
	soaprequest : function(targetnamespace, method, parameters)
	{
		var soaprequestStr = 
							"<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
							"<soap:Envelope " +
							"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
							"xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
							"xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
							"<soap:Body>" +
							"<" + method + " xmlns=\"" + targetnamespace + "\">" +
							parameters +
							"</" + method + "></soap:Body></soap:Envelope>";
					
		return soaprequestStr;
	},

	doSendRequest : function(aWin, funcName, param_and_inputs) 
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
				
		var soaprequestStr = SingapuRateWebService.soaprequest(targetnamespace, choosedoperationname, outString);
		
		// using SOAP Version 1.1
		//prepare to send the soap request
		var wsMethod = "POST";
		var wsHeader = "Content-Type: text/xml";
		var wsBody = soaprequestStr;
		var response = "";
		
		try
		{
			SingapuRateWebService.sendReq(aWin, SingapuRateUtilities.SingapuRateWSLocation, wsMethod, wsHeader, wsBody, funcName );
			
		}
		catch(e)
		{
			SingapuRateUtilities.alertSimpleWndMsg("SingapuRate.wsdlError");
		}
		
		return;
		
	},	
};


var SingapuRateWebsiteRatings = 
{
    isBlackList: function(aWin, weburl)
    {
	    if(!weburl || weburl.length == 0)
	    	return false;

		if( SingapuRateUtilities.isSingapurateDomain(weburl) === true )
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
			
		    if( SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === false )
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
				var l_iCacheListLength = SingapuRatePrefs.SingapuRateCacheList.prefKey.length;
				var l_iStartPos = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
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
					
					var piKey = SingapuRatePrefs.SingapuRateCacheList.idxToDomains[lipIdx];
					if( piKey != sOnlyDomainName )
						continue;
							
					iUrlIdx 		= lipIdx;
					if(iUrlIdx == -1)
						break;
						
					var prefKeys = SingapuRatePrefs.SingapuRateCacheList.prefKey[iUrlIdx];	
					var prefKeyItems = prefKeys.split("|||");
					if( prefKeyItems.length <= 0
							|| (prefKeyItems[0] != "*" 
									&& prefKeyItems[0] != SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName]) )
					{
						//this cache does not belong to this login acct
						iUrlIdx = -1;
						continue;
					}
					
					var minAge 		= SingapuRatePrefs.SingapuRateCacheList.minAges[iUrlIdx];
					var entryDate	= SingapuRatePrefs.SingapuRateCacheList.entryDates[iUrlIdx];
					var voteId		= SingapuRatePrefs.SingapuRateCacheList.voteIds[iUrlIdx];
						
					if( prefKeyItems[0] == "*"
							|| entryDate >= iIntegerToday)
					{
						//entry still valid
						if(minAge <= SingapuRateUtilities.getUserAge(SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]))
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
				var param_and_inputs = {"usr" : SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAcctName],
										"domain" : sOnlyDomainName };
										
				SingapuRateWebService.doSendRequest(aWin, SingapuRateUtilities.SingapuRateWSRateMethod, param_and_inputs);

				//as we donot have this domain url in cache, we allow it first. callback of the web service will block it later if not allowed
				return false;
			}
		}
		catch(e)
		{
			//an exception caught, do nothing, just block the domain
		}		
				
        return true;
    },
    
    checkDomainInfo: function()
    {
		var usrCurrentAge = SingapuRateUtilities.getUserAge(SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]);
		//loop through the cache array
		var iUrlIdx = -1;
		//loop through the array
		var l_iCacheListLength = SingapuRatePrefs.SingapuRateCacheList.prefKey.length;
		var l_iStartPos = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
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
				
			var piKey = SingapuRatePrefs.SingapuRateCacheList.idxToDomains[lipIdx];
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
				var l_iCacheListLength2 = SingapuRatePrefs.SingapuRateCacheList.prefKey.length;
				var l_iStartPos2 = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
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
					
					var piKey2 = SingapuRatePrefs.SingapuRateCacheList.idxToDomains[lipIdx2];
					if( piKey2 != sOnlyDomainName )
						continue;
										
					iUrlIdx 		= lipIdx2;
									
					//we can break already as we have got one match
					break;		//break from for loop, continue with while loop
				}
			}
		}
					
		var minAge = 21;
		var category = "R21";
		var voteId = -1;
		var ctgryId = -1;
		if(iUrlIdx >= 0)
		{
			//found the cache
			category 		= SingapuRatePrefs.SingapuRateCacheList.categories[iUrlIdx];
			ctgryId 		= SingapuRatePrefs.SingapuRateCacheList.ctgryIds[iUrlIdx];
			voteId			= SingapuRatePrefs.SingapuRateCacheList.voteIds[iUrlIdx];
			minAge			= SingapuRatePrefs.SingapuRateCacheList.minAges[iUrlIdx];
						
		}
				    
    },
    

    
    isBlockedInCache: function(weburl)
    {
	    var strKeyMinAge 		= SingapuRateUtilities.SingapuRateParamNameMinAge;
	    var strKeyCategoryName 	= SingapuRateUtilities.SingapuRateParamNameCategoryName;
	    var strKeyVoteId 		= SingapuRateUtilities.SingapuRateParamNameVoteId;
	    var strKeyCategoryId 	= SingapuRateUtilities.SingapuRateParamNameCategoryId;
	    var strKeyBlocked 		= SingapuRateUtilities.SingapuRateParamNameSiteBlocked;
	    
	    var retResults = [];
	    retResults[strKeyBlocked] = false;
	    retResults[strKeyMinAge] = 21;
	    retResults[strKeyCategoryName] = "R21";
	    retResults[strKeyVoteId] = -1;
	    retResults[strKeyCategoryId] = -1;
	    
	    if(!weburl || weburl.length == 0)
	    	return retResults;

		if( SingapuRateUtilities.isSingapurateDomain(weburl) === true )
		{
			//certified singapurate urls always
			return retResults;
		}
	    	
	    var sOnlyDomainName = SingapuRateUtilities.getOnlyDomainName(weburl, SingapuRateUtilities.SingapuRateDomainCheckDepth);	
		if(!sOnlyDomainName
				|| sOnlyDomainName == "")
			return retResults;
		
		try
		{	
			
		    if( SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyAuthenticate] === false )
		    {
			    //donot allow access websites
			    retResults[strKeyBlocked] = true;
			    return retResults;
		    }
			else
			{
				var iUrlIdx = -1;
				var fiveDaysAgo = new Date();   //actually one day ago
				fiveDaysAgo.setDate( fiveDaysAgo.getDate() - 1 );
				var l_iFiveDaysAgoY = fiveDaysAgo.getFullYear();
				var l_iFiveDaysAgoM = (fiveDaysAgo.getMonth() + 1);
				var l_iFiveDaysAgoD = (fiveDaysAgo.getDate());
				var iIntegerFiveDaysAgo = l_iFiveDaysAgoD + l_iFiveDaysAgoM * 100 + l_iFiveDaysAgoY * 10000;
				
				//user logged in successfully
				//loop through the array
				var l_iCacheListLength = SingapuRatePrefs.SingapuRateCacheList.prefKey.length;
				var l_iStartPos = SingapuRatePrefs.SingapuRateCacheList.liTotalNumCaches % SingapuRateUtilities.SingapuRateMaxNumCaches;
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
					
					var piKey = SingapuRatePrefs.SingapuRateCacheList.idxToDomains[lipIdx];
					if( piKey != sOnlyDomainName )
						continue;
							
					iUrlIdx 		= lipIdx;
					if(iUrlIdx == -1)
						break;
						
					var minAge 			= SingapuRatePrefs.SingapuRateCacheList.minAges[iUrlIdx];
					var entryDate		= SingapuRatePrefs.SingapuRateCacheList.entryDates[iUrlIdx];
					var category 		= SingapuRatePrefs.SingapuRateCacheList.categories[iUrlIdx];
					var ctgryId 		= SingapuRatePrefs.SingapuRateCacheList.ctgryIds[iUrlIdx];
					var voteId			= SingapuRatePrefs.SingapuRateCacheList.voteIds[iUrlIdx];
					
					if( iIntegerFiveDaysAgo >= entryDate )
					{
						//expired, allow to access;
						return retResults;
					}	
					
					retResults[strKeyMinAge] 		= minAge;
					retResults[strKeyCategoryName] 	= category;
					retResults[strKeyVoteId] 		= voteId;
					retResults[strKeyCategoryId] 	= ctgryId;
										
					//entry still valid
					if(minAge <= SingapuRateUtilities.getUserAge(SingapuRatePrefs.SingapuRateStoredInformation[SingapuRateUtilities.SingapuRatePrefKeyBirthday]))
					{
						//white listed 
						//allow it to continue and notify its status
						retResults[strKeyBlocked] = false;
						return retResults;
					}
					else
					{
						//not allow to access by age restriction
						retResults[strKeyBlocked] = true;
						return retResults;
					}
					break;
				}
			}
		}
		catch(e)
		{
			//caught an exception, do nothing
		}
		//default is to allow if not in cache
		
        return retResults;
    },  
    
	    
    
};




