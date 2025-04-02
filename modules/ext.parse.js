"use strict";

/**
 * Functions for deferred/on-demand parsing of wikitext content.
 * based on event trigger options: afterpageload, onscroll, onclick, onsubmit.
 */

jQuery(document).ready(function($) {

	/**
	 * Option 1: trigger=afterpageload (simplest)
	 * @param {*} targets
	 */
	function doDataFetchAfterPageLoad( targets, trigger ) {
		targets.forEach( function ( target ) {
			doApiFetchFromEntry( target, trigger );
		});
	}

	/**
	 * Option 2. trigger=onscroll (Intersection Observer method)
	 * @link https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
	 */
	function doDataFetchThroughObserver( targets, trigger ) {
		// 1. Define IntersectionObserver
		var callbackDataFetch = function ( entries, observer ) {
			entries.forEach( function( entry ) {
				if ( entry.isIntersecting ) {
					doApiFetchFromEntry( entry.target, trigger );
					observer.unobserve( entry.target );
				}
			});
		}
		var options = {
			root: document,
			rootMargin: '0px',
			threshold: 1.0
		};
		var intersectionObserver = new IntersectionObserver( callbackDataFetch, options );
		// 2. Apply to each target
		targets.forEach(function ( target ) {
			intersectionObserver.observe( target );
		});		
	} // end of Observer approach

	/**
	 * @creator DG
	 * Click "Load more..." when scrolled into view.
	 * @link https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
	 * @param {*} target 
	 * @returns 
	 */
	function clickWhenScrolledIntoView( widget ) {
		// 1. Define observer with callback and options
		var callbackDataFetch = function ( entries, observer ) {
			entries.forEach( function( entry ) {
				if ( entry.isIntersecting ) {
					entry.target.click();
					observer.unobserve( entry.target );
				}
			});
		}
		var options = {
			root: document,
			rootMargin: '0px',
			threshold: 1.0
		};
		var intersectionObserver = new IntersectionObserver( callbackDataFetch, options );
		// 2. Bind observer to the widget
		intersectionObserver.observe( widget );
	}

	/**
	 * Option 3: trigger=onclick
	 */
	function doDataFetchOnClick( targets, trigger ) {
		targets.forEach( function ( target ) {
			var triggerId = target.getAttribute( 'data-trigger-id' );
			// @todo classes?
			var clickable = document.getElementById( triggerId );
			clickable.addEventListener( 'click', function() {
				doApiFetchFromEntry( target, trigger );
			});
		});
	}

	/**
	 * Option 4: trigger=onsubmit (form)
	 * @param {*} targets
	 */
	function doDataFetchOnSubmit( targets, trigger ) {
		// @todo bind to event first
		targets.forEach( function ( target ) {
			var triggerId = target.getAttribute( 'data-trigger-id' );
			var doUpdateUrl = target.getAttribute( 'data-update-url' );
			var shouldUpdateUrl = ( doUpdateUrl === 'true' || doUpdateUrl === '1' );
			addEventListenerToForm( triggerId, target, shouldUpdateUrl, trigger );
			// Always render on page load?
			if ( shouldUpdateUrl ) {
				var currUrlParams = new URLSearchParams( window.location.search );
				//console.log( "currUrlParams: " + currUrlParams );
				// @todo - should we check if currUrlParams is empty?
				updateParsableStrFromUrl( target, currUrlParams );
			} else {
				updateParsableStrFromHtml( target );
			}
			doApiFetchFromEntry( target, trigger );
		});
	}

	/**
	 * Helper for doDataFetchOnSubmit().
	 * On submit, prevent page refresh and attach events
	 * Update URL params and ...
	 * @param string triggerId
	 */
	function addEventListenerToForm( triggerId, target, shouldUpdateUrl = true, trigger = "onsubmit" ) {
		var valsep = target.getAttribute( "data-valsep" );
		var form = document.getElementById( triggerId );
		console.log( 'triggerId: ' + triggerId );
		// cf. form.addEventListener( 'submit', function( e ) {)
		form.onsubmit = function( e ) {
			e.preventDefault();
			// 1. Get FormData
			var formData = new FormData( form );
			for (let entry of formData) {
				console.log( entry );
			}
			// 2. Update JSON from FormData
			var jsonObj = {};
			formData.forEach(function( value, key ) {
				if ( jsonObj[key] == undefined ) {
					jsonObj[key] = value;
				} else {
					// Handle arrays
					jsonObj[key] += valsep + value;
				}
			});
			var newJsonStr = JSON.stringify( jsonObj );
			//console.log(  "newJsonStr: " + newJsonStr );
			target.setAttribute( "data-json", newJsonStr );
			
			// 3. Update the URL params
			if ( shouldUpdateUrl ) {
				// https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
				var newUrlParams = new URLSearchParams( formData );
				// Check if current URL uses ?title=<fullpagename>, which is outside the scope of the form
				var currUrlParams = new URLSearchParams( window.location.search );
				if ( currUrlParams.has('title') ) {
					var titleParam = currUrlParams.get('title');
					newUrlParams.set( 'title', titleParam );
				}
				// Reset to 0
				newUrlParams.set( "offset", "0" );
				updateUrlParams( newUrlParams, null );
			}
			// 4. Special handling for FlexForm.
			var submitEls = form.querySelectorAll( ".flexform-disabled" );
			if ( submitEls !== null ) {
				submitEls.forEach( function( el ) {
					el.disabled = false;
					el.classList.remove( 'flexform-disabled' );
				});
				// form.querySelector( ".flex-form-spinner" ).classList.remove( 'active' );
			}		
			// 5. @todo also necessary when page loads from URLs, so envelop within function.
			// Alternatively, this could be part of addFormListener
			if ( target.hasAttribute( 'data-pagination-id' ) ) {
				// nothing...
			}
			if ( target.hasAttribute( 'data-loadmore-id' ) ) {
				// ... 
			}
			// 6. 
			updateParsableStrFromHtml( target );
			doApiFetchFromEntry( target, trigger );
		}
	}

	/**
	 * Utility
	 * @param {*} newUrlParams 
	 * https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
	 */
	function updateUrlParams( urlSearchParams, newParams = null ) {
		if ( newParams !== null ) {
			for ( let [k,v] of Object.entries( newParams ) ) {
				urlSearchParams.set(k,v);
			};
		}
		// console.log( '//' + location.host + location.pathname );
		var newPageUrl = window.location.href.split('?')[0].split("#")[0] + "?" + urlSearchParams.toString();
		// console.log( newPageUrl );
		window.history.replaceState( null, "", newPageUrl );
	}

	/**
	 * Helper function for updateParsableStrFromHtml(), olim updateParsableStr()
	 * JS equivalent of CRLazy::replaceVars()
	 * @todo {$var1 : default=foo : sep=; }
	 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_the_replacement
	 * @param string str
	 * @param array urlSearchParams
	 */
	function replaceVars( 
		str,
		urlSearchParams = false,
		jsonArgsObj = false,
		sep = ";"
	) {
		//let pattern = /\{\$([^{}]*)\}/gm;
		let pattern = /\{\{\{\$([^{}]*)\}\}\}/gm;
		let callback = function( match ) {		
			if ( urlSearchParams ) {
				// {{$hey:...:...}}
				// var matchKeyArr = match.replace( /^\{\$+|\}+$/gm, '').split(":");
				var matchKeyObj = match.replace( /^\{\{\{\$+|\}\}\}+$/gm, '').split("\|");
				var matchKey = matchKeyObj[0];
				var defaultVal = ( 1 in matchKeyObj ) ? matchKeyObj[1] : "";
				// console.log( "matchKey (urlSearchParams): " + matchKey );
				var matchVal = urlSearchParams.getAll(matchKey).join( sep ) ?? defaultVal;
				return matchVal;
			} else if( jsonArgsObj ) {
				// jsonObject
				var matchKeyObj = match.replace( /^\{\{\{\$+|\}\}\}+$/gm, '').split("\|");
				var matchKey = matchKeyObj[0];
				var defaultVal = ( 1 in matchKeyObj ) ? matchKeyObj[1] : "";
				// @todo what about multiple values?
				var matchVal = ( matchKey in jsonArgsObj) ? jsonArgsObj[matchKey] : defaultVal;//@todo nothing
				return matchVal;
			} else {
				return "";
			}
		};
		let newStr = str.replace( pattern, callback );
		return newStr;
	}

	/**
	 * NOT USED
	 * Helper function for addListenerToForm()
	 * Currently unused but localMapping might become useful.
	 * Adds URL parameters to an object.
	 * Maybe add feature to map url param names to local param names?
	 * @link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
	 * @param {*} localMapping
	 */
	function createMapObjectFromUrl( localMapping = null ) {
		var urlSearchParams = new URLSearchParams( window.location.search );
		//console.log( urlSearchParams );
		return urlSearchParams;
		// update e.g. window.history.pushState( null, null, newParams );
	}

	/**
	 * URL params used only after page initialises.
	 * Old system assuming we're working with url and the json hasn't been updated yet.
	 * Update the parsable string after replacing variables.
	 */
	function updateParsableStrFromUrl( entryTarget, urlSearchParams = false ) {	
		if ( !urlSearchParams ) {
			return;
		}
		// 1. Add args as json string to target attrib. 
		var jsonStr = JSON.stringify( Object.fromEntries(urlSearchParams) );
		//console.log( jsonStr );
		entryTarget.setAttribute('data-json', jsonStr );
		
		// 2. Substitute vars and add parsable string to attrib.
		var toParseModel = entryTarget.getAttribute('data-parse-model');	
		// var toParseModel = decodeHtml( toParseModel );
		var toParse = replaceVars( toParseModel, urlSearchParams, false );
		entryTarget.setAttribute('data-parse', toParse );
		// Done
	}

	// Alternative not replying on url search params
	function updateParsableStrFromHtml( entryTarget ) {
		// Get arguments
		var jsonStr = entryTarget.getAttribute('data-json' );
		var jsonArgs = ( jsonStr !== "" ) ? JSON.parse( jsonStr ) : {};
		// Replace vars
		var toParseModel = entryTarget.getAttribute('data-parse-model');
		// var toParseModel = decodeHtml( toParseModel );
		var toParse = replaceVars( toParseModel, false, jsonArgs );
		// 
		entryTarget.setAttribute('data-parse', toParse );
		// Done
	}

	/**
	 * Test - update object with newParams obj. Update e.g. offset=20
	 * @todo use JSON not URL params; ... 
	 * @param {*} entryTarget  
	 * @param {*} newParams 
	 * @param {*} urlSearchParams
	 */
	function modifyParsableJson( entryTarget, newParams = null ) {
		var jsonStr = entryTarget.getAttribute('data-json');
		var jsonObj = {};
		var jsonObj = JSON.parse( jsonStr );
		if ( jsonObj == null ) {
			console.log( "Mmmm, jsonObj is null." );
			console.log( "Mmmm, jsonObj is null." );
		}
		for ( let [k,v] of Object.entries( newParams ) ) {
			jsonObj[k] = v;
		};
		entryTarget.setAttribute('data-json', JSON.stringify( jsonObj ) );
	}

	function modifyParsableUrl( urlSearchParams, newParams = null ) {
		if ( urlSearchParams !== null ) {
			for ( let [k,v] of Object.entries( newParams ) ) {
				urlSearchParams.set( k,v);
			};
			updateUrlParams( urlSearchParams, null );
		}
	}


	/**
	 * Finally, fetch parsed content and add it to page.
	 * All trigger options.
	 * 
	 * @param {*} entryTarget
	 * @param {string} trigger
	 * @param {bool} overrulingTargetAction
	 * @param {bool} decode
	 * @returns {*}
	 */
	function doApiFetchFromEntry( entryTarget, trigger = "", overrulingTargetAction = false ) {
		if ( typeof(entryTarget) == 'undefined' ) {
			return;
		}
		var toparse = entryTarget.getAttribute('data-parse');
		var toparse = decodeHtml( toparse );
		var fullpagename = entryTarget.getAttribute('data-fullpagename');
		var targetAction = ( !overrulingTargetAction ) ? entryTarget.getAttribute('data-target-action') : overrulingTargetAction;

		var params = {
			action: 'parse',
			contentmodel: 'wikitext',
			format: 'json',
			title: fullpagename,
			text: toparse
		};
		// Fetch parameters from source
		var api = new mw.Api();
		api.post( params ).done( function ( data ) {
			var res = data.parse.text['*'];
			addResultToTarget( entryTarget, res, targetAction );
			// Doing so here in case it is part of rendered output.
	
			var pagination = false;
			var paginationId = entryTarget.getAttribute( 'data-pagination-id' );
			var paginationClass = entryTarget.getAttribute( 'data-pagination-class' );
			if ( paginationId !== null && paginationId !== "" ) {
				var pagination = document.getElementById( paginationId );			
			} else if( paginationClass !== null && paginationClass !== "" ) {
				var pagination = entryTarget.querySelector( paginationClass );
			}
			if ( pagination ) {
				renderPagination( entryTarget, pagination );
			}

			// loadMore
			var widgetId = entryTarget.getAttribute( 'data-loadmore-id' );
			if ( widgetId !== null && widgetId !== "" ) {
				// Add event listener to widget; updated with next offset 
				renderLoadMore( entryTarget, widgetId );
				// Move widget to bottom
				//entryTarget.appendChild( widget );
			}
			var spinners = entryTarget.querySelectorAll( ".spinner-dual-ring" );
			spinners.forEach( function( spinner ) {
				spinner.remove();
			});
		} )
		.fail( function (data) {
			console.log( 'Failed to load', data );
			//var res = "<div>" + data + " error</div>";
			var res = "<div></div>";
			addResultToTarget( entryTarget, res, targetAction );
		});
		
	}

	/**
	 * Helper function for doApiFetchFromEntry()
	 * @param {*} entryTarget 
	 * @param {*} res 
	 * @param {*} targetAction 
	 */
	function addResultToTarget( entryTarget, res, targetAction ) {
		if ( targetAction == "replace" ) {
			entryTarget.innerHTML = res;
		} else if( targetAction == "append" ) {
			entryTarget.innerHTML = entryTarget.innerHTML + res;
		} else if( targetAction == "prepend" ) {
			entryTarget.innerHTML = res + entryTarget.innerHTML;
		}
	}

	function renderLoadMore( target, widgetId ) {
		// 1. Find HTML element
		var widget = document.getElementById( widgetId );	
		if ( !widget ) {
			return;
		}
		// 2. Collect data. Hide if there are no further results to load.
		var trigger = widget.getAttribute('data-trigger'); //onclick or onscroll
		var total = widget.getAttribute('data-total');
		var prevLimit = widget.getAttribute('data-limit-prev');
		var prevOffset = widget.getAttribute('data-offset-prev');
		var nextOffset = ( Number(prevOffset) + Number(prevLimit) );
		if ( nextOffset > total ) {
			console.log( `Removing widget because total ${nextOffset} > ${total}...` );
			// widget.remove();
			widget.hidden = true;
			widget.disabled = true;
			return;
		}
		// 2. Add event listener
		addObserverToLoadMore( widget, target );
		// 3. Move widget to bottom
		// @maybe doubly ensure position is at the end
		target.appendChild( widget );
	}

	function addObserverToLoadMore( widget, target ) {
		widget.addEventListener( "click", function() {
			// 1. Add spinner as data are getting fetched
			const spinner = createSpinner( "" );
			target.appendChild( spinner );
			// 2. get data from target
			var total = widget.getAttribute('data-total');
			var prevLimit = widget.getAttribute('data-limit-prev');
			var nextLimit = widget.getAttribute('data-limit-next');
			if ( nextLimit == null || nextLimit == "" ) {
				var nextLimit = prevLimit;
			}
			var currOffset = widget.getAttribute('data-offset-prev');
			var offsetName = widget.getAttribute('data-offset-name');
			var nextOffset = ( Number(currOffset) + Number(prevLimit) );
			// Do not show
			var newParams = {
				offset: String(nextOffset),
				limit: nextLimit
			};
			// 3. Modify JSON args in HTML
			modifyParsableJson( target, newParams );

			/* 4. url @todo
			if ( shouldUpdateUrl == true ) {
				console.log( "yes, modifyParsableUrl" );
				//modifyParsableUrl( urlSearchParams, newParams );
				updateUrlParams( urlSearchParams, newParams );
			} */

			// 5. Remove old widget before new one gets added.
			// Only if widget is part of parsed output?
			widget.remove();

			// 6. Update parsable string by updating vars
			updateParsableStrFromHtml( target );
			// 7. Render and append content
			doApiFetchFromEntry( target, "onsubmit", "append" );
			// 8. Add widget
			// widget.setAttribute( "data-offset", nextOffset );		
		});
		// only if widget's trigger=onscroll, click button when scrolled into view.
		var trigger = widget.getAttribute( "data-trigger" );
		if ( trigger !== null && trigger == "onscroll" ) {
			clickWhenScrolledIntoView( widget );
		}
	}

	/**
	 * 
	 * @param {*} target 
	 * @param {*} pagination 
	 */
	function renderPagination( target, pagination ) {
		// 1. Collect data from input
		var total = pagination.getAttribute('data-total');
		var currLimit = pagination.getAttribute('data-limit');
		var currOffset = pagination.getAttribute('data-offset');
		var offsetName = pagination.getAttribute('data-template') + '[offset]'; //e.g. 'Query texts[offset]'
		var maxPages = pagination.getAttribute('data-max-pages');
		var ulClass = pagination.getAttribute('data-class') ?? "pr-pagination";
		// console.log( `total: ${total}, limit: ${currLimit} ` );
		// 2. Build the HTML
		var fullStr = buildPaginationList( total, currLimit, currOffset, ulClass, maxPages );
		pagination.innerHTML = fullStr;

		addObserverToPagination( pagination, target );
	}

	/**
	 * HTML for Bootstrap-styled pagination
	 * @param integer total 
	 * @param integer currLimit 
	 * @param integer currOffset
	 * @param string ulClass
	 * @returns 
	 */
	function buildPaginationList( total, currLimit, currOffset, ulClass, maxPages = null ) {
		var pageCount = ( Math.ceil( total / currLimit ) );
		if ( pageCount == 1 ) {
			// No need to show pagination
			console.log( "page count is 1. No need to show pagination" );
			return "";
		}
		var strBeg = `<ul class="${ulClass}">`;
		var strEnd = `</ul>`;
		var str = '';
		var firstItem = lastItem = ``;

		// < Previous and Next >
		if ( Number(currOffset) !== 0 ) {
			var prevOffset = ( currOffset - currLimit );
			var prevIndicator = `<div class="page-item"><button class="page-link" data-indicator='sibling' data-target-offset="${prevOffset}">❮</button></div>`;
		} else {
			var prevIndicator = `<div class="page-item disabled"><button class="page-link" disabled="" data-indicator='sibling' data-target-offset="0">❮</button></div>`;
		}
		// example pageCount = 334, 50/50 50/50 50/50 50 next
		// if currOffset 0, then next offset=50
		// Next >
		var nextOffset = Number(currOffset) + Number(currLimit);
		//console.log( `nextOffset: ${nextOffset} / total: ${total} /  pageCount: ${pageCount} .` );
		if ( nextOffset < Number(total) ) {
			var nextIndicator = `<div class="page-item"><button class="page-link" data-indicator='sibling' data-target-offset="${nextOffset}">❯</button></div>`;
		} else {
			var nextIndicator = `<div class="page-item disabled"><button class="page-link" disabled="" data-indicator='sibling'>❯</button></div>`;
		}

		// @todo - whether to show start/end

		// What to show if page indicators are restricted in number
		var currPage = ( Math.ceil( currOffset / currLimit ) );
		//console.log( "maxPages: " + maxPages );
		if ( maxPages == null || maxPages == "" ) {
			var pageStart = 0;
			var pageEnd = pageCount;
		} else if ( pageCount > maxPages ) {
			// More pages that can fit inside
			var maxPages = Number(maxPages); // e.g. 10
			var middleNumber = ( Math.floor( maxPages / 2 ) ); // 5
			// if pageCount > maxPages
			// current page number starting with 0
			// console.log( "current page, minus 1: " + currPage );

			// curr=1, then show 1-10
			// curr=2 or 3 or 4, same
			// curr=5, then slide start with currPage - middleNumber

			if ( currPage < middleNumber ) {
				// starting out, eg if 4 < 5
				var pageStart = 0;
				var pageEnd = maxPages;	
			} else {
				// start sliding to new start
				var pageStart = currPage - middleNumber;
				var pageEnd = currPage + ( maxPages - middleNumber );
				// towards the end
				if ( pageEnd > pageCount ) {
					var pageEnd = pageCount;
				}
			}
		} else {
			// Fewer results. No need for special handling.
			var pageStart = 0;
			var pageEnd = pageCount;
		}

		// Numbered links
		for (var i = pageStart; i < pageEnd; i++) {
			var targetOffset = i * currLimit;
			var classActive = ( targetOffset == currOffset ) ? 'active' : '';
			var visibleNumber = (i + 1);
			str += `<li class="page-item ${classActive}"><button class="page-link" data-indicator='number' data-target-offset="${targetOffset}">${visibleNumber}</button></li>`;
		}

		// to FIRST
		if ( currPage > middleNumber ) {
			var firstItem = `<li class="page-item"><button class="page-link" data-indicator='number' data-target-offset="0">1</button></li>`;
			firstItem += `<li class="page-item disabled"><button class="page-link" data-indicator="ellipsis">&hellip;</button></li>`;
		}
		// to LAST
		var cutoff = ( pageCount - ( maxPages - middleNumber ) );
		if ( currPage < cutoff ) {
			var lastOffset = ( pageCount - 1 ) * currLimit;
			var lastVisible = pageCount;
			console.log( `pageCount: ${pageCount} / lastOffset: ${lastOffset} / lastVisible: ${lastVisible} ` );
			var lastItem = "";
			if ( currPage < ( cutoff - 1 ) ) {
				// Ellipsis. No need for it in penultimate position.
				lastItem += `<li class="page-item disabled"><button class="page-link" data-indicator="ellipsis">&hellip;</button></li>`;
			}
			lastItem += `<li class="page-item"><button class="page-link" data-indicator='number' data-target-offset="${lastOffset}">${lastVisible}</button></li>`;
		}

		// str += `<li class="page-item ${classActive}"><button class="page-link" data-indicator='number' data-target-offset="${targetOffset}">${visibleNumber}</button></li>`;

		var fullStr = "<nav class='pr-pagination-nav'>" + prevIndicator + strBeg + firstItem + str + lastItem + strEnd + nextIndicator + "</nav>";

		return fullStr;
	}

	function addObserverToPagination( pagination, target ) {
		var btnsArr = pagination.querySelectorAll('.page-link');
		var doUpdateUrl = target.getAttribute('data-update-url');
		var shouldUpdateUrl = ( doUpdateUrl === 'true' || doUpdateUrl === '1' );

		btnsArr.forEach( function( btn ) {
			var indicatorType = btn.getAttribute( 'data-indicator' );
			btn.addEventListener( "click", function() {
				// 0. Temporary style change
				for (const child of target.children ) {
					child.style.opacity = '0.6';
				}
				pagination.style.opacity = '1.0';
				if ( pagination.previousElementSibling !== null ) {
					//pagination.previousElementSibling.style.opacity = '0.6';
				}
				if ( pagination.nextElementSibling !== null ) {
					//pagination.nextElementSibling.style.opacity = '0.6';
				}
				// 1. Get value for new offset
				//console.log( "addObserverToPagination... ");
				var targetOffset = btn.getAttribute('data-target-offset');
				// @todo custom offset name
				var newParams = { offset: targetOffset };
				// console.log( newParams );
				// 2. Update in JSON and maybe URL
				modifyParsableJson( target, newParams );
				var urlSearchParams = new URLSearchParams( window.location.search );
				//console.log( "urlSearchParams: " + urlSearchParams );
				if ( shouldUpdateUrl == true ) {
					//modifyParsableUrl( urlSearchParams, newParams );
					updateUrlParams( urlSearchParams, newParams );
				}
				// 3. Update parsable string by updating vars
				// updateParsableStr( target, urlSearchParams, false );
				updateParsableStrFromHtml( target );
				// 4. Render
				doApiFetchFromEntry( target, "onsubmit" );
				// 5. Adjust styling:
				if ( indicatorType !== 'sibling' ) {
					pagination.querySelector('.active').classList.remove('active');
					btn.parentElement.classList.add('active');	
				}
				// 6. Finally, scroll element into view
				scrollParentToTop( target );
			});
		});
	}

	// Utility
	function createSpinner( text = "" ) {
		const spinner =  document.createElement( "span" );
		spinner.setAttribute( "class", "spinner-dual-ring" );
		const textNode = document.createTextNode( text );
		//  TypeError: Node.appendChild: Argument 1 is not an object.
		spinner.appendChild( textNode );
		return spinner;
	}

	// Utility
	function scrollParentToTop( target ) {
		// Because not all body content starts at 0 :
		let bodyOffset = document.getElementsByClassName('mw-body')[0].offsetTop;
		// Action
		window.scrollTo({
			behavior: 'smooth',
			top: ( target.offsetParent.offsetTop - bodyOffset )
		});
	}

	function getAllSiblings( elem, filter) {
		var sibs = [];
		var elem = elem.parentNode.firstChild;
		do {
			if ( elem.nodeType === 3) continue; // text node
			if (!filter || filter(elem)) sibs.push(elem);
		} while (elem = elem.nextSibling)
		return sibs;
	}

	/**
	 * Helper function for decoding string in data attribute
	 * to input for the parser.
	 * @param str html 
	 * @returns str
	 */
	function decodeHtml( html ) {
		var txt = document.createElement("textarea");
		txt.innerHTML = html;
		return txt.value;
	}

	// If parser function is used, init js
	if ($(".cr-parse-request")[0]) {
		// Option 1
		var targetsAfterPageLoad = document.querySelectorAll( "[data-parse][data-trigger='afterpageload']" );
		doDataFetchAfterPageLoad( targetsAfterPageLoad, "afterpageload" );
		// 2
		var targetsOnScroll = document.querySelectorAll( "[data-parse][data-trigger='onscroll']" );
		doDataFetchThroughObserver( targetsOnScroll, "onscroll" );
		// 3
		var targetsOnClick = document.querySelectorAll( "[data-parse][data-trigger='onclick']" );
		doDataFetchOnClick( targetsOnClick, "onclick" );
		// 4
		var targetsOnSubmit = document.querySelectorAll( "[data-parse][data-trigger='onsubmit']" );
		doDataFetchOnSubmit( targetsOnSubmit, "onsubmit" );
	}

});
