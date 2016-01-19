// ==UserScript==
// @name        Asylamba's Oracle
// @namespace   asylamba
// @description Userscript dédié à l'amélioration de l'UI d'Asylamba
// @include     http://game.asylamba.com/*
// @match       http://game.asylamba.com/*
// @grant       GM_xmlhttpRequest
// @updateURL   https://github.com/Genroa/asylambasoracle/raw/master/Asylambas_Oracle.user.js
// @version     1.7.1
// @author      Genroa & Naji
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
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

function addCss(newCss)
{
	if(!$('#custom-css').length)
	{
		$("head").append('<style id="custom-css" type="text/css"></style>');
	}
	$('#custom-css').append(newCss);
}


/*
Factions:
Rebelle/vide:       0 
Ordre Impérial:     1
Marche de Cardan:   2
Ligue:              3
Province de Nerve:  4
*/


var mapPicsOfFactions = [0, 1, 4, 8, 9];

//############################################


//############# ORACLES MAP ##################

var optionToggleBestMerchWays_pic = "http://img11.hostingpics.net/pics/170120merchways.png";
var bestMerchWays_pic = "http://img15.hostingpics.net/pics/203023merchWay.png";
var bestOtherFactionsMerchWays_pic = "http://img15.hostingpics.net/pics/615926merchWayOtherFaction.png";
var merchWayMinDistance_pic = "http://img11.hostingpics.net/pics/506805merchwaysmin.png";
var merchWayMaxDistance_pic = "http://img11.hostingpics.net/pics/373043merchwaysmax.png";



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
			active = " active";
		}
		
		//Custom CSS
		addCss("#map-option{ max-width: 186px; background-repeat: initial; height:70px; }");
		addCss("#map-option::before{ height: 76px; }");
		addCss("#map-option::after{ height: 76px; }");
		addCss("#map-option a{ margin-top: 2px; }");
		addCss("#map-content{ top: 135px; }");

		//Options
		$('#map-option > a.sh.hb.lb.moveTo.switch-class').after('<a id="optionMerchWayMinDistance" class="sh hb lb'+active+'" href="#" title="choisir la borne inférieure de l\'intervalle des meilleures destinations commerciales"><img src="'+merchWayMinDistance_pic+'" alt="minimap"></a>');       
		document.getElementById('optionMerchWayMinDistance').addEventListener('click', chooseMerchWayMinDistance, false);

		$('#optionMerchWayMinDistance').after('<a id="optionMerchWayMaxDistance" class="sh hb lb'+active+'" href="#" title="choisir la borne supérieure de l\'intervalle des meilleures destinations commerciales"><img src="'+merchWayMaxDistance_pic+'" alt="minimap"></a>');     
		document.getElementById('optionMerchWayMaxDistance').addEventListener('click', chooseMerchWayMaxDistance, false);

		$('#optionMerchWayMaxDistance').after('<a id="optionToggleBestMerchWays" class="sh hb lb switch-class'+active+'" href="#" title="afficher/cacher les meilleures destinations commerciales" ><img src="'+optionToggleBestMerchWays_pic+'" alt="minimap"></a>');      
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

function chooseMerchWayMinDistance()
{
	var newVal = prompt("Définissez la borne inférieure", oraclesMap.merchWayMinDistance);
	if(newVal != null)
	{
		oraclesMap.merchWayMinDistance = newVal;
		oraclesMap.saveConfig();
		oraclesMap.refresh();
	}
}

function chooseMerchWayMaxDistance()
{
	var newVal = prompt("Définissez la borne supérieure", oraclesMap.merchWayMaxDistance);
	if(newVal != null)
	{
		oraclesMap.merchWayMaxDistance = newVal;
		oraclesMap.saveConfig();
		oraclesMap.refresh();
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
	var time = "", padding = 1;
	if (remainingTick > 24) {
		time += (Math.floor(remainingTick / 24)) + 'j ';
		remainingTick = remainingTick - (Math.floor(remainingTick / 24) * 24);
		padding = 2;
	}
	if ((remainingTick-1) > 0) {
		time += pad(remainingTick-1, padding) + 'h';
	}
	if (d.getMinutes() !== 0) {
		time += pad(60 - d.getMinutes(), 2) + 'm';
	}
	
	return time;
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
	if (production.length > 1)
		production = parseInt(production[0]) + parseInt(production[1]);
	else
		production = parseInt(production[0]);

	// Display the remaining time before the warehouse is full
	remainingWarehouseTime();
	
	// Display the remaining time before being able to build every building
	if (location.href.indexOf('bases/view-generator') > -1) {
		remainingGeneratorTime();
	}
	
	// Display the remaining time before being able to research a technology
	if (location.href.indexOf('bases/view-technosphere') > -1) {
		remainingTechnosphereTime();
	}
}

//############################################


//############## QUICK MENUS #################

function addQuickMenus()
{
	var basePath = window.location.href;
	var pos = getPosition(basePath, '/', 4) ;
	basePath = basePath.substring(0, pos+1);

	addMoneyMenu(basePath);
	addLeagueMenu(basePath);
	addAdmiralyMenu(basePath);
}

function addMoneyMenu(basePath)
{
	var moneyMenu = '<span id="moneyMenu" style="position: relative; width: 0; height: 0; display: none">'
				   +'<li style="position: absolute; left: -50px; top: 50px; list-style: none;"><a href="'+basePath+'financial/view-send">Envoi de crédits</a></li>'
				   +'</span>';

	$('.square[title=finances] > img').first().after(moneyMenu);
	
	$('.square[title=finances]').mouseenter(function(){
		clearTimeout($(this).data('timeoutId'));
		$('#moneyMenu').stop(true);
		$('#moneyMenu').fadeIn();
	});
	$('#moneyMenu, .square[title=finances]').mouseleave(function(){
		var elem = $('#moneyMenu');

		timeoutId = setTimeout(function(){
			elem.stop(true);
			elem.fadeOut();
		}, 800);
		$('.square[title=finances]').data('timeoutId', timeoutId);
	});

	$('.square[title=finances]').removeClass("hb");
}


function addLeagueMenu(basePath)
{
	var leagueMenu ='<span id="leagueMenu" style="position: relative; width: 0; height: 0; display: none">'
				   +'<li style="position: absolute; left: -50px; top: 50px; list-style: none;"><a href="'+basePath+'faction/view-election">Election</a></li>'
				   +'<li style="position: absolute; left: -50px; top: 90px; list-style: none;"><a href="'+basePath+'faction/view-forum">Forum</a></li>'
				   +'<li style="position: absolute; left: -50px; top: 130px; list-style: none;"><a href="'+basePath+'faction/view-data">Registres</a></li>'
				   +'<li style="position: absolute; left: -50px; top: 170px; list-style: none;"><a href="'+basePath+'/faction/view-player">Membres</a></li>'
				   +'</span>';

	$('.square[title=faction] > img').first().after(leagueMenu);
	
	$('.square[title=faction]').mouseenter(function(){
		clearTimeout($(this).data('timeoutId'));
		$('#leagueMenu').stop(true);
		$('#leagueMenu').fadeIn();
	});
	$('#leagueMenu, .square[title=faction]').mouseleave(function(){
		var elem = $('#leagueMenu');

		timeoutId = setTimeout(function(){
			elem.stop(true);
			elem.fadeOut();
		}, 800);
		$('.square[title=faction]').data('timeoutId', timeoutId);
	});



	$('.square[title=faction]').removeClass("hb");
}

function addAdmiralyMenu(basePath)
{
	var admiraltyMenu = '<span id="admiraltyMenu" style="position: relative; width: 0; height: 0; display: none">'
					   +'<li style="position: absolute; left: -50px; top: 50px; list-style: none;"><a href="'+basePath+'fleet/view-overview">Aperçu des armées</a></li>'
					   +'<li style="position: absolute; left: -50px; top: 90px; list-style: none;"><a href="'+basePath+'fleet/view-spyreport">Rapports d\'espionnage</a></li>'
					   +'<li style="position: absolute; left: -50px; top: 130px; list-style: none;"><a href="'+basePath+'fleet/view-archive">Archives militaires</a></li>'
					   +'<li style="position: absolute; left: -50px; top: 170px; list-style: none;"><a href="'+basePath+'fleet/view-memorial">Mémorial</a></li>'
					   +'</span>';

	$('.square[title=amirauté] > img').first().after(admiraltyMenu);
	
	$('.square[title=amirauté]').mouseenter(function(){
		clearTimeout($(this).data('timeoutId'));
		$('#admiraltyMenu').stop(true);
		$('#admiraltyMenu').fadeIn();
	});
	$('#admiraltyMenu, .square[title=amirauté]').mouseleave(function(){
		var elem = $('#admiraltyMenu');

		timeoutId = setTimeout(function(){
			elem.stop(true);
			elem.fadeOut();
		}, 800);
		$('.square[title=amirauté]').data('timeoutId', timeoutId);
	});

	$('.square[title=amirauté]').removeClass("hb");
}

//############################################


//################ AOConfig ##################

function AOConfig()
{
	this.config = {};
}
AOConfig.prototype.getValue = function(key)
{
	return this.config[key];
}
AOConfig.prototype.setValue = function(key, val)
{
	if(typeof val === "function"){}
	else
	{
		this.config[key] = val;
		this.saveConfig();
	}
}
AOConfig.prototype.loadConfig = function()
{
	var strData = readCookie("AOconfig");
	
	if(strData){
		var jsonData = eval("(" + strData + ")");

		this.config = jsonData;
	}
}
AOConfig.prototype.saveConfig = function()
{
	var saveData = {};
	for(variable in this.config)
	{
		if(typeof variable === "function"){}
		else
		{
			saveData[variable] = this.config[variable];
		}
	}
	createCookie("AOconfig", JSON.stringify(saveData), 365);
}

var aoConfig = new AOConfig();

//############################################

function addConfigPanel()
{
	var config = '<div class="component hasMover">'
					+'<div class="head skin-5">'
						+'<h2>'
							+'Paramètres de Asylamba\'s Oracle'
						+'</h2>'
					+'</div>'
					+'<div class="fix-body">'
						+'<div class="body" style="top: 0px;">';
							config+='<a href="#" class="on-off-button AO-config '+(aoConfig.getValue("useOraclesMap") ? "" : "disabled")+'" config-attribute="useOraclesMap">Utiliser Oracle\'s Map</a>';
							config+='<a href="#" class="on-off-button AO-config '+(aoConfig.getValue("useRemainingTimes") ? "" : "disabled")+'" config-attribute="useRemainingTimes">Utiliser RemainingTimes</a>';
							config+='<a href="#" class="on-off-button AO-config '+(aoConfig.getValue("useQuickMenus") ? "" : "disabled")+'" config-attribute="useQuickMenus">Utiliser QuickMenus</a>';
							config+='<a href="#" class="on-off-button AO-config '+(aoConfig.getValue("useHorizontalScroll") ? "" : "disabled")+'" config-attribute="useHorizontalScroll">Activer le scrolling horizontal</a>';

							
							

						config+=('</div>'
								+'<a href="#" class="toTop" style="display: none;"></a>'
								+'<a href="#" class="toBottom" style="display: none;"></a>'
							+'</div>'
						+'</div>');

	
	$('#content > div:nth-child(2)').after(config);

	$('.AO-config').on('click', function(){
		var confName = $(this).attr('config-attribute');
		
		if(aoConfig.getValue(confName))
		{
			$(this).addClass("disabled");
			aoConfig.setValue(confName, false);
		}
		else
		{
			$(this).removeClass("disabled");
			aoConfig.setValue(confName, true);
		}
	});
}

//############################################


//########## HORIZONTAL SCROLL ###############

function loadHorizontalScroll()
{
	(function (window, $) {
		$(window).bind("mousewheel");
	  
		// On sauvegarde la position de la souris pour l'avoir dans l'event mousewheel.
		 // Cette event permet de savoir si la souris à bouger
		 $('body').mousemove(function (event) {
			 var __sensibilityPX = 10; // Sensibilité de 10px pour les déplacements involontaire lors du scroll
			 $(this).data("__mousepos", {x: event.clientX, y: event.clientY});
			 
			var pos =  $(this).data("__wheelstartpos");
			 pos = (pos) ? pos : {x: __sensibilityPX * -1, y: __sensibilityPX * -1};
			 
			//  Math.abs: Retourne un entier (pour avoir la différence absolue)
			 if (Math.abs(pos.x-event.clientX) + Math.abs(pos.y-event.clientY) > __sensibilityPX) {
				 $(this).data("__lastiswheel", false).data("__wheelstartpos", false);
			 }
		 });
	  
		$('body').bind("DOMMouseScroll mousewheel", function(event) {
			 //$(this).data("__lastiswheel", false); Désactivation de la fonctionnalité "lastiswheel"
			 event = event.originalEvent;
			 var delta = 0,
				 direction = "",
				 $mover, $c1, $c2,
				 rule2 = false,
				 //On detecte si la souris est sur un element scrollable
				 stop = !!(!$(this).data("__lastiswheel") && ($mover = $(event.target).parents(".hasMover"))[0] &&
						   ($c1 = $mover.children(".fix-body")).height() < ($c2 = $c1.children(".body")).height()),
				 //On detecte si l'utilisateur essaye de scroller horizontalement
				 scrollX = !!(event.wheelDeltaX || event.axis === 1);
	  
			if (event.wheelDelta)
				 delta = event.wheelDelta / 120;
			 else if (event.detail)
				 delta = -event.detail / 2;
				 
			direction = (delta > 0) ? "left" : "right";
			 delta = Math.min(Math.abs(delta), 4); // max = 4
			 
			if ($(event.target).parents("#subnav")[0]) {
				 sbController.move((direction == "left") ? "up" : "down");
				 event.stopPropagation();
				 return;
			 } else if ($(event.target).parents("#action-box")[0]) {
				 if (actionbox.obj && actionbox.obj.stop)
					 actionbox.obj.stop();
				if (direction == "left")
					 actionbox.moveToLeft();
				 else
					 actionbox.moveToRight();
				 event.stopPropagation();
				 return;
			 } else if (stop && !scrollX) { // On autorise la scroll si on est tout en bas ou tout en haut (en fonction de la direction
				 //fix le css et le decalage (provoqué par le margin-top du premier element :first-child)
				 var __cssfix = $c2.css("overflow"),
					 dir = direction[0];
				 $c2.css("overflow", "hidden");
	  
				rule2 = (dir === "r" && $c2.position().top + $c2.height() <= $c1.height()); // droite et tout en bas
				rule2 = (dir === "l" && $c2.position().top >= 0) || rule2; // gauche et tout en haut
	  
				$c2.css("overflow", __cssfix);
				 
				if (rule2) { // "Blocage" forcer à faire un scroll supplementaire pour débloquer le focus
					var last = $(this).data("__lastelwheel"), bool = false;
					 last = (last) ? last : {mover: null, dir: dir, deblocage: false };
					 bool = $mover.is(last.mover) && dir === last.dir;  // Si l'élément est le précédent on scroll (= désactivation du blocage)
					rule2 = (bool && last.deblocage === true);
					 if (last.deblocage === false)
						 last.deblocage = setTimeout(function () {
							 $("body").data("__lastelwheel", {mover: $mover, dir: dir, deblocage: true})
							 console.info("deblocage");
						 }, 200); // blocage de 0.2 sec
					 (!bool && clearTimeout(last.deblocage));
					 $(this).data("__lastelwheel", {mover: $mover, dir: dir, deblocage: (bool) ? last.deblocage : false});
				 } else {
					 $(this).data("__lastelwheel", null);
				 }
				 
				if (!rule2)
					 return;
				 else
					 $(this).data("__lastiswheel", false);
			 }
			
			if(typeof panelController !== 'undefined')
			{
				panelController.move(delta / 4, direction);
				$(this).data("__lastiswheel", true).data("__wheelstartpos", $(this).data("__mousepos"));
				event.stopPropagation();
			}
			
			 
			
		 });
	})(window, window.$);
}

//############################################


//########## TradeRoadProfitability ##########

function initActionBoxObserver()
{
	var target = document.querySelector('#action-box');

	// create an observer instance
	var observer = new MutationObserver(function(mutations) {
		injectTradeRoadProfitability();
	});

	// configuration of the observer:
	var config = { attributes: false, childList: true, characterData: false };

	// pass in the target node, as well as the observer options
	observer.observe(target, config);
	
	// if the action box is already opened at startup
	if ( $('#action-box').children().length > 0 ) {
		injectTradeRoadProfitability();
	}
}

function injectTradeRoadProfitability() 
{
	console.log("action box opened");
	
	var date = new Date();
	date.setMinutes(0);
	
	$('div#action-box li.action div.content div.box[data-id="4"] div.rc').each(function() {
		var income = parseInt($(this).children('span.label-box:eq(0)').children('span.val').text().replace(/ /g, ""));
		var cost   = parseInt($(this).children('span.label-box:eq(1)').children('span.val').text().replace(/ /g, ""));
		
		var ticks  = Math.ceil(cost / income);
		var time   = beautifulTime(ticks, date);
		
		console.log(ticks, time);
		
		$(this).css('margin', '0px');
		$(this).children('span.label-box:eq(1)').after('<span>Rentabilisée en ' + ticks + 'r (' + time + ')</span>');
	});
}

//############################################

//################## LOADER ##################

$(function(){
	var path = window.location.pathname;

	// console.log("Loading Asylamba's Oracle...");

	//load AO config
	aoConfig.loadConfig();

	//quick menus
	var use = aoConfig.getValue("useQuickMenus");
	if(use != undefined)
	{
		if(use)
		{
			addQuickMenus();
		}
	}
	else
	{
		aoConfig.setValue("useQuickMenus", true);
		addQuickMenus();
	}
	

	//Oracle's Map & TradeRoadProfitability
	if(path.indexOf("/map") > -1)
	{
		// TradeRoadProfitability
		initActionBoxObserver();
		// Oracle's Map
		use = aoConfig.getValue("useOraclesMap");
		if(use != undefined)
		{
			if(use)
			{
				loadOraclesMap();
			}
		}
		else
		{
			aoConfig.setValue("useOraclesMap", true);
			loadOraclesMap();
		}
	}

	//remainingTime
	use = aoConfig.getValue("useRemainingTimes");
	if(use != undefined)
	{
		if(use)
		{
			loadRemainingTimes();
		}
	}
	else
	{
		aoConfig.setValue("useRemainingTimes", true);
		loadRemainingTimes();
	}

	use = aoConfig.getValue("useHorizontalScroll");
	if(use != undefined)
	{
		if(use)
		{
			loadHorizontalScroll();
		}
	}
	
	//configPanel
	if(path.slice(1).substring(path.slice(1).indexOf('/'), path.length) == "/params")
	{
		addConfigPanel();
	}
	
	addCss(".red{background: red;}");

	addCss(".blue{background: blue;}");

	addCss(".green{background: green;}");
});


//############################################
