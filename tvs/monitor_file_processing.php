<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
ini_set('default_socket_timeout', 600);

$getFiles = "SELECT * FROM file_conversion_queue";

$result = db_query($getFiles);
foreach ($result as $record) {
    $fileConversionId = $record->file_conversion_id;
    $convertedFilePath = $record->converted_html_file_path;
    $emailToNotify = $record->email_to_notify;
    
    $pptDir = "/home/bitnami/apps/drupal/htdocs/sites/all/libraries/" . $convertedFilePath;
    $serverSubstring = str_replace(".","-",$_SERVER['SERVER_NAME']);
    echo "Server substring is " . $serverSubstring . "\n";
    $newPptDir = str_replace($serverSubstring . "-", "", $pptDir);
    echo "PPT Dir is " . $pptDir . "\n";
    echo "New PPT Dir is " . $newPptDir . "\n";

    if (file_exists($pptDir)) {
        echo "File exists...\n";
        system("chmod -R 777 {$pptDir}");

        $pptConverted = $pptDir . ".ppt*";
        system("rm {$pptConverted}");
        
        system("mv {$pptDir} {$newPptDir}");
        
        $deleteFromQueue = "DELETE FROM file_conversion_queue WHERE file_conversion_id = " . $fileConversionId;
        db_query($deleteFromQueue);
        
        //Email the person that uploaded the files.
    }
}


?>
