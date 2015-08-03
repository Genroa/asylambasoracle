// ==UserScript==
// @name        Asylamba's Oracle
// @namespace   asylamba
// @description Userscript dédié à l'amélioration de l'UI d'Asylamba
// @include     http://game.asylamba.com/*
// @version     1.1
// @grant       Genroa & Alceste
// @author      Genroa & Alceste
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

function getPosition(str, m, i) {
   return str.split(m, i).join(m).length;
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


//########### REMAINING TIME #################
var currentRessources = 0; // ressources currently in warehouse
var production        = 0; // current ressources production

// zero padding function
function pad(n, width, z) 
{
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// Format time based on remaining tick
function beautifulTime(remainingTick, d) 
{
    return ((remainingTick-1) > 0 ? (remainingTick-1) + 'h' : '') 
        + pad((d.getMinutes() === 0 ? 0 : 60 - d.getMinutes()), 2) 
        + 'm'
    ;
}

// Display the remaining time before the warehouse is full
function remainingWarehouseTime() 
{
    currentRessources  = parseInt($("#tools-refinery > div.overflow > div.number-box.grey span.value").text().replace(/ /g, ""));
    var fillingPercent = parseInt($("#tools-refinery > div.overflow > div.number-box.grey span.progress-bar > span").css('width')) / 100;

    if (fillingPercent < 1) {
        var remainingTick = Math.ceil((currentRessources / fillingPercent - currentRessources) / production);
        var remainingTime = beautifulTime(remainingTick, new Date());

        $("#tools-refinery > div.overflow > div.number-box.grey span.value").append('<span style="font-size: 13px;font-weight: normal;"> ' + remainingTick + 'r (' + remainingTime + ')</span>');
    }
}

function remainingGeneratorTime() 
{
    var missingRessourceRegex = /il manque ([0-9 ]+) ressource/i;
    var d                     = new Date();
    var match;

    $('div.build-item > span.button.disable.hb.lt').each(function() 
    {
        if ((match = missingRessourceRegex.exec($(this).attr('title'))) !== null) {
            match = parseInt(match[1].replace(/ /g, ""));

            var remainingTick = Math.ceil(match / production);
            var remainingTime = beautifulTime(remainingTick, d);

            $(this).attr('title', $(this).attr('title') + ', ' + remainingTick + ' releves restantes (' + remainingTime + ')');
        }
    });
}

function remainingTechnosphereTime() 
{
    var d = new Date();

    $('div.build-item:not(.disable) > span.button.disable').each(function() 
    {
        if ($(this).text().indexOf('pas assez de ressources') > -1) {
            var remainingTick = Math.ceil((parseInt($(this).children('span.final-cost:eq(0)').text().replace(/ /g, ''))-currentRessources)/production);
            var remainingTime = beautifulTime(remainingTick, d);

            $(this).children('br').before(', ' + remainingTick + 'r (' + remainingTime + ')');
        }
    });
}

function loadRemainingTimes()
{
    production = $("#tools-refinery > div.overflow > div.number-box:first-child span.value").text().replace(/ /g, "").split("+");
    production = parseInt(production[0]) + parseInt(production[1]);

    // Display the remaining time before the warehouse is full
    remainingWarehouseTime();
    
    // Display the remaining time before being able to build every building
    if (location.href.indexOf('bases/view-generator') > -1) {
        remainingGeneratorTime();
    }
    
    // Display the remaining time before being able to research a technology
    if (location.href.indexOf('bases/view-technosphere') > -1) {
        remainingTechnosphereTime()
    }
}



//############################################


//############## QUICK MENUS #################

function addQuickMenus()
{
	var basePath = window.location.href;
	var pos = getPosition(basePath, '/', 4) ;
	basePath = basePath.substring(0, pos+1);

	addLeagueMenu(basePath);
	addAdmiralyMenu(basePath);
}

function addLeagueMenu(basePath)
{
	var leagueMenu = '<span id="leagueMenu" style="position: relative; width: 0; height: 0; display: none">'
				   +'<li style="position: absolute; left: -50px; top: 40px"><a href="'+basePath+'faction/view-election">Election</a></li>'
				   +'<li style="position: absolute; left: -50px; top: 80px"><a href="'+basePath+'faction/view-forum">Forum</a></li>'
				   +'<li style="position: absolute; left: -50px; top: 120px"><a href="'+basePath+'faction/view-data">Registres</a></li>'
				   +'<li style="position: absolute; left: -50px; top: 160px"><a href="'+basePath+'/faction/view-player">Membres</a></li>'
				   +'</span>';

	$('.square[title=faction] > img').first().after(leagueMenu);
	
	$('.square[title=faction]').mouseenter(function(){
		clearTimeout($(this).data('timeoutId'));
		$('#leagueMenu').fadeIn();
	});
	$('#leagueMenu').mouseleave(function(){
		var elem = $('#leagueMenu');

		timeoutId = setTimeout(function(){
            elem.fadeOut();
        }, 800);
        $('.square[title=faction]').data('timeoutId', timeoutId);
	});

	$('.square[title=faction]').removeClass("hb");
}

function addAdmiralyMenu(basePath)
{
	var admiraltyMenu = '<span id="admiraltyMenu" style="position: relative; width: 0; height: 0; display: none">'
					   +'<li style="position: absolute; left: -50px; top: 40px"><a href="'+basePath+'fleet/view-overview">Amirauté</a></li>'
					   +'<li style="position: absolute; left: -50px; top: 80px"><a href="'+basePath+'fleet/view-spyreport">Rapports</a></li>'
					   +'<li style="position: absolute; left: -50px; top: 120px"><a href="'+basePath+'fleet/view-archive">Archives</a></li>'
					   +'<li style="position: absolute; left: -50px; top: 160px"><a href="'+basePath+'fleet/view-memorial">Mémorial</a></li>'
					   +'</span>';

	$('.square[title=amirauté] > img').first().after(admiraltyMenu);
	
	$('.square[title=amirauté]').mouseenter(function(){
		clearTimeout($(this).data('timeoutId'));
		$('#admiraltyMenu').fadeIn();
	});
	$('#admiraltyMenu').mouseleave(function(){
		var elem = $('#admiraltyMenu');

		timeoutId = setTimeout(function(){
            elem.fadeOut();
        }, 800);
        $('.square[title=amirauté]').data('timeoutId', timeoutId);
	});

	$('.square[title=amirauté]').removeClass("hb");
}


//############################################


//################## LOADER ##################
var path = window.location.pathname;
$(function(){
	
	//quick menus
	addQuickMenus();

	//Oracle's Map
	if(path.slice(1).substring(path.slice(1).indexOf('/'), path.length) == "/map"){
		loadOraclesMap();	
	}

	//remainingTime
	loadRemainingTimes();	
});


//############################################