<?php

/**
 * Documents the parameters of parser functions
 * @todo Add other parser functions
 */

namespace ParseRequest\ParserFunctions;

use \ExtensionRegistry;

class PRParserFunctionsInfo {

	/**
	 * Self-documentation.
	 * @todo
	 */
	public static function getParserFunctionInfo() {
		$name = "parse-request";
		$parameters = [
			"1" => [
				"description" => "Code to be expanded lazily or reactively. It must be placed within `nowiki` tags, except for those parts that should be parsed in advance."
			],
			"default" => [
				"description" => "What to return if the result is empty.",
				"default" => ""
			],
			"class" => [
				"description" => "Additional classes to be added to the HTML element. Optional.",
				"default" => ""
			],
			"id" => [
				"description" => "Defaults to `cr-parse-request-` followed by a random number.",
			],
			"fullpagename" => [
				"description" => "Ignore."
			],
			"trigger" => [
				"description" => "The event to be listened to for triggering the delivery of parsed content.",
				"options" => [
					"afterpageload" => "Directly after the page has loaded (no particular event)",
					"onscroll" => "When the relevant HTML element is scrolled into view",
					"onsubmit" => "When the user submits the form",
					"onclick" => "When the user clicks an HTML element"
				],
				"default" => "afterpageload"
			],
			"targetaction" => [
				"description" => "Where to place the newly rendered content and what to do with the previous content.",
				"options" => [
					"replace" => "Replace the previously rendered content with newly rendered content.",
					"prepend" => "Preserve older content and add new content before it.",
					"append" => "Preserve older content and add new content after it."
				],
				"default" => "replace"
			],
			"triggerid" => [
				"description" => "The HTML id of the clickable element (onclick) or form (onsubmit) on the page.",
			],
			"loadmoreid" => [
				"description" => "Unique HTML id of the 'load more' widget if such a widget is used.",
			],
			"paginationid" => [
				"description" => "Unique HTML id of the pagination widget if such a widget is used.",
			],
			"valsep" => [
				"description" => "The separator to be used for an array of values, in particular values that come from form data. Defaults to a semi-colon.",
				"default" => ";"
			],
			"updateurl" => [
				"description" => "Whether to update the URL and its parameters ('true' (default) or 'false'). Can be useful to allow for bookmarking a particular query. When working with multiple forms on a page, however, it is recommended to switch it off.",
				"default" => "true"
			]
		];
		$res = [
			"name" => $name,
			"parameters" => $parameters
		];
		$registry = ExtensionRegistry::getInstance();
		if ( $registry->isLoaded( 'SyntaxHighlight' ) == true || $registry->isLoaded( 'highlight.js integration' ) == true ) {
			$str = "<syntaxhighlight lang='json'>" . json_encode( $res, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) . "</syntaxhighlight>";
		} else {
			$str = "<pre lang='json'>" . json_encode( $res, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) . "</pre>";
		}
		return $str;
	}

}
