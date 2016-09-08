<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
set_time_limit(0);

$DAM_URL = db_query("SELECT value FROM tvs_config WHERE name = 'dam_url'")->fetchField();
$DAM_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_name'")->fetchField();
$DAM_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'dam_user_password'")->fetchField();
$SHOWPAD_URL = db_query("SELECT value FROM tvs_config WHERE name = 'sp_url'")->fetchField();
$CLIENT_ID = db_query("SELECT value FROM tvs_config WHERE name = 'client_id'")->fetchField();
$CLIENT_SECRET = db_query("SELECT value FROM tvs_config WHERE name = 'client_secret'")->fetchField();
$SHOWPAD_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_name'")->fetchField();
$SHOWPAD_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_password'")->fetchField();
$SHOWPAD_DIVISION = db_query("SELECT value FROM tvs_config WHERE name = 'sp_division'")->fetchField();

if (($DAM_URL == "") || ($DAM_USER_NAME == "") || ($DAM_USER_PASSWORD == "")) {
    echo 0;
    die();
}

$trueNodeId = true;
if (isset($_POST['tvsNode'])) {
    $tvsNode = $_POST['tvsNode'];
}
if (($tvsNode == "0") || ($tvsNode == "")) { $tvsNode = rand();$trueNodeId = false;}
$imageFilePath = $_POST['filePath'];
$fileName = $tvsNode;

//Call the DAM API using a hard-coded username and password.
/*$postData = "id=" . $DAM_USER_NAME . "&password=" . urlencode($DAM_USER_PASSWORD);
$getAPIKeyUrl = $DAM_URL . "/mediadb/services/authentication/getkey";
$getAPIKeyJSON = callAPI("POST", $getAPIKeyUrl, $postData, "");

$emKey = $getAPIKeyJSON->results->entermediakey;

setcookie("entermedia.keymediadb=", $emKey);

$headers = array( 
    "cookie: " . "entermedia.keymediadb=" . $emKey
);*/

if ($trueNodeId == false) {
    $imageFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/' . $imageFilePath;
}
else {
    $imageFilePath = '/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/' . $tvsNode . "/" . $imageFilePath;
}

/*$fileData = '@' . strtolower($imageFilePath);
$creatorInfo = array('id' => 'admin', 'firstname' => 'API', 'lastname' => "User");
$categoryInfo = array('id' => 'Index');
$uploadData = array('id' => $tvsNode, 'assettype' => 'image', 'creator' => $creatorInfo, 'category' => $categoryInfo, 'keywords' => array("UID:" . $user->uid,"UNM:" . $user->name,"UML:" . $user->mail), 'editstatus' => 6);

$uploadUrl = $DAM_URL . "/mediadb/services/module/asset/create";

$uploadJSON = CallMultiPartAPI("POST", $uploadUrl, $uploadData, $fileData, $headers);

$filesProcessed = false;

while ($filesProcessed === false) {
    sleep(5);
    set_time_limit(0);

    $getFinishedAssets = "assetid=" . $tvsNode;
    $getFinishedAssetsUrl = $DAM_URL . "/mediadb/services/module/asset/media/listconversions";

    //We keep checking for the finished assets.  Once ready, pull them down
    $getFinishedAssetsJSON = callAPI("POST", $getFinishedAssetsUrl, $getFinishedAssets, $headers);

    for ($i=0;$i<count($getFinishedAssetsJSON->results);$i++) {
        if ($getFinishedAssetsJSON->results[$i]->iscomplete == true) {
            if (strtolower($getFinishedAssetsJSON->results[$i]->name) === "image large") {
                //The DAM returns the URL with a beginning slash, remove it.
                $downloadImageUrl = $DAM_URL . "/" . substr($getFinishedAssetsJSON->results[$i]->url,1);
                while ((fopen($downloadImageUrl,'rb') === FALSE) || (filesize($downloadImageUrl) === 0)) {
                    sleep(5);
                    set_time_limit(0);
                }
                
                file_put_contents($imageFilePath, fopen($downloadImageUrl,'rb'));
                chmod($imageFilePath,777);
            }
                
            $filesProcessed = true;
        }
    }
}*/

$primaryApp = strtolower(db_query("SELECT value FROM tvs_config WHERE name = 'primary_app'")->fetchField());
if ($primaryApp == "showpad") {
    //Find the DAM division (ccdam)
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

    $getAllDivisionsCall = $SHOWPAD_URL . 'api/v3/divisions.json?fields=name%2Cid&limit=9999';

    $getAllDivisionsJSON = callAPI("GET", $getAllDivisionsCall, null, $headers);
    $damDivisionId = "";

    for ($i = 0; $i < $getAllDivisionsJSON->response->count; $i++) {
        if (strtolower($getAllDivisionsJSON->response->items[$i]->name) == "ccdam") {
            $damDivisionId = $getAllDivisionsJSON->response->items[$i]->id;
            break;
        }
    }

    if ($damDivisionId == "") {
        die();
    }

    $uploadAPICall = $SHOWPAD_URL . 'api/v3/divisions/' . $damDivisionId . '/assets.json';

    $fileData = '@' . strtolower($imageFilePath);
    $uploadData = array('file' => $fileData, 'client_id' => $CLIENT_ID, 'client_secret' => $CLIENT_SECRET);
    $uploadJSON = callAPI("POST", $uploadAPICall, $uploadData, $headers);
}

echo $tvsNode;

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
    
    echo $results;
    
    $resultsJSON = json_decode($results);
    curl_close($curl);

    return $resultsJSON;
}


?>
