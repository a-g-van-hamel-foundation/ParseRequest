<?php

/**
 * HookHandlers
 */

namespace ParseRequest;

use Parser;
use PPFrame;
use MediaWiki\MediaWikiServices;
use MediaWiki\Hook\ParserFirstCallInitHook;
use ParseRequest\ParserFunctions\PRFunctions;
use ParseRequest\ParserFunctions\PRWidgets;

class PRHooks implements
	ParserFirstCallInitHook {

	public function onParserFirstCallInit( $parser ) {
		$flags = Parser::SFH_OBJECT_ARGS;
		$parser->setFunctionHook(
			'parse-request',
			function( Parser $parser, PPFrame $frame, array $args ) {
				$pf = new PRFunctions;
				return $pf->runParseRequest( $parser, $frame, $args );
			},
			$flags
		);
		$parser->setFunctionHook(
			'preparse-request',
			function( Parser $parser, PPFrame $frame, array $args ) {
				$pf = new PRFunctions;
				return $pf->runPreParseRequest( $parser, $frame, $args );
			},
			$flags
		);
		// Widgets:
		$parser->setFunctionHook(
			'pagination',
			function( Parser $parser, PPFrame $frame, array $args ) {
					$pf = new PRWidgets;
					return $pf->runPagination( $parser, $frame, $args );
			},
			$flags
		);
		$parser->setFunctionHook(
			'load-more',
			function( Parser $parser, PPFrame $frame, array $args ) {
					$pf = new PRWidgets;
					return $pf->runLoadMore( $parser, $frame, $args );
			},
			$flags
		);
		$parser->setFunctionHook(
			'pfquery-pagination',
			function( Parser $parser, PPFrame $frame, array $args ) {
					$pf = new PRWidgets;
					return $pf->runPFQueryPagination( $parser, $frame, $args );
			},
			$flags
		);
	}

}
