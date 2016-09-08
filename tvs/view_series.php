<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

set_time_limit(0);

$sid = 0;
$gbEmail = "tvspublic@thevalueshift.com";
$gbFirstName = "Public View";

if ((isset($_GET["em"])) && (!empty($_GET["em"]))) {
   $gbEmail = $_GET["em"];
}
if ((isset($_GET["fn"])) && (!empty($_GET["fn"]))) {
   $gbFirstName = $_GET["fn"];
}

if ((isset($_GET["sid"])) && (!empty($_GET["sid"]))) {
   $sid = $_GET["sid"];
}

if ($sid === 0) { die();}
setcookie("series_id", $sid,time()+3600,"/");

$getSeries = "SELECT * FROM series WHERE Series_Id = '" . $sid . "'";
$seriesResult = db_query($getSeries);
foreach ($seriesResult as $seriesRecord) {
    $seriesJSON = $seriesRecord->Series_Workflow_JSON;
    $requireEnrollment = $seriesRecord->Series_Requires_Enrollment;
}

$seriesObject = json_decode($seriesJSON);
$delayBetweenContent = $seriesObject->timeBetweenNodes;

//Now, check for where the user is in terms of progressing through this content
$getSeriesProgress = "SELECT COUNT(*) FROM series_user_progress WHERE Series_Id = '" . $sid . "' AND User_Email_Addr = '" . $gbEmail . "'";

$stepNumber = 0;
$total = db_query($getSeriesProgress)->fetchField();

if ($total == 0) {
    if ($requireEnrollment == 0) {
        db_insert('series_user_progress')
          ->fields(array(
              'Series_Id' => $sid,
              'User_Email_Addr' => $gbEmail,
              'Series_Step_Number' => -1,
              'Content_Complete_Status' => 0,
              'Content_Has_Remediated' => 0
        ))->execute();
    } 
    else {
        echo "Pre-enrollment is required";
        die();
    }
}

$firstView = false;
setcookie("nb", "1",time()+60,"/");
//load the new $stepNumber and then do the update...
$getUserSeriesProgress = "SELECT * FROM series_user_progress WHERE Series_Id = '" . $sid . "' AND User_Email_Addr = '" . $gbEmail . "'";
$userSeriesResult = db_query($getUserSeriesProgress);
foreach ($userSeriesResult as $userSeriesRecord) {
    $contentAccessDate = $userSeriesRecord->Content_Access_Date;
    $contentCompletionStatus = $userSeriesRecord->Content_Complete_Status;
    $contentRemediated = $userSeriesRecord->Content_Has_Remediated;
    $stepNumber = $userSeriesRecord->Series_Step_Number;
    
    if ($stepNumber == -1) { $stepNumber = 0;$firstView = true;}

    $datetimeNow = new DateTime(date('Y-m-d H:i:s'));
    $datetimeLastView = new DateTime($contentAccessDate);
    $hoursSinceLastView = $datetimeNow->diff($datetimeLastView)->h;
    $timeBeforeNextView = $delayBetweenContent - $hoursSinceLastView;

    if ($hoursSinceLastView >= $delayBetweenContent) {
        $contentToView = $seriesObject->content[$stepNumber]->contentUrl;
        //Enough time has gone by, view the content
        if ($contentCompletionStatus == 1) {
            //Complete
            if ($stepNumber < (sizeof($seriesObject->content)-1)) {$stepNumber += 1;}
            $contentToView = $seriesObject->content[$stepNumber]->contentUrl;
            //Update the series and the audit trail
            if ($stepNumber == (sizeof($seriesObject->content)-1)) {
                update_series_usage ($sid,$gbEmail,$stepNumber,NULL,1,1);
            }
            else {
                update_series_usage ($sid,$gbEmail,$stepNumber);
            }

        }
        else {
            //Incomplete  Have we remediated?
            if ($contentRemediated == 1) {
                //We have remediated...
                if ($stepNumber < (sizeof($seriesObject->content)-1)) {$stepNumber += 1;}
                $contentToView = $seriesObject->content[$stepNumber]->contentUrl;
                //Update the series and the audit trail
                update_series_usage ($sid,$gbEmail,$stepNumber,NULL,1,1);
            }
            else {
                //We have not yet remediated
                if ($firstView == true) {
                    update_series_usage ($sid,$gbEmail,$stepNumber,NULL,0,0);
                }
                else {
                    if ($seriesObject->content[$stepNumber]->remediation !== null) {
                        $contentToView = $seriesObject->content[$stepNumber]->remediation->contentUrl;
                    }
                    update_series_usage ($sid,$gbEmail,$stepNumber,NULL,1,1);
                }
                
            }
        }
        
        $destUrl = $contentToView;
        $destUrl .= '?em=' . $gbEmail . '&fn=' . $gbFirstName . '&sid=' . $sid;
        header("Location: " . $destUrl );
        die();

        
    }
    else {
        update_series_usage ($sid,$user->uid,$stepNumber);
        echo "Please come back later, not enough time has passed. $timeBeforeNextView hours remaining.";
        die();
    }
}

function update_series_usage ($sid,$email,$stepNumber = 0,$viewKey = NULL,$isRemediating = 0,$completeStatus = 0) {
    db_update('series_user_progress')
          ->fields(array(
              'Series_Step_Number' => $stepNumber,
              'Content_Complete_Status' => $completeStatus,
              'Content_Has_Remediated' => $isRemediating))
            ->condition('Series_Id', $sid)
            ->condition('User_Email_Addr', $email)
        ->execute();
    
    db_insert('series_audit_trail')->fields(array(
            'Series_Id' => $sid,
            'User_Email_Addr' => $email,
            'Series_Step_Number' => $stepNumber,
            'View_Key' => $viewKey,
            'Is_Remediating' => $isRemediating
        ))->execute();
}

?>

