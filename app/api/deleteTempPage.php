<?php
    // $_POST = json_decode(file_get_contents("php://input"), true);
    $file = "../../TeMpPaGe3242.html";

    if (file_exists($file)) {
        unlink($file);
    } else {
        header("HTTP/1.0 400 Bad Request");
    }