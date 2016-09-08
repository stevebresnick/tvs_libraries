<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

$origFilePath = $_POST['filePath'];
$emailToNotify = $_POST['emailToNotify'];

if (($origFilePath != "") && ($emailToNotify != "")) {
    //echo "INSERT INTO file_conversion_queue (email_to_notify, converted_html_file_path) VALUES ('" . $emailToNotify . "', '" . $origFilePath . "')";
    echo "";
    db_query ("INSERT INTO file_conversion_queue (email_to_notify, converted_html_file_path) VALUES ('" . $emailToNotify . "', '" . $origFilePath . "')");
}
else {
    echo "";
}
?>