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
$pdfFilePath = $_POST['filePath'];
$fileName = $tvsNode;
$htmlFilePath = str_replace(".pdf", "", $pdfFilePath);
$rootPDFFilePath = str_replace(".pdf", "/", $pdfFilePath);

$rootPath = '';
if ($trueNodeId == false) {
    $pdfFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/' . $pdfFilePath;
    $htmlFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/pdfs/';
    $rootPath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/';
}
else {
    $pdfFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/" . $pdfFilePath;
    $htmlFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/pdfs/";
    $rootPath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/";
}

//Convert the PDF using the IDR converter command line
//java -Xmx512m -jar jpdf2html-trial.jar test.pdf test.html
//
$pathToConverter = '/home/bitnami/apps/drupal/htdocs/sites/all/libraries/pdf/jpdf2html.jar';
system("chmod -R 777 {$rootPath}");
system("java -Xmx512m -jar {$pathToConverter} {$pdfFilePath} {$htmlFilePath}");
system("chmod -R 777 {$rootPath}");

$indexFilePath = str_replace(".pdf","/index.html",$pdfFilePath);

$htmlText = file_get_contents($indexFilePath);
$newHtmlText = str_replace('</body>','<script type="text/javascript">IDRViewer.setLayout(IDRViewer.LAYOUT_PRESENTATION);</script></body>',$htmlText);
file_put_contents($indexFilePath,$newHtmlText);

echo $tvsNode;
?>
