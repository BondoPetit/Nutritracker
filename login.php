<?php
    $name = $_POST['name'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    //database connection
    $conn = new mysqli('localhost', 'root', 'Bondo0000', 'Nutritracker');
    if($conn->connect_error){
        die('Connection Failed : '.$conn->connect_error);
    }else{
        $stmt = $conn->prepare("insert into registration(name, email, password)
            values(?, ?, ?)")
        $stmt->bind_param("sss",$name, $email, $password);
        $stmt->execute();
        echo "registration Sucessfully...";
        $stmt->close();
        $stmt->close();
    }
?>
