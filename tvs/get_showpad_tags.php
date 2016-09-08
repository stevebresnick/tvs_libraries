<?php

//chdir("/home/bitnami/apps/drupal/htdocs/");
define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

$SHOWPAD_URL = db_query("SELECT value FROM tvs_config WHERE name = 'sp_url'")->fetchField();
$CLIENT_ID = db_query("SELECT value FROM tvs_config WHERE name = 'client_id'")->fetchField();
$CLIENT_SECRET = db_query("SELECT value FROM tvs_config WHERE name = 'client_secret'")->fetchField();
$SHOWPAD_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_name'")->fetchField();
$SHOWPAD_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_password'")->fetchField();
$SHOWPAD_DIVISION = db_query("SELECT value FROM tvs_config WHERE name = 'sp_division'")->fetchField();

$use = "admin";
$qDivId = "";
$qDivName = "";

if (isset($_GET["u"])) {
    $use = $_GET["u"];
}
if (isset($_GET["i"])) {
    $qDivId = $_GET["i"];
}
if (isset($_GET["n"])) {
    $qDivName = $_GET["n"];
}

print "<div style='float:left;'>";

$existingToken = "";
if (isset($_COOKIE["spah"])) {
    $existingToken = $_COOKIE["spah"];
}

if ($existingToken == "") {
    //Call the ShowPad API using a hard-coded username and password.
    $postData = "grant_type=password&username=" . $SHOWPAD_USER_NAME . "&password=" . $SHOWPAD_USER_PASSWORD;
    $postData .= "&client_id=" . $CLIENT_ID;
    $postData .= "&client_secret=" . $CLIENT_SECRET;
    $loginAPICall = $SHOWPAD_URL . "api/v3/oauth2/token";

    $loginJSON = callAPI("POST", $loginAPICall, $postData, "");

    $accessToken = $loginJSON->access_token;
    $authorizationHeader = "Bearer " . $accessToken;
}
else {
    $authorizationHeader = $existingToken;
}

$headers = array( 
    "Authorization: " . $authorizationHeader,
); 


if ($_POST['submitted'] == 1) {
    $myArrArgs = explode(',', $_POST['showpadTagList']);
    
    
    $showPadTagId = $myArrArgs[0];
    $showPadTagName = $myArrArgs[1];
    $showPadDivision = $_POST['tagsDiv'];
    
    $records = db_query("SELECT count(*) FROM field_data_field_showpad_url WHERE field_showpad_url_value = '" . $showPadTagId . "'")->fetchField();
    if ($records == 0) {
        db_query ("INSERT INTO bitnami_drupal7.taxonomy_term_data (tid, vid, name, description, format, weight) VALUES (NULL, 1, '" . $showPadTagName . "', '" . $showPadDivision . "', 'filtered_html', 0)");
        
        $tid = db_query("SELECT tid FROM taxonomy_term_data WHERE name = '" . $showPadTagName . "'")->fetchField();
        
        db_query("INSERT INTO field_data_field_showpad_url (entity_type, bundle, deleted, entity_id, revision_id, language, delta, field_showpad_url_value, field_showpad_url_format) VALUES ('taxonomy_term', 'tags', 0, " . $tid . ", " . $tid . ", 'und', 0, '" . $showPadTagId . "', NULL)");
        
        db_query("INSERT INTO taxonomy_term_hierarchy  (tid,parent) VALUES (" . $tid . ",0)");
    }
    
    echo "<h3>The tag has been added</h3>";
    echo "<script>setTimeout('top.window.location.href = top.window.location.href;',2000);</script>";
}
else if ((($use == "pub") && ($qDivId != "") && ($qDivName != "")) || ($_POST['div_submitted'] == 1)) {
    //Call into ShowPad to get the list of tags
    if ($qDivId !== "") {
        $showPadDivName = $qDivName;
        $showPadDivId = $qDivId;
    }
    else {
        $myArrArgs = explode(',', $_POST['showpadDivList']);
        $showPadDivName = $myArrArgs[0];
        $showPadDivId = $myArrArgs[1];
    }

    if ($showPadDivId !== "") {
        $getTagListAPICall = $SHOWPAD_URL . 'api/v3/divisions/' . $showPadDivId . '/tags.json?fields=name%2Cid&limit=9999';
    }
    else {
        $getTagListAPICall = $SHOWPAD_URL . 'api/v3/tags.json?fields=name%2Cid&limit=9999';
    }
    
    $getTagListJSON = callAPI("GET", $getTagListAPICall, null, $headers);
    
    if ($use != "pub") {
        echo "<form method='post' action='./get_showpad_tags.php'>";
        echo "<select name='showpadTagList'>";
    }
    else {
        echo "<select multiple name='tagList' id='tagList' style='width:300px;margin-left:20px;' size='3'>";
    }
    

    for ($i = 0; $i < $getTagListJSON->response->count; $i++) {
        echo "<option value='" . $getTagListJSON->response->items[$i]->id . ",";
        echo $getTagListJSON->response->items[$i]->name . "'>";
        echo $getTagListJSON->response->items[$i]->name . "</option>";
        
    }
    
    echo "</select>";
    
    if ($use != "pub") {
        echo "<br /><br />";
        echo "<input type='hidden' name='tagsDiv' value='" . $showPadDivName . ":" . $showPadDivId . "' />";
        echo "<input type='hidden' name='submitted' value='1' />";
        echo "<input type='submit' value='Submit' />";
        echo "</form>";
    }
    
}
else {
    
    //Call into ShowPad to get the list of divisions
    $getDivisionListAPICall = $SHOWPAD_URL . 'api/v3/divisions.json?fields=id%2Cname&limit=9999';
    $getDivisionListJSON = callAPI("GET", $getDivisionListAPICall, null, $headers);

    echo "<form method='post' action='./get_showpad_tags.php'>";
    echo "Select Division: <select name='showpadDivList'>";
    
    if ($getDivisionListJSON->response->count > 0) {
        for ($i = 0; $i < $getDivisionListJSON->response->count; $i++) {
            if (strtolower($getAllDivisionsJSON->response->items[$i]->name) != "ccdam") {
                print "<option value='" . $getDivisionListJSON->response->items[$i]->name . "," . $getDivisionListJSON->response->items[$i]->id . "'>";
                print $getDivisionListJSON->response->items[$i]->name . "</option>";
            }
        }
    }
    echo "</select><br /><br />";
    echo "<input type='hidden' name='div_submitted' value='1' />";
    echo "<input type='submit' value='Submit' />";
    echo "</form>";
}


function CallAPI($method, $url, $data = false, $headers = "")
{
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
