<?php

$LRSFile1 = "/home/bitnami/apps/drupal/htdocs/sites/all/modules/h5p/library/js/h5p-x-api.js";
$LRSFile2 = "/home/bitnami/apps/drupal/htdocs/sites/all/libraries/tvs/sites/all/modules/h5p/library/js/h5p-x-api.js";

$LRSFile1Contents = file_get_contents($LRSFile1);

$LRSEndpointP1 = strpos($LRSFile1Contents,'var tinCanEndPoint = "') + strlen('var tinCanEndPoint = "');
$LRSEndpointP2 = strpos($LRSFile1Contents,'"', ($LRSEndpointP1+1));
$LRSUserNameP1 = strpos($LRSFile1Contents,'var tinCanUsername = "') + strlen('var tinCanUsername = "');
$LRSUserNameP2 = strpos($LRSFile1Contents,'"', ($LRSUserNameP1+1));
$LRSPasswordP1 = strpos($LRSFile1Contents,'var tinCanPassword = "') + strlen('var tinCanPassword = "');
$LRSPasswordP2 = strpos($LRSFile1Contents,'"', ($LRSPasswordP1+1));

$LRSEndpoint = substr($LRSFile1Contents,$LRSEndpointP1,$LRSEndpointP2-$LRSEndpointP1);
$LRSUserName = substr($LRSFile1Contents,$LRSUserNameP1,$LRSUserNameP2-$LRSUserNameP1);
$LRSPassword = substr($LRSFile1Contents,$LRSPasswordP1,$LRSPasswordP2-$LRSPasswordP1);

if ($_POST['submitted'] == 1) {
    
    $LRSFile1Contents = str_replace($LRSEndpoint,$_POST['newEndpoint'],$LRSFile1Contents);
    $LRSFile1Contents = str_replace($LRSUserName,$_POST['newUserName'],$LRSFile1Contents);
    $LRSFile1Contents = str_replace($LRSPassword,$_POST['newPassword'],$LRSFile1Contents);
    
    file_put_contents($LRSFile1,$LRSFile1Contents);
    file_put_contents($LRSFile2,$LRSFile1Contents);

    echo "<h3>LRS Settings have been modified</h3>";
    echo "<script>setTimeout('top.window.location.href = top.window.location.href;',2000);</script>";
}
else {
    echo "<form method='post' action='./get_lrs_settings.php'>";
    echo "<h3>End Point</h3>";
    echo "<input size='75' type='text' name='newEndpoint' value='" . $LRSEndpoint . "'>";
    echo "<h3>User Name</h3>";
    echo "<input size='75' type='text' name='newUserName' value='" . $LRSUserName . "'>";
    echo "<h3>Password</h3>";
    echo "<input size='75' type='text' name='newPassword' value='" . $LRSPassword . "'>";

    echo "<input type='hidden' name='submitted' value='1' />";
    echo "<p>";
    echo "<input type='submit' value='Submit' />";
    echo "</p";
    echo "</form>";
}

?>
