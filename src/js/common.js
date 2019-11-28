function postRequest(url, jsonData, successCallback, errorCallback) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // success
            successCallback(this.responseText);
        } else {
            // some error
            errorCallback(this);
        }
    };
    xhttp.open("POST", url, true);
    http.setRequestHeader('Content-type', 'application/json');
    xhttp.send(JSON.stringify(jsonData));
}