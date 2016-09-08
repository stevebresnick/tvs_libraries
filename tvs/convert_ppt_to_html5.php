<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
ini_set('default_socket_timeout', 600);

$DAM_URL = db_query("SELECT value FROM tvs_config WHERE name = 'dam_url'")->fetchField();
$DAM_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_name'")->fetchField();
$DAM_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_password'")->fetchField();
$SHOWPAD_URL = db_query("SELECT value FROM tvs_config WHERE name = 'sp_url'")->fetchField();
$CLIENT_ID = db_query("SELECT value FROM tvs_config WHERE name = 'client_id'")->fetchField();
$CLIENT_SECRET = db_query("SELECT value FROM tvs_config WHERE name = 'client_secret'")->fetchField();
$SHOWPAD_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_name'")->fetchField();
$SHOWPAD_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_password'")->fetchField();
$SHOWPAD_DIVISION = db_query("SELECT value FROM tvs_config WHERE name = 'sp_division'")->fetchField();

$trueNodeId = true;
$tvsNode = $_POST['tvsNode'];
if ($tvsNode == "0") { $tvsNode = rand();$trueNodeId = false;}
$pptFilePath = $_POST['filePath'];
$fileName = $tvsNode;
$newPPTFilePath = str_replace("ppts/", "ppts/" . str_replace(".","-", $_SERVER['SERVER_NAME']) . "-", $pptFilePath);

$rootPath = '';
if ($trueNodeId == false) {
    $pptFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/' . $pptFilePath;
    $rootPath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/ppts/';
}
else {
    $pptFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/" . $pptFilePath;
    $rootPath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/ppts/";
}

$newPPTFilePath = '/home/bitnami/apps/drupal/htdocs/sites/all/libraries/' . $newPPTFilePath;

$newHTMLDirPath = str_replace(".pptx", "", $newPPTFilePath);
$newHTMLDirPath = str_replace(".ppt", "", $newHTMLDirPath);

$s3ToConvert = "s3://thevalueshift/pptstoconvert/";
$s3Converted = "s3://thevalueshift/pptsconverted/";

//Copy the file to the PPT conversion S3 location for processing.
//echo "chmod -R 777 {$rootPath}\n";
system("chmod -R 777 {$rootPath}");

//echo "mv {$pptFilePath} {$newPPTFilePath}\n";
system("mv {$pptFilePath} {$newPPTFilePath}");

$finalHTMLDirPath = str_replace($_SERVER['SERVER_NAME'] . "-", "", $newHTMLDirPath);


echo $newHTMLDirPath;
?>
