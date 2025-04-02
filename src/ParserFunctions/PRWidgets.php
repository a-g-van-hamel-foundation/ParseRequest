<?php

/**
 * Navigational widgets, each with their own parser function, 
 * that can be used with `#parse-request` to update variables
 * and refresh content:
 * (1) pagination (`#pagination`)
 * (2) load more button (`#load-more`)
 * (3) `#cr-pfquery-pagination` (maybe not optimised for general use)
 */

namespace ParseRequest\ParserFunctions;

use ParseRequest\PRUtils;
use MediaWiki\Parser\ParserOutput;

class PRWidgets {

	public function __construct() {
		//
	}

	/**
	 * `#pagination`
	 * 
	 */
	public function runPagination ( $parser, $frame, $args ) {
		if ( $args == null || empty( $args ) ) {
			return false;
		}
		$paramsAllowed = [
			"total" => false,
			"max-pages" => false,
			"limit" => "50",
			"offset" => "0",
			"template" => false, // better yet, offset name
			"id" => "pr-pagination-widget",
			"class" => "pr-pagination"
		];
		list( $total, $maxPages, $limit, $offset, $template, $id, $class ) = array_values( PRUtils::extractParams( $frame, $args, $paramsAllowed ) );
		$attributeArr = [
			"id" => $id,
			"class" => "pr-pagination-widget",
			"data-total" => $total,
			"data-max-pages" => $maxPages,
			"data-limit" => $limit,
			"data-offset" => $offset,
			"data-template" => $template,
			"data-class" => $class
		];
		$attributes = "";
		foreach ( $attributeArr as $k => $v ) {
			$attributes .= ( $v !== false ) ? "$k='$v' " : "";
		}
		// @todo
		$spinnerPlaceholder = "<div class='cr-pagination-placeholder spinner-dual-ring'></div>";
		$spinnerBackground = "<div class='spinner-background cr-hidden spinner-dual-ring'></div>";
		$res = "<div $attributes></div>";

		// No need to RL modules: initiated through #parse-request

		return [ $res, 'noparse' => true, 'isHTML' => true ];
	}

	/**
	 * #load-more
	 */
	public function runLoadMore( $parser, $frame, $args ) {
		if ( $args == null || empty( $args ) ) {
			return false;
		}
		$paramsAllowed = [
			"total" => false,
			"limit-prev" => "50",
			"limit-next" => false,
			"offset-prev" => "0",
			"offsetname" => false,
			"id" => "cr-load-more",
			"class" => "btn btn-light",
			"text" => "Load more",
			"trigger" => "onclick"
		];
		list( $total, $limitPrev, $limitNext, $offsetPrev, $offsetName, $id, $class, $buttonText, $trigger ) = array_values( PRUtils::extractParams( $frame, $args, $paramsAllowed ) );
		$attributeArr = [
			"id" => $id,
			"class" => "cr-load-more $class",
			"data-total" => $total,
			"data-offset-prev" => $offsetPrev, // current
			"data-limit-prev" => $limitPrev, // previous limit used to calculate new offset
			"data-limit-next" => $limitNext,
			"data-offset-name" => $offsetName,
			"data-trigger" => $trigger
		];
		$attributes = "";
		foreach ( $attributeArr as $k => $v ) {
			$attributes .= ( $v !== false && $v !== "" ) ? "$k='$v' " : "";
		}

		$res = "<button $attributes>{$buttonText}</button>";

		// No need to RL modules: initiated through #parse-request

		return [ $res, 'noparse' => true, 'isHTML' => true ];
	}

	/*
	 * `#cr-pfquery-pagination`
	 * Pagination for Page Forms / Special:RunQuery.
	 */
	public function runPFQueryPagination( $parser, $frame, $params ) {
		if ( $params == null || empty( $params ) ) {
			return false;
		}
		$parserOutput = $parser->getOutput();

		$paramTotal = '';
		$paramLimit = '25';
		$paramOffset = '0';
		$paramTemplate = '';

		foreach ( $params as $i => $param ) {
			$paramExpanded = $frame->expand($param);
			$keyValPair = explode( '=', $paramExpanded, 2 );
			$paramName = trim( $keyValPair[0] );
			$value = isset( $keyValPair[1] ) ? trim( $keyValPair[1] ) : "";
			switch ( $paramName ) {
				case 'total': $paramTotal = $value;
				break;
				case 'template': $paramTemplate = $value;
				break;
				case 'limit': $paramLimit = $value;
				break;
				case 'offset': $paramOffset = $value;
				break;
			}
		}

		$spinnerPlaceholder = "<div class='pfquery-pagination-placeholder spinner-dual-ring'></div>";
		$spinnerBackground = "<div class='spinner-background cr-hidden spinner-dual-ring'></div>";
		// @note repl pfquery-pagination--container with pfquery-pagination-widget
		$data = "<div class='pfquery-pagination-widget' data-total='{$paramTotal}' data-template='{$paramTemplate}' data-limit='{$paramLimit}' data-offset='{$paramOffset}' >{$spinnerPlaceholder}</div>{$spinnerBackground}";

		$parserOutput->addModuleStyles( [ "ext.pagination.style" ] );
		$parserOutput->addModules( [ 'ext.pagination' ] );

		return [
			$data,
			'nowiki' => true,
			//Unsafe HTML tags should not be stripped, etc.
			'noparse' => false,
			'isHTML' => true,
			'noargs' => true
		];

	}

}
