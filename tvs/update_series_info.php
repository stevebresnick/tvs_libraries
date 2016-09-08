<?php
define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

set_time_limit(0);

$sid = 0;
$viewKey = "";
$isComplete = 0;
$gbEmail = "";

if ((isset($_GET["sid"])) && (!empty($_GET["sid"]))) {
   $sid = $_GET["sid"];
}
if ((isset($_GET["vk"])) && (!empty($_GET["vk"]))) {
   $viewKey = $_GET["vk"];
}
if ((isset($_GET["complete"])) && (!empty($_GET["complete"]))) {
   $isComplete = $_GET["complete"];
}
if ((isset($_GET["gbe"])) && (!empty($_GET["gbe"]))) {
   $gbEmail = $_GET["gbe"];
}

if ($sid === 0) { die();}


db_update('series_user_progress')->fields(array(
      'Content_Complete_Status' => $isComplete))
    ->condition('Series_Id', $sid)
    ->condition('User_Email_Addr', $gbEmail
)
->execute();

$getMostRecentView = "SELECT Content_Access_Date FROM series_audit_trail WHERE Series_Id = '" . $sid . "' AND User_Email_Addr = '" . $gbEmail . "' ORDER BY Content_Access_Date DESC LIMIT 1";
$accessDate = db_query($getMostRecentView)->fetchField();

db_update('series_audit_trail')->fields(array(
      'View_Key' => $viewKey))
    ->condition('Series_Id', $sid)
    ->condition('User_Email_Addr', $gbEmail)
    ->condition('Content_Access_Date', $accessDate)
->execute();

?>