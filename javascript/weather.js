// this file is all the javascript for the simple weather page setup
// it uses the FUSION library extensively, so see fusionlib.js for all
// functions that start with "FUSION."
// it also uses jQuery, because I'm inherently lazy and jQuery makes life
// so much easier sometimes.

var MYWEATHER = {
	directions: ["N", "NNE", "NE", "ENE","E", "ESE", "SE", "SSE","S", "SSW", "SW", "WSW","W", "WNW", "NW", "NNW"],
	months:["Jan", "Feb", "Mar","Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	validunits: ["us", "ca"],
	fulldays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	cnvrtflds: ["condition", "wind", "hrwind1", "hrwind2", "hrwind3", "hrwind4", "hrwind5", "hrwind6", "hrwind7", "hrwind8",
				"hrtemp1", "hrtemp2", "hrtemp3", "hrtemp4", "hrtemp5", "hrtemp6", "hrtemp7", "hrtemp8", "high", "high2", "high3",
				"high4", "high5", "low", "low2", "low3", "low4", "low5"]
};

$( document ).ready(function() {

	//IE doesn't like Google fonts...apparently it's Google's fault
	//at the moment, but whatever...load Web Safe font for IE users
	var gbr = FUSION.get.browser();
	if(gbr.browser && gbr.browser == "IE") {
		document.body.style.fontFamily = "'Trebuchet MS', Helvetica, sans-serif";
	}

	var dzip = FUSION.get.node("defaultzipcode").value;

	if(supportsHtml5Storage())
	{
		var lsa = [];
		var lso = {};
		var lss = "";

		var u = getUnits();
		FUSION.get.node("units" + u).checked = true;

		for(var i = 0; i < localStorage.length; i++)
		{
			lss = localStorage.getItem(localStorage.key(i));
			if(typeof lss !== undefined && localStorage.key(i).match(/^geocodeid/))
			{
				//throwing in a try/catch here, due to IE11 creating *weird* items
				//that can not be parsed by JSON.  The match statement above
				//should catch them, but juuuust in case, this will filter out
				//any other weirdness
				try {
					lso = JSON.parse(lss);
					if(lso.placeid) {
						lsa.push(lso);
					}
				}
				catch(err) {
					FUSION.error.logError(err);
				}
			}
		}

		if(lsa.length > 0)
		{
			//sort descending by age, oldest to youngest entries
			//lsa.sort(function(a,b) { return parseInt(a.order) - parseInt(b.order) } );

			//load the first item in the array into the main area
			locationClick(JSON.stringify(lsa[0]));

			//create location divs for all localStorage items
			for(var j = 0; j < lsa.length; j++)
			{
				addCityDiv(lsa[j]);
			}
		}
		else
		{
			//no existing localStorage item matches, so load the info based on the
			//default zip code (10001)
			runSearch(dzip);
		}
	}
	else
	{
		//if an older browser that does not support localStorage,
		//just load the info by the default Zip code (10001)
		runSearch(dzip);
	}

});


function setUnits(u)
{
	var units = u;
	try {
		if(MYWEATHER.validunits.indexOf(units) > -1){
			localStorage.setItem("defaultunits", units);
		}
		else {
			units = "us";
			FUSION.error.logError(err, "Invalid unit parameter supplied - defaulting to US: ");
			localStorage.setItem("defaultunits", units);
		}

		var jsonfield = null;
		var dispfield = null;
		var jsonvalue = {};
		var origvalue = 0;
		var cvrtvalue = 0;
		var jsonstrng = "";
		var windunits = (units == "us") ? " mph" : " kph";
		var tempunits = (units == "us") ? "&deg; F" : "&deg; C";

		for(var i = 0; i < MYWEATHER.cnvrtflds.length; i++)
		{
			jsonfield = FUSION.get.node(MYWEATHER.cnvrtflds[i] + "_cnvrt");
			dispfield = FUSION.get.node(MYWEATHER.cnvrtflds[i]);
			if(typeof jsonfield !== null && typeof dispfield !== null)
			{
				try {
					jsonvalue = JSON.parse(jsonfield.value);
					if(jsonvalue.units != units) //make sure you don't try to convert unless the units are different!
					{
						origvalue = parseInt(jsonvalue.value);
						cvrtvalue = (jsonvalue.type == "wind") ? convertWind(origvalue, units) : convertTemp(origvalue, units);
						jsonstrng = jsonvalue.text.left + cvrtvalue + jsonvalue.text.right;
						dispfield.innerHTML = (jsonvalue.type == "wind") ? jsonstrng + windunits : jsonstrng + tempunits;

						jsonvalue.value = cvrtvalue;
						jsonvalue.units = units;
						jsonfield.value = JSON.stringify(jsonvalue);
					}
				}
				catch(err) {
					FUSION.error.logError(err, "Error updating unit data for field " + MYWEATHER.cnvrtflds[i] + "_cnvrt: ");
				}
			}
		}
	}
	catch(err) {
		FUSION.error.logError(err, "Unable to set unit parameter: ");
	}
}


function getUnits()
{
	var uval = $("input[name=unitradio]:checked").val();
	var ls = (localStorage.getItem("defaultunits") === null) ? false : true;
	if(ls){
		try {
			uval = localStorage.getItem("defaultunits");
		}
		catch(err) {
			FUSION.error.logError(err, "Unable to retrieve stored unit parameter - defaulting to selected value: ");
		}
	}
	return uval;
}


function convertTemp(t, u)
{
	var ct = 0;
	if(u == "us") //convert from CA to US (metric to imperial)
	{
		//°C to °F	Multiply by 9, then divide by 5, then add 32
		ct = ((t * 9) / 5) + 32;
	}
	else if(u == "ca") //convert from US to CA (imperial to metric)
	{
		//°F to °C	Deduct 32, then multiply by 5, then divide by 9
		ct = ((t - 32) * 5) / 9;
	}
	return Math.round(ct);
}

function convertWind(v, u)
{
	var cw = 0;
	if(u == "us") //convert from CA to US (metric to imperial)
	{
		//1 Kilometer = 0.621371 Miles
		cw = v * 0.621371;
	}
	else if(u == "ca") //convert from US to CA (imperial to metric)
	{
		//1 Mile = 1.60934 Kilometers
		cw = v * 1.60934;
	}
	return Math.round(cw);
}


function supportsHtml5Storage()
{
	//generic function to check if the browser can handle
	//and use localStorage, or if they're living in the stone age
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	}
	catch(err) {
		FUSION.error.logError(err);
		return false;
	}
}


function hideSearchDiv(t)
{
	if(FUSION.lib.isBlank(t.value)){
		var ls = FUSION.get.node("locselect");
		ls.style.height = "0px";
		ls.innerHTML = "";
		ls.style.display = "none";
	}
}


function runSearch(s)
{
	var val = s || FUSION.get.node("searchbox").value;
	if(FUSION.lib.isBlank(val)){
		var atxt  = "<p style='margin:15px 5px 5px;text-align:center;font-size:16px;font-weight:bold;color:#D00;'>";
			atxt += "Please enter a search string!";
			atxt += "</p>";
		FUSION.lib.alert(atxt);
		return false;
	}

	val = val.replace(/\s/ig, "+");
	var units = $("input[name=unitradio]:checked").val();
	var info = {
		"type": "GET",
		"path": "php/weatherlib.php",
		"data": {
			"method": 		"getWeatherInfo",
			"libcheck": 	true,
			"searchstring": val,
			"units": 		units
		},
		"func": runSearchResponse
	};
	FUSION.lib.ajaxCall(info);
}


function locationClick(h)
{
	var hash = JSON.parse(h);
	var units = $("input[name=unitradio]:checked").val();
	var info = {
		"type": "GET",
		"path": "php/weatherlib.php",
		"data": {
			"method": 		"getForecastInfo",
			"libcheck": 	true,
			"latitude": 	hash.lat,
			"longitude": 	hash.lng,
			"geoinfo": 		hash,
			"units": 		units
		},
		"func": runSearchResponse
	};
	FUSION.lib.ajaxCall(info);
}


function runSearchResponse(h)
{
	var hash = h || {};
	var rc = hash['result_count'];
	if(parseInt(rc) > 1)
	{
		var locsel = FUSION.get.node("locselect");
		locsel.innerHTML = "";

		var geoinfo = {};
		var locs = 0;
		var ad = false;
		var ls = false;
		for(var key in hash)
		{
			if(/^geocodeid/.test(key) && locs < 5)
			{
				locs++;
				geoinfo = hash[key];
				ad = (FUSION.get.node("geocodeid" + geoinfo.placeid) === null) ? true : false;
				ls = (localStorage.getItem("geocodeid" + geoinfo.placeid) === null) ? true : false;

				var div = FUSION.lib.createHtmlElement({"type":"div",
														"attributes":{"class":"loclinkdiv"}});
				var lnk = FUSION.lib.createHtmlElement({"type":"a","text":geoinfo.address,
														"style":{
															"textDecoration":"none",
															"color":"#EEE",
															"display":"block",
															"width":"90%",
															"height":"40px",
															"marginLeft":"5%",
															"marginRight":"5%"
														},
														"onclick":"locationClick('" + JSON.stringify(geoinfo) + "')",
													    "attributes":{"href":"javascript:void(0)"}});
				div.appendChild(lnk);
				locsel.appendChild(div);
			}
		}
		locsel.style.height = (locs * 40) + "px";
		locsel.style.display = "block";

	}
	else
	{
		processForecast(hash);
	}
}


function processForecast(h)
{
	//the catch-all function for most responses from the server
	//basically just fills in the information for a given location
	//based on the array returned by the server to the AJAX request
	//names should make it clear what each line is doing
	var hash = h || {};

	var geoinfo = {};
	for(var key in hash)
	{
		if(/^geocodeid/.test(key))
		{
			geoinfo = hash[key];
		}
	}

	//NEED TO REEXAMINE THE OBJSIZE FUNCTION...ITS ADDING A CHILD FOR THE NUMBER OF RESULTS
	if(FUSION.get.objSize(geoinfo) > 1)
	{
		var units = $("input[name=unitradio]:checked").val();
		var tu = (units == "us") ? "F" : "C";
		var su = (units == "us") ? "mph" : "kph";

		var adv = (FUSION.get.node("geocodeid" + geoinfo.placeid) === null) ? true : false;
		var lcs = (localStorage.getItem("geocodeid" + geoinfo.placeid) === null) ? true : false;

		FUSION.get.node("footerlocation").innerHTML = geoinfo.address;
		FUSION.get.node("location").innerHTML = geoinfo.address;
		var sb = FUSION.get.node("searchbox");
		sb.value = "";
		hideSearchDiv(sb);

		var nreq = 1000 - parseInt(hash['numberofreqs']);
		FUSION.get.node("numreqs").innerHTML = "(" + nreq + ")";

		//offset for location timezone and user timezone
 		var rnow = new Date();
 		var tzos = rnow.getTimezoneOffset() / 60;
		var ofst = 3600 * (tzos + hash['timezone']['offset']);

		var rain = 0;
		var wind = 0;
		var drct = "";
		var wstr = "N/A 0 " + su;
		var brng = "";
		var hobj = {};

		var ipp = 0;
		var skycons = new Skycons({
			"monochrome": true,
			"colors" : {
				"main": "#444"
			}
		});

		var hrly = hash['hourly'];
		var hrtp = {};
		var hrwd = {};
		var hitp = {};
		var lotp = {};

		for(var i = 0; i < hrly.length; i++)
		{
			ipp = i + 1;

			FUSION.get.node("hrdisplay" + ipp).innerHTML = getTimeFromTs(hrly[i]['time'] + ofst);
			FUSION.get.node("hrcondtion" + ipp).innerHTML = hrly[i]['summary'];
			FUSION.get.node("hrtemp" + ipp).innerHTML = Math.round(hrly[i]['temperature']) + "&deg; " + tu;
			rain = Math.round(hrly[i]['precipProbability'] * 100);
			rain += "%";
			FUSION.get.node("hrrainchance" + ipp).innerHTML = rain;
			wind = Math.round(hrly[i]['windSpeed']);
			drct = hrly[i]['windBearing'];
			brng = wind > 0 ? getWindBearing(drct) : "N/A";
			wstr = brng + " " + wind + " " + su;

			hrtp = { "type":"temperature", "value":Math.round(hrly[i]['temperature']), "units":units, "text":{ "left":"", "right":"" }};
			hrwd = { "type":"wind", "value":wind, "units":units, "text":{ "left":brng + " ", "right":"" }};

			FUSION.get.node("hrtemp" + ipp + "_cnvrt").value = JSON.stringify(hrtp);
			FUSION.get.node("hrwind" + ipp + "_cnvrt").value = JSON.stringify(hrwd);

			FUSION.get.node("hrwind" + ipp).innerHTML = wstr;
			skycons.add("hricon" + ipp, hrly[i]['icon']);
		}

		var crnt = hash['current'];
		var daly = hash['daily'];

		var ct = new Date((crnt['time'] + ofst) * 1000);
		var dstr = MYWEATHER.fulldays[ct.getDay()] + " / " + MYWEATHER.months[ct.getMonth()] + " " + ct.getDate() + ", " + ct.getFullYear();
		FUSION.get.node("date").innerHTML 		= dstr;

		var cntp = { "type":"temperature",
					 "value":Math.round(crnt['temperature']), "units":units,
					 "text":{ "left":crnt['summary'] + ", ", "right":"" }};

		FUSION.get.node("condition_cnvrt").value = JSON.stringify(cntp);
		FUSION.get.node("condition").innerHTML  = crnt['summary'] + ", " + Math.round(crnt['temperature']) + "&deg; " + tu;

		skycons.add("condimg", crnt['icon']);

		var wspd = Math.round(crnt['windSpeed']);
		var wbrg = wspd > 0 ? getWindBearing(crnt['windBearing']) : "N/A";
		var wind = wbrg + " " + wspd + " " + su;

		var wscv = { "type":"wind", "value":wspd, "units":units, "text":{ "left":wbrg + " ", "right":"" }};
		FUSION.get.node("wind_cnvrt").value = JSON.stringify(wscv);

		FUSION.get.node("dailyfrc").innerHTML 	= daly[0]['summary'];
		FUSION.get.node("conditiontext").value 	= daly[0]['summary'];
		FUSION.get.node("wind").innerHTML		= wind;
		FUSION.get.node("sunrise").innerHTML	= getTimeFromTs(daly[0]['sunriseTime'] + ofst);
		FUSION.get.node("sunset").innerHTML		= getTimeFromTs(daly[0]['sunsetTime'] + ofst);

		hitp = { "type":"temperature", "value":Math.round(daly[0]['temperatureMax']), "units":units, "text":{ "left":"", "right":"" }};
		lotp = { "type":"temperature", "value":Math.round(daly[0]['temperatureMin']), "units":units, "text":{ "left":"", "right":"" }};

		FUSION.get.node("high_cnvrt").value = JSON.stringify(hitp);
		FUSION.get.node("low_cnvrt").value 	= JSON.stringify(lotp);
		FUSION.get.node("high").innerHTML 	= Math.round(daly[0]['temperatureMax']) + "&deg; " + tu;
		FUSION.get.node("low").innerHTML 	= Math.round(daly[0]['temperatureMin']) + "&deg; " + tu;


		var dte = 0;
		var dstr = "";
		var k = 0;

		rain = 0;
		hitp = {};
		lotp = {};
		for(var j = 1; j < 5; j++)
		{
			k = j + 1;

			hitp = { "type":"temperature", "value":Math.round(daly[j]['temperatureMax']), "units":units, "text":{ "left":"", "right":"" }};
			lotp = { "type":"temperature", "value":Math.round(daly[j]['temperatureMin']), "units":units, "text":{ "left":"", "right":"" }};

			FUSION.get.node("high" + k + "_cnvrt").value = JSON.stringify(hitp);
			FUSION.get.node("low" + k + "_cnvrt").value  = JSON.stringify(lotp);

			dte  = new Date((daly[j]['time'] + ofst) * 1000);
			dstr = MYWEATHER.days[dte.getDay()] + ", " + MYWEATHER.months[dte.getMonth()] + " " + dte.getDate();
			FUSION.get.node("dayofweek" + k).innerHTML  = dstr;
			FUSION.get.node("condition" + k).innerHTML  = daly[j]['summary'];
			FUSION.get.node("conditiontext" + k).value 	= daly[j]['summary'];
			FUSION.get.node("high" + k).innerHTML 		= Math.round(daly[j]['temperatureMax']) + "&deg; " + tu;
			FUSION.get.node("low" + k).innerHTML 		= Math.round(daly[j]['temperatureMin']) + "&deg; " + tu;
			rain = Math.round(daly[j]['precipProbability'] * 100);
			rain += "%";
			FUSION.get.node("rainchance" + k).innerHTML = rain;
			skycons.add("condimg" + k, daly[j]['icon']);
		}

		skycons.play();

		//quick check to see if a new location div is required
		//this should be false if the user clicks an existing location div
		//to load info for that area
		addCityDiv(geoinfo);
	}
}


function addCityDiv(h)
{
	var hash = h  || {};

	if(localStorage.getItem("geocodeid" + hash['placeid']) === null)
	{
		//if no localStorage item exists, create one if possible
		try {
			localStorage.setItem("geocodeid" + hash['placeid'], JSON.stringify(hash));
		}
		catch(err) {
			FUSION.error.logError(err, "Unable to create localStorage item: ");
		}
	}

	$(".citydiv").each( function() {
		$(this).css("background-color", "#FFF");
	});

	if(FUSION.get.node("geocodeid" + hash['placeid']) === null)
	{
		var div = FUSION.get.node("oldcitydiv");
		var els = div.getElementsByTagName("div");
		if(els.length >= 4)
		{
			//if there are already 4 locations stored, remove the oldest one
			//techincally it removes the last div, which *should* be the oldest,
			//but I should really do a sort here to make sure...I'll come back to it
			var eid = els[3].id;
			FUSION.remove.node(eid);
			try {
				localStorage.removeItem(eid);
			}
			catch(err) {
				FUSION.error.logError(err, "Unable to remove localStorage item: ");
			}
		}

		//begin creating the location box - just a div that holds a link and a span,
		//pretty straight-forward
		var ndv = FUSION.lib.createHtmlElement({"type":"div",
												"style":{ "backgroundColor":"#EEE" },
												"attributes":{
													"id": "geocodeid" + hash['placeid'], "class":"citydiv" }});
		var regstr = hash.address;

		var lnk = FUSION.lib.createHtmlElement({"type":"a",
												"onclick":"locationClick('" + JSON.stringify(hash) + "')",
												"text": regstr,
												"attributes":{
													"href":"javascript:void(0);",
													"title": regstr,
													"class":"citylink"
												}});

		var img = FUSION.lib.createHtmlElement({"type":"img",
												"onclick":"removeCityDiv('geocodeid" + hash['placeid'] + "')",
												"style":{"width":"12px","height":"12px"},
												"attributes":{
													"src":"../images/iconic/x-6x.png",
													"class":"removespan",
													"title":"Remove Location" }});
		ndv.appendChild(lnk);
		ndv.appendChild(img);

		//another concession for IE...insertBefore has issues in IE if there are no
		//existing elements in the parent div.  Because of course it does.
		if(els.length == 0)
		{
			div.appendChild(ndv);
		}
		else
		{
			div.insertBefore(ndv, div.childNodes[0]);
		}
	}
	else
	{
		FUSION.get.node("geocodeid" + hash['placeid']).style.backgroundColor = "#EEE";
	}
}


function removeCityDiv(id)
{
	//remove the location div - need to add in a sexier confirm box
	//in place of the standard confirm...so ugly
	var geoid = id || 0;
	if(geoid == 0)
	{
		FUSION.lib.alert("Unable to determine PlaceID - please refresh page and try again");
		return false;
	}

	var yn = confirm("Are you sure you'd like to remove this entry?");
	if(yn)
	{
		FUSION.remove.node(geoid);
		try{
			//attempt to remove the localStorage item...sometimes causes
			//an issue in older versions of IE...because of course it does
			localStorage.removeItem(geoid);
		}
		catch(err){
			FUSION.error.logError(err);
		}
	}
}


//just a little shim pulled from the Net to handle Date.now() calls
//older versions of IE don't like it, so this makes it forward AND
//backwards compatible.  Thanks stranger from Stackoverflow!
if (!Date.now) { Date.now = function() { return new Date().getTime(); }}


function showCondition(c)
{
	var cnd = c || "";
	if(cnd != "")
	{
		var txt = FUSION.get.node(cnd).value;
		FUSION.lib.alert("<p style='margin-top:10px;text-align:center;'>" + txt + "</p>");
	}
}


function getWindBearing(b)
{
	var brng = b || 0;
	var drct = Math.floor((brng + 11.25) / 22.5);
	drct = drct % 16; //handling when drct >= 16
	return MYWEATHER.directions[drct];
}


function getTimeFromTs(ts)
{
	if(typeof ts === "undefined" || typeof ts !== "number" || FUSION.lib.isBlank(ts))
	{
		alert("Invalid timestamp given: " + ts + "\nUnable to determine time");
		return "";
	}
	else
	{
		var date  	= new Date(ts * 1000);
		var hours 	= date.getHours();
		var minutes = "0" + date.getMinutes();
		var hour  	= 0;
		var ampm  	= "AM";

		if(hours > 11) {
			hour = (hours == 12) ? hours : hours % 12;
			ampm = "PM";
		}
		else if(hours == 0) {
			hour = 12;
		}
		else {
			hour = hours;
		}
		return hour + ':' + minutes.substr(minutes.length - 2) + " " + ampm;
	}
}
