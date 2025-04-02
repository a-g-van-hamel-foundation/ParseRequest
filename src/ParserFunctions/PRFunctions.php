<?php

/**
 * The parser functions used to perform parse requests.
 * 
 * `#parse-request` 
 * `#preparse-request`
 */

namespace ParseRequest\ParserFunctions;

use ParseRequest\PRUtils;
use MediaWiki\Parser\ParserOutput;

class PRFunctions {

	public function __construct() {
		//	
	}

	public function runParseRequest( $parser, $frame, $args ) {
		$paramsAllowed = [
			"input" => trim( $args[0] ),
			"default" => false,
			"fullpagename" => $parser->getTitle()->getPrefixedText(),
			// event trigger, incl. afterpageload; onscroll; onsubmit; onclick
			"trigger" => "afterpageload",
			// append, prepend, replace
			"targetaction" => "replace",
			"valsep" => ";",
			"triggerid" => false,
			"loadmoreid" => false,
			"paginationid" => false,
			"updateurl" => "true",
			// additional classes
			"class" => "",
			"id" => "cr-parse-request-" . rand(10000,99999)
		];
		list( $input, $defaultContent, $fullpagename, $trigger, $targetAction, $valSep, $triggerId, $loadmoreId, $paginationId, $doUpdateUrl, $class, $id ) = array_values( PRUtils::extractParams( $frame, $args, $paramsAllowed ) );

		// Remove nowiki strip markers
		$input = $parser->recursivePreprocess( $input );
		// Replace newlines to prevent insertion of paragraphs 
		$input = str_replace( "\n", " ", $input );

		if ( $defaultContent == false || $defaultContent == "" ) {
			$defaultContent == "";
		} else {
			$varReplacedContent = self::replaceVars( $defaultContent, [] );
			$defaultContent = $parser->recursiveTagParse( $varReplacedContent );
		}

		// Load module only once
		$this->loadModules( $parser->getOutput() );

		// $res = "<div class='cr-lazy' data-fetch='&lt;nowiki&gt;$input&lt;\/nowiki&gt;'>$nowiki</div>";
		//$res = "<div class='cr-lazy' data-fetch='$input'>$nowiki</div>";
		$res = self::createLazy( $input, $defaultContent, $trigger, $fullpagename, $targetAction, $valSep, $triggerId, $loadmoreId, $paginationId, $doUpdateUrl, $class, $id );
		return [ $res, 'noparse' => true, 'isHTML' => true ];
	}

	/**
	 * `#preparse-request: foobar |tagsallowed= `
	 * Run a pre-parse on the string to get HTML
	 * and strip tags not explicitly allowed
	 * 
	 * Experimental
	 * @return string
	 */
	public function runPreParseRequest( $parser, $frame, $args ) {

		$paramsAllowed = [
			"input" => trim( $args[0] ),
			"tagsallowed" => "",
		];
		list( $input, $tagsAllowedStr ) = array_values( PRUtils::extractParams( $frame, $args, $paramsAllowed ) );
		$tagsAllowedArr = explode( ",", $tagsAllowedStr );

		// preparse
		$str = $parser->recursiveTagParseFully( $input );

		// strip tags except those we do want
		$str = strip_tags( $str, $tagsAllowedArr );

		$this->loadModules( $parser->getOutput() );		
		return $str;
	}

	/**
	 * 
	 * @note because of UNIQ...QINU issue, avoid Html::element/rawElement
	 */
	private static function createLazy(
		string $input,
		string $defaultContent,
		string $trigger,
		string $fullpagename,
		string $targetAction,
		string $valSep,
		string|bool $triggerId,
		string|bool $loadmoreId,
		string|bool $paginationId,
		string $doUpdateUrl,
		string $class,
		string $id
	) {
		// $foo1 = self::replaceVars( "text: {\$text} and ms: {\$ms}.", [ "text" => "Táin", "ms" => "LL" ] );
		// $foo2 = self::replaceVars( $input, [] );
		//print_r( htmlspecialchars($input) . "<br>");
		//print_r( $foo2 . "<br>" );

		// Attributes
		// May contain chars conflicting with HTML
		$parsableModel = $input;
		$parsable = self::replaceVars( $parsableModel, [] );
		$attributes = [
			"class" => trim( "cr-parse-request $class" ),
			"id" => $id,
			"data-fullpagename" => $fullpagename,
			"data-trigger" => $trigger,
			"data-parse" => $parsable,
			"data-parse-model" => $parsableModel,
			"data-json" => "{}",
			"data-trigger-id" => $triggerId,
			"data-pagination-id" => $paginationId,
			"data-loadmore-id" => $loadmoreId,
			"data-target-action" => $targetAction,
			"data-valsep" => $valSep,
			"data-update-url" => $doUpdateUrl,
			"data-test-comment" => "paginationId is {$paginationId}."
		];
		$newAttributes = [];
		foreach ( $attributes as $k => $v ) {
			if ( ( $v !== false && $v !== "" ) ) {
				$newAttributes[$k] = $v;
			}
		}
		$res = \Html::rawElement( "span", $newAttributes, $defaultContent );
		return $res;
	}

	/**
	 * Replaces variables like {$text}, {$ms} in string
	 * with values in array (map), or else removes them.
	 * 
	 * @param array map // [ "text" => "Táin", "manuscript" => "LL", etc. ]
	 */
	private static function replaceVars( string $str, array $map = [] ): string {
		//$pattern = '/\{\$(.*?)\}/s';
		$pattern = '/{{{\$([^{}]*)}}}/';
		$callbackWithMap = function( $matches ) use ( $map ) {
			if ( !$map ) {
				print_r( "Return without map." );
				return "";
			} else {
				$matchKeyStr = trim( $matches[0], '{{{\$}}}' );
				$matchKeyArr = explode( "|", $matchKeyStr );
				$matchKey = $matchKeyArr[0];
				$defaultVal = array_key_exists( 1, $matchKeyArr ) ? $matchKeyArr[1] : "";
				$matchVal = array_key_exists( $matchKey, $map ) ? $map[ $matchKey ] : $defaultVal;
				return $matchVal;
			}
		};
		// Currently no mapping feature is implemented so we'll use the defaults.
		$callback = function( $matches ) {
			$matchKeyStr = trim( $matches[0], '{{{\$}}}' );
			$matchKeyArr = explode( "|", $matchKeyStr );
			$matchKey = $matchKeyArr[0];
			$defaultVal = array_key_exists( 1, $matchKeyArr ) ? $matchKeyArr[1] : "";
			return $defaultVal;
		};
		$res = preg_replace_callback( $pattern, $callback, $str );
		return $res;
	}

	/**
	 * Loads require RL module unless previously loaded
	 * This way, we don't need to use onBeforePageDisplay
	 * @param mixed $parserOutput
	 * @return void
	 */
	private function loadModules( $parserOutput ) {
		$extData = $parserOutput->getExtensionData( "parserequest-extprparse-used" );
		if ( $extData == null ) {
			$parserOutput->addModuleStyles( [
				"ext.pagination.style"
			] );
			$parserOutput->addModules( [
				"ext.PR.parse"
			] );
			$parserOutput->appendExtensionData(
				"parserequest-extprparse-used",
				sha1( rand(10000,99999) )
			);
		}
	}

}
