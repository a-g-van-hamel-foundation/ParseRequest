"use strict";

/**
 * Unused: see ext.parse.js :: renderPagination for latest version
 * But consider 
 * @param HTMLElement targetEl
 * @returns 
 */
var createPagination = function createPagination( targetEl ) {
	if ( !targetEl ) {
		console.log( "No target defined for createPagination()." );
		return;
	}
	// Collect data from input
	var total = targetEl.getAttribute('data-total');
	var currLimit = targetEl.getAttribute('data-limit');
	var currOffset = targetEl.getAttribute('data-offset');
	var offsetName = targetEl.getAttribute('data-template') + '[offset]'; //e.g. 'Query texts[offset]'
	var ulClass = targetEl.getAttribute('data-class');

	// Build the HTML
	var fullStr = buildPaginationList( total, currLimit, currOffset, ulClass );
	targetEl.innerHTML = fullStr;

	// Get data from URL?
	var searchParams = new URLSearchParams(window.location.search);

	// Adding events is left to ext.lazy.js
}

/**
 * Pagination #cr-pfquery-pagination
 */
function createPFPagination( targetEl ) {
		// 1. Collect data from input
		//var targetEl = document.getElementsByClassName( 'pfquery-pagination-widget' )[0];
		var total = targetEl.getAttribute('data-total');
		//var templateName = targetEl.getAttribute('data-template');
		var currOffset = targetEl.getAttribute('data-offset');
		var currLimit = targetEl.getAttribute('data-limit');
		var offsetName = targetEl.getAttribute('data-template') + '[offset]'; //e.g. 'Query texts[offset]'

		// 2. Build HTML
		var fullStr = buildPaginationList( total, currLimit, currOffset, "pr-pagination pr-pagination-lg" );
		targetEl.innerHTML = fullStr;

		// 
		var protocol = window.location.protocol;
		var host = window.location.host;
		var pathName = window.location.pathname;
		var baseUrl = protocol + "//" + host + pathName;
		//console.log( 'baseUrl is ' + baseUrl );

		var searchParams = new URLSearchParams( window.location.search );
		//console.log( 'Raw searchParams are ' + searchParams);
		// Unused:
		var inputsObj = createJSONfromURLParams( searchParams );
		var urlOffset = inputsObj[ offsetName ];
		
		var btnsArr = [];
		var btnsArr = targetEl.querySelectorAll('.page-link');
		var spinnerEl = document.getElementsByClassName( 'spinner-background' )[0];		
		btnsArr.forEach( function( btn ) {
			btn.addEventListener( "click", function() {
				var searchParams = new URLSearchParams(window.location.search);
				var targetOffset = btn.getAttribute('data-target-offset');
				setOffset( baseUrl, searchParams, offsetName, targetOffset );
				//spinner.classList.remove("active");
				targetEl.querySelector('.active').classList.remove('active');
				//btn.parentElement.classList.add('active');
				btn.classList.add('loading');
				showSpinner( spinnerEl );
				scrollToTopSmoothly();
			}, false);
		});

}

	/**
	 * Builds the plain HTML of the pagination widget.
	 * @param integer total
	 * @param integer currLimit
	 * @param integer currOffset
	 * @param string class
	 * @returns string
	 */
	function buildPaginationList( total, currLimit, currOffset, ulClass ) {
		var pageCount = ( Math.ceil( total / currLimit ) );
		var strBeg = `<ul class="${ulClass}">`;
		var strEnd = `</ul>`;
		var str = '';
		for (var i = 0; i < pageCount; i++) {
			var targetOffset = i * currLimit;
			//console.log( 'local offset is ', targetOffset);
			var classActive = ( targetOffset == currOffset ) ? 'active' : '';
			var visibleNumber = (i + 1);
			str += `<li class="page-item ${classActive}"><button class="page-link" data-target-offset="${targetOffset}">${visibleNumber}</button></li>`;
		}
		var fullStr = strBeg + str + strEnd;
		return fullStr;
	}

	/**
	 * @param URLSearchParams urlSearchParams (object)
	 * @returns object
	 */
	function createJSONfromURLParams( urlSearchParams ) {
		/* urlSearchParams.forEach( (value, key) => {
			newJSON.append(key, value);
		}); */

		var entries = urlSearchParams.entries();
		var objJSON = Object.fromEntries( entries );
		return objJSON;
	}

	function setOffset( baseUrl, searchParams, offsetName, targetOffset ) {
		searchParams.set(offsetName, targetOffset);
		var newUrl = baseUrl + '?' + searchParams;
		window.history.pushState( { path:newUrl }, '', newUrl );
		location.reload();
		window.onbeforeunload = function() {
			 window.scrollTo(0, 0);
		 }
	}

	/* Clears the url */
	function resetOffset( formClass, offsetClass ) {
		//var formClass = "#wpRunQuery";
		var offsetInput = document.getElementsByClassName( offsetClass )[0];
		offsetInput.value = '0';
		$( formClass ).on( "submit", function( event ) {
			var offsetInput = document.getElementsByClassName( offsetClass )[0];
			offsetInput.value = '0';
		});
	}

	/**
	 * @param HTMLElement spinnerEl 
	 */
	function showSpinner( spinnerEl ) {
		console.log( "Trying spinner ");
		spinnerEl.classList.remove( 'cr-hidden' );
		spinnerEl.classList.add( 'cr-centred' );
	}

/**
 * On refresh, scroll to top rather than stick to the bottom of the page
 */
function scrollToTopSmoothly() {
	//'html, body' or window?
	$('html, body').delay(100).animate({
		scrollTop: 0
	}, 700, function(){ });
}

jQuery(document).ready(function($) {

	if ( $( ".pf-offset" )[0] ) {
		resetOffset( "#wpRunQuery", "pf-offset" );
	}
	/*while(!document.querySelector(".my-selector")) {
		await new Promise(r => setTimeout(r, 500));
	}*/

	/* See now ext.parse.js instead
	if ( $( ".pr-pagination-widget")[0] ) {
		// var targetEl = document.getElementsByClassName( "pr-pagination-widget" )[0];
		// createPagination( targetEl );
	}
	*/

	// Page Forms:
	if ( $( ".pfquery-pagination-widget" )[0] ) {
		var targetEl = document.getElementsByClassName( "pfquery-pagination-widget" )[0];
		createPFPagination( targetEl );
	}

});

module.exports = createPagination;
//module.exports = function() {
//  return ..;
//}