
function getQueryVariable(variable) 
{
	var query = window.location.search.substring(1);
  	var vars = query.split("&");
  	for (var i=0;i<vars.length;i++) {
    	var pair = vars[i].split("=");
    	if (pair[0] == variable) {
      		return pair[1];
    	}
  	} 
  	return "";
}	

document.addEventListener('DOMContentLoaded', function () {

	var SingapuRateDomainName = "singapurate.com";
	var SingapuRateParamNameUrl = "wrs_url";
	var SingapuRateParamNameCategoryId = "wrs_rc";
	var SingapuRateParamNameCategoryName = "wrs_cn";
	var SingapuRateParamNameVoteId = "wrs_vi";
	var SingapuRateParamNameMinAge = "wrs_minAge";
  	var minAge = 21;
  	var category = "R21";
  	var voteId = -1;
	var ctgryId = -1;
	var urlPath = "#";
	urlPath = getQueryVariable(SingapuRateParamNameUrl); 
	category = getQueryVariable(SingapuRateParamNameCategoryName); 
	ctgryId = getQueryVariable(SingapuRateParamNameCategoryId); 
	voteId = getQueryVariable(SingapuRateParamNameVoteId); 
	minAge = getQueryVariable(SingapuRateParamNameMinAge); 
			
	document.getElementById("srWebsiteDomain").textContent = urlPath;
	document.getElementById("srWebsiteRating").textContent = category;
		
	var sVoteOrViewSite = "";
	var sVoteOpinionUrl = "";
	var sWebsiteRatingDescr = "";
					    
	if(category == "G")
	{
		sWebsiteRatingDescr = "suitable for all ages";
	}
	else if(category == "PG")
	{
		sWebsiteRatingDescr = "suitable for all, but parents should guide their young";
	}
	else if(category == "PG13")
	{
	    sWebsiteRatingDescr = "suitable for persons aged 13 and above, but parental guidance is advised for children below 13";
	}
	else if(category == "NC16")
	{
		sWebsiteRatingDescr = "suitable for persons aged 16 and above";
	}
	else if(category == "M18")
	{
		sWebsiteRatingDescr = "suitable for persons aged 18 and above";
	}
	else if(category == "R21")
	{
		sWebsiteRatingDescr = "restricted to persons aged 21 and above";
	}
	else if(category == "BL")
	{
		sWebsiteRatingDescr = "phishing, malware, malicious, useless, suspicious, or disliked website thus blocked for all persons";
	}
		
	//check by vote id				    
	if(voteId > 0)
	{
		sVoteOpinionUrl = "http://" + SingapuRateDomainName + "/viewdetails.php?p=" + voteId + "#p" + voteId;
		sVoteOrViewSite = "check your vote";
	}
	else
	{
		sVoteOpinionUrl = "http://" + SingapuRateDomainName + "/posting.php?" + SingapuRateParamNameUrl + "=" + urlPath;
		if(ctgryId > 0)
			sVoteOpinionUrl = sVoteOpinionUrl + "&" + SingapuRateParamNameCategoryId + "=" + ctgryId;
		sVoteOrViewSite = "vote your opinion";
	}
	document.getElementById("srVoteOpinionLink").setAttribute("href", sVoteOpinionUrl);
	document.getElementById("srVoteOrViewSite").textContent = sVoteOrViewSite;
	document.getElementById("srWebsiteRatingDescr").textContent = sWebsiteRatingDescr;
					    

});
