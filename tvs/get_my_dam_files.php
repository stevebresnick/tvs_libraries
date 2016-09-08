<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

set_time_limit(0);

$DAM_URL = db_query("SELECT value FROM tvs_config WHERE name = 'dam_url'")->fetchField();
$DAM_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_name'")->fetchField();
$DAM_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_password'")->fetchField();


//Call the DAM API using a hard-coded username and password.
$postData = "id=" . $DAM_USER_NAME . "&password=" . urlencode($DAM_USER_PASSWORD);
$getAPIKeyUrl = $DAM_URL . "mediadb/services/authentication/getkey";
$getAPIKeyJSON = callAPI("POST", $getAPIKeyUrl, $postData, "");

$emKey = $getAPIKeyJSON->results->entermediakey;

setcookie("entermedia.keymediadb=", $emKey);
$headers = array( 
    "cookie: " . "entermedia.keymediadb=" . $emKey
); 

//$termsData = array(array('field' => 'id','operator' => 'freeform','value' => 'UID'));
//$queryData = array('terms' => $termsData);
//$getDamData = array('page' => '1', 'hitsperpage' => '50', 'showfilters' => 'false', 'query' => $queryData);
$getDamUrl = $DAM_URL . "mediadb/services/module/asset/search";
$getDamData = "page=1&hitsperpage=50&showfilters=false";
$getDamJSON = callAPI('POST', $getDamUrl, $getDamData, $headers);

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

echo $results;
    
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
