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

$tvsUrl = str_replace("#","",$_POST['tvsUrl']);
echo "TVS URL is: " . $tvsUrl . "\n";
$tvsNode = $_POST['tvsNode'];
echo "TVS Node is: " . $tvsNode . "\n";
$tvsTitle = $_POST['tvsTitle'];
echo "TVS Title is : " . $tvsTitle . "\n";
$tvsDesc = $_POST['tvsDesc'];
echo "TVS Title is : " . $tvsTitle . "\n";
$zipFileName = str_replace(" ","_", strtolower($tvsTitle)) . ".zip";
$tvsTag = $_POST['tvsTag'];
echo "TVS Tag is : " . $tvsTag . "\n";
$selectedDivisionId = $_POST['divisionId'];
echo "Division Id is : " . $selectedDivisionId . "\n";

if (($tvsNode == "") || ($tvsTitle == "")) {
    echo "returning as no data returned" . "\n";
    return;
}

$node = node_load(NULL, $tvsNode, FALSE);
if ($node === null) {
    echo "Node not found, returning..." . "\n";
    return;
}

h5p_write_showpad_embed_file($node);

//Save this to a local file
$showpadRootStoragePath = '/opt/bitnami/apps/drupal/htdocs/sites/all/libraries/tvs/';
$showpadIndexFile = $showpadRootStoragePath . $tvsNode . '/index.html';
$showPadZipDir = $showpadRootStoragePath . $tvsNode;

echo "Root storage path is " . $showpadRootStoragePath . "\n";
echo "ShowPad Index File is " . $showpadIndexFile . "\n";

$allZipFiles = shell_exec("ls -S -m \"" . $showPadZipDir . "\" 2>&1");
$allZipFilesArr = explode(',', $allZipFiles);
for ($i = 0; $i < sizeof($allZipFilesArr); $i++) {
    if (endsWith($allZipFilesArr[$i],".zip")) {
        $showPadZipFile = $showPadZipDir . '/' . $allZipFilesArr[$i];
        break;
    }
}
echo "Here is the zip file to use " . $showPadZipFile . "\n";

if ($showPadZipFile == "") {
    echo "Returning as no zip file found\n";
    return;
}

$existingToken = "";
if (isset($_COOKIE["spah"])) {
    $existingToken = $_COOKIE["spah"];
}


//Call the ShowPad API using a hard-coded username and password.
$postData = "grant_type=password&username=" . $SHOWPAD_USER_NAME . "&password=" . $SHOWPAD_USER_PASSWORD;
$postData .= "&client_id=" . $CLIENT_ID;
$postData .= "&client_secret=" . $CLIENT_SECRET;
$loginAPICall = $SHOWPAD_URL . "api/v3/oauth2/token";

$loginJSON = callAPI("POST", $loginAPICall, $postData, "");

$accessToken = $loginJSON->access_token;
$adminAuthorizationHeader = "Bearer " . $accessToken;
$userAuthorizationHeader = $existingToken;


echo "User authorization header is " . $userAuthorizationHeader . "\n";
echo "Admin authorization header is " . $adminAuthorizationHeader . "\n";

if ($existingToken != "") {
    $headers = array( 
        "Authorization: " . $userAuthorizationHeader
    );
}
else {
    $headers = array( 
        "Authorization: " . $adminAuthorizationHeader
    );
}

$adminHeaders = array( 
    "Authorization: " . $adminAuthorizationHeader
);


//First, test if this content is already in showpad.  If it is then we update it.
$currentId = "";

if ($selectedDivisionId !== "") {
    $testContentAPICall = $SHOWPAD_URL . 'api/v3/divisions/' . $selectedDivisionId . '/assets.json?externalId=' . urlencode ($tvsUrl) . '&fields=id%2Cname%2Ctags%2CexternalId%2CarchivedAt';
}
else if ($SHOWPAD_DIVISION !== "") {
    $testContentAPICall = $SHOWPAD_URL . 'api/v3/divisions/' . $SHOWPAD_DIVISION . '/assets.json?externalId=' . urlencode ($tvsUrl) . '&fields=id%2Cname%2Ctags%2CexternalId%2CarchivedAt';
}
else {
    $testContentAPICall = $SHOWPAD_URL . 'api/v3/assets.json?externalId=' . urlencode ($tvsUrl) . '&fields=id%2Cname%2Ctags%2CexternalId%2CarchivedAt';
}

echo "Test Content API Call is " . $testContentAPICall;
$testContentJSON = callAPI("GET", $testContentAPICall, null, $headers);

$currentId = 0;
$foundContent = false;
for ($i=0;$i<$testContentJSON->response->count;$i++) {
    echo "Examining content with same external ID, archived at is " . $testContentJSON->response->items[$i]->archivedAt . "\n";
    echo "Value of archivedAt is " . $testContentJSON->response->items[$i]->archivedAt;
    if (($testContentJSON->response->items[$i]->archivedAt === null) || ($testContentJSON->response->items[$i]->archivedAt === "")) {
        $currentId = $testContentJSON->response->items[$i]->id;
        $foundContent = true;
        $currentName = $testContentJSON->response->items[$i]->name;
        break;
    }
}
echo "Current content id is " . $currentId . "\n";
if ($foundContent) {
    echo "Updating existing content id " . $currentId . "\n";
    $uploadAPICall = $SHOWPAD_URL . 'api/v3/assets/' . $currentId . '.json';
    $fileData = '@' . strtolower($showPadZipFile) . ';filename=' . $currentName;
    $uploadData = array('file' => $fileData, 'client_id' => $CLIENT_ID, 'client_secret' => $CLIENT_SECRET, 'id' => $currentId);
}
else {
    echo "Uploading new content\n";
    
        if ($selectedDivisionId !== "") {
            $uploadAPICall = $SHOWPAD_URL . 'api/v3/divisions/' . $selectedDivisionId . '/assets.json';
        }
        else if ($SHOWPAD_DIVISION !== "") {
            $uploadAPICall = $SHOWPAD_URL . 'api/v3/divisions/' . $SHOWPAD_DIVISION . '/assets.json';
        }
        else {
            $uploadAPICall = $SHOWPAD_URL . 'api/v3/assets.json';
        }


    $fileData = '@' . strtolower($showPadZipFile) . ';filename=' . $tvsTitle . ".zip";
    $uploadData = array('file' => $fileData, 'description' => $tvsDesc, 'client_id' => $CLIENT_ID, 'client_secret' => $CLIENT_SECRET, 'filename' => $tvsTitle, 'name' => $tvsTitle,'externalId' => $tvsUrl);
}

set_time_limit(600);
$uploadJSON = callAPI("POST", $uploadAPICall, $uploadData, $adminHeaders);

if (($tvsTag !== "") || ($selectedDivisionId === "mine")) {
    echo "Adding tags" . "\n";
    $currentId = 0;
    while ($currentId === 0) {
        sleep(5);

        //Now go find the uploaded content and add tags to it...
        $testContentAPICall = $SHOWPAD_URL . 'api/v3/divisions/' . $selectedDivisionId . '/assets.json?externalId=' . urlencode ($tvsUrl) . '&fields=id%2Cname%2Ctags%2CexternalId%2CarchivedAt';
        echo "Division Content API Call is " . $testContentAPICall;
        $testContentJSON = callAPI("GET", $testContentAPICall, null, $headers);


        for ($i=0;$i<$testContentJSON->response->count;$i++) {
            echo "Examining content with same external ID, archived at is " . $testContentJSON->response->items[$i]->archivedAt . "\n";
            echo "Value of archivedAt is " . $testContentJSON->response->items[$i]->archivedAt;
            if ($testContentJSON->response->items[$i]->archivedAt === null) {
                $currentId = $testContentJSON->response->items[$i]->id;
                $currentName = $testContentJSON->response->items[$i]->name;
                break;
            }
        }
    }

    echo "Current id is " . $currentId . "\n";
    
    if ($selectedDivisionId === "mine") {
        $myUploadsId = "";
        //This is an upload to my uploads
        $getMyChannelAPICall = $SHOWPAD_URL . 'api/v3/users/me/channels.json?fields=rootChannelNode%2CisPersonal&limit=unlimited&personalContentIncluded=true';
        $getMyChannelAPIJSON = callAPI("GET", $getMyChannelAPICall, null, $headers);
        for ($i=0;$i<$getMyChannelAPIJSON->response->count;$i++) {
            if ($getMyChannelAPIJSON->response->items[$i]->isPersonal == true) {
                echo "Linking content to My Uploads\n";
                $myUploadsId = $getMyChannelAPIJSON->response->items[$i]->rootChannelNode->id;
                
                $linkToMyUploadsAPICall = $SHOWPAD_URL . "api/v3/channelnodes/" . $myUploadsId . "/assets/" . $currentId . ".json";
                echo "linkToMyUploadsAPICall is " . $linkToMyUploadsAPICall . "\n";
                $linkToMyUploadsAPIJSON = callAPI("LINK", $linkToMyUploadsAPICall, null, $headers);
            }
        }
    }
    
    if ($tvsTag !== "") {
        $indTagIds = explode(",", $tvsTag);
        for ($i = 0; $i < sizeof($indTagIds); $i++) {
            $indTagId = $indTagIds[$i];
            $addTagToContentAPICall = $SHOWPAD_URL . 'api/v3/tags/' . $indTagId . '/assets/' . $currentId . '.json';
            echo "API call to add the tags is " . $addTagToContentAPICall . "\n";
            $addTagToContentAPIJSON = callAPI("LINK", $addTagToContentAPICall, null, $headers);
        }
    }
    
}

function CallAPI($method, $url, $data = false, $headers = "")
{
    $curl = curl_init();
    
    echo "URL is " . $url . "\n";
    echo "File data is " . $data['file'] . "\n";

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
    echo "Results are " . $results . "\n";

    if(curl_errno($curl)){
        echo 'Curl error: ' . curl_error($curl) . "\n";
    }
    else {
        echo "Results are: " . $results . "\n";
    }
    
    $jsonStartPoint = strpos($results,"{");
    $results = substr($results,$jsonStartPoint);
    echo "JSON only results are " . $results . "\n";
    
    $resultsJSON = json_decode($results);
    curl_close($curl);

    echo "Returning from callAPI\n";
    
    return $resultsJSON;
}

?>
