<?php
$nid = 0;
$gbEmail = "tvspublic@thevalueshift.com";
$gbFirstName = "Public View";

if ((isset($_GET["nid"])) && (!empty($_GET["nid"]))) {
   $nid = $_GET["nid"];
}
if ((isset($_GET["em"])) && (!empty($_GET["em"]))) {
   $gbEmail = $_GET["em"];
}
if ((isset($_GET["fn"])) && (!empty($_GET["fn"]))) {
   $gbFirstName = $_GET["fn"];
}


if ($nid === 0) { die();}

$iframeUrl = '<iframe src="//' . $_SERVER["SERVER_NAME"] . '/node/' . $nid;
$iframeUrl .= '?em=' . $gbEmail . '&fn=' . $gbFirstName . '"';
$iframeUrl .= ' frameborder="0" height="2000px" width="100%" scrolling="yes"></iframe>';

echo $iframeUrl;

?>

