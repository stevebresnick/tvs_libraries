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
    $authorizationHeader = "Bearer " . $existingToken;
}

$headers = array( 
    "Authorization: " . $authorizationHeader,
); 

//Call into ShowPad to get the list of divisions
$getDivisionListAPICall = $SHOWPAD_URL . 'api/v3/divisions.json?fields=id%2Cname&limit=9999';
$getDivisionListJSON = callAPI("GET", $getDivisionListAPICall, null, $headers);

echo "<select name='showpadDivisionList' id='showpadDivisionList'>";

for ($i = 0; $i < $getDivisionListJSON->response->count; $i++) {
    echo "<option value='" . $getDivisionListJSON->response->items[$i]->id . "'>";
    echo $getDivisionListJSON->response->items[$i]->name . "</option>";

}
echo "</select><br /><br />";
echo "<input type='button' value='Submit' onclick='publish()' />";

echo "<script>function publish() { var divId = document.getElementById('showpadDivisionList').value; pushToShowPad(divId);}</script>";

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
