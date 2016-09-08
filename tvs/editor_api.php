<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

set_time_limit(0);

//$DAM_URL = db_query("SELECT value FROM tvs_config WHERE name = 'dam_url'")->fetchField();
//$DAM_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_name'")->fetchField();
//$DAM_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_password'")->fetchField();

$userToLogin = $_GET["uqi"];
$secretKey = $_GET["spk"];
$contentType = $_GET["ctp"];
$nodeId = $_GET["oid"];
$mode = $_GET["mod"];
if ($userToLogin === "") { return;}
if ($secretKey !== "tvs") {return;}


user_external_login_register($userToLogin, 'editing_authentication');

if ($mode == "0") {
    $newUrl = "/node/$nodeId?co";
}
else if ($mode == "1") {
    $newUrl = "/node/$nodeId/edit?co";
}
else {
    $newUrl = "/node/add/h5p-content?lib=$contentType&co";
}



header("Location: $newUrl");
die();

//https://dev.apppublisher.biz/sites/all/libraries/tvs/editor_api.php?user=jmoore1


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
 echo $results;   
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
