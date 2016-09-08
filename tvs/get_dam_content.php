<script src="//code.jquery.com/jquery-latest.min.js"></script>
<script>
    function insertIntoContent(id) {
        var downloadFromShowPad = "/sites/all/libraries/tvs/get_dam_content.php?id=";
        downloadFromShowPad += id + "&pull=1&nid=<?php print $_GET["nid"]; ?>";
        
        window.location.href = downloadFromShowPad;
    }
</script>


<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

$nodeId = $_GET["nid"];

$SHOWPAD_URL = db_query("SELECT value FROM tvs_config WHERE name = 'sp_url'")->fetchField();
$CLIENT_ID = db_query("SELECT value FROM tvs_config WHERE name = 'client_id'")->fetchField();
$CLIENT_SECRET = db_query("SELECT value FROM tvs_config WHERE name = 'client_secret'")->fetchField();
$SHOWPAD_USER_NAME = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_name'")->fetchField();
$SHOWPAD_USER_PASSWORD = db_query("SELECT value FROM tvs_config WHERE name = 'sp_user_password'")->fetchField();


//Call the ShowPad API using a hard-coded username and password.
$postData = "grant_type=password&username=" . $SHOWPAD_USER_NAME . "&password=" . $SHOWPAD_USER_PASSWORD;
$postData .= "&client_id=" . $CLIENT_ID;
$postData .= "&client_secret=" . $CLIENT_SECRET;
$loginAPICall = $SHOWPAD_URL . "api/v3/oauth2/token?cb=";
$loginAPICall .= generateRandomString(10);

$loginJSON = callAPI("POST", $loginAPICall, $postData, "");

$accessToken = $loginJSON->access_token;
$authorizationHeader = "Bearer " . $accessToken;

$headers = array( 
    "Authorization: " . $authorizationHeader,
); 

//Call into ShowPad to get the list of tags
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
    echo "You must setup the required division to use this feature.";
    die();
}

if ((isset($_GET['pull'])) && ($_GET['pull'] == 1)) {
    $contentId = $_GET['id'];
        
    $getDAMAssetCall = $SHOWPAD_URL . 'api/v3/assets/' . $contentId . '.json?fields=shortLivedDownloadLink%2Cextension';
    $getDAMAssetJSON = callAPI("GET", $getDAMAssetCall, null, $headers);
    
    $shortLivedLink = $getDAMAssetJSON->response->shortLivedDownloadLink;
    $extension = $getDAMAssetJSON->response->extension;
    
    if (($extension == "png") || ($extension == "jpg")) {
        $downloadImage = "images/image-" . uniqid() . "." . $extension;
    }
    else if ($extension == "mp4") {
        $downloadImage = "videos/files-" . uniqid() . "." . $extension;
    }
    else if ($extension == "mp3") {
        $downloadImage = "audios/files-" . uniqid() . "." . $extension;
    }
    
    $downloadFile = "/home/bitnami/apps/drupal/htdocs/sites/default/files/h5peditor/" . $downloadImage;
    if ($nodeId > 0) {
        $downloadFile = "/home/bitnami/apps/drupal/htdocs/sites/default/files/h5p/content/" . $nodeId . "/" . $downloadImage;
    }

    file_put_contents($downloadFile, fopen($shortLivedLink, 'rb'));
    chmod($downloadFile,777);
    
    //START JFM
    //Something like this to get size, pass to the addDAMFile function
    $width = 0;
    $height = 0;
    if (($extension == "png") || ($extension == "jpg")) {
        $newDownloadImage = array_values(getimagesize($downloadFile));
        list($width, $height, $type, $attr) = $newDownloadImage;
    }
    //END JFM
    
    
    echo "<script>parent.thisfileObject.addDAMFile('";
    echo $downloadImage . "','" . $extension . "','" . $width . "','" . $height . "');parent.document.getElementById('approvedContent').style.display='none';</script>";
}
else {
    $getDAMContentCall = $SHOWPAD_URL . 'api/v3/divisions/' . $damDivisionId;
    $getDAMContentCall .= '/assets.json?fields=id%2Cname%2Ctags%2CexternalId%2CarchivedAt%2CdownloadLink%2Chref%2CfileType%2Cdescription%2C thumbnailDownloadLink%2Cextension&limit=9999&cb=';
    $getDAMContentCall .= generateRandomString(10);
    $getDAMContentJSON = callAPI("GET", $getDAMContentCall, null, $headers);

    $iProcessed = 0;
    for ($i = 0; $i < $getDAMContentJSON->response->count; $i++) {
        $assetType = $_GET["typ"];
        $process = false;

        if (($assetType === "img") && (($getDAMContentJSON->response->items[$i]->extension == "png") || ($getDAMContentJSON->response->items[$i]->extension == "jpg"))) {
            $process = true;
        }
        else if (($assetType === "vid") && (($getDAMContentJSON->response->items[$i]->extension == "mp4"))) {
            $process = true;
        }
        else if (($assetType === "aud") && (($getDAMContentJSON->response->items[$i]->extension == "mp3"))) {
            $process = true;
        }
        if (($getDAMContentJSON->response->items[$i]->archivedAt == null) && $process) {
            if (($iProcessed !== 0) && (($iProcessed % 5) === 0)) {
                echo "<br />";
            }

            echo '<a href="#" onclick="insertIntoContent(\'' . $getDAMContentJSON->response->items[$i]->id . '\');">';
            if ($assetType !== "aud") {
                echo '<img src="' . $getDAMContentJSON->response->items[$i]->thumbnailDownloadLink . "?" . generateRandomString(10);
                echo '" style="width:120px" title="';
                if ($getDAMContentJSON->response->items[$i]->description == "") {
                    echo $getDAMContentJSON->response->items[$i]->name;
                }
                else {
                    echo $getDAMContentJSON->response->items[$i]->description;
                }

                echo '" />';
            }
            else {
                echo $getDAMContentJSON->response->items[$i]->name;
                if ($getDAMContentJSON->response->items[$i]->description != "") {
                    echo " : " . $getDAMContentJSON->response->items[$i]->description;
                }
            }
            

            echo "</a>";
            if ($assetType === "aud") {
                echo "<br />";
            }
            $iProcessed++;
        }
    }
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

function loadImage($url, $data = false, $headers = "")
{
    $curl = curl_init();

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_VERBOSE, 1);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 0); 
    curl_setopt($curl, CURLOPT_TIMEOUT, 600);
    
    if ($headers <> "") {
        curl_setopt($curl, CURLOPT_HEADER, 1);
        array_push($headers, "Content-Type:image/png");
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    }

    $results = curl_exec($curl);
    
    curl_close($curl);
    
    return $results;
}

?>