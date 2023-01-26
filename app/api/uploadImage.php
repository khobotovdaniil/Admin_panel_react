<?php
    if (file_exists($_FILES["image"]["tmp_name"]) && is_uploaded_file($_FILES["image"]["tmp_name"])) {     
        $fileExt = explode("/", $_FILES["image"]["type"])[1];
        $fileName = uniqid() . '.' . $fileExt;

        if (!is_dir("../../img_uploaded/")) {
            mkdir("../../img_uploaded/");
        }

        move_uploaded_file($_FILES["image"]["tmp_name"], "../../img_uploaded/" . $fileName);
        echo json_encode( array("src" => $fileName) );
    }