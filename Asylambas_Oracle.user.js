// ==UserScript==
// @name        Asylamba's Oracle
// @namespace   asylamba
// @description Userscript dédié à l'amélioration de l'UI d'Asylamba
// @include     http://game.asylamba.com/*
// @version     1
// @grant       none
// @author      Genroa
// @updateURL		https://github.com/Genroa/asylambasoracle/raw/master/Asylambas_Oracle.user.js
// ==/UserScript==

//################# UTILITIES ################

function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

/*
Factions:
Rebelle/vide: 		0 
Ordre Impérial: 	1
Marche de Cardan: 	2
Ligue: 				3
Province de Nerve: 	4
*/


var mapPicsOfFactions = [0, 1, 4, 8, 9];

//############################################


//############# ORACLES MAP ##################

var optionToggleBestMerchWays_pic = "http://img11.hostingpics.net/pics/170120merchways.png";
var bestMerchWays_pic = "http://img15.hostingpics.net/pics/203023merchWay.png";
var bestOtherFactionsMerchWays_pic = "http://img15.hostingpics.net/pics/615926merchWayOtherFaction.png";



function OraclesMap(){
	this.myX = undefined;
	this.myY = undefined;
	this.myFactionSpriteNumber = undefined;

	this.displayFilter = true;
	this.sectorFilter = "all";
	this.factionFilter = "all";

	this.merchWayMinDistance = 95;
	this.merchWayMaxDistance = 100;
}

OraclesMap.prototype.initialize = function(){
	var infos = $("div#map");
	this.myX = infos.attr("data-begin-x-position");
	this.myY = infos.attr("data-begin-y-position");

	var selectedPlanet = $('.loadSystem[data-x-position="'+this.myX+'"][data-y-position="'+this.myY+'"]');
	var image = selectedPlanet.children().first();
	
	this.myFactionSpriteNumber = getFactionSpriteNumberFromImageSrc(image.attr("src"));

	//alert(this.myFactionSpriteNumber);
}
OraclesMap.prototype.loadConfig = function(){
	var strData = readCookie("oraclesmap.data");
	
	if(strData){
		var jsonData = eval("(" + strData + ")");

		this.sectorFilter = jsonData.sectorFilter;
		this.factionFilter= jsonData.factionFilter;
		this.displayFilter= jsonData.displayFilter;

		this.merchWayMinDistance = jsonData.merchWayMinDistance;
		this.merchWayMaxDistance = jsonData.merchWayMaxDistance;
	}
}
OraclesMap.prototype.saveConfig = function(){
	var save = {};
	save.sectorFilter = this.sectorFilter;
	save.factionFilter= this.factionFilter;
	save.displayFilter= this.displayFilter;
	save.merchWayMinDistance = this.merchWayMinDistance;
	save.merchWayMaxDistance = this.merchWayMaxDistance;

	createCookie("oraclesmap.data", JSON.stringify(save), 365);
}
OraclesMap.prototype.checkDistance = function(x1, y1, x2, y2){
	var distance = Math.floor(Math.sqrt( Math.pow((x2-x1), 2) + Math.pow((y2-y1), 2) ));

	if(distance <= this.merchWayMaxDistance && distance >= this.merchWayMinDistance)
	{
		return true;
	}

	return false;
}
OraclesMap.prototype.matchFilters = function(planet){
	//Check distance
	if(!this.displayFilter)
		return false;

	if(!this.checkDistance(this.myX, this.myY, planet.attr('data-x-position'), planet.attr('data-y-position'))){
		return false;
	}

	return true;
}
OraclesMap.prototype.refresh = function(){
	var map = this;
	$.each($('.loadSystem'), function(){
		if( map.matchFilters($(this)) ){
			$(this).children().closest("span").find(".oraclesMapBestMerchWay").show();
		}
		else{
			$(this).children().closest("span").find(".oraclesMapBestMerchWay").hide();
		}
	});
}
OraclesMap.prototype.toggleDisplayBestMerchWays = function(){
	this.displayFilter = !this.displayFilter;

	if(this.displayFilter){
		this.refresh();
	}
	else{
		$('.oraclesMapBestMerchWay').each(function(){
			$(this).hide();
		});
	}

	this.saveConfig();
}

OraclesMap.prototype.displayUI = function(){
	//If no UI, generate it
	if(!$('.oraclesMapFilter').length){
		
		//Générer l'UI
		
		var active = "";
		if(this.displayFilter){
			active = " active"
		}
		
		$('a.switch-class:nth-child(1)').before('<a id="optionToggleBestMerchWays" class="sh hb lb'+active+'" href="#" title="afficher/cacher les meilleures destinations commerciales" ><img src="'+optionToggleBestMerchWays_pic+'" alt="minimap"></a>');		
		document.getElementById('optionToggleBestMerchWays').addEventListener('click', toggleDisplay, false);
		
		//$('a.switch-class:nth-child(1)').before('<a class="sh hb lb" href="#" title="filtre factions"><img src="http://game.asylamba.com/s7/public/media/map/option/minimap.png" alt="minimap"></a>');
		
		//Générer les points
		var map = this;
		$.each($('.loadSystem'), function(){
			var iconsList =   '<span class="oraclesMapIconsList">';
			var fc = getFactionSpriteNumberFromImageSrc( $(this).children().first().attr('src'));
			
			if(fc != "0")
			{
				if(map.myFactionSpriteNumber == fc)
				{
					iconsList += '<img class="oraclesMap oraclesMapBestMerchWay" style="display: none; margin-top: -20px;" src="'+bestMerchWays_pic+'" />';
				}
				else
				{
					iconsList += '<img class="oraclesMap oraclesMapBestMerchWay" style="display: none; margin-top: -20px;" src="'+bestOtherFactionsMerchWays_pic+'" />';
				}
			}
							
			//+ '<img> '
			iconsList += '</span>';

			$(this).children().first().after(iconsList);
		});
	}

	this.refresh();
}




//###

function getFactionSpriteNumberFromImageSrc(src){
	return src.substring(src.length-5, src.length).charAt(0);
}

function toggleDisplay(){
	oraclesMap.toggleDisplayBestMerchWays(); 
	if(oraclesMap.displayFilter)
	{
		$("#optionToggleBestMerchWays").addClass("active");
	}
	else
	{
		$("#optionToggleBestMerchWays").removeClass("active");
	}
}

//###

function loadOraclesMap(){
	window.oraclesMap = new OraclesMap();
	var map = window.oraclesMap;

	//read page for data
	map.initialize();

	//load filter config
	map.loadConfig();

	//display/create UI and icons. Will call refresh
	map.displayUI();
}

//############################################




//################## LOADER ##################
var path = window.location.pathname;
$(function(){


	if(path.slice(1).substring(path.slice(1).indexOf('/'), path.length) == "/map"){
		loadOraclesMap();	
	}


});


//############################################