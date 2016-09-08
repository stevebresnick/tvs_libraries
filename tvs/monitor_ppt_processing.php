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
$htmlFilePath = $_POST['filePath'];

$pptsPos = strpos ($htmlFilePath, 'ppts/');
$convertedHtmlFilePath = substr($htmlFilePath,$pptsPos);
$fileName = $tvsNode;

$rootPath = '';
if ($trueNodeId == false) {
    $convertedHtmlFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/' . $convertedHtmlFilePath;
    $rootPath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/ppts/';
}
else {
    $convertedHtmlFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/" . $convertedHtmlFilePath;
    $rootPath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/ppts/";
}

$completed = 0;

$htmlFilePath = "/home/bitnami/apps/drupal/htdocs/sites/all/libraries/" . $htmlFilePath;

if (file_exists($htmlFilePath)) {
    $completed = 1;
    
    //$serverSubstring = str_replace(".","-",$_SERVER['SERVER_NAME']);
    //$convertedHtmlFilePath = str_replace($serverSubstring . "-", "",$convertedHtmlFilePath);
    
    //Copy the file to the PPT conversion S3 location for processing.
    //echo "chmod -R 777 {$rootPath}\n";
    system("chmod -R 777 {$rootPath}");
    system("chmod -R 777 {$htmlFilePath}");
    
    $pptConverted = $htmlFilePath . ".ppt*";
    
    //echo "rm {$pptConverted}\n";
    system("rm {$pptConverted}");
    //system ("s3cmd rm s3://thevalueshift/pptsconverted/" . str_replace("/home/bitnami/apps/drupal/htdocs/sites/all/libraries/ppts/","",$htmlFilePath));
}

echo $completed;
?>
