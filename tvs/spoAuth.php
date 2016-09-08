<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

set_time_limit(0);

$SHOWPAD_URL = db_query("SELECT value FROM tvs_config WHERE name = 'sp_url'")->fetchField();
$CLIENT_ID = db_query("SELECT value FROM tvs_config WHERE name = 'client_id'")->fetchField();
$CLIENT_SECRET = db_query("SELECT value FROM tvs_config WHERE name = 'client_secret'")->fetchField();
$SHOWPAD_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_name'")->fetchField();
$SHOWPAD_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_password'")->fetchField();
$SHOWPAD_DIVISION = db_query("SELECT value FROM tvs_config WHERE name = 'sp_division'")->fetchField();

$tempToken = $_GET["code"];

//Call the ShowPad API using a hard-coded username and password.
$postData = "grant_type=authorization_code";
$postData .= "&code=" . $tempToken;
$postData .= "&redirect_uri=https://" . $_SERVER['SERVER_NAME'] . "/sites/all/libraries/tvs/spoAuth.php";
$postData .= "&client_id=" . $CLIENT_ID;
$postData .= "&client_secret=" . $CLIENT_SECRET;
$loginAPICall = $SHOWPAD_URL . "api/v3/oauth2/token";

$loginJSON = callAPI("POST", $loginAPICall, $postData, "");

if (!isset($loginJSON->access_token) && (isset($loginJSON->error_description))) {
    echo "<html><body style='background:white;color:black;'><h1>Unable to sign-in to ShowPad</h1>It appears that oAuth is misconfigured.  ShowPad is returning the following error message:<br /><br /><em>" . $loginJSON->error_description . "</em></body></html>";
    die();
}

$accessToken = $loginJSON->access_token;
$authorizationHeader = "Bearer " . $accessToken;

$headers = array( 
    "Authorization: " . $authorizationHeader
); 

if ($accessToken == "") {return;}

$whoAmIAPICall = $SHOWPAD_URL . 'api/v3/users/me.json';
$whoAmIAPIJSON = callAPI("GET", $whoAmIAPICall, null, $headers);

$userToLogin = $whoAmIAPIJSON->response->email;
user_external_login_register($userToLogin, 'editing_authentication');

$myuser = user_load_by_name($userToLogin);
$role = user_role_load_by_name("Interactive Author");
user_multiple_role_edit(array($myuser->uid), 'add_role', $role->rid);
setcookie("nb", "1",time()+3600,"/");
setcookie("spah",$authorizationHeader,time()+3600,"/");
header("Location: /my-content?nb");
die();


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
        case "LINK":
            
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "LINK");
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
    curl_setopt($curl, CURLOPT_TIMEOUT, 6000);
    
    if ($headers <> "") {
        curl_setopt($curl, CURLOPT_HEADER, 1);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    }

    $results = curl_exec($curl);

    if(curl_errno($curl)){
        echo 'Curl error: ' . curl_error($curl) . "\n";
    }
    
    $jsonStartPoint = strpos($results,"{");
    $results = substr($results,$jsonStartPoint);
    $resultsJSON = json_decode($results);
        
    curl_close($curl);
    
    return $resultsJSON;
}

function CallMultiPartAPI($method, $url, $data = false, $file = "", $headers = "")
{
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_POST, 1);

    $tmpData = $data;
    $tmpData = (object) array_filter((array) $tmpData); // filter empty values
    $json = json_encode($tmpData); // generate JSON entity

    // generate data for posting
    $postData = array();
    $postData['jsonrequest'] = $json;

    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type' => 'multipart/form-data'));
    
    $postData['file'] = $file;

    curl_setopt($curl, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_VERBOSE, 1);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 0); 
    curl_setopt($curl, CURLOPT_TIMEOUT, 6000);
    
    if ($headers <> "") {
        curl_setopt($curl, CURLOPT_HEADER, 1);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    }

    $results = curl_exec($curl);

    if(curl_errno($curl)){
        echo 'Curl error: ' . curl_error($curl) . "\n";
    }
    
    $jsonStartPoint = strpos($results,"{");
    $results = substr($results,$jsonStartPoint);
    
    $resultsJSON = json_decode($results);
    curl_close($curl);

    return $resultsJSON;
}



?>
