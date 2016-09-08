<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

$primaryApp = strtolower(db_query("SELECT value FROM tvs_config WHERE name = 'primary_app'")->fetchField());

set_time_limit(0);

$cid = $_GET['cid'];

if ($cid == "") {
    echo "No content id provided" . "\n";
    return;
}

$node = node_load(NULL, $cid, FALSE);
if ($node === null) {
    echo "Node not found, returning..." . "\n";
    return;
}
h5p_write_showpad_embed_file($node);

//Save this to a local file
$showpadRootStoragePath = '/opt/bitnami/apps/drupal/htdocs/sites/all/libraries/tvs/';
$showpadIndexFile = $showpadRootStoragePath . $cid . '/index.html';
$showPadZipDir = $showpadRootStoragePath . $cid;


$allZipFiles = shell_exec("ls -S -m \"" . $showPadZipDir . "\" 2>&1");
$allZipFilesArr = explode(',', $allZipFiles);
for ($i = 0; $i < sizeof($allZipFilesArr); $i++) {
    if (endsWith($allZipFilesArr[$i],".zip")) {
        $showPadZipFile = $showPadZipDir . '/' . $allZipFilesArr[$i];
        break;
    }
}

if ($showPadZipFile == "") {
    echo "Returning as no zip file found\n";
    return;
}

header($_SERVER['SERVER_PROTOCOL'].' 200 OK');
header('Content-Type: application/zip');
header("Content-Transfer-Encoding: Binary");
header('Pragma: no-cache');
if ($primaryApp === "btc") {
    header('Content-disposition: attachment; filename=' . str_replace(".zip", ".btc", basename($showPadZipFile)));
}
else {
    header('Content-disposition: attachment; filename=' . basename($showPadZipFile));
}

header('Content-Length: ' . filesize($showPadZipFile));
readfile($showPadZipFile);
exit;
?>
