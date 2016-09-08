<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

set_time_limit(0);

if ($_POST['submitted'] == 1) {
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['showPadUrl'] . "' WHERE name = 'sp_url'";
    db_query($sqlUpdate);
    
    /*$sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['clientId'] . "' WHERE name = 'client_id'";
    db_query($sqlUpdate);
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['clientSecret'] . "' WHERE name = 'client_secret'";
    db_query($sqlUpdate);*/
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['showPadUserName'] . "' WHERE name = 'sp_user_name'";
    db_query($sqlUpdate);
    if ($_POST['showPadPassword'] !== "") {
        $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['showPadPassword'] . "' WHERE name = 'sp_user_password'";
        db_query($sqlUpdate);
    }
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['showPadPubDivision'] . "' WHERE name = 'sp_division'";
    db_query($sqlUpdate);
    
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['showPadAssDivision'] . "' WHERE name = 'sp_assets_division'";
    db_query($sqlUpdate);
    
    /*
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['showPadAllTags'] . "' WHERE name = 'sp_all_tags'";
    db_query($sqlUpdate);
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['damUrl'] . "' WHERE name = 'dam_url'";
    db_query($sqlUpdate);
    $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['damUserName'] . "' WHERE name = 'dam_user_name'";
    db_query($sqlUpdate);
    if ($_POST['damPassword'] !== "") {
        $sqlUpdate = "UPDATE tvs_config SET value = '" . $_POST['damPassword'] . "' WHERE name = 'dam_user_password'";
        db_query($sqlUpdate);
    }*/

    echo "<h3>ShowPad Settings have been modified</h3>";
    echo "<script>setTimeout('top.window.location.href = top.window.location.href;',2000);</script>";
}
else {
    $SHOWPAD_URL = db_query("SELECT value FROM tvs_config WHERE name = 'sp_url'")->fetchField();
    $CLIENT_ID = db_query("SELECT value FROM tvs_config WHERE name = 'client_id'")->fetchField();
    $CLIENT_SECRET = db_query("SELECT value FROM tvs_config WHERE name = 'client_secret'")->fetchField();
    $SHOWPAD_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_name'")->fetchField();
    $SHOWPAD_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_password'")->fetchField();
    $SHOWPAD_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_password'")->fetchField();
    $SHOWPAD_PUB_DIVISION = db_query("SELECT value FROM tvs_config WHERE name = 'sp_division'")->fetchField();
    $SHOWPAD_ASS_DIVISION = db_query("SELECT value FROM tvs_config WHERE name = 'sp_assets_division'")->fetchField();
    
    /*
    $SHOWPAD_ALL_TAGS = db_query("SELECT value FROM tvs_config WHERE name = 'sp_all_tags'")->fetchField();
    $DAM_URL = db_query("SELECT value FROM tvs_config WHERE name = 'dam_url'")->fetchField();
    $DAM_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_name'")->fetchField();
    $DAM_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_password'")->fetchField();
    */
    
    echo "<form method='post' action='./get_tvs_db_settings.php'>";
    echo "<h3>ShowPad URL</h3>";
    echo "<input size='75' type='text' name='showPadUrl' value='" . $SHOWPAD_URL . "'>";
    /*echo "<h3>ShowPad Client ID</h3>";
    echo "<input size='75' type='text' name='clientId' value='" . $CLIENT_ID . "'>";
    echo "<h3>ShowPad Secret Key</h3>";
    echo "<input size='75' type='text' name='clientSecret' value='" . $CLIENT_SECRET . "'>";*/
    echo "<h3>ShowPad User Name</h3>";
    echo "<input size='75' type='text' name='showPadUserName' value='" . $SHOWPAD_USER_NAME . "'>";
    echo "<h3>ShowPad Password (leave blank to not change the current password)</h3>";
    echo "<input size='75' type='text' name='showPadPassword' value=''>";
    
    if (($SHOWPAD_USER_NAME != "") && ($SHOWPAD_USER_PASSWORD != "")) {
        //Call the ShowPad API using a hard-coded username and password.
        $postData = "grant_type=password&username=" . $SHOWPAD_USER_NAME . "&password=" . $SHOWPAD_USER_PASSWORD;
        $postData .= "&client_id=" . $CLIENT_ID;
        $postData .= "&client_secret=" . $CLIENT_SECRET;
        $loginAPICall = $SHOWPAD_URL . "api/v3/oauth2/token";

        $loginJSON = callAPI("POST", $loginAPICall, $postData, "");

        $accessToken = $loginJSON->access_token;
        $authorizationHeader = "Bearer " . $accessToken;

        $headers = array( 
            "Authorization: " . $authorizationHeader,
        ); 


        $getDivisionListAPICall = $SHOWPAD_URL . 'api/v3/divisions.json?fields=id%2Cname';
        $getDivisionListJSON = callAPI("GET", $getDivisionListAPICall, null, $headers);
        
        if ($getDivisionListJSON->response->count > 0) {
            echo "<h3>ShowPad Publishing Division</h3>";
            echo "<select name='showPadPubDivision' id='showPadPubDivision' style='width:200px;'>";

            for ($i = 0; $i < $getDivisionListJSON->response->count; $i++) {
                    echo "<option value='" . $getDivisionListJSON->response->items[$i]->id . "' ";
                    if ($getDivisionListJSON->response->items[$i]->id == $SHOWPAD_PUB_DIVISION) {
                        echo "SELECTED";
                    }
                    echo ">";
                    echo $getDivisionListJSON->response->items[$i]->name . "</option>";
            }
            //print "<option value='mine'>My Uploads</option>";
            echo "</select>";
            
            echo "<h3>ShowPad Asset Division</h3>";
            echo "<select name='showPadAssDivision' id='showPadAssDivision' style='width:200px;'>";

            for ($i = 0; $i < $getDivisionListJSON->response->count; $i++) {
                    echo "<option value='" . $getDivisionListJSON->response->items[$i]->id . "' ";
                    if ($getDivisionListJSON->response->items[$i]->id == $SHOWPAD_ASS_DIVISION) {
                        echo "SELECTED";
                    }
                    echo ">";
                    echo $getDivisionListJSON->response->items[$i]->name . "</option>";
            }
            echo "</select>";
        }        
    }

    /*echo "<h3>ShowPad Division ID</h3>";
    echo "<input size='75' type='text' name='showPadDivision' value='" . $SHOWPAD_DIVISION . "'>";
    echo "<h3>Show All ShowPad Tags For Publishing (0 means no, admin controls)</h3>";
    echo "<input size='75' type='text' name='showPadAllTags' value='" . $SHOWPAD_ALL_TAGS . "'>";
    echo "<h3>DAM URL</h3>";
    echo "<input size='75' type='text' name='damUrl' value='" . $DAM_URL . "'>";
    echo "<h3>DAM User Name</h3>";
    echo "<input size='75' type='text' name='damUserName' value='" . $DAM_USER_NAME . "'>";
    echo "<h3>DAM User Password (leave blank to not change the current pasword)</h3>";
    echo "<input size='75' type='text' name='damPassword' value=''>";*/

    echo "<input type='hidden' name='submitted' value='1' />";
    echo "<p>";
    echo "<input type='submit' value='Submit' />";
    echo "</p";
    echo "</form>";
}

function CallAPI($method, $url, $data = false, $headers = "") {
    $curl = curl_init();

    switch ($method)
    {
        case "POST":
            curl_setopt($curl, CURLOPT_POST, 1);

            if ($data)
                curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
            break;
        case "PUT":
            curl_setopt($curl, CURLOPT_PUT, 1);
            break;
        case "GET":
            break;
        default:
            if ($data)
                $url = sprintf("%s?%s", $url, http_build_query($data));
    }

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_VERBOSE, 1);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 0); 
    curl_setopt($curl, CURLOPT_TIMEOUT, 600);

    if ($headers <> "") {
        curl_setopt($curl, CURLOPT_HEADER, 1);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    }

    $results = curl_exec($curl);
    
    $jsonStartPoint = strpos($results,"{");
    $results = substr($results,$jsonStartPoint);

    $resultsJSON = json_decode($results);
    curl_close($curl);

    return $resultsJSON;
}

?>
