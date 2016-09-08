<?php

define('DRUPAL_ROOT', "/home/bitnami/apps/drupal/htdocs/");
require '/home/bitnami/apps/drupal/htdocs/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

$userEmail = "";
if (isset($_GET['em'])) {
    $userEmail = $_GET['em'];
}
$userPassword = "";

set_time_limit(0);

if ($_POST['submitted'] == 1) {
    if ($userEmail == "") {$userEmail = $_POST['USER_EMAIL'];}
    $userPassword = $_POST['USER_PASSWORD'];

    $account = user_load_by_name($userEmail);
    
    if (!$account) {
    // Register this new user.
        $userinfo = array(
          'name' => $userEmail,
          'pass' => $userPassword,
          'init' => $userEmail,
          'mail' => $userEmail,
          'status' => 1,
          'timezone' => 'America/New_York'
        );
        $account = user_save(drupal_anonymous_user(), $userinfo);
        // Terminate if an error occurred during user_save().
        if (!$account) {
          drupal_set_message(t("Error saving user account."), 'error');
          return;
        }
        user_set_authmaps($account, array('authname_$module' => $userEmail));
        
        $newUser = user_load_by_name($userEmail);
        $role = user_role_load_by_name("Interactive Author");
        user_multiple_role_edit(array($newUser->uid), 'add_role', $role->rid);
    }
    else if ($userPassword != "") {
        $existingUser = user_load_by_name($userEmail);
        $userinfo = array(
          'name' => $userEmail,
          'pass' => $userPassword
        );
        user_save($existingUser,$userinfo);
    }

    echo "<script>setTimeout('top.window.location.href = \'/all-users\';',200);</script>";
}
else if (isset($_GET['toggle'])) {
    $existingUser = user_load_by_name($userEmail);
    if ($existingUser->status == 0) {
        $existingUser->status = 1;
    }
    else {
        $existingUser->status = 0;
    }
    user_save($existingUser);
    
    echo "<script>setTimeout('top.window.location.href = \'/all-users\';',200);</script>";
}
else {    
    
    ?>
    <script>
        function validateEmail(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        
        function submitUser() {
            var emailInForm = document.getElementById("USER_EMAIL").value;
            var passwordInForm = document.getElementById("USER_PASSWORD").value;
            var passwordConfirmInForm = document.getElementById("USER_PASSWORD_CONFIRM").value;
            
            if (emailInForm === "") {
                alert("Email address is required");
                return false;
            }
            if (!validateEmail(emailInForm)) {
                alert("Please provide a valid email address");
                return false;
            }
            if ((passwordInForm === "") || (passwordConfirmInForm === "")) {
                alert("Please specify a password");
                return false;
            }
            if (passwordInForm !== passwordConfirmInForm) {
                alert("Passwords do not match");
                return false;
            }
            return true;
        }
    </script>
    

    <?php
    
    
    echo "<form method='post' action='./create_user.php' onsubmit='return submitUser()' >";
    echo "<h3>User Email Address</h3>";
    
    if ($userEmail != "") {
        echo "<span>" . $userEmail . "</span>";
        echo "<input size='75' type='hidden' name='USER_EMAIL' id='USER_EMAIL' value='" . $userEmail . "'><br />";
    }
    else {
        echo "<input size='75' type='text' name='USER_EMAIL' id='USER_EMAIL'><br />";
    }
    
    echo "<h3>User Password</h3>";
    echo "<input size='75' type='password' name='USER_PASSWORD' id='USER_PASSWORD' value=''>";
    
    echo "<h3>Confirm User Password</h3>";
    echo "<input size='75' type='password' name='USER_PASSWORD_CONFIRM' id='USER_PASSWORD_CONFIRM' value=''>";


    echo "<input type='hidden' name='submitted' value='1' />";
    echo "<p>";
    echo "<input type='submit' class='actionButtons' value='Submit' />";
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
