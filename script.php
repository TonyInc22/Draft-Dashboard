<?php
	//https://stackoverflow.com/questions/3062324/what-is-curl-in-php
	$URL = $_GET['url'];
	$cSession = curl_init(); 
	// Step 2
	curl_setopt($cSession,CURLOPT_URL,$URL);
	curl_setopt($cSession,CURLOPT_RETURNTRANSFER,true);
	curl_setopt($cSession,CURLOPT_HEADER, false); 
	// Step 3
	$result=curl_exec($cSession);
	// Step 4
	curl_close($cSession);
	// Step 5
	echo $result;
?>