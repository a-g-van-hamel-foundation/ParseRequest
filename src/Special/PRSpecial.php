<?php

namespace ParseRequest\Special;

use MediaWiki\MediaWikiServices;
use ParseRequest\ParserFunctions\PRParserFunctionsInfo;

class PRSpecial extends \SpecialPage {

	private $extensionName;
	private $extensionJsonSource;

	public function __construct( $name = 'ParseRequest' ) {
		parent::__construct( $name );
		global $IP;
		$mainConfig = MediaWikiServices::getInstance()->getMainConfig();
		$extAssets = $mainConfig->get( 'ExtensionAssetsPath' );
		$this->extensionName = wfMessage( 'parserequest-extensionname' )->parse();
		$this->extensionJsonSource = $IP . $extAssets . "/" . $this->extensionName . "/extension.json";
	}

	function isExpensive() {
		return false;
	}

	function isSyndicated() {
		return false;
	}

	public function execute( $subPage ) {
		$outputPage = \RequestContext::getMain()->getOutput();
		$this->setHeaders();

		$res = "";
		$res = $this->getSpecialPageContent();
		$outputPage->addWikiTextAsContent( $res );
	}	

	private function getSpecialPageContent() {
		$res = $this->getInfoTable();
		$res .= "<h2>Parameters</h2><h3><code>#parse-request</code></h3>" . $this->getParametersDescription();
		return $res;
	}

	private function getInfoTable() {
		$str = "<table class='table'>";
		$str .= "<tr><th>Name</th><td>{$this->extensionName}</td></tr>";
		$version = $this->getExtensionVersion();
		$str .= "<tr><th>Description</th><td>" . $this->getExtensionDescription() . "</td></tr>";
		$str .= "<tr><th>Extension version</th><td>$version</td></tr>";
		$str .= "<tr><th>Repository</th><td>[https://github.com/a-g-van-hamel-foundation/ParseRequest Github (A. G. van Hamel Foundation for Celtic Studies)]</td></tr>";
		$str .= "<tr><th>Documentation</th><td>https://codecs.vanhamel.nl/Show:Lab/ParseRequest</td></tr>";
		$str .= "<tr><th>Parser functions</th><td><code>#parse-request</code>, <code>#pagination</code>, <code>#load-more</code>, <code>#preparse-request</code></td></tr>";
		$str .= "</table>";
		return $str;
	}

	private function getExtensionVersion() {
		if ( file_exists( $this->extensionJsonSource ) ) {
			$contents = file_get_contents( $this->extensionJsonSource );
			if ( $contents == null ||  $contents == "" ) {
				return "";
			}
		}
		$arr = json_decode( $contents, true );
		return $arr["version"] ?? "?";
	}

	private function getExtensionDescription() {
		$description = wfMessage( 'parserequest-desc' )->parse();
		return $description;
	}

	private function getParametersDescription() {
		$info = PRParserFunctionsInfo::getParserFunctionInfo();
		return $info;
	}

}
